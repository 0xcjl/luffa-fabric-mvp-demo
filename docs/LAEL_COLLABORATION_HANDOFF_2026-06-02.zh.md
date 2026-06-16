# LAEL / Luffa Fabric v0.3 协作开发交接说明

日期：2026-06-02

## 目标

这份文档用于把当前 LAEL / Luffa Fabric v0.3 最新开发版本交接给协作同事。它说明当前版本的定位、代码入口、文档入口、运行方式、验证方式和协作边界。

## GitHub 信息

| 项 | 内容 |
|---|---|
| Fork 仓库 | `https://github.com/0xcjl/luffa-fabric-test` |
| 当前协作分支 | `codex/varr-api-route-fixes` |
| Upstream | `https://github.com/Michael-Luffa/luffa-fabric` |
| 当前版本主题 | LAEL / Luffa Fabric MVP v0.3 Execution Loop Console |

同事应从 fork 的 `codex/varr-api-route-fixes` 分支开始开发，不要直接推送到 upstream。

## 当前版本范围

当前版本覆盖：

- LAEL / Luffa Fabric v0.3 完整需求、MVP、测试方案和时间线文档。
- Execution Loop Console 前端。
- Project Docs 前端项目文档页。
- Microsoft AGT Adapter PoC、AGT evidence mapping 和未来阶段规划。
- Off-chain Runtime Agent 演示路径。
- On-chain Value Agent 演示路径。
- Base / BNB / Solana / Endless 的主网和测试网展示。
- MetaMask / OKX Wallet、Phantom / Solana Wallet、Luffa App / Endless SDK 钱包入口。
- QA Runner、自动化测试面板、人工测试面板。
- Evidence / Learning 展示。

## 推荐阅读顺序

1. `docs/README.md`
2. `docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`
3. `docs/LAEL_REQUIREMENTS_v0.3.zh.md`
4. `docs/LAEL_MVP_v0.3.zh.md`
5. `docs/LAEL_TEST_PLAN_v0.3.zh.md`
6. `docs/LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md`
7. `docs/LAEL_AGT_INTEGRATION_v0.3.zh.md`
8. `docs/LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md`

## 本地启动

根项目：

```bash
npm install
npm run build
npm start
```

前端：

```bash
cd src/frontend
npm install
NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run dev
```

访问：

```text
http://127.0.0.1:3001/
```

## 验证命令

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
./node_modules/.bin/vitest run --config vitest.config.ts
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
cd src/frontend && NEXT_PUBLIC_LAEL_API_URL=http://127.0.0.1:3000 npm run build
```

## 钱包和网络边界

| Lane | 当前支持 | 边界 |
|---|---|---|
| EVM | MetaMask / OKX Wallet；Base、BNB 主网和测试网 | 测试网允许 MVP 签名路径；主网真实执行默认禁用 |
| Solana | Phantom / Solana Wallet；Devnet 和 Mainnet | Devnet 支持签名 receipt；Mainnet 只做连接、proposal、permission |
| Endless / Luffa App | Endless Testnet / Mainnet；Luffa App / Endless SDK | 普通 Chrome 需要 Luffa App WebView / QR protocol；独立 QR 授权是下一阶段 |

## 协作规则

- 新需求先更新 `docs/` 和前端 `Project Docs`，再改功能。
- 新测试报告必须放在 `docs/`，并补到 `docs/README.md` 和 `docs/LAEL_DOCS_TIMELINE_v0.3.zh.md`。
- 不要把 LAEL 讲成单一 Payment Agent demo；当前定位是统一 Runtime Fabric。
- 不要让 Microsoft AGT 替代 Luffa DID、wallet signing、settlement、receipt 或 learning。
- 不要默认开放主网真实价值执行。
- 不要把 WalletConnect / Project ID 作为当前 MVP 能力展示。

## 建议开发方式

同事可以从以下方向接入：

- 前端拆分：把 `src/frontend/app/page.tsx` 拆成更小的组件，但保持现有行为和测试通过。
- 钱包增强：完善 MetaMask / OKX Wallet 的网络切换、Phantom 连接状态、Luffa App WebView 检测。
- Endless QR：设计 Luffa App QR session / callback / polling 协议。
- AGT 下一阶段：按 `LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md` 评估真实 sidecar / MCP gateway。
- 浏览器验收：补充截图报告，更新 `docs/assets/` 和测试报告。

## 当前交接结论

当前版本适合作为协作开发基线。自动化验证必须在每次提交前重新运行；人工验收重点看右上角钱包弹窗、多链网络展示、主网执行禁用提示、Solana 钱包选择弹窗、Endless / Luffa App bridge 提示。
