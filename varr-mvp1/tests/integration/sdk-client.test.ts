import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApiServer } from "../../packages/api/src/server.ts";
import { createMemoryRepositories } from "../../packages/core/src/storage/memory.repository.ts";
import { LaelApiError, LaelClient } from "../../packages/sdk-js/src/client.ts";
import { agent } from "../helpers.ts";

test("SDK preserves structured API error payloads", async () => {
  await withClient(async (client) => {
    await client.createAgent(agent());

    await assert.rejects(
      () => client.createAgent(agent()),
      (error) => {
        assert.ok(error instanceof LaelApiError);
        assert.equal(error.status, 409);
        assert.equal(error.payload.error.code, "duplicate_resource");
        return true;
      }
    );
  });
});

async function withClient(run: (client: LaelClient) => Promise<void>): Promise<void> {
  const server = createApiServer(createMemoryRepositories());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  try {
    await run(new LaelClient(`http://127.0.0.1:${address.port}`));
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}
