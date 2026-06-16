# LAEL / Luffa Fabric MVP 文档 v0.3

## MVP 标题

**Unified Agent Runtime Fabric MVP: Off-chain Execution, On-chain Verifiability, On-chain Value Execution**

MVP 不拆成两个产品，而是在一个统一 LAEL Runtime Fabric 下提供两条验收路径：

- Off-chain Agent Execution：证明 OpenClaw/Codex Stub 等链下 Agent 可以被识别、授权、执行、追踪、反馈和学习。
- On-chain Value Execution：证明 transfer、settlement、trading/swap proposal、fiat/invoice proof 等价值动作可以被权限控制、生成 receipt，并进入 learning。

## MVP 场景矩阵

| 路径 | MVP 场景 | 第一阶段深度 |
| --- | --- | --- |
| Off-chain Agent Execution | OpenClaw/Codex Stub 读取 public community context，生成 summary/report | 真实 runtime execution + receipt + learning；链上 anchoring 先模拟 |
| On-chain Value Execution | Base Sepolia ETH/USDC transfer | 真实钱包签名 + txHash + receipt + feedback + learning |
| On-chain Trading/Swap | ETH -> USDC swap proposal | 第一阶段只做 proposal + permission + simulated receipt，不接真实 DEX |
| Fiat / On-off-ramp | invoice/payment proof | 第一阶段只做 proof record，不接 Stripe/银行 |

## 必须验收的能力

- Agent DID mapping。
- Permission decision card。
- Governance source：Luffa Native Policy / Microsoft AGT Adapter / Combined。
- Execution receipt。
- Trace / evidence digest。
- Settlement record。
- Feedback。
- Learning signal / memory。
- 成功路径和失败路径。
- 安全边界：不自动提高额度、不自动加入收款人、不绕过人工确认、不自动导出训练数据。

## 用户故事 A：Off-chain Agent Execution

Michael 选择一个 OpenClaw/Codex Stub Agent。系统为这个外部 Agent 映射一个 `did:luffa:agent:*`。

Michael 授权该 Agent 读取一个 public community context，并执行 summary/report 任务。

LAEL 执行：

1. Resolve Agent DID mapping。
2. Check capability：read、summarize、generate_receipt。
3. Check context boundary：public、same namespace、allowed subject。
4. Run through RuntimeOrchestrator。
5. Generate Execution Receipt。
6. Generate trace / evidence digest。
7. Submit feedback。
8. Emit learning signal。

失败路径：

- 缺少 capability -> denied receipt。
- private context -> denied receipt。
- cross namespace -> denied receipt。
- high-risk publish -> pending approval receipt。
- forbidden action -> denied before adapter execution。

AGT Adapter PoC：

- low-risk summary -> AGT `ALLOW` -> Luffa receipt metadata 记录 AGT decision record。
- destructive / private-context tool -> AGT `DENY` -> Luffa denied receipt。
- publish / delegate / high-risk tool -> AGT `REQUIRES_CONFIRMATION` -> 不执行，保留人工确认边界。
- AGT unavailable -> fallback to Luffa Native Policy，并记录 degraded evidence。

## 用户故事 B：On-chain Value Execution / Transfer

Michael 连接钱包并切到 Base Sepolia。系统绑定 owner DID 与 wallet。

Michael 对 Agent 说：

```text
帮我转 0.00001 ETH 给 Alice
```

LAEL 执行：

1. Parse transfer intent。
2. Check recipient allowlist。
3. Check amount limit。
4. Check asset allowlist。
5. Check chain allowlist。
6. Require human confirmation。
7. User signs wallet transaction。
8. Record txHash and settlement record。
9. Generate v0.2 receipt。
10. Submit feedback and update memory。

## 用户故事 C：On-chain Trading/Swap Proposal

Michael 输入：

```text
Swap 0.0001 ETH to USDC on Base Sepolia
```

第一阶段不执行真实 DEX。系统只生成 simulated swap proposal：

- parsed intent：fromAsset、toAsset、amount、chain、slippageBps、protocol。
- permission decision：allowed / blocked / pending human confirmation。
- simulated receipt：证明系统已完成权限检查和模拟结算记录。

失败路径：

- amount 超限。
- asset 不在 allowlist。
- chain 不允许。
- slippage 超限。
- 尝试绕过确认。

## 用户故事 D：Fiat / Invoice Proof

Michael 为一次 Agent 服务创建 invoice/payment proof。系统不连接真实 Stripe 或银行，只创建 proof settlement record：

- rail：fiat-proof 或 invoice-proof。
- amount：法币金额。
- currency：USD 等。
- reference：invoice id 或 payment proof id。
- status：simulated_completed。
- receipt：绑定 Agent、owner、purpose、proof hash。

这条路径证明 fiat 可以作为 settlement proof 进入 LAEL，而不是把 MVP 变成普通法币支付产品。

## 当前实现对应

| 能力 | 当前状态 |
| --- | --- |
| VARR runtime | 已有 sidecar runtime、capability、context、receipt、learning tests。 |
| Payment Agent transfer | 已有 Base Sepolia ETH/USDC、BNB Testnet、Solana Devnet、Endless Testnet / Luffa App proposal、wallet signing / app authorization、receipt、feedback、memory。 |
| Task Reward business flow | 已有 `businessAction=task_reward` proposal、wallet / Luffa App authorization、settlement receipt、feedback、learning signal。 |
| Settlement adapter | 已有 Luffa Points、EVM native、EVM ERC20、Solana native / SPL abstraction、Endless native / Luffa App authorization abstraction。 |
| Swap proposal | 已有 simulated value-agent flow，不接真实 DEX。 |
| Fiat/invoice proof | 已有 proof settlement rails，不接真实 Stripe、银行或 on/off-ramp provider。 |
| 前端双路径演示 | 已有 Execution Loop Console、Runtime Agent、On-chain Value Agent、Evidence / Learning、Project Docs。 |

## 多链钱包支持

| 网络 | MVP 深度 | 钱包/授权路径 | 备注 |
| --- | --- | --- | --- |
| Base Sepolia / Base Mainnet | Sepolia 支持真实 EVM 钱包签名 + txHash receipt；Mainnet 默认只做连接、proposal 和 permission 展示，受控小额实测需要安全门 | MetaMask / OKX Wallet | Base Sepolia 仍是默认主演示链；Mainnet 真实执行默认禁用，必须显式开启 env gate 和页面二次确认。 |
| BNB Testnet / BNB Mainnet | Testnet 支持真实 EVM 钱包签名 + txHash receipt；Mainnet 只做连接、proposal 和 permission 展示 | MetaMask / OKX Wallet | 前端提供 Add BNB Testnet to OKX 操作；Mainnet 真实执行默认禁用。 |
| Solana Devnet / Solana Mainnet | Devnet 支持 wallet binding + signature receipt；Mainnet 只做连接、proposal 和 permission 展示 | Phantom / Solana Wallet | 当前优先支持 SOL native，SPL token 真实转账后续扩展。 |
| Endless Testnet / Luffa App | Luffa App / Endless SDK connect、signMessage、signAndSubmitTransaction；`luffa-endless-auth:v1` QR / WebView signed callback | `@luffalab/luffa-endless-sdk` / QR session API | Endless 不按 EVM add-network 处理；真实 App callback 必须验签。 |

当前边界：

- OKX Endless 原生支持需要 OKX 公开 Endless provider 或支持 Endless Wallet Standard。
- Luffa App 独立二维码授权已升级为 `luffa-endless-auth:v1`；mock callback 只生成 `protocol_mock` receipt，真实 App callback 必须带 `publicKey/fullMessage/signature` 并通过验签。
- Mainnet 真实价值执行不作为当前 MVP 默认路径。

2026-06-04 更新：详见 `LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md`。Base Mainnet 小额实测必须满足 `LAEL_ENABLE_MAINNET_EXECUTION=true`、页面 `mainnetRiskAccepted` 和 `LAEL_MAINNET_MAX_AMOUNT_ETH`；Endless QR mock callback 只代表本地协议级验收。

2026-06-12 更新：详见 `LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md`。本轮停止 demo video，优先推进真实 Luffa App QR / WebView 授权、BNB / Solana / Endless 手工证据和 Task Reward 业务场景。
