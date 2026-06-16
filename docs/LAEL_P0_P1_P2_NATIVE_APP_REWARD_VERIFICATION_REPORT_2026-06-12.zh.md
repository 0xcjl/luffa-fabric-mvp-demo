# LAEL / Luffa Fabric P0-P1-P2 Native App / Wallet / Reward Verification Report

日期：2026-06-12
分支：`codex/varr-api-route-fixes`
范围：P0 Luffa App QR / WebView 授权协议、P1 真实钱包小额测试闭环、P2 Task Reward 业务场景。
状态：代码与自动化验证记录；真实 App / 钱包手工证据需要继续由 Luffa App、MetaMask / OKX、Phantom 环境完成。

## 1. 本轮结论

- Demo video 工作已停止；本轮没有生成 voiceover、没有 retime `index.html`、没有重建 MP4。
- Endless / Luffa App 授权协议已升级为 `luffa-endless-auth:v1`。
- Browser QR 和 WebView bridge 走同一个 session / callback / polling 模型。
- 真实 App callback 必须携带 `publicKey`、`fullMessage`、`signature`，并通过 session nonce 绑定的签名验签。
- 未签名的真实 App callback 会被拒绝；重复 callback 会被拒绝。
- `Mock App Callback` 仍保留，但 receipt source 会标记为 `protocol_mock`，不能算真实 Luffa App 联调完成。
- Task Reward 业务场景已接入 payment-agent / settlement / feedback / learning 闭环，receipt 会显示 `businessAction=task_reward`。

## 2. P0 Luffa App QR / WebView 授权协议

### 2.1 QR payload v1

创建 `POST /v2/endless/qr-sessions` 时，payload 必须包含：

```text
version=v1
protocol=luffa-endless-auth
sessionId
ownerRef
chainKey
businessAction
intent
amount
asset
recipientAddress
nonce
expiresAt
callbackUrl
callbackLocalOnly
signingMessage
```

`LAEL_PUBLIC_CALLBACK_BASE_URL` 用于生成 App 可访问的 HTTPS callback URL。

- 如果已配置：`callbackUrl` 为 public HTTPS URL，`callbackLocalOnly=false`。
- 如果未配置：`callbackUrl` 保持本地相对路径，`callbackLocalOnly=true`，只能做本机协议测试。
- `businessAction=login` 是钱包登录 / DID 绑定授权，不包含转账 intent、amount、asset 或 recipientAddress 的签名内容。
- `businessAction=transfer` / `task_reward` 才是业务授权，签名内容可以包含 EDS、amount、recipientAddress 和业务 intent。
- 真实 Luffa App 扫码 / WebView 联调必须使用手机可访问的公网 HTTPS tunnel，例如 Cloudflare Tunnel 指向本地 API 3000。
- Cloudflare quick tunnel 没有稳定性保证；手机出现 Cloudflare 1033/530、tunnel URL 变化或 API 重启后，必须用新 `LAEL_PUBLIC_CALLBACK_BASE_URL` 重启 API 并重新生成 QR，旧 QR/session 不能作为真实 App 验收证据。

### 2.2 App callback

真实 App / WebView callback 必须提交：

```text
status=approved|rejected|failed
source=qr_scan_callback|webview_bridge
address
publicKey
fullMessage
signature
txHash 可选
error 可选
```

验收规则：

- `fullMessage` 必须等于 session 的 `signingMessage`。
- `signature` 必须能用 `publicKey` 验证。
- `approved` callback 必须带 address 或 publicKey。
- session 过期后拒绝 callback。
- session 一旦 finalized，重复 callback 返回错误。
- 无 txHash 但签名通过时，receipt 标记 `approvedWithoutTxHash=true`。

### 2.3 Mock 边界

本地 mock callback 必须提交 `source=protocol_mock`。系统允许生成 protocol mock receipt，但：

- `signatureVerified=false`
- `callbackSource=protocol_mock`
- 不计入 P0 真实 Luffa App 完成标准
- 不计入 P1 Endless Testnet 真实钱包 / App 证据

## 3. P1 真实钱包小额测试闭环

| Lane | 当前状态 | 完成标准 |
|---|---|---|
| Base Sepolia | 已有真实 txHash / BaseScan / receipt / feedback / learning 证据 | 复核现有证据即可，不重复主网或大额测试 |
| BNB Testnet | 代码路径已存在，手工证据待补 | MetaMask / OKX 签名小额 tBNB，记录 txHash、BscScan testnet、receipt、feedback、learning |
| Solana Devnet | 代码路径已存在，手工证据待补 | Phantom 签名 SOL devnet，记录 signature、explorer、receipt、feedback、learning |
| Endless Testnet / Luffa App | `luffa-endless-auth:v1` 已实现，真实 App 联调待补 | Luffa App 扫 QR 或 WebView bridge callback，签名验签通过，receipt 显示 `appAuthorizationStatus=approved` |

主网边界：

- Base / BNB / Solana mainnet 真实价值执行仍默认禁用。
- 本轮不把主网真实执行描述为默认 MVP 能力。
- Base Mainnet 仍必须满足 env gate、页面二次确认和金额上限。

## 4. P2 Task Reward 业务场景

新增固定业务剧本：

```text
Agent complete a small task and reward Alice
```

验收路径：

1. 用户点击 `Task Reward` 或输入 reward prompt。
2. 系统生成 `businessAction=task_reward` proposal。
3. Permission 仍要求 human confirmation。
4. 钱包或 Luffa App 完成授权。
5. 系统记录 settlement receipt。
6. 用户提交 feedback。
7. Learning 记录偏好和 policy suggestion，但不自动放权。

边界：

- Task Reward 复用 payment-agent、settlement、feedback、learning，不新建独立系统。
- Endless reward 必须走 P0 的 signed App authorization。
- Learning 不自动提高额度、不新增收款人、不绕过人工确认、不自动导出训练数据。

## 5. 自动化验证

本轮新增 / 更新的自动化覆盖：

- `tests/endless-qr.test.ts`
  - 创建 `luffa-endless-auth:v1` QR payload。
  - signed App callback 生成 `signatureVerified=true` receipt。
  - 未签名真实 callback 被拒绝。
  - duplicate callback 被拒绝。
  - protocol mock receipt 明确标记 `callbackSource=protocol_mock`。
- `tests/mvp2-payment-agent.test.ts`
  - transfer 默认 `businessAction=transfer`。
  - reward prompt / explicit request 生成 `businessAction=task_reward`。
  - Task Reward 端到端覆盖 proposal -> receipt -> feedback -> learning。
- `tests/frontend-wallet-menu.test.ts`
  - 前端暴露 signed Luffa App authorization 和 Task Reward 控件。
- `tests/project-docs.test.ts`
  - Project Docs 记录 `luffa-endless-auth:v1`、Task Reward 和本报告。

本轮实际验证结果：

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

结果：通过。

```bash
./node_modules/.bin/vitest run tests/endless-qr.test.ts tests/mvp2-payment-agent.test.ts tests/settlement-adapters.test.ts tests/frontend-wallet-menu.test.ts tests/project-docs.test.ts tests/docs.test.ts
```

结果：6 files / 59 tests 通过。

```bash
./node_modules/.bin/vitest run --config vitest.config.ts
```

结果：18 files / 145 tests 通过。

```bash
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
```

结果：31 tests 通过。

```bash
cd src/frontend && NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

结果：Next.js build 通过。

本地 smoke：

- API `GET /v2/payment-agent/memory/did:luffa:user_001` 返回 200。
- Frontend `GET /` 返回 200。
- Chrome headless 打开 `http://127.0.0.1:3001/` 成功，标题为 `Luffa Fabric MVP 2`。
- Chrome headless 点击 `Task Reward` 后，页面显示 proposal、`Business action` 和 `task_reward`。
- 验证结束后已停止本地 API / Frontend 进程，3000 / 3001 端口已释放。

## 6. 手工验收待办

必须继续补齐：

1. 启动 API / frontend，并配置 HTTPS tunnel：
   - `LAEL_PUBLIC_CALLBACK_BASE_URL=https://...`
   - `http://127.0.0.1:3000`
   - `http://127.0.0.1:3001`
2. Luffa App 扫码或 WebView bridge 调用 callback，确认 signed authorization receipt。
3. BNB Testnet 小额签名并截图。
4. Solana Devnet 小额签名并截图。
5. Task Reward 在至少一条测试网链路上完成 receipt + feedback + learning 截图。

如果 App 端暂时不能返回 `publicKey/fullMessage/signature`，P0 状态必须标记为 blocked，不得降级为 mock 完成。
