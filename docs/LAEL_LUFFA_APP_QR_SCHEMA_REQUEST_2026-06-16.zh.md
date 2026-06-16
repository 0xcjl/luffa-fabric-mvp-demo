# LAEL Luffa App QR Schema Confirmation Request

日期：2026-06-16

## 结论

当前 Luffa App QR 阻塞点不是 API、frontend、Cloudflare public callback 或 session 过期。

2026-06-16 已重新检查：

- API：`http://127.0.0.1:3000/v2/runtime-config` 返回 200。
- Frontend：`http://127.0.0.1:3001` 返回 200。
- Public callback：`https://lael.clawworld.eu.cc/v2/runtime-config` 返回 200。
- `npm run health:luffa-app` 返回 `ok: true`。

此前 2026-06-15 真实手机复测中，Luffa App 扫码入口对以下格式均提示“无效二维码”，且对应 QR session debug events 为空，没有 `/scan`、`/claim` 或 `/callback` 命中：

- JSON QR payload。
- `protocol=luffa-endless-auth:v1` compatible JSON。
- `protocol=luffa-endless-auth` / `version=v1` key=value 最小 login QR。

因此下一步不应继续重复扫码，而是先由 App 侧确认实际接受的 QR schema 或 deep link 格式。

## 当前 LAEL Session Contract

LAEL 当前 QR session API：

- Create: `POST /v2/endless/qr-sessions`
- Poll: `GET /v2/endless/qr-sessions/:sessionId`
- Debug: `GET /v2/endless/qr-sessions/:sessionId/debug`
- Claim: `POST /v2/endless/qr-sessions/:sessionId/claim`
- Scan page: `GET /v2/endless/qr-sessions/:sessionId/scan`
- Callback: `POST /v2/endless/qr-sessions/:sessionId/callback`

Public callback base:

```text
https://lael.clawworld.eu.cc
```

Callback endpoint shape:

```text
https://lael.clawworld.eu.cc/v2/endless/qr-sessions/{sessionId}/callback
```

## App 侧需确认的问题

请 App 侧明确返回以下信息：

1. App 扫码入口接受的 QR 内容类型：
   - `https://.../scan` URL
   - JSON string
   - key=value string
   - custom scheme，例如 `luffa://...`
   - universal link，例如 `https://...` 但要求固定 path / query

2. 如果是 custom scheme / universal link，请给出完整示例。

3. App 解析 QR 后是否会主动打开 WebView scan page，还是直接 native 解析 payload。

4. App callback 需要 LAEL 提供哪些字段：
   - `sessionId`
   - `nonce`
   - `ownerRef`
   - `chainKey`
   - `businessAction`
   - `amount`
   - `asset`
   - `recipientAddress`
   - `callbackUrl`
   - `signingMessage`

5. App 签名完成后 callback 的 request body schema。

LAEL 当前真实 callback 期望至少包含：

```json
{
  "status": "approved",
  "publicKey": "...",
  "fullMessage": "...",
  "signature": "...",
  "callbackSource": "qr_scan_callback"
}
```

如果 App bridge 已经提交真实交易，还可以附加：

```json
{
  "txHash": "...",
  "rawData": "..."
}
```

## 验收标准

拿到 App 侧 schema 后，LAEL 侧再生成新 QR 复测。通过标准：

1. 手机扫码不再提示“无效二维码”。
2. QR session debug events 出现 `/scan`、`/claim` 或 `/callback` 记录。
3. Callback 返回 `approved`。
4. Authorization receipt 显示 `signatureVerified=true`。
5. 如果 App bridge 同时提交真实交易，则必须返回真实 `txHash`；否则只能标记为 signed authorization，不能标记真实链上完成。
