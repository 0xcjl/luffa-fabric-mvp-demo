# LAEL / Luffa Fabric Real-environment Test Report

日期：2026-06-04
截图证据更新：2026-06-06
截止交付目标：2026-06-15 前完成当前阶段全部 deliverables。
范围：Base Sepolia 真实钱包交易、LAEL execution receipt、feedback / learning、Base Mainnet guard、Endless QR protocol。

## 1. 结论

本轮已完成第一条真实环境主线的关键证据：

- Base Sepolia 真实钱包交易已完成。
- txHash 已在 BaseScan Sepolia 核验为 `Success`。
- LAEL 后端 proposal、execute、feedback、memory API 均成功。
- Learning memory 已记录 `ETH / BASE_SEPOLIA / Alice` 偏好。
- Policy suggestion 仍保持 `keep_human_confirmation`，没有自动放权。
- LAEL receipt 已补齐截图证据，显示 `0.00001 ETH`、`Settlement completed`、`Mode real`、`App auth approved`、真实 txHash 和 explorer link。
- Feedback / Learning 已补齐截图证据，显示 `Feedback Submitted`、`Agent score 0.90 -> 0.91`，并保留人工确认。
- 已补齐 Base Mainnet guard、Endless QR waiting、Endless QR mock approved 截图。
- 发现并修复了 `Submit Feedback` 无明显 UI 反馈导致重复点击的问题，以及历史 completed proposal 导致 `0.00001 ETH` evidence replay 被 duplicate block 的问题。

本报告结论：Base Sepolia 真实链上验收主线已完成；Base Mainnet 是安全门验收；Endless QR 是协议级验收，真实 Luffa App callback 仍待 App 端接入。

## 2. 测试环境

| 项 | 值 |
|---|---|
| Local API | `http://127.0.0.1:3000` |
| Local Frontend | `http://127.0.0.1:3001` |
| Browser | Chrome / local frontend |
| Wallet | MetaMask 或 OKX Wallet，用户本地操作 |
| Network | Base Sepolia |
| Mainnet execution | 默认关闭 |
| Mainnet env | `LAEL_ENABLE_MAINNET_EXECUTION=false` |
| Mainnet amount cap | `LAEL_MAINNET_MAX_AMOUNT_ETH=0.00001` |

## 3. Base Sepolia 真实交易

用户完成真实钱包签名并提供 txHash：

```text
0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

Explorer:

```text
https://sepolia.basescan.org/tx/0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

BaseScan Sepolia 元信息核验：

| 字段 | 结果 |
|---|---|
| Status | Success |
| Action | Transfer `0.00001 ETH` |
| Recipient | `0x0000000000000000000000000000000000000002` |
| Time | Jun-04-2026 09:16:32 AM UTC |

## 4. LAEL API 记录

测试过程中后端日志显示：

| API | 结果 |
|---|---|
| `POST /v2/wallet/connect` | 201 |
| `POST /v2/wallet/verify` | 200 |
| `POST /v2/payment-agent/proposals` | 201 |
| `POST /v2/payment-agent/proposals/:proposalId/execute` | 201 |
| `POST /v2/payment-agent/receipts/:executionId/feedback` | 201 |
| `GET /v2/payment-agent/memory/did:luffa:user_001` | 200 |

本次 execution id：

```text
exec_90e5bf32-3b1d-4de9-8871-c2cdc97011da
```

本次 proposal id：

```text
proposal_7fef50ec-80cd-4620-9b3e-97dee6147a76
```

前端 receipt 截图核验：

| 字段 | 结果 |
|---|---|
| Amount | `0.00001 ETH` |
| Network | `BASE_SEPOLIA` |
| Permission | `allow_pending_human_confirmation` |
| Settlement | `completed` |
| Chain | `BASE_SEPOLIA / evm` |
| Mode | `real` |
| App auth | `approved` |
| txHash | `0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b` |
| Explorer link | 已显示 |

## 5. Feedback / Learning 结果

当前 memory / frontend learning 结果：

| 字段 | 结果 |
|---|---|
| ownerRef | `did:luffa:user_001` |
| preferredRecipientName | `Alice` |
| preferredRecipientAddress | `0x0000000000000000000000000000000000000002` |
| preferredAmount | `0.00001` |
| preferredAsset | `ETH` |
| preferredChainKey | `BASE_SEPOLIA` |
| agentScore | 前端最终截图显示 `0.90 -> 0.91` |
| policySuggestion | `keep_human_confirmation` |

说明：

- `feedbackCount=12` 是因为前端此前没有明显提交成功状态，用户多次点击 `Submit Feedback`。
- 后端每次点击都成功返回 201。
- 前端已修复为 `Submitting Feedback` / `Feedback Submitted` 状态，并在成功后阻止重复提交。
- 前端已修复 receipt panel：feedback 提交后 `Learning` 字段会从 `pending_feedback` 更新为 `updated`，同时保留原 receipt 的真实 txHash、`Mode real`、`App auth approved` 和 explorer link。
- Learning 没有自动提高额度、没有自动新增收款人、没有绕过人工确认。

## 6. Base Mainnet Guard

当前 API runtime config：

```json
{
  "mainnetExecutionEnabled": false,
  "mainnetEnvVar": "LAEL_ENABLE_MAINNET_EXECUTION",
  "mainnetMaxAmountEth": 0.00001
}
```

验收结论：

- Base Mainnet 真实价值执行默认禁用。
- 前端显示 mainnet risk confirmation。
- 未开启 env gate 时不能进入真实 mainnet signing。
- 即使 env gate 开启，也必须勾选 `mainnetRiskAccepted` 并满足金额上限。

截图状态：已补齐。

## 7. Endless QR Protocol

当前能力：

- Browser 可以创建 Endless QR session。
- Browser 可以 polling session status。
- Callback API 可以接收 `approved` / `rejected` / `failed`。
- Local mock callback 可以生成 authorization receipt。

边界：

- Mock callback 只用于协议级验收。
- 无真实 Luffa App callback 时，不得描述为 App 端到端联调完成。

截图状态：已补齐。

## 8. 自动化验证

本轮相关验证：

```bash
./node_modules/.bin/vitest run tests/frontend-wallet-menu.test.ts tests/docs.test.ts
./node_modules/.bin/tsc -p tsconfig.json --noEmit
cd src/frontend && NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

结果：

- frontend wallet/docs tests：28 tests passed。
- TypeScript root check：passed。
- Frontend build：passed。
- Frontend HTTP smoke：`http://127.0.0.1:3001/` 返回 200。
- API runtime config：返回 200。

## 9. 截图证据

| 截图 | 状态 |
|---|---|
| Wallet connected on Base Sepolia | 已补：`docs/assets/real-env/base-sepolia-wallet-connected-2026-06-05.png` |
| BaseScan txHash success page | 已补：`docs/assets/real-env/base-sepolia-basescan-success-2026-06-05.png` |
| LAEL Execution Receipt panel | 已补：`docs/assets/real-env/base-sepolia-receipt-completed-2026-06-06.png` |
| Feedback Submitted / Learning panel | 已补：`docs/assets/real-env/base-sepolia-feedback-submitted-2026-06-06.png` |
| Base Mainnet guard panel | 已补：`docs/assets/real-env/base-mainnet-guard-2026-06-05.png` |
| Endless QR session waiting panel | 已补：`docs/assets/real-env/endless-qr-waiting-2026-06-05.png` |
| Endless QR mock approved panel | 已补：`docs/assets/real-env/endless-qr-mock-approved-2026-06-05.png` |

## 10. 当前风险

- Base Sepolia 真实链上主线已完成，但当前报告只覆盖一笔小额测试交易，不代表高金额或主网自动执行能力。
- 当前 report 记录的是 Base Sepolia 主线；Base Mainnet 仍是 safety gate，不是默认真实执行能力。
- Endless QR 仍是协议级验收，真实 App callback 待 App 端接入。
- Demo video 正在使用 HyperFrames 制作英文旁白版本。

## 11. 2026-06-12 P0/P1/P2 更新

本轮 demo video 工作已停止，优先级切到 Luffa App 原生授权、真实钱包小额证据和 Task Reward 业务场景。

代码与文档更新：

- Endless QR / WebView authorization 已升级为 `luffa-endless-auth:v1`。
- QR payload 增加 `businessAction`、`amount`、`asset`、`recipientAddress`、`callbackLocalOnly` 和 `signingMessage`。
- 真实 Luffa App callback 必须提交 `publicKey`、`fullMessage`、`signature` 并通过 session nonce 绑定验签。
- WebView bridge 与 QR scan 走同一个 callback endpoint，receipt 用 `callbackSource=webview_bridge` 或 `callbackSource=qr_scan_callback` 区分。
- 本地 mock 只生成 `callbackSource=protocol_mock`、`signatureVerified=false` 的 receipt，不计入真实 App 联调完成。
- Task Reward 业务场景已接入 payment-agent / settlement / feedback / learning，proposal 和 receipt 显示 `businessAction=task_reward`。

手工证据状态：

| 项 | 状态 |
|---|---|
| Base Sepolia | 已有真实 txHash / BaseScan / receipt / feedback / learning 证据 |
| BNB Testnet | 代码路径已就绪；真实 tBNB txHash、BscScan testnet、receipt、feedback、learning 截图待补 |
| Solana Devnet | 代码路径已就绪；真实 Phantom devnet signature、explorer、receipt、feedback、learning 截图待补 |
| Endless Testnet / Luffa App | signed callback / WebView bridge 协议已就绪；真实 App 返回 `publicKey/fullMessage/signature` 前必须标记为 blocked |
| Task Reward | 自动化闭环已覆盖；真实业务手工截图待补 |
