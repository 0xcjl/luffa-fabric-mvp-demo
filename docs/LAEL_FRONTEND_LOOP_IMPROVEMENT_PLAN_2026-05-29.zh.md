# Luffa Fabric 前端闭环与测试面板改进计划

> 日期：2026-05-29  
> 阶段：MVP v0.3 前端演示与测试验收体验改进  
> 对应测试报告：`docs/LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md`

## Summary

本计划用于解决当前 MVP 前端体验“流程割裂、链上/链下路径不清楚、自动化测试和人工测试混在一起、Evidence 与 Learning 展示不足”的问题。

目标是把现有 `Runtime Agent / On-chain Value Agent / Evidence / Learning` 页面升级为一个更连贯的 **Luffa Fabric Execution Loop Console**，让用户可以从 Mapping DID / Luffa DID 出发，看到 Agent 执行闭环如何经过 Identity、Permission、Execution、Settlement / Evidence、Feedback 和 Learning。

## 1. 统一执行闭环视图

新增顶部 `Execution Loop Board`，不再让用户只靠多个 tab 理解流程。

闭环节点：

1. Mapping ID
2. Agent Binding
3. Intent / Request
4. Permission Decision
5. Execution Lane
6. Settlement / Evidence
7. Feedback
8. Learning

每个节点需要展示状态：

| 状态 | 含义 |
|---|---|
| idle | 未开始 |
| active | 进行中 |
| pass | 已通过 |
| manual_required | 需要人工确认 |
| blocked | 被策略阻断 |
| fail | 执行失败 |
| simulated | 模拟执行或仅记录 |

## 2. 链上 / 链下双路径展示

执行闭环需要从共同的 Mapping DID / Luffa DID 出发，然后分成两支：

| 分支 | 含义 | MVP 动作 |
|---|---|---|
| Off-chain Agent Runtime | OpenClaw、Codex、Claude Code、API Agent 等链下执行 | Runtime Adapter -> Context Boundary -> Trace Digest -> Receipt -> Learning |
| On-chain Value Runtime | transfer、swap proposal、settlement、payment、claim、reward 等链上价值动作 | Wallet / Protocol -> Human Confirmation -> Tx or Simulated Swap -> Settlement Record -> Receipt -> Learning |

这两条路径不能被做成两个独立产品，而是同一个 LAEL Runtime Fabric 下的两条执行 lane。

## 3. Identity Mapping 展示

前端需要明确区分以下身份：

| 字段 | 含义 |
|---|---|
| Mapping DID / Luffa DID | LAEL 的统一锚点身份 |
| Agent ID | LAEL 内部 Agent 身份 |
| External Agent ID | OpenClaw / Codex / Claude Code / API Agent 等外部 runtime 标识 |
| Wallet Address | 链上路径使用的钱包身份 |
| Binding Status | 是否完成映射绑定 |

链下 Agent 和链上钱包都应映射回同一个 Luffa DID，以便追踪执行责任和学习上下文。

## 4. Automated Tests 面板

自动化测试必须和人工测试分开展示。

新增独立 `Automated Tests` 面板，并提供明显按钮：

```text
Run Full Automated Checks
```

该按钮调用本地安全 QA Runner：

```http
POST /v2/qa/runs
GET /v2/qa/runs/:runId
```

安全边界：

- 默认关闭，只有 `ENABLE_LAEL_QA_RUNNER=true` 时启用。
- 仅允许本地请求。
- 只运行固定白名单命令。
- 不允许前端传任意 shell 命令。
- 返回逐项状态、耗时和摘要。

自动化测试项：

| 测试项 | 说明 |
|---|---|
| Root typecheck | 根项目 TypeScript 检查 |
| Root vitest | 根项目 vitest |
| VARR tests | VARR runtime 测试 |
| Frontend build | Next.js 前端构建 |
| API smoke test | 后端基础 API smoke |
| Frontend page smoke test | 前端页面 smoke |

## 5. Manual Tests 面板

人工测试必须按顺序列出，并能手动标记状态。

人工测试步骤：

| 顺序 | 测试项 | 期望结果 |
|---|---|---|
| 1 | Off-chain Agent summary | receipt + trace digest + learning signal |
| 2 | On-chain ETH transfer | proposal -> wallet signature -> txHash -> receipt |
| 3 | Simulated swap proposal | permission + simulated receipt，不真实交易 |
| 4 | Invoice / fiat proof | settlement proof receipt，不真实支付 |
| 5 | Failure: amount over limit | blocked receipt or risk record |
| 6 | Failure: recipient not allowlisted | blocked permission decision |
| 7 | Failure: wrong network | blocked permission decision |
| 8 | Failure: prompt injection | blocked or human confirmation preserved |
| 9 | Failure: user cancels signature | no wallet execution，receipt / risk record visible |

每项需要：

- 测试目的
- 当前状态
- 执行按钮
- Mark Pass
- Mark Fail
- 期望结果
- 实际状态标识

## 6. Evidence 展示增强

Evidence 不能只展示 JSON，需要明确：

| 字段 | 展示要求 |
|---|---|
| 是否上链 | On-chain tx / Anchor-ready digest / Off-chain private log / Simulated proof |
| txHash | 真实链上执行时展示 |
| traceDigest | 链下和模拟路径都展示 |
| receiptId | 所有路径展示 |
| settlementId | 有结算记录时展示 |
| 敏感等级 | Public / Internal / Sensitive |
| 披露建议 | 可公开 / 仅内部 / 不建议披露 |

敏感信息原则：

- txHash 和公开链状态可以标为 Public。
- receiptId、traceDigest、policy reason 默认 Internal。
- raw input、wallet address、private context、feedback comment 默认 Sensitive。
- raw input 和 private context 默认不公开。

## 7. Learning 展示增强

Learning 需要展示具体学到了什么，而不是只显示底层 JSON。

每条 Learning item 包含：

| 字段 | 含义 |
|---|---|
| Learned From | 来自成功、失败、用户反馈、权限拒绝、结算结果 |
| Learning Content | 具体学到了什么 |
| Suggestion | 对策略、偏好、UI 或风险控制的建议 |
| Priority | High / Medium / Optional |
| Boundary | 明确不会自动改变什么 |

优先级：

| 优先级 | 含义 |
|---|---|
| High | 安全边界、权限风险、必须人工确认、阻断原因 |
| Medium | 用户偏好记忆，例如默认链、默认资产、常用收款人 |
| Optional | 训练样本、导出建议、UI 便利性建议 |

安全边界：

- 不自动提高额度。
- 不自动加入新收款人。
- 不绕过人工确认。
- 不自动导出训练数据。

## 8. 对应实现

| 实现文件 | 作用 |
|---|---|
| `src/frontend/app/page.tsx` | Execution Loop Console 主界面 |
| `src/frontend/app/loop-model.ts` | 闭环状态、Evidence 分类、Learning 推导 |
| `src/qa-runner/index.ts` | 本地安全 QA Runner |
| `src/api/routes.ts` | QA Runner API 路由 |
| `tests/loop-model.test.ts` | 前端状态模型测试 |
| `tests/qa-runner.test.ts` | QA Runner 安全边界测试 |

## 9. 对应测试报告

本计划的执行结果记录在：

```text
docs/LAEL_FRONTEND_LOOP_TEST_REPORT_2026-05-29.zh.md
```

该报告覆盖：

- 前端闭环视觉改版。
- 身份映射展示。
- 链上 / 链下分支展示。
- 自动化测试面板。
- 后端 QA Runner。
- 人工测试面板。
- Evidence 展示增强。
- Learning 展示增强。
- 根项目类型检查。
- 根项目测试。
- VARR 测试。
- 前端构建。
- API smoke。
- 浏览器核心人工验收。

## 10. Assumptions

- 当前仍是本地 MVP，不做生产级测试执行服务。
- QA Runner 只用于本地开发验收，不暴露到公网。
- On-chain transfer 保持真实钱包签名路径。
- Swap 第一阶段仍是 simulated proposal，不接真实 DEX。
- Fiat / invoice proof 第一阶段只做 proof record，不接 Stripe、银行或 on/off-ramp provider。
- 前端使用文字标记加颜色状态灯，不依赖 emoji 作为唯一状态信号。
