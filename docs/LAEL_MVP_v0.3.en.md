# LAEL / Luffa Fabric MVP Document v0.3

## MVP Title

**Unified Agent Runtime Fabric MVP: Off-chain Execution, On-chain Verifiability, On-chain Value Execution**

The MVP is not split into two products. It is one unified LAEL Runtime Fabric with two acceptance paths:

- Off-chain Agent Execution: prove that OpenClaw/Codex Stub agents can be identified, authorized, executed, traced, reviewed, and learned from.
- On-chain Value Execution: prove that transfer, settlement, trading/swap proposals, and fiat/invoice proofs can be permissioned, receipted, and fed into learning.

## MVP Scenario Matrix

| Path | MVP Scenario | Phase 1 Depth |
| --- | --- | --- |
| Off-chain Agent Execution | OpenClaw/Codex Stub reads public community context and generates a summary/report | Real runtime execution + receipt + learning; on-chain anchoring simulated first |
| On-chain Value Execution | Base Sepolia ETH/USDC transfer | Real wallet signature + txHash + receipt + feedback + learning |
| On-chain Trading/Swap | ETH -> USDC swap proposal | Proposal + permission + simulated receipt only; no real DEX |
| Fiat / On-off-ramp | invoice/payment proof | Proof record only; no Stripe/bank integration |

## Required Acceptance Capabilities

- Agent DID mapping.
- Permission decision card.
- Governance source: Luffa Native Policy / Microsoft AGT Adapter / Combined.
- Execution receipt.
- Trace / evidence digest.
- Settlement record.
- Feedback.
- Learning signal / memory.
- Success and failure paths.
- Safety boundaries: no automatic limit increase, no automatic recipient addition, no confirmation bypass, no automatic training export.

## User Story A: Off-chain Agent Execution

Michael selects an OpenClaw/Codex Stub Agent. The system maps this external agent to a `did:luffa:agent:*`.

Michael authorizes the agent to read a public community context and generate a summary/report.

LAEL executes:

1. Resolve Agent DID mapping.
2. Check capability: read, summarize, generate_receipt.
3. Check context boundary: public, same namespace, allowed subject.
4. Run through RuntimeOrchestrator.
5. Generate Execution Receipt.
6. Generate trace / evidence digest.
7. Submit feedback.
8. Emit learning signal.

Failure paths:

- Missing capability -> denied receipt.
- Private context -> denied receipt.
- Cross namespace -> denied receipt.
- High-risk publish -> pending approval receipt.
- Forbidden action -> denied before adapter execution.

AGT Adapter PoC:

- low-risk summary -> AGT `ALLOW` -> Luffa receipt metadata records the AGT decision record.
- destructive / private-context tool -> AGT `DENY` -> Luffa denied receipt.
- publish / delegate / high-risk tool -> AGT `REQUIRES_CONFIRMATION` -> no execution, human-confirmation boundary preserved.
- AGT unavailable -> fallback to Luffa Native Policy and record degraded evidence.

## User Story B: On-chain Value Execution / Transfer

Michael connects a wallet and switches to Base Sepolia. The system binds the owner DID to the wallet.

Michael asks the agent:

```text
Send 0.00001 ETH to Alice
```

LAEL executes:

1. Parse transfer intent.
2. Check recipient allowlist.
3. Check amount limit.
4. Check asset allowlist.
5. Check chain allowlist.
6. Require human confirmation.
7. User signs wallet transaction.
8. Record txHash and settlement record.
9. Generate a v0.2 receipt.
10. Submit feedback and update memory.

## User Story C: On-chain Trading/Swap Proposal

Michael enters:

```text
Swap 0.0001 ETH to USDC on Base Sepolia
```

Phase 1 does not execute a real DEX swap. The system generates a simulated swap proposal:

- parsed intent: fromAsset, toAsset, amount, chain, slippageBps, protocol.
- permission decision: allowed / blocked / pending human confirmation.
- simulated receipt: proves permission checks and simulated settlement record creation.

Failure paths:

- Amount exceeds limit.
- Asset is not allowlisted.
- Chain is not allowed.
- Slippage exceeds limit.
- Prompt attempts to bypass confirmation.

## User Story D: Fiat / Invoice Proof

Michael creates an invoice/payment proof for an agent service. The system does not connect to real Stripe or banks. It creates a proof settlement record:

- rail: fiat-proof or invoice-proof.
- amount: fiat amount.
- currency: USD or similar.
- reference: invoice id or payment proof id.
- status: simulated_completed.
- receipt: binds agent, owner, purpose, and proof hash.

This proves that fiat can enter LAEL as settlement proof without turning the MVP into a generic fiat payment product.

## Current Implementation Mapping

| Capability | Current Status |
| --- | --- |
| VARR runtime | Sidecar runtime, capability, context, receipt, and learning tests exist. |
| Payment Agent transfer | Base Sepolia ETH/USDC, BNB Testnet, Solana Devnet, and Endless Testnet / Luffa App proposal, wallet signing / app authorization, receipt, feedback, and memory exist. |
| Task Reward business flow | `businessAction=task_reward` proposal, wallet / Luffa App authorization, settlement receipt, feedback, and learning signal exist. |
| Settlement adapter | Luffa Points, EVM native, EVM ERC20, Solana native / SPL abstraction, and Endless native / Luffa App authorization abstraction exist. |
| Swap proposal | Simulated value-agent flow exists and does not connect to a real DEX. |
| Fiat/invoice proof | Proof settlement rails exist and do not connect to real Stripe, banks, or on/off-ramp providers. |
| Frontend dual-path demo | Execution Loop Console, Runtime Agent, On-chain Value Agent, Evidence / Learning, and Project Docs exist. |

## Multi-chain Wallet Support

| Network | MVP Depth | Wallet / Authorization Path | Notes |
| --- | --- | --- | --- |
| Base Sepolia / Base Mainnet | Sepolia supports real EVM wallet signature plus txHash receipt; Mainnet supports connection, proposal, and permission display only | MetaMask / OKX Wallet | Base Sepolia remains the default primary demo chain; Mainnet real execution is disabled by default. |
| BNB Testnet / BNB Mainnet | Testnet supports real EVM wallet signature plus txHash receipt; Mainnet supports connection, proposal, and permission display only | MetaMask / OKX Wallet | Frontend provides Add BNB Testnet to OKX action; Mainnet real execution is disabled by default. |
| Solana Devnet / Solana Mainnet | Devnet supports wallet binding plus signature receipt; Mainnet supports connection, proposal, and permission display only | Phantom / Solana Wallet | Current scope prioritizes SOL native; real SPL token transfer is future expansion. |
| Endless Testnet / Luffa App | Luffa App / Endless SDK connect, signMessage, signAndSubmitTransaction, and `luffa-endless-auth:v1` QR / WebView signed callback | `@luffalab/luffa-endless-sdk` / QR session API | Endless is not handled as an EVM add-network flow; real App callback must be signature verified. |

Current boundaries:

- Native OKX Endless support requires OKX to expose an Endless provider or support the Endless Wallet Standard.
- Standalone Luffa App QR authorization is upgraded to `luffa-endless-auth:v1`; mock callback only creates a `protocol_mock` receipt, while real App callback must include `publicKey/fullMessage/signature` and pass verification.
- Mainnet real-value execution is not the current MVP default path.

2026-06-12 update: see `LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md`. This round stops demo-video work and prioritizes real Luffa App QR / WebView authorization, BNB / Solana / Endless manual evidence, and the Task Reward business scenario.
