# LAEL / Luffa Fabric 前端闭环与测试面板改进测试报告

> 报告日期：2026-05-29  
> 本地时间：09:47 WAT  
> 仓库路径：`/Users/xyz/Documents/luffa-fabric`  
> 前端地址：`http://127.0.0.1:3001/`  
> 后端地址：`http://127.0.0.1:3000/`  
> QA Runner：本地启用，`ENABLE_LAEL_QA_RUNNER=true`

## 0. 对应关系

本报告是 LAEL / Luffa Fabric v0.3 的**第二轮测试报告**，对应：

- `docs/LAEL_FRONTEND_LOOP_IMPROVEMENT_PLAN_2026-05-29.zh.md`

前一轮 v0.3 文档与基础功能落地测试报告为：

- `docs/LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md`

两份测试报告覆盖不同阶段：`LAEL_TEST_REPORT_v0.3_2026-05-28.zh.md` 覆盖 v0.3 文档、API、VARR、swap、fiat proof 等基础能力；本报告覆盖前端闭环控制台、QA Runner、Evidence / Learning UI 和浏览器验收。本报告不替代前一份测试报告。

## 1. 结论

本轮围绕“前端闭环不连贯、链上/链下路径不清晰、自动化测试和人工测试混在一起、Evidence/Learning 展示不充分”的问题，已完成一次完整改版。

当前结果：

- 新版前端已变成 **Execution Loop Console**，能从 Mapping DID / Luffa DID 出发，展示完整 LAEL 执行闭环。
- 前端已明确区分 **Mapping DID / Luffa DID、Agent ID、External Agent ID、Wallet Address、Binding Status**。
- 闭环线路已分成两支：
  - **Off-chain Agent Runtime**
  - **On-chain Value Runtime**
- 自动化测试已独立为 **Automated Tests** 面板，并支持前端按钮触发本地安全 QA Runner。
- 人工测试已独立为 **Manual Tests** 面板，按 9 个步骤展示状态、目的、按钮和结果标记。
- Evidence 已能展示是否上链、敏感等级、披露建议。
- Learning 已能展示学到了什么、建议、优先级和安全边界。
- 自动化验证、QA Runner 全量白名单检查、前端构建、API smoke、浏览器页面验收均已通过。

严格意义上，本轮完成的是 **本地 MVP 可演示和可验收层面的前端/测试控制台升级**。链上真实转账仍依赖用户钱包签名和 Base Sepolia 网络状态，不在自动化测试中强制执行真实资产转出。

## 2. 本轮更新与优化内容

| 模块 | 更新/优化 | 实际效果 |
|---|---|---|
| 前端主界面 | 将页面标题和结构升级为 `Execution Loop Console` | 不再只是分散 tab，而是一个统一执行控制台 |
| Identity Mapping | 新增 Mapping DID / Luffa DID、Agent ID、External Agent ID、Wallet Address、Binding Status | 清楚表达链下 Agent、链上钱包都映射回 Luffa DID |
| Execution Loop | 新增 8 个闭环节点：Mapping ID、Agent Binding、Intent、Permission、Execution Lane、Settlement/Evidence、Feedback、Learning | 用户可以看到 Agent 当前运行到哪一步 |
| 分支线路 | 新增 Off-chain Agent Runtime 和 On-chain Value Runtime 两条分支 | 表达链下 Agent 和链上 Value Agent 的差异，同时共享同一 DID 锚点 |
| 状态标记 | 新增 idle、active、pass、manual_required、blocked、fail、simulated 等状态 | 通过颜色和状态文本识别等待、通过、失败、阻断、模拟 |
| Runtime Agent | 保留 OpenClaw/Codex stub summary demo，并接入闭环状态 | 点击 `Run Summary` 后更新 receipt、trace digest、evidence、learning |
| On-chain Value Agent | 保留 ETH/USDC transfer、wallet signing、simulated swap proposal | 链上真实转账和模拟 swap 都归入同一 On-chain Value Runtime |
| Evidence | 新增 Evidence 卡片和敏感分级 | 显示 On-chain tx / Anchor-ready digest / Off-chain private log / Simulated proof，以及 Public/Internal/Sensitive |
| Learning | 新增 Learning 卡片 | 展示 Learned From、Learning Content、Suggestion、Priority、Boundary |
| Automated Tests | 新增独立自动化测试面板 | 前端可点击 `Run Full Automated Checks` 启动白名单检查 |
| Manual Tests | 新增独立人工测试面板 | 9 个测试步骤逐项展示，可运行、标记通过、标记失败 |
| 后端 QA Runner | 新增 `/v2/qa/runs`、`/v2/qa/runs/:runId` | 本地开关控制、只跑固定白名单命令、不接受前端任意命令 |
| 前端状态模型 | 新增 `loop-model.ts` | 前端状态推导、Evidence 分类、Learning 优先级可测试 |
| 自动化测试 | 新增 `loop-model.test.ts`、`qa-runner.test.ts` | 覆盖闭环状态、Evidence 敏感分级、Learning 优先级、QA runner 安全边界 |

## 3. 关键文件

| 文件 | 作用 |
|---|---|
| `src/frontend/app/page.tsx` | 新版 Execution Loop Console 主界面 |
| `src/frontend/app/loop-model.ts` | 闭环状态、Evidence 分类、Learning 推导逻辑 |
| `src/qa-runner/index.ts` | 本地安全 QA Runner |
| `src/api/routes.ts` | 新增 QA Runner API 路由 |
| `tests/loop-model.test.ts` | 前端状态模型测试 |
| `tests/qa-runner.test.ts` | QA Runner 安全与结果测试 |

## 4. 自动化测试结果

### 4.1 新增测试

| 测试文件 | 覆盖内容 | 结果 |
|---|---|---|
| `tests/loop-model.test.ts` | Off-chain 成功状态、On-chain 人工确认状态、Swap simulated 状态、Evidence 分类、Learning 优先级 | 5 tests passed |
| `tests/qa-runner.test.ts` | QA runner 默认关闭、固定白名单、逐项状态结果 | 2 tests passed |

新增测试合计：

| 项目 | 结果 |
|---|---|
| Test Files | 2 passed |
| Tests | 7 passed |

### 4.2 根项目全量测试

命令：

```bash
./node_modules/.bin/vitest run --config vitest.config.ts
```

结果：

| 项目 | 结果 |
|---|---|
| Test Files | 12 passed |
| Tests | 94 passed |
| 失败 | 0 |

通过的测试范围包括：

- wallet
- chains
- settlement adapters
- execution ledger
- security
- integration
- e2e MVP flow
- docs consistency
- payment agent
- value agent
- loop model
- QA runner

### 4.3 TypeScript 类型检查

命令：

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

结果：

| 项目 | 结果 |
|---|---|
| 根项目 TypeScript 检查 | 通过 |

### 4.4 VARR 测试

命令：

```bash
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
```

结果：

| 项目 | 结果 |
|---|---|
| Tests | 31 passed |
| Failed | 0 |

覆盖范围包括：

- API trusted execution loop
- runtime safety decisions
- duplicate resource conflict
- snapshot reload
- receipt generation
- context boundary
- feedback validation
- capability checks
- resource validators
- risk classifier

### 4.5 前端构建

命令：

```bash
cd src/frontend
NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

结果：

| 项目 | 结果 |
|---|---|
| Next.js production build | 通过 |
| Static page generation | 通过 |
| Type check in frontend build | 通过 |

构建提示：

| 提示 | 影响 |
|---|---|
| `pino-pretty` optional dependency warning from WalletConnect / pino | 非阻断，构建通过 |
| Node localStorage experimental warning during QA runner build | 非阻断，构建通过 |

## 5. QA Runner 真实运行结果

本轮新增的前端按钮会调用后端：

```http
POST /v2/qa/runs
```

当前服务以如下方式启用：

```bash
ENABLE_LAEL_QA_RUNNER=true
```

真实运行结果：

| 字段 | 值 |
|---|---|
| runId | `qa_mpqm85e0` |
| status | `pass` |
| durationMs | `64421` |

逐项结果：

| QA 项 | 结果 | 说明 |
|---|---|---|
| Root typecheck | pass | 根项目类型检查通过 |
| Root vitest | pass | 12 files / 94 tests passed |
| VARR tests | pass | 31 tests passed |
| Frontend build | pass | Next.js build 通过 |
| API smoke test | pass | `/v2/chains` 可访问并返回 chains |
| Frontend page smoke test | pass | 页面包含 `Execution Loop Console` 和 `Luffa Fabric Execution Loop` |

本轮中曾发现一次 QA smoke 文案过期问题：前端标题已从 `Unified Agent Runtime Fabric` 改成 `Execution Loop Console`，但 smoke 仍检查旧文案。已修复为检查新版闭环控制台文案，重新运行后通过。

## 6. API Smoke 测试

### 6.1 Simulated Swap Proposal

请求：

```http
POST /v2/value-agent/swap-proposals
```

结果：

| 字段 | 值 |
|---|---|
| status | 201 |
| action | swap |
| amount | 0.0001 |
| fromAsset | ETH |
| toAsset | USDC |
| chainKey | BASE_SEPOLIA |
| protocol | simulated-dex |
| permission | allow_pending_human_confirmation |
| executionMode | simulated |

结论：

- Swap proposal 正常生成。
- 权限结果正确要求人工确认。
- 未触发真实 DEX 交易，符合 MVP 边界。

### 6.2 Invoice Proof Settlement

请求：

```http
POST /v2/settlement/transfer
```

结果：

| 字段 | 值 |
|---|---|
| status | 201 |
| asset | FIAT_USD |
| rail | invoice-proof |
| settlement status | COMPLETED |
| transactionRef | invoice-proof:invoice-smoke |

结论：

- Fiat / invoice proof record 正常生成。
- 未触发真实 Stripe、银行或 on/off-ramp 调用。
- 符合“proof settlement only”的 MVP 边界。

## 7. 浏览器人工验收结果

浏览器地址：

```text
http://127.0.0.1:3001/
```

可见验收结果：

| 验收项 | 结果 |
|---|---|
| 页面可打开 | 通过 |
| 第一屏显示 `Execution Loop Console` | 通过 |
| 显示 Mapping DID / Luffa DID | 通过 |
| 显示 Agent ID | 通过 |
| 显示 External Agent ID | 通过 |
| 显示 Wallet Address | 通过 |
| 显示 Binding Status | 通过 |
| 显示 Luffa Fabric Execution Loop | 通过 |
| 显示 8 个闭环节点 | 通过 |
| 显示 Off-chain Agent Runtime 分支 | 通过 |
| 显示 On-chain Value Runtime 分支 | 通过 |
| Automated Tests 和 Manual Tests 分离 | 通过 |
| 点击 `Run Summary` 后生成 Runtime Receipt | 通过 |
| 点击后闭环状态更新为 Runtime receipt / Trace digest / Learning signal | 通过 |
| Evidence 出现 Anchor-ready Digest / Internal / 仅内部 | 通过 |
| Learning 出现 Optional 建议和 Boundary | 通过 |

## 8. 当前本地服务状态

| 服务 | 地址 | 状态 |
|---|---|---|
| LAEL backend | `http://127.0.0.1:3000` | 运行中 |
| Frontend | `http://127.0.0.1:3001` | 运行中 |

监听进程：

| 端口 | 进程 |
|---|---|
| 3000 | `node`, PID `29281` |
| 3001 | `node`, PID `28921` |

## 9. 安全边界确认

| 边界 | 当前实现 |
|---|---|
| QA Runner 默认关闭 | 是，必须设置 `ENABLE_LAEL_QA_RUNNER=true` |
| QA Runner 不接受任意命令 | 是，只运行固定白名单 |
| QA Runner 仅本地使用 | 是，路由检查 localhost 请求 |
| Swap 不真实执行 DEX | 是，仅 proposal + simulated receipt |
| Fiat / invoice 不真实支付 | 是，仅 proof settlement record |
| Learning 不自动提高额度 | 是 |
| Learning 不自动加入新收款人 | 是 |
| Learning 不绕过人工确认 | 是 |
| Learning 不自动导出训练数据 | 是 |
| On-chain transfer 仍需钱包签名 | 是 |

## 10. 剩余风险与后续建议

| 风险 / 未完成项 | 说明 | 建议 |
|---|---|---|
| 真实链上转账未纳入自动化测试 | 自动化测试不应强制真实资产转出 | 保留为人工验收项 |
| QA Runner 当前为同步运行 | 点击后会等待完整测试结束才返回 | 后续可改为异步队列，先返回 runId，再轮询状态 |
| 前端页面较大 | `page.tsx` 已承载较多 UI 和业务状态 | 后续可拆成 `components/ExecutionLoopBoard.tsx`、`components/TestPanels.tsx` 等 |
| Runtime Agent 仍是 stub demo | OpenClaw/Codex stub 用于 MVP 展示，非真实外部 Agent 连接 | 后续接入真实 OpenClaw / Codex adapter |
| Evidence 链上 anchoring 仍未真实上链 | 当前展示 Anchor-ready digest | 后续可加 optional on-chain attestation |
| Browser manual test 未覆盖所有 9 个手动步骤逐项点击 | 已验证核心 Runtime path，自动化覆盖状态模型和 API | 后续做完整人工录屏或截图集 |

## 11. 最终验收状态

| 验收组 | 状态 |
|---|---|
| 前端闭环视觉改版 | 通过 |
| 身份映射展示 | 通过 |
| 链上 / 链下分支展示 | 通过 |
| 自动化测试面板 | 通过 |
| 后端 QA Runner | 通过 |
| 人工测试面板 | 通过 |
| Evidence 展示增强 | 通过 |
| Learning 展示增强 | 通过 |
| 根项目类型检查 | 通过 |
| 根项目测试 | 通过 |
| VARR 测试 | 通过 |
| 前端构建 | 通过 |
| API smoke | 通过 |
| 前端页面 smoke | 通过 |
| 浏览器核心人工验收 | 通过 |

结论：本轮计划中的前端闭环与测试面板改进已完成，当前本地版本可以继续用于 MVP 演示、自动化验收和人工验收。
