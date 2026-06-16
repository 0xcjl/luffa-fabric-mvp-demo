# Luffa Fabric MVP Demo Deployment

This repository is a public demo package for Luffa Fabric MVP v0.3.

Target deployment:

- Frontend: Vercel project `luffa-fabric-mvp-demo`
- API: Render web service `luffa-fabric-mvp-api`
- Public callback: the Render API URL

## Render API

Create the service from `render.yaml`.

Required environment:

```text
NODE_ENV=production
LAEL_HOST=0.0.0.0
LAEL_PUBLIC_CALLBACK_BASE_URL=https://<render-api-url>
LAEL_FRONTEND_URL=https://<vercel-frontend-url>
ENABLE_LAEL_QA_RUNNER=false
LAEL_ENABLE_MAINNET_EXECUTION=false
LAEL_MAINNET_MAX_AMOUNT_ETH=0.001
```

Render build command:

```bash
npm ci && npm run build
```

Render start command:

```bash
node dist/index.js
```

Health check path:

```text
/v2/runtime-config
```

The API stores QR sessions in memory for this demo. Use one Render web instance for manual QR testing. If the service restarts or sleeps, generate a fresh QR.

## Vercel Frontend

Create a Vercel project from this repository with:

```text
Root Directory: src/frontend
Framework: Next.js
Build Command: npm run build
```

Required Vercel environment:

```text
NEXT_PUBLIC_LAEL_API_URL=https://<render-api-url>
```

After the frontend URL is known, update Render:

```text
LAEL_FRONTEND_URL=https://<vercel-frontend-url>
```

## Public Callback

The public demo does not use local Cloudflare Tunnel. `LAEL_PUBLIC_CALLBACK_BASE_URL` must be the Render API URL.

Verify:

```bash
curl -sS https://<render-api-url>/v2/runtime-config
curl -sS https://<render-api-url>/v2/chains
```

Generated QR session URLs must use the Render API host:

```text
https://<render-api-url>/v2/endless/qr-sessions/<sessionId>/scan
https://<render-api-url>/v2/endless/qr-sessions/<sessionId>/callback
```

## Mainnet Gate

The public demo can be configured for controlled mainnet testing, but it must keep all runtime gates:

- `LAEL_ENABLE_MAINNET_EXECUTION=true`
- page-level risk checkbox
- amount cap
- wallet human confirmation
- real txHash required before receipt

Do not record empty txHash, `mock_` txHash, or signed-only authorization as real chain completion.

## Rollback

Use the Render and Vercel dashboards to redeploy the previous successful deployment. If API env changes break QR sessions, restore the last known `LAEL_PUBLIC_CALLBACK_BASE_URL`, redeploy, and generate fresh QR sessions.
