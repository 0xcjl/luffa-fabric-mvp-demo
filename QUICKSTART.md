# Luffa Fabric MVP 2 Quickstart

Luffa Fabric is the temporary public name for the LAEL Phase 1 MVP 2 codebase. Existing `LAEL_*` environment variables and REST API paths remain compatible.

Completed by **Luffa AI Research Lab**.

## 1. Install and verify

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

This workspace can also run with Node package scripts:

```bash
node --run lint
node --run typecheck
node --run test
node --run build
```

## 2. Configure environment

```bash
cp .env.example .env
```

For local adapter tests, the default `mock://` RPC fallbacks are enough. For real chain verification, set:

- `BASE_RPC_URL`
- `SEPOLIA_RPC_URL`
- `POLYGON_RPC_URL`
- `SOLANA_RPC_URL`
- `WALLETCONNECT_PROJECT_ID`
- `USDC_BASE_SEPOLIA`

## 3. Start the API

```bash
pnpm start
```

Default server:

```text
http://127.0.0.1:3000
```

## 4. Run the MVP 2 flow

Unified Runtime Fabric v0.3 loops:

Off-chain Runtime Agent loop:

1. Use `varr-mvp1` resources to create an OpenClaw/Codex-style `AgentResource`
2. Run a public community summary through `RuntimeOrchestrator`
3. Confirm capability and context boundary checks
4. Read the `ExecutionReceipt`
5. Submit feedback and read the `LearningSignal`

On-chain Value Agent transfer loop:

1. `POST /v2/payment-agent/proposals`
2. Confirm the returned proposal is `allow_pending_human_confirmation`
3. `POST /v2/payment-agent/proposals/:proposalId/execute`
4. `POST /v2/payment-agent/receipts/:executionId/feedback`
5. `GET /v2/payment-agent/memory/:ownerRef`
6. Submit a second proposal such as `再给 Alice 发一次测试奖励`

Simulated swap loop:

1. `POST /v2/value-agent/swap-proposals`
2. Confirm the returned proposal is simulated and permission checked
3. `POST /v2/value-agent/swap-proposals/:proposalId/execute`
4. Confirm the receipt uses `resource-credit` and has no real txHash

Fiat / invoice proof loop:

1. `POST /v2/settlement/transfer`
2. Use rail `fiat-proof` or `invoice-proof`
3. Confirm the settlement record is completed with a proof reference and no external payment call

Core wallet and settlement API flow:

1. `POST /v2/wallet/connect`
2. Sign the returned message in Coinbase Wallet, MetaMask, OKX Wallet, WalletConnect, Phantom, or Luffa Wallet.
3. `POST /v2/wallet/verify`
4. Register an agent with `POST /v1/agents/register`
5. Create a scoped policy with `POST /v1/policies`
6. Invoke `luffa.create_task` through `POST /v1/agent/invoke`
7. Trigger or record settlement with `POST /v2/settlement/transfer`
8. Verify a transaction with `GET /v2/settlement/tx/:txHash`
9. Submit feedback with `POST /v1/executions/:executionId/feedback`

## 5. Frontend demo

```bash
cd src/frontend
pnpm install
pnpm dev
```

The demo expects the Luffa Fabric API at `http://127.0.0.1:3000`.
