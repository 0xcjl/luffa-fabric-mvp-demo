# LAEL / Luffa Fabric Endless Web Wallet 会话验证报告

日期：2026-06-15
分支：`codex/varr-api-route-fixes`
范围：P0 Luffa App QR / WebView 授权、P1 Endless Testnet 真实钱包路径、P2 Task Reward 真实 txHash 路径。
状态：代码与文档已更新；Testnet 阶段曾阻塞在钱包确认弹窗不可确认，用户随后允许主网 EDS 小额测试，并已通过 Endless Web Wallet 完成 0.001 EDS Task Reward 真实 txHash、receipt、feedback 和 learning。Luffa App bridge 真实交易仍未完成，继续归类为 App bridge payload/schema 兼容问题。

## 1. 本轮目标

- 停止 demo video 工作，不生成 voiceover、不 retime、不重建 MP4。
- 保留 P0 Luffa App QR / WebView 作为原生授权协议路径。
- 为 P1 / P2 Endless 真实链上行为增加 Endless Web Wallet 路径，减少每次都依赖 Luffa App 手机扫码联调。
- P2 固定业务场景为 `task_reward`：Agent complete a small task and reward 0.001 EDS to Alice。

## 2. 已完成内容

### 2.1 Luffa App QR / WebView 授权

- `luffa-endless-auth:v1` 会话继续保留。
- 登录授权与业务授权已分离：
  - `businessAction=login` 只用于钱包登录 / DID 绑定，不包含转账 intent、amount、recipient。
  - `businessAction=transfer` / `task_reward` 才包含 EDS、amount、recipientAddress 和业务 intent。
- signed callback 验签已打通，receipt 能记录：
  - `callbackSource=qr_scan_callback`
  - `signatureVerified=true`
  - `approvedWithoutTxHash=true`，当 App 只完成授权但未返回链上 hash。
- `/scan` 页面已增加单 session 防重复提交保护，用于减少 WebView reload 后反复弹授权页。

### 2.2 Endless Web Wallet 路径

- 前端新增官方 Endless Web Wallet SDK：
  - `@endlesslab/endless-web3-sdk`
  - `@endlesslab/endless-ts-sdk`
- 浏览器钱包路径：
  - `EndlessJsSdk.connect()`
  - `signMessage()` 用于 DID / wallet binding 验证
  - `signAndSubmitTransaction()` 用于真实 Endless transfer / task_reward
- 修复钱包绑定验签：
  - Endless account address 和 signing public key 分开处理。
  - `/v2/wallet/verify` 支持 `publicKey` 作为验签 key，同时继续用 `address` 查找 binding。
- 前端展示已区分：
  - `Endless Web Wallet / Luffa App QR`
  - `endless_web_wallet`
  - `walletType=endless-web-wallet`
  - `executionMode=real`

### 2.3 Task Reward

- Task Reward 默认金额调整为 `0.001 EDS`。
- Task Reward prompt 固定为：

```text
Agent complete a small task and reward 0.001 EDS to Alice with Endless Web Wallet on Endless testnet
```

- Proposal 能正确生成：
  - `businessAction=task_reward`
  - `amount=0.001`
  - `asset=EDS`
  - `network=ENDLESS_TESTNET`
  - `permission=allow_pending_human_confirmation`

## 3. 当前验证结果

### 3.1 自动化验证

已通过：

```bash
./node_modules/.bin/vitest run tests/wallet.test.ts tests/endless-qr.test.ts tests/frontend-wallet-menu.test.ts
```

结果：3 files / 30 tests 通过。

已通过：

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

已通过：

```bash
cd src/frontend && NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

已通过：

```bash
npm run build
```

### 3.2 浏览器手工验证

在用户常用 Chrome profile 中验证：

- Endless Web Wallet 能打开。
- Endless Web Wallet 能连接本地前端 `http://127.0.0.1:3001`。
- `/v2/wallet/connect -> 201`。
- `/v2/wallet/verify -> 200`。
- 前端能显示已绑定钱包：

```text
EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2
```

- Task Reward proposal 能生成，页面进入 `Wallet signature required`。

### 3.3 当前服务状态

本报告整理时的状态：

| 项 | 结果 |
|---|---|
| Local API `http://127.0.0.1:3000/v2/runtime-config` | 未在线，连接失败 |
| Local frontend `http://127.0.0.1:3001/` | 未在线，连接失败 |
| Public callback `https://lael.clawworld.eu.cc/v2/runtime-config` | Cloudflare 530 |
| Endless Web Wallet `https://wallet.endless.link/wallet/` | 200 |

结论：

- Luffa App QR / WebView 真实 callback 当前不能验收，因为 public callback 530。
- Endless Web Wallet 本身可达，但真实 txHash 流程仍卡在钱包确认阶段。

## 4. 未完成与阻塞项

### 4.1 Endless Web Wallet 真实 txHash 未完成

当前卡点：

- 点击 `Sign Endless Web Wallet Tx` 后，Endless Web Wallet 弹窗出现。
- 用户解锁钱包后，`Confirm` 按钮仍为灰色，无法点击。
- 前端停留在 `Requesting Endless Web Wallet transaction signature`。
- 没有返回 txHash。
- 因此 P2 Task Reward 还不能标记为真实链上完成。

已排除：

- 不是 `/v2/wallet/verify` 绑定失败；当前已返回 200。
- 不是 Endless Web Wallet 官网不可达；钱包页面返回 200。
- 不是 Luffa App QR callback transport 的同一个问题；本地 Web Wallet path 不依赖 Cloudflare callback。

仍需确认：

- Endless Testnet 发送账户余额是否足够。
- 发送账户是否已经在 testnet 链上存在并可支付 gas。
- `signAndSubmitTransaction` payload 已补充显式 `maxGasAmount`、`gasUnitPrice`、`expireTimestamp` options；仍需在钱包确认页验证这些参数是否让 `Confirm` 可用。
- 前端已显式调用 `sdk.open()`，避免 Web Wallet iframe 已加载但 modal 容器保持隐藏，导致用户无法完成连接/签名。
- Task Reward 默认收款人已固定为 Alice 的 Endless 地址 `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`，不再因 sender wallet 已连接而自动改成自转账。
- 前端已加入 `getAccountEDSAmount` 余额预检：在请求钱包确认前检查 sender EDS 余额是否覆盖 `0.001 EDS` reward 和 gas 预算；余额不足时阻止签名并输出 sender、balance、required、amount、feeBudget。
- Endless Web Wallet 是否要求前端域名必须是 HTTPS 或 allowlist，而不仅是 `http://127.0.0.1:3001`。

### 4.1.1 Endless Mainnet 小额尝试

用户明确允许使用主网 EDS 后，本轮只打开 0.001 EDS 上限的本地主网 gate：

- API 启动参数：`LAEL_ENABLE_MAINNET_EXECUTION=true`、`LAEL_MAINNET_MAX_AMOUNT_ETH=0.001`、`LAEL_PUBLIC_CALLBACK_BASE_URL=https://lael.clawworld.eu.cc`。
- Local runtime-config：200，`mainnetExecutionEnabled=true`，`mainnetMaxAmountEth=0.001`。
- Public callback runtime-config：`https://lael.clawworld.eu.cc/v2/runtime-config` 200。
- `npm run health:luffa-app`：`ok: true`。
- 前端选择：`ENDLESS_MAINNET`、`EDS`，主网风险确认已勾选。
- Proposal：`proposal_af48bb8a-a58b-44e1-a654-9c24b45c4c43`。
- 业务场景：`Agent complete a small task and reward 0.001 EDS to Alice with Endless Web Wallet on Endless mainnet`。
- 收款人：Alice `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`。
- 追加余额验证：用户给活动 sender `EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2` 充值后，使用 `@endlesslab/endless-ts-sdk` 直接查询 Endless Mainnet，确认余额为 `10 EDS`。
- 钱包可见性修复：Web Wallet modal 曾因 SDK 持久化位置落在可视区外，读到 iframe 坐标约为 `x=1358`，导致用户看不到交易弹窗但 Chrome 仍报告扩展 UI 正在占用。前端已通过 `src/frontend/app/globals.css` 将 `#endless_dapp_modal_container` 固定到左上角可见区域，验证后 iframe 坐标约为 `x=16`、`y=56`。
- 完成证据：用户在已注册 Web Wallet 的 Chrome 会话中完成真实钱包确认，页面返回 `Endless Web Wallet submitted real tx`。
- txHash：`G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid`。
- Execution receipt：`exec_00e02bbd-dc7a-467f-bb1e-4fcb4464e21e`。
- Receipt 状态：`settlement=completed`、`mode=real`、`app auth=approved`、`walletType=endless-web-wallet`。
- Feedback / Learning：feedback submitted；learning updated；agent score `0.93 -> 0.94`，human confirmation preserved。
- 链上 receipt 查询：`GET /v2/settlement/tx/G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid?chainType=endless&chainId=220` 返回 `status=SUCCESS`、`chainId=220`、`blockNumber=188036997`。
- Endless Mainnet RPC 证据：`success=true`、`vm_status=Executed successfully`、sender `EYWRWEnLGxgpYVVQd2Tq74iMtHUYSas4qKG3SzrpkZr2`、payload `0x1::endless_account::transfer`、recipient `6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`、amount `100000` base units、`gas_used=10`。

结论：Endless Mainnet Web Wallet lane 已完成 P2 Task Reward 真实链上闭环：`proposal -> real wallet confirmation -> real txHash -> receipt -> feedback -> learning`。该结论只适用于 Endless Web Wallet lane；Luffa App QR / bridge 真实交易仍按 4.2 归类为 payload/schema 兼容问题。

### 4.1.2 Luffa App QR parser 复测

在 API、frontend、Cloudflare public callback 均在线，且 `npm run health:luffa-app` 返回 `ok: true` 后，本轮重新生成短时效 QR 做真实手机扫码复测。

复测过的格式：

- 标准 JSON QR payload。
- `protocol=luffa-endless-auth:v1` 兼容 JSON payload。
- `protocol=luffa-endless-auth` / `version=v1` key=value 最小 login QR，不包含 amount、recipient 或 task_reward intent。

结果：

- 手机 Luffa App 扫码入口提示“无效二维码”。
- 最小 login session `endless_qr_d96f0a34-89b2-44b3-a893-7e46afad942b` 在有效期内保持 `waiting`。
- `GET /v2/endless/qr-sessions/endless_qr_d96f0a34-89b2-44b3-a893-7e46afad942b/debug` 返回 `events=[]`。
- API 未收到 `/scan`、`/claim` 或 `/callback` 请求。

结论：该阻塞发生在 Luffa App 本地 QR parser/schema 阶段，早于 public callback 和交易 bridge。继续真实 App 验收前，需要 App 侧确认实际接受的 QR schema 或 deep link 格式；不要继续用同类 QR 让用户重复扫码。

### 4.2 Luffa App bridge 真实交易仍未完成

此前 Luffa App WebView bridge 对业务授权 / 交易打包多次返回：

- empty `rawData`
- `errorMsg=1006`
- `errorMsg=1009`
- `GeneralError.invalidParameter`
- no `txHash`

结论：

- Luffa App 登录授权和 signed callback 可以算 P0 原生授权协议验收进展。
- Luffa App bridge 的真实 transfer / task_reward 交易提交仍需 App 端确认 `packageTransactionV2` / `signAndSubmitTransaction` 的 payload schema。
- 不应继续用反复扫码来验证真实 txHash；真实 Endless txHash 应先走 Endless Web Wallet。
- 若手机端直接提示“无效二维码”且 API debug events 为空，应先归类为 App QR parser/schema 不兼容，而不是 bridge 或 callback 问题。

### 4.3 Public callback 当前准入状态

本轮后续已恢复 `https://lael.clawworld.eu.cc/v2/runtime-config`，并通过 `npm run health:luffa-app` 验证 public runtime 和 public scan page 均可访问。真实 Luffa App QR / WebView 验收前仍必须确认：

1. API 在线：`http://127.0.0.1:3000`
2. Frontend 在线：`http://127.0.0.1:3001`
3. Cloudflare named tunnel 在线并指向 API 3000
4. API 使用：

```bash
LAEL_PUBLIC_CALLBACK_BASE_URL=https://lael.clawworld.eu.cc
```

5. 扫码前运行：

```bash
npm run health:luffa-app
```

只有 health check 通过后，才能生成新 QR 并扫码。本轮 QR parser 复测显示，即使 public callback ready，手机端仍可能在本地 QR parser 阶段提示“无效二维码”；此时应按 4.1.2 处理，不继续重复扫码。

## 5. 下一步建议

优先顺序：

1. 重启 API / frontend，并恢复 `lael.clawworld.eu.cc` Cloudflare named tunnel。
2. 在前端加入 Web Wallet tx 预检：检查 sender account、recipient account、EDS balance、gas 余额和 testnet 网络。
3. 让用户在可见 Web Wallet modal 中完成连接、解锁和授权；若交易确认页仍灰色，记录 sender、recipient、amountUnits、options 和 wallet response。
4. 如果钱包 `Confirm` 仍灰色，直接记录为 Endless Web Wallet SDK / wallet UI 层阻塞，并准备最小复现交给 Endless Wallet 侧排查。
5. 真实 txHash 返回后，再执行 `Approve & Record`，补齐 receipt、feedback、learning。

## 6. 完成标准更新

P2 Task Reward 不能只以 mock hash 或 app authorization 作为完成标准。完成标准必须是：

```text
proposal -> real wallet/App confirmation -> real txHash/signature -> receipt -> feedback -> learning
```

如果当前链或钱包只返回签名授权而没有链上 txHash，只能标记为：

```text
app-authorized / wallet-authorized, txHash pending
```

不能标记为真实链上完成。

本轮例外完成项：Endless Web Wallet 主网 Task Reward 已返回真实 txHash `G1eVEi3JxrmPuoEjdXc1hLNuwqB9TscAVQzxo6vG5iid`，并完成 receipt、feedback、learning；该完成项不改变 Luffa App bridge 的 `txHash pending` 状态。
