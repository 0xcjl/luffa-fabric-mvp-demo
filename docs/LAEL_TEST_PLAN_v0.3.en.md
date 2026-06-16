# LAEL / Luffa Fabric Test Plan v0.3

## Test Goals

Validate four paths in the Unified Agent Runtime Fabric MVP:

| Group | Automated Tests | Manual Tests |
| --- | --- | --- |
| Off-chain Runtime | VARR runtime, capability, context, approval, receipt, learning tests | Run OpenClaw/Codex Stub summary and inspect receipt/learning |
| On-chain Transfer | wallet, payment-agent, settlement, ledger tests | Send a small Base Sepolia ETH transfer and inspect txHash/receipt |
| On-chain Trading/Swap | simulated swap intent, permission, risk block tests | Enter a swap request and confirm it only creates a proposal, not a real trade |
| Fiat / Proof Settlement | fiat-proof / invoice-proof record tests | Create a proof receipt and confirm no real payment occurs |
| Governance / AGT Adapter | AGT allow, deny, requires confirmation, degraded fallback, receipt metadata tests | Inspect Governance Source, AGT decision record, and Evidence disclosure in Runtime Agent |

## Automated Test Commands

### Root Type Check

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

Acceptance: exit code 0.

### Root Test Suite

```bash
./node_modules/.bin/vitest run --config vitest.config.ts
```

Acceptance: all test files pass, including docs, payment-agent, settlement, wallet, ledger, and security tests.

### VARR Tests

```bash
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
```

Acceptance: runtime, capability, context, approval, receipt, feedback, learning signal, and safety paths pass.

### Frontend Build

```bash
cd src/frontend
NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

Acceptance: Next.js build succeeds, with no type errors, build failures, or current-capability copy that still references WalletConnect / Project ID.

### Frontend/Backend Smoke Test

```bash
curl -sS -I http://127.0.0.1:3001/
curl -sS http://127.0.0.1:3000/v2/payment-agent/memory/did:luffa:user_001
```

Acceptance: page returns 200 and API returns JSON.

## Manual Acceptance Paths

### A. Off-chain Runtime

1. Open the MVP page.
2. Enter the Runtime Agent tab.
3. Select OpenClaw/Codex Stub.
4. Run public community summary.
5. Inspect Agent DID mapping.
6. Inspect permission decision.
7. Inspect Execution Receipt.
8. Submit feedback.
9. Inspect learning signal.

Failure paths:

- private context.
- cross namespace context.
- missing capability.
- high-risk publish.
- forbidden action.

### B. On-chain Transfer

1. Open the MVP page.
2. Enter the On-chain Value Agent tab.
3. Connect wallet and switch to Base Sepolia.
4. Select ETH.
5. Enter `Send 0.00001 ETH to Alice`.
6. Generate Proposal.
7. Sign Wallet Tx.
8. Approve & Record.
9. Inspect txHash, settlement record, and Execution Receipt.
10. Submit Feedback.
11. Enter second prompt and confirm memory helps without bypassing confirmation.

Failure paths:

- amount over limit.
- recipient not allowlisted.
- wrong chain.
- prompt injection / confirmation bypass.
- duplicate transfer.

### C. On-chain Trading/Swap

1. Enter the On-chain Value Agent tab.
2. Enter `Swap 0.0001 ETH to USDC on Base Sepolia`.
3. Generate simulated swap proposal.
4. Confirm permission decision.
5. Execute simulated receipt.
6. Confirm there is no real DEX trade and no wallet signing request.

Failure paths:

- asset denied.
- chain denied.
- amount exceeds limit.
- slippage exceeds limit.
- confirmation bypass.

### D. Fiat / Proof Settlement

1. Enter the Evidence / Learning tab.
2. Create a fiat-proof or invoice-proof.
3. Enter amount, currency, reference, and purpose.
4. Generate proof settlement record.
5. Inspect receipt/proof hash.
6. Confirm no real Stripe, bank, or on/off-ramp call occurs.

## Final Report Requirements

After final acceptance, produce a test summary:

- Automated commands and results.
- Manual paths and results.
- Uncovered risks.
- Current known limitations.
- Recommended next steps.

## Multi-chain Wallet Support Test Addendum

| Group | Automated Tests | Manual Tests |
| --- | --- | --- |
| BNB Testnet / OKX | chain registry, Payment Agent parser, EVM settlement receipt, wrong-chain policy block | Select BNB Testnet, click Add BNB to OKX, connect OKX, sign, and record txHash |
| Solana Devnet | Solana chain registry, Ed25519 wallet binding, SOL intent parser, Solana settlement signature record | Connect a Solana wallet, bind public key, create SOL proposal, sign, and inspect receipt |
| Endless Testnet / Luffa App | Endless chain registry, wallet-provided fullMessage verification, endless-native settlement, rejected authorization receipt | Use Luffa App / Endless SDK connect, signMessage, signAndSubmitTransaction; inspect failed evidence when authorization is rejected |
| OKX Endless Boundary | Documentation tests confirm Endless is not described as an EVM add-network path | Inspect Wallet Setup and confirm Endless prioritizes Luffa App / Endless SDK |
| Luffa App QR Next Phase | Documentation tests confirm QR session / callback / polling is listed as future-stage work | No standalone browser QR integration is claimed in the current MVP |
