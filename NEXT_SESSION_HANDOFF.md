# NEXT SESSION HANDOFF

更新时间：2026-06-16

## 用途

这是 LAEL / Luffa Fabric 新会话继续开发的固定入口。新会话开始时，先读本文件，再按这里的提示读取 `docs/` 中的完整文档。

后续每次重要迭代提交前，必须更新本文件的当前状态、验证结果、下一步建议和相关文档链接。

## 项目信息

| 项 | 内容 |
|---|---|
| 本地仓库 | `/Users/xyz/Documents/luffa-fabric` |
| GitHub fork | `https://github.com/0xcjl/luffa-fabric-test` |
| 当前分支 | `codex/varr-api-route-fixes` |
| Upstream | `https://github.com/Michael-Luffa/luffa-fabric` |
| 已推送基线 commit | `99ac4a43aaf3b05941725f5856c280a2a7ff3614` |
| 当前版本 | LAEL / Luffa Fabric MVP v0.3 |

新会话中请用 `git rev-parse HEAD` 和 `git status --short --branch` 核对当前本地状态；不要只依赖上表中的 commit。

## 当前项目定位

LAEL / Luffa Fabric 是面向 Agentic Economy 的 Verifiable Adaptive Resource Runtime。当前 MVP 不是单一 Payment Agent demo，而是统一 Agent Runtime Fabric。

统一闭环：

```text
Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning
```

当前两条执行 lane：

- Off-chain Agent Runtime：OpenClaw、Codex、Claude Code、API Agent 等链下执行。
- On-chain Value Runtime：transfer、swap proposal、settlement、payment、claim、reward 等价值动作。

## 新会话启动提示词

可以直接把下面这段复制给新会话：

```text
我们继续开发 LAEL / Luffa Fabric 项目。

本地仓库：
/Users/xyz/Documents/luffa-fabric

GitHub fork：
https://github.com/0xcjl/luffa-fabric-test

当前协作分支：
codex/varr-api-route-fixes

请先不要直接改代码。先阅读并理解：
1. NEXT_SESSION_HANDOFF.md
2. docs/README.md
3. docs/LAEL_DOCS_TIMELINE_v0.3.zh.md
4. docs/LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md
5. docs/LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md
6. docs/LAEL_MVP_v0.3.zh.md
7. docs/LAEL_TEST_PLAN_v0.3.zh.md
8. docs/LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md

当前项目定位：
LAEL / Luffa Fabric 是统一 Agent Runtime Fabric，包含 Off-chain Runtime、On-chain Value、Identity、Permission、Execution、Settlement、Evidence、Feedback、Learning 闭环。

开发前请先检查：
- git status --short --branch
- git rev-parse HEAD
- 当前分支是否为 codex/varr-api-route-fixes
- docs/README.md、NEXT_SESSION_HANDOFF.md 和前端 Project Docs 是否是最新项目文档入口

协作规则：
- 不要直接推 upstream。
- 新需求、测试报告、系统说明必须同步更新 docs/README、docs/LAEL_DOCS_TIMELINE_v0.3.zh.md、docs/LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md、NEXT_SESSION_HANDOFF.md 和前端 Project Docs。
- 当前公网 demo 主网 env gate 默认打开：`LAEL_ENABLE_MAINNET_EXECUTION=true`。
- WalletConnect / Project ID 当前不作为 MVP 能力展示。
- Microsoft AGT 是 Governance Extension 的可选积木，不替代 Luffa DID、wallet signing、settlement、receipt 或 learning。

我接下来要继续做的具体任务是：
【填写下一步任务】
```

## 必读文档

1. `docs/README.md`
2. `docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`
3. `docs/LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md`
4. `docs/LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md`
5. `docs/LAEL_REQUIREMENTS_v0.3.zh.md`
6. `docs/LAEL_MVP_v0.3.zh.md`
7. `docs/LAEL_TEST_PLAN_v0.3.zh.md`
8. `docs/LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md`
9. `docs/LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md`
10. `docs/LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md`
11. `docs/LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md`
12. `docs/LAEL_REAL_ENVIRONMENT_TEST_REPORT_2026-06-04.zh.md`
13. `docs/LAEL_INTERNAL_TECHNICAL_ONE_PAGER_2026-06-06.zh.md`
14. `docs/LAEL_AGT_INTEGRATION_v0.3.zh.md`
15. `docs/LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md`
16. `docs/LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md`
17. `docs/LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md`
18. `docs/LAEL_BNB_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md`
19. `docs/LAEL_SOLANA_MAINNET_SMALL_VALUE_TRANSFER_REPORT_2026-06-15.zh.md`
20. `docs/LAEL_LUFFA_APP_QR_SCHEMA_REQUEST_2026-06-16.zh.md`
21. `docs/LAEL_LUFFA_APP_ENDLESS_MAINNET_TASK_REWARD_REPORT_2026-06-16.zh.md`
22. `docs/LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md`
23. `docs/LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md`
24. `docs/LAEL_WALLET_STABILITY_FIX_REPORT_2026-06-16.zh.md`

## 当前能力摘要

- Execution Loop Console：展示 Mapping DID、Agent Binding、Intent、Permission、Execution、Settlement / Evidence、Feedback、Learning。
- Project Docs：前端项目文档入口，说明定位、架构、流程、模块、操作、注意事项和文档索引。
- Microsoft AGT Adapter PoC：作为 Governance Extension 的可选治理积木。
- 多链钱包：Base、BNB、Solana、Endless 的主网和测试网展示。
- 钱包入口：MetaMask / OKX Wallet、Phantom / Solana Wallet、Endless Web Wallet、Luffa App / Endless SDK。
- Base Sepolia acceptance：作为默认真实链上手工验收主线，前端 Manual Tests 展示 txHash、explorer link、receipt、feedback、learning 路径。
- Base / BNB / Solana / Endless Mainnet guard：当前公网 demo 默认 `LAEL_ENABLE_MAINNET_EXECUTION=true`；真实执行仍需要页面 `mainnetRiskAccepted`、`LAEL_MAINNET_MAX_AMOUNT_ETH` 金额上限、人工钱包确认和真实 txHash。
- Endless QR / WebView authorization：支持 `luffa-endless-auth:v1` browser session、signed QR payload、callback、polling、authorization receipt；真实 App callback 必须带 `publicKey/fullMessage/signature` 并通过验签。P0 原生协议验收继续保留在 Luffa App QR。
- Endless Web Wallet execution：为避免 Luffa App WebView bridge 在 `packageTransactionV2` / `signAndSubmitTransaction` payload 上反复返回空 `rawData`、`1006/1009` 或 `GeneralError.invalidParameter`，P1/P2 的真实 Endless 链上 txHash 优先走官方 `@endlesslab/endless-web3-sdk`；交易 payload 使用 `AccountAddress.fromBs58String`、`u128` 金额和 ABI type tags。
- Task Reward business flow：支持 `businessAction=task_reward` proposal、wallet / Endless Web Wallet / Luffa App authorization、settlement receipt、feedback 和 learning signal。
- June 15 delivery track：当前阶段所有 deliverables 需要在 2026-06-15 前完成，关键路径是 Base Sepolia 真实钱包验收和 real-environment report。
- Wallet Integration Demo Script：已有 3-5 分钟演示脚本，以真实 Base Sepolia txHash、receipt、feedback/learning、mainnet guard 和 Endless QR 为主线。
- Real-environment Test Report：已补齐 Base Sepolia 钱包、BaseScan、completed receipt、Feedback Submitted、Base Mainnet guard、Endless QR waiting / mock approved 截图证据。
- Internal Technical One-pager：已完成一页内部技术摘要，覆盖 Runtime Fabric 定位、已验证能力、证据、安全边界、风险和下一步。
- QA Runner：本地白名单自动化测试入口。
- Evidence / Learning：展示 receipt、trace digest、sensitivity、learning item、policy suggestion。

## 安全边界

- 主网真实价值执行 env gate 当前默认打开；小额实测仍必须同时满足页面二次确认、金额上限、人工钱包确认和真实 txHash。
- 主网 receipt 记录必须带真实钱包 txHash；后端 `/v2/payment-agent/proposals/:id/execute` 和前端 `Approve & Record` 都会拒绝主网空 txHash 或 `mock_` txHash，避免把 mock / signed-only 状态误标为真实链上完成。
- WalletConnect / Project ID 当前不作为 MVP 能力展示。
- Microsoft AGT 不替代 Luffa DID、wallet signing、settlement、receipt 或 learning。
- Learning 不自动提高额度。
- Learning 不自动加入新收款人。
- Learning 不绕过人工确认。
- Learning 不自动导出训练数据。
- Endless / Luffa App 独立二维码授权已升级为 `luffa-endless-auth:v1`；`protocol_mock` 不能算真实 App 联调完成。
- Endless / Luffa App 登录绑定必须使用 `businessAction=login`，签名消息不得夹带转账 intent、amount 或 recipient；转账 / Task Reward 才使用业务授权签名。
- 真实 Luffa App callback 缺少 `publicKey/fullMessage/signature`、session nonce 不匹配或重复 callback 时必须拒绝。
- 真实 Luffa App QR / WebView callback 必须配置 `LAEL_PUBLIC_CALLBACK_BASE_URL=https://...` 公网 HTTPS tunnel；未配置时 `callbackLocalOnly=true`，只能算本地协议验收。
- Cloudflare quick tunnel 是临时地址，已在本地 P0/P1 联调中多次出现 530 / WebView 重复授权弹窗；真实 Luffa App 验收优先使用 named tunnel `lael-luffa-app-dev` 和 `https://lael.clawworld.eu.cc`。
- 每次真实 Luffa App 扫码前必须先跑 `npm run health:luffa-app`；该检查覆盖本地 API、前端、public callback runtime config、连续公网 HTTPS 探测和临时 QR `/scan` 页面。失败时不要扫码，先重启 tunnel / API 并生成新 QR。
- Luffa App QR 登录/授权不等于真实链上 txHash。当前真实 Endless testnet/mainnet 小额 transfer / task_reward 验证优先使用 Endless Web Wallet；Luffa App bridge 的真实交易提交仍需 App 端确认支持的 `packageTransactionV2` payload 格式后再恢复为主线。
- 2026-06-16 复测补充：采用与已成功登录授权相同的 HTTPS `/scan` WebView QR 后，Luffa App 原生 QR/WebView 授权链路再次跑通。Login session `endless_qr_3e50b59e-c22d-4b7b-8e50-221ce9ca2de3` 返回 `callbackSource=qr_scan_callback`、`signatureVerified=true`、`approvedWithoutTxHash=true`，证明 P0 signed authorization 成立。随后 Task Reward session `endless_qr_c8d56363-bba3-43b0-bb64-f6ec129fb388` 进入 App bridge：`connect` 成功、`signMessage` 成功、后端 `/build-transaction` 成功生成 `serializedTransaction` 和 sender hex address，但 `packageTransactionV2` 对 `{ serializedTransaction: { data, sender } }` 仍返回 `status=error`、`errorMsg=1006`、`rawData=""`，没有 `txHash`。结论：P0 Luffa App QR/WebView 授权协议可验收；P1/P2 的 Luffa App 真实链上提交仍是 App bridge payload/schema 兼容问题，不应继续反复扫码，也不能标记为真实链上完成。
- 2026-06-16 修复完成：对照 Luffa SuperBox bridge 文档后，WebView 交易流程改为 `packageTransactionV2(payload JSON string) -> rawData -> signAndSubmitTransaction(rawData) -> hash`，不再把后端 BCS serialized transaction 直接传给 `packageTransactionV2`。真实 Luffa App 扫码确认后，Task Reward session `endless_qr_ada79865-c6b3-40cd-a9aa-4de5ed052dda` 返回 txHash `D48oBNUHyigrBzpgWRvqyRyGpGNDXnsjKpht9hN9GGNL`，`signatureVerified=true`、`approvedWithoutTxHash=false`。链上 receipt 验证 `status=SUCCESS`、`vm_status=Executed successfully`、block `188157957`。LAEL 已记录 proposal `proposal_bc49fc78-cf38-420d-8b84-9978a4331ede`、execution `exec_e1dafda5-df76-4278-a3bf-f53571042c9f`、settlement `settle_e770c575-657f-4772-a1b4-862798569c7e`、feedback 和 learning。P0/P1/P2 关键闭环现在已用 Luffa App + Endless Mainnet 真实 txHash 跑通。

## 标准验证命令

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
./node_modules/.bin/vitest run --config vitest.config.ts
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
cd src/frontend && NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

## 当前验证状态

最近一次完整验证（2026-06-12）：

- TypeScript root check：通过。
- Targeted P0/P1/P2 vitest：6 files / 59 tests 通过。
- Root vitest：18 files / 145 tests 通过。
- VARR tests：31 tests 通过。
- Frontend build：通过。
- Local smoke：API `/v2/payment-agent/memory/did:luffa:user_001` 200；Frontend `/` 200；Chrome headless 点击 `Task Reward` 后显示 proposal、`Business action` 和 `task_reward`。

新会话继续开发前，如涉及代码或文档测试，请重新运行相关验证，不要只依赖本记录。

本轮定向验证（2026-06-15）：

- TypeScript root check：通过，`./node_modules/.bin/tsc -p tsconfig.json --noEmit`。
- Targeted P0/P1/P2 vitest：4 files / 30 tests 通过，覆盖 `tests/endless-qr.test.ts`、`tests/mvp2-payment-agent.test.ts`、`tests/frontend-wallet-menu.test.ts`、`tests/project-docs.test.ts`。
- Endless Web Wallet SDK 已加入前端依赖：`@endlesslab/endless-web3-sdk`。普通浏览器里的 Endless value tx 不再默认要求用户反复扫码 Luffa App，而是调用 Web Wallet `connect` / `signMessage` / `signAndSubmitTransaction`。
- 2026-06-15 会话报告：`docs/LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md`。P2 Task Reward 已能生成 `0.001 EDS` proposal，并完成 Web Wallet binding / verify。Testnet 阶段曾阻塞在 Endless Web Wallet 弹窗解锁后 `Confirm` 按钮灰色不可点；随后已切到用户明确授权的 Endless Mainnet 小额路径完成真实 txHash。
- 本轮继续修复（2026-06-15）：恢复 API / frontend / Cloudflare named tunnel 后，`https://lael.clawworld.eu.cc/v2/runtime-config` 返回 200。前端 Endless Web Wallet 路径已显式调用 `sdk.open()`，Task Reward 收款人固定为 Alice 的 Endless 地址 `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`，为 `signAndSubmitTransaction` 增加 `maxGasAmount`、`gasUnitPrice`、`expireTimestamp` options，并在请求钱包确认前用 `getAccountEDSAmount` 检查 sender EDS 余额是否覆盖 reward + gas budget。随后用户完成主网钱包确认并返回真实 txHash。最新 `npm run health:luffa-app` 已恢复 `ok: true`，本地 API / frontend / public runtime / public scan page 均通过；真实 Luffa App 扫码仍需生成新 QR，不可复用旧 QR。
- 本轮验证补充（2026-06-15）：`tests/docs.test.ts` + `tests/project-docs.test.ts` + `tests/frontend-wallet-menu.test.ts` 共 39 tests 通过；TypeScript root check 通过；root vitest 全量 18 files / 158 tests 通过；VARR Node tests 31 tests 通过；frontend build 通过；`npm run health:luffa-app` 返回 `ok: true`。
- 本轮主网小额尝试（2026-06-15）：用户明确允许使用主网 EDS 后，API 以 `LAEL_ENABLE_MAINNET_EXECUTION=true`、`LAEL_MAINNET_MAX_AMOUNT_ETH=0.001`、`LAEL_PUBLIC_CALLBACK_BASE_URL=https://lael.clawworld.eu.cc` 启动；local/public runtime-config 均返回 200，`npm run health:luffa-app` 返回 `ok: true`。前端生成 Endless Mainnet Task Reward proposal，金额 `0.001 EDS`，收款人为 Alice `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`，主网风险确认已勾选。活动 sender 为 `EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2`；该页面首次余额预检返回 `0 EDS`，用户充值后使用 `@endlesslab/endless-ts-sdk` 在 Endless Mainnet 查询确认余额为 `10 EDS`。用户完成真实钱包确认后，Endless Mainnet Task Reward 主网闭环已完成：`0.001 EDS` to Alice，txHash `G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid`，execution `exec_00e02bbd-dc7a-467f-bb1e-4fcb4464e21e`，settlement `completed`，mode `real`，app auth `approved`，feedback submitted，learning updated，agent score `0.93 -> 0.94`。Luffa App bridge 真实交易仍未完成，继续归类为 App bridge payload/schema 兼容问题。
- 链上 receipt 补强（2026-06-15）：修复 `/v2/settlement/tx/:txHash` 按 `chainId` 精确选择验证 adapter；`chainType=endless&chainId=220` 现在使用 Endless Mainnet RPC。查询 `G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid` 返回 `status=SUCCESS`、`blockNumber=188036997`、sender `EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2`、recipient `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`、payload amount `100000` base units、`vm_status=Executed successfully`。
- 钱包不可见根因定位（2026-06-15）：Endless Web Wallet SDK 会把 modal 位置写入 `localStorage`，此前 iframe 坐标曾落在 `x≈1358`，用户当前 Chrome 窗口内不可见，但 Chrome 仍认为扩展 UI 正在打开。前端已在 `src/frontend/app/globals.css` 强制 `#endless_dapp_modal_container` 固定到左上角可见区域；验证后 iframe 坐标变为 `x≈16`、`y≈56`。此修复只影响钱包 iframe 可见性，不改变交易 payload、金额、收款人或主网 gate。
- Luffa App QR parser 复测（2026-06-15）：在 API / frontend / `https://lael.clawworld.eu.cc` 均在线且 `npm run health:luffa-app` 为 `ok: true` 后，连续生成新 QR 复测。JSON payload、`protocol=luffa-endless-auth:v1` 兼容 JSON、`protocol=luffa-endless-auth` key=value 最小 login QR 均被手机 App 扫码入口提示“无效二维码”；最小 login session `endless_qr_d96f0a34-89b2-44b3-a893-7e46afad942b` 在有效期内保持 `waiting`，`/debug` events 为空，没有 `/scan`、`/claim` 或 `/callback` 命中。结论：当前阻塞发生在 Luffa App 本地 QR parser/schema，不是 Cloudflare callback、session 过期或交易 payload。继续扫码前必须拿到 App 端实际接受的 QR schema / deep link 规范。
- BNB Mainnet 小额自转闭环（2026-06-15）：用户明确确认执行 BNB Mainnet `0.000001 BNB` 自转，并选择使用当前 LAEL 前端连接的钱包 `0xC32428B4B31873F41E6a6b81028080469E2d4492`。修复 `bnb mainnet` prompt 被解析为 `BNB_TESTNET` 的问题后，前端生成 `BNB_MAINNET` proposal，OKX Wallet 返回真实 txHash `0x0985baaf632a8f8a6c9b474c78dfc71935029d6e6007ddf27e2f7b207acb9736`。public BSC Mainnet RPC receipt 返回 `status=0x1`、`gasUsed=21000`、from/to 均为该钱包；LAEL 记录 execution `exec_3a85ba42-f526-4c40-a628-53b52e9460fc`、settlement `settle_4607ced7-d095-4df3-833e-90561dc871eb`、mode `real`、app auth `approved`，并完成 feedback 和 learning。2026-06-16 用户确认主网测试通过即可，BNB Testnet 仅保留为可选补证。
- Solana Mainnet 小额自转闭环（2026-06-15）：用户明确确认执行 Solana Mainnet `0.000001 SOL` 自转，钱包/收款地址 `CDP7oDAHNKPRuEFo5VqhrtSyhQwWiEScj91hyepJAiSC`。真实 signature `4YLEVpKSGd3wCLApqgPsVHx9nCjbG6Cavcb1cqmj23JyXHZi84CwLKFGShpQR84p8BiviwJFFNU5GRx2UyHhqK16` 经 public Solana RPC 验证为 `finalized`、`err=null`、`slot=426702421`、self-transfer `1000 lamports`。LAEL 记录 execution `exec_19f2155b-521b-48b6-8816-6b834494835c`、settlement `settle_bca3bdaf-d7fa-458a-b31a-5f26023414b6`、feedback 和 learning。同步修复 Solana Mainnet RPC 选择、mainnet guard 文案/状态兜底、Solana receipt adapter `searchTransactionHistory`。
- 主网 receipt 防误记补强（2026-06-15）：发现 Solana UI 可在空 txHash 时走到 local mock receipt 后，补充前后端双重 guard。任何主网链路在 `Approve & Record` / `/execute` 时都必须提供非 `mock_` 的真实钱包 txHash；否则返回 `Mainnet value execution requires a real txHash` 或前端阻断日志。该修复不改变测试网/mock 协议验收路径。
- Luffa App QR/WebView 复测（2026-06-16）：`npm run health:luffa-app` 返回 `ok: true`，local/public runtime-config 均返回 200。使用公共 HTTPS `/scan` QR 后，login signed authorization 成功，receipt `endless_auth_5a6632e2-4944-4db8-8d9a-477e2a0a88df`，`signatureVerified=true`。Task Reward 复测改为先后端构建 Endless serialized transaction，再调用 App bridge `packageTransactionV2`；后端 build 成功，App bridge 仍返回 `1006/rawData=""` 且无 `txHash`。本轮已验证 `npm run typecheck`、`npm test -- tests/endless-qr.test.ts`、`npm run build` 通过，并重启 API 使用新 dist。
- Luffa App bridge 修复与真实 txHash（2026-06-16）：改用 Luffa App 文档中的两步 bridge 流程后，`packageTransactionV2` 成功返回 `rawData`，`signAndSubmitTransaction` 成功返回 hash `D48oBNUHyigrBzpgWRvqyRyGpGNDXnsjKpht9hN9GGNL`。`/v2/settlement/tx/...chainType=endless&chainId=220` 验证 `SUCCESS`。LAEL Task Reward 业务闭环完成并写入 feedback / learning；详见 `docs/LAEL_LUFFA_APP_ENDLESS_MAINNET_TASK_REWARD_REPORT_2026-06-16.zh.md`。
- P0-P2 综合结论（2026-06-16）：`docs/LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md` 已汇总 P0 Luffa App QR / WebView 授权、P1 Endless / BNB / Solana / Base 真实小额钱包闭环、P2 Task Reward 业务闭环、服务状态、自动化验证和非阻塞备注。当前 P0-P2 可标记为阶段完成；BNB Testnet / Solana Devnet 已按用户指令由主网小额测试替代，仅保留为可选补证。
- 全量回归与前端稳定性（2026-06-16）：修复 QA Runner `frontend-build` 覆盖 live dev server 产物导致 CSS 404 / 裸 HTML 的问题。前端 dev 使用 `.next-live`，build 使用 `.next-build`，QA Runner 的 frontend smoke 现在会检查 stylesheet 200，并把 root vitest / VARR tests 隔离到 mock 测试环境。全自动检查 run `qa_mqg0m76y` 通过；详见 `docs/LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md`。
- 钱包交互稳定性（2026-06-16）：修复 Endless Web Wallet modal 关闭和 30 秒 account / transaction timeout；Solana Mainnet 默认小额 proposal 固定为 `0.000001 SOL`，Phantom 签名前增加 balance + fee preflight，Solana RPC 失败会 fallback 并写入页面日志，不再触发 Next Runtime Error overlay。`tests/frontend-wallet-menu.test.ts` 7/7 通过、TypeScript 通过、frontend build 通过；详见 `docs/LAEL_WALLET_STABILITY_FIX_REPORT_2026-06-16.zh.md`。

当前服务状态记录（2026-06-12）：

- 本轮停止 demo video 工作；未生成新版 narration，未 retime，未重建 MP4。
- 本轮阶段报告：`docs/LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md`。
- 若要做真实 Luffa App callback，需启动 API / Frontend，并配置 `LAEL_PUBLIC_CALLBACK_BASE_URL=https://...` 为手机可访问的公网 HTTPS tunnel。
- 稳定 Cloudflare named tunnel：`/Users/xyz/.cloudflared/lael-luffa-app-dev.yml` 必须固定 `protocol: http2`，再运行 `cloudflared tunnel --config /Users/xyz/.cloudflared/lael-luffa-app-dev.yml run lael-luffa-app-dev`；日常本地 API 使用 `ENABLE_LAEL_QA_RUNNER=true LAEL_PORT=3000 LAEL_PUBLIC_CALLBACK_BASE_URL=https://lael.clawworld.eu.cc node dist/index.js` 或 `npm run start:local`，使前端全自动检查按钮保持可用。
- QA Runner 仍只允许 localhost；即使本地开关开启，带 `cf-connecting-ip`、`x-forwarded-for` 等代理客户端头的公网请求也会被拒绝。
- Quick tunnel 只作为 fallback：`cloudflared tunnel --url http://127.0.0.1:3000 --protocol http2 --no-autoupdate`；拿到新 `trycloudflare.com` 地址后，重启 API：`LAEL_PORT=3000 LAEL_PUBLIC_CALLBACK_BASE_URL=https://<current-tunnel-host> node dist/index.js`。
- 任何 tunnel URL 变化、Cloudflare 1033/530、API 进程重启，都会让旧 QR / 旧 session 不再可用于真实 App 验收；必须重新点击 Endless Testnet / Luffa App 生成新 QR。
- `/scan` 页面已加单 session 防重复提交保护；signed callback 成功后，同一 session 的 WebView reload 应显示已提交状态，不应再次触发签名弹窗。
- 扫码前固定执行：`npm run health:luffa-app`。只有 `ok: true` 且 `endless.scan-page.public` 通过时，才进入真实 App 扫码验收。
- 当前服务状态（2026-06-16 钱包稳定性修复后）：API `127.0.0.1:3000` 在线，Frontend `127.0.0.1:3001` 在线；public callback `https://lael.clawworld.eu.cc` 当前返回 Cloudflare `1033 / 530`，`npm run health:luffa-app` 因 public runtime / scan page 失败而不通过。根因是当前本机 TUN / DNS 把 Cloudflare tunnel edge 解析到 `198.18.*`，`cloudflared` 到 edge 报 `TLS handshake with edge error: EOF`。本地钱包测试可继续，Luffa App QR / WebView 扫码必须等 tunnel 恢复并重新生成新 QR。
- 前端日常 dev 使用 `src/frontend/.next-live`，build 使用 `src/frontend/.next-build`；不要让 `next build` 覆盖 live dev server 的输出目录。`.next-build` / `.next-live` 是本地运行产物，已加入 `.gitignore`。

## 下一步建议

优先候选：

1. 重启 API / frontend / Cloudflare named tunnel，并确认 `http://127.0.0.1:3000`、`http://127.0.0.1:3001`、`https://lael.clawworld.eu.cc/v2/runtime-config` 都 ready。
2. 继续整理 Endless Mainnet `task_reward` 证据：本轮已完成真实 txHash、receipt、feedback、learning；后续可补充 explorer 截图 / 链上 receipt 查询，并保持 Cloudflare public callback 恢复任务独立推进。
3. P0-P2 阶段验收已完成；后续若 App 端扫码入口或 bridge schema 变化，按 `npm run health:luffa-app -> fresh QR -> scan -> callback -> receipt` 重新验证，不复用旧 QR。
4. BNB Mainnet `0.000001 BNB` 和 Solana Mainnet `0.000001 SOL` 小额真实闭环已完成；按 2026-06-16 用户确认，BNB Testnet / Solana Devnet 不再作为当前 MVP 验收阻塞项，仅保留为可选补证。
5. 最终交付前重跑 TypeScript、root vitest、VARR tests、frontend build 和 local smoke。
6. 下一次 Luffa App QR / WebView 实测前，先恢复 Cloudflare named tunnel / DNS，让 `https://lael.clawworld.eu.cc/v2/runtime-config` 返回 200，再运行 `npm run health:luffa-app`；只有 `ok=true` 时才生成新 QR，不复用 1033 / 530 期间的旧 QR。

## 维护规则

- 后续每次重要迭代提交前，必须更新本文件。
- 如果新增需求文档、测试计划、测试报告、截图报告或系统说明，必须同时更新：
  - `NEXT_SESSION_HANDOFF.md`
  - `docs/README.md`
  - `docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`
  - `docs/LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md`
  - 前端 `Project Docs`
- 本文件保持短交接入口，不替代完整需求、MVP、测试计划和测试报告。
