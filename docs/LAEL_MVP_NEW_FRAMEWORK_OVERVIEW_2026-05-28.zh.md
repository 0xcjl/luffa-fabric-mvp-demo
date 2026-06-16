# LAEL / Luffa Fabric MVP 新框架梳理：链下执行，链上可验证，链上价值执行

## Summary

MVP 不应该分裂成“非链上产品”和“链上产品”，而应该统一成：

> **LAEL / Luffa Fabric 是一个面向 Agentic Economy 的 Verifiable Adaptive Resource Runtime。它支持链下 Agent 执行，也支持链上价值执行，但两者都要通过 DID、Permission、Execution Receipt、Settlement Record、Learning Signal 归一。**

新的 MVP 应该是一个统一 Runtime Fabric，下面两条验收路径：

| 路径 | 更准确命名 | 覆盖范围 |
|---|---|---|
| Lane A | **Off-chain Agent Execution** | OpenClaw、Hermes、Claude Code、Codex、API Agent 等链下 Agent 执行 |
| Lane B | **On-chain Value Execution** | 转账、交易 / swap、链上结算、reward、claim、settlement 等链上价值动作 |

核心补充：**On-chain 不只是 Payment，而是 On-chain Value Execution。Payment Agent 只是第一个 demo agent。**

---

## 功能需求 / 当前实现 / 缺口 / 测试方式

| 模块 | MVP 功能需求 | 当前实现 | 缺口 | 自动化测试方式 | 人工测试方式 |
|---|---|---|---|---|---|
| 产品定位 | LAEL 是统一 Agent Runtime Fabric，不是 wallet demo 或 payment demo | README 已有 Identity → Permission → Execution → Settlement → Learning 叙述 | 需要把“Payment Agent MVP”上升为“双路径 runtime MVP” | 文档审查；README/Quickstart consistency check | 对外讲解时能解释链下 Agent 和链上 Agent 如何归一 |
| 外部 Agent Identity | OpenClaw / Hermes / Claude Code / Codex 等外部 Agent 需要映射 DID | VARR 有 `AgentResource`，支持 `runtime_adapter: mock/openclaw_stub/luffa_stub/custom_api` | 需要明确 “External Agent DID Mapping” 是 MVP 一等能力 | VARR resource validator tests | 注册一个 OpenClaw Stub Agent，展示 agent DID |
| 链下 Agent 执行 | Agent 通过受控 runtime 执行任务，而不是直接调用工具 | VARR `RuntimeOrchestrator` 已有完整路径 | 需要前端/演示页暴露这一条路径 | VARR runtime integration tests | 选择 OpenClaw/Codex Stub，执行 summary/report |
| Context Boundary | Agent 只能读取被授权的 community/context | VARR 已有 public/private、namespace、allowed_subjects 检查 | 需要在 MVP 叙事里强调这是 Luffa 差异化，不是普通 agent runner | private context、cross namespace tests | 尝试读取 private/cross namespace context，看到 denied receipt |
| Capability Permission | 每个 Agent action 都要经过 capability/policy 判断 | VARR capability checker + core policy engine 已有 | 两套 permission 叙事需要统一成 Smart Permission Layer | capability expired/revoked/missing tests | 尝试缺少 capability 的 action，看到 denied |
| Risk / Approval | 高风险 action 不能直接执行 | VARR high-risk → pending approval；core permission 也有 confirmation | 需要统一 approval card 的展示逻辑 | high-risk pending_approval tests | 执行 publish/external share，看到 pending approval |
| Execution Receipt | 所有关键执行都要生成 receipt，包括失败和拒绝 | VARR every path creates receipt；Payment Agent 有 v0.2 receipt | 当前两套 receipt schema 分散，需要统一展示口径 | VARR receipt tests + payment receipt tests | 成功/失败都能打开 receipt 查看 evidence |
| Trajectory / 行为轨迹 | 链下 Agent 要记录时序事件、行为轨迹、trace hash | VARR 有 `trace.event.ts` 类型雏形；execution record 有 merkle hash | 需要补 MVP 级 trajectory view / trace digest | 新增 trace digest tests | 执行链下任务后显示 trajectory events + digest |
| On-chain DID 映射 | 链下 Agent/非 DID 用户最终也应有链上可映射身份 | DID-style ownerRef / agent DID 已存在 | 需要定义 mapping proof：external_id → did:luffa:agent:* → optional on-chain attestation | identity mapping tests | 展示 external agent mapped DID |
| 链上转账 | Agent 发起 ETH/USDC 等链上转账，必须权限检查 + 人工确认 + 钱包签名 | Payment Agent 已支持 Base Sepolia ETH/USDC，ETH 默认、USDC 可选 | 目前场景命名还是 Payment，需要升级为 TransferIntent / OnchainActionIntent | payment-agent tests，wallet tests，settlement tests | Base Sepolia 小额 ETH 转账，生成 txHash 和 receipt |
| 链上交易 / Swap | Agent 可发起 swap/trading intent，但必须强权限和确认 | 当前没有 trading/swap intent；只有 transfer/payment | MVP 可先做 simulated swap proposal，不接真实 DEX；真实 swap 放后续 | 新增 trading intent blocked/allow tests | 输入 “swap 0.0001 ETH to USDC”，先生成 proposal，不真实交易 |
| 链上结算 | 任务、奖励、服务调用可以形成 settlement record | Settlement service 已有 EVM native/ERC20、Solana、Endless、Luffa Points rails | 需要把 settlement 从 payment demo 抽象为 value settlement | settlement-adapters tests | 查看 settlement record：asset、rail、txHash、status |
| Fiat / On-off-ramp | 法币不是 Lane A 的核心，只是 settlement rail 的一种 | 当前无 fiat rail | MVP 第一阶段做 `fiat-proof` / `invoice-proof` / `onofframp-intent` 模拟 record，不接真实支付 | 新增 fiat-proof settlement record tests | 创建一条 invoice/payment proof receipt，不触发真实支付 |
| Learning | 执行结果、用户反馈、失败原因进入 learning | VARR LearningSignal；Payment Agent memory/score/policy suggestion 已有 | 需要统一成 Learning Layer，而不是两套孤立 learning | VARR feedback tests + payment feedback tests | 提交 feedback 后看到 learning signal / memory update |
| Frontend 演示 | 一个 MVP 页面展示两条 runtime path | 当前前端主要是 Payment Agent | 需要增加 tabs：Runtime Agent / On-chain Value Agent / Evidence | 前端 build + API smoke tests | 在 UI 内分别跑链下 summary 和链上 ETH transfer |
| 测试矩阵 | 自动化 + 人工演示覆盖两条路径 | 已有 VARR 31 tests、core 78 tests、前端 build | 需要增加 off-chain + on-chain unified acceptance checklist | CI 跑 VARR + root vitest + frontend build | 录屏：链下执行、链上转账、失败路径、learning |

---

## 文字版详细方案

### 1. 新定位：从 Payment MVP 升级为 Runtime Fabric MVP

当前 Payment Agent 是一个有效的演示，但它只证明了 On-chain Payment 的一个子集。新的 MVP 叙事应该改成：

> LAEL 让任何 Agent 的执行都能被识别、授权、追踪、验证、结算和学习。

Payment / Transfer / Trading 都只是 On-chain Value Execution 的具体 action 类型。OpenClaw / Hermes / Claude Code / Codex 则是 Off-chain Agent Execution 的 adapter 类型。

统一主链路：

```text
External User / Community / App
→ Agent DID Mapping
→ Intent / Action
→ Smart Permission
→ Runtime Execution
→ Settlement / Resource Accounting
→ Execution Receipt
→ Trace / Evidence Digest
→ Feedback
→ Learning Signal
→ Safer Next Execution
```

### 2. Lane A：Off-chain Agent Execution

这条线不是“法币支付线”，而是 **链下 Agent 行为可验证线**。

示例场景：

> 用户授权一个 OpenClaw / Codex 类 Agent 读取某个 community public context，生成 summary/report/draft。LAEL 检查 Agent DID、capability、context boundary、risk，然后通过 runtime adapter 执行，生成 receipt、trace digest、feedback、learning signal。

MVP 应证明：

- 外部 Agent 可以映射为 LAEL Agent DID。
- Agent 不能绕过 Runtime 直接执行。
- Agent 只能读取授权 context。
- 失败、拒绝、pending approval 都有 receipt。
- 行为轨迹可以形成 trace / digest，未来可锚定到链上。
- feedback 能产生 learning signal。

这条线是 Luffa 与普通 Agent 平台的差异化来源。

### 3. Lane B：On-chain Value Execution

这条线要从 “Payment Agent” 扩展成 “On-chain Value Agent”。

覆盖三类动作：

| 类型 | 示例 | MVP 优先级 |
|---|---|---|
| Transfer | 给 Alice 转 0.0001 ETH / 0.01 USDC | P0，当前已基本实现 |
| Settlement | 任务奖励、服务调用费、协议收入记录 | P0/P1，已有 settlement service |
| Trading / Swap | swap ETH → USDC、交易 token、执行策略 | P1，先做 proposal + simulated receipt，不急接真实 DEX |

建议第一阶段不要直接做真实 swap。真实 swap 会引入 DEX、slippage、MEV、token approval、合约风险，复杂度会盖过 Runtime 本身。MVP 可以先做：

- `TradingIntent`
- `Swap Proposal`
- permission check：asset、chain、amount、slippage、recipient、protocol allowlist
- human confirmation required
- simulated settlement / dry-run receipt
- blocked risk record

等 transfer/settlement 证明确认后，再接真实 DEX testnet。

### 4. Settlement 的新定义

Settlement 不再等同于 crypto payment。

统一定义应该是：

> Settlement 是 Agent 执行后产生的价值、成本、奖励、支付、资源消耗或结算证明。

它可以包括：

| Settlement Rail | 含义 | MVP 处理 |
|---|---|---|
| `evm-native` | ETH / native token 转账 | 已支持 |
| `evm-erc20` | USDC / USDT / token 转账 | 已支持 |
| `luffa-points` | 内部积分/credit | 已支持 |
| `fiat-proof` | 法币支付凭证 | 待补，先模拟 |
| `invoice-proof` | invoice / billing record | 待补，先模拟 |
| `resource-credit` | API cost / compute unit / agent usage | 待补，适合链下 Agent |
| `onofframp-intent` | fiat ↔ crypto on/off-ramp 意图 | 后续扩展 |

Michael 提到的 “fiat-crypto on-off ramp solution 最后回归链上” 可以这样落地：

- 短期：记录 fiat proof / invoice proof。
- 中期：把 proof hash / receipt hash 锚定到链上。
- 长期：通过 on/off-ramp 或 stablecoin settlement 完成链上归一。

### 5. Evidence / 链上映射策略

非链上 Agent 不需要每一步都上链，但必须能“链上可映射”。

MVP 可以采用三层证据：

| 层级 | 内容 | 是否上链 |
|---|---|---|
| Private Execution Log | raw input、context、adapter output、feedback | 不上链 |
| Verifiable Digest | receipt hash、trace hash、settlement proof hash | MVP 可本地生成 |
| On-chain Attestation | DID mapping / receipt digest anchoring | P1，可先模拟 anchoring record |

这样既避免过早上链成本，又保留 Luffa 的 DID + Agentic 差异化。

---

## 推荐下一步

1. **先改需求文档和 MVP 表述**
   - 标题改为：`Unified Agent Runtime Fabric MVP`
   - 副标题：`Off-chain Execution, On-chain Verifiability, On-chain Value Execution`

2. **把当前功能重新归档**
   - VARR 归到 `Off-chain Agent Execution`
   - Payment Agent 归到 `On-chain Value Execution / Transfer`
   - Settlement service 归到 shared `Settlement Layer`
   - Learning service + VARR LearningSignal 归到 shared `Learning Layer`

3. **补两个 MVP 缺口**
   - Off-chain 前端演示：OpenClaw/Codex Stub → context summary → receipt → learning
   - On-chain action taxonomy：Transfer / Swap / Settlement 三类 intent，但只把 Transfer 做真实签名，Swap 先做 simulated proposal

4. **暂缓真实 fiat 和真实 DEX**
   - Fiat 先做 proof record。
   - Trading 先做 simulated swap receipt。
   - 真实 Stripe / bank / DEX 放到下一阶段。

## Assumptions

- MVP 仍是体外验证，不接 Luffa production backend。
- 链上真实执行第一阶段只保留 Base Sepolia ETH/USDC transfer。
- Trading/swap 第一阶段只做 proposal + permission + simulated receipt，不做真实 DEX 调用。
- Fiat 第一阶段只做 proof / invoice / onofframp intent，不接真实支付。
- 非链上 Agent 的核心验收是 DID mapping、context boundary、runtime receipt、trace digest、learning signal。
