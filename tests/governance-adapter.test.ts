import { describe, expect, it } from "vitest";
import { LAEL } from "../src/core/index.js";
import { MicrosoftAgtAdapter, type GovernanceAdapter, type GovernanceEvaluationRequest } from "../src/governance/index.js";

async function createGovernedAgent() {
  const lael = new LAEL({
    path: ":memory:",
    governanceAdapter: new MicrosoftAgtAdapter(),
  });
  const agent = await lael.registerAgent({
    identityType: "API_KEY",
    externalId: "codex-stub-agent",
    ownerRef: "did:luffa:user_agt",
    capabilities: ["luffa.create_task", "luffa.send_message"],
  });
  await lael.createPolicy({
    ownerRef: agent.ownerRef,
    jsonRules: {
      allowedActions: ["luffa.create_task", "luffa.send_message"],
    },
  });
  return { lael, agent };
}

describe("Microsoft AGT Adapter PoC", () => {
  it("maps an AGT allow decision to a Luffa execution receipt metadata record", async () => {
    const { lael, agent } = await createGovernedAgent();

    const result = await lael.invoke({
      agentId: agent.internalId,
      action: "luffa.create_task",
      params: { title: "Summarize public community context" },
      context: { toolName: "community_summary", contextSensitivity: "public" },
      idempotencyKey: "agt-allow",
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.result.governanceDecision).toMatchObject({
      source: "Microsoft AGT Adapter",
      decision: "ALLOW",
      matchedRule: "allow_low_risk_tool_call",
      disclosureLevel: "Internal",
    });
    lael.close();
  });

  it("maps an AGT deny decision to a Luffa denied receipt", async () => {
    const { lael, agent } = await createGovernedAgent();

    const result = await lael.invoke({
      agentId: agent.internalId,
      action: "luffa.create_task",
      params: { title: "Delete private database rows" },
      context: { toolName: "delete_file", contextSensitivity: "public" },
      idempotencyKey: "agt-deny",
    });

    expect(result.status).toBe("DENIED");
    expect(result.result).toMatchObject({
      decision: "DENY",
      governanceDecision: {
        source: "Microsoft AGT Adapter",
        decision: "DENY",
        matchedRule: "block_destructive_or_private_tool",
      },
    });
    lael.close();
  });

  it("maps an AGT approval requirement to Luffa REQUIRES_CONFIRMATION", async () => {
    const { lael, agent } = await createGovernedAgent();

    const result = await lael.invoke({
      agentId: agent.internalId,
      action: "luffa.send_message",
      params: { body: "Publish this update" },
      context: { toolName: "publish" },
      idempotencyKey: "agt-requires-confirmation",
    });

    expect(result.status).toBe("DENIED");
    expect(result.result).toMatchObject({
      decision: "REQUIRES_CONFIRMATION",
      requiresConfirmation: true,
      governanceDecision: {
        matchedRule: "require_human_approval",
      },
    });
    lael.close();
  });

  it("falls back to Luffa Native Policy when AGT is unavailable and records degraded evidence", async () => {
    const lael = new LAEL({
      path: ":memory:",
      governanceAdapter: new MicrosoftAgtAdapter({ available: false }),
    });
    const agent = await lael.registerAgent({
      identityType: "API_KEY",
      externalId: "agt-unavailable-agent",
      ownerRef: "did:luffa:user_agt",
      capabilities: ["luffa.create_task"],
    });
    await lael.createPolicy({
      ownerRef: agent.ownerRef,
      jsonRules: { allowedActions: ["luffa.create_task"] },
    });

    const result = await lael.invoke({
      agentId: agent.internalId,
      action: "luffa.create_task",
      params: { title: "Fallback summary" },
      context: { toolName: "community_summary" },
      idempotencyKey: "agt-fallback",
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.result.governanceDecision).toMatchObject({
      decision: "ALLOW",
      degraded: true,
      matchedRule: "agt_unavailable_fallback",
    });
    lael.close();
  });

  it("does not call AGT when the agent lacks the required capability", async () => {
    const calls: GovernanceEvaluationRequest[] = [];
    const countingAdapter: GovernanceAdapter = {
      async evaluate(request) {
        calls.push(request);
        return new MicrosoftAgtAdapter().evaluate(request);
      },
    };
    const lael = new LAEL({ path: ":memory:", governanceAdapter: countingAdapter });
    const agent = await lael.registerAgent({
      identityType: "API_KEY",
      externalId: "capability-first-agent",
      ownerRef: "did:luffa:user_agt",
      capabilities: ["luffa.create_task"],
    });
    await lael.createPolicy({
      ownerRef: agent.ownerRef,
      jsonRules: { allowedActions: ["luffa.send_message"] },
    });

    const result = await lael.invoke({
      agentId: agent.internalId,
      action: "luffa.send_message",
      params: { body: "hello" },
      idempotencyKey: "agt-capability-first",
    });

    expect(result.status).toBe("DENIED");
    expect(result.result.error).toBe("Agent capability denied");
    expect(calls).toHaveLength(0);
    lael.close();
  });
});
