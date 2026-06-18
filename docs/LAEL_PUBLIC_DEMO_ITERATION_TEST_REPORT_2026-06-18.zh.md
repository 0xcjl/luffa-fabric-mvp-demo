# Luffa Fabric MVP Public Demo 发布后迭代、测试与修复报告（2026-06-18）

## 0. 报告范围

| 字段 | 内容 |
|---|---|
| Demo repo | `0xcjl/luffa-fabric-mvp-demo` |
| Frontend | `https://luffa-fabric-mvp-demo.vercel.app/` |
| API / Public callback | `https://luffa-fabric-mvp-api.onrender.com` |
| 报告范围 | 从 public demo 部署到 2026-06-18 钱包、runtime-config、receipt 记录稳定性修复 |
| 最新本地代码修复 | `5654e9a fix: stabilize wallet receipt recording` |
| 报告用途 | 解释部署后做过哪些功能更新、测试、排查和修复；不替代 `DEMO_TESTING.md` 的测试者操作指南 |

本报告只记录 public demo 发布后的迭代和验证结论。普通体验者应优先阅读 `DEMO_TESTING.md`；钱包联调人员应优先阅读 `WALLET_TEST_GUIDE.md`。

## 1. 当前 Demo 架构

Public demo 被拆成三个公网面：

```text
Vercel Frontend
  -> NEXT_PUBLIC_LAEL_API_URL
  -> Render API
      -> /v2/runtime-config
      -> /v2/payment-agent/*
      -> /v2/endless/qr-sessions
      -> /scan /callback
```

关键配置：

- Frontend 部署在 Vercel，普通测试者只需要打开前端链接。
- API 部署在 Render，`/v2/runtime-config` 是前端启动时的配置源。
- Public callback 使用 Render API URL，不依赖测试者本机 Cloudflare tunnel。
- `Check / Wake API` 是安全唤醒和配置检查按钮，只请求 `/v2/runtime-config`，不是 Render restart 控制。
- QA Runner 保持 localhost-only，公网 demo 不允许从浏览器触发本地自动化命令。

## 2. 发布后功能更新

### 2.1 Runtime Config 启动门

前端启动后会请求 Render API 的 `/v2/runtime-config`，并在 UI 中显示配置来源。若 API 请求失败，前端使用 public demo fallback，避免页面进入不可测试状态。

当前 public demo fallback 边界：

- `mainnetExecutionEnabled=true`
- `mainnetMaxAmountEth=0.001`
- `publicCallback.baseUrl=https://luffa-fabric-mvp-api.onrender.com`
- `publicCallback.localOnly=false`

这解决了早期公网测试中出现的两个问题：

- 前端偶发读取旧配置，仍显示 `mainnetMaxAmountEth=0.00001`。
- Public callback 显示 `not configured` 或 local-only，导致 Luffa App QR 验收误判。

### 2.2 主网真实执行设置

Demo 环境主网真实执行默认打开，用于受控小额测试：

```text
LAEL_ENABLE_MAINNET_EXECUTION=true
LAEL_MAINNET_MAX_AMOUNT_ETH=0.001
```

但主网执行仍然必须满足四个条件：

1. 用户勾选 mainnet risk confirmation。
2. 金额不超过上限。
3. 用户在钱包中人工确认。
4. 返回真实 `txHash` 或 Solana signature，并生成 receipt。

空 `txHash`、`mock_` txHash、signed-only authorization、无链上提交证据，都不能标记为真实链上完成。

### 2.3 钱包优先级

当前钱包优先级已固定为：

| 链类型 | 优先级 |
|---|---|
| EVM: Base / BNB | OKX Wallet -> MetaMask -> Rabby -> Phantom -> generic injected |
| Solana | Phantom -> OKX Solana -> Solana wallet selector |
| Endless | Endless Web Wallet 与 Luffa App QR / WebView 分开选择 |

EVM 链的目标是优先唤起 OKX Wallet；只有 OKX 不可用或用户拒绝时才 fallback。页面必须显示实际 connector，避免“看似连了 EVM，实际走 Phantom/generic”的误判。

### 2.4 Sign 后自动记录 receipt

当前主路径是：

```text
Sign Wallet Tx / Sign Endless Web Wallet Tx
  -> 钱包确认
  -> 提交链上交易
  -> 返回真实 txHash/signature
  -> 自动调用 /execute
  -> 写入 Execution Receipt
```

因此 `Approve & Record` 的语义已经改变：

- 已自动记录且 receipt 匹配 txHash：按钮应显示 `Recorded` 或不可重复记录。
- 已拿到 txHash 但自动记录失败：按钮显示 `Retry Record`，只重试记录，不重新签名。
- 手动录入 txHash：按钮仍可用于补录。

## 3. 主要问题链路与修复

### 3.1 公网偶发打不开

现象：

- Chrome 打开 Vercel、Render API、Render Dashboard 时出现 `ERR_TUNNEL_CONNECTION_FAILED`。
- 同一服务过一会儿又能打开。

排查结论：

- 这不是 Vercel 或 Render 服务本身 suspend / maintenance。
- 本机代理 / TUN 会把部分公网域名连接导向 `198.18.*` 虚拟网段，Chrome 隧道失败时会同时影响 Vercel、Render 和 dashboard.render.com。
- Public demo 文档已把该类问题归为本机网络 / 代理 / TUN 抖动。

建议处理：

1. 先用非浏览器网络检查 Vercel HTML 和 Render runtime-config。
2. 若 curl 正常但 Chrome 失败，刷新页面或临时切换代理/TUN。
3. 不把该问题归为应用代码故障，除非公网 smoke 也失败。

### 3.2 Runtime Config 读取失败

现象：

- 页面显示 `fallback: Runtime config fallback used after API failure`。
- 有时仍能继续测试，但配置来源不是 Render API。

修复：

- 增加 runtime-config 状态展示。
- 增加 no-store 请求和 fallback。
- 页面显示 Config source，方便判断当前是否真正命中 Render API。

边界：

- fallback 是为了让公网 demo 不完全不可用。
- 真正做 QR / callback 验收前，仍应确认 Render API `/v2/runtime-config` 可访问。

### 3.3 Base / BNB 主网：链上成功但 receipt 显示 denied

现象：

- 用户在 OKX 钱包确认后，链上交易实际成功。
- 页面输入框有真实 txHash。
- Execution Receipt 却显示 `Settlement denied`、`approved without txHash`。
- `Retry Record` 或 `Approve & Record` 看起来没有刷新成成功 receipt。

定位：

- 问题不在钱包签名，也不能凭 UI 直接推断链上失败。
- 根因在 receipt 记录语义：同一个 proposal 先生成过无 txHash / denied receipt 后，后续带真实 txHash 重试可能仍返回旧执行记录。
- 另外，后端执行输入缺少明确 walletAddress 时，某些真实 txHash 验证路径会缺少必要上下文。

修复：

- `/execute` 输入增加 `walletAddress`。
- 前端在 sign 和 record 前校验钱包绑定地址。
- 后端允许“旧 receipt 无 txHash / denied，新请求带真实 txHash”时生成新执行记录。
- 同一 proposal 同一真实 txHash 已成功时返回现有成功 receipt，避免重复 settlement。
- 页面显示 `Existing receipt is stale; retry with txHash ...` 时，`Retry Record` 会带当前 txHash 重试。

当前边界：

- EVM 主网链上交易是否成功，以 explorer / RPC receipt 和真实 txHash 为准。
- LAEL receipt 是否成功，以 `/execute` 返回的 settlement status 和 txHash 匹配为准。
- 如果链上成功但 LAEL receipt 仍 denied，属于记录链路 bug，不是链上失败。

### 3.4 Solana 主网：签名后无 receipt 或 receipt 不可信

现象：

- Phantom 可能已弹出并完成用户确认。
- 页面可能没有出现 Execution Receipt。
- 最近一次截图显示 Solana RPC `get recent blockhash` fetch 失败，说明失败发生在签名前的 RPC 准备阶段。

已做修复：

- Solana 签名流程阶段化：连接、RPC、余额、simulation、签名、提交、确认、记录 receipt。
- `sendRawTransaction` 一旦返回 signature，立即写入 txHash 输入框。
- 如果 confirm 超时或失败，保留 signature，不再丢失证据。
- Solana receipt 只有 RPC 确认 `SUCCESS` 后才能记为 completed。
- `NOT_FOUND`、`PENDING`、confirm timeout 不能被当成真实完成。

当前边界：

- Solana 主网测试不要重复盲签；先确认浏览器能访问 Solana RPC。
- 若页面显示 RPC `Failed to fetch`，这是 RPC/network 阶段失败，还没有进入有效签名提交。
- 若 Phantom 已确认但页面没有 signature，要继续查前端阶段日志，而不是把钱包余额作为根因。

### 3.5 Endless Web Wallet 与 Luffa App QR

现象：

- Endless Web Wallet 弹窗有时加载为空或报错。
- `Create QR` 在一些状态下没有明显反馈。
- 用户希望 Endless Web Wallet 与 Luffa App QR 登录/授权分开选择。

修复方向：

- Endless Web Wallet 阶段日志显示 `Opening wallet window`、`Window loaded`、`Window failed`、`Retry available`。
- 钱包选择列表中把 Luffa App QR / WebView 独立为 `Use Luffa App` 路径。
- Endless Web Wallet 用于浏览器 SDK 授权和交易。
- Luffa App QR 用于手机扫码登录、授权、交易 WebView bridge 验收。

边界：

- Endless Web Wallet 返回真实 txHash 并记录 receipt，才算 Web Wallet 链上完成。
- Luffa App login 只证明账号控制权，不等于转账完成。
- Luffa App 业务授权必须返回真实 txHash，才算真实 App 链上完成。

## 4. 文档去重与入口分工

为避免文档重复，本轮分工如下：

| 文档 | 用途 |
|---|---|
| `README.md` | 最短入口：Live Demo、API、测试指南、报告链接 |
| `DEMO_TESTING.md` | 测试者如何测试：自己全面测、外部公网测、外部完整钱包测 |
| `WALLET_TEST_GUIDE.md` | 钱包优先级、连接、签名、txHash / receipt 完成边界 |
| 本报告 | 发布后迭代、问题排查、修复过程和验证记录 |
| `docs/README.md` / timeline / Project Docs | 长期索引和前端可见文档目录 |

## 5. 自动化与构建验证

发布后主要验证命令：

```bash
npm test -- tests/frontend-wallet-menu.test.ts tests/mvp2-payment-agent.test.ts tests/settlement-adapters.test.ts
npm test -- tests/docs.test.ts tests/project-docs.test.ts
npm run typecheck
npm run build
cd src/frontend && npm run build
```

截至本报告编写，本地代码修复提交 `5654e9a fix: stabilize wallet receipt recording` 已覆盖：

- EVM / Solana / Endless 钱包菜单和按钮语义。
- EVM receipt stale retry。
- 主网空 txHash / mock txHash 拒绝。
- `walletAddress` 进入 `/execute`。
- Project Docs 和测试文档同步。

提交前仍需重新运行完整验证；最终结果以本次提交后的命令输出为准。

## 6. 公网 Smoke 标准

网络可用时，public demo 基础 smoke 应满足：

```bash
curl -I https://luffa-fabric-mvp-demo.vercel.app/
curl -sS https://luffa-fabric-mvp-api.onrender.com/v2/runtime-config
curl -sS https://luffa-fabric-mvp-api.onrender.com/v2/chains
```

验收要点：

- Vercel 前端返回 200 或可重定向到正常页面。
- Runtime config 返回 `mainnetExecutionEnabled:true`。
- Runtime config 返回 `mainnetMaxAmountEth:0.001`。
- Public callback base URL 是 Render API URL。
- 页面显示 `Runtime config loaded from Render API`。

若 Chrome 报 `ERR_TUNNEL_CONNECTION_FAILED`，但命令行 smoke 正常，优先按本机代理/TUN 抖动处理。

## 7. 真实完成边界

必须分开看五层状态：

| 状态 | 是否等于真实链上完成 |
|---|---|
| Wallet connected | 否 |
| Luffa App login signed | 否 |
| Wallet transaction signed only | 否 |
| 已提交但未确认 signature | 否 |
| 已确认真实 txHash/signature + LAEL receipt completed | 是 |

不得标记真实完成的情况：

- `txHash` 为空。
- `txHash` 以 `mock_` 开头。
- 只有 signed-only authorization。
- Luffa App login callback 没有业务交易。
- Solana signature 未被 RPC 确认成功。
- 后端 receipt 与输入框 txHash 不匹配。

## 8. 下一轮建议验收顺序

1. 先确认 GitHub 已包含 `5654e9a` 和本报告提交。
2. 等 Vercel / Render 完成部署后，打开前端，确认 runtime-config 来自 Render API。
3. Base Mainnet：生成 fresh proposal，小额转账，确认 OKX Wallet 弹窗、真实 txHash、completed receipt。
4. BNB Mainnet：同 Base，额外确认 chainId 切换正确。
5. Solana Mainnet：只做一次 `0.000001 SOL` self-transfer；先确认 RPC 可用，再签名。
6. Endless Mainnet：分别测试 `Use Endless Web Wallet` 和 `Use Luffa App`，不要把登录签名当作转账完成。
7. 每条链都记录：wallet、address、proposalId、txHash/signature、receiptId、settlement status、explorer link、失败阶段日志。

## 9. 当前开放风险

- 本机代理 / TUN 可能继续导致 Chrome 打不开 Vercel、Render、GitHub 或 Render Dashboard。
- Solana 公共 RPC 在浏览器侧可能被网络、代理或 CORS 环境影响；失败时应保留阶段日志。
- Endless Web Wallet `wallet.endless.link` 可访问性不完全受本项目控制；失败时使用独立 Luffa App QR 路径。
- 主网测试涉及真实资产，必须由用户或测试者本人确认钱包弹窗，不可自动化代签。
- GitHub push 若再次出现 HTTPS tunnel 503，应尝试 SSH over 443；仍失败时保留本地提交 SHA 并报告网络阻塞。
