# Quickstart

Run the full local demo:

```bash
pnpm demo
```

Use Node.js 24 LTS as the default local verification runtime. The repository
includes `.nvmrc` files so version managers and CI use the same baseline. Node
26 is covered by a separate compatibility check.

If Corepack cannot launch the pinned package manager on your local Node runtime, run the same commands through `npx`:

```bash
npx pnpm@11.1.3 demo
```

Expected end state:

```text
Execution status: success
Receipt generated: receipt_001
Feedback accepted: yes
Learning signal emitted: yes
Private key exposure: no
Context boundary respected: yes
```

State is stored in `.lael/state.json` for CLI demos.

Run the same trusted execution loop through the HTTP API:

```bash
pnpm demo:api
```

Start the API with in-memory state:

```bash
pnpm api
```

Use a lightweight JSON snapshot for demo persistence:

```bash
LAEL_STORAGE_DRIVER=snapshot LAEL_STATE_FILE=.lael/api-state.json pnpm api
```

Use SQLite for local long-running service verification:

```bash
LAEL_STORAGE_DRIVER=sqlite LAEL_SQLITE_PATH=.lael/varr.db pnpm api
```

Run the API demo against SQLite:

```bash
LAEL_STORAGE_DRIVER=sqlite LAEL_SQLITE_PATH=.lael/varr.db pnpm demo:api
```
