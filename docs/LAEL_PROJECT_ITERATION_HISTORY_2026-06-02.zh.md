# LAEL / Luffa Fabric 项目迭代过程记录

日期：2026-06-02

## 目的

这份文档记录 LAEL / Luffa Fabric 当前 MVP 从早期 Payment Agent demo 演进到统一 Runtime Fabric 的过程，帮助协作同事理解为什么项目会形成现在的架构、功能边界和测试方式。

后续每次重要迭代都需要更新本文件，并同步更新：

- `docs/README.md`
- `docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`
- 前端 `Project Docs`

## 迭代总览

| 阶段 | 时间 | 核心主题 | 主要变化 | 关键文档 / 报告 |
|---|---|---|---|---|
| v0.1 / v0.2 对齐 | 2026-05-28 前后 | Agent-Permission-Wallet-Learning Loop | 从基础 wallet / policy / settlement / learning 能力收敛到 Payment Agent 转账闭环 | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` |
| v0.3 新框架 | 2026-05-28 | 链下执行，链上可验证，链上价值执行 | 明确 Off-chain Runtime 和 On-chain Value 双路径，但仍是统一 MVP | `LAEL_MVP_NEW_FRAMEWORK_OVERVIEW_2026-05-28.zh.md` |
| v0.3 备案文档 | 2026-05-28 | 完整需求 / MVP / 测试方案 | 产出中英文 6 份备案文档，定义 LAEL 统一定位 | `LAEL_REQUIREMENTS_v0.3.*`, `LAEL_MVP_v0.3.*`, `LAEL_TEST_PLAN_v0.3.*` |
| 前端闭环控制台 | 2026-05-29 | Execution Loop Console | 用一条闭环线路展示 Identity、Permission、Execution、Settlement/Evidence、Feedback、Learning | `LAEL_FRONTEND_LOOP_IMPROVEMENT_PLAN_2026-05-29.zh.md` |
| 测试面板 | 2026-05-29 | Automated Tests / Manual Tests | 自动化测试和人工测试拆成独立板块，状态更清楚 | `LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md` |
| Project Docs | 2026-06-02 | 前端项目文档入口 | 新增前端 `Project Docs` tab，把定位、架构、流程、操作和文档索引放到页面内 | `project-docs-data.ts`, `tests/project-docs.test.ts` |
| Microsoft AGT 融合 | 2026-06-02 | Governance Extension | AGT 被定位为 Permission / Governance Extension 的可选治理积木，不替代 Luffa 核心协议 | `LAEL_AGT_INTEGRATION_v0.3.zh.md` |
| AGT 下一阶段规划 | 2026-06-02 | Sidecar / MCP Gateway / fork gate | 当前 MVP 只保留 Adapter PoC；真实 AGT runtime、MCP Security Gateway、fork 改造进入未来阶段 | `LAEL_AGT_NEXT_STEP_EVALUATION_2026-06-02.zh.md`, `LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md` |
| 多链钱包支持 | 2026-06-02 | Base / BNB / Solana / Endless | 增加主网和测试网展示，支持 MetaMask / OKX、Phantom、Luffa App / Endless SDK 入口 | `LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md` |
| 链上验收强化 | 2026-06-04 | Base Sepolia / Mainnet Guard / Endless QR | 固化 Base Sepolia 手工验收主线；新增 Base Mainnet env + 页面二次确认安全门；新增 Endless QR session / callback / polling 协议 | `LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md` |
| June 15 交付轨道 | 2026-06-04 | MVP 验收矩阵 | 明确 Full MVP testing、Wallet integration demo、Real-environment report、Internal one-pager、可选 demo video 的完成定义和执行顺序 | `LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md` |
| Wallet Demo 脚本 | 2026-06-04 | Demo Script | 基于真实 Base Sepolia txHash 固化 3-5 分钟钱包集成演示流程，覆盖 mainnet guard 和 Endless QR 协议边界 | `LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md` |
| 真实环境测试报告 | 2026-06-04 / 2026-06-06 | Real-environment Test | 记录 Base Sepolia 真实 txHash、completed receipt / feedback 截图、BaseScan evidence、mainnet guard、Endless QR protocol-level 截图 | `LAEL_REAL_ENVIRONMENT_TEST_REPORT_2026-06-04.zh.md` |
| 内部技术一页纸 | 2026-06-06 | One-pager | 面向内部技术 / 产品同步 Runtime Fabric 定位、已验证能力、证据、安全边界、风险和下一步 | `LAEL_INTERNAL_TECHNICAL_ONE_PAGER_2026-06-06.zh.md` |
| 本会话阶段报告 | 2026-06-09 | Session report | 暂停 video voiceover refresh 前，汇总本会话开发项、验证过程、服务在线状态、截图证据和剩余风险 | `LAEL_SESSION_DEV_VERIFICATION_REPORT_2026-06-09.zh.md` |
| BNB Mainnet 小额真实闭环 | 2026-06-15 | BNB Mainnet transfer | 修复 BNB mainnet prompt 被解析为 BNB Testnet 的问题，完成 0.000001 BNB 主网自转、public RPC receipt、LAEL receipt、feedback 和 learning；2026-06-16 用户确认主网测试通过即可，BNB Testnet 不再阻塞当前验收 | `LAEL_BNB_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md` |
| Solana Mainnet 小额真实闭环 | 2026-06-15 | Solana Mainnet transfer | 完成 0.000001 SOL 主网自转、public RPC finalized receipt、LAEL receipt、feedback 和 learning；修复 Solana mainnet RPC 选择和 receipt verification | `LAEL_SOLANA_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md` |
| 主网 receipt 防误记 | 2026-06-15 | Safety guard | 前端和 API 都拒绝主网空 txHash 或 `mock_` txHash，避免 local mock receipt 被误记为真实链上完成 | `NEXT_SESSION_HANDOFF.md` |
| P0-P2 阶段完成总结 | 2026-06-16 | Native App / real wallet / Task Reward | Luffa App QR / WebView 授权、Endless Mainnet Luffa App txHash、Endless Web Wallet txHash、BNB Mainnet、Solana Mainnet、Base 证据和 Task Reward 业务闭环汇总完成；测试网 / devnet 缺口按用户指令降级为可选补证 | `LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md` |
| 全量回归与前端稳定性 | 2026-06-16 | QA Runner / Next.js dev stability | 修复 QA Runner frontend build 覆盖 live dev server 输出目录导致 CSS 404 / 裸 HTML 的问题；dev/build 输出隔离，frontend smoke 增加 CSS 检查，root tests 使用 mock 环境隔离 | `LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md` |
| 协作交接 | 2026-06-02 | 同事协作基线 | 形成 GitHub 分支、文档入口、运行方式、验证命令和协作边界说明 | `LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md` |
| 下一会话交接 | 2026-06-02 | 新会话固定入口 | 新增根目录 `NEXT_SESSION_HANDOFF.md`，用于后续在新 Codex 会话中快速恢复项目上下文 | `NEXT_SESSION_HANDOFF.md` |

## 阶段说明

### 1. v0.1 / v0.2：Payment Agent 闭环

最早的 MVP 重点是把 wallet binding、permission、settlement、ledger、feedback、learning 串成一个可演示闭环。主场景是 Payment Agent 在 Base Sepolia 上辅助用户完成小额转账。

这个阶段的价值是证明：

- Agent 可以解析自然语言转账意图。
- Permission 可以输出用户可理解的 decision card。
- 钱包签名和 txHash 可以进入 receipt。
- Feedback 可以进入 learning。

主要限制：

- 容易被理解成单一 Payment Agent demo。
- 链下 Agent runtime、fiat proof、swap proposal、AGT governance 等能力没有统一表达。

### 2. v0.3：统一 Runtime Fabric

随后项目重新对齐为：

```text
Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning
```

并明确两条 lane：

- Off-chain Agent Runtime：OpenClaw、Codex、Claude Code、API Agent 等链下执行。
- On-chain Value Runtime：transfer、swap proposal、settlement、payment、claim、reward 等价值动作。

这个阶段的关键决策：

- MVP 不拆成两个产品。
- 链下和链上都回到 Mapping DID / Luffa DID。
- 所有关键动作都需要 permission、evidence、receipt、learning。
- 链上可验证不等于所有内容都上链；可以是 private log、verifiable digest、optional on-chain attestation。

### 3. 前端 Execution Loop Console

为了让测试和演示不再割裂，前端从分散 tab 变成 Execution Loop Console。

核心变化：

- 顶部展示 Mapping DID / Agent ID / External Agent ID / Wallet Address。
- 闭环线路展示每个步骤的状态。
- Off-chain 和 On-chain 两条分支在同一个闭环下展示。
- Automated Tests 和 Manual Tests 分开。
- Evidence / Learning 从 JSON 变成可读卡片。

### 4. Project Docs

由于项目文档越来越多，前端新增 `Project Docs`，作为非技术用户和协作同事的入口。

当前 Project Docs 包含：

- 项目介绍。
- 设计思路。
- 系统架构。
- 运行流程。
- 模块说明。
- 操作步骤。
- 注意事项。
- 文档与测试报告索引。

维护规则：

> 后续所有文档变更必须同步到 Project Docs。

### 5. Microsoft AGT 融合

参考 Microsoft Agent Governance Toolkit 后，项目没有把 AGT 作为核心替代方案，而是定位为：

> Luffa Fabric Permission / Governance Extension Layer 里的一个外接治理积木。

当前 MVP 落地：

- MicrosoftAgtAdapter 概念接口。
- Governance decision record。
- AGT decision 映射到 Luffa receipt metadata。
- Evidence / Learning 展示 AGT 结果。

未来阶段：

- 真实 AGT policy engine sidecar。
- MCP Security Gateway。
- fork AGT 并适配 Luffa DID、wallet/value action、A2A delegation、settlement metadata。

### 6. 多链钱包支持

多链阶段增加了：

- Base Sepolia / Base Mainnet。
- BNB Testnet / BNB Mainnet。
- Solana Devnet / Solana Mainnet。
- Endless Testnet / Endless Mainnet。

钱包入口调整为：

- EVM：MetaMask / OKX Wallet。
- Solana：Phantom / Solana Wallet。
- Endless：Luffa App / Endless SDK。

重要边界：

- 主网可选择、可连接、可生成 proposal。
- 主网真实签名执行默认禁用。
- WalletConnect / Project ID 不作为当前 MVP 能力展示。
- Endless 不按 EVM add-network 处理。
- Luffa App 独立扫码授权需要 App 端 QR session / callback / polling 协议，进入下一阶段。

### 7. Base Sepolia / Mainnet Guard / Endless QR

2026-06-04 迭代把多链入口进一步推进为可重复验收路径。

本阶段实现：

- Base Sepolia 手工验收路径在前端 Manual Tests 中独立成项，要求真实 txHash、explorer link、receipt、feedback、learning 连贯展示。
- Base Mainnet 引入双安全门：后端 `LAEL_ENABLE_MAINNET_EXECUTION` 默认关闭，前端还需要用户勾选 `mainnetRiskAccepted`；金额同时受 `LAEL_MAINNET_MAX_AMOUNT_ETH` 限制。
- Endless / Luffa App 新增 QR session API：创建 session、查询状态、接收 App callback、生成 authorization receipt。
- 前端 Endless lane 显示 `waiting`、`approved`、`rejected`、`expired`、`failed` 状态，并提供本地 mock callback 作为协议级验收工具。

重要边界：

- Base Mainnet 小额实测不是默认 MVP 能力。
- Endless mock callback 不代表真实 Luffa App 联调完成。
- WalletConnect / Project ID 仍不作为 MVP 能力展示。
- Learning 仍不得自动提高额度、自动新增收款人或绕过人工确认。

### 8. June 15 交付轨道

2026-06-04 用户把当前阶段交付截止时间调整为 2026-06-15 前完成全部当前 deliverables。

本阶段固定交付物：

- Full MVP testing。
- Wallet integration demo。
- Real-environment test report。
- Internal technical one-pager。
- 3-5 分钟 intro / demo video，如 demo 稳定且时间允许。

执行原则：

- 先产出证据，而不是先做包装。
- Base Sepolia 真实钱包闭环是关键路径。
- Base Mainnet 只作为 safety gate 演示，不作为默认 MVP 能力。
- Endless QR 当前可做协议级验收；真实 App callback 需要 App 端接入。
- 任何 mock、simulated、proof-only 路径都必须在报告中明确标注。

### 9. Wallet Integration Demo Script

同日继续完成 Wallet Integration Demo 固定脚本。

脚本主线：

- Base Sepolia 真实钱包签名和 txHash。
- LAEL execution receipt。
- Submit Feedback 和 Learning。
- Base Mainnet safety gate。
- Endless QR authorization protocol。

脚本明确使用已验证 txHash：

```text
0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

脚本用途：

- Wallet integration demo。
- Real-environment test report 的执行依据。
- 3-5 分钟 intro / demo video 的拍摄结构。

### 10. Real-environment Test Report

2026-06-04 产出真实环境测试报告第一版；2026-06-06 补齐截图证据并修复 evidence replay 被历史 duplicate block 卡住的问题。

已记录证据：

- Base Sepolia txHash 成功。
- BaseScan Sepolia 显示 `Success`。
- LAEL proposal、execute、feedback、memory API 成功。
- Learning memory 记录 `ETH / BASE_SEPOLIA / Alice`。
- `keep_human_confirmation` 策略建议仍保留。
- 前端 completed receipt 截图显示 `0.00001 ETH`、`Settlement completed`、`Mode real`、`App auth approved`、真实 txHash 和 explorer link。
- Feedback 截图显示 `Feedback Submitted`、`Agent score 0.90 -> 0.91`，并保留人工确认。
- Base Mainnet guard 截图证明 mainnet 真实执行默认禁用。
- Endless QR waiting 和 mock approved 截图证明 browser session / callback / polling 协议级验收路径。

已修复：

- 历史 completed proposal 导致同一 `0.00001 ETH` Base Sepolia evidence replay 被 `Duplicate transfer intent` block，进而使 `Approve & Record` 灰色不可点击。修复后 duplicate hard block 只覆盖短时间误重复，隔天证据回放不再阻塞验收。

### 11. Internal Technical One-pager

2026-06-06 新增内部技术一页纸，用于在产品、工程和协作同事之间快速同步当前 MVP 状态。

覆盖范围：

- Runtime Fabric 一句话定位。
- Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning 闭环。
- Base Sepolia 真实 txHash、completed receipt、Feedback Submitted、Base Mainnet guard、Endless QR protocol-level evidence。
- 主网、Endless mock、AGT extension、learning 自动化边界。
- 后续优先级：真实 Luffa App QR / WebView callback、BNB / Solana 手工钱包证据、Task Reward 业务场景验收、receipt / learning UI 优化、Base Mainnet 小额实测评估。

### 12. 本会话阶段报告

2026-06-09 在暂停 HyperFrames voiceover refresh 前新增阶段报告。

该报告记录：

- 本会话已完成的前端稳定化、Base Sepolia 真实验收、Base Mainnet guard、Endless QR 协议级验收和文档交付。
- 当前服务在线状态：API 3000、Frontend 3001、HyperFrames preview 3017。
- 手工截图证据清单。
- 自动化验证记录和需要最终重跑的标准验证命令。
- Demo video 初版状态、Kokoro TTS 缓存状态、voiceover refresh 暂停点。
- Python Kokoro TTS 安装带来的 `numpy` 版本注意事项。

### 13. P0/P1/P2 原生 App 授权与 Task Reward

2026-06-12 暂停 demo video 后，优先级切换到让 Luffa Fabric 从 demo 进入 Luffa 原生能力。

本阶段目标：

- P0：Luffa App QR / WebView 授权协议。
- P1：Base / BNB / Solana / Endless 真实钱包小额闭环证据；2026-06-16 起，BNB / Solana 当前验收以已完成的主网小额闭环为准，测试网 / devnet 仅作可选补证。
- P2：Task Reward 真实业务场景。

本阶段实现：

- Endless QR session 升级为 `luffa-endless-auth:v1`。
- QR payload 增加 `businessAction`、`amount`、`asset`、`recipientAddress`、`callbackLocalOnly`、`signingMessage`。
- `LAEL_PUBLIC_CALLBACK_BASE_URL` 支持 HTTPS tunnel callback。
- 真实 Luffa App QR / WebView 联调要求 `LAEL_PUBLIC_CALLBACK_BASE_URL` 指向手机可访问的公网 HTTPS tunnel；Cloudflare quick tunnel 断开、出现 1033/530、URL 变化或 API 重启后，必须重启 API 并重新生成 QR，旧 QR 不再作为验收证据。
- Luffa / Endless 钱包登录绑定拆为 `businessAction=login`，登录签名只证明账号控制权和 session nonce，不包含转账 intent、amount 或 recipient；业务转账和 Task Reward 才使用含 EDS/收款人/金额的授权签名。
- `/v2/runtime-config` 暴露 public callback 配置状态，前端 Endless 面板显示当前 tunnel base URL、local-only 状态和 QR 刷新规则。
- 真实 Luffa App callback 必须提交 `publicKey/fullMessage/signature` 并通过 session nonce 验签。
- 2026-06-15 调试结论：Luffa App QR 登录和 signed callback 可以通过，但 Task Reward 真实交易在 App WebView bridge 的 `packageTransactionV2` / `signAndSubmitTransaction` 路径反复返回空 `rawData`、`1006/1009` 或 `GeneralError.invalidParameter`。该问题归类为 App bridge payload 兼容，不再继续用反复扫码验证真实 txHash。
- 2026-06-16 复测结论：采用已验证可用的公共 HTTPS `/scan` QR 后，Luffa App login signed authorization 再次通过，session `endless_qr_3e50b59e-c22d-4b7b-8e50-221ce9ca2de3` 返回 `signatureVerified=true`、`callbackSource=qr_scan_callback`、`approvedWithoutTxHash=true`。随后 Task Reward session `endless_qr_c8d56363-bba3-43b0-bb64-f6ec129fb388` 进入 WebView bridge，`connect` 和 `signMessage` 成功，LAEL 后端 `/build-transaction` 成功生成 Endless serialized transaction 和 sender hex address；但 `packageTransactionV2` 仍返回 `status=error`、`errorMsg=1006`、`rawData=""`，未返回 `txHash`。因此 P0 原生授权协议成立，P1/P2 Luffa App 真实交易提交仍需 App 侧确认 bridge payload/schema，不能标记为真实链上完成。
- 2026-06-16 修复结论：公开 Luffa SuperBox bridge 文档确认 `packageTransactionV2` 应接收 `data.data = JSON.stringify({ payload, secondarySignerAddresses, feePayer })` 并返回 `rawData`，随后 `signAndSubmitTransaction` 使用 `serializedTransaction.data = rawData` 返回 `hash`。LAEL WebView 已按该流程修复。真实 Luffa App 扫码后，`packageTransactionV2` 返回 `rawData`，`signAndSubmitTransaction` 返回 Endless Mainnet txHash `D48oBNUHyigrBzpgWRvqyRyGpGNDXnsjKpht9hN9GGNL`；链上验证 `status=SUCCESS`、`vm_status=Executed successfully`、block `188157957`。LAEL 记录 proposal `proposal_bc49fc78-cf38-420d-8b84-9978a4331ede`、execution `exec_e1dafda5-df76-4278-a3bf-f53571042c9f`、settlement `settle_e770c575-657f-4772-a1b4-862798569c7e`、feedback 和 learning。P0/P1/P2 关键闭环完成。
- 2026-06-16 综合报告结论：`LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md` 已把 P0 Luffa App QR / WebView 授权、P1 真实钱包小额测试、P2 Task Reward 业务闭环和非阻塞备注合并为阶段总结。BNB Testnet / Solana Devnet 已按用户明确指令由主网小额测试替代；demo video、WalletConnect / Project ID、AGT 扩展和 explorer 截图增强均不影响当前 P0-P2 完成结论。
- 为完成 P1/P2 真实链上闭环，浏览器 Endless transfer / task_reward 新增官方 Endless Web Wallet SDK 路径：`connect` / `signMessage` / `signAndSubmitTransaction`，payload 使用 Endless bs58 地址、`AccountAddress.fromBs58String`、`u128` 金额和 ABI type tags；receipt 以 `walletType=endless-web-wallet`、`executionMode=real` 区分。
- 后续继续推进时恢复了 `https://lael.clawworld.eu.cc` public callback，并修复 Endless Web Wallet 前端交互细节：显式调用 `sdk.open()` 让钱包 modal 可见，Task Reward 默认收款人固定为 Alice 的 Endless 地址 `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`，`signAndSubmitTransaction` 增加 `maxGasAmount`、`gasUnitPrice`、`expireTimestamp` options，并在请求钱包确认前用 `getAccountEDSAmount` 检查 sender EDS 余额。该修复只推进钱包确认条件，未把无 txHash 状态标记为真实链上完成。
- 用户明确允许 Endless Mainnet EDS 小额测试后，本地 API 仅以 `LAEL_MAINNET_MAX_AMOUNT_ETH=0.001` 打开主网 gate；前端生成 Endless Mainnet Task Reward proposal 并使用已注册 Web Wallet 账户 `EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2` 预检余额。该账户充值后经 Endless Mainnet SDK 查询为 `10 EDS`，用户完成真实 Web Wallet 确认后返回 txHash `G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid`，receipt `exec_00e02bbd-dc7a-467f-bb1e-4fcb4464e21e`，settlement completed，feedback submitted，learning updated。
- 后续补强 `/v2/settlement/tx/:txHash` 验证路径：当传入 `chainId=220` 时使用 Endless Mainnet RPC，而不是默认 Endless Testnet adapter。该 txHash 链上查询返回 `status=SUCCESS`、`blockNumber=188036997`、sender / recipient / payload amount 与 0.001 EDS Task Reward 一致。
- WebView bridge 和 QR scan 复用同一个 callback endpoint。
- Mock callback 只保留为 `protocol_mock`，不能算真实 App 联调。
- Payment Agent proposal / receipt 增加 `businessAction=task_reward`。
- 前端增加 `Task Reward` 手工验收入口。

本阶段新增报告：

- `docs/LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md`
- `docs/LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md`
- `docs/LAEL_SESSION_FULL_TEST_AND_VERIFICATION_REPORT_2026-06-15.zh.md`
- `docs/LAEL_LUFFA_APP_ENDLESS_MAINNET_TASK_REWARD_REPORT_2026-06-16.zh.md`
- `docs/LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md`
- `docs/LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md`

本阶段回归修复：

- QA Runner 日常开启，但仍只允许 localhost；带 Cloudflare / 代理客户端头的请求会被拒绝。
- QA Runner root vitest / VARR tests 显式使用 mock 测试环境，避免当前主网验收 API 的 `LAEL_SETTLEMENT_MODE=real` 和 public callback 污染测试。
- 前端 dev server 使用 `.next-live`，frontend build 使用 `.next-build`，避免全自动检查的 build 覆盖 live dev server 产物。
- Frontend page smoke 增加 stylesheet 200 检查，避免 HTML 200 但 CSS 404 / 裸页面的问题再次漏检。

App 侧阻塞与可选补证：

- Luffa App 真实扫码或 WebView callback 截图；当前 public callback `https://lael.clawworld.eu.cc` 返回 Cloudflare 530 时不得扫码验收。
- 2026-06-15 已恢复 public callback 并通过 `npm run health:luffa-app`，但手机 Luffa App 对 JSON QR、兼容 JSON QR、key=value 最小 login QR 均提示“无效二维码”；对应 session 未出现 `/scan`、`/claim` 或 `/callback` debug event。下一步需 App 侧确认真实接受的 QR schema / deep link。
- BNB Testnet 小额 txHash、BscScan testnet、receipt、feedback、learning 截图已降级为可选补证；当前验收以 BNB Mainnet `0.000001 BNB` 真实闭环为准。
- Solana Devnet signature、explorer、receipt、feedback、learning 截图已降级为可选补证；当前验收以 Solana Mainnet `0.000001 SOL` 真实闭环为准。
- Task Reward 业务场景端到端截图；2026-06-15 已完成 Endless Web Wallet binding / verify、`0.001 EDS` proposal，并追加 Endless Mainnet 小额真实链上闭环：txHash `G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid`、receipt、feedback、learning。Luffa App bridge 真实交易仍需 payload/schema 兼容确认。

### 14. 下一会话交接入口

为了避免长上下文影响后续开发，项目新增根目录 `NEXT_SESSION_HANDOFF.md`。

它的作用：

- 作为新会话第一入口，而不是完整 PRD。
- 提供可复制的新会话启动提示词。
- 汇总本地路径、GitHub fork、当前分支、已推送基线 commit。
- 指向必读文档、当前能力、安全边界和验证命令。
- 明确后续每次重要迭代提交前都必须更新本文件。

该文档与以下文件配合使用：

- `docs/README.md`：完整文档入口。
- `docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`：时间线和报告映射。
- `docs/LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md`：协作开发交接。
- 前端 `Project Docs`：面向演示和验收的项目说明。

## 当前架构结论

当前 LAEL / Luffa Fabric 的 MVP 不是单一转账产品，而是统一的 Agent Runtime Fabric：

```text
Mapping DID / Luffa DID
-> Agent / Wallet Binding
-> Intent / Request
-> Permission / Governance
-> Execution Lane
-> Settlement / Evidence
-> Feedback
-> Learning
```

所有扩展，包括 AGT、多链钱包、链下 Agent、swap proposal、fiat proof，都应作为这个闭环中的可组合模块接入。

## 当前协作重点

后续协作建议优先围绕：

1. 前端组件拆分和交互 polish。
2. MetaMask / OKX / Phantom 连接状态细化。
3. Endless / Luffa App WebView 与 QR 授权协议真实 App 联调。
4. AGT sidecar / MCP Security Gateway 的下一阶段 PoC。
5. BNB / Solana / Endless / Task Reward 浏览器截图验收报告。
6. Project Docs 与 docs/ 时间线持续同步。
7. `NEXT_SESSION_HANDOFF.md` 持续维护，保证新会话可以快速恢复上下文。

## 后续更新规则

每次重要迭代需要补充：

| 字段 | 说明 |
|---|---|
| 日期 | 迭代发生日期 |
| 主题 | 本次改动的核心方向 |
| 背景 | 为什么要做这次迭代 |
| 实现 | 改了哪些代码和文档 |
| 测试 | 通过了哪些自动化 / 人工测试 |
| 边界 | 哪些内容仍是下一阶段 |
| 文档 | 新增或更新了哪些文档 |

如果本次迭代影响新会话上下文，还必须更新 `NEXT_SESSION_HANDOFF.md`。

本文件是项目演进记录，不替代需求文档、MVP 文档和测试报告。

## 2026-06-16 钱包交互稳定性修复

### 背景

P0-P2 关键闭环完成后，继续做手动钱包回归时发现 Solana Mainnet 和 Endless Web Wallet 的交互稳定性还需要补强：

- Endless Web Wallet modal 在授权完成或关闭后可能不退出。
- Endless Web Wallet account / transaction 请求缺少超时反馈。
- Solana Mainnet 交易前未显示 sender 余额、金额和手续费预算，Phantom 只能在弹窗内提示 SOL 不足。
- Solana RPC `getLatestBlockhash` fetch 失败会触发 Next Runtime Error overlay。
- 当前 Cloudflare public callback 返回 1033 / 530，扫码验收需要先恢复 tunnel。

### 实现

- 前端移除对 Endless SDK modal 的强制 `display: flex`，并在 connect / sign 结束后调用 `hideEndlessWebWalletModal()`。
- Endless Web Wallet account request / transaction confirmation 增加 30 秒 timeout。
- Solana Mainnet 默认 proposal 和 Task Reward prompt 固定为 `0.000001 SOL`。
- Solana 签名前执行 `getBalance` + `getFeeForMessage` 预检，余额不足时在页面日志中显示 sender、balance、required、amount 和 feeBudget。
- Solana Mainnet RPC 改为候选列表并逐个重试；RPC 或交易准备失败时写入页面日志，不再让页面崩溃。

### 测试

- `npm test -- tests/frontend-wallet-menu.test.ts`：7/7 passed。
- `npm run typecheck`：通过。
- `npm run build` in `src/frontend`：通过。
- 本地 API / frontend 均在线。
- `npm run health:luffa-app` 当前因 public callback 530 失败；该失败被归类为本机 TUN / DNS 到 Cloudflare edge 的连接问题，不影响本地钱包路径测试。

### 文档

- 新增 `docs/LAEL_WALLET_STABILITY_FIX_REPORT_2026-06-16.zh.md`。
- 同步更新 `docs/README.md`、`docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`、`NEXT_SESSION_HANDOFF.md` 和前端 Project Docs。

## 2026-06-18 Public Demo 发布后迭代、测试与修复

### 背景

Public demo 部署到 Vercel / Render 后，连续公网和主网小额测试暴露出几类新的问题：

- Chrome 偶发 `ERR_TUNNEL_CONNECTION_FAILED`，同时影响 Vercel、Render API 和 Render Dashboard。
- runtime-config 有时加载失败，页面进入 public demo fallback。
- Base / BNB 主网交易链上成功后，LAEL receipt 仍可能显示 `Settlement denied` 或 `approved without txHash`。
- Solana 主网测试需要把 RPC、签名、提交、确认和 receipt 记录分阶段显示，避免“签了但没有 receipt”的黑盒体验。
- Endless Web Wallet 与 Luffa App QR / WebView 需要拆成两个可选入口，不能把 App 扫码只当作 Web Wallet 空白时的 fallback。

### 实现

- Public demo 采用 Vercel 前端、Render API、Render public callback 的独立部署结构。
- 前端增加 runtime-config 状态、来源展示和 public demo fallback。
- `Check / Wake API` 只检查 / 唤醒 Render API，不提供公网 restart 控制。
- EVM 钱包优先级固定为 OKX Wallet -> MetaMask -> Rabby -> Phantom -> generic injected。
- Solana 钱包优先级固定为 Phantom -> OKX Solana -> Solana wallet selector。
- `Sign Wallet Tx` / `Sign Endless Web Wallet Tx` 成功后自动记录 receipt；`Approve & Record` 改为手动补录或失败重试入口。
- `/execute` 记录逻辑允许旧无 txHash / denied receipt 在新请求带真实 txHash 时重新生成执行记录，同时保持同一真实 txHash 的幂等返回。
- `walletAddress` 纳入 execute 输入，避免真实 txHash 验证缺少钱包上下文。
- Endless Web Wallet 与 Luffa App QR / WebView 拆为两个独立钱包入口。

### 测试

本轮验证重点是文档和 receipt 语义回归：

- `tests/frontend-wallet-menu.test.ts`
- `tests/mvp2-payment-agent.test.ts`
- `tests/settlement-adapters.test.ts`
- `tests/docs.test.ts`
- `tests/project-docs.test.ts`
- Root TypeScript check
- Root build
- Frontend build

公网 smoke 仍以 Vercel HTML、Render `/v2/runtime-config`、Render `/v2/chains` 为准。若 curl 检查正常但 Chrome 报 `ERR_TUNNEL_CONNECTION_FAILED`，按本机代理 / TUN 抖动处理。

### 边界

- 主网真实完成必须有真实 txHash 或 Solana signature、链上确认和 LAEL receipt。
- wallet connected、Luffa App login、signed-only authorization、mock txHash、空 txHash 都不能算真实链上完成。
- Solana RPC `Failed to fetch` 属于签名前 RPC 准备失败，不能推断为链上失败或钱包余额不足。
- Endless Web Wallet 空白或 `wallet.endless.link` 不可访问时，应切换到独立 `Use Luffa App` QR 路径，但 App login 仍不等于转账完成。

### 文档

- 新增 `docs/LAEL_PUBLIC_DEMO_ITERATION_TEST_REPORT_2026-06-18.zh.md`。
- `DEMO_TESTING.md` 保持为测试者操作入口。
- `WALLET_TEST_GUIDE.md` 保持为钱包优先级和真实完成边界入口。
- 同步更新 `README.md`、`docs/README.md`、`docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`、前端 Project Docs 和文档测试。
