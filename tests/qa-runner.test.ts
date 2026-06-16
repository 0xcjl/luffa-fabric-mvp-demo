import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildServer } from "../src/api/server.js";
import { runQaChecks } from "../src/qa-runner/index.js";

describe("local QA runner", () => {
  it("keeps the HTTP runner disabled unless explicitly enabled", async () => {
    const previous = process.env.ENABLE_LAEL_QA_RUNNER;
    delete process.env.ENABLE_LAEL_QA_RUNNER;
    const { app } = await buildServer({ path: ":memory:" });

    const response = await app.inject({
      method: "POST",
      url: "/v2/qa/runs",
      payload: { command: "echo unsafe" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      status: "disabled",
      message: "Local QA runner is disabled",
    });

    await app.close();
    if (previous === undefined) {
      delete process.env.ENABLE_LAEL_QA_RUNNER;
    } else {
      process.env.ENABLE_LAEL_QA_RUNNER = previous;
    }
  });

  it("runs only the fixed whitelist and returns itemized statuses", async () => {
    const seenCommands: string[] = [];
    const run = await runQaChecks({
      cwd: process.cwd(),
      executor: async (check) => {
        seenCommands.push(check.id);
        return {
          exitCode: check.id === "frontend-page-smoke" ? 1 : 0,
          output: `${check.label} output`,
        };
      },
    });

    expect(seenCommands).toEqual([
      "root-typecheck",
      "root-vitest",
      "varr-tests",
      "frontend-build",
      "multichain-docs-smoke",
      "api-smoke",
      "frontend-page-smoke",
    ]);
    expect(run.status).toBe("fail");
    expect(run.items).toHaveLength(7);
    expect(run.items[0]).toMatchObject({
      id: "root-typecheck",
      status: "pass",
      summary: "Root typecheck output",
    });
    expect(run.items[6]).toMatchObject({
      id: "frontend-page-smoke",
      status: "fail",
      summary: "Frontend page smoke test output",
    });
  });

  it("keeps frontend build output separate from the live dev server output", async () => {
    const frontendPackage = JSON.parse(readFileSync("src/frontend/package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(frontendPackage.scripts.dev).toContain("NEXT_DIST_DIR=.next-live");
    expect(frontendPackage.scripts.build).toContain("NEXT_DIST_DIR=.next-build");

    const run = await runQaChecks({
      cwd: process.cwd(),
      executor: async (check) => {
        if (check.id === "root-vitest") {
          expect(check.env).toMatchObject({
            LAEL_SETTLEMENT_MODE: "mock",
            LAEL_ENABLE_MAINNET_EXECUTION: "false",
            LAEL_PUBLIC_CALLBACK_BASE_URL: "",
          });
        }
        if (check.id === "frontend-build") {
          expect(check.command).toBe("npm");
          expect(check.args).toEqual(["run", "build"]);
        }
        return {
          exitCode: 0,
          output: `${check.id} ok`,
        };
      },
    });

    expect(run.status).toBe("pass");
  });

  it("blocks forwarded public requests even when the local runner is enabled", async () => {
    const previous = process.env.ENABLE_LAEL_QA_RUNNER;
    process.env.ENABLE_LAEL_QA_RUNNER = "true";
    const { app } = await buildServer({ path: ":memory:" });

    const response = await app.inject({
      method: "POST",
      url: "/v2/qa/runs",
      headers: {
        "cf-connecting-ip": "203.0.113.10",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      status: "blocked",
      message: "Local QA runner only accepts localhost requests",
    });

    await app.close();
    if (previous === undefined) {
      delete process.env.ENABLE_LAEL_QA_RUNNER;
    } else {
      process.env.ENABLE_LAEL_QA_RUNNER = previous;
    }
  });
});
