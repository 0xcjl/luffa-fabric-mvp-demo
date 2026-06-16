import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApiServer } from "../../packages/api/src/server.ts";
import { createMemoryRepositories } from "../../packages/core/src/storage/memory.repository.ts";
import { agent, capability, context, workflow, intent } from "../helpers.ts";

type JsonResponse<T> = {
  status: number;
  payload: T;
};

type RunResponse = {
  receipt: {
    receipt_id: string;
    status: string;
    risk: {
      approval_required: boolean;
      level: string;
    };
    summary: string;
  };
};

type FeedbackResponse = {
  ok: boolean;
  reason?: string;
  learning_signal?: {
    signal_id: string;
    receipt_id: string;
  };
};

type LearningSignal = {
  signal_id: string;
  receipt_id: string;
};

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    status: number;
    method: string;
    path: string;
    details?: Record<string, unknown>;
  };
  receipt?: {
    receipt_id: string;
    status: string;
    summary: string;
  };
};

test("standard API routes run the full trusted execution loop", async () => {
  await withApi(async (baseUrl) => {
    const openapi = await getJson<{ paths: Record<string, unknown> }>(baseUrl, "/openapi.json");
    assert.equal(openapi.status, 200);
    assert.ok(openapi.payload.paths["/v1/agents"]);

    const createdAgent = await postJson<Record<string, unknown>>(baseUrl, "/v1/agents", agent());
    assert.equal(createdAgent.status, 200);
    assert.equal(createdAgent.payload.agent_id, "did:luffa:agent:community-summary-001");

    const createdCapability = await postJson<Record<string, unknown>>(baseUrl, "/v1/capabilities", capability());
    assert.equal(createdCapability.status, 200);
    assert.equal(createdCapability.payload.capability_id, "cap_community_read_001");

    const createdContext = await postJson<Record<string, unknown>>(baseUrl, "/v1/contexts", context());
    assert.equal(createdContext.status, 200);
    assert.equal(createdContext.payload.context_id, "ctx_community_123_public");

    const createdWorkflow = await postJson<Record<string, unknown>>(baseUrl, "/v1/workflows", workflow());
    assert.equal(createdWorkflow.status, 200);
    assert.equal(createdWorkflow.payload.workflow_id, "wf_community_summary_001");

    const execution = await postJson<RunResponse>(baseUrl, "/v1/execution/run", intent());
    assert.equal(execution.status, 200);
    assert.equal(execution.payload.receipt.receipt_id, "receipt_001");
    assert.equal(execution.payload.receipt.status, "success");

    const receipt = await getJson<Record<string, unknown>>(baseUrl, "/v1/execution/receipts/receipt_001");
    assert.equal(receipt.status, 200);
    assert.equal(receipt.payload.status, "success");

    const feedback = await postJson<FeedbackResponse>(baseUrl, "/v1/feedback", feedbackResource("receipt_001"));
    assert.equal(feedback.status, 200);
    assert.equal(feedback.payload.ok, true);
    assert.equal(feedback.payload.learning_signal?.signal_id, "learn_001");

    const signals = await getJson<LearningSignal[]>(baseUrl, "/v1/learning/signals?receipt_id=receipt_001");
    assert.equal(signals.status, 200);
    assert.equal(signals.payload.length, 1);
    assert.equal(signals.payload[0]?.receipt_id, "receipt_001");
  });
});

test("standard API routes expose runtime safety decisions", async () => {
  await withSeededApi({ includeCapability: false }, async (baseUrl) => {
    const execution = await postJson<ApiErrorResponse>(baseUrl, "/v1/execution/run", intent());
    assert.equal(execution.status, 403);
    assert.equal(execution.payload.error.code, "execution_denied");
    assert.equal(execution.payload.error.status, 403);
    assert.equal(execution.payload.error.path, "/v1/execution/run");
    assert.equal(execution.payload.receipt?.status, "denied");
    assert.match(execution.payload.receipt?.summary ?? "", /Capability denied/);
  });

  await withSeededApi({
    workflowOverride: {
      steps: [
        { id: "resolve_context", action: "read", resource: "luffa://community/999/channel/public" },
        { id: "summarize", action: "summarize" }
      ]
    }
  }, async (baseUrl) => {
    const execution = await postJson<ApiErrorResponse>(baseUrl, "/v1/execution/run", intent({ requested_actions: ["read", "summarize"] }));
    assert.equal(execution.status, 403);
    assert.equal(execution.payload.error.code, "execution_denied");
    assert.equal(execution.payload.receipt?.status, "denied");
    assert.match(execution.payload.receipt?.summary ?? "", /Context boundary violation/);
  });

  await withSeededApi({}, async (baseUrl) => {
    const execution = await postJson<ApiErrorResponse>(baseUrl, "/v1/execution/run", intent({ requested_actions: ["export_private_key"] }));
    assert.equal(execution.status, 403);
    assert.equal(execution.payload.error.code, "execution_denied");
    assert.equal(execution.payload.receipt?.status, "denied");
  });

  await withSeededApi({
    capabilityOverride: { actions: ["read", "publish"] },
    workflowOverride: {
      steps: [
        { id: "resolve_context", action: "read", resource: "luffa://community/123/channel/public" },
        { id: "publish", action: "publish" }
      ],
      risk_profile: "high"
    }
  }, async (baseUrl) => {
    const execution = await postJson<RunResponse>(baseUrl, "/v1/execution/run", intent({ requested_actions: ["read", "publish"] }));
    assert.equal(execution.status, 202);
    assert.equal(execution.payload.receipt.status, "pending_approval");
    assert.equal(execution.payload.receipt.risk.approval_required, true);
  });

  await withApi(async (baseUrl) => {
    const feedback = await postJson<ApiErrorResponse>(baseUrl, "/v1/feedback", feedbackResource("receipt_missing"));
    assert.equal(feedback.status, 404);
    assert.equal(feedback.payload.error.code, "receipt_not_found");
    assert.equal(feedback.payload.error.path, "/v1/feedback");
  });
});

test("missing API routes return method and path diagnostics", async () => {
  await withApi(async (baseUrl) => {
    const missing = await getJson<ApiErrorResponse>(baseUrl, "/v1/unknown");
    assert.equal(missing.status, 404);
    assert.equal(missing.payload.error.code, "not_found");
    assert.equal(missing.payload.error.method, "GET");
    assert.equal(missing.payload.error.path, "/v1/unknown");
  });
});

test("API returns conflict errors for duplicate resources", async () => {
  await withApi(async (baseUrl) => {
    await postJson(baseUrl, "/v1/agents", agent());
    const duplicate = await postJson<ApiErrorResponse>(baseUrl, "/v1/agents", agent());
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.payload.error.code, "duplicate_resource");
    assert.equal(duplicate.payload.error.status, 409);
  });
});

async function withSeededApi(
  options: {
    includeCapability?: boolean;
    capabilityOverride?: Parameters<typeof capability>[0];
    workflowOverride?: Parameters<typeof workflow>[0];
  },
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  await withApi(async (baseUrl) => {
    await postJson(baseUrl, "/v1/agents", agent());
    await postJson(baseUrl, "/v1/contexts", context());
    await postJson(baseUrl, "/v1/workflows", workflow(options.workflowOverride));
    if (options.includeCapability ?? true) {
      await postJson(baseUrl, "/v1/capabilities", capability(options.capabilityOverride));
    }
    await run(baseUrl);
  });
}

async function withApi(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = createApiServer(createMemoryRepositories());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

async function getJson<T>(baseUrl: string, path: string): Promise<JsonResponse<T>> {
  return requestJson<T>(baseUrl, path);
}

async function postJson<T>(baseUrl: string, path: string, body: unknown): Promise<JsonResponse<T>> {
  return requestJson<T>(baseUrl, path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function requestJson<T>(baseUrl: string, path: string, init?: RequestInit): Promise<JsonResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payload = await response.json() as T;
  return { status: response.status, payload };
}

function feedbackResource(receiptId: string) {
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
