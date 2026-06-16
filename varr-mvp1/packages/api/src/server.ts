import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createMemoryRepositories } from "../../core/src/storage/memory.repository.ts";
import type { LaelRepositories } from "../../core/src/storage/repository.interface.ts";
import type { ExecutionReceipt } from "../../core/src/evidence/execution.receipt.ts";
import { ValidationError } from "../../core/src/schemas/index.ts";
import { createSqliteRepositories } from "../../core/src/storage/sqlite.repository.ts";
import { createOpenApiSpec } from "./openapi.ts";
import { createSnapshotRepositories } from "./persistence.ts";
import { handleAgentRoute } from "./routes/agents.ts";
import { handleCapabilityRoute } from "./routes/capabilities.ts";
import { handleContextRoute } from "./routes/contexts.ts";
import { handleWorkflowRoute } from "./routes/workflows.ts";
import { handleExecutionRoute } from "./routes/executions.ts";
import { handleFeedbackRoute } from "./routes/feedback.ts";
import { handleLearningRoute } from "./routes/learning.ts";

export type ApiServerOptions = {
  persistSnapshot?: () => Promise<void>;
};

export type ApiState = {
  repositories: LaelRepositories;
  persistSnapshot?: () => Promise<void>;
};

export type ApiEnvironment = {
  LAEL_STORAGE_DRIVER?: string;
  LAEL_STATE_FILE?: string;
  LAEL_SQLITE_PATH?: string;
};

export function createApiServer(repositories: LaelRepositories = createMemoryRepositories(), options: ApiServerOptions = {}) {
  return createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      const parts = url.pathname.split("/").filter(Boolean);
      const body = await readJsonBody(request);
      const result = await dispatch(method, parts, body, url, repositories);

      if (result === undefined) {
        writeError(response, method, url.pathname, 404, "not_found", `Route not found: ${url.pathname}`);
        return;
      }

      const apiResponse = toApiResponse(result, method, url.pathname);
      if (method !== "GET" && options.persistSnapshot) {
        await options.persistSnapshot();
      }

      writeJson(response, apiResponse.status, apiResponse.payload);
    } catch (error) {
      const apiError = classifyError(error, method, url.pathname);
      writeJson(response, apiError.status, apiError.payload);
    }
  });
}

export async function createApiState(env: ApiEnvironment = process.env): Promise<ApiState> {
  const driver = env.LAEL_STORAGE_DRIVER ?? (env.LAEL_STATE_FILE ? "snapshot" : "memory");
  if (driver === "memory") {
    return { repositories: createMemoryRepositories() };
  }
  if (driver === "snapshot") {
    if (!env.LAEL_STATE_FILE) {
      throw new Error("LAEL_STATE_FILE is required when LAEL_STORAGE_DRIVER=snapshot");
    }
    return createSnapshotRepositories(env.LAEL_STATE_FILE);
  }
  if (driver === "sqlite") {
    if (!env.LAEL_SQLITE_PATH) {
      throw new Error("LAEL_SQLITE_PATH is required when LAEL_STORAGE_DRIVER=sqlite");
    }
    return { repositories: createSqliteRepositories(env.LAEL_SQLITE_PATH) };
  }
  throw new Error(`Unsupported LAEL_STORAGE_DRIVER: ${driver}`);
}

async function dispatch(method: string, parts: string[], body: unknown, url: URL, repositories: LaelRepositories): Promise<unknown | undefined> {
  if (method === "GET" && parts.length === 1 && parts[0] === "openapi.json") {
    return createOpenApiSpec();
  }
  if (parts[0] !== "v1") {
    return undefined;
  }

  const resource = parts[1];
  if (resource === "agents") {
    return handleAgentRoute(method, parts, body, repositories);
  }
  if (resource === "capabilities") {
    return handleCapabilityRoute(method, parts, body, repositories);
  }
  if (resource === "contexts") {
    return handleContextRoute(method, parts, body, repositories);
  }
  if (resource === "workflows") {
    return handleWorkflowRoute(method, parts, body, repositories);
  }
  if (resource === "execution") {
    return handleExecutionRoute(method, parts, body, repositories);
  }
  if (resource === "feedback") {
    return handleFeedbackRoute(method, parts, body, repositories);
  }
  if (resource === "learning") {
    return handleLearningRoute(method, parts, url.searchParams.get("receipt_id"), repositories);
  }
  return undefined;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  if (request.method === "GET") {
    return undefined;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : undefined;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(payload, null, 2));
}

function writeError(response: ServerResponse, method: string, path: string, status: number, code: string, message: string, details: Record<string, unknown> = {}): void {
  writeJson(response, status, createErrorPayload(method, path, status, code, message, details));
}

function toApiResponse(result: unknown, method: string, path: string): { status: number; payload: unknown } {
  if (isRuntimeResult(result)) {
    const { receipt } = result;
    if (receipt.status === "success") {
      return { status: 200, payload: result };
    }
    if (receipt.status === "pending_approval") {
      return { status: 202, payload: result };
    }

    const status = receipt.status === "failed" ? 502 : receipt.status === "rejected" ? 422 : 403;
    return {
      status,
      payload: createErrorPayload(method, path, status, `execution_${receipt.status}`, receipt.summary, {
        receipt_id: receipt.receipt_id,
        risk_level: receipt.risk.level
      }, receipt)
    };
  }
  if (isFeedbackFailure(result)) {
    return {
      status: 404,
      payload: createErrorPayload(method, path, 404, result.reason, `Feedback rejected: ${result.reason}`)
    };
  }
  return { status: 200, payload: result };
}

function classifyError(error: unknown, method: string, path: string): { status: number; payload: unknown } {
  if (error instanceof SyntaxError) {
    return {
      status: 400,
      payload: createErrorPayload(method, path, 400, "invalid_json", "Request body must be valid JSON")
    };
  }
  if (error instanceof ValidationError) {
    return {
      status: 400,
      payload: createErrorPayload(method, path, 400, "validation_error", error.message, { issues: error.issues })
    };
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  if (/subject agent not found/.test(message)) {
    return { status: 422, payload: createErrorPayload(method, path, 422, "invalid_reference", message) };
  }
  if (/already exists/.test(message)) {
    return { status: 409, payload: createErrorPayload(method, path, 409, "duplicate_resource", message) };
  }
  if (/not found/.test(message)) {
    return { status: 404, payload: createErrorPayload(method, path, 404, "resource_not_found", message) };
  }
  return { status: 500, payload: createErrorPayload(method, path, 500, "internal_error", message) };
}

function createErrorPayload(
  method: string,
  path: string,
  status: number,
  code: string,
  message: string,
  details: Record<string, unknown> = {},
  receipt?: ExecutionReceipt
): Record<string, unknown> {
  return {
    error: {
      code,
      message,
      status,
      method,
      path,
      details
    },
    ...(receipt ? { receipt } : {})
  };
}

function isRuntimeResult(result: unknown): result is { receipt: ExecutionReceipt; output?: unknown } {
  return typeof result === "object" && result !== null && "receipt" in result;
}

function isFeedbackFailure(result: unknown): result is { ok: false; reason: string } {
  return typeof result === "object"
    && result !== null
    && "ok" in result
    && (result as { ok: unknown }).ok === false
    && "reason" in result
    && typeof (result as { reason: unknown }).reason === "string";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startApiServer().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

async function startApiServer(): Promise<void> {
  const state = await createApiState(process.env);
  const port = Number(process.env.PORT ?? 8787);
  createApiServer(state.repositories, { persistSnapshot: state.persistSnapshot }).listen(port, () => {
    console.log(`LAEL MVP1 API listening on http://localhost:${port}`);
  });
}
