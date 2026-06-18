# Luffa Fabric MVP 公网 Demo 测试说明

本文是 Luffa Fabric MVP public demo 的主要测试入口，适用于项目方自测、外部人员公网体验，以及外部人员做完整钱包 / 主网 / QR 回归测试。

部署后的完整迭代、测试、问题排查和修复记录见 `docs/LAEL_PUBLIC_DEMO_ITERATION_TEST_REPORT_2026-06-18.zh.md`；本文只保留测试者需要执行的步骤和准备事项。

## 1. 公网入口

| 项目 | 地址 | 用途 |
| --- | --- | --- |
| Frontend | https://luffa-fabric-mvp-demo.vercel.app/ | 公网交互页面 |
| API | https://luffa-fabric-mvp-api.onrender.com/ | Runtime、proposal、callback、receipt |
| Runtime config | https://luffa-fabric-mvp-api.onrender.com/v2/runtime-config | 主网 gate、public callback 状态 |
| Chains | https://luffa-fabric-mvp-api.onrender.com/v2/chains | 支持链配置 |

普通公网测试不需要 clone 仓库、不需要本地 npm、不需要本地 API。打开 Vercel 链接即可测试页面、Project Docs、proposal、钱包连接、Render public callback 和普通 smoke。

需要本地环境的场景只有：localhost-only QA Runner、本地开发、代码修改、Cloudflare tunnel 实验、完整自动化测试和深度调试。

## 2. 测试者类型和准备

### 普通体验者

适合只想看 demo 是否能跑通的人。

准备：

- Chrome 或其他现代浏览器。
- 公网前端链接。
- 不需要钱包、不需要主网资产、不需要本地部署。

建议测试：

1. 打开 Vercel 前端。
2. 确认页面有样式，没有 `Application error`。
3. 点击 `Check / Wake API`。
4. 打开 `Project Docs`。
5. 生成一个 proposal，但不签真实交易。

### 钱包测试者

适合测试真实钱包连接、签名、txHash、receipt 的人。

准备：

- Chrome 钱包插件。
- EVM 钱包优先级：OKX Wallet -> MetaMask -> Rabby -> Phantom -> generic injected。
- Solana 钱包优先级：Phantom -> OKX Solana -> Solana wallet selector。
- Endless 路径：Endless Web Wallet；Luffa App QR / WebView 作为原生授权路径。
- 对应链的小额主网资产和 gas。
- 明确接受小额主网测试风险。

建议测试：

1. 选择目标链。
2. 连接钱包。
3. 生成小额 transfer 或 task reward proposal。
4. 勾选主网风险确认。
5. 点击 `Sign Wallet Tx` 或 `Sign Endless Web Wallet Tx`。
6. 在钱包中人工确认。
7. 确认页面返回真实 txHash，并自动生成 receipt。
8. 提交 feedback，确认 learning signal 或 pending feedback 状态。

### Luffa App 测试者

适合测试原生 QR / WebView authorization。

准备：

- 手机安装可测试的 Luffa App。
- 手机网络可访问 Render API 域名。
- 浏览器页面显示 public callback 为 `https://luffa-fabric-mvp-api.onrender.com`。
- 每次 API 重启、callback URL 改变或 QR 过期后，都必须生成新 QR。

建议测试：

1. 点击 `Check / Wake API`。
2. 确认 runtime config 已从 Render API 加载。
3. 生成新的 Luffa App QR。
4. 手机打开 `/scan` 页面或扫码进入 WebView。
5. 完成 App 端授权。
6. 检查页面是否显示 callback / approved / txHash / receipt。

如果 Luffa App 显示 invalid QR，并且 API debug events 为空，不要反复扫码；应归类为 App QR schema compatibility 问题。

### 开发 / QA 测试者

适合做完整回归、自动化验证和代码级调试。

准备：

- 本地 repo。
- Node.js 和 npm。
- 能访问 Vercel、Render、GitHub。
- 需要钱包回归时，准备对应钱包和小额资产。

本地验证命令：

```bash
npm test -- tests/docs.test.ts tests/project-docs.test.ts
npm test -- tests/frontend-wallet-menu.test.ts tests/mvp2-payment-agent.test.ts tests/settlement-adapters.test.ts
npm run typecheck
npm run build
cd src/frontend && npm run build
```

本地服务只用于开发和 localhost-only QA Runner。公网 demo 用户不需要本地服务。

## 3. 项目方全面测试流程

### 服务状态

```bash
curl -I https://luffa-fabric-mvp-demo.vercel.app/
curl -sS https://luffa-fabric-mvp-api.onrender.com/v2/runtime-config
curl -sS https://luffa-fabric-mvp-api.onrender.com/v2/chains
```

期望：

- Vercel 前端返回 200。
- Render API 返回 200。
- `mainnetExecutionEnabled:true`。
- `mainnetMaxAmountEth` 至少为 `0.001`。
- `publicCallback.baseUrl` 为 `https://luffa-fabric-mvp-api.onrender.com`。
- `publicCallback.localOnly:false`。

### 前端 smoke

1. 打开 Vercel 前端。
2. 确认 `Execution Loop Console` 正常显示。
3. 点击 `Check / Wake API`。
4. 确认页面显示 runtime config 从 Render API 加载。
5. 打开 `Project Docs`，确认说明可读。

`Check / Wake API` 只检查和唤醒 Render API，不是真正 restart。真正 restart 仍需 Render Dashboard 或 Render CLI。

### Proposal smoke

1. 打开 `On-chain Value Agent`。
2. 选择 Endless Mainnet、Base Mainnet、BNB Mainnet 或 Solana Mainnet。
3. 生成小额 transfer 或 task reward proposal。
4. 确认 permission 为 `allow_pending_human_confirmation`。
5. 未勾选风险确认时，主网签名必须被阻断或明确提示。

### Receipt / feedback / learning

1. 钱包返回真实 txHash 后，页面应自动调用 `/execute` 记录 receipt。
2. receipt 匹配真实 txHash 后，`Approve & Record` 应显示为 `Recorded`。
3. 如果钱包已返回 txHash 但记录失败，按钮应显示 `Retry Record`。
4. 点击 feedback 后，页面应显示 feedback 或 learning 状态。

## 4. 外部人员公网测试流程

外部人员只需要打开：

```text
https://luffa-fabric-mvp-demo.vercel.app/
```

推荐普通路径：

1. 打开页面。
2. 点击 `Check / Wake API`。
3. 查看 `Project Docs`。
4. 打开 `On-chain Value Agent`。
5. 连接自己的测试钱包。
6. 生成小额 proposal。
7. 如要真实主网测试，先确认金额、收款地址、网络和风险勾选。
8. 钱包人工确认后，只把真实 txHash 作为链上完成证据。

不建议外部访客做大额转账、生产结算、托管类测试或未理解风险的主网操作。

## 5. 完整钱包测试路径

### EVM: Base / BNB

准备：

- 优先使用 OKX Wallet。
- 如果 OKX 不可用，依次使用 MetaMask、Rabby、Phantom EVM、generic injected。
- 准备对应链少量主网资产和 gas。

测试：

1. 选择 Base Mainnet 或 BNB Mainnet。
2. 点击连接钱包，确认页面显示实际 connector。
3. 生成小额 transfer proposal。
4. 勾选主网风险确认。
5. 点击 `Sign Wallet Tx`。
6. 在钱包里确认交易。
7. 页面应显示真实 txHash、receipt、settlement evidence。

### Solana Mainnet

准备：

- 优先使用 Phantom。
- 准备少量 SOL 支付转账和网络费。

测试：

1. 选择 Solana Mainnet。
2. 连接 Phantom。
3. 使用默认小额 `0.000001 SOL` 或更低风险金额。
4. 点击 `Sign Wallet Tx`。
5. 钱包确认后，页面应提交交易、确认交易、写入 txHash 并记录 receipt。

如果失败，页面应显示余额、fee、RPC、simulation 或 confirmation 失败原因，而不是出现 Runtime Error overlay。

### Endless Mainnet

准备：

- Endless Web Wallet 可访问。
- 发送方有足够 EDS 和 gas。
- Luffa App 仅在测试 QR / WebView 原生授权路径时需要。

测试：

1. 选择 Endless Mainnet。
2. 连接 Endless Web Wallet。
3. 生成 transfer 或 task reward proposal。
4. 勾选主网风险确认。
5. 点击 `Sign Endless Web Wallet Tx`。
6. 确认阶段状态：opening sdk、checking balance、requesting transaction confirmation、waiting txHash、recording receipt。
7. 成功后应显示真实 txHash 和 receipt。

如果 `wallet.endless.link` 空白或加载失败，页面应显示明确错误，并提供 Luffa App QR fallback。

## 6. 不算真实链上完成的情况

以下都不能标记为真实链上完成：

- 空 txHash。
- `mock_` txHash。
- signed-only authorization。
- protocol-only QR approval。
- App 授权成功但没有 txHash。
- 钱包弹窗被用户拒绝。
- 手动输入无法验证的 txHash。

真实链上完成必须同时满足：

- 用户人工确认钱包交易。
- 返回真实 txHash。
- 页面记录 receipt。
- settlement / evidence 能对应到该 txHash。

## 7. 常见故障分类

- `ERR_TUNNEL_CONNECTION_FAILED`：若 curl 检查公网服务正常，通常是本机 Chrome 代理 / TUN 问题，不是 Vercel 部署失败。
- DNS 返回 `198.18.0.0/15`：这是本地虚拟隧道地址，刷新浏览器或重连代理 / TUN。
- Render 冷启动或重启：先点 `Check / Wake API`，QR 测试必须重新生成 QR。
- Cloudflare 1033 / 530：本地 Cloudflare tunnel 问题；公网 demo 使用 Render callback，不依赖 Cloudflare。
- 钱包 popup 被拒绝：用户取消，不是应用失败。
- Endless Web Wallet 空白：记录为 wallet window load failure，使用重试或 Luffa App QR fallback。
- Luffa App invalid QR 且 API 无事件：App QR parser/schema compatibility。

## 8. 测试记录模板

```text
Tester:
Date:
Frontend URL:
API URL:
Browser:
Wallet:
Chain:
Amount:
Recipient:
Risk checkbox accepted: yes/no
Wallet confirmation: approved/rejected
txHash:
Receipt id:
Settlement status:
Feedback submitted: yes/no
Learning visible: yes/no
Notes:
```
