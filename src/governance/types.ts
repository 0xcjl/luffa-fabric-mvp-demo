import type { PermissionDecisionValue } from "../permission/types.js";

export type GovernanceSource = "Microsoft AGT Adapter";

export interface GovernanceEvaluationRequest {
  mappingDid: string;
  agentDid: string;
  externalAgentId?: string;
  action: string;
  toolName?: string;
  params?: Record<string, unknown>;
  riskContext?: Record<string, unknown>;
  nativeDecision?: PermissionDecisionValue;
}

export interface GovernanceDecisionRecord {
  source: GovernanceSource;
  decision: PermissionDecisionValue;
  decisionRecordId: string;
  reason: string;
  matchedRule?: string;
  policyDigest: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  disclosureLevel: "Internal";
  degraded: boolean;
  createdAt: string;
}

export interface GovernanceAdapter {
  evaluate(request: GovernanceEvaluationRequest): Promise<GovernanceDecisionRecord>;
}
