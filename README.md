# Luffa Fabric MVP Demo

Live frontend: https://luffa-fabric-mvp-demo.vercel.app/

Public API: https://luffa-fabric-mvp-api.onrender.com/

Public callback: https://luffa-fabric-mvp-api.onrender.com/

Reference interactive demo: [Michael-Luffa/luffa-fabric-interactive-demo](https://github.com/Michael-Luffa/luffa-fabric-interactive-demo)

This is a public, interactive demo build of the current **Luffa Fabric MVP v0.3**.

It is designed to show how an AI agent action can move through identity, permission, human confirmation, wallet execution, settlement evidence, receipt, feedback, and learning signal layers.

This repository is **DEMO use only**. It packages the latest MVP experience for public testing without changing the main development repository.

## What Luffa Fabric Is

Luffa Fabric is an execution and trust layer for the Agent Economy.

It gives AI agents a verifiable action path:

```text
Identity
-> Permission
-> Execution
-> Settlement
-> Evidence
-> Feedback
-> Learning
```

The goal is not just to let an agent call tools. The goal is to make agent actions accountable:

- who the user is
- which agent acted
- what permission was granted
- what wallet or value rail was used
- whether a human confirmed the action
- what transaction or settlement evidence was produced
- what receipt was generated
- how feedback becomes a learning-ready signal

Former project names such as **LAEL** are kept in code and docs for compatibility. In this demo, **LAEL = Luffa Fabric**.

## What This Demo Does

- Shows the Luffa Fabric execution loop in a browser UI.
- Connects wallets for DID-style owner mapping.
- Generates transfer and task reward proposals from natural-language input.
- Enforces policy, amount caps, network constraints, and mainnet risk confirmation.
- Supports public QR / WebView callback testing through the Render API URL.
- Records receipts only after a real wallet txHash or an explicitly marked protocol-only authorization.
- Captures feedback and turns it into a learning-ready signal.
- Keeps off-chain agent runtime evidence and on-chain value execution in one test surface.

## What This Demo Does Not Do

- It is not a production wallet.
- It is not a bridge, MPC wallet, account abstraction stack, exchange, or custody product.
- It does not store seed phrases, mnemonics, raw private keys, or wallet credentials.
- It does not let an agent sign transactions automatically.
- It does not treat mock txHash, signed-only authorization, or protocol-only QR approval as real chain completion.
- It does not remove the need for manual wallet confirmation.
- It is not a final production deployment of Luffa Fabric.

## Public Demo Surfaces

| Surface | URL | Purpose |
| --- | --- | --- |
| Frontend | https://luffa-fabric-mvp-demo.vercel.app/ | Interactive browser demo |
| API | https://luffa-fabric-mvp-api.onrender.com/ | Runtime, proposals, callback, receipts |
| Runtime config | https://luffa-fabric-mvp-api.onrender.com/v2/runtime-config | Public callback and mainnet gate status |
| Chains | https://luffa-fabric-mvp-api.onrender.com/v2/chains | Supported chain registry |

The public callback is the Render API domain. The public demo does not depend on a local Cloudflare tunnel.

## Demo Modes

### Off-chain Agent Runtime

Shows a controlled agent execution path:

```text
Agent intent
-> capability / context boundary
-> runtime execution
-> execution receipt
-> feedback
-> learning signal
```

This path is useful for showing how Luffa can make agent outputs auditable even when no blockchain transaction is involved.

### On-chain Value Runtime

Shows a wallet-confirmed value path:

```text
User intent
-> proposal
-> permission decision
-> wallet confirmation
-> txHash
-> receipt
-> feedback
-> learning signal
```

Supported public demo lanes include Base, BNB, Solana, and Endless-oriented flows, depending on the connected wallet and available funds.

### Luffa App QR / WebView Callback

Shows the native Luffa authorization protocol lane:

```text
QR session
-> public scan URL
-> WebView authorization
-> callback
-> authorization receipt
```

For real QR validation, always generate a fresh QR after callback URL or API deployment changes.

## Mainnet Safety

Mainnet testing is enabled for controlled small-value validation, but it remains gated.

Before a real mainnet action can be recorded:

- the public API must expose `LAEL_ENABLE_MAINNET_EXECUTION=true`
- the UI risk checkbox must be accepted
- the amount must stay under the configured cap
- the wallet owner must manually confirm
- a real txHash must be returned
- empty, mock, or signed-only results are blocked from real receipt recording

The demo is suitable for controlled small-value testing only. Do not use it for large transfers, custody, production settlement, or unrestricted visitor execution.

## Why It Matters For The Agent Economy

Agent Economy products need more than chat, workflow automation, or tool calling. They need a trustworthy economic loop.

Luffa Fabric demonstrates that loop:

- Agents can be mapped to user or organization identity.
- Permissions can be explicit, scoped, and revocable.
- Wallet actions can stay under human control.
- Execution can produce receipts instead of informal logs.
- Settlement can be tied to verifiable evidence.
- Feedback can become reputation and learning input without bypassing approval rules.

This matters for:

- autonomous service agents
- creator and community agents
- AI task reward systems
- agent-to-wallet workflows
- governed payment or claim flows
- crypto trading assistant guardrails
- DAO / community operations
- AI worker reputation and receipt networks

The long-term direction is a fabric where agents can earn, pay, claim, settle, and learn under user-controlled permission boundaries.

## Quick Test Path

1. Open the frontend: https://luffa-fabric-mvp-demo.vercel.app/
2. Confirm the page loads with the styled `Execution Loop Console`.
3. Open `On-chain Value Agent`.
4. Connect a wallet.
5. Generate a small transfer or task reward proposal.
6. For mainnet lanes, accept the explicit risk checkbox only if you are intentionally testing with real funds.
7. Confirm in the wallet.
8. Record only a real returned txHash.
9. Submit feedback and confirm the learning signal appears.

For QR / WebView testing, first verify:

```text
https://luffa-fabric-mvp-api.onrender.com/v2/runtime-config
```

The public callback base URL should be:

```text
https://luffa-fabric-mvp-api.onrender.com
```

## Public Access Troubleshooting

If Chrome shows `ERR_TUNNEL_CONNECTION_FAILED` while the demo was recently healthy, first separate a local proxy/TUN issue from a deployment issue:

```bash
curl -I https://luffa-fabric-mvp-demo.vercel.app/
curl -sS https://luffa-fabric-mvp-api.onrender.com/v2/runtime-config
dscacheutil -q host -a name luffa-fabric-mvp-demo.vercel.app
scutil --proxy
```

Expected service state:

- Vercel frontend returns `200`.
- Render runtime config returns `mainnetExecutionEnabled:true` and `mainnetMaxAmountEth:0.001`.
- Public callback is `https://luffa-fabric-mvp-api.onrender.com`.

If service checks pass but Chrome still fails, the usual cause is the local proxy/TUN resolving the Vercel host to a `198.18.0.0/15` virtual address. Refresh the tab, reconnect the proxy/TUN, or wait for the local tunnel to recover. Do not treat this as an application deployment failure unless the curl checks also fail.

## Local Run

Root API:

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Frontend:

```bash
cd src/frontend
npm install
npm run dev
```

Local frontend default:

```text
http://127.0.0.1:3001
```

Local API default:

```text
http://127.0.0.1:3000
```

## Deployment

Production deployment uses:

- Frontend: Vercel
- API: Render
- Public callback: Render API URL

Detailed setup is in [DEPLOYMENT.md](./DEPLOYMENT.md).

Public test checklist is in [DEMO_TESTING.md](./DEMO_TESTING.md).

## Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Demo Testing Guide](./DEMO_TESTING.md)
- [Project Docs Index](./docs/README.md)
- [P0-P2 Comprehensive Test Summary](./docs/LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md)
- [Current Handoff](./NEXT_SESSION_HANDOFF.md)

## Stewardship

Built by **Luffa AI Research Lab** as part of the Luffa Super Connector ecosystem.
