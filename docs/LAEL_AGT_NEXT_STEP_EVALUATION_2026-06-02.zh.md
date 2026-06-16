# LAEL / Luffa Fabric × Microsoft AGT 下一步接入评估报告

日期：2026-06-02  
范围：真实 Microsoft AGT runtime / policy engine、fork 策略、MCP Security Gateway、浏览器人工验收截图报告。  
当前基础：LAEL v0.3 + `MicrosoftAgtAdapter` PoC。

## 1. 总体结论

建议继续推进 AGT 融合，但不要一次性把 AGT 全量接入 Luffa Fabric。

最合适的路线是：

```text
AGT Adapter PoC
-> AGT Policy Engine Sidecar Spike
-> MCP Security Gateway 接入链下 tool call
-> 浏览器人工验收截图报告
-> 再评估是否 fork AGT
```

核心判断：

| 问题 | 结论 | 优先级 |
| --- | --- | --- |
| 是否接入真实 AGT runtime / policy engine | 接，但先以 sidecar / adapter spike 接入，不进核心依赖 | P1 |
| 是否 fork AGT | 暂不 fork；等真实 adapter 跑通后再决定 | P3 |
| 是否接入 MCP Security Gateway | 接，优先用于链下 Agent / MCP tool call | P1 |
| 是否新增浏览器人工验收截图报告 | 接，作为演示与对外评审材料 | P0 |

## 2. 参考资料

- Microsoft AGT GitHub：`https://github.com/microsoft/agent-governance-toolkit`
- Microsoft AGT Docs：`https://microsoft.github.io/agent-governance-toolkit/`
- Microsoft Open Source Blog：`https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/`
- Microsoft MCP Security 相关文章：`https://developer.microsoft.com/blog/securing-mcp-a-control-plane-for-agent-tool-execution`
- 本地附件：`/Users/xyz/Downloads/Microsoft AGT 与Luffa Fabric的关系.md`
- 当前实现文档：`docs/LAEL_AGT_INTEGRATION_v0.3.zh.md`

AGT 当前仍标注为 Public Preview，官方说明中也提到 GA 前可能有 breaking changes。因此不能把 AGT 作为 LAEL 核心协议的强依赖。

## 3. 是否接入真实 Microsoft AGT runtime / policy engine

### 结论

建议接入，但采用 **AGT Policy Engine Sidecar Spike**，不要直接把 AGT runtime 嵌进 LAEL core。

### 推荐方式

当前 LAEL 是 TypeScript / Node 代码库，AGT 主要示例和包偏 Python / 多语言组件。为了避免破坏 LAEL 当前稳定性，建议新增一个独立 sidecar：

```text
LAEL Core
-> GovernanceAdapter interface
-> Microsoft AGT Sidecar Client
-> AGT policy engine / govern()
-> Decision Record
-> Luffa Permission Decision / Execution Receipt
```

Sidecar 只暴露稳定 JSON API：

```text
POST /governance/evaluate
```

输入：

```json
{
  "mappingDid": "did:luffa:user_001",
  "agentDid": "did:luffa:agent:openclaw_stub",
  "externalAgentId": "openclaw_stub",
  "action": "community.summary",
  "toolName": "community_summary",
  "riskContext": {
    "contextSensitivity": "public",
    "riskLevel": "LOW"
  }
}
```

输出：

```json
{
  "source": "Microsoft AGT",
  "decision": "ALLOW",
  "decisionRecordId": "agt_decision_xxx",
  "reason": "Allowed by AGT policy",
  "matchedRule": "allow_low_risk_tool_call",
  "policyDigest": "sha256...",
  "degraded": false
}
```

### 为什么不直接嵌入 core

- AGT 仍是 Public Preview。
- LAEL core 需要保持稳定、可测试、可替换。
- 当前 LAEL 的核心资产是 DID、Permission、Execution Receipt、Settlement、Learning，而不是绑定某个外部治理 SDK。
- Sidecar 可以在失败时 fallback 到 Luffa Native Policy，并记录 degraded evidence。

### 接入范围

第一阶段只接：

- Off-chain Runtime Agent。
- MCP tool call。
- community summary / report。
- destructive tool deny。
- private context deny。
- publish / send / delegation require confirmation。

第一阶段不接：

- 真实 wallet signing。
- 真实 on-chain transfer execution。
- 真实 DEX swap execution。
- settlement write authority。

## 4. 是否 fork AGT 并适配 Luffa DID / wallet value action / A2A / settlement metadata

### 结论

暂不 fork。

建议等真实 AGT sidecar / adapter 跑通后，再根据实际阻塞点决定是否 fork。

### 不立即 fork 的原因

- AGT 仍处于 Public Preview，fork 后维护成本高。
- 当前 LAEL 需要的是治理能力接入，不是复制 AGT 全部架构。
- DID mapping、wallet、settlement、learning 是 Luffa 自己的核心能力，不需要为了接入 AGT 改成 AGT schema。
- Fork 过早会让产品叙事变成 “Luffa 是 AGT 改造版”，这不符合 LAEL 定位。

### 何时 fork

只有出现以下情况时才考虑 fork：

| 触发条件 | 是否值得 fork |
| --- | --- |
| AGT policy schema 无法表达 Luffa DID / Agent DID / Mapping DID | 可以考虑 |
| AGT decision record 无法携带 wallet / value action metadata | 可以考虑 |
| AGT 无法表达 A2A delegation chain | 可以考虑 |
| AGT 无法输出 Luffa receipt 所需的 deterministic evidence field | 可以考虑 |
| 只是需要 wrapper / adapter / JSON mapping | 不 fork |

### 如果 fork，怎么 fork

推荐采用 soft fork：

```text
upstream: microsoft/agent-governance-toolkit
fork: luffa-ai/agent-governance-toolkit-lael
branch: lael-did-value-action-adapter
```

Fork 改造范围只限：

- Luffa DID / Mapping DID identity adapter。
- Wallet / value action policy schema extension。
- A2A delegation chain metadata。
- Settlement metadata。
- Luffa evidence / receipt mapping。

不建议改：

- AGT core execution model。
- AGT conformance tests。
- AGT package structure。
- AGT public API 名称，除非必须。

## 5. 是否把 AGT MCP Security Gateway 接入真实 MCP tool call

### 结论

建议接入，而且优先级高于 fork。

MCP Security Gateway 和 Luffa Fabric 的 Off-chain Agent Runtime 最匹配。它能解决 LAEL 链下 Agent 路径最容易被质疑的问题：

- MCP tool poisoning。
- tool drift。
- typosquatting。
- hidden instruction。
- tool call 级别的拦截和审计。

### 推荐架构

```text
External Agent / Codex / Claude Code / OpenClaw
-> Luffa Runtime Adapter
-> AGT MCP Security Gateway
-> LAEL Permission Decision
-> MCP Server / Tool
-> Execution Receipt
-> Evidence Digest
-> Feedback
-> Learning
```

### 接入方式

优先接当前仓库的 MCP 工具入口：

- `src/mcp/tools.ts`
- `src/mcp/server.ts`

新增 MCP governance wrapper：

```text
tool call request
-> normalize tool name / action / args
-> AGT MCP scan
-> LAEL permission check
-> execute tool
-> record AGT decision + Luffa receipt
```

### MVP 验收场景

| 场景 | 预期 |
| --- | --- |
| 正常 summary tool | allow，生成 receipt |
| hidden instruction in tool description | block 或 high risk |
| destructive tool name / args | deny |
| typosquatting tool | deny 或 warning |
| tool schema drift | deny 或 requires confirmation |
| AGT unavailable | fallback to Luffa Native Policy，记录 degraded evidence |

### 关键边界

- MCP Security Gateway 只管 tool-call-level governance。
- 它不替代 Luffa DID mapping。
- 它不执行 settlement。
- 它不绕过 human confirmation。
- 它必须把 decision record 交回 Luffa evidence layer。

## 6. 是否新增浏览器人工验收截图报告

### 结论

建议立即做，优先级 P0。

原因：

- 当前 AGT 融合不只是代码能力，更需要证明前端能解释清楚。
- 对外评审时，截图比测试日志更容易理解。
- 这能验证 Execution Loop Console 是否真正展示出 AGT 是 governance brick，而不是核心协议。

### 建议报告名称

```text
docs/LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md
/Users/xyz/Downloads/LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md
```

### 截图验收内容

| 截图 | 内容 |
| --- | --- |
| 1 | 首页 Execution Loop Console，展示 Mapping DID / Agent ID / External Agent ID / Wallet Address |
| 2 | Runtime Agent tab，展示 Governance Source = Microsoft AGT Adapter |
| 3 | Runtime Receipt，展示 AGT Decision Record / matched rule / disclosure |
| 4 | Evidence panel，展示 AGT decision record evidence card |
| 5 | Learning panel，展示 learning item 和安全边界 |
| 6 | Manual Tests panel，展示 AGT / Runtime 相关测试状态 |

### 人工验收结论字段

报告应包含：

- 浏览器 URL。
- 前后端服务状态。
- 操作步骤。
- 截图路径。
- 每项验收结果。
- 发现的问题。
- 是否影响 MVP demo。

## 7. 推荐实施顺序

### Step 1：浏览器人工验收截图报告

目的：先证明当前 AGT Adapter PoC 在 UI 上可理解。

输出：

- `LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md`
- 截图文件。

### Step 2：AGT Policy Engine Sidecar Spike

目的：验证真实 AGT policy engine 能通过 adapter 接入 LAEL。

输出：

- `src/governance/agt-sidecar-client.ts`
- AGT sidecar demo policy。
- allow / deny / require approval / unavailable fallback tests。

### Step 3：MCP Security Gateway PoC

目的：验证真实 MCP tool call 可以被 AGT gateway 拦截。

输出：

- MCP governance wrapper。
- tool poisoning / hidden instruction / drift tests。
- receipt evidence mapping。

### Step 4：Fork 决策复盘

目的：根据 sidecar 和 MCP PoC 的真实阻塞点决定是否 fork。

输出：

- fork / no-fork decision memo。
- 如果 fork，列出最小 schema 改造清单。

## 8. 风险和缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| AGT Public Preview breaking changes | 真实 SDK 接入可能不稳定 | 通过 sidecar / adapter 隔离，不进入 LAEL core |
| AGT 与 Luffa DID schema 不一致 | 身份映射不完整 | 保持 Luffa DID 为主，AGT 只接收映射后的身份字段 |
| MCP Gateway 只能管 tool call，不能提供 OS 隔离 | 安全边界可能被误解 | 文档明确 AGT 是 application-layer governance，不是容器级隔离 |
| Fork 后维护成本上升 | 工程负担加重 | 不到真实阻塞点不 fork |
| UI 展示不清楚 | 对外评审误解 AGT 和 Luffa 的关系 | 先做浏览器验收截图报告 |

## 9. 最终建议

短期：

- 立即做浏览器人工验收截图报告。
- 保留当前 `MicrosoftAgtAdapter` PoC。
- 新增 AGT Policy Engine Sidecar Spike。

中期：

- 接入 AGT MCP Security Gateway 到真实 MCP tool call。
- 把 AGT decision record 稳定映射进 Luffa Evidence / Receipt。

长期：

- 只有在 adapter 无法满足 Luffa DID、wallet value action、A2A delegation、settlement metadata 时才 fork AGT。

最终判断：

> AGT 应该被 Luffa Fabric 吸收为治理能力组件，而不是被吸收为 Luffa Fabric 的核心协议。优先接真实 policy / MCP gateway，暂缓 fork。

