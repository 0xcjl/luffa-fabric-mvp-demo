# Architecture

LAEL MVP1 is a sidecar runtime over Luffa Core concepts. It keeps core business definitions as resources and pushes all execution through `RuntimeOrchestrator`.

Runtime flow:

```text
Resolve Agent
-> Validate Agent Status
-> Load Workflow
-> Classify Critical Risk
-> Load Context
-> Check Context Boundary
-> Validate Capability
-> Apply Approval Gate
-> Execute via Adapter
-> Generate ExecutionReceipt
-> Accept Feedback
-> Emit LearningSignal
```

Adapters implement `ExecutionAdapter`, but each adapter must receive a runtime authorization token from `ExecutionRunner`. The token is created only inside the runner used by the orchestrator after checks pass.

Repositories are abstracted behind interfaces in `packages/core/src/storage`. MVP1 supports memory repositories for ephemeral tests, JSON snapshots for lightweight demos, and SQLite JSON repositories for local long-running API verification.
