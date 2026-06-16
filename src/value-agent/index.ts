import type { LAEL } from "../core/index.js";
import { newId, nowIso } from "../utils.js";

const DEFAULT_CHAIN = "BASE_SEPOLIA";

export interface CreateSwapProposalInput {
  ownerRef: string;
  walletAddress: string;
  rawInput: string;
  policy: {
    maxAmount: number;
    allowedAssets: string[];
    allowedChain?: string;
    maxSlippageBps: number;
    requiresHumanConfirmation?: boolean;
  };
}

export interface ExecuteSwapProposalInput {
  humanConfirmed: boolean;
}

export interface SwapIntent {
  action: "swap";
  amount: number;
  fromAsset: string;
  toAsset: string;
  chainKey: string;
  protocol: "simulated-dex";
  slippageBps: number;
}

export interface ValuePermissionDecision {
  status: "allow_pending_human_confirmation" | "blocked";
  requiresHumanConfirmation: boolean;
  reason: string;
}

export interface SimulatedSwapProposal {
  proposalId: string;
  ownerRef: string;
  walletAddress: string;
  rawInput: string;
  parsedIntent: SwapIntent;
  permissionDecision: ValuePermissionDecision;
  executionMode: "simulated";
  learningStatus?: {
    status: "blocked";
    riskRecord: {
      type: string;
      learnedFromFailure: boolean;
    };
  };
  createdAt: string;
}

export interface SimulatedSwapReceipt {
  rawInput: string;
  parsedIntent: SwapIntent;
  permissionDecision: ValuePermissionDecision;
  walletTx: {
    chainKey: string;
    walletAddress: string;
  };
  settlementResult: {
    status: "simulated_completed";
    rail: "resource-credit";
    settlementId?: string;
  };
  learningStatus: {
    status: "pending_feedback";
  };
}

export class ValueAgentMvpService {
  private readonly proposals = new Map<string, SimulatedSwapProposal>();

  constructor(private readonly lael: LAEL) {}

  createSwapProposal(input: CreateSwapProposalInput): SimulatedSwapProposal {
    const parsedIntent = parseSwapIntent(input.rawInput);
    const permissionDecision = evaluateSwap(input, parsedIntent);
    const proposal: SimulatedSwapProposal = {
      proposalId: newId("swap_proposal"),
      ownerRef: input.ownerRef,
      walletAddress: input.walletAddress,
      rawInput: input.rawInput,
      parsedIntent,
      permissionDecision,
      executionMode: "simulated",
      learningStatus: blockedLearningStatus(permissionDecision.reason),
      createdAt: nowIso(),
    };
    this.proposals.set(proposal.proposalId, proposal);
    return proposal;
  }

  async executeSwapProposal(
    proposalId: string,
    input: ExecuteSwapProposalInput,
  ): Promise<{ receipt: SimulatedSwapReceipt }> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Swap proposal not found: ${proposalId}`);
    }
    if (proposal.permissionDecision.status === "blocked") {
      throw new Error("Swap proposal is blocked");
    }
    if (!input.humanConfirmed) {
      throw new Error("Human confirmation is required");
    }

    const settlement = await this.lael.transferSettlement({
      executionId: `exec_${proposal.proposalId}`,
      payerDid: proposal.ownerRef,
      payeeDid: "did:luffa:agent:simulated-dex",
      asset: "FIAT_USD",
      amount: proposal.parsedIntent.amount,
      rail: "resource-credit",
      metadata: {
        reference: proposal.proposalId,
        purpose: "Simulated swap proof; no real DEX execution",
      },
    });

    return {
      receipt: {
        rawInput: proposal.rawInput,
        parsedIntent: proposal.parsedIntent,
        permissionDecision: proposal.permissionDecision,
        walletTx: {
          chainKey: proposal.parsedIntent.chainKey,
          walletAddress: proposal.walletAddress,
        },
        settlementResult: {
          status: "simulated_completed",
          rail: "resource-credit",
          settlementId: settlement.settlementId,
        },
        learningStatus: {
          status: "pending_feedback",
        },
      },
    };
  }
}

function parseSwapIntent(rawInput: string): SwapIntent {
  const amountMatch = rawInput.match(/(\d+(?:\.\d+)?)\s*([A-Z]{2,12})\s+(?:to|for|->)\s+([A-Z]{2,12})/i);
  const slippageMatch = rawInput.match(/slippage\s*(\d+(?:\.\d+)?)\s*%/i);
  return {
    action: "swap",
    amount: amountMatch ? Number(amountMatch[1]) : 0,
    fromAsset: amountMatch?.[2]?.toUpperCase() ?? "",
    toAsset: amountMatch?.[3]?.toUpperCase() ?? "",
    chainKey: parseChain(rawInput),
    protocol: "simulated-dex",
    slippageBps: slippageMatch ? Math.round(Number(slippageMatch[1]) * 100) : 50,
  };
}

function parseChain(rawInput: string): string {
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
  return DEFAULT_CHAIN;
}

function evaluateSwap(
  input: CreateSwapProposalInput,
  intent: SwapIntent,
): ValuePermissionDecision {
  if (/ignore confirmation|bypass confirmation|without confirmation|no confirmation|不.?确认|绕过.*确认/i.test(input.rawInput)) {
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
      reason: "Swap amount missing",
    };
  }
  if (intent.amount > input.policy.maxAmount) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Amount exceeds swap policy",
    };
  }
  const allowedAssets = input.policy.allowedAssets.map((asset) => asset.toUpperCase());
  if (!allowedAssets.includes(intent.fromAsset) || !allowedAssets.includes(intent.toAsset)) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Asset denied by swap policy",
    };
  }
  if (intent.chainKey !== (input.policy.allowedChain ?? DEFAULT_CHAIN)) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Chain denied by swap policy",
    };
  }
  if (intent.slippageBps > input.policy.maxSlippageBps) {
    return {
      status: "blocked",
      requiresHumanConfirmation: false,
      reason: "Slippage exceeds swap policy",
    };
  }

  return {
    status: "allow_pending_human_confirmation",
    requiresHumanConfirmation: input.policy.requiresHumanConfirmation ?? true,
    reason: "Within simulated swap policy; no real DEX execution",
  };
}

function blockedLearningStatus(reason: string): SimulatedSwapProposal["learningStatus"] | undefined {
  const riskTypes: Record<string, string> = {
    "Prompt attempted to bypass confirmation": "confirmation_bypass_attempt",
    "Swap amount missing": "swap_amount_missing",
    "Amount exceeds swap policy": "swap_amount_limit_block",
    "Asset denied by swap policy": "swap_asset_policy_block",
    "Chain denied by swap policy": "swap_chain_policy_block",
    "Slippage exceeds swap policy": "swap_slippage_policy_block",
  };
  const type = riskTypes[reason];
  return type
    ? {
        status: "blocked",
        riskRecord: {
          type,
          learnedFromFailure: true,
        },
      }
    : undefined;
}
