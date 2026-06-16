import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const repoRoot = new URL("../../../", import.meta.url);
const varrRoot = new URL("../../", import.meta.url);

test("project readiness documents the supported Node runtime and API demo", async () => {
  const rootNodeVersion = (await readFile(new URL(".nvmrc", repoRoot), "utf8")).trim();
  assert.equal(rootNodeVersion, "24");

  const varrNodeVersion = (await readFile(new URL(".nvmrc", varrRoot), "utf8")).trim();
  assert.equal(varrNodeVersion, "24");

  const packageJson = JSON.parse(await readFile(new URL("package.json", varrRoot), "utf8")) as {
    dependencies: Record<string, string>;
    engines: Record<string, string>;
    scripts: Record<string, string>;
  };
  assert.equal(packageJson.scripts["demo:api"], "node --experimental-strip-types scripts/demo-api.ts");
  assert.equal(packageJson.engines.node, ">=20 <27");
  assert.match(packageJson.dependencies["better-sqlite3"], /^\^12\./);
});

test("CI runs the VARR API integration and API demo checks", async () => {
  const workflow = await readFile(new URL(".github/workflows/ci.yml", repoRoot), "utf8");

  assert.match(workflow, /varr-mvp1:/);
  assert.match(workflow, /node26-compatibility:/);
  assert.match(workflow, /node-version:\s*26/);
  assert.match(workflow, /working-directory:\s*varr-mvp1/);
  assert.match(workflow, /pnpm test/);
  assert.match(workflow, /pnpm demo:api/);
});
