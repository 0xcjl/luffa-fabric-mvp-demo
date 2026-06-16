# LAEL / Luffa Fabric Internal Technical One-pager

日期：2026-06-06
版本：MVP v0.3
交付目标：2026-06-15 前完成 Full MVP testing、Wallet integration demo、Real-environment test report、Internal technical one-pager，并视稳定性录制 3-5 分钟 demo video。

## 1. 一句话定位

LAEL / Luffa Fabric 是统一 Agent Runtime Fabric（Unified Agent Runtime Fabric），用于把 Agent 的身份、权限、执行、结算、证据、反馈和学习连成可验证闭环。

它不是 chatbot、workflow builder、MCP wrapper、agent marketplace，也不是单一钱包插件。当前 MVP 的重点是证明 Agent 可以在受控权限下执行链下任务和链上价值动作，并把结果转成 receipt、settlement record、feedback 和 learning signal。

## 2. 核心闭环

```text
Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning
```

当前 MVP 两条 lane：

| Lane | 作用 | 当前验证状态 |
|---|---|---|
| Off-chain Runtime | OpenClaw / Codex / Claude Code / API Agent 等链下执行，生成 trace digest 和 receipt | 已有 Runtime Agent、AGT governance extension、Evidence / Learning 展示 |
| On-chain Value Runtime | transfer、simulated swap、settlement proof、wallet signing、txHash receipt | Base Sepolia 真实 txHash 闭环已完成；swap / fiat proof 仍为模拟或 proof-only 路径 |

## 3. 当前已验证能力

| 能力 | 状态 | 证据 |
|---|---|---|
| Base Sepolia wallet binding | 已验证 | 钱包地址 `0xC32428B4B31873F41E6a6b81028080469E2d4492` 映射到 `did:luffa:user_001` |
| Base Sepolia real transfer | 已验证 | txHash `0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b`，BaseScan 显示 `Success` |
| LAEL execution receipt | 已验证 | Receipt 显示 `0.00001 ETH`、`Settlement completed`、`Mode real`、`App auth approved`、真实 txHash 和 explorer link |
| Feedback / Learning | 已验证 | `Feedback Submitted`，agent score `0.90 -> 0.91`，human confirmation preserved |
| Base Mainnet guard | 已验证安全门 | `LAEL_ENABLE_MAINNET_EXECUTION=false` 默认阻止真实主网执行 |
| Endless QR protocol | 协议级验收 | browser session、callback URL、polling、mock approved authorization receipt |
| Simulated swap | 已验证模拟路径 | 不接真实 DEX，不触发真实 swap |
| Fiat / invoice proof | 已验证 proof-only 路径 | 不接 Stripe、银行或 on/off-ramp provider |

## 4. 关键技术模块

| 模块 | 当前作用 |
|---|---|
| Identity / Wallet Binding | 把 Luffa DID、Agent ID、External Agent ID、wallet address 绑定到同一执行主体 |
| Permission / Governance | 使用 Luffa policy 和可选 Microsoft AGT Adapter 做执行前治理；AGT 是 extension，不替代 Luffa DID / wallet signing / settlement |
| Execution Ledger | 记录每次 proposal、execution、receipt 和 idempotency |
| Settlement | 支持 EVM、Solana、Endless、fiat proof、invoice proof、resource credit 等 rail；当前真实验收主线是 Base Sepolia EVM |
| Evidence | 输出 execution receipt、txHash、explorer link、settlement result、evidence sensitivity |
| Feedback / Learning | 记录用户反馈、偏好、agent score 和 policy suggestion；不自动提高额度、不新增收款人、不绕过人工确认 |
| Project Docs | 前端可读项目文档入口，用于 demo、验收和交接 |

## 5. 安全边界

- 主网真实价值执行默认禁用。
- Base Mainnet 小额实测必须同时满足 env gate、页面二次确认和金额上限。
- WalletConnect / Project ID 当前不作为 MVP 能力展示。
- Endless QR mock callback 只代表协议级验收，不代表真实 Luffa App 端到端完成。
- Microsoft AGT 是 Governance Extension 的可选积木，不替代 Luffa 原生 identity、permission、settlement、receipt 或 learning。
- Learning 不自动提高额度、不自动加入新收款人、不绕过人工确认、不自动导出训练数据。
- Simulated swap 不接真实 DEX；fiat proof 不接 Stripe、银行或 on/off-ramp provider。

## 6. 当前风险和待办

| 项 | 状态 | 下一步 |
|---|---|---|
| Receipt UI learning 字段 | 已修复 | feedback 提交后会把 `pending_feedback` 更新成 `updated`，并保留完整 wallet receipt metadata |
| Base Mainnet | 安全门已完成，真实小额实测未作为默认能力 | 如需实测，显式开启 env gate 并严格金额上限 |
| Endless / Luffa App | browser QR protocol 已通，真实 App callback 未接入 | 与 App 端联调扫码授权 callback |
| Demo video | 制作中 | 使用 HyperFrames 制作英文旁白 3-5 分钟 demo video |
| 自动化完整回归 | 待最终交付前重跑 | TypeScript、root vitest、VARR tests、frontend build、local smoke |

## 7. 交付判断

截至 2026-06-06，当前 MVP 已具备做 wallet integration demo 和真实环境测试报告的核心证据。下一步优先完成最终回归验证和可选 demo video；如果要推进链上真实应用落地，优先顺序是：

1. 固化 Base Sepolia demo 截图和视频。
2. 与 Luffa App 打通真实 Endless QR callback。
3. 在安全门下评估一次 Base Mainnet 小额实测。
4. 再设计 Luffa / Endless 链上的真实应用测试用例。
