# LAEL Base Sepolia / Mainnet Guard / Endless QR 验收报告

日期：2026-06-04
范围：Base Sepolia 标准链上验收主线、Base Mainnet 小额实测安全门、Endless / Luffa App QR session 协议闭环。

## 结论

本轮把 MVP 从“多链入口展示”推进到“可重复验收路径”：

- Base Sepolia 仍是默认真实链上验收主线：钱包连接、DID binding、proposal、真实 txHash、receipt、feedback、learning。
- Base Mainnet 默认继续禁用真实价值执行；只有 `LAEL_ENABLE_MAINNET_EXECUTION=true`、页面勾选 `mainnetRiskAccepted`、金额不超过 `LAEL_MAINNET_MAX_AMOUNT_ETH` 时，才允许进入真实签名和 receipt 记录。
- Endless / Luffa App 新增浏览器 QR session 协议：create session、poll status、App callback、authorization receipt。
- 本地 mock callback 只用于协议级验收，不代表真实 Luffa App 已接入。
- WalletConnect / Project ID 仍不作为 MVP 能力展示。

## Base Sepolia 验收路径

人工验收步骤：

1. 打开前端 `http://127.0.0.1:3001/`。
2. 选择 Base Sepolia。
3. 连接 MetaMask 或 OKX Wallet。
4. Bind Wallet，完成 Luffa DID / wallet binding。
5. 生成 `0.00001 ETH` transfer proposal。
6. Sign Wallet Tx，钱包确认后获得真实 txHash。
7. Approve & Record，生成 execution receipt。
8. 打开 explorer link 验证 txHash。
9. Submit Feedback。
10. 查看 Learning：偏好可以记录，但不得自动提高额度、不得新增收款人、不得绕过人工确认。

验收字段：

| 字段 | 要求 |
|---|---|
| chainKey | `BASE_SEPOLIA` |
| walletType | `okx-injected` / EVM injected wallet |
| executionMode | 有 txHash 时为 wallet confirmed |
| txHash | 真实钱包返回，可在 Base Sepolia explorer 查看 |
| settlementId | receipt 中可追踪 |
| learning update | 只记录反馈和偏好建议，不自动放权 |

## Base Mainnet 小额安全门

默认行为：

- `LAEL_ENABLE_MAINNET_EXECUTION` 未设置为 `true` 时，前端阻止真实 mainnet signing。
- 页面会显示主网风险确认区域和当前 env gate 状态。
- 未勾选 `mainnetRiskAccepted` 时，即使 env gate 开启，也不能签名或记录真实 mainnet receipt。
- 金额超过 `LAEL_MAINNET_MAX_AMOUNT_ETH` 时必须阻止。

建议默认值：

```bash
LAEL_ENABLE_MAINNET_EXECUTION=false
LAEL_MAINNET_MAX_AMOUNT_ETH=0.00001
```

边界：

- Mainnet 小额实测是受控验收路径，不是默认 MVP 能力。
- Learning 不允许自动把 mainnet 额度提高。
- Learning 不允许自动新增 mainnet 收款人。
- Mainnet swap 仍为 simulated proposal，不接真实 DEX。

## Endless / Luffa App QR session

新增最小协议字段：

| 字段 | 说明 |
|---|---|
| sessionId | 浏览器创建的 QR session id |
| ownerRef | Luffa DID / Mapping DID |
| chainKey | `ENDLESS_TESTNET` 或 `ENDLESS_MAINNET` |
| intent | 用户授权意图 |
| nonce | 一次性随机数 |
| expiresAt | session 过期时间 |
| callbackUrl | App 回调 API |

本地 API：

| API | 作用 |
|---|---|
| `POST /v2/endless/qr-sessions` | 创建 browser -> App QR session |
| `GET /v2/endless/qr-sessions/:sessionId` | polling session 状态 |
| `POST /v2/endless/qr-sessions/:sessionId/callback` | 接收 App approved / rejected / failed callback |

状态：

- `waiting`
- `approved`
- `rejected`
- `expired`
- `failed`

验收说明：

- 无真实 App callback 时，前端可以停留在 `waiting` 或在过期后变为 `expired`。
- 本地 `Mock App Callback` 只用于开发验收，会生成 `endless_auth_*` authorization receipt 和 mock txHash。
- 真实 Luffa App 接入后，应由 App 扫码、授权、回调，浏览器只负责轮询和记录 receipt。

## 自动化验证项

本轮新增覆盖：

- `tests/endless-qr.test.ts`：验证 QR session 创建、polling、callback 和 authorization receipt。
- `tests/frontend-wallet-menu.test.ts`：验证 Solana autoConnect 关闭、Base Mainnet guard、Base Sepolia acceptance、Endless QR authorization 等前端入口存在。

完整命令仍以 `docs/LAEL_TEST_PLAN_v0.3.zh.md` 为准。

## 2026-06-04 Base Sepolia 真实环境记录

本轮用户已完成 Base Sepolia 钱包签名，并提供真实 txHash：

```text
0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

Explorer：

```text
https://sepolia.basescan.org/tx/0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

已核验的 explorer 元信息：

| 字段 | 结果 |
|---|---|
| Network | Base Sepolia |
| Status | Success |
| Action | Transfer `0.00001 ETH` to `0x0000000000000000000000000000000000000002` |
| Time | Jun-04-2026 09:16:32 AM UTC |

本地 LAEL 记录：

| 字段 | 结果 |
|---|---|
| Proposal API | `POST /v2/payment-agent/proposals` 返回 201 |
| Execute API | `POST /v2/payment-agent/proposals/:proposalId/execute` 返回 201 |
| Feedback API | `POST /v2/payment-agent/receipts/:executionId/feedback` 返回 201 |
| Memory API | `GET /v2/payment-agent/memory/did:luffa:user_001` 返回 200 |
| Learning boundary | policy suggestion 保持 `keep_human_confirmation` |

发现的问题：

- 用户点击 `Submit Feedback` 后页面没有明显反馈，导致多次重复点击。
- 后端日志显示 feedback API 实际已成功返回 201，memory 已更新。
- 前端已补充 `Submitting Feedback` / `Feedback Submitted` 状态，并在成功后禁用重复提交。

仍需补齐：

- 钱包地址截图。
- 页面 receipt / learning 截图。
- 最终 real-environment test report 中的截图清单。

## 当前限制

- Base Sepolia 已有一笔真实 txHash 记录；最终报告仍需补齐截图和钱包环境信息。
- Base Mainnet 小额实测需要用户明确开启 env 和页面二次确认。
- Endless QR 当前完成协议级 API / UI 闭环；没有真实 Luffa App callback 时不能描述为 App 端联调完成。

## 2026-06-12 补充：Endless signed App authorization

- Endless QR / WebView authorization 已升级为 `luffa-endless-auth:v1`。
- QR payload 现在包含 `businessAction`、`amount`、`asset`、`recipientAddress`、`callbackLocalOnly` 和 `signingMessage`。
- 真实 App callback 必须提交 `publicKey/fullMessage/signature` 并通过验签；未签名 callback、nonce 不匹配、重复 callback 均应失败。
- WebView bridge 和 QR scan 复用同一个 callback endpoint，以 `callbackSource=webview_bridge` 或 `callbackSource=qr_scan_callback` 区分。
- 本地 `Mock App Callback` 只生成 `callbackSource=protocol_mock`、`signatureVerified=false` receipt，不再作为 P0 / P1 真实 App 完成标准。
- Fiat proof 仍不接 Stripe、银行或 on/off-ramp。
- Swap 仍是 simulated，不接真实 DEX。
