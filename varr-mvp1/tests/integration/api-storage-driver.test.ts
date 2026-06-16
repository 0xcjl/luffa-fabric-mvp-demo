import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApiState } from "../../packages/api/src/server.ts";
import { agent, ids } from "../helpers.ts";

test("API supports memory, snapshot, and sqlite storage drivers", async () => {
  const memory = await createApiState({ LAEL_STORAGE_DRIVER: "memory" });
  await memory.repositories.agents.create(agent());
  assert.equal((await memory.repositories.agents.get(ids.agent))?.agent_id, ids.agent);

  const dir = await mkdtemp(join(tmpdir(), "lael-api-state-"));
  const snapshot = await createApiState({
    LAEL_STORAGE_DRIVER: "snapshot",
    LAEL_STATE_FILE: join(dir, "state.json")
  });
  await snapshot.repositories.agents.create(agent());
  await snapshot.persistSnapshot?.();
  const reloadedSnapshot = await createApiState({
    LAEL_STORAGE_DRIVER: "snapshot",
    LAEL_STATE_FILE: join(dir, "state.json")
  });
  assert.equal((await reloadedSnapshot.repositories.agents.get(ids.agent))?.agent_id, ids.agent);

  const sqlite = await createApiState({
    LAEL_STORAGE_DRIVER: "sqlite",
    LAEL_SQLITE_PATH: join(dir, "varr.db")
  });
  await sqlite.repositories.agents.create(agent());
  const reloadedSqlite = await createApiState({
    LAEL_STORAGE_DRIVER: "sqlite",
    LAEL_SQLITE_PATH: join(dir, "varr.db")
  });
  assert.equal((await reloadedSqlite.repositories.agents.get(ids.agent))?.agent_id, ids.agent);
});

test("API rejects invalid storage driver configuration", async () => {
  await assert.rejects(
    () => createApiState({ LAEL_STORAGE_DRIVER: "sqlite" }),
    /LAEL_SQLITE_PATH is required/
  );
  await assert.rejects(
    () => createApiState({ LAEL_STORAGE_DRIVER: "snapshot" }),
    /LAEL_STATE_FILE is required/
  );
  await assert.rejects(
    () => createApiState({ LAEL_STORAGE_DRIVER: "unknown" }),
    /Unsupported LAEL_STORAGE_DRIVER/
  );
});
