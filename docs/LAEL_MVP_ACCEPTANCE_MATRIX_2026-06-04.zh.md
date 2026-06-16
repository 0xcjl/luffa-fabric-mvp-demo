# LAEL / Luffa Fabric MVP 验收矩阵

日期：2026-06-04
截止时间：2026-06-15 前完成全部当前阶段交付
范围：Full MVP testing、Wallet integration demo、Real-environment test report、Internal technical one-pager、Luffa App 原生授权、真实钱包小额证据、Task Reward 业务场景。Demo video 本轮暂停。

## 1. 当前交付目标

| 交付物 | 截止要求 | 当前状态 | 最小完成定义 |
|---|---:|---|---|
| Full MVP testing | 2026-06-15 前 | 自动化和 Base Sepolia 真实钱包主线已完成；最终交付前需重跑完整回归 | 自动化、Base Sepolia 真实链上、失败路径、模拟路径、文档测试均有记录 |
| Wallet integration demo | 2026-06-15 前 | 固定脚本已完成；demo video 本轮暂停 | 有 5-8 步稳定 demo script，可现场重复演示 |
| Real-environment test report | 2026-06-15 前 | 已完成真实环境证据和截图补齐 | 包含钱包、网络、txHash、explorer、receipt、learning、截图、失败路径 |
| Internal technical one-pager | 2026-06-15 前 | 已完成 | 一页说明定位、架构、当前能力、真实验证、边界、下一步 |
| P0 Luffa App authorization | 2026-06-15 前 | `luffa-endless-auth:v1` 已实现；真实 App callback 待联调 | signed QR / WebView callback 通过验签并生成 authorization receipt |
| P1 Real wallet evidence | 2026-06-15 前 | Base 已有证据；BNB / Solana / Endless 待手工补齐 | 每条测试网链路有 txHash/signature、explorer、receipt、feedback、learning 或明确 blocked |
| P2 Task Reward | 2026-06-15 前 | `businessAction=task_reward` 自动化闭环已实现 | 至少一条测试网完成 proposal -> authorization -> receipt -> feedback -> learning |

## 2. MVP 验收路径矩阵

| 路径 | 验收目标 | 自动化状态 | 手工 / 真实环境状态 | 必要证据 | 风险边界 |
|---|---|---|---|---|---|
| Off-chain Runtime | OpenClaw / Codex stub 进入 permission、execution receipt、evidence、learning | 已覆盖 VARR 和 root tests | 待最终手工跑一遍 UI | receipt id、trace digest、AGT decision、learning signal、截图 | AGT 是 Governance Extension，不替代 Luffa DID 或 receipt |
| Base Sepolia transfer | 真实钱包完成小额 ETH transfer 并记录 txHash receipt | payment-agent、wallet、settlement tests 已通过 | 待用户协助真实钱包签名 | wallet address、txHash、explorer link、receipt id、settlement id、feedback、learning、截图 | 只用小额测试；learning 不自动提额、不新增收款人、不绕过确认 |
| Base Mainnet guard | 默认阻止真实 mainnet execution；显式开启后仍需二次确认和金额上限 | frontend guard marker 已覆盖 | 待 UI 手工确认阻止行为 | env 状态、mainnetRiskAccepted 状态、阻止日志、截图 | 默认禁用；不作为 MVP 默认能力 |
| Endless QR / WebView authorization | 浏览器创建 `luffa-endless-auth:v1` session，App signed callback / WebView bridge 生成 authorization receipt | `tests/endless-qr.test.ts` 已覆盖 | 真实 App callback 待 App 端接入；mock 只能标 protocol_mock | sessionId、nonce、callbackUrl、signingMessage、signatureVerified、authorizationReceipt、截图 | mock callback 不代表真实 App；缺少 publicKey/fullMessage/signature 必须 blocked |
| Task Reward | Agent 完成小额任务并 reward Alice，生成 receipt + feedback + learning | payment-agent / frontend docs tests 已覆盖 | 待真实钱包或 App 手工截图 | businessAction、proposal、txHash/signature、receipt、feedback、learning、截图 | 仍需 human confirmation；learning 不自动放权 |
| Simulated swap | 生成 swap proposal 和 simulated receipt，不接真实 DEX | value-agent tests 已覆盖 | 待最终 UI 手工回归 | proposal id、permission decision、simulated receipt、截图 | 不接真实 DEX，不请求真实 swap 签名 |
| Fiat / invoice proof | 生成 proof settlement record，不触发真实支付 | settlement tests 已覆盖 | 待最终 UI 手工回归 | proof reference、settlement id、status、evidence classification、截图 | 不接 Stripe、银行、on/off-ramp |
| Feedback / Learning | 用户 feedback 进入 memory 和 policy suggestion | payment-agent / integration tests 已覆盖 | Base Sepolia 真实链上后必须补测 | before/after agent score、preference、policy suggestion、截图 | 不自动放权，不自动导出训练数据 |
| Project Docs / docs package | 文档入口、timeline、handoff、Project Docs 同步 | docs tests 已覆盖 | 每次新增文档后回归 | docs test output、文档链接 | 不把聊天内容作为唯一交付 |

## 3. 6 月 15 前执行顺序

1. 锁定本验收矩阵，并同步 `docs/README.md`、timeline、iteration history、`NEXT_SESSION_HANDOFF.md`、Project Docs。
2. 做 Base Sepolia 真实钱包手工验收。
3. 整理 Wallet Integration Demo 固定脚本。
4. 跑 Real-environment test 并收集证据。
5. 更新 Real-environment test report。
6. Internal technical one-pager 已产出，后续只需按最新验证状态维护。
7. 暂停 HyperFrames demo video，优先完成 Luffa App signed callback、BNB / Solana 手工证据和 Task Reward 截图。

## 4. 需要用户协助的节点

| 节点 | 用户需要做什么 | Agent 可以提前做什么 |
|---|---|---|
| Base Sepolia wallet signing | 使用 MetaMask / OKX 确认小额测试交易 | 准备页面、脚本、检查 API、记录结果模板 |
| 真实 txHash 确认 | 提供或确认 explorer link 可打开 | 生成报告条目并校验 receipt 字段 |
| 截图 | 确认可公开画面，必要时操作钱包弹窗 | 准备截图清单和报告模板 |
| Luffa App callback | App 端扫码或 WebView 返回 `publicKey/fullMessage/signature` | 保持 QR API、polling、callback report 模板 |
| BNB / Solana 手工签名 | 使用 OKX / MetaMask / Phantom 完成测试网小额授权 | 准备 proposal、receipt、feedback、learning 路径 |

## 5. 当前通过的自动化基线

最近一次验证：

- TypeScript root check：通过。
- Root vitest：18 files / 134 tests 通过。
- VARR tests：31 tests 通过。
- Frontend build：通过。
- HTTP smoke：`/v2/runtime-config`、前端首页、Endless QR create session 通过。

后续每次真实环境测试后，必须把命令、结果、txHash、截图和边界写入对应报告，不能只保留在聊天中。
