import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteRepositories } from "../../packages/core/src/storage/sqlite.repository.ts";
import { agent, capability, context, feedbackResource, ids, intent, workflow } from "../helpers.ts";
import { RuntimeOrchestrator } from "../../packages/core/src/runtime/runtime.orchestrator.ts";
import { FeedbackProcessor } from "../../packages/core/src/runtime/feedback.processor.ts";
import { LearningSignalEmitter } from "../../packages/core/src/runtime/learning.signal.emitter.ts";

test("SQLite repositories persist resources and evidence across restarts", async () => {
  const dbPath = join(await mkdtemp(join(tmpdir(), "lael-sqlite-")), "varr.db");

  const first = createSqliteRepositories(dbPath);
  await first.agents.create(agent());
  await first.contexts.create(context());
  await first.workflows.create(workflow());
  await first.capabilities.create(capability());
  const execution = await new RuntimeOrchestrator({ repositories: first }).run(intent());
  assert.equal(execution.receipt.status, "success");
  const feedback = await new FeedbackProcessor(
    first.feedback,
    first.receipts,
    new LearningSignalEmitter(first.learningSignals, first.contexts)
  ).submit(feedbackResource("receipt_001"));
  assert.equal(feedback.ok, true);

  const second = createSqliteRepositories(dbPath);
  assert.equal((await second.agents.get(ids.agent))?.agent_id, ids.agent);
  assert.equal((await second.capabilities.get("cap_community_read_001"))?.capability_id, "cap_community_read_001");
  assert.equal((await second.contexts.get(ids.context))?.context_id, ids.context);
  assert.equal((await second.workflows.get(ids.workflow))?.workflow_id, ids.workflow);
  assert.equal((await second.receipts.get("receipt_001"))?.status, "success");
  assert.equal((await second.feedback.listByReceipt("receipt_001")).length, 1);
  assert.equal((await second.learningSignals.listByReceipt("receipt_001")).length, 1);
});
