# LAEL Wallet Stability Fix Report

日期：2026-06-16

## 背景

在 P0-P2 关键闭环完成后，继续做手动钱包回归时发现几类前端稳定性问题：

- Endless Web Wallet 授权弹窗在用户点击授权或关闭后可能仍停留在页面左侧。
- Endless Web Wallet 交易确认请求若钱包没有返回 response，页面缺少明确超时反馈。
- Solana Mainnet 真实小额测试中，Phantom 可能提示 `You don't have enough SOL for this transaction`，但前端没有提前显示余额、金额和手续费预算。
- Solana Mainnet `Sign Wallet Tx` 在浏览器侧 RPC `getLatestBlockhash` fetch 失败时，会触发 Next.js Runtime Error overlay，而不是回到 LAEL 页面日志。
- 当前 Cloudflare public callback 受本机 TUN / DNS 影响，`lael.clawworld.eu.cc` 返回 1033 / 530，不适合继续 Luffa App QR 扫码验收。

## 修复范围

### Endless Web Wallet

- 移除对 `#endless_dapp_modal_container` 的强制 `display: "flex"`，避免覆盖 SDK 的隐藏 class。
- 在 `connect` / `signAndSubmitTransaction` 完成或失败后调用 `hideEndlessWebWalletModal()`，让 SDK modal 能正常关闭。
- 为 Endless Web Wallet account request 和 transaction confirmation 增加 `30000ms` timeout。
- Endless transfer payload 使用 primitive `recipient` 和 `amountUnits.toString()` 作为 `functionArguments`，继续保留 ABI type tags。

### Solana Mainnet

- Solana Mainnet 默认 transfer prompt 固定为 `0.000001 SOL`。
- Solana Mainnet `task_reward` prompt 固定为 `0.000001 SOL`，避免主网手动测试误用较大金额。
- 在调用 Phantom 前执行本地预检：
  - `getBalance(solanaWallet.publicKey)`
  - `getFeeForMessage(transaction.compileMessage())`
  - 校验 `balance >= transfer amount + estimated fee`
- 余额不足时，页面日志显示 sender、balance、required、amount、feeBudget，不再只依赖 Phantom 弹窗报错。
- Solana Mainnet RPC 改为候选列表：
  - `https://api.mainnet-beta.solana.com`
  - `https://solana-rpc.publicnode.com`
- `getLatestBlockhash` 会逐个 RPC 重试；全部失败时写入页面日志 `Solana RPC unavailable for ...`，不再触发 Runtime Error overlay。
- Solana transaction preparation / send / confirm 统一捕获异常并写入页面日志 `Solana transaction request failed: ...`。

## 当前服务状态

本地服务：

- API `http://127.0.0.1:3000`：在线。
- Frontend `http://127.0.0.1:3001`：在线。
- `LAEL_ENABLE_MAINNET_EXECUTION=true`：当前本地手动测试环境已开启主网 gate，仍需要页面二次确认和金额上限。

Public callback：

- `https://lael.clawworld.eu.cc/v2/runtime-config` 当前返回 Cloudflare `1033 / 530`。
- `npm run health:luffa-app` 当前失败点为 public runtime / public scan page。
- 本机 DNS 当前由 `utun7 / 198.18.0.2` 接管，`region1.v2.argotunnel.com` 被解析到 `198.18.0.83`。
- `cloudflared` 到 Cloudflare edge 报 `TLS handshake with edge error: EOF`。

结论：本地钱包路径可继续测试；Luffa App QR / WebView public callback 在 Cloudflare tunnel 恢复前不要扫码验收。

## 验证

本次修复后已执行：

- `npm test -- tests/frontend-wallet-menu.test.ts`：7/7 passed。
- `npm run typecheck`：通过。
- `npm run build` in `src/frontend`：通过。
- `curl -I http://127.0.0.1:3001`：200 OK。
- `curl http://127.0.0.1:3000/v2/runtime-config`：200 OK。

服务检查结果：

- 本地 API / frontend 正常。
- `npm run health:luffa-app` 因 public callback 返回 530 失败；这是当前网络 / Cloudflare tunnel 状态，不是本次前端钱包修复失败。

## 使用建议

- 继续测试 Solana Mainnet 时，刷新前端，生成 `0.000001 SOL` proposal，再点击 `Sign Wallet Tx`。
- 若 Phantom 仍显示 SOL 不足，先看页面日志中的 sender 和 balance，确认是否为当前 Phantom 签名账户余额不足。
- 若页面日志显示 `Solana RPC unavailable`，优先切换网络 / 代理状态后重试；页面不应再崩溃。
- 继续测试 Endless Web Wallet 时，若钱包未返回确认结果，应在 30 秒后看到明确 timeout，而不是无限等待。
- 继续测试 Luffa App QR 前，必须先恢复 Cloudflare named tunnel 并运行 `npm run health:luffa-app`，只有 `ok=true` 时才生成新 QR。

## 边界

- 本报告不新增新的真实链上完成证据；真实完成证据仍以已记录的 txHash / signature / receipt 报告为准。
- 本报告不改变 P0-P2 阶段结论：P0 Luffa App QR / WebView 授权、P1 真实钱包小额闭环、P2 Task Reward 业务闭环仍按综合报告记录为阶段完成。
- 当前 public callback 530 / 1033 是网络 / tunnel 问题；不应把旧 QR 或失败扫码作为 App 协议回归失败。
