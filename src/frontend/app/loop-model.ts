export type LoopStepStatus =
  | "idle"
  | "active"
  | "pass"
  | "manual_required"
  | "blocked"
  | "fail"
  | "simulated";

export type ExecutionLane = "offchain" | "onchain-transfer" | "onchain-swap" | "fiat-proof";

export type BindingStatus = "unbound" | "bound";

export type LoopModelInput = {
  selectedLane: ExecutionLane;
  bindingStatus: BindingStatus;
  hasRuntimeReceipt?: boolean;
  proposalStatus?: "allow_pending_human_confirmation" | "blocked";
  hasReceipt?: boolean;
  feedbackSubmitted?: boolean;
  swapProposalStatus?: "allow_pending_human_confirmation" | "blocked";
  hasSwapReceipt?: boolean;
  hasProofSettlement?: boolean;
};

export type LoopStep = {
  id: string;
  label: string;
  status: LoopStepStatus;
  detail: string;
};

export type EvidenceInput = {
  receiptId?: string;
  traceDigest?: string;
  settlementId?: string;
  txHash?: string;
  rail?: string;
  rawInput?: string;
  walletAddress?: string;
  simulated?: boolean;
  appAuthorizationStatus?: "approved" | "rejected" | "unavailable" | "simulated";
  executionMode?: string;
};

export type EvidenceClassification = {
  onChainStatus: "On-chain tx" | "Anchor-ready digest" | "Off-chain private log" | "Simulated proof";
  sensitivity: "Public" | "Internal" | "Sensitive";
  disclosure: "可公开" | "仅内部" | "不建议披露";
  note: string;
};

export type LearningMemory = {
  userPreferences?: {
    preferredRecipientName?: string;
    preferredAmount?: number;
    preferredAsset?: string;
    preferredChainKey?: string;
  };
  agentScore?: number;
  feedbackCount?: number;
  policySuggestions?: Array<{ type: string; status: string; reason: string }>;
  trainingExamples?: Array<{ rawInput: string; exportAllowed: boolean }>;
};

export type LearningInput = {
  feedbackSubmitted?: boolean;
  hasRuntimeReceipt?: boolean;
  hasSwapReceipt?: boolean;
  hasProofSettlement?: boolean;
  memory?: LearningMemory | null;
  blockedReason?: string;
};

export type LearningItem = {
  learnedFrom: string;
  content: string;
  suggestion: string;
  priority: "High" | "Medium" | "Optional";
  boundary: string;
};

export function deriveLoopSteps(input: LoopModelInput): LoopStep[] {
  const hasIntent =
    input.hasRuntimeReceipt ||
    input.proposalStatus !== undefined ||
    input.swapProposalStatus !== undefined ||
    input.hasProofSettlement;
  const blocked = input.proposalStatus === "blocked" || input.swapProposalStatus === "blocked";

  return [
    {
      id: "mapping-id",
      label: "Mapping ID",
      status: input.bindingStatus === "bound" ? "pass" : "active",
      detail: input.bindingStatus === "bound" ? "Luffa DID anchor ready" : "Bind an Agent ID or wallet",
    },
    {
      id: "agent-binding",
      label: "Agent Binding",
      status: input.bindingStatus === "bound" ? "pass" : "idle",
      detail:
        input.bindingStatus === "bound"
          ? "Agent / wallet mapped to Luffa DID"
          : "Awaiting mapping confirmation",
    },
    {
      id: "intent",
      label: "Intent / Request",
      status: hasIntent ? "pass" : "idle",
      detail: hasIntent ? "Intent captured" : "No request submitted",
    },
    {
      id: "permission",
      label: "Permission Decision",
      status: derivePermissionStatus(input, blocked),
      detail: derivePermissionDetail(input, blocked),
    },
    {
      id: "execution-lane",
      label: "Execution Lane",
      status: deriveExecutionStatus(input, blocked),
      detail: deriveExecutionDetail(input, blocked),
    },
    {
      id: "settlement-evidence",
      label: "Settlement / Evidence",
      status: deriveEvidenceStatus(input, blocked),
      detail: deriveEvidenceDetail(input, blocked),
    },
    {
      id: "feedback",
      label: "Feedback",
      status: input.feedbackSubmitted ? "pass" : hasAnyReceipt(input) ? "active" : "idle",
      detail: input.feedbackSubmitted ? "Feedback recorded" : "Awaiting user feedback",
    },
    {
      id: "learning",
      label: "Learning",
      status: deriveLearningStatus(input, blocked),
      detail: deriveLearningDetail(input, blocked),
    },
  ];
}

export function classifyEvidence(input: EvidenceInput): EvidenceClassification {
  if (input.appAuthorizationStatus === "rejected" || input.appAuthorizationStatus === "unavailable") {
    return {
      onChainStatus: "Simulated proof",
      sensitivity: "Internal",
      disclosure: "仅内部",
      note: "App authorization did not complete, so this is evidence of a blocked or rejected execution path.",
    };
  }
  if (input.txHash) {
    return {
      onChainStatus: "On-chain tx",
      sensitivity: "Public",
      disclosure: "可公开",
      note: "txHash and public chain status can be disclosed.",
    };
  }
  if (input.rawInput || input.walletAddress) {
    return {
      onChainStatus: input.simulated ? "Simulated proof" : "Off-chain private log",
      sensitivity: "Sensitive",
      disclosure: "不建议披露",
      note: "Raw input, wallet address, private context, and feedback comments should stay private by default.",
    };
  }
  if (input.simulated) {
    return {
      onChainStatus: "Simulated proof",
      sensitivity: "Internal",
      disclosure: "仅内部",
      note: "Simulation evidence is useful for MVP review but is not a real chain transaction.",
    };
  }
  if (input.traceDigest || input.receiptId || input.settlementId) {
    return {
      onChainStatus: "Anchor-ready digest",
      sensitivity: "Internal",
      disclosure: "仅内部",
      note: "Digest and receipt metadata can support later attestation, but raw content should not be disclosed.",
    };
  }
  return {
    onChainStatus: "Off-chain private log",
    sensitivity: "Internal",
    disclosure: "仅内部",
    note: "No public chain transaction is attached yet.",
  };
}

export function deriveLearningItems(input: LearningInput): LearningItem[] {
  const items: LearningItem[] = [];
  if (input.blockedReason) {
    items.push({
      learnedFrom: "Permission denial",
      content: input.blockedReason,
      suggestion: "保留当前策略边界，并把阻断原因展示给用户确认。",
      priority: "High",
      boundary: "不自动提高额度、不自动加入新收款人、不绕过人工确认。",
    });
  }

  const policySuggestion = input.memory?.policySuggestions?.[0];
  if (policySuggestion) {
    items.push({
      learnedFrom: "Policy review",
      content: `${policySuggestion.type}: ${policySuggestion.reason}`,
      suggestion: "继续保留人工确认，任何策略变更必须由用户显式批准。",
      priority: "High",
      boundary: "不自动扩大权限、不自动改变支付或交易限制。",
    });
  }

  const preferences = input.memory?.userPreferences;
  if (preferences && Object.keys(preferences).length > 0) {
    const preferenceParts = [
      preferences.preferredRecipientName ? `recipient=${preferences.preferredRecipientName}` : "",
      preferences.preferredAmount ? `amount=${preferences.preferredAmount}` : "",
      preferences.preferredAsset ? `asset=${preferences.preferredAsset}` : "",
      preferences.preferredChainKey ? `chain=${preferences.preferredChainKey}` : "",
    ].filter(Boolean);
    items.push({
      learnedFrom: "User feedback",
      content: `记住偏好：${preferenceParts.join(", ")}`,
      suggestion: "可用于下一次模糊请求的默认补全，但仍需要重新权限检查和人工确认。",
      priority: "Medium",
      boundary: "不自动转账、不自动交易、不跳过钱包签名。",
    });
  }

  const trainingExample = input.memory?.trainingExamples?.[0];
  if (trainingExample || input.feedbackSubmitted) {
    items.push({
      learnedFrom: "Training example",
      content: trainingExample?.rawInput ?? "Feedback can become a training example if the user allows export.",
      suggestion: "仅在用户显式授权时导出训练样本。",
      priority: "Optional",
      boundary: "不自动导出训练数据。",
    });
  }

  if (items.length === 0 && (input.hasRuntimeReceipt || input.hasSwapReceipt || input.hasProofSettlement)) {
    items.push({
      learnedFrom: "Execution receipt",
      content: "已生成可追踪 receipt，可作为后续策略和偏好学习的输入。",
      suggestion: "等待用户反馈后再更新偏好或策略建议。",
      priority: "Optional",
      boundary: "receipt 本身不改变权限边界。",
    });
  }

  return items;
}

function derivePermissionStatus(input: LoopModelInput, blocked: boolean): LoopStepStatus {
  if (blocked) return "blocked";
  if (input.hasRuntimeReceipt || input.hasProofSettlement) return "pass";
  if (
    input.proposalStatus === "allow_pending_human_confirmation" ||
    input.swapProposalStatus === "allow_pending_human_confirmation"
  ) {
    return "manual_required";
  }
  return "idle";
}

function derivePermissionDetail(input: LoopModelInput, blocked: boolean): string {
  if (blocked) return "Policy blocked this request";
  if (input.hasRuntimeReceipt || input.hasProofSettlement) return "Permission allowed for this MVP action";
  if (
    input.proposalStatus === "allow_pending_human_confirmation" ||
    input.swapProposalStatus === "allow_pending_human_confirmation"
  ) {
    return "Allowed only after human confirmation";
  }
  return "No permission decision yet";
}

function deriveExecutionStatus(input: LoopModelInput, blocked: boolean): LoopStepStatus {
  if (blocked) return "blocked";
  if (input.hasRuntimeReceipt) return "pass";
  if (input.hasReceipt) return "pass";
  if (input.hasSwapReceipt || input.hasProofSettlement) return "simulated";
  if (input.proposalStatus === "allow_pending_human_confirmation") return "manual_required";
  if (input.swapProposalStatus === "allow_pending_human_confirmation") return "manual_required";
  return "idle";
}

function deriveExecutionDetail(input: LoopModelInput, blocked: boolean): string {
  if (blocked) return "Execution blocked";
  if (input.hasRuntimeReceipt) return "Off-chain runtime receipt generated";
  if (input.hasReceipt) return "Wallet transaction recorded";
  if (input.hasSwapReceipt) return "Swap simulated receipt generated";
  if (input.hasProofSettlement) return "Proof settlement record created";
  if (input.proposalStatus === "allow_pending_human_confirmation") return "Wallet signature required";
  if (input.swapProposalStatus === "allow_pending_human_confirmation") return "Human confirmation required before simulation";
  return input.selectedLane === "offchain" ? "Awaiting runtime execution" : "Awaiting value action";
}

function deriveEvidenceStatus(input: LoopModelInput, blocked: boolean): LoopStepStatus {
  if (blocked) return "blocked";
  if (input.hasRuntimeReceipt || input.hasReceipt) return "pass";
  if (input.hasSwapReceipt || input.hasProofSettlement) return "simulated";
  return "idle";
}

function deriveEvidenceDetail(input: LoopModelInput, blocked: boolean): string {
  if (blocked) return "Risk record can be retained";
  if (input.hasRuntimeReceipt) return "Trace digest and runtime receipt ready";
  if (input.hasReceipt) return "Settlement and tx evidence ready";
  if (input.hasSwapReceipt) return "Simulated swap receipt ready";
  if (input.hasProofSettlement) return "Invoice proof receipt ready";
  return "No evidence yet";
}

function deriveLearningStatus(input: LoopModelInput, blocked: boolean): LoopStepStatus {
  if (blocked) return "active";
  if (input.feedbackSubmitted || input.hasRuntimeReceipt) return "pass";
  if (input.hasReceipt || input.hasSwapReceipt || input.hasProofSettlement) return "active";
  return "idle";
}

function deriveLearningDetail(input: LoopModelInput, blocked: boolean): string {
  if (blocked) return "Risk learning record available";
  if (input.feedbackSubmitted) return "Learning update applied";
  if (input.hasRuntimeReceipt) return "Runtime learning signal generated";
  if (input.hasReceipt || input.hasSwapReceipt || input.hasProofSettlement) return "Awaiting feedback for learning update";
  return "No learning signal yet";
}

function hasAnyReceipt(input: LoopModelInput): boolean {
  return Boolean(input.hasRuntimeReceipt || input.hasReceipt || input.hasSwapReceipt || input.hasProofSettlement);
}
