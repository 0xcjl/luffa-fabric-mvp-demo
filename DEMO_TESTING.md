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

If Chrome shows `ERR_TUNNEL_CONNECTION_FAILED`, verify the public services before debugging the app:

```bash
curl -I https://luffa-fabric-mvp-demo.vercel.app/
curl -sS https://luffa-fabric-mvp-api.onrender.com/v2/runtime-config
dscacheutil -q host -a name luffa-fabric-mvp-demo.vercel.app
scutil --proxy
```

If curl returns 200 but Chrome still fails, classify it as local proxy/TUN instability. A `198.18.0.0/15` DNS result is a local virtual tunnel address; refresh Chrome or reconnect the proxy/TUN instead of redeploying.

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
- If `wallet.endless.link` loads blank or fails, the page shows `Retry available` and creates a Luffa App QR fallback.

### Receipt Recording

- After `Sign Wallet Tx` or `Sign Endless Web Wallet Tx` returns a real txHash, the app records the receipt automatically.
- When the receipt matches the real txHash, `Approve & Record` changes to `Recorded`.
- If recording fails after the wallet already returned a txHash, the button changes to `Retry Record`.
- A stale denied/no-txHash receipt must be retried with the current txHash before it can count as real chain completion.

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
- `ERR_TUNNEL_CONNECTION_FAILED` with curl 200: local Chrome proxy/TUN problem, not a Vercel deployment failure.
- Render service sleep / restart: generate a fresh QR.
- Wallet popup rejected: user cancellation, not app failure.
