import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { cloneJson } from "../schemas/index.ts";
import type { AgentResource, AgentPatch } from "../resources/agent.resource.ts";
import type { CapabilityGrant } from "../resources/capability.resource.ts";
import type { ContextResource } from "../resources/context.resource.ts";
import type { WorkflowResource } from "../resources/workflow.resource.ts";
import type { ExecutionReceipt } from "../evidence/execution.receipt.ts";
import type { FeedbackResource } from "../resources/feedback.resource.ts";
import type { LearningSignal } from "../resources/learning-signal.resource.ts";
import type {
  AgentRepository,
  CapabilityRepository,
  ContextRepository,
  FeedbackRepository,
  LaelRepositories,
  LearningSignalRepository,
  ReceiptRepository,
  WorkflowRepository
} from "./repository.interface.ts";

type SqliteRunResult = {
  changes: number;
};

type SqliteStatement = {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): SqliteRunResult;
};

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  pragma(sql: string): unknown;
};

type SqliteConstructor = new (path: string) => SqliteDatabase;
type StoredRow = {
  json: string;
};

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3") as SqliteConstructor;

class SqliteJsonRepository<T> {
  protected readonly db: SqliteDatabase;
  private readonly collection: string;
  private readonly idOf: (entity: T) => string;
  private readonly name: string;

  constructor(db: SqliteDatabase, collection: string, name: string, idOf: (entity: T) => string) {
    this.db = db;
    this.collection = collection;
    this.name = name;
    this.idOf = idOf;
  }

  async create(entity: T): Promise<T> {
    const id = this.idOf(entity);
    if (await this.get(id)) {
      throw new Error(`${this.name} already exists: ${id}`);
    }
    this.db.prepare("insert into records (collection, id, json) values (?, ?, ?)").run(
      this.collection,
      id,
      JSON.stringify(cloneJson(entity))
    );
    return cloneJson(entity);
  }

  async get(id: string): Promise<T | undefined> {
    const row = this.db.prepare("select json from records where collection = ? and id = ?").get(this.collection, id) as StoredRow | undefined;
    return row ? JSON.parse(row.json) as T : undefined;
  }

  async list(): Promise<T[]> {
    const rows = this.db.prepare("select json from records where collection = ? order by id").all(this.collection) as StoredRow[];
    return rows.map((row) => JSON.parse(row.json) as T);
  }

  protected async replace(id: string, entity: T): Promise<T> {
    const result = this.db.prepare("update records set json = ? where collection = ? and id = ?").run(
      JSON.stringify(cloneJson(entity)),
      this.collection,
      id
    );
    if (result.changes === 0) {
      throw new Error(`${this.name} not found: ${id}`);
    }
    return cloneJson(entity);
  }
}

class SqliteAgentRepository extends SqliteJsonRepository<AgentResource> implements AgentRepository {
  constructor(db: SqliteDatabase) {
    super(db, "agents", "AgentResource", (agent) => agent.agent_id);
  }

  async update(id: string, patch: AgentPatch): Promise<AgentResource> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`AgentResource not found: ${id}`);
    }
    return this.replace(id, { ...existing, ...patch, updated_at: new Date().toISOString() });
  }

  async suspend(agentId: string): Promise<AgentResource> {
    return this.update(agentId, { status: "suspended" });
  }
}

class SqliteCapabilityRepository extends SqliteJsonRepository<CapabilityGrant> implements CapabilityRepository {
  constructor(db: SqliteDatabase) {
    super(db, "capabilities", "CapabilityGrant", (capability) => capability.capability_id);
  }

  async update(id: string, patch: Partial<CapabilityGrant>): Promise<CapabilityGrant> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`CapabilityGrant not found: ${id}`);
    }
    return this.replace(id, { ...existing, ...patch });
  }

  async findActiveBySubject(subject: string): Promise<CapabilityGrant[]> {
    const all = await this.list();
    const now = Date.now();
    return all.filter((capability) => {
      if (capability.subject !== subject || capability.status !== "active") {
        return false;
      }
      const expiresAt = capability.constraints.expires_at;
      return !expiresAt || Date.parse(expiresAt) > now;
    });
  }

  async revoke(capabilityId: string): Promise<CapabilityGrant> {
    return this.update(capabilityId, { status: "revoked" });
  }
}

class SqliteContextRepository extends SqliteJsonRepository<ContextResource> implements ContextRepository {
  constructor(db: SqliteDatabase) {
    super(db, "contexts", "ContextResource", (context) => context.context_id);
  }
}

class SqliteWorkflowRepository extends SqliteJsonRepository<WorkflowResource> implements WorkflowRepository {
  constructor(db: SqliteDatabase) {
    super(db, "workflows", "WorkflowResource", (workflow) => workflow.workflow_id);
  }
}

class SqliteReceiptRepository extends SqliteJsonRepository<ExecutionReceipt> implements ReceiptRepository {
  constructor(db: SqliteDatabase) {
    super(db, "receipts", "ExecutionReceipt", (receipt) => receipt.receipt_id);
  }
}

class SqliteFeedbackRepository extends SqliteJsonRepository<FeedbackResource> implements FeedbackRepository {
  constructor(db: SqliteDatabase) {
    super(db, "feedback", "FeedbackResource", (feedback) => feedback.feedback_id);
  }

  async listByReceipt(receiptId: string): Promise<FeedbackResource[]> {
    return (await this.list()).filter((feedback) => feedback.receipt_id === receiptId);
  }
}

class SqliteLearningSignalRepository extends SqliteJsonRepository<LearningSignal> implements LearningSignalRepository {
  constructor(db: SqliteDatabase) {
    super(db, "learningSignals", "LearningSignal", (signal) => signal.signal_id);
  }

  async listByReceipt(receiptId: string): Promise<LearningSignal[]> {
    return (await this.list()).filter((signal) => signal.receipt_id === receiptId);
  }
}

export function createSqliteRepositories(dbPath: string): LaelRepositories {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    create table if not exists records (
      collection text not null,
      id text not null,
      json text not null,
      primary key (collection, id)
    );
  `);

  return {
    agents: new SqliteAgentRepository(db),
    capabilities: new SqliteCapabilityRepository(db),
    contexts: new SqliteContextRepository(db),
    workflows: new SqliteWorkflowRepository(db),
    receipts: new SqliteReceiptRepository(db),
    feedback: new SqliteFeedbackRepository(db),
    learningSignals: new SqliteLearningSignalRepository(db)
  };
}
