import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApiServer } from "../../packages/api/src/server.ts";
import { createSnapshotRepositories } from "../../packages/api/src/persistence.ts";
import type { LaelRepositories } from "../../packages/core/src/storage/repository.interface.ts";
import { agent, capability, context, ids, workflow } from "../helpers.ts";

test("API state can be reloaded from an opt-in snapshot file after restart", async () => {
  const stateDir = await mkdtemp(join(tmpdir(), "lael-api-state-"));
  const stateFile = join(stateDir, "state.json");

  try {
    const first = await createSnapshotRepositories(stateFile);
    await withApi(first.repositories, first.persistSnapshot, async (baseUrl) => {
      await postJson(baseUrl, "/v1/agents", agent());
      await postJson(baseUrl, "/v1/contexts", context());
      await postJson(baseUrl, "/v1/workflows", workflow());
      await postJson(baseUrl, "/v1/capabilities", capability());
    });

    const second = await createSnapshotRepositories(stateFile);
    await withApi(second.repositories, second.persistSnapshot, async (baseUrl) => {
      const persistedAgent = await getJson<Record<string, unknown>>(baseUrl, `/v1/agents/${encodeURIComponent(ids.agent)}`);
      assert.equal(persistedAgent.status, 200);
      assert.equal(persistedAgent.payload.agent_id, ids.agent);

      const persistedCapability = await getJson<Record<string, unknown>>(baseUrl, "/v1/capabilities/cap_community_read_001");
      assert.equal(persistedCapability.status, 200);
      assert.equal(persistedCapability.payload.capability_id, "cap_community_read_001");
    });

    const snapshot = JSON.parse(await readFile(stateFile, "utf8")) as {
      agents: unknown[];
      capabilities: unknown[];
      contexts: unknown[];
      workflows: unknown[];
    };
    assert.equal(snapshot.agents.length, 1);
    assert.equal(snapshot.capabilities.length, 1);
    assert.equal(snapshot.contexts.length, 1);
    assert.equal(snapshot.workflows.length, 1);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

async function withApi(
  repositories: LaelRepositories,
  persistSnapshot: () => Promise<void>,
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = createApiServer(repositories, { persistSnapshot });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await closeServer(server);
  }
}

async function getJson<T>(baseUrl: string, path: string): Promise<{ status: number; payload: T }> {
  return requestJson<T>(baseUrl, path);
}

async function postJson<T>(baseUrl: string, path: string, body: unknown): Promise<{ status: number; payload: T }> {
  return requestJson<T>(baseUrl, path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function requestJson<T>(baseUrl: string, path: string, init?: RequestInit): Promise<{ status: number; payload: T }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payload = await response.json() as T;
  return { status: response.status, payload };
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}
