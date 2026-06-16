# LAEL / Luffa Fabric Wallet Integration Demo Script

日期：2026-06-04
目标：用于 2026-06-15 前 Wallet integration demo、real-environment test report 和可选 3-5 分钟 intro / demo video。
推荐时长：3-5 分钟。
主线：Base Sepolia 真实钱包 txHash -> LAEL receipt -> feedback / learning。

## 1. Demo 定位

开场口径：

> LAEL / Luffa Fabric is a unified Agent Runtime Fabric. It connects identity, permission, execution, settlement, evidence, feedback, and learning for both off-chain agents and on-chain value actions.

中文说明：

- 这不是普通钱包插件，也不是单一 Payment Agent demo。
- 钱包只是 Agent value execution 的入口。
- 重点是：Agent 的价值动作能被授权、签名、记录、验证、反馈和学习。

## 2. Demo 前准备

| 项 | 要求 |
|---|---|
| API | `http://127.0.0.1:3000` |
| Frontend | `http://127.0.0.1:3001` |
| Wallet | MetaMask 或 OKX Wallet |
| Network | Base Sepolia |
| Mainnet env | 默认保持 `LAEL_ENABLE_MAINNET_EXECUTION=false` |
| Test amount | `0.00001 ETH` 或页面默认小额 |
| Recipient | Alice: `0x0000000000000000000000000000000000000002` |

已完成真实链上证据：

```text
Base Sepolia txHash:
0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

Explorer:

```text
https://sepolia.basescan.org/tx/0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

## 3. 3-5 分钟演示流程

### Step 1: Show Unified Runtime Fabric

页面：`Runtime Agent` 或顶部 Execution Loop Console。

讲解：

- 这里展示的是统一闭环：Identity -> Permission -> Execution -> Settlement / Evidence -> Feedback -> Learning。
- Off-chain Runtime 和 On-chain Value 都回到同一条 Luffa DID / receipt / learning 轨道。

验收点：

- 能看到 Mapping DID / Agent ID / External Agent ID / Wallet Address。
- 能看到 Execution Loop Console。

### Step 2: Base Sepolia Wallet Binding

页面：`On-chain Value Agent`。

操作：

1. 选择 `Base Sepolia`。
2. 确认钱包已连接 MetaMask / OKX。
3. 点击 `Bind Wallet`。

讲解：

- Wallet binding 把外部钱包地址映射到 Luffa DID。
- 后续 Agent 只能在 permission policy 允许范围内发起动作。

验收点：

- Wallet address 可见。
- DID binding API 正常。

### Step 3: Generate Transfer Proposal

操作：

1. 输入或保留：`帮我转 0.00001 ETH 给 Alice`。
2. 点击 `Generate Transfer Proposal`。

讲解：

- Agent 先解析 intent。
- Permission guard 会检查金额、资产、收款人、chainKey、human confirmation。
- 这里不会直接转账，必须进入钱包确认。

验收点：

- Proposal 显示 recipient、amount、network、permission reason。
- Permission 不是 bypass，而是 `allow_pending_human_confirmation`。

### Step 4: Wallet Signature And txHash

操作：

1. 点击 `Sign Wallet Tx`。
2. 钱包弹窗中确认 Base Sepolia 小额交易。
3. 页面出现 txHash。

讲解：

- 真实价值动作必须由钱包签名。
- LAEL 不保存私钥，不代替用户签名。
- txHash 是链上可验证证据。

已验证 txHash：

```text
0x1074ef6406df38baa790ee545d4288087938613a4b422cdef6e76b834806246b
```

Explorer 结果：

- Network: Base Sepolia。
- Status: Success。
- Amount: `0.00001 ETH`。
- Recipient: Alice `0x0000000000000000000000000000000000000002`。
- Time: Jun-04-2026 09:16:32 AM UTC。

### Step 5: Approve And Record Receipt

操作：

1. 点击 `Approve & Record`。
2. 查看 Execution Receipt。

讲解：

- LAEL 记录的不是“钱包交易本身”，而是 Agent value action 的执行证据。
- Receipt 包含 chainKey、walletType、executionMode、txHash、settlement result、learning status。

验收点：

- Receipt id 可见。
- txHash 可打开 explorer link。
- Settlement status 可见。

### Step 6: Submit Feedback And Learning

操作：

1. 点击 `Submit Feedback`。
2. 等待 `Feedback Submitted` 状态。
3. 查看 Learning / Memory。

讲解：

- Feedback 会进入 learning memory。
- Learning 可以改进偏好和解析，但不自动提高额度、不新增收款人、不绕过人工确认。

已验证本地 memory：

- preferredAsset: `ETH`。
- preferredChainKey: `BASE_SEPOLIA`。
- preferredRecipientAddress: Alice。
- policy suggestion: `keep_human_confirmation`。

注意：

- 2026-06-04 测试中发现 submit feedback 成功但 UI 没有明显反馈，已修复为 `Submitting Feedback` / `Feedback Submitted` 并阻止重复点击。

### Step 7: Mainnet Safety Gate

页面：切换到 `Base Mainnet`。

讲解：

- Mainnet 真实价值执行默认禁用。
- 只有 `LAEL_ENABLE_MAINNET_EXECUTION=true`、页面 `mainnetRiskAccepted`、金额低于 `LAEL_MAINNET_MAX_AMOUNT_ETH` 时，才允许一次小额实测。
- 这个不是默认 MVP 能力，而是受控验收路径。

验收点：

- 页面显示 mainnet risk confirmation。
- 默认 env 下真实签名会被阻止。

### Step 8: Endless QR Authorization

页面：切换到 `Endless Testnet / Luffa App`。

操作：

1. 点击 `Create QR`。
2. 查看 `sessionId`、`nonce`、`callbackUrl`、status。
3. 无 App 时可点击 `Poll Status`。
4. 本地开发可点击 `Mock App Callback`。

讲解：

- Endless 不按 EVM add-network 处理。
- 真实路径应该是 browser session -> QR payload -> Luffa App approval -> callback / polling -> authorization receipt。
- Mock callback 只代表本地协议级验收，不代表真实 App 已接入。

验收点：

- QR status 可见：waiting / approved / rejected / expired / failed。
- authorization receipt 可见。

## 4. 收尾口径

结尾说明：

- Base Sepolia 已完成真实 txHash 验证。
- Base Mainnet 默认安全关闭。
- Endless QR 已有协议级闭环，真实 App callback 是下一步。
- Swap 仍是 simulated，不接真实 DEX。
- Fiat proof 仍是 proof record，不接银行或 Stripe。
- Learning 保持安全边界，不自动放权。

## 5. Demo 风险和应对

| 风险 | 处理 |
|---|---|
| 钱包网络不在 Base Sepolia | 先切换钱包网络，再演示 |
| 钱包余额不足 | 使用已完成 txHash 作为 evidence replay；不现场重复签名 |
| txHash 生成但 receipt 未记录 | 手动粘贴 txHash 后点击 `Approve & Record` |
| Feedback 看似无反应 | 当前已修复；若旧页面缓存，刷新页面或重启 dev server |
| Endless 没有真实 App callback | 只展示 QR protocol 和 mock callback，不声称端到端完成 |
| Mainnet 被问能否真实执行 | 回答默认禁用，只支持显式安全门下的小额受控测试 |

## 6. 视频结构草案

| 时间 | 内容 |
|---:|---|
| 0:00-0:30 | LAEL / Luffa Fabric 定位和统一闭环 |
| 0:30-1:30 | Base Sepolia wallet binding + proposal |
| 1:30-2:30 | Wallet signature / txHash / explorer / receipt |
| 2:30-3:15 | Feedback / learning / safety boundary |
| 3:15-4:15 | Mainnet guard + Endless QR protocol |
| 4:15-5:00 | 当前完成项、边界、下一步 |

## 7. 证据清单

Real-environment test report 已补齐：

- 钱包地址截图。
- Base Sepolia txHash 截图。
- Receipt 面板截图。
- Feedback Submitted / Learning 截图。
- Base Mainnet guard 截图。
- Endless QR waiting / mock approved 截图。
