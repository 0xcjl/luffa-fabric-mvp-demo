import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApiServer, createApiState } from "../packages/api/src/server.ts";
import { LaelApiError, LaelClient } from "../packages/sdk-js/src/client.ts";

const agent = {
  kind: "AgentResource",
  version: "1.0",
  agent_id: "did:luffa:agent:community-summary-001",
  owner_did: "did:luffa:user:owner001",
  name: "Community Summary Agent",
  description: "Summarizes public community channel messages.",
  runtime_adapter: "mock",
  behavior_profile: { role: "community_operator", tone: "professional", risk_tolerance: "low" },
  capability_bindings: [],
  context_bindings: [],
  status: "active",
  created_at: "2026-05-25T00:00:00Z",
  updated_at: "2026-05-25T00:00:00Z"
};

const capability = {
  kind: "CapabilityGrant",
  version: "1.0",
  capability_id: "cap_community_read_001",
  issuer: "did:luffa:user:owner001",
  subject: "did:luffa:agent:community-summary-001",
  resource: "luffa://community/123/channel/public",
  actions: ["read", "summarize", "draft_post", "generate_receipt"],
  constraints: {
    expires_at: "2099-01-01T00:00:00Z",
    max_calls_per_day: 100,
    max_spend_usd: 0,
    no_private_messages: true,
    requires_approval_for: ["publish", "external_share"]
  },
  delegation: {
    can_delegate: false,
    max_delegation_depth: 0,
    allowed_delegatees: []
  },
  revocation: {
    revocable: true,
    cascade_revoke: true
  },
  status: "active",
  created_at: "2026-05-25T00:00:00Z"
};

const context = {
  kind: "ContextResource",
  version: "1.0",
  context_id: "ctx_community_123_public",
  namespace: "community:123",
  owner: "did:luffa:community:123",
  scope: "community_public",
  allowed_subjects: ["did:luffa:agent:community-summary-001"],
  retrieval_policy: "public_only",
  memory_type: "short_term",
  consent_required: false,
  cross_namespace_access: false,
  data_sources: [{ type: "mock_channel", ref: "community/123/channel/public" }],
  status: "active"
};

const workflow = {
  kind: "WorkflowResource",
  version: "1.0",
  workflow_id: "wf_community_summary_001",
  name: "Community Public Channel Summary",
  owner: "did:luffa:user:owner001",
  allowed_agents: ["did:luffa:agent:community-summary-001"],
  steps: [
    { id: "resolve_context", action: "read", resource: "luffa://community/123/channel/public" },
    { id: "summarize", action: "summarize", skill: "builtin.summarize" },
    { id: "draft", action: "draft_post" },
    { id: "receipt", action: "generate_receipt" }
  ],
  risk_profile: "low",
  status: "active"
};

const intent = {
  kind: "ExecutionIntent",
  intent_id: "intent_001",
  agent_id: "did:luffa:agent:community-summary-001",
  workflow_id: "wf_community_summary_001",
  requested_by: "did:luffa:user:owner001",
  context_refs: ["ctx_community_123_public"],
  input: { task: "Summarize the latest public channel messages." },
  requested_actions: ["read", "summarize", "draft_post", "generate_receipt"],
  created_at: "2026-05-25T00:00:00Z"
};

function feedback(receiptId: string) {
  return {
  kind: "FeedbackResource",
  version: "1.0",
  feedback_id: `fb_${receiptId}`,
  receipt_id: receiptId,
  source: "user",
  source_did: "did:luffa:user:owner001",
  label: "accepted",
  score: 5,
  comment: "Useful summary.",
  verified: true,
  weight: 1,
  created_at: "2026-05-25T00:00:00Z"
  };
}

async function main(): Promise<void> {
  const state = await createApiState(process.env);
  const server = createApiServer(state.repositories, { persistSnapshot: state.persistSnapshot });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  const client = new LaelClient(`http://127.0.0.1:${port}`);

  try {
    await createOrReuse(() => client.createAgent(agent));
    await createOrReuse(() => client.createContext(context));
    await createOrReuse(() => client.createWorkflow(workflow));
    await createOrReuse(() => client.createCapability(capability));

    const execution = await client.run(intent);
    const status = execution.receipt.status;
    const receiptId = execution.receipt.receipt_id;
    const feedbackResult = await client.submitFeedback(feedback(String(receiptId)));
    const signals = await client.learningSignals(String(receiptId));
    const feedbackAccepted = feedbackResult.ok === true;
    const learningSignalEmitted = signals.length > 0;

    console.log(`API execution status: ${status}`);
    console.log(`API receipt generated: ${receiptId}`);
    console.log(`API feedback accepted: ${feedbackAccepted ? "yes" : "no"}`);
    console.log(`API learning signal emitted: ${learningSignalEmitted ? "yes" : "no"}`);
  } finally {
    await closeServer(server);
  }
}

async function createOrReuse(create: () => Promise<unknown>): Promise<void> {
  try {
    await create();
  } catch (error) {
    if (error instanceof LaelApiError && error.payload.error.code === "duplicate_resource") {
      return;
    }
    throw error;
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
