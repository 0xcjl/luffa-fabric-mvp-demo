# LAEL / Luffa Fabric 完整需求文档 v0.3

## 定位

**LAEL / Luffa Fabric: Verifiable Adaptive Resource Runtime for Agentic Economy**

LAEL 是 Luffa 的 Agentic Runtime Fabric，也是外部 AI Agent、社区、应用与服务可接入的可信执行基础设施。

LAEL 不是普通 AI Agent 产品，不是聊天机器人，不是 Workflow Builder，不是 MCP Wrapper，也不是 Agent Marketplace。它要解决的核心问题不是 Agent 能不能调用工具，而是：

- 谁在执行？
- 是否有权执行？
- 执行过程是否可控？
- 执行结果是否可验证？
- 价值、资源、成本和奖励是否可以计量和结算？
- 责任是否可以追溯？
- 社区上下文是否可以被学习和沉淀？
- 系统是否能在不突破安全边界的前提下持续优化？

长期目标是将 AI Agent 从工具调用者升级为具备身份、能力边界、执行责任、经济结算、声誉积累和上下文学习能力的可信数字主体。

## 核心闭环

LAEL 的统一执行闭环是：

```text
Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning
```

| 层 | 含义 |
| --- | --- |
| Identity | 统一人、Agent、服务账号、钱包和外部 runtime 身份。 |
| Permission | 用 Smart Permission 判断行动是否允许、是否需要确认、是否超出边界。 |
| Execution | 所有关键 Agent 行为必须通过受控 runtime 或 adapter 执行。 |
| Settlement | 记录价值、成本、奖励、链上交易、法币凭证、API/compute usage。 |
| Evidence | 生成 Execution Receipt、trace digest、settlement proof、可选链上 attestation。 |
| Feedback | 用户或系统反馈必须绑定 receipt。 |
| Learning | 从成功、失败、拒绝、反馈、结算结果中产生 learning signal。 |

## 五个原则

| 原则 | 含义 |
| --- | --- |
| Composable | Agent、Skill、Workflow、Policy、Context、Settlement Rail 可组合。 |
| Verifiable | 关键执行必须产生可验证 evidence，而不是普通日志。 |
| Adaptive | 系统从执行结果、反馈和社区上下文中学习。 |
| Governable | 学习和自动化不能突破权限、安全、隐私、支付和审批边界。 |
| Open Infrastructure | 深度长在 Luffa 上，但通过标准接口服务外部生态。 |

## Governance Extension / Microsoft AGT Adapter

LAEL 的 Permission 层应保持可插拔。Microsoft AGT 可以作为 Permission / Governance Extension Layer 中的一个外接治理积木，用于补强 policy enforcement、tool call interception、audit decision record、MCP security gateway、runtime guard 和 SRE / kill switch。

AGT 不替代 Luffa Fabric 核心协议，也不替代 Luffa DID / Mapping DID、wallet signing、settlement、Execution Receipt、Learning 或 reputation。第一阶段只作为可选 adapter 接入；默认权限模块仍是 Luffa Native Policy。

| AGT 能力 | Luffa 对应层 | 第一阶段处理 |
| --- | --- | --- |
| Policy Engine | Permission Extension | 可选 adapter。 |
| Tool Call Interception | Execution Extension | 优先用于链下 Agent / MCP tool guard。 |
| Audit Decision Record | Evidence Extension | 映射进 Luffa receipt metadata。 |
| Sandbox / Runtime Guard | Execution Extension | 后续可接入。 |
| SRE / Kill Switch | Governance Extension | 后续可接入。 |

## 统一架构

LAEL 采用“链下执行，链上可验证，链上价值执行”的统一架构。

```text
External User / Community / App
-> Agent DID Mapping
-> Intent / Action
-> Smart Permission
-> Runtime Execution
-> Settlement / Resource Accounting
-> Execution Receipt
-> Trace / Evidence Digest
-> Feedback
-> Learning Signal
-> Safer Next Execution
```

## 双路径能力

### Off-chain Agent Execution

面向 OpenClaw、Hermes、Claude Code、Codex、API Agent 等链下 Agent runtime。执行可以发生在链下，但身份、权限、行为轨迹、receipt、settlement proof 和 learning signal 必须能映射回 LAEL。

核心能力：

- 外部 Agent 映射为 LAEL Agent DID。
- Agent 只能读取被授权 context。
- Adapter 不可绕过 runtime 直接执行。
- 每次成功、失败、拒绝、pending approval 都有 receipt。
- 行为轨迹形成 trace digest，可在后续阶段锚定到链上。

### On-chain Value Execution

面向链上价值动作，不只包括 payment，也包括 transfer、trading/swap、settlement、reward、claim、payment。

第一阶段真实执行范围：

- Base Sepolia ETH transfer。
- Base Sepolia USDC transfer。
- Settlement record 和 txHash 记录。

第一阶段模拟范围：

- Trading / swap proposal。
- Fiat proof、invoice proof、resource credit、on/off-ramp intent。

## DID 映射

非链上 Agent 和非 DID 用户也需要授予 LAEL mapping DID。MVP 中的 mapping DID 不要求立刻写入链上，但必须形成稳定映射：

```text
external_agent_id -> did:luffa:agent:* -> execution receipt -> optional on-chain attestation
```

## Evidence 策略

| 层级 | 内容 | MVP 处理 |
| --- | --- | --- |
| Private Log | raw input、context、adapter output、feedback | 本地保存，不公开上链。 |
| Verifiable Digest | receipt hash、trace hash、settlement proof hash | MVP 必须生成或可展示。 |
| On-chain Attestation | DID mapping 或 receipt digest anchoring | 第一阶段可模拟，后续真实上链。 |

## Settlement 定义

Settlement 不等同于 crypto payment。它是 Agent 执行后产生的价值、成本、奖励、支付、资源消耗或结算证明。

| Rail | 含义 | MVP 状态 |
| --- | --- | --- |
| evm-native | ETH/native token transfer | 已实现。 |
| evm-erc20 | USDC/USDT/token transfer | 已实现。 |
| luffa-points | 内部积分或 credit | 已实现。 |
| fiat-proof | 法币支付凭证 | 第一阶段模拟。 |
| invoice-proof | invoice/billing record | 第一阶段模拟。 |
| resource-credit | API cost、compute unit、agent usage | 第一阶段模拟。 |
| onofframp-intent | fiat 与 crypto on/off-ramp 意图 | 第一阶段模拟。 |

## 安全边界

- 不保存 seed phrase、private key、mnemonic。
- 不允许 Agent 自动绕过 human confirmation。
- Learning 不自动提高额度。
- Learning 不自动加入新收款人或新协议。
- Learning 不自动导出训练数据，除非用户明确授权。
- Trading/swap 在第一阶段不接真实 DEX。
- Fiat 在第一阶段不接 Stripe、银行或真实 on/off-ramp provider。
