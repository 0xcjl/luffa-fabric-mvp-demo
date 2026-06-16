# LAEL / Luffa Fabric v0.3 文档与测试报告时间线

> 目的：把 LAEL / Luffa Fabric v0.3 的需求、MVP、测试方案、实施计划和测试报告按时间先后整理清楚，便于 GitHub 阅读、审查和后续交接。  
> 当前分支：`codex/varr-api-route-fixes`  
> 更新范围：文档索引、报告映射、Base Sepolia / Mainnet Guard / Endless QR 验收入口、2026-06-06 真实环境截图证据、2026-06-12 P0/P1/P2 原生 App 授权和 Task Reward 主线、2026-06-15 Endless Web Wallet 真实 txHash 路径调试状态、2026-06-16 Luffa App bridge 真实 txHash 修复、P0-P2 综合完成总结、全量回归 / 前端稳定性测试，以及钱包交互稳定性修复。

## 1. 推荐阅读顺序

1. `NEXT_SESSION_HANDOFF.md`
2. `LAEL_MVP_NEW_FRAMEWORK_OVERVIEW_2026-05-28.zh.md`
3. `LAEL_FRAMEWORK_DOCS_IMPLEMENTATION_PLAN_2026-05-28.zh.md`
4. `LAEL_REQUIREMENTS_v0.3.zh.md` / `LAEL_REQUIREMENTS_v0.3.en.md`
5. `LAEL_MVP_v0.3.zh.md` / `LAEL_MVP_v0.3.en.md`
6. `LAEL_TEST_PLAN_v0.3.zh.md` / `LAEL_TEST_PLAN_v0.3.en.md`
7. `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md`
8. `LAEL_FRONTEND_LOOP_IMPROVEMENT_PLAN_2026-05-29.zh.md`
9. `LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md`
10. `LAEL_AGT_INTEGRATION_v0.3.zh.md`
11. `LAEL_AGT_NEXT_STEP_EVALUATION_2026-06-02.zh.md`
12. `LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md`
13. `LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md`
14. `LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md`
15. `LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md`
16. `LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md`
17. `LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md`
18. `LAEL_REAL_ENVIRONMENT_TEST_REPORT_2026-06-04.zh.md`
19. `LAEL_INTERNAL_TECHNICAL_ONE_PAGER_2026-06-06.zh.md`
20. `LAEL_SESSION_DEV_VERIFICATION_REPORT_2026-06-09.zh.md`
21. `LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md`
22. `LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md`
23. `LAEL_BNB_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md`
24. `LAEL_SOLANA_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md`
25. `LAEL_LUFFA_APP_QR_SCHEMA_REQUEST_2026-06-16.zh.md`
26. `LAEL_LUFFA_APP_ENDLESS_MAINNET_TASK_REWARD_REPORT_2026-06-16.zh.md`
27. `LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md`
28. `LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md`
29. `LAEL_WALLET_STABILITY_FIX_REPORT_2026-06-16.zh.md`
30. `LAEL_SESSION_FULL_TEST_AND_VERIFICATION_REPORT_2026-06-15.zh.md`
31. `LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md`
32. `LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md`

## 2. 时间线总表

| 时间顺序 | 阶段 | 文档 | 对应测试文档 | 对应测试报告 | 备注 |
|---|---|---|---|---|---|
| 1 | 新框架梳理 | `LAEL_MVP_NEW_FRAMEWORK_OVERVIEW_2026-05-28.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` | 定义链下执行、链上可验证、链上价值执行 |
| 2 | 文档与实施计划 | `LAEL_FRAMEWORK_DOCS_IMPLEMENTATION_PLAN_2026-05-28.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` | 规划 6 份备案文档和测试方案 |
| 3 | 完整需求 | `LAEL_REQUIREMENTS_v0.3.zh.md` / `LAEL_REQUIREMENTS_v0.3.en.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / `LAEL_TEST_PLAN_v0.3.en.md` | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` | 总体定位和双路径架构 |
| 4 | MVP 范围 | `LAEL_MVP_v0.3.zh.md` / `LAEL_MVP_v0.3.en.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / `LAEL_TEST_PLAN_v0.3.en.md` | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` | MVP 用户故事、验收范围 |
| 5 | 测试方案 | `LAEL_TEST_PLAN_v0.3.zh.md` / `LAEL_TEST_PLAN_v0.3.en.md` | 本文件即测试方案 | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` | 第一阶段完整测试计划 |
| 6 | 第一轮测试结果 | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / `LAEL_TEST_PLAN_v0.3.en.md` | 本文件即测试报告 | 覆盖 v0.3 文档、API、VARR、swap、fiat proof |
| 7 | 前端闭环改进计划 | `LAEL_FRONTEND_LOOP_IMPROVEMENT_PLAN_2026-05-29.zh.md` | 前端闭环测试项写入该计划 | `LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md` | 规划 Execution Loop Console 和测试面板 |
| 8 | 第二轮测试结果 | `LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md` | `LAEL_FRONTEND_LOOP_IMPROVEMENT_PLAN_2026-05-29.zh.md` | 本文件即测试报告 | 覆盖前端闭环、QA Runner、浏览器验收 |
| 9 | Microsoft AGT 融合评估 | `LAEL_AGT_INTEGRATION_v0.3.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / `LAEL_TEST_PLAN_v0.3.en.md` | 后续 AGT PoC 测试结果 | 说明 AGT 是 Governance Extension 积木，不是 Luffa 核心依赖 |
| 10 | Microsoft AGT 下一步评估 | `LAEL_AGT_NEXT_STEP_EVALUATION_2026-06-02.zh.md` | `LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md` | 后续浏览器验收报告 | 评估 sidecar、MCP gateway、fork gate、browser report |
| 11 | Microsoft AGT 未来阶段落地规划 | `LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md` | 本文件定义未来阶段测试方向 | 后续浏览器验收报告 | 当前 MVP 只保留 Adapter PoC、前端展示和 evidence mapping；sidecar、MCP gateway、fork gate 留到未来阶段 |
| 12 | Microsoft AGT 浏览器验收 | `LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md` | `LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md` | 本文件即验收报告 | 覆盖 Execution Loop Console、Runtime Agent、AGT evidence、Learning UI |
| 13 | 多链钱包支持 | `LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / Project Docs 多链章节 | 本文件即测试报告 | 覆盖 BNB Testnet、Solana Devnet、Endless Testnet / Luffa App、OKX 支持边界、Luffa App QR 下一阶段规划 |
| 14 | Base Sepolia / Mainnet Guard / Endless QR | `LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / Project Docs 手工验收章节 | 本文件即验收报告 | 固化 Base Sepolia 手工验收主线；新增 Base Mainnet env + 页面二次确认安全门；新增 Endless QR session / callback / polling 协议 |
| 15 | June 15 MVP 验收矩阵 | `LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / real-environment report | 本文件定义后续验收顺序 | 固化 6 月 15 前交付物、验收路径、证据要求、用户协助点和自动化基线 |
| 16 | Wallet Integration Demo Script | `LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md` | `LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md` / real-environment report | 本文件定义演示脚本 | 3-5 分钟固定演示流程，覆盖 Base Sepolia txHash、receipt、feedback/learning、mainnet guard、Endless QR |
| 17 | Real-environment Test Report | `LAEL_REAL_ENVIRONMENT_TEST_REPORT_2026-06-04.zh.md` | `LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md` / `LAEL_TEST_PLAN_v0.3.zh.md` | 本文件即测试报告 | 记录 Base Sepolia 真实 txHash、completed receipt / feedback 截图、BaseScan evidence、mainnet guard、Endless QR protocol-level 截图 |
| 18 | Internal Technical One-pager | `LAEL_INTERNAL_TECHNICAL_ONE_PAGER_2026-06-06.zh.md` | `LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md` / real-environment report | 本文件即内部技术摘要 | 一页说明 Runtime Fabric 定位、已验证 MVP 能力、证据、安全边界、风险和下一步 |
| 19 | 本会话开发、验证与测试报告 | `LAEL_SESSION_DEV_VERIFICATION_REPORT_2026-06-09.zh.md` | 本时间线、real-environment report、demo video 工作项 | 本文件即阶段报告 | 记录本会话开发项、手工证据、服务在线状态、验证记录和暂停中的 HyperFrames voiceover refresh |
| 20 | P0/P1/P2 原生 App / 钱包 / Reward 验证 | `LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / Project Docs / real-environment report | 本文件即本轮验证报告 | 记录 `luffa-endless-auth:v1`、signed Luffa App callback / WebView bridge、BNB/Solana/Endless 手工证据要求和 Task Reward 场景 |
| 20.1 | Luffa App public callback / Cloudflare Tunnel 配置要求 | `docs/README.md` / `NEXT_SESSION_HANDOFF.md` / Project Docs | `LAEL_TEST_PLAN_v0.3.zh.md` / `/v2/runtime-config` | 本轮配置要求固化 | 明确真实 Luffa App QR / WebView 验收必须配置公网 HTTPS `LAEL_PUBLIC_CALLBACK_BASE_URL`；Cloudflare 1033/530、tunnel URL 变化或 API 重启后旧 QR 作废 |
| 20.2 | Endless Web Wallet 真实 txHash 路径 | `docs/README.md` / `NEXT_SESSION_HANDOFF.md` / Project Docs | `LAEL_TEST_PLAN_v0.3.zh.md` / `tests/frontend-wallet-menu.test.ts` | 本轮调试结论固化 | P0 Luffa App QR 保留原生授权协议；P1/P2 Endless 真实链上 transfer / task_reward 优先走官方 Endless Web Wallet SDK，避免 App bridge `packageTransactionV2` payload 兼容问题阻塞 txHash 验收 |
| 20.3 | Endless Web Wallet 会话验证 | `LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / `tests/wallet.test.ts` / frontend manual acceptance | 本文件即阶段报告 | 记录 Web Wallet SDK 集成、address/publicKey 验签修复、Task Reward 0.001 EDS proposal、服务状态、钱包弹窗可见性修复，以及 Endless Mainnet 真实 txHash 完成证据 |
| 20.4 | 本会话完整测试与验证附件 | `LAEL_SESSION_FULL_TEST_AND_VERIFICATION_REPORT_2026-06-15.zh.md` | `LAEL_TEST_PLAN_v0.3.zh.md` / 本会话自动化和手工验收 | 本文件即完整附件 | 汇总本会话 P0/P1/P2 测试过程、自动化验证、GitHub 推送结果、服务状态和未完成项；追加记录 Endless Mainnet Web Wallet 真实 txHash 已完成，Luffa App bridge 真实交易仍未完成 |
| 20.5 | Endless Web Wallet txHash 阻塞修复继续推进 | `NEXT_SESSION_HANDOFF.md` / `docs/README.md` / Project Docs | `tests/frontend-wallet-menu.test.ts` / `npm run health:luffa-app` | 本轮服务恢复和前端定向验证 | 恢复 `https://lael.clawworld.eu.cc` public callback，前端显式打开 Web Wallet modal，固定 Task Reward Alice Endless 收款人，给 `signAndSubmitTransaction` 增加 gas/expire options，并增加 sender EDS 余额预检；真实 txHash 仍需用户钱包确认后验收 |
| 20.6 | Endless Mainnet 0.001 EDS 小额闭环 | `LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md` / `NEXT_SESSION_HANDOFF.md` / Project Docs | `LAEL_TEST_PLAN_v0.3.zh.md` / frontend manual acceptance | 本轮主网风险门、余额预检和真实 txHash 记录 | 用户明确允许主网 EDS 小额测试后，本地 API 以 `LAEL_ENABLE_MAINNET_EXECUTION=true`、`LAEL_MAINNET_MAX_AMOUNT_ETH=0.001` 启动；前端生成 Endless Mainnet Task Reward proposal 并连接 Web Wallet。活动 sender `EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2` 充值后经 Endless Mainnet SDK 查询余额为 `10 EDS`；用户完成真实钱包确认后返回 txHash `G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid`，receipt `exec_00e02bbd-dc7a-467f-bb1e-4fcb4464e21e`，settlement completed，feedback submitted，learning updated |
| 20.7 | Endless Mainnet receipt API verification | `NEXT_SESSION_HANDOFF.md` / `LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md` / `tests/settlement-adapters.test.ts` | `/v2/settlement/tx/:txHash` / Endless Mainnet RPC | 本轮链上 receipt 补强 | 修复 settlement tx verification 按 `chainId` 精确选择 adapter，避免 `chainType=endless` 默认落到 testnet；`chainId=220` 查询真实主网 txHash 返回 `status=SUCCESS`、`blockNumber=188036997`、sender、recipient、payload amount 和 `vm_status=Executed successfully` |
| 20.8 | Luffa App QR parser/schema 阻塞复测 | `NEXT_SESSION_HANDOFF.md` / `LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md` / Project Docs | `npm run health:luffa-app` / QR session debug | 本轮真实手机扫码复测 | API、frontend、Cloudflare public callback 和 health check 均 ready 后，JSON QR、`luffa-endless-auth:v1` 兼容 JSON、`protocol=luffa-endless-auth` key=value 最小 login QR 均被手机 App 提示“无效二维码”；最小 login session 保持 `waiting` 且 debug events 为空，说明阻塞在 App 本地 QR parser/schema，继续扫码前需 App 侧确认实际接受格式 |
| 20.9 | BNB Mainnet 0.000001 BNB 小额自转闭环 | `LAEL_BNB_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md` / `NEXT_SESSION_HANDOFF.md` / Project Docs | `tests/mvp2-payment-agent.test.ts` / `tests/value-agent.test.ts` / public BSC RPC receipt | 本轮 BNB 主网真实 txHash 记录 | 用户明确确认 BNB Mainnet 0.000001 BNB 自转；修复 BNB mainnet prompt 被解析为 `BNB_TESTNET` 的问题；完成 txHash `0x0985baaf632a8f8a6c9b474c78dfc71935029d6e6007ddf27e2f7b207acb9736`、public RPC receipt `status=0x1`、LAEL receipt `exec_3a85ba42-f526-4c40-a628-53b52e9460fc`、feedback 和 learning。2026-06-16 用户确认主网测试通过即可，BNB Testnet 不再作为当前验收阻塞项 |
| 20.10 | Solana Mainnet 0.000001 SOL 小额自转闭环 | `LAEL_SOLANA_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md` / `NEXT_SESSION_HANDOFF.md` / Project Docs | `tests/settlement-adapters.test.ts` / public Solana RPC receipt | 本轮 Solana 主网真实 signature 记录 | 用户明确确认 Solana Mainnet 0.000001 SOL 自转；完成 signature `4YLEVpKSGd3wCLApqgPsVHx9nCjbG6Cavcb1cqmj23JyXHZi84CwLKFGShpQR84p8BiviwJFFNU5GRx2UyHhqK16`、public RPC `finalized`、slot `426702421`、LAEL receipt `exec_19f2155b-521b-48b6-8816-6b834494835c`、feedback 和 learning；修复 Solana mainnet RPC 和 receipt verification |
| 20.11 | 主网 receipt 防误记 guard | `NEXT_SESSION_HANDOFF.md` / `docs/README.md` / Project Docs | `tests/mvp2-payment-agent.test.ts` / `tests/frontend-wallet-menu.test.ts` | 本轮主网安全边界补强 | 前端 `Approve & Record` 和后端 `/execute` 现在都会拒绝主网空 txHash 或 `mock_` txHash，避免把 local mock receipt 或 signed-only 状态误记为真实链上完成 |
| 20.12 | Luffa App QR schema 确认单 | `LAEL_LUFFA_APP_QR_SCHEMA_REQUEST_2026-06-16.zh.md` | `npm run health:luffa-app` / QR session debug | App 侧联调前置材料 | 服务和 public callback 已恢复，QR parser/schema 仍需 App 侧确认；新增确认单列出 App 扫码入口需接受的 QR 内容类型、deep link / universal link 示例、callback body schema 和下一次扫码验收标准 |
| 20.13 | Luffa App WebView signed authorization / bridge 复测 | `NEXT_SESSION_HANDOFF.md` / `docs/README.md` / Project Docs | `npm run health:luffa-app` / `tests/endless-qr.test.ts` / QR session debug | 本轮 P0 与 bridge 边界固化 | 2026-06-16 使用 HTTPS `/scan` QR 重新跑通 Luffa App login signed authorization：`callbackSource=qr_scan_callback`、`signatureVerified=true`、`approvedWithoutTxHash=true`。Task Reward QR 能进入 WebView bridge，`connect`、`signMessage` 和后端 serialized transaction build 均成功，但 `packageTransactionV2` 对 serialized transaction 仍返回 `1006/rawData=""`，没有 `txHash`；P1/P2 Luffa App 真实链上提交继续归类为 App bridge payload/schema 兼容问题 |
| 20.14 | Luffa App Endless Mainnet Task Reward 真实闭环 | `LAEL_LUFFA_APP_ENDLESS_MAINNET_TASK_REWARD_REPORT_2026-06-16.zh.md` | Luffa SuperBox bridge docs / `tests/endless-qr.test.ts` / `/v2/settlement/tx` | 本文件即本轮完成报告 | 修复 App bridge 调用顺序为 `packageTransactionV2(payload JSON string) -> rawData -> signAndSubmitTransaction(rawData) -> hash`。真实 Luffa App 扫码返回 Endless Mainnet txHash `D48oBNUHyigrBzpgWRvqyRyGpGNDXnsjKpht9hN9GGNL`，链上验证 `SUCCESS`，LAEL 记录 proposal、execution、settlement、feedback 和 learning，P0/P1/P2 关键闭环完成 |
| 20.15 | P0-P2 综合测试报告与阶段总结 | `LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md` | P0/P1/P2 verification / service health / automated tests | 本文件即综合总结 | 汇总 P0 Luffa App QR / WebView 授权、P1 Endless / BNB / Solana / Base 真实小额钱包闭环、P2 Task Reward 业务闭环、服务状态、自动化验证和非阻塞备注；BNB Testnet / Solana Devnet 已按用户指令由主网小额测试替代，仅保留为可选补证 |
| 20.16 | 全量回归与前端稳定性测试 | `LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md` | QA Runner / frontend CSS smoke / service health | 本文件即回归测试报告 | 修复 QA Runner frontend build 覆盖 live dev server 产物导致 CSS 404 / 裸 HTML 的问题；前端 dev 使用 `.next-live`，build 使用 `.next-build`；QA Runner 隔离 mock 测试环境并新增 stylesheet 200 检查；全自动检查 run `qa_mqg0m76y` 通过 |
| 20.17 | 钱包交互稳定性修复 | `LAEL_WALLET_STABILITY_FIX_REPORT_2026-06-16.zh.md` | `tests/frontend-wallet-menu.test.ts` / TypeScript / frontend build / service checks | 本文件即稳定性修复报告 | 修复 Endless Web Wallet modal 关闭和 transaction timeout；Solana Mainnet 固定 `0.000001 SOL` 默认小额 proposal，签名前执行余额 + fee preflight，RPC endpoint 失败时 fallback 并写入页面日志，不再触发 Next Runtime Error；当前 Cloudflare public callback 1033 / 530 归类为本机 TUN / DNS 到 Cloudflare edge 的连接问题 |
| 21 | 项目迭代过程 | `LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md` | 本时间线和各阶段测试报告 | 本文件记录迭代过程 | 说明从 v0.1/v0.2 到 v0.3、前端闭环、AGT、多链钱包、QR 验收和协作基线的演进 |
| 22 | 协作开发交接 | `LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md` | 本文件内验证命令 | 后续协作测试报告 | 给同事说明 GitHub 分支、运行方式、验证命令、钱包边界和协作规则 |
| 23 | 下一会话交接入口 | `NEXT_SESSION_HANDOFF.md` | `tests/docs.test.ts` / `tests/project-docs.test.ts` | 后续每次重要迭代都应更新本文件 | 根目录固定入口，提供新会话启动提示词、当前状态、验证命令和维护规则 |

## 3. 文档分组说明

### 3.1 前置框架与实施计划

| 文档 | 说明 |
|---|---|
| `LAEL_MVP_NEW_FRAMEWORK_OVERVIEW_2026-05-28.zh.md` | 从“Payment Agent demo”升级到统一 Runtime Fabric MVP 的框架梳理。明确 Off-chain Agent Execution 与 On-chain Value Execution 两条 lane。 |
| `LAEL_FRAMEWORK_DOCS_IMPLEMENTATION_PLAN_2026-05-28.zh.md` | 规划 6 份备案文档、README / QUICKSTART 更新、功能补齐、测试补齐和最终验收。 |

### 3.2 六份 v0.3 备案文档

| 文档 | 说明 |
|---|---|
| `LAEL_REQUIREMENTS_v0.3.zh.md` | 中文完整需求文档，定义 LAEL / Luffa Fabric 总体定位、架构和双路径能力。 |
| `LAEL_REQUIREMENTS_v0.3.en.md` | 英文完整需求文档。 |
| `LAEL_MVP_v0.3.zh.md` | 中文 MVP 文档，定义当前阶段范围、用户故事和验收标准。 |
| `LAEL_MVP_v0.3.en.md` | 英文 MVP 文档。 |
| `LAEL_TEST_PLAN_v0.3.zh.md` | 中文测试方案，定义自动化测试、人工测试和演示验收路径。 |
| `LAEL_TEST_PLAN_v0.3.en.md` | 英文测试方案。 |

### 3.3 测试报告

| 测试报告 | 对应阶段 | 说明 |
|---|---|---|
| `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` | v0.3 文档与基础功能落地后第一轮测试 | 覆盖 6 份备案文档、root tests、VARR tests、frontend build、swap proposal、invoice proof settlement 等。 |
| `LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md` | 前端闭环与测试面板改进后第二轮测试 | 覆盖 Execution Loop Console、Identity Mapping、Automated Tests、Manual Tests、Evidence、Learning、QA Runner 和浏览器验收。 |
| `LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md` | Base Sepolia / Mainnet Guard / Endless QR 验收 | 固化 Base Sepolia 手工验收主线，说明 Base Mainnet 安全门和 Endless QR 协议级验收边界。 |
| `LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md` | June 15 MVP 验收矩阵 | 定义 Full MVP testing、wallet integration demo、real-environment report、internal one-pager 和 optional video 的完成标准。 |
| `LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md` | Wallet integration demo script | 定义 3-5 分钟演示节奏、操作步骤、讲解口径、风险应对和视频结构草案。 |
| `LAEL_REAL_ENVIRONMENT_TEST_REPORT_2026-06-04.zh.md` | Real-environment test report | 记录 Base Sepolia 真实环境交易、completed receipt / feedback 截图、BaseScan evidence、mainnet guard 和 Endless QR protocol-level 截图。 |
| `LAEL_INTERNAL_TECHNICAL_ONE_PAGER_2026-06-06.zh.md` | Internal Technical One-pager | 一页说明 Runtime Fabric 定位、核心闭环、已验证能力、安全边界、风险和下一步。 |
| `LAEL_SESSION_DEV_VERIFICATION_REPORT_2026-06-09.zh.md` | Session development / verification report | 记录本会话开发、验证、服务在线状态、截图证据、demo video 当前状态和暂停点。 |
| `LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md` | P0/P1/P2 native app / wallet / reward verification | 记录 `luffa-endless-auth:v1`、真实 Luffa App signed callback / WebView bridge、BNB/Solana/Endless 手工证据目标和 Task Reward 业务场景。 |
| `LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md` | Endless Web Wallet session verification | 记录 Endless Web Wallet SDK 路径、wallet binding/publicKey 修复、Task Reward 0.001 EDS proposal、Endless Mainnet 小额真实 txHash、receipt、feedback 和 learning。 |
| `LAEL_BNB_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md` | BNB Mainnet small-value transfer verification | 记录 BNB Mainnet 0.000001 BNB 自转、BNB mainnet 解析修复、真实 txHash、public RPC receipt、LAEL receipt、feedback 和 learning。 |
| `LAEL_SOLANA_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md` | Solana Mainnet small-value transfer verification | 记录 Solana Mainnet 0.000001 SOL 自转、Solana mainnet RPC / receipt 修复、真实 signature、public RPC receipt、LAEL receipt、feedback 和 learning。 |
| `LAEL_LUFFA_APP_QR_SCHEMA_REQUEST_2026-06-16.zh.md` | Luffa App QR schema confirmation request | 汇总 App QR parser/schema 阻塞、当前服务状态、callback contract 和 App 侧需确认的问题。 |
| `LAEL_LUFFA_APP_ENDLESS_MAINNET_TASK_REWARD_REPORT_2026-06-16.zh.md` | Luffa App Endless Mainnet Task Reward verification | 记录 App bridge 两步交易流程修复、真实 Endless Mainnet txHash、链上 receipt、LAEL execution、feedback 和 learning。 |
| `LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md` | P0-P2 comprehensive test summary | 汇总 P0 Luffa App QR/WebView 授权、P1 真实钱包小额闭环、P2 Task Reward 业务闭环、当前服务状态、自动化验证和非阻塞后续项。 |
| `LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md` | Full regression and frontend stability QA | 记录前端 dev/build 产物隔离、CSS smoke、QA Runner 环境隔离、全自动检查通过、服务健康和非阻塞备注。 |
| `LAEL_WALLET_STABILITY_FIX_REPORT_2026-06-16.zh.md` | Wallet interaction stability follow-up | 记录 Endless Web Wallet 弹窗关闭、timeout、Solana 余额 / fee 预检、RPC fallback、Runtime Error 防护和当前 Cloudflare public callback 1033 / 530 边界。 |
| `LAEL_SESSION_FULL_TEST_AND_VERIFICATION_REPORT_2026-06-15.zh.md` | Full session test and verification report | 汇总本会话 P0/P1/P2 手工测试、自动化验证、GitHub 推送结果、服务检查和未完成项；追加记录 Endless Mainnet Web Wallet 真实 txHash 已完成，Luffa App bridge 真实交易仍未完成。 |

> 注意：第二份前端测试报告不替代第一份 v0.3 测试报告。两者分别对应不同阶段，必须同时保留。

## 4. 对应关系说明

### 4.0 Microsoft AGT 融合评估

`LAEL_AGT_INTEGRATION_v0.3.zh.md` 说明 Microsoft AGT 在 Luffa Fabric 中的定位是 Permission / Governance Extension Layer 的可选治理积木。它对应新增的 AGT Adapter PoC 测试，用于验证 AGT allow / deny / requires confirmation / degraded fallback 如何映射进 Luffa permission decision、execution receipt metadata 和 evidence。

### 4.1 新框架梳理对应的测试

`LAEL_MVP_NEW_FRAMEWORK_OVERVIEW_2026-05-28.zh.md` 提出的核心框架是：

- Off-chain Agent Execution
- On-chain Value Execution
- DID mapping
- Permission
- Execution receipt
- Settlement record
- Trace / evidence digest
- Learning signal

对应测试计划：

- `LAEL_TEST_PLAN_v0.3.zh.md`
- `LAEL_TEST_PLAN_v0.3.en.md`

对应测试报告：

- `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md`

### 4.2 六份备案文档对应的测试

6 份备案文档共同定义 LAEL / Luffa Fabric v0.3 的需求、MVP 和测试方案。

对应测试报告：

- `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md`

该报告验证：

- 文档存在性与关键内容。
- Root TypeScript check。
- Root vitest。
- VARR tests。
- Frontend build。
- API smoke。
- simulated swap。
- fiat / invoice proof settlement。

### 4.3 前端闭环改进计划对应的测试

`LAEL_FRONTEND_LOOP_IMPROVEMENT_PLAN_2026-05-29.zh.md` 对应第二阶段前端体验改进。

对应测试报告：

- `LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md`

该报告验证：

- Execution Loop Console。
- Mapping DID / Agent ID / External Agent ID / Wallet Address。
- Off-chain 与 On-chain 两条分支。
- Automated Tests 面板。
- Manual Tests 面板。
- Evidence 敏感分级和披露建议。
- Learning 内容、建议、优先级和边界。
- QA Runner 全量白名单检查。
- 浏览器人工验收。

## 5. 当前 GitHub 文档包状态

截至本时间线文档创建时，`docs/` 应包含：

| 类型 | 文件 |
|---|---|
| 索引 | `README.md` |
| 时间线 | `LAEL_DOCS_TIMELINE_v0.3.zh.md` |
| 前置框架 | `LAEL_MVP_NEW_FRAMEWORK_OVERVIEW_2026-05-28.zh.md` |
| 实施计划 | `LAEL_FRAMEWORK_DOCS_IMPLEMENTATION_PLAN_2026-05-28.zh.md` |
| v0.3 备案文档 | `LAEL_REQUIREMENTS_v0.3.zh.md`, `LAEL_REQUIREMENTS_v0.3.en.md`, `LAEL_MVP_v0.3.zh.md`, `LAEL_MVP_v0.3.en.md`, `LAEL_TEST_PLAN_v0.3.zh.md`, `LAEL_TEST_PLAN_v0.3.en.md` |
| 第一轮测试报告 | `LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` |
| 前端闭环计划 | `LAEL_FRONTEND_LOOP_IMPROVEMENT_PLAN_2026-05-29.zh.md` |
| 第二轮测试报告 | `LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md` |
| 多链钱包测试报告 | `LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md` |
| Base Sepolia / Mainnet Guard / Endless QR 验收 | `LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md` |
| June 15 MVP 验收矩阵 | `LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md` |
| Wallet Integration Demo Script | `LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md` |
| Real-environment Test Report | `LAEL_REAL_ENVIRONMENT_TEST_REPORT_2026-06-04.zh.md` |
| Internal Technical One-pager | `LAEL_INTERNAL_TECHNICAL_ONE_PAGER_2026-06-06.zh.md` |
| 项目迭代过程 | `LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md` |
| 协作交接 | `LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md` |
| 下一会话交接入口 | `../NEXT_SESSION_HANDOFF.md` |

## 6. 后续维护规则

- 前端 `Project Docs` 是演示、验收和交接使用的项目文档入口；后续所有文档变更必须同步到 Project Docs。
- 新增需求文档时，必须在本时间线中补一行。
- 新增测试报告时，必须明确它对应哪一份计划或测试方案。
- 不要用后一份测试报告覆盖前一份测试报告。
- 中英文备案文档可以成对维护，但测试报告优先使用中文主版本。
- 若未来创建 GitHub Release，可以把本时间线作为 release notes 的文档索引入口。
