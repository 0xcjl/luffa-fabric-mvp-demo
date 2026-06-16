# LAEL / Luffa Fabric Multi-chain Wallet Support Test Report

日期：2026-06-02

## 范围

本报告对应本轮多链钱包支持落地：

- Endless Testnet / Mainnet / Luffa App Wallet lane
- Base、BNB Testnet / Mainnet EVM lane
- Solana Devnet / Mainnet wallet lane
- OKX Wallet BNB add-network 支持边界
- Luffa App QR 授权下一阶段规划

## 本轮更新

| 模块 | 更新内容 | 结论 |
|---|---|---|
| Chain Registry | 新增 `BASE_MAINNET`、`BNB_TESTNET`、`BNB_MAINNET`、`SOLANA_MAINNET`、`ENDLESS_MAINNET`，修正 `ENDLESS_TESTNET` 为 chain id `221` | 已落地 |
| Payment Agent | 支持自然语言解析 `bnb / bsc`、`solana`、`endless / luffa app` | 已落地 |
| Settlement | 新增 `BNB`、`EDS`、`endless-native`，记录 `executionMode` 和 `appAuthorizationStatus` | 已落地 |
| Wallet menu | 主页面移除大块钱包连接面板，改为右上角 `Connect Wallet` 弹窗选择网络 | 已落地 |
| EVM wallets | Base / BNB 通过 MetaMask / OKX Wallet 连接；Testnet 允许当前 MVP 签名路径，Mainnet 只做连接、proposal、permission 展示 | 已落地 |
| BNB / OKX | 前端支持 BNB Testnet 选择和 EVM add-network 操作 | 已落地 |
| Solana | 前端支持 Phantom / Solana Wallet 选择；未选择钱包时打开选择弹窗，不抛 `WalletNotSelectedError` | 已落地 |
| Endless / Luffa App | 前端接入 `@luffalab/luffa-endless-sdk` 的 connect、signMessage、signAndSubmitTransaction 路径 | 已落地 |
| Endless bridge guard | 普通 Chrome 无 Luffa App bridge 时显示 `Requires Luffa App WebView / QR protocol`，不调用 SDK，不进入 connecting 卡死状态 | 已落地 |
| WalletConnect removal | 移除 WalletConnect / Project ID 当前能力展示和配置，避免与 Luffa DID / Agent ID 混淆 | 已落地 |
| OKX Endless | Endless 不按 EVM custom chain 自动添加，保留兼容性说明 | 当前边界明确 |
| Luffa App QR | 缺 App 端 QR session / callback / polling 协议 | 下一阶段规划 |

## 自动化测试项

| 测试项 | 覆盖内容 | 结果 |
|---|---|---|
| TypeScript root check | 根项目类型检查 | 通过：`tsc -p tsconfig.json --noEmit` |
| Root vitest | BNB、Solana、Endless parser / wallet / settlement / docs / loop model / wallet menu guard | 通过：17 个测试文件，127 个测试 |
| VARR tests | Trusted runtime 回归测试 | 通过：31 个测试 |
| Chain registry tests | BNB、Solana、Endless 配置完整性 | 通过 |
| Payment Agent tests | BNB / Solana / Endless intent 解析，BNB txHash receipt，Endless rejected authorization receipt | 通过 |
| Wallet tests | Ed25519 wallet 使用 wallet-provided fullMessage 验签 | 通过 |
| Settlement adapter tests | BNB EVM rail、Endless Luffa App 授权结果记录 | 通过 |
| Frontend loop model tests | Endless rejected authorization evidence 分类 | 通过 |
| QA Runner whitelist | 新增 Multi-chain docs smoke 白名单检查，不接受前端任意命令 | 通过 |
| Wallet menu guard | 前端源码不包含 WalletConnect / Project ID 当前能力文案；包含 Base/BNB/Solana/Endless 的主网和测试网；Mainnet execution disabled in MVP 文案存在 | 通过 |
| Frontend build | Next.js 构建，包含 Endless SDK dynamic import 和 Solana wallet modal guard | 通过；无 WalletConnect/pino warning |
| Frontend browser smoke | Chrome 打开 `http://127.0.0.1:3001/`，检查 Execution Loop Console、自动化/人工测试面板和错误遮罩 | 通过；无 Runtime Error overlay |

## 人工测试建议

| 路径 | 人工步骤 | 预期结果 |
|---|---|---|
| 右上角钱包弹窗 | 点击 `Connect Wallet` | 显示 Base/BNB/Solana/Endless 的主网和测试网，主页面不再铺开钱包连接大面板 |
| Base / BNB Testnet | 选择测试网，连接 MetaMask / OKX Wallet，生成 proposal，签名并记录 txHash | receipt 显示对应 chainKey、`evm`、`real` |
| Base / BNB Mainnet | 选择主网，连接 MetaMask / OKX Wallet，生成 proposal | permission 可见；真实签名执行显示 `Mainnet execution disabled in MVP` |
| Solana Devnet / Mainnet | 选择 Solana 网络 | 未选择钱包时打开 Phantom / Solana 钱包选择弹窗；不再出现 `WalletNotSelectedError` |
| Endless / Luffa App | 选择 Endless Testnet / Mainnet / Luffa App | 普通 Chrome 显示需要 Luffa App WebView / QR protocol；有 bridge 时调用 SDK |
| OKX Endless | 不执行 EVM add-network；只查看说明 | 明确 Endless 优先走 Luffa App / Endless SDK |
| Luffa App QR | 当前只查看下一阶段说明 | 不承诺当前浏览器二维码联调 |

## 边界

- 本轮包含 testnet/devnet 和 mainnet 展示；mainnet 真实价值操作默认禁用。
- Base / BNB 属于 EVM lane，可以通过 MetaMask / OKX Wallet 配置。
- WalletConnect / Project ID 当前不作为 MVP 能力展示。
- Endless 属于 Luffa App / Endless Wallet lane，不强行塞进 EVM add-network。
- Luffa App 独立二维码授权需要 App 端协议支持，当前记录为下一阶段。
- 所有路径仍必须经过 Identity、Permission、Execution、Settlement / Evidence、Feedback、Learning 闭环。

## 2026-06-04 后续更新

`LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md` 已把 Luffa App QR 从“下一阶段规划”推进为浏览器协议级验收：

- 新增 `POST /v2/endless/qr-sessions` 创建 QR session。
- 新增 `GET /v2/endless/qr-sessions/:sessionId` polling。
- 新增 `POST /v2/endless/qr-sessions/:sessionId/callback` 接收 App callback 并生成 authorization receipt。
- 前端 Endless lane 展示 waiting / approved / rejected / expired / failed。
- 本地 Mock App Callback 仅用于协议级验收；真实 Luffa App callback 仍需要 App 端接入。

## 2026-06-12 更新

- Endless / Luffa App 授权协议已升级为 `luffa-endless-auth:v1`，真实 callback 必须提交 `publicKey/fullMessage/signature` 并通过 session nonce 验签。
- WebView bridge 和 QR scan callback 复用同一个 authorization session / callback endpoint。
- `Mock App Callback` 只能生成 `callbackSource=protocol_mock`、`signatureVerified=false` 的本地验收 receipt，不能算真实 App 完成。
- BNB Testnet 和 Solana Devnet 代码路径已就绪，但真实 txHash / signature、explorer、receipt、feedback、learning 截图仍需手工补齐。
- Task Reward 业务场景已接入 `businessAction=task_reward`，可复用 Base / BNB / Solana / Endless 测试网验收。

主网边界也已细化：Base Mainnet 小额实测需要 `LAEL_ENABLE_MAINNET_EXECUTION=true`、页面 `mainnetRiskAccepted` 和 `LAEL_MAINNET_MAX_AMOUNT_ETH` 金额上限；默认仍禁用真实价值执行。
