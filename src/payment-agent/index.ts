import type { LAEL } from "../core/index.js";
import { getChainConfig } from "../chains/index.js";
import type { ChainType } from "../chains/types.js";
import type { SettlementAsset, SettlementExecutionMode, SettlementRail, WalletAuthorizationStatus } from "../settlement/types.js";
import { newId, nowIso, parseJson, stableJson } from "../utils.js";

const PAYMENT_AGENT_EXTERNAL_ID_PREFIX = "luffa-fabric-payment-agent:v0.2";
const PAYMENT_ACTION = "luffa.create_task";
const DEFAULT_CHAIN = "BASE_SEPOLIA";
const DEFAULT_ASSET = "USDC";
const DUMMY_USDC_BASE_SEPOLIA = "0x0000000000000000000000000000000000000003";
const DUPLICATE_TRANSFER_BLOCK_WINDOW_MS = 60 * 60 * 1000;

export type PaymentBusinessAction = "transfer" | "task_reward";

export interface PaymentAgentRecipient {
  name: string;
  address: string;
}

export interface PaymentAgentPolicyInput {
  maxAmount: number;
  maxDailyAmount?: number;
  allowedRecipientNames: string[];
  allowedChain?: string;
  allowedAssets?: string[];
  requiresHumanConfirmation?: boolean;
}

export interface CreatePaymentProposalInput {
  ownerRef: string;
  walletAddress: string;
  rawInput: string;
  businessAction?: PaymentBusinessAction;
  defaultAsset?: string;
  recipients: PaymentAgentRecipient[];
  policy: PaymentAgentPolicyInput;
}

export interface ExecutePaymentProposalInput {
  humanConfirmed: boolean;
  txHash?: string;
  signedTransaction?: string;
  walletType?: string;
  walletAddress?: string;
  appAuthorizationStatus?: WalletAuthorizationStatus;
  executionMode?: SettlementExecutionMode;
}

export interface SubmitPaymentFeedbackInput {
  score: number;
  taskCompletedCorrectly: boolean;
  comment?: string;
  rememberPreferences?: boolean;
  allowTrainingExport?: boolean;
}

export interface TransferIntent {
  amount: number;
  asset: string;
  recipientName: string;
  recipientAddress: string;
  chainKey: string;
}

export interface PaymentPermissionDecision {
  status: "allow_pending_human_confirmation" | "blocked";
  requiresHumanConfirmation: boolean;
  reason: string;
}

export interface LearningStatus {
  status?: "pending_feedback" | "updated" | "blocked";
  riskRecord?: {
    type: string;
    learnedFromFailure: boolean;
  };
}

export interface PaymentProposal {
  proposalId: string;
  agentId: string;
  ownerRef: string;
  walletAddress: string;
  rawInput: string;
  businessAction: PaymentBusinessAction;
  parsedIntent: TransferIntent;
  permissionDecision: PaymentPermissionDecision;
  learningContext: {
    usedMemory: boolean;
    memoryKeys: string[];
  };
  learningStatus?: LearningStatus;
  createdAt: string;
}

export interface PaymentExecutionReceipt {
  rawInput: string;
  businessAction: PaymentBusinessAction;
  parsedIntent: TransferIntent;
  permissionDecision: PaymentPermissionDecision;
  walletTx: {
    chainKey: string;
    chainType?: ChainType;
    walletType?: string;
    txHash?: string;
    signature?: string;
    executionMode?: SettlementExecutionMode;
    appAuthorizationStatus?: WalletAuthorizationStatus;
    walletAddress: string;
  };
  settlementResult: {
    status: string;
    settlementId?: string;
  };
  feedback?: Record<string, unknown>;
  learningStatus: LearningStatus;
}

export interface PaymentLearningUpdate {
  agentScoreBefore: number;
  agentScoreAfter: number;
  userPreferences: {
    preferredRecipientName?: string;
    preferredRecipientAddress?: string;
    preferredAmount?: number;
    preferredAsset?: string;
    preferredChainKey?: string;
  };
  policySuggestion: {
    type: "keep_human_confirmation";
    status: "suggested";
    reason: string;
  };
  trainingExample?: {
    rawInput: string;
    exportAllowed: boolean;
  };
}

interface StoredProposalRow {
  proposal_json: string;
  execution_id: string | null;
}

interface MemoryRow {
  owner_ref: string;
  preferred_recipient_name: string | null;
  preferred_recipient_address: string | null;
  preferred_amount: number | null;
  preferred_asset: string | null;
  preferred_chain_key: string | null;
  agent_score: number;
  feedback_count: number;
  policy_suggestions: string;
  training_examples: string;
  updated_at: string;
}

export class PaymentAgentMvpService {
  constructor(private readonly lael: LAEL) {
    this.ensureTables();
  }

  async createProposal(input: CreatePaymentProposalInput): Promise<PaymentProposal> {
    const agentId = await this.ensurePaymentAgent(input.ownerRef);
    const memory = this.getMemory(input.ownerRef);
    const parsed = parseTransferIntent(input, memory);
    const dailyLimitReason = this.findDailyLimitReason(input.ownerRef, parsed.intent, input.policy);
    const duplicateReason = this.findDuplicateReason(input.ownerRef, parsed.intent, input.rawInput);
    const permissionDecision = dailyLimitReason || duplicateReason
      ? {
          status: "blocked" as const,
          requiresHumanConfirmation: false,
          reason: dailyLimitReason ?? duplicateReason ?? "Blocked",
        }
      : evaluateProposal(input, parsed.intent);
    const learningStatus = buildBlockedLearningStatus(permissionDecision.reason);
    const proposal: PaymentProposal = {
      proposalId: newId("proposal"),
      agentId,
      ownerRef: input.ownerRef,
      walletAddress: input.walletAddress,
      rawInput: input.rawInput,
      businessAction: inferBusinessAction(input),
      parsedIntent: parsed.intent,
      permissionDecision,
      learningContext: {
        usedMemory: parsed.memoryKeys.length > 0,
        memoryKeys: parsed.memoryKeys,
      },
      learningStatus,
      createdAt: nowIso(),
    };

    this.lael.db.db
      .prepare(
        `
          INSERT INTO payment_agent_proposals (
            proposal_id, owner_ref, agent_id, raw_input, proposal_json, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        proposal.proposalId,
        proposal.ownerRef,
        proposal.agentId,
        proposal.rawInput,
        stableJson(proposal),
        proposal.createdAt,
      );

    return proposal;
  }

  async executeProposal(
    proposalId: string,
    input: ExecutePaymentProposalInput,
  ): Promise<{ executionId: string; receipt: PaymentExecutionReceipt }> {
    const proposal = this.requireProposal(proposalId);
    if (proposal.permissionDecision.status !== "allow_pending_human_confirmation") {
      throw new Error("Proposal is blocked");
    }
    if (!input.humanConfirmed) {
      throw new Error("Human confirmation is required");
    }
    const chain = getChainConfig(proposal.parsedIntent.chainKey);
    const txHash = input.txHash?.trim();
    if (chain?.chainType === "endless" && !txHash) {
      throw new Error("Endless value execution requires a real txHash from Endless Web Wallet or Luffa App");
    }
    if (chain && !chain.testnet && (!txHash || txHash.startsWith("mock_"))) {
      throw new Error("Mainnet value execution requires a real txHash");
    }
    const existingReceipt = this.getProposalReceipt(proposal.proposalId);
    if (existingReceipt && txHash && isCompletedReceiptForTxHash(existingReceipt, txHash)) {
      return { executionId: this.requireProposalExecutionId(proposal.proposalId), receipt: existingReceipt };
    }
    const retryAfterExecutionId =
      existingReceipt && txHash && !isCompletedReceiptForTxHash(existingReceipt, txHash)
        ? this.requireProposalExecutionId(proposal.proposalId)
        : undefined;
    const executionWalletAddress = input.walletAddress ?? proposal.walletAddress;

    await this.lael.createPolicy({
      ownerRef: proposal.ownerRef,
      priority: 1000,
      jsonRules: {
        allowedActions: [PAYMENT_ACTION],
        maxBudgetPerAction: proposal.parsedIntent.amount,
        allowedAssets: [proposal.parsedIntent.asset],
        allowedChains: [proposal.parsedIntent.chainKey],
        contextConstraints: [{ proposalId: proposal.proposalId }],
      },
    });

    const token = await this.lael.issueCapabilityToken({
      granteeDid: proposal.agentId,
      scope: [PAYMENT_ACTION],
      constraints: {
        maxAmount: proposal.parsedIntent.amount,
        allowedAssets: [proposal.parsedIntent.asset],
        allowedChains: [proposal.parsedIntent.chainKey],
      },
    });

    const result = await this.lael.invoke({
      agentId: proposal.agentId,
      action: PAYMENT_ACTION,
      params: {
        communityId: "luffa-fabric-external-mvp",
        title: paymentActionTitle(proposal),
        settlement: {
          payerDid: proposal.ownerRef,
          payeeDid: `did:luffa:recipient:${proposal.parsedIntent.recipientName}`,
          amount: proposal.parsedIntent.amount,
          asset: proposal.parsedIntent.asset,
          rail: railForIntent(proposal.parsedIntent),
          chainKey: proposal.parsedIntent.chainKey,
          walletAddress: executionWalletAddress,
          toAddress: proposal.parsedIntent.recipientAddress,
          tokenAddress:
            proposal.parsedIntent.asset === "USDC" ? DUMMY_USDC_BASE_SEPOLIA : undefined,
          txHash: input.txHash,
          signedTransaction: input.signedTransaction,
          appAuthorizationStatus: input.appAuthorizationStatus,
          executionMode: input.executionMode,
        },
      },
      rawInput: proposal.rawInput,
      idempotencyKey: paymentExecutionIdempotencyKey(proposal.proposalId, {
        txHash,
        executionMode: input.executionMode,
        appAuthorizationStatus: input.appAuthorizationStatus,
        retryAfterExecutionId,
      }),
      capabilityTokenId: token.tokenId,
      context: {
        proposalId: proposal.proposalId,
        budget: proposal.parsedIntent.amount,
        humanConfirmed: true,
        requiresConfirmation: false,
      },
    });

    const receipt: PaymentExecutionReceipt = {
      rawInput: proposal.rawInput,
      businessAction: proposal.businessAction,
      parsedIntent: proposal.parsedIntent,
      permissionDecision: proposal.permissionDecision,
      walletTx: {
        chainKey: proposal.parsedIntent.chainKey,
        chainType: getChainConfig(proposal.parsedIntent.chainKey)?.chainType,
        walletType: input.walletType,
        txHash: result.txHash,
        signature: input.signedTransaction,
        executionMode: input.executionMode,
        appAuthorizationStatus: input.appAuthorizationStatus,
        walletAddress: executionWalletAddress,
      },
      settlementResult: {
        status: deriveSettlementStatus(result, input.appAuthorizationStatus),
        settlementId: result.settlementId,
      },
      learningStatus: { status: "pending_feedback" },
    };

    this.lael.db.db
      .prepare(
        `
          UPDATE payment_agent_proposals
          SET execution_id = ?, receipt_json = ?
          WHERE proposal_id = ?
        `,
      )
      .run(result.executionId, stableJson(receipt), proposal.proposalId);

    return { executionId: result.executionId, receipt };
  }

  submitFeedback(
    executionId: string,
    input: SubmitPaymentFeedbackInput,
  ): { receipt: PaymentExecutionReceipt; learningUpdate: PaymentLearningUpdate } {
    const proposal = this.requireProposalByExecution(executionId);
    const memoryBefore = this.getMemory(proposal.ownerRef);
    const reputation = this.lael.submitFeedback(executionId, input.score, input.comment);
    const policySuggestion = {
      type: "keep_human_confirmation" as const,
      status: "suggested" as const,
      reason: "Learning can improve intent parsing but must not remove wallet confirmation.",
    };
    const existingSuggestions = parseJson<PaymentLearningUpdate["policySuggestion"][]>(
      memoryBefore.policy_suggestions,
      [],
    );
    const existingTraining = parseJson<Array<{ rawInput: string; exportAllowed: boolean }>>(
      memoryBefore.training_examples,
      [],
    );
    const userPreferences =
      input.rememberPreferences === true
        ? {
            preferredRecipientName: proposal.parsedIntent.recipientName,
            preferredRecipientAddress: proposal.parsedIntent.recipientAddress,
            preferredAmount: proposal.parsedIntent.amount,
            preferredAsset: proposal.parsedIntent.asset,
            preferredChainKey: proposal.parsedIntent.chainKey,
          }
        : {
            preferredRecipientName: memoryBefore.preferred_recipient_name ?? undefined,
            preferredRecipientAddress: memoryBefore.preferred_recipient_address ?? undefined,
            preferredAmount: memoryBefore.preferred_amount ?? undefined,
            preferredAsset: memoryBefore.preferred_asset ?? undefined,
            preferredChainKey: memoryBefore.preferred_chain_key ?? undefined,
          };
    const trainingExample =
      input.allowTrainingExport === true
        ? { rawInput: proposal.rawInput, exportAllowed: true }
        : undefined;
    const trainingExamples = trainingExample
      ? [...existingTraining, trainingExample]
      : existingTraining;

    this.lael.db.db
      .prepare(
        `
          INSERT INTO payment_agent_memory (
            owner_ref, preferred_recipient_name, preferred_recipient_address,
            preferred_amount, preferred_asset, preferred_chain_key, agent_score,
            feedback_count, policy_suggestions, training_examples, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(owner_ref) DO UPDATE SET
            preferred_recipient_name = excluded.preferred_recipient_name,
            preferred_recipient_address = excluded.preferred_recipient_address,
            preferred_amount = excluded.preferred_amount,
            preferred_asset = excluded.preferred_asset,
            preferred_chain_key = excluded.preferred_chain_key,
            agent_score = excluded.agent_score,
            feedback_count = excluded.feedback_count,
            policy_suggestions = excluded.policy_suggestions,
            training_examples = excluded.training_examples,
            updated_at = excluded.updated_at
        `,
      )
      .run(
        proposal.ownerRef,
        userPreferences.preferredRecipientName ?? null,
        userPreferences.preferredRecipientAddress ?? null,
        userPreferences.preferredAmount ?? null,
        userPreferences.preferredAsset ?? null,
        userPreferences.preferredChainKey ?? null,
        reputation.score,
        reputation.feedbackCount,
        stableJson([...existingSuggestions, policySuggestion]),
        stableJson(trainingExamples),
        nowIso(),
      );

    const learningUpdate: PaymentLearningUpdate = {
      agentScoreBefore: memoryBefore.agent_score,
      agentScoreAfter: reputation.score,
      userPreferences,
      policySuggestion,
      trainingExample,
    };
    const receipt: PaymentExecutionReceipt = {
      rawInput: proposal.rawInput,
      businessAction: proposal.businessAction,
      parsedIntent: proposal.parsedIntent,
      permissionDecision: proposal.permissionDecision,
      walletTx: {
        chainKey: proposal.parsedIntent.chainKey,
        chainType: getChainConfig(proposal.parsedIntent.chainKey)?.chainType,
        txHash: this.lael.getExecutionRecord(executionId)?.txHash,
        walletAddress: proposal.walletAddress,
      },
      settlementResult: {
        status: String(this.lael.getExecutionRecord(executionId)?.status ?? "unknown").toLowerCase(),
        settlementId: this.lael.getExecutionRecord(executionId)?.settlementId,
      },
      feedback: {
        score: input.score,
        taskCompletedCorrectly: input.taskCompletedCorrectly,
        comment: input.comment,
      },
      learningStatus: { status: "updated" },
    };

    return { receipt, learningUpdate };
  }

  getVisibleMemory(ownerRef: string): {
    ownerRef: string;
    userPreferences: PaymentLearningUpdate["userPreferences"];
    agentScore: number;
    feedbackCount: number;
    policySuggestions: PaymentLearningUpdate["policySuggestion"][];
    trainingExamples: Array<{ rawInput: string; exportAllowed: boolean }>;
  } {
    const memory = this.getMemory(ownerRef);
    return {
      ownerRef,
      userPreferences: {
        preferredRecipientName: memory.preferred_recipient_name ?? undefined,
        preferredRecipientAddress: memory.preferred_recipient_address ?? undefined,
        preferredAmount: memory.preferred_amount ?? undefined,
        preferredAsset: memory.preferred_asset ?? undefined,
        preferredChainKey: memory.preferred_chain_key ?? undefined,
      },
      agentScore: memory.agent_score,
      feedbackCount: memory.feedback_count,
      policySuggestions: parseJson<PaymentLearningUpdate["policySuggestion"][]>(
        memory.policy_suggestions,
        [],
      ),
      trainingExamples: parseJson<Array<{ rawInput: string; exportAllowed: boolean }>>(
        memory.training_examples,
        [],
      ),
    };
  }

  private ensureTables(): void {
    this.lael.db.db.exec(`
      CREATE TABLE IF NOT EXISTS payment_agent_proposals (
        proposal_id TEXT PRIMARY KEY,
        owner_ref TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        raw_input TEXT NOT NULL,
        proposal_json TEXT NOT NULL,
        execution_id TEXT,
        receipt_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_payment_agent_proposals_execution
        ON payment_agent_proposals(execution_id);

      CREATE TABLE IF NOT EXISTS payment_agent_memory (
        owner_ref TEXT PRIMARY KEY,
        preferred_recipient_name TEXT,
        preferred_recipient_address TEXT,
        preferred_amount REAL,
        preferred_asset TEXT,
        preferred_chain_key TEXT,
        agent_score REAL DEFAULT 0.5,
        feedback_count INTEGER DEFAULT 0,
        policy_suggestions TEXT NOT NULL DEFAULT '[]',
        training_examples TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );
    `);
  }

  private async ensurePaymentAgent(ownerRef: string): Promise<string> {
    const externalId = `${PAYMENT_AGENT_EXTERNAL_ID_PREFIX}:${ownerRef}`;
    const existing = this.lael.db.db
      .prepare("SELECT internal_id FROM agents WHERE external_id = ?")
      .get(externalId) as { internal_id: string } | undefined;
    if (existing) {
      return existing.internal_id;
    }

    const agent = await this.lael.registerAgent({
      identityType: "API_KEY",
      externalId,
      ownerRef,
      capabilities: [PAYMENT_ACTION],
      metadata: {
        displayName: "LuffaFabric Payment Agent",
        mvp: "external-v0.2",
      },
    });
    return agent.internalId;
  }

  private requireProposal(proposalId: string): PaymentProposal {
    const row = this.lael.db.db
      .prepare("SELECT proposal_json, execution_id FROM payment_agent_proposals WHERE proposal_id = ?")
      .get(proposalId) as StoredProposalRow | undefined;
    if (!row) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }
    return normalizeProposal(parseJson<PaymentProposal>(row.proposal_json, {} as PaymentProposal));
  }

  private getProposalReceipt(proposalId: string): PaymentExecutionReceipt | undefined {
    const row = this.lael.db.db
      .prepare("SELECT receipt_json FROM payment_agent_proposals WHERE proposal_id = ?")
      .get(proposalId) as { receipt_json?: string | null } | undefined;
    return row?.receipt_json
      ? parseJson<PaymentExecutionReceipt | undefined>(row.receipt_json, undefined)
      : undefined;
  }

  private requireProposalExecutionId(proposalId: string): string {
    const row = this.lael.db.db
      .prepare("SELECT execution_id FROM payment_agent_proposals WHERE proposal_id = ?")
      .get(proposalId) as { execution_id?: string | null } | undefined;
    if (!row?.execution_id) {
      throw new Error(`Execution not found for proposal: ${proposalId}`);
    }
    return row.execution_id;
  }

  private requireProposalByExecution(executionId: string): PaymentProposal {
    const row = this.lael.db.db
      .prepare("SELECT proposal_json, execution_id FROM payment_agent_proposals WHERE execution_id = ?")
      .get(executionId) as StoredProposalRow | undefined;
    if (!row) {
      throw new Error(`Payment proposal not found for execution: ${executionId}`);
    }
    return normalizeProposal(parseJson<PaymentProposal>(row.proposal_json, {} as PaymentProposal));
  }

  private getMemory(ownerRef: string): MemoryRow {
    const row = this.lael.db.db
      .prepare("SELECT * FROM payment_agent_memory WHERE owner_ref = ?")
      .get(ownerRef) as MemoryRow | undefined;
    return (
      row ?? {
        owner_ref: ownerRef,
        preferred_recipient_name: null,
        preferred_recipient_address: null,
        preferred_amount: null,
        preferred_asset: null,
        preferred_chain_key: null,
        agent_score: 0.5,
        feedback_count: 0,
        policy_suggestions: "[]",
        training_examples: "[]",
        updated_at: nowIso(),
      }
    );
  }

  private findDuplicateReason(
    ownerRef: string,
    intent: TransferIntent,
    rawInput: string,
  ): string | undefined {
    const rows = this.lael.db.db
      .prepare(
        `
          SELECT proposal_json, receipt_json
          FROM payment_agent_proposals
          WHERE owner_ref = ? AND created_at >= ?
          ORDER BY created_at DESC
          LIMIT 25
        `,
      )
      .all(ownerRef, new Date(Date.now() - DUPLICATE_TRANSFER_BLOCK_WINDOW_MS).toISOString()) as Array<{
      proposal_json: string;
      receipt_json?: string | null;
    }>;
    const normalizedRaw = normalizeRaw(rawInput);
    for (const row of rows) {
      const existing = parseJson<PaymentProposal>(row.proposal_json, {} as PaymentProposal);
      const receipt = row.receipt_json
        ? parseJson<PaymentExecutionReceipt | undefined>(row.receipt_json, undefined)
        : undefined;
      if (
        existing.permissionDecision?.status === "allow_pending_human_confirmation" &&
        normalizeRaw(existing.rawInput) === normalizedRaw &&
        receipt?.settlementResult?.status === "completed"
      ) {
        return "Duplicate transfer intent";
      }
    }
    return undefined;
  }

  private findDailyLimitReason(
    ownerRef: string,
    intent: TransferIntent,
    policy: PaymentAgentPolicyInput,
  ): string | undefined {
    if (!policy.maxDailyAmount || intent.amount <= 0) {
      return undefined;
    }
    const rows = this.lael.db.db
      .prepare(
        `
          SELECT proposal_json, receipt_json
          FROM payment_agent_proposals
          WHERE owner_ref = ? AND created_at >= ?
        `,
      )
      .all(ownerRef, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) as Array<{
      proposal_json: string;
      receipt_json?: string | null;
    }>;
    const usedAmount = rows.reduce((total, row) => {
      const existing = parseJson<PaymentProposal>(row.proposal_json, {} as PaymentProposal);
      const receipt = row.receipt_json
        ? parseJson<PaymentExecutionReceipt | undefined>(row.receipt_json, undefined)
        : undefined;
      if (
        existing.permissionDecision?.status === "allow_pending_human_confirmation" &&
        existing.parsedIntent?.asset === intent.asset &&
        receipt?.settlementResult?.status === "completed"
      ) {
        return total + existing.parsedIntent.amount;
      }
      return total;
    }, 0);
    return usedAmount + intent.amount > policy.maxDailyAmount
      ? "Daily amount exceeds permission policy"
      : undefined;
  }
}

function parseTransferIntent(
  input: CreatePaymentProposalInput,
  memory: MemoryRow,
): { intent: TransferIntent; memoryKeys: string[] } {
  const raw = input.rawInput;
  const memoryKeys: string[] = [];
  const amountMatch = raw.match(/(\d+(?:\.\d+)?)\s*(USDC|USDT|ETH|BNB|SOL|EDS)?/i);
  const amount = amountMatch
    ? Number(amountMatch[1])
    : memory.preferred_amount ?? 0;
  if (!amountMatch && memory.preferred_amount !== null) {
    memoryKeys.push("preferredAmount");
  }
  const asset = (
    amountMatch?.[2]?.toUpperCase() ??
    input.defaultAsset?.toUpperCase() ??
    memory.preferred_asset ??
    DEFAULT_ASSET
  ) as string;
  if (!amountMatch?.[2] && memory.preferred_asset && memory.preferred_asset !== DEFAULT_ASSET) {
    memoryKeys.push("preferredAsset");
  }

  const recipients = Array.isArray(input.recipients) ? input.recipients : [];
  const recipient =
    recipients.find((candidate) =>
      raw.toLowerCase().includes(candidate.name.toLowerCase()),
    ) ??
    parseUnknownRecipient(raw) ??
    (memory.preferred_recipient_name && memory.preferred_recipient_address
      ? {
          name: memory.preferred_recipient_name,
          address: memory.preferred_recipient_address,
        }
      : undefined);
  if (
    recipient &&
    !raw.toLowerCase().includes(recipient.name.toLowerCase()) &&
    memory.preferred_recipient_name
  ) {
    memoryKeys.push("preferredRecipientName");
  }

  const explicitChain = parseExplicitChain(raw);
  const chainKey = explicitChain ?? memory.preferred_chain_key ?? DEFAULT_CHAIN;
  if (!explicitChain && memory.preferred_chain_key) {
    memoryKeys.push("preferredChainKey");
  }

  return {
    intent: {
      amount,
      asset,
      recipientName: recipient?.name ?? "",
      recipientAddress: recipient?.address ?? "",
      chainKey,
    },
    memoryKeys,
  };
}

function inferBusinessAction(input: CreatePaymentProposalInput): PaymentBusinessAction {
  if (input.businessAction) return input.businessAction;
  return inferBusinessActionFromRaw(input.rawInput);
}

function normalizeProposal(proposal: PaymentProposal): PaymentProposal {
  return {
    ...proposal,
    businessAction: proposal.businessAction ?? inferBusinessActionFromRaw(proposal.rawInput),
  };
}

function inferBusinessActionFromRaw(rawInput: string): PaymentBusinessAction {
  return /reward|奖励|claim|任务/i.test(rawInput) ? "task_reward" : "transfer";
}

function paymentActionTitle(proposal: PaymentProposal): string {
  return proposal.businessAction === "task_reward"
    ? `Task reward to ${proposal.parsedIntent.recipientName}`
    : `Payment Agent transfer to ${proposal.parsedIntent.recipientName}`;
}

function parseExplicitChain(rawInput: string): string | undefined {
  const raw = rawInput.toLowerCase();
  if (raw.includes("base sepolia")) return "BASE_SEPOLIA";
  if (raw.includes("base") && raw.includes("mainnet")) return "BASE_MAINNET";
  if (
    (raw.includes("bnb") || raw.includes("bsc") || raw.includes("binance smart chain")) &&
    raw.includes("mainnet")
  ) return "BNB_MAINNET";
  if (raw.includes("bnb") || raw.includes("bsc") || raw.includes("binance smart chain")) return "BNB_TESTNET";
  if (raw.includes("endless") || raw.includes("luffa app")) {
    if (raw.includes("mainnet")) return "ENDLESS_MAINNET";
    return "ENDLESS_TESTNET";
  }
  if (raw.includes("polygon")) return "POLYGON_AMOY";
  if (raw.includes("solana")) {
    if (raw.includes("mainnet")) return "SOLANA_MAINNET";
    return "SOLANA_DEVNET";
  }
  if (raw.includes("ethereum")) return "ETHEREUM_SEPOLIA";
  return undefined;
}

function evaluateProposal(
  input: CreatePaymentProposalInput,
  intent: TransferIntent,
): PaymentPermissionDecision {
  if (isConfirmationBypassAttempt(input.rawInput)) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Prompt attempted to bypass confirmation",
    };
  }
  if (!intent.amount || intent.amount <= 0) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Transfer amount missing",
    };
  }
  if (intent.amount > input.policy.maxAmount) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Amount exceeds permission policy",
    };
  }
  if (
    input.policy.allowedAssets &&
    !input.policy.allowedAssets.map((asset) => asset.toUpperCase()).includes(intent.asset.toUpperCase())
  ) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Asset denied by permission policy",
    };
  }
  if (!intent.recipientName) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Recipient missing",
    };
  }
  const allowedRecipients = new Set(
    input.policy.allowedRecipientNames.map((name) => name.toLowerCase()),
  );
  if (!allowedRecipients.has(intent.recipientName.toLowerCase())) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Recipient denied by permission policy",
    };
  }
  if (!intent.recipientAddress) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Recipient missing",
    };
  }
  if (intent.chainKey !== (input.policy.allowedChain ?? DEFAULT_CHAIN)) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Chain denied by permission policy",
    };
  }

  return {
    status: "allow_pending_human_confirmation",
    requiresHumanConfirmation: input.policy.requiresHumanConfirmation ?? true,
    reason: "Within policy; explicit wallet confirmation required",
  };
}

function buildBlockedLearningStatus(reason: string): LearningStatus | undefined {
  if (reason === "Amount exceeds permission policy") {
    return {
      status: "blocked",
      riskRecord: {
        type: "amount_limit_block",
        learnedFromFailure: true,
      },
    };
  }
  if (reason === "Prompt attempted to bypass confirmation") {
    return {
      status: "blocked",
      riskRecord: {
        type: "confirmation_bypass_attempt",
        learnedFromFailure: true,
      },
    };
  }
  if (reason === "Recipient denied by permission policy") {
    return {
      status: "blocked",
      riskRecord: {
        type: "recipient_allowlist_block",
        learnedFromFailure: true,
      },
    };
  }
  if (reason === "Chain denied by permission policy") {
    return {
      status: "blocked",
      riskRecord: {
        type: "network_policy_block",
        learnedFromFailure: true,
      },
    };
  }
  if (reason === "Asset denied by permission policy") {
    return {
      status: "blocked",
      riskRecord: {
        type: "asset_policy_block",
        learnedFromFailure: true,
      },
    };
  }
  if (reason === "Duplicate transfer intent") {
    return {
      status: "blocked",
      riskRecord: {
        type: "duplicate_transfer_block",
        learnedFromFailure: true,
      },
    };
  }
  if (reason === "Daily amount exceeds permission policy") {
    return {
      status: "blocked",
      riskRecord: {
        type: "daily_limit_block",
        learnedFromFailure: true,
      },
    };
  }
  return undefined;
}

function isConfirmationBypassAttempt(rawInput: string): boolean {
  return /ignore confirmation|bypass confirmation|without confirmation|no confirmation|不.?确认|绕过.*确认/i.test(
    rawInput,
  );
}

function railForIntent(intent: TransferIntent): SettlementRail {
  const chainType = getChainConfig(intent.chainKey)?.chainType;
  if (chainType === "solana") {
    return intent.asset.toUpperCase() === "SOL" ? "solana-native" : "solana-spl";
  }
  if (chainType === "endless") {
    return "endless-native";
  }
  return (intent.asset as SettlementAsset) === "ETH" || intent.asset.toUpperCase() === "BNB"
    ? "evm-native"
    : "evm-erc20";
}

function deriveSettlementStatus(
  result: { settlementStatus?: unknown; status?: unknown },
  appAuthorizationStatus?: string,
): string {
  if (appAuthorizationStatus === "rejected" || appAuthorizationStatus === "unavailable") {
    return "failed";
  }
  return String(result.settlementStatus ?? result.status ?? "unknown").toLowerCase();
}

function paymentExecutionIdempotencyKey(
  proposalId: string,
  input: {
    txHash?: string;
    executionMode?: SettlementExecutionMode;
    appAuthorizationStatus?: WalletAuthorizationStatus;
    retryAfterExecutionId?: string;
  },
): string {
  return [
    "payment-agent",
    proposalId,
    input.txHash?.trim() || "no-txhash",
    input.executionMode ?? "no-mode",
    input.appAuthorizationStatus ?? "no-auth",
    input.retryAfterExecutionId ? `retry-after-${input.retryAfterExecutionId}` : "initial",
  ].join(":");
}

function isCompletedReceiptForTxHash(
  receipt: PaymentExecutionReceipt,
  txHash: string,
): boolean {
  const receiptTxHash = receipt.walletTx.txHash?.trim();
  const settlementStatus = receipt.settlementResult.status.toLowerCase();
  return (
    Boolean(receiptTxHash) &&
    receiptTxHash === txHash &&
    !receiptTxHash.startsWith("mock_") &&
    (settlementStatus === "completed" || settlementStatus === "success")
  );
}

function parseUnknownRecipient(rawInput: string): PaymentAgentRecipient | undefined {
  const match =
    rawInput.match(/给\s*([A-Za-z][A-Za-z0-9_-]*)/) ??
    rawInput.match(/\bto\s+([A-Za-z][A-Za-z0-9_-]*)\b/i);
  const name = match?.[1];
  return name ? { name, address: "" } : undefined;
}

function normalizeRaw(rawInput: string): string {
  return rawInput.trim().replace(/\s+/g, " ").toLowerCase();
}
