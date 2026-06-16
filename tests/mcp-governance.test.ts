import { describe, expect, it } from "vitest";
import { LAEL } from "../src/core/index.js";
import { MicrosoftAgtAdapter } from "../src/governance/index.js";
import { createMcpTools } from "../src/mcp/tools.js";

async function createMcpGovernedRuntime() {
  const lael = new LAEL({
    path: ":memory:",
    governanceAdapter: new MicrosoftAgtAdapter(),
  });
  const agent = await lael.registerAgent({
    identityType: "API_KEY",
    externalId: "mcp-agent",
    ownerRef: "did:luffa:mcp_owner",
    capabilities: ["luffa.create_task", "luffa.send_message"],
  });
  await lael.createPolicy({
    ownerRef: agent.ownerRef,
    jsonRules: { allowedActions: ["luffa.create_task", "luffa.send_message"] },
  });
  return { lael, agent, mcp: createMcpTools(lael) };
}

describe("MCP governance wrapper", () => {
  it("injects MCP tool context and records AGT decision metadata", async () => {
    const { lael, agent, mcp } = await createMcpGovernedRuntime();

    const result = await mcp.callTool("luffa.create_task", {
      agentId: agent.internalId,
      idempotencyKey: "mcp-governance-allow",
      params: { title: "Summarize public context" },
    });
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      result: {
        governanceDecision?: { source: string; decision: string };
      };
      context?: Record<string, unknown>;
    };

    expect(result.isError).toBeUndefined();
    expect(body.result.governanceDecision).toMatchObject({
      source: "Microsoft AGT Adapter",
      decision: "ALLOW",
    });

    const record = lael.getExecutionRecord(body.executionId as string);
    expect(record?.context).toBeUndefined();
    expect(record?.result.governanceDecision).toMatchObject({
      source: "Microsoft AGT Adapter",
    });
    lael.close();
  });

  it("blocks destructive MCP tool calls through AGT before execution", async () => {
    const { lael, agent, mcp } = await createMcpGovernedRuntime();

    const result = await mcp.callTool("lael.invoke", {
      agentId: agent.internalId,
      action: "luffa.create_task",
      idempotencyKey: "mcp-governance-deny",
      params: { title: "Delete private context" },
      context: { toolName: "delete_file" },
    });
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      status: string;
      result: {
        decision?: string;
        governanceDecision?: { matchedRule: string };
      };
    };

    expect(body.status).toBe("DENIED");
    expect(body.result.decision).toBe("DENY");
    expect(body.result.governanceDecision).toMatchObject({
      matchedRule: "block_destructive_or_private_tool",
    });
    lael.close();
  });
});
