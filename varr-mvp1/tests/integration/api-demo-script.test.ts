import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const varrRoot = fileURLToPath(new URL("../../", import.meta.url));

test("API demo script runs the full API trusted execution loop", async () => {
  const result = await runNode(["--experimental-strip-types", "scripts/demo-api.ts"]);

  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /API execution status: success/);
  assert.match(result.stdout, /API receipt generated: receipt_001/);
  assert.match(result.stdout, /API feedback accepted: yes/);
  assert.match(result.stdout, /API learning signal emitted: yes/);
});

function runNode(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd: varrRoot });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}
