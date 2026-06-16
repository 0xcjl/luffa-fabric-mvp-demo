# Microsoft AGT 融入 Luffa Fabric 的总体评估与融合方案 v0.3

## 定位结论

Microsoft Agent Governance Toolkit（AGT）适合融入 Luffa Fabric，但不应作为 Luffa Fabric 的底层核心或主架构替代品。

更准确的定位是：

> Microsoft AGT 是 Luffa Fabric Permission / Governance Extension Layer 里的一个外接治理积木。

Luffa Fabric 继续保持统一闭环：

```text
Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning
```

AGT 主要补强其中的 Permission、Execution Guard、Audit / Evidence、MCP Security、SRE / Kill Switch 能力。Luffa 自己保留 DID mapping、wallet / value execution、settlement、receipt、learning、reputation、on-chain anchoring 作为核心能力。

## 参考依据

- Microsoft AGT 官方仓库：`https://github.com/microsoft/agent-governance-toolkit`
- 本地附件：`/Users/xyz/Downloads/Microsoft AGT 与Luffa Fabric的关系.md`
- 当前 LAEL v0.3 文档：`docs/LAEL_REQUIREMENTS_v0.3.zh.md`

AGT 官方 README 当前强调它面向 autonomous AI agents，提供 policy enforcement、identity、sandboxing、SRE；同时标注为 Public Preview，GA 前可能有 breaking changes。因此第一阶段应按 adapter 接入，不应作为强绑定核心依赖。

## 能力映射

| AGT 能力 | 对应 Luffa Fabric 层 | MVP 接入方式 | 备注 |
| --- | --- | --- | --- |
| Policy Engine | Permission Extension | PoC adapter | 作为 Luffa Native Policy 之后的可选外部治理判断。 |
| Tool Call Interception | Execution Extension | Off-chain Runtime Guard | 优先用于 OpenClaw / Codex Stub / MCP tool call。 |
| Audit Decision Record | Evidence Extension | 映射为 receipt metadata | 不替代 Luffa Execution Receipt。 |
| MCP Security Gateway | Permission + Execution Guard | 第一阶段模拟 | 用于 tool poisoning、hidden instruction、tool drift 风险展示。 |
| Sandbox / Runtime Guard | Execution Extension | 可选模块 | 适合后续接高风险链下 runtime。 |
| SRE / Kill Switch | Governance Extension | 后续模块 | 第一阶段只做架构说明。 |

## 推荐架构

```text
Luffa Fabric
├─ Identity Extension
│  ├─ Luffa DID / Mapping DID
│  ├─ Agent DID
│  └─ External Agent ID / Wallet Address Binding
├─ Permission Extension
│  ├─ Luffa Native Policy Module
│  ├─ Microsoft AGT Adapter
│  ├─ OPA / Cedar Adapter
│  ├─ Wallet Permission Guard
│  └─ MCP Tool Permission Guard
├─ Execution Extension
│  ├─ Off-chain Runtime Adapter
│  ├─ AGT Runtime Guard / Sandbox
│  └─ On-chain Value Executor
├─ Evidence Extension
│  ├─ Luffa Execution Receipt
│  ├─ AGT Decision Record Mapping
│  └─ Trace Digest / Optional On-chain Anchor
├─ Settlement Extension
└─ Learning / Reputation Layer
```

标准流程：

```text
Intent / Tool Call
-> Resolve Luffa DID + Agent DID
-> Luffa Native Policy pre-check
-> Optional AGT policy evaluation
-> Optional AGT MCP / runtime guard
-> Luffa Permission Decision Card
-> Execution
-> AGT Decision Record + Luffa Execution Receipt
-> Settlement / Evidence Digest
-> Feedback
-> Learning Signal
```

## 当前实现策略

本仓库第一阶段实现的是 `MicrosoftAgtAdapter` PoC，而不是直接引入 AGT runtime 包。

原因：

- AGT 当前仍是 Public Preview。
- MVP 需要证明治理积木如何接入 Luffa 闭环，而不是绑定某个外部 SDK。
- Luffa Native Policy 仍必须是默认权限模块。
- On-chain transfer / swap / settlement 不应交给 AGT 执行。

当前 PoC 行为：

| 输入场景 | AGT Adapter 决策 | Luffa 处理 |
| --- | --- | --- |
| community summary / read public context | `ALLOW` | 继续执行，并把 AGT decision record 写入 receipt metadata。 |
| delete / drop / truncate / execute_code / private_context | `DENY` | 阻断执行，生成 denied receipt。 |
| send / publish / delegate / transfer / swap / high risk | `REQUIRES_CONFIRMATION` | 不执行，生成需要人工确认的 receipt / risk record。 |
| AGT unavailable | `ALLOW` with `degraded=true` | 回退到 Luffa Native Policy，并记录 degraded evidence。 |

## 安全边界

- AGT 不替代 Luffa DID / Mapping DID。
- AGT 不负责 wallet signing。
- AGT 不执行 settlement。
- AGT 不绕过 human confirmation。
- AGT decision record 只作为 evidence item，不替代 Luffa Execution Receipt。
- 不公开 raw input、private context、wallet address 或 feedback comment。

## 后续路线

| 阶段 | 做法 |
| --- | --- |
| MVP-AGT-1 | 文档和架构对齐，明确 AGT 是 Governance Extension 积木。 |
| MVP-AGT-2 | Permission Adapter PoC，输出 Luffa-compatible governance decision record。 |
| MVP-AGT-3 | Off-chain Runtime Guard，用于 OpenClaw / Codex Stub / MCP tool call。 |
| MVP-AGT-4 | Evidence Mapping，把 AGT record 映射进 Luffa receipt / trace digest。 |
| MVP-AGT-5 | 如果 PoC 成立，再评估 fork 或真实 SDK 接入。 |
