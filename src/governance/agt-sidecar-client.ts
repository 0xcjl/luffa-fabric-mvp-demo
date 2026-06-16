import { newId, nowIso, sha256Hex } from "../utils.js";
import type {
  GovernanceAdapter,
  GovernanceDecisionRecord,
  GovernanceEvaluationRequest,
} from "./types.js";

export interface AgtSidecarClientOptions {
  endpoint: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

interface AgtSidecarResponse {
  source?: string;
  decision?: string;
  decisionRecordId?: string;
  reason?: string;
  matchedRule?: string;
  policyDigest?: string;
  riskLevel?: string;
  degraded?: boolean;
}

const DEFAULT_TIMEOUT_MS = 1_500;

export class AgtSidecarClient implements GovernanceAdapter {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: AgtSidecarClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async evaluate(request: GovernanceEvaluationRequest): Promise<GovernanceDecisionRecord> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await this.fetchImpl(this.options.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        return fallbackRecord(request, `AGT sidecar returned HTTP ${response.status}`);
      }

      const body = (await response.json()) as AgtSidecarResponse;
      return normalizeSidecarResponse(request, body);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "AGT sidecar unavailable";
      return fallbackRecord(request, reason);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizeSidecarResponse(
  request: GovernanceEvaluationRequest,
  body: AgtSidecarResponse,
): GovernanceDecisionRecord {
  const decision = normalizeDecision(body.decision);
  const matchedRule = body.matchedRule ?? "agt_sidecar_policy";
  return {
    source: "Microsoft AGT Adapter",
    decision,
    decisionRecordId: body.decisionRecordId ?? newId("agt_decision"),
    reason: body.reason ?? `Microsoft AGT sidecar returned ${decision}`,
    matchedRule,
    policyDigest:
      body.policyDigest ??
      sha256Hex({
        action: request.action,
        toolName: request.toolName,
        matchedRule,
      }),
    riskLevel: normalizeRiskLevel(body.riskLevel),
    disclosureLevel: "Internal",
    degraded: body.degraded === true,
    createdAt: nowIso(),
  };
}

function fallbackRecord(
  request: GovernanceEvaluationRequest,
  reason: string,
): GovernanceDecisionRecord {
  return {
    source: "Microsoft AGT Adapter",
    decision: "ALLOW",
    decisionRecordId: newId("agt_decision"),
    reason: `AGT sidecar unavailable; fallback to Luffa Native Policy: ${reason}`,
    matchedRule: "agt_sidecar_unavailable_fallback",
    policyDigest: sha256Hex({
      action: request.action,
      toolName: request.toolName,
      fallback: true,
    }),
    riskLevel: normalizeRiskLevel(request.riskContext?.riskLevel),
    disclosureLevel: "Internal",
    degraded: true,
    createdAt: nowIso(),
  };
}

function normalizeDecision(value: unknown): GovernanceDecisionRecord["decision"] {
  return value === "ALLOW" || value === "DENY" || value === "REQUIRES_CONFIRMATION"
    ? value
    : "DENY";
}

function normalizeRiskLevel(value: unknown): GovernanceDecisionRecord["riskLevel"] {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH" || value === "CRITICAL"
    ? value
    : "LOW";
}
