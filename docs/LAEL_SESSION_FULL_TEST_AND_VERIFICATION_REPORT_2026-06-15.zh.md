# LAEL / Luffa Fabric 本会话完整测试与验证报告

日期：2026-06-15
仓库：`/Users/xyz/Documents/luffa-fabric`
分支：`codex/varr-api-route-fixes`
本地提交：`7a905d66645458c6afa3d12f959f47e408596025`
远端 fork：`0xcjl/luffa-fabric-test`
远端提交：<https://github.com/0xcjl/luffa-fabric-test/commit/7a905d66645458c6afa3d12f959f47e408596025>

## 1. 本会话目标

本会话围绕 P0 到 P2 主线继续开发与验收：

- P0：Luffa App QR / WebView 授权协议。
- P1：真实钱包小额测试闭环，重点推进 Endless Testnet / Luffa App / Endless Web Wallet。
- P2：真实业务场景 `task_reward`，即 Agent 完成小额任务并给 Alice 发放 0.001 EDS reward，产出 receipt、feedback 和 learning signal。

用户明确暂停 demo video，因此本会话没有生成 voiceover、没有 retime、没有重建 MP4。

## 2. 开发与联调过程

### 2.1 仓库与分支检查

开发前确认：

```bash
git status --short --branch
git rev-parse HEAD
```

最终状态：

```text
## codex/varr-api-route-fixes
?? demo-video/
7a905d66645458c6afa3d12f959f47e408596025
```

说明：

- 当前分支为 `codex/varr-api-route-fixes`。
- `demo-video/` 仍未跟踪，按用户要求本轮不处理 demo video。
- 本轮代码与文档已提交并推送到 fork。

### 2.2 P0 Luffa App QR / WebView 授权协议

本会话围绕 Luffa App 扫码授权多次联调，主要处理了以下问题：

- 点击 `Endless Testnet / Luffa App` 无明显反应。
- QR modal 未弹出。
- Luffa App 扫码后提示无效二维码。
- 登录签名误包含 transfer intent。
- Luffa App WebView 反复弹出授权窗口。
- App callback 签名字段、签名消息格式、nonce、session 验签不一致。
- Cloudflare tunnel 频繁出现 1033 / 530。

修复与调整：

- 保持 `luffa-endless-auth:v1` 协议。
- 将登录授权与价值动作拆开：
  - `businessAction=login` 只表达钱包登录和 DID 绑定。
  - `businessAction=transfer` / `task_reward` 才表达金额、资产、收款地址和业务 intent。
- QR / WebView callback 继续要求：
  - `status`
  - `address`
  - `publicKey`
  - `fullMessage`
  - `signature`
  - 可选 `txHash` / `error`
- 后端保留 nonce、session、过期时间、重复 callback 和签名验签边界。
- `/scan` 页面加入单 session claim / 防重复机制，减少 WebView reload 后反复弹授权页。
- 前端 QR modal 修复为登录授权、业务授权都能正常打开。
- `Approve & Record` 按钮修复为能记录已授权 evidence。

已验证结果：

- Luffa App login 授权曾完成，页面显示：
  - `QR status=approved`
  - `Signature=verified`
  - `Auth source=qr_scan_callback`
  - `approvedWithoutTxHash=true`
- 这证明 P0 的 signed app authorization 协议路径已跑通到授权 receipt 层。

未完成点：

- 当前 public callback `https://lael.clawworld.eu.cc/v2/runtime-config` 后续检查出现 Cloudflare 530，说明公网 callback 需要恢复后才能做新的真实 App 验收。
- Luffa App 对真实 transfer / task_reward 的交易提交仍没有稳定返回 txHash。

### 2.3 P1 Endless Testnet / Web Wallet 路径

由于反复让用户用手机 Luffa App 扫码联调效率很低，本会话改为评估并接入 Endless Web Wallet：

参考入口：

- <https://wallet.endless.link/>
- <https://docs.endless.link/endless/endless-wallet/faqs>

接入目标：

- 保留 Luffa App QR 作为原生授权验收路径。
- 新增 Endless Web Wallet 作为浏览器内真实钱包签名和交易调试路径。
- 减少每次依赖手机扫码和 WebView bridge 的调试成本。

完成内容：

- 前端接入 `@endlesslab/endless-web3-sdk`。
- 钱包 runtime 展示为 `Endless Web Wallet / Luffa App QR`。
- 支持 Endless Web Wallet connect。
- 支持 Endless Web Wallet signMessage。
- 支持通过 `/v2/wallet/connect` 记录钱包绑定。
- 修复 `/v2/wallet/verify` 中 account address 和 signing publicKey 混用的问题。

已验证结果：

```text
POST /v2/wallet/connect -> 201
POST /v2/wallet/verify -> 200
```

浏览器中可见：

```text
Wallet address: EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2
Endless source: endless_web_wallet
Network: Endless Testnet
```

未完成点：

- Endless Web Wallet 真实交易签名仍未完成。
- 钱包弹窗出现后，用户解锁钱包，但 `Confirm` 按钮保持灰色，无法确认。
- 因此没有拿到真实 txHash。

### 2.4 P2 Task Reward 业务场景

本会话将 Task Reward 固定为：

```text
Agent complete a small task and reward 0.001 EDS to Alice with Endless Web Wallet on Endless testnet
```

完成内容：

- Task Reward 默认金额调整为 `0.001 EDS`。
- Alice recipient 使用 Endless 地址：

```text
6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw
```

- proposal 能正确生成：

```text
businessAction=task_reward
amount=0.001
asset=EDS
network=ENDLESS_TESTNET
permission=allow_pending_human_confirmation
reason=Within policy; explicit wallet confirmation required
```

- 前端不再把 mock txHash 当作真实链上完成。
- Endless 路径要求真实 txHash 或明确 signed authorization evidence。

阶段性未完成点：

- 初始 Task Reward 真实链上 txHash 曾未完成。
- 当时卡在 Endless Web Wallet confirm 灰色，不能点击。
- 因此该阶段 P2 停在：

```text
proposal -> wallet confirmation pending
```

当时尚未达到：

追加完成记录（2026-06-15 后续主网小额测试）：

- 用户明确允许使用 Endless Mainnet EDS 做 0.001 EDS 小额真实测试。
- 活动 sender `EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2` 充值后，经 Endless Mainnet SDK 查询余额为 `10 EDS`。
- 用户在已注册 Web Wallet 的 Chrome 会话中完成真实钱包确认。
- Task Reward 收款人为 Alice `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`。
- 返回真实 txHash：`G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid`。
- Receipt：`exec_00e02bbd-dc7a-467f-bb1e-4fcb4464e21e`，`settlement=completed`，`mode=real`。
- Feedback submitted；learning updated；agent score `0.93 -> 0.94`。

因此 Endless Web Wallet 主网 lane 已达到：

```text
proposal -> real wallet confirmation -> real txHash -> receipt -> feedback -> learning
```

### 2.5 Luffa App QR parser 复测

在恢复 API、frontend、`https://lael.clawworld.eu.cc` public callback，并确认 `npm run health:luffa-app` 返回 `ok: true` 后，本轮继续测试 Luffa App 扫码入口。

已复测：

- JSON QR payload。
- `protocol=luffa-endless-auth:v1` 兼容 JSON payload。
- `protocol=luffa-endless-auth` / `version=v1` key=value 最小 login QR。

结果：

- 手机端提示“无效二维码”。
- 最小 login session `endless_qr_d96f0a34-89b2-44b3-a893-7e46afad942b` 在有效期内保持 `waiting`。
- `/debug` events 为空，没有 `/scan`、`/claim` 或 `/callback` 请求进入 API。

结论：当前阻塞点是 Luffa App 本地 QR parser/schema，不是 Cloudflare callback、session 过期或交易 payload。继续真实 App 扫码前，需要 App 侧提供实际接受的 QR schema / deep link 格式。

## 3. 自动化验证

### 3.1 TypeScript 检查

命令：

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

结果：通过。

### 3.2 Root vitest 全量测试

命令：

```bash
./node_modules/.bin/vitest run --config vitest.config.ts
```

结果：

```text
18 files passed
157 tests passed
```

### 3.3 VARR Node tests

命令：

```bash
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
```

结果：

```text
31 tests passed
```

### 3.4 Frontend build

命令：

```bash
cd src/frontend
NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

结果：通过。

### 3.5 文档与 Project Docs 测试

命令：

```bash
./node_modules/.bin/vitest run tests/docs.test.ts tests/project-docs.test.ts
```

结果：

```text
32 tests passed
```

### 3.6 Git diff 检查

命令：

```bash
git diff --cached --check
```

结果：通过。

### 3.7 敏感信息扫描

扫描结果只命中测试 fixture 中拆分字段：

```text
tests/wallet.test.ts: const secret = fixture["private" + "Key"];
```

结论：未发现真实 secret 被提交。

## 4. 手工验证

### 4.1 Luffa App QR 登录授权

验证过程：

1. 前端选择 Endless Mainnet / Testnet Luffa App。
2. 点击创建 QR。
3. 用户用 Luffa App 扫码。
4. App WebView 显示 `Luffa App Authorization`。
5. 用户点击签名授权。
6. 后端 callback 验签。
7. 前端 poll status。

曾验证成功的证据字段：

```text
status=approved
callbackSource=qr_scan_callback
signatureVerified=true
approvedWithoutTxHash=true
evidenceDigest=<digest>
```

结论：

- Luffa App 的登录授权协议可以完成 signed authorization。
- 这不是链上交易，只是 App 签名授权和 receipt evidence。

### 4.2 Luffa App 业务授权 / 交易桥接

验证过程：

1. 生成 transfer / task_reward proposal。
2. 点击 `Authorize in Luffa App`。
3. Luffa App WebView 打开授权页。
4. 用户授权。
5. App bridge 尝试 package / sign / submit transaction。

多次失败现象：

```text
packageTransactionV2 returned no serialized transaction data
signAndSubmitTransaction returned GeneralError.invalidParameter
transaction response missing txHash
errorMsg=1006
errorMsg=1009
rawData=""
```

结论：

- App 授权签名路径能工作。
- App 端真实交易 bridge 的 payload schema / package transaction / signAndSubmitTransaction 仍需 App 侧配合确认。
- 当前不能把 App 业务授权当作真实链上完成。

### 4.3 Endless Web Wallet 连接与签名前置验证

验证过程：

1. 使用用户常用 Chrome profile。
2. 打开 `http://127.0.0.1:3001`。
3. 连接 Endless Web Wallet。
4. 钱包弹出并显示 `wallet.endless.link`。
5. 完成 wallet connect。
6. 进行 wallet binding verification。

验证结果：

```text
POST /v2/wallet/connect -> 201
POST /v2/wallet/verify -> 200
```

结论：

- 浏览器钱包连接和绑定验签已打通。
- `address` 与 `publicKey` 的混用问题已修复。

### 4.4 Endless Web Wallet 真实交易签名

验证过程：

1. 生成 Task Reward proposal。
2. 点击 `Sign Endless Web Wallet Tx`。
3. Endless Wallet 弹窗出现。
4. 用户解锁钱包。
5. 等待 `Confirm` 按钮可点击。

阶段性结果：

```text
Confirm 按钮保持灰色
前端停留在 Requesting Endless Web Wallet transaction signature
无 txHash 返回
```

阶段性结论：

- 当时真实交易未完成。
- 当时不是 LAEL receipt 记录失败，而是钱包确认阶段没有完成。
- 后续主网小额测试已通过 Endless Web Wallet 完成真实 txHash；Luffa App bridge 真实交易仍未完成，继续归类为 App bridge payload/schema 兼容问题。

## 5. 服务与公网状态检查

本会话中曾检查到的状态：

| 检查项 | 结果 |
|---|---|
| GitHub auth | 已恢复，`repo` / `workflow` scope 可用 |
| GitHub fork push | 已成功 |
| Local API `127.0.0.1:3000` | 后续整理时曾不在线 |
| Local frontend `127.0.0.1:3001` | 后续整理时曾不在线 |
| Public callback `https://lael.clawworld.eu.cc/v2/runtime-config` | 曾返回 Cloudflare 530 |
| Endless Wallet `https://wallet.endless.link/wallet/` | 可访问 |

Cloudflare / callback 结论：

- QR 和 App callback 强依赖 public HTTPS callback。
- Cloudflare 530 时不能生成新的有效 App 验收 QR。
- 每次 tunnel、API、callback base URL 变化后，都必须重启 API 并重新生成 QR。

## 6. GitHub 更新结果

本会话先遇到两类推送问题：

1. SSH public key 未被 GitHub 接受。
2. 代理 CONNECT 返回 503。

处理结果：

- 用户完成 `gh auth login -h github.com`。
- GitHub CLI auth 恢复正常。
- 最终绕开本机代理直连推送成功。

远端结果：

```text
To https://github.com/0xcjl/luffa-fabric-test.git
30bd96d..7a905d6  codex/varr-api-route-fixes -> codex/varr-api-route-fixes
```

远端提交：

<https://github.com/0xcjl/luffa-fabric-test/commit/7a905d66645458c6afa3d12f959f47e408596025>

## 7. 未完成项总表

| 优先级 | 项目 | 当前状态 | 未完成原因 | 下一步 |
|---|---|---|---|---|
| P0 | Luffa App QR / WebView 登录授权 | 部分完成 | signed callback 已跑通，但当前 public callback 曾返回 530，需恢复后重验 | 恢复 `lael.clawworld.eu.cc`，重新生成 QR，复测 login |
| P0 | Luffa App 业务授权 | 部分完成 | App 可签名授权，但真实交易 bridge 没有稳定返回 txHash | 与 App 侧确认 transaction payload schema |
| P1 | Endless Web Wallet 连接 | 完成 | `connect` 和 `verify` 已通过 | 保留为主调试路径 |
| P1 | Endless Testnet 真实 txHash | 未完成 | 钱包 Confirm 按钮灰色，交易未提交 | 排查 wallet payload、余额、gas、network、SDK 参数 |
| P1 | BNB Testnet | 未完成 | 本会话未执行新的真实小额测试 | 后续用 EVM lane + MetaMask / OKX 补证据 |
| P1 | Solana Devnet | 未完成 | 本会话未执行新的真实小额测试 | 后续用 Phantom / Solana Wallet 补 signature evidence |
| P2 | Task Reward proposal | 完成 | 能生成 0.001 EDS reward proposal | 等真实钱包 txHash |
| P2 | Task Reward 链上执行 | 未完成 | Endless Web Wallet confirm 灰色，未返回 txHash | 先解决 Endless Web Wallet 交易确认 |
| P2 | Receipt + feedback + learning | 未完成 | 缺真实 txHash，不能写完整 settlement receipt | txHash 完成后再记录 receipt / feedback / learning |
| 运维 | Cloudflare public callback | 未稳定 | 曾出现 1033 / 530 | 固定 named tunnel，运行 health check |
| 发布 | GitHub fork 更新 | 完成 | 已推送到 fork | 后续如需 PR，再基于 fork 分支创建 |

## 8. 当前不能宣称完成的内容

以下内容不能宣称已完成：

- Endless Testnet 真实链上 reward。
- Endless Mainnet 真实链上 reward。
- Luffa App bridge 真实 transfer / task_reward txHash。
- BNB Testnet 小额闭环。
- Solana Devnet 小额闭环。
- P2 完整 `proposal -> txHash -> receipt -> feedback -> learning` 闭环。

可以宣称已完成或阶段完成的内容：

- P0 signed App authorization 协议路径已经阶段跑通。
- 登录授权与转账 / reward 授权已拆分。
- Endless Web Wallet 已接入并能连接、绑定、验签。
- Task Reward proposal 已固定到 0.001 EDS，并要求真实 txHash。
- 本轮代码、文档、测试已提交并推送到 GitHub fork。

## 9. 下一步建议

推荐先按这个顺序继续：

1. 恢复并稳定本地服务：

```bash
API: http://127.0.0.1:3000
Frontend: http://127.0.0.1:3001
```

2. 恢复 public callback：

```bash
LAEL_PUBLIC_CALLBACK_BASE_URL=https://lael.clawworld.eu.cc
npm run health:luffa-app
```

3. 在 Endless Web Wallet 交易前增加预检：

- sender account 是否存在。
- sender EDS 余额是否足够。
- gas / fee 是否足够。
- network 是否为 Endless Testnet。
- recipient address 是否为 Endless 地址。
- SDK transaction payload 是否符合官方 wallet 要求。

4. 如果 `Confirm` 仍灰色，准备最小复现：

- 钱包地址。
- network。
- function。
- functionArguments。
- typeArguments。
- SDK method。
- wallet response。
- 浏览器 console。

5. 将最小复现交给 Endless Wallet / Luffa App 侧确认。

6. 拿到真实 txHash 后，再执行：

```text
Approve & Record -> receipt -> feedback -> learning
```

## 10. 结论

本会话已经完成了大量协议、前端、后端、文档和测试工作，并把当前工作推送到了 GitHub fork。

但 P1 / P2 的核心真实链上完成标准还没有达成。当前真实 blocker 不是 LAEL 不记录 receipt，而是 Endless 钱包交易确认阶段没有完成，导致没有真实 txHash。后续工作应集中在 Endless Web Wallet 交易 payload、账户余额/gas、网络和钱包 UI 确认条件，而不是继续重复 Luffa App 手机扫码。
