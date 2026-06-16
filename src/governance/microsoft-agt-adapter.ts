import { newId, nowIso, sha256Hex } from "../utils.js";
import type {
  GovernanceAdapter,
  GovernanceDecisionRecord,
  GovernanceEvaluationRequest,
} from "./types.js";

export interface MicrosoftAgtAdapterOptions {
  available?: boolean;
  policyName?: string;
}

const DEFAULT_POLICY_NAME = "lael-mvp-agt-policy";

const DENY_PATTERNS = [
  "delete",
  "drop",
  "truncate",
  "execute_code",
  "private_context",
  "bypass_permission",
  "ignore_permission",
];

const APPROVAL_PATTERNS = ["send_email", "publish", "delegate", "transfer", "swap"];

export class MicrosoftAgtAdapter implements GovernanceAdapter {
  constructor(private readonly options: MicrosoftAgtAdapterOptions = {}) {}

  async evaluate(request: GovernanceEvaluationRequest): Promise<GovernanceDecisionRecord> {
    if (this.options.available === false) {
      return this.record(request, {
        decision: "ALLOW",
        reason: "Microsoft AGT Adapter unavailable; fallback to Luffa Native Policy",
        matchedRule: "agt_unavailable_fallback",
        degraded: true,
      });
    }

    const normalized = normalizeAction(request);
    if (DENY_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      return this.record(request, {
        decision: "DENY",
        reason: "Denied by Microsoft AGT Adapter policy guard",
        matchedRule: "block_destructive_or_private_tool",
        degraded: false,
      });
    }

    if (
      request.riskContext?.contextSensitivity === "private" ||
      request.riskContext?.promptInjectionDetected === true
    ) {
      return this.record(request, {
        decision: "DENY",
        reason: "Denied by Microsoft AGT Adapter context guard",
        matchedRule: "block_private_or_injected_context",
        degraded: false,
      });
    }

    if (APPROVAL_PATTERNS.some((pattern) => normalized.includes(pattern)) || request.riskContext?.riskLevel === "HIGH") {
      return this.record(request, {
        decision: "REQUIRES_CONFIRMATION",
        reason: "Microsoft AGT Adapter requires human approval for this governed action",
        matchedRule: "require_human_approval",
        degraded: false,
      });
    }

    return this.record(request, {
      decision: "ALLOW",
      reason: "Allowed by Microsoft AGT Adapter policy guard",
      matchedRule: "allow_low_risk_tool_call",
      degraded: false,
    });
  }

  private record(
    request: GovernanceEvaluationRequest,
    input: {
      decision: GovernanceDecisionRecord["decision"];
      reason: string;
      matchedRule: string;
      degraded: boolean;
    },
  ): GovernanceDecisionRecord {
    return {
      source: "Microsoft AGT Adapter",
      decision: input.decision,
      decisionRecordId: newId("agt_decision"),
      reason: input.reason,
      matchedRule: input.matchedRule,
      policyDigest: sha256Hex({
        policyName: this.options.policyName ?? DEFAULT_POLICY_NAME,
        rule: input.matchedRule,
        action: request.action,
        toolName: request.toolName,
      }),
      riskLevel: riskLevel(request),
      disclosureLevel: "Internal",
      degraded: input.degraded,
      createdAt: nowIso(),
    };
  }
}

function normalizeAction(request: GovernanceEvaluationRequest): string {
  return [request.action, request.toolName, request.riskContext?.intent]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .replaceAll("-", "_");
}

function riskLevel(request: GovernanceEvaluationRequest): GovernanceDecisionRecord["riskLevel"] {
  const value = request.riskContext?.riskLevel;
  return value === "LOW" || value === "MEDIUM" || value === "HIGH" || value === "CRITICAL"
    ? value
    : "LOW";
}
