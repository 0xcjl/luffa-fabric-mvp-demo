import { execFile } from "node:child_process";
import { join } from "node:path";

export type QaItemStatus = "pending" | "running" | "pass" | "fail";

export type QaCheckDefinition = {
  id: string;
  label: string;
  command: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
  env?: Record<string, string>;
};

export type QaRunItem = {
  id: string;
  label: string;
  status: QaItemStatus;
  durationMs: number;
  summary: string;
};

export type QaRun = {
  runId: string;
  status: "running" | "pass" | "fail";
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  items: QaRunItem[];
};

export type QaCommandResult = {
  exitCode: number;
  output: string;
};

export type QaCommandExecutor = (check: QaCheckDefinition) => Promise<QaCommandResult>;

export type RunQaChecksOptions = {
  cwd: string;
  executor?: QaCommandExecutor;
};

export function qaRunnerEnabled(): boolean {
  return process.env.ENABLE_LAEL_QA_RUNNER === "true";
}

export function createQaRunId(): string {
  return `qa_${Date.now().toString(36)}`;
}

export function getQaChecks(cwd: string): QaCheckDefinition[] {
  const frontendCwd = join(cwd, "src", "frontend");
  const apiPort = process.env.LAEL_PORT ?? "3000";
  const frontendUrl = process.env.LAEL_FRONTEND_URL ?? "http://127.0.0.1:3001";
  const testEnv = {
    LAEL_SETTLEMENT_MODE: "mock",
    LAEL_ENABLE_MAINNET_EXECUTION: "false",
    LAEL_PUBLIC_CALLBACK_BASE_URL: "",
  };
  return [
    {
      id: "root-typecheck",
      label: "Root typecheck",
      command: "./node_modules/.bin/tsc",
      args: ["-p", "tsconfig.json", "--noEmit"],
      cwd,
      timeoutMs: 120_000,
    },
    {
      id: "root-vitest",
      label: "Root vitest",
      command: "./node_modules/.bin/vitest",
      args: ["run", "--config", "vitest.config.ts"],
      cwd,
      timeoutMs: 180_000,
      env: testEnv,
    },
    {
      id: "varr-tests",
      label: "VARR tests",
      command: process.execPath,
      args: ["--experimental-strip-types", "--test", "varr-mvp1/tests/**/*.test.ts"],
      cwd,
      timeoutMs: 180_000,
      env: testEnv,
    },
    {
      id: "frontend-build",
      label: "Frontend build",
      command: "npm",
      args: ["run", "build"],
      cwd: frontendCwd,
      timeoutMs: 240_000,
      env: { NEXT_PUBLIC_LAEL_API_URL: `http://127.0.0.1:${apiPort}` },
    },
    {
      id: "multichain-docs-smoke",
      label: "Multi-chain docs smoke",
      command: process.execPath,
      args: [
        "-e",
        `const { readFileSync } = require("node:fs"); const files = ["src/chains/registry.ts", "docs/LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md", "src/frontend/app/project-docs-data.ts"]; const body = files.map((file) => readFileSync(file, "utf8")).join("\\n"); for (const phrase of ["BNB_TESTNET", "SOLANA_DEVNET", "ENDLESS_TESTNET", "Luffa App QR"]) { if (!body.includes(phrase)) throw new Error("missing " + phrase); } console.log("Multi-chain docs smoke passed");`,
      ],
      cwd,
      timeoutMs: 30_000,
    },
    {
      id: "api-smoke",
      label: "API smoke test",
      command: process.execPath,
      args: [
        "-e",
        `fetch("http://127.0.0.1:${apiPort}/v2/chains").then(async r => { if (!r.ok) throw new Error(String(r.status)); const body = await r.text(); if (!body.includes("chains")) throw new Error("missing chains"); console.log("API smoke passed"); })`,
      ],
      cwd,
      timeoutMs: 30_000,
    },
    {
      id: "frontend-page-smoke",
      label: "Frontend page smoke test",
      command: process.execPath,
      args: [
        "-e",
        `fetch("${frontendUrl}").then(async r => { if (!r.ok) throw new Error(String(r.status)); const body = await r.text(); if (body.includes("Application error: a client-side exception")) throw new Error("client exception page"); if (!body.includes("Execution Loop Console") || !body.includes("Luffa Fabric Execution Loop")) throw new Error("missing app shell"); const stylesheets = [...body.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)].map(m => m[1]); if (stylesheets.length === 0) throw new Error("missing stylesheet"); const base = new URL("${frontendUrl}"); for (const href of stylesheets) { const url = new URL(href, base); const css = await fetch(url); if (!css.ok) throw new Error("stylesheet failed " + css.status + " " + url.pathname); } console.log("Frontend smoke passed"); })`,
      ],
      cwd,
      timeoutMs: 30_000,
    },
  ];
}

export async function runQaChecks(options: RunQaChecksOptions): Promise<QaRun> {
  const startedAtMs = Date.now();
  const run: QaRun = {
    runId: createQaRunId(),
    status: "running",
    startedAt: new Date(startedAtMs).toISOString(),
    items: [],
  };
  const executor = options.executor ?? defaultExecutor;

  for (const check of getQaChecks(options.cwd)) {
    const itemStartedAt = Date.now();
    const result = await executor(check);
    run.items.push({
      id: check.id,
      label: check.label,
      status: result.exitCode === 0 ? "pass" : "fail",
      durationMs: Date.now() - itemStartedAt,
      summary: summarizeOutput(result.output),
    });
  }

  run.status = run.items.every((item) => item.status === "pass") ? "pass" : "fail";
  run.finishedAt = new Date().toISOString();
  run.durationMs = Date.now() - startedAtMs;
  return run;
}

async function defaultExecutor(check: QaCheckDefinition): Promise<QaCommandResult> {
  return new Promise((resolve) => {
    execFile(
      check.command,
      check.args,
      {
        cwd: check.cwd,
        env: { ...process.env, ...(check.env ?? {}) },
        timeout: check.timeoutMs,
        maxBuffer: 2 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const output = `${stdout}${stderr}`.trim();
        if (error && typeof error === "object" && "code" in error) {
          const code = (error as { code?: number | string }).code;
          resolve({ exitCode: typeof code === "number" ? code : 1, output });
          return;
        }
        resolve({ exitCode: error ? 1 : 0, output });
      },
    );
  });
}

function summarizeOutput(output: string): string {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return "No output";
  }
  return lines.slice(-8).join("\n").slice(0, 1800);
}
