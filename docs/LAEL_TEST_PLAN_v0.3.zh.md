# LAEL / Luffa Fabric 测试方案 v0.3

## 测试目标

验证 Unified Agent Runtime Fabric MVP 的四组路径：

| 组 | 自动化测试 | 人工测试 |
| --- | --- | --- |
| Off-chain Runtime | VARR runtime、capability、context、approval、receipt、learning tests | OpenClaw/Codex Stub 执行 summary，查看 receipt/learning |
| On-chain Transfer | wallet、payment-agent、settlement、ledger tests | Base Sepolia ETH 小额转账，查看 txHash/receipt |
| On-chain Trading/Swap | simulated swap intent、permission、risk block tests | 输入 swap 请求，确认只生成 proposal，不真实交易 |
| Fiat / Proof Settlement | fiat-proof / invoice-proof record tests | 创建 proof receipt，确认没有真实支付动作 |
| Governance / AGT Adapter | AGT allow、deny、requires confirmation、degraded fallback、receipt metadata tests | Runtime Agent 中查看 Governance Source、AGT decision record、Evidence disclosure |
| Base Mainnet Guard | runtime config、frontend guard、manual test markers | 默认阻止真实 mainnet signing；开启 env 后仍需页面二次确认和金额上限 |
| Endless QR / WebView Authorization | `luffa-endless-auth:v1` session create/poll/signed callback、authorization receipt tests | 无 App 时 waiting/expired/protocol_mock；真实 App signed callback 或 WebView bridge 通过后才算 approved receipt |
| Task Reward Business Flow | payment-agent businessAction、settlement receipt、feedback、learning tests | Agent complete small task -> reward Alice -> receipt -> feedback -> learning |

## 自动化测试命令

### 根项目类型检查

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

验收：退出码为 0。

### 根项目测试

```bash
./node_modules/.bin/vitest run --config vitest.config.ts
```

验收：所有测试文件通过，包括 docs、payment-agent、settlement、wallet、ledger、安全测试。

### VARR 测试

```bash
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
```

验收：runtime、capability、context、approval、receipt、feedback、learning signal、安全路径全部通过。

### 前端构建

```bash
cd src/frontend
NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

验收：Next.js build 成功；不能有类型错误、构建失败或 WalletConnect / Project ID 当前能力文案残留。

### 前端/后端 smoke test

```bash
curl -sS -I http://127.0.0.1:3001/
curl -sS http://127.0.0.1:3000/v2/payment-agent/memory/did:luffa:user_001
```

验收：页面返回 200，API 返回 JSON。

### Endless QR session API

```bash
./node_modules/.bin/vitest run tests/endless-qr.test.ts
```

验收：`POST /v2/endless/qr-sessions` 创建 `luffa-endless-auth:v1` waiting session；`GET /v2/endless/qr-sessions/:sessionId` 可轮询状态；signed App callback 可生成 `signatureVerified=true` 的 `endless_auth_*` authorization receipt；未签名真实 callback 和重复 callback 必须被拒绝；`protocol_mock` 不能算真实 App 验收。

## 人工验收路径

### A. Off-chain Runtime

1. 打开 MVP 页面。
2. 进入 Runtime Agent tab。
3. 选择 OpenClaw/Codex Stub。
4. 运行 public community summary。
5. 查看 Agent DID mapping。
6. 查看 permission decision。
7. 查看 Execution Receipt。
8. 提交 feedback。
9. 查看 learning signal。

失败路径：

- private context。
- cross namespace context。
- missing capability。
- high-risk publish。
- forbidden action。

### B. On-chain Transfer

1. 打开 MVP 页面。
2. 进入 On-chain Value Agent tab。
3. 连接钱包并切到 Base Sepolia。
4. 选择 ETH。
5. 输入 `帮我转 0.00001 ETH 给 Alice`。
6. Generate Proposal。
7. Sign Wallet Tx。
8. Approve & Record。
9. 查看 txHash、settlement record、Execution Receipt。
10. Submit Feedback。
11. 输入 second prompt，验证 memory 补全但不绕过确认。

Base Sepolia acceptance 补充：

- Manual Tests 中运行 `Base Sepolia acceptance`。
- receipt 必须显示 `chainKey`、`walletType`、`executionMode`、`settlementId` 或 execution id。
- 有真实 txHash 时必须显示 explorer link。
- Submit Feedback 后 Learning 只允许记录偏好和策略建议，不自动放权。
- 已完成真实环境截图验收：`0.00001 ETH`、`Settlement completed`、`Mode real`、`App auth approved`、真实 txHash、BaseScan success、Feedback Submitted。
- 为支持报告和视频复盘，历史 txHash evidence replay 不应被隔天 duplicate block 卡住；短时间重复转账仍应被 duplicate 风险策略阻止。

Base Mainnet small-value transfer 补充：

- `LAEL_ENABLE_MAINNET_EXECUTION` 默认未开启时，Sign Wallet Tx 和 Approve & Record 必须被阻止。
- 开启 env 后仍必须勾选页面 `mainnetRiskAccepted`。
- 金额必须小于或等于 `LAEL_MAINNET_MAX_AMOUNT_ETH`。
- 本路径只用于一次小额人工实测，不描述为默认 MVP 能力。

失败路径：

- amount over limit。
- recipient not allowlisted。
- wrong chain。
- prompt injection / confirmation bypass。
- duplicate transfer。

### C. On-chain Trading/Swap

1. 进入 On-chain Value Agent tab。
2. 输入 `Swap 0.0001 ETH to USDC on Base Sepolia`。
3. 生成 simulated swap proposal。
4. 确认 permission decision。
5. 执行 simulated receipt。
6. 验证没有真实 DEX 交易、没有钱包签名请求。

失败路径：

- asset denied。
- chain denied。
- amount exceeds limit。
- slippage exceeds limit。
- confirmation bypass。

### D. Fiat / Proof Settlement

1. 进入 Evidence / Learning tab。
2. 创建 fiat-proof 或 invoice-proof。
3. 输入 amount、currency、reference、purpose。
4. 生成 proof settlement record。
5. 查看 receipt/proof hash。
6. 确认没有真实 Stripe、银行、on/off-ramp 调用。

### E. Endless QR Authorization

1. 进入 On-chain Value Agent tab。
2. 选择 Endless Testnet / Luffa App。
3. 扫码前运行 `npm run health:luffa-app`，确认本地 API、前端、public callback、连续公网 HTTPS 探测和临时 `/scan` 页面全部通过。
4. 点击 Create QR。
5. 查看 QR payload，确认包含 `sessionId`、`ownerRef`、`chainKey`、`intent`、`nonce`、`expiresAt`、`callbackUrl`。
6. 点击 Poll Status，确认无 App callback 时保持 `waiting` 或过期后变为 `expired`。
7. 本地开发可点击 Mock App Callback，确认生成 `endless_auth_*` authorization receipt 和 mock txHash。
8. 真实 App 接入后，由 Luffa App 扫码授权并调用 callback，浏览器只做 polling 和 receipt 记录。
9. WebView bridge 接入时，页面创建同一个 session，Luffa App 签名 `signingMessage`，再提交到同一个 callback endpoint。

边界：

- QR payload 必须包含 `version`、`sessionId`、`ownerRef`、`chainKey`、`businessAction`、`intent`、`amount`、`asset`、`recipientAddress`、`nonce`、`expiresAt`、`callbackUrl`、`callbackLocalOnly`、`signingMessage`。
- `businessAction=login` 只用于 Luffa / Endless 钱包登录绑定，签名消息不得包含转账 `intent`、`amount` 或 `recipientAddress`；这些业务字段只允许出现在 `transfer` / `task_reward` 授权签名里。
- `LAEL_PUBLIC_CALLBACK_BASE_URL` 用于生成 App 可访问的 HTTPS callback URL；未配置时只能做 local-only 验收。
- 真实 Luffa App QR / WebView 验收必须使用公网 HTTPS tunnel，例如 Cloudflare Tunnel 指向本地 API 3000；`callbackLocalOnly=false` 才能进入真实 App 验收。当前优先使用 named tunnel `lael-luffa-app-dev` 和 `https://lael.clawworld.eu.cc`，本地 tunnel 配置固定 `protocol: http2`。
- Cloudflare quick tunnel URL 变化、手机出现 Cloudflare 1033/530、App WebView 重复弹授权页、或 API 重启后，旧 QR session 不能复用；必须用新的 `LAEL_PUBLIC_CALLBACK_BASE_URL` 重启 API 并重新生成 QR。
- signed callback 成功后，同一 `/scan` session 必须显示已提交/终态，不得因 App WebView reload 再次触发 Luffa App 签名弹窗。
- `npm run health:luffa-app` 是真实 App 扫码前置检查；如果 `callback.public-runtime.*` 或 `endless.scan-page.public` 失败，不得进入扫码验收。
- Mock App Callback 只用于本地协议验收，receipt 必须标记 `callbackSource=protocol_mock` 和 `signatureVerified=false`。
- 真实 App callback 未接入或缺少 `publicKey/fullMessage/signature` 时，不得描述为 Luffa App 端到端验收完成。

### F. Task Reward Business Flow

1. 进入 On-chain Value Agent tab。
2. 点击 `Task Reward`。
3. 确认 proposal 显示 `businessAction=task_reward`、recipient、amount、network 和 permission。
4. 按当前链完成 wallet / Luffa App authorization。
5. 点击 Approve & Record，确认 receipt 仍显示 `businessAction=task_reward`。
6. 点击 Submit Feedback。
7. 查看 Learning / Memory，确认只记录偏好和 `keep_human_confirmation`，不自动放权。

## 最终报告要求

最终验收后输出测试摘要：

- 自动化测试命令与结果。
- 人工测试路径与结果。
- 未覆盖风险。
- 当前已知限制。
- 后续建议。

## 多链钱包支持测试补充

| 组 | 自动化测试 | 人工测试 |
| --- | --- | --- |
| BNB Testnet / OKX | chain registry、Payment Agent parser、EVM settlement receipt、wrong-chain policy block | 选择 BNB Testnet，点击 Add BNB to OKX，连接 OKX，签名并记录 txHash |
| Solana Devnet | Solana chain registry、Ed25519 wallet binding、SOL intent parser、Solana settlement signature record | 连接 Solana wallet，绑定 public key，生成 SOL proposal，签名并查看 receipt |
| Endless Testnet / Luffa App | Endless chain registry、`luffa-endless-auth:v1` signed callback、wallet-provided fullMessage 验签、endless-native settlement、rejected authorization receipt | 使用 Luffa App QR / WebView bridge connect、signMessage、signAndSubmitTransaction；拒绝授权时查看失败 evidence |
| Endless Web Wallet | 官方 `@endlesslab/endless-web3-sdk`、Endless address、真实 txHash、Payment Agent receipt | 浏览器连接 Endless Web Wallet，使用 `AccountAddress.fromBs58String` 和 `u128` 金额签名提交 transfer / task_reward，记录真实 txHash、receipt、feedback、learning |
| OKX Endless 边界 | 文档测试确认 Endless 不被描述为 EVM add-network | 查看 Wallet Setup，确认 Endless 优先走 Luffa App / Endless SDK |
| Luffa App QR / WebView 验收 | `tests/endless-qr.test.ts`、前端 Manual Tests 静态检查 | 当前支持 signed callback、WebView bridge callback、polling、protocol_mock；真实 App callback 未完成时必须标 blocked |
