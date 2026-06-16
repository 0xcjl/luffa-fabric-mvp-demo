import { describe, expect, it } from "vitest";
import { AgtSidecarClient } from "../src/governance/index.js";

const baseRequest = {
  mappingDid: "did:luffa:user_001",
  agentDid: "did:luffa:agent:openclaw_stub",
  externalAgentId: "openclaw_stub",
  action: "community.summary",
  toolName: "community_summary",
  riskContext: { riskLevel: "LOW" },
} as const;

describe("AGT sidecar client", () => {
  it("normalizes an allow response from a real AGT sidecar shape", async () => {
    const client = new AgtSidecarClient({
      endpoint: "http://127.0.0.1:9999/governance/evaluate",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            decision: "ALLOW",
            decisionRecordId: "agt_decision_1",
            reason: "Allowed by sidecar",
            matchedRule: "allow_summary",
            policyDigest: "policy_digest_1",
            riskLevel: "LOW",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    });

    await expect(client.evaluate(baseRequest)).resolves.toMatchObject({
      source: "Microsoft AGT Adapter",
      decision: "ALLOW",
      decisionRecordId: "agt_decision_1",
      matchedRule: "allow_summary",
      policyDigest: "policy_digest_1",
      degraded: false,
    });
  });

  it("normalizes deny and requires-confirmation decisions", async () => {
    const denyClient = new AgtSidecarClient({
      endpoint: "http://127.0.0.1:9999/governance/evaluate",
      fetchImpl: async () => new Response(JSON.stringify({ decision: "DENY" }), { status: 200 }),
    });
    const confirmationClient = new AgtSidecarClient({
      endpoint: "http://127.0.0.1:9999/governance/evaluate",
      fetchImpl: async () =>
        new Response(JSON.stringify({ decision: "REQUIRES_CONFIRMATION" }), { status: 200 }),
    });

    await expect(denyClient.evaluate(baseRequest)).resolves.toMatchObject({ decision: "DENY" });
    await expect(confirmationClient.evaluate(baseRequest)).resolves.toMatchObject({
      decision: "REQUIRES_CONFIRMATION",
    });
  });

  it("falls back to Luffa Native Policy when the sidecar is unavailable", async () => {
    const client = new AgtSidecarClient({
      endpoint: "http://127.0.0.1:9999/governance/evaluate",
      fetchImpl: async () => new Response("unavailable", { status: 503 }),
    });

    await expect(client.evaluate(baseRequest)).resolves.toMatchObject({
      decision: "ALLOW",
      matchedRule: "agt_sidecar_unavailable_fallback",
      degraded: true,
    });
  });
});
