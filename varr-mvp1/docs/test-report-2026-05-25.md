# VARR MVP1 Local Test Report - 2026-05-25

## Scope

This report covers the local VARR MVP1 trusted execution loop only. It does not cover real wallet signing, RPC credentials, testnet funds, on-chain settlement, or Luffa production integration.

Repository tested:

- Local path: `/Users/xyz/Documents/luffa-fabric`
- Base commit: `2e38704`
- Fork target: `0xcjl/luffa-fabric-test`

## Findings

The CLI runtime path was already healthy: the demo registered the community summary agent, granted capability, created context and workflow resources, generated `receipt_001`, accepted feedback, and emitted `learn_001`.

The HTTP API had a route dispatch mismatch. OpenAPI and the SDK advertised standard paths such as `POST /v1/agents` and `POST /v1/execution/run`, but the server only reached handlers when an extra path segment was present, for example `/v1/agents/_`. This made the documented API fail with `not_found`.

The 404 response was also too sparse for developer debugging because it only returned `{"error":"not_found"}` without the method or path.

## Feedback Items and Outcome

| Priority | Item | Outcome | Notes |
| --- | --- | --- | --- |
| P0 | Documented API routes returned `not_found` | Fixed | `POST /v1/agents`, `POST /v1/execution/run`, and related OpenAPI paths now work directly. |
| P1 | OpenAPI/SDK and server route dispatch drifted | Fixed | Added API integration tests so the documented routes are exercised by the test suite. |
| P1 | 404 responses were hard to debug | Fixed | Missing routes now return `error`, `method`, and `path`. |
| P1 | API layer lacked full-loop regression coverage | Fixed | Added HTTP-level coverage for resource creation, execution, receipt lookup, feedback, and learning signal retrieval. |
| P1 | API layer lacked negative safety coverage | Fixed | Added HTTP-level coverage for missing capability, cross-namespace context access, critical action denial, high-risk approval gating, and invalid receipt feedback. |
| P2 | Corepack failed to launch pinned pnpm on local Node 26 | Documented | `npx pnpm@11.1.3` works as a local fallback. |
| P2 | Optional `better-sqlite3@11.10.0` failed to build on Node 26 | Not fixed in this patch | Existing tests pass because this optional native dependency is not required by verified paths. Recommend validating the supported Node LTS version or bumping the optional dependency separately. |

## Fixes

- Aligned API dispatch with the documented OpenAPI and SDK paths.
- Added route-level API integration coverage for the full VARR HTTP loop.
- Added API negative tests for missing capability, cross-namespace context access, critical actions, high-risk approval gating, and invalid receipt feedback.
- Added method and path diagnostics to 404 responses.
- Documented the `npx pnpm@11.1.3` fallback for local environments where Corepack cannot launch the pinned pnpm version.

## Verification

Commands used:

```bash
rtk npx pnpm@11.1.3 test
rtk npx pnpm@11.1.3 demo
cd ..
rtk npx pnpm@11.1.3 test
```

Additional manual API smoke target:

```text
GET  /openapi.json
POST /v1/agents
POST /v1/capabilities
POST /v1/contexts
POST /v1/workflows
POST /v1/execution/run
GET  /v1/execution/receipts/receipt_001
POST /v1/feedback
GET  /v1/learning/signals?receipt_id=receipt_001
```

Expected key outputs:

- VARR tests: 22 passed
- Execution receipt: `receipt_001`
- Execution status: `success`
- Feedback accepted: `true`
- Learning signal: `learn_001`
- High-risk publish path: `pending_approval`
- Critical action path: `denied`

Root Core Fabric extension check:

- Test files: 7 passed
- Tests: 74 passed
- Note: `better-sqlite3@11.10.0` is optional and failed to build from source on Node `v26.0.0` after no prebuilt binary was found. Existing Core Fabric tests still passed because the verified paths did not require that optional native module.

## Additional Tests Performed

Beyond the original VARR CLI loop, the following extra areas were tested:

- VARR HTTP API full loop using the documented standard paths.
- API negative security paths for authorization, context isolation, critical actions, approval gating, and feedback validation.
- Manual API smoke against a running local server on port `8787`.
- Root Core Fabric test suite, including chain registry, wallet, settlement adapters, execution ledger, security, integration, and MVP2 E2E coverage.

## Fixes Not Included

- No real wallet signing, RPC, testnet funds, or on-chain settlement fixes were attempted because they were outside the agreed scope.
- No Luffa production integration or SuperBox adapter was implemented because that belongs to the next phase.
- No `better-sqlite3` compatibility fix was made because it is optional, the test suite passed, and changing native dependency compatibility should be handled as a separate package/runtime support decision.

## Remaining Recommendations

- Add CI coverage for the VARR API integration tests so OpenAPI and route handlers cannot drift again.
- Add a scripted API demo command, for example `pnpm demo:api`, so external testers do not need to hand-write curl requests.
- Decide whether MVP1 API state should remain memory-only or expose an opt-in SQLite repository for restart persistence tests.
- Test root Core Fabric separately for wallet binding, mock settlement adapters, MCP server behavior, and frontend demo compatibility.
- Consider documenting the recommended Node version. Node 26 exposed both the Corepack/pnpm launch issue and the optional `better-sqlite3` build issue.
