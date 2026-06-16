# Luffa Fabric MVP Demo Testing

Use this checklist for the public demo.

## Public Smoke

```bash
curl -sS https://<render-api-url>/v2/runtime-config
curl -sS https://<render-api-url>/v2/chains
curl -I https://<vercel-frontend-url>
```

Expected:

- API returns 200.
- Frontend returns 200.
- `runtime-config.publicCallback.baseUrl` is the Render API URL.
- Frontend is styled and does not show `Application error`.

## Proposal Smoke

In the Vercel app:

1. Open `On-chain Value Agent`.
2. Select Endless Mainnet or Solana Mainnet.
3. Generate a transfer proposal.
4. Confirm the proposal shows permission `allow_pending_human_confirmation`.

Expected:

- Solana Mainnet default amount is `0.000001 SOL`.
- Endless Task Reward recipient is Alice's fixed Endless address.
- Mainnet signing is blocked until the risk checkbox is accepted.

## QR / Public Callback

1. Generate a fresh Endless QR session.
2. Confirm Scan URL and Callback URL use the Render API host.
3. Open Scan URL from a phone browser before using Luffa App.

Expected:

- `/scan` page loads over HTTPS.
- `callbackLocalOnly=false`.
- Old QR sessions are not reused after API restart or env changes.

If Luffa App says invalid QR and API debug events are empty, stop scanning and classify it as App QR schema compatibility.

## Wallet Tests

### Endless Web Wallet

- Connect wallet.
- Sign message for binding.
- Generate Task Reward.
- Click `Sign Endless Web Wallet Tx`.

Expected:

- Modal is visible and closable.
- Account / transaction request times out after 30 seconds if no wallet response returns.
- Real completion requires a real txHash.

### Solana Mainnet

- Generate `0.000001 SOL` proposal.
- Click `Sign Wallet Tx`.

Expected:

- Insufficient balance path logs sender, balance, required, amount, and fee budget.
- RPC failures log `Solana RPC unavailable` or `Solana transaction request failed`.
- Runtime Error overlay does not appear.

## Failure Classification

- `mock_` txHash: protocol or local mock only, not real chain completion.
- signed authorization without txHash: App authorization only, not real chain completion.
- Cloudflare 1033 / 530: local tunnel problem, not used by public demo.
- Render service sleep / restart: generate a fresh QR.
- Wallet popup rejected: user cancellation, not app failure.
