# LAEL / Luffa Fabric 新框架文档与实施计划

## Summary

先产出 3 类备案文档，每类 **中文版和英文版分开**，同时保存到仓库和 `Downloads`：

| 文档 | 中文版 | 英文版 | 用途 |
|---|---|---|---|
| 完整需求文档 | `docs/LAEL_REQUIREMENTS_v0.3.zh.md` | `docs/LAEL_REQUIREMENTS_v0.3.en.md` | 定义 LAEL / Luffa Fabric 总体定位、架构、双路径能力 |
| MVP 文档 | `docs/LAEL_MVP_v0.3.zh.md` | `docs/LAEL_MVP_v0.3.en.md` | 定义当前阶段 MVP 范围、用户故事、验收标准 |
| 测试方案 | `docs/LAEL_TEST_PLAN_v0.3.zh.md` | `docs/LAEL_TEST_PLAN_v0.3.en.md` | 定义自动化测试、人工测试、演示验收路径 |

执行时同步复制一份到：

`/Users/xyz/Downloads/LAEL_REQUIREMENTS_v0.3.zh.md` 等同名文件。

## 文档内容

### 1. 完整需求文档

核心标题：

**LAEL / Luffa Fabric: Verifiable Adaptive Resource Runtime for Agentic Economy**

中文定位：

**LAEL 是 Luffa 的 Agentic Runtime Fabric，也是外部 AI Agent、社区、应用与服务可接入的可信执行基础设施。**

必须覆盖：

- 产品本质：不是聊天机器人、Workflow Builder、MCP Wrapper、Agent Marketplace。
- 核心问题：谁执行、是否有权、是否可控、是否可验证、价值如何计量结算、责任如何追溯、系统如何学习。
- 五层闭环：Identity、Permission、Execution、Settlement、Learning。
- 五个原则：Composable、Verifiable、Adaptive、Governable、Open Infrastructure。
- 统一架构：链下执行、链上可验证、链上价值执行。
- 双路径：
  - **Off-chain Agent Execution**：OpenClaw、Hermes、Claude Code、Codex、API Agent。
  - **On-chain Value Execution**：transfer、trading/swap、settlement、reward、claim、payment。
- DID 映射：非链上 Agent / 非 DID 用户也要映射到 LAEL DID。
- Evidence 策略：private log、verifiable digest、optional on-chain attestation。
- Settlement 定义：不只 crypto payment，也包括 fiat proof、invoice proof、resource credit、API cost、on/off-ramp intent。

### 2. MVP 文档

核心标题：

**Unified Agent Runtime Fabric MVP: Off-chain Execution, On-chain Verifiability, On-chain Value Execution**

MVP 不拆成两个产品，而是一个统一 MVP 下的两条验收路径：

| 路径 | MVP 场景 | 第一阶段深度 |
|---|---|---|
| Off-chain Agent Execution | OpenClaw/Codex Stub 读取 public community context，生成 summary/report | 真实 runtime execution + receipt + learning；链上 anchoring 先模拟 |
| On-chain Value Execution | Base Sepolia ETH/USDC transfer | 真实钱包签名 + txHash + receipt + feedback + learning |
| On-chain Trading/Swap | ETH → USDC swap proposal | 第一阶段只做 proposal + permission + simulated receipt，不接真实 DEX |
| Fiat / On-off-ramp | invoice/payment proof | 第一阶段只做 proof record，不接 Stripe/银行 |

MVP 验收必须包含：

- Agent DID mapping。
- Permission decision card。
- Execution receipt。
- Trace / evidence digest。
- Settlement record。
- Feedback。
- Learning signal / memory。
- 成功路径和失败路径。
- 明确安全边界：不自动提高额度、不自动加入收款人、不绕过人工确认、不导出训练数据。

### 3. 测试方案

测试方案分四组：

| 组 | 自动化测试 | 人工测试 |
|---|---|---|
| Off-chain Runtime | VARR runtime、capability、context、approval、receipt、learning tests | OpenClaw/Codex Stub 执行 summary，查看 receipt/learning |
| On-chain Transfer | wallet、payment-agent、settlement、ledger tests | Base Sepolia ETH 小额转账，查看 txHash/receipt |
| On-chain Trading/Swap | simulated swap intent、permission、risk block tests | 输入 swap 请求，确认只生成 proposal，不真实交易 |
| Fiat / Proof Settlement | fiat-proof / invoice-proof record tests | 创建 proof receipt，确认没有真实支付动作 |

保留现有验证命令：

- 根项目类型检查：`tsc -p tsconfig.json --noEmit`
- 根项目测试：`vitest run --config vitest.config.ts`
- VARR 测试：`node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts`
- 前端构建：`npm run build` in `src/frontend`
- 前端/后端 smoke test：3000 API + 3001 页面资源

## 实施顺序

1. **先写备案文档**
   - 新建仓库根级 `docs/`。
   - 写 6 个 Markdown 文件：3 份中文、3 份英文。
   - 中文版作为主版本，英文版忠实翻译，不额外扩展。
   - 同步复制到 `/Users/xyz/Downloads/`。

2. **再更新现有 README / QUICKSTART**
   - README 只保留高层摘要，不塞完整 PRD。
   - QUICKSTART 增加两个入口：
     - Off-chain Runtime demo
     - On-chain Value demo
   - 避免把产品继续讲成单一 Payment Agent demo。

3. **实施功能补齐**
   - 前端增加 tabs：
     - `Runtime Agent`
     - `On-chain Value Agent`
     - `Evidence / Learning`
   - Runtime Agent tab 对接 VARR demo path。
   - On-chain Value Agent tab 保留当前 ETH/USDC transfer。
   - 新增 simulated swap proposal，不接真实 DEX。
   - 新增 fiat-proof / invoice-proof settlement record，不接真实支付。

4. **补测试**
   - 新增 doc consistency smoke check。
   - 新增 simulated swap tests。
   - 新增 fiat-proof settlement tests。
   - 保持现有 root tests、VARR tests、frontend build 全部通过。

5. **最终验收**
   - 自动化测试全部通过。
   - 人工跑通：
     - Off-chain Agent summary → receipt → learning。
     - Base Sepolia ETH transfer → txHash → receipt → learning。
     - Swap proposal → permission → simulated receipt。
     - Fiat proof → settlement proof receipt。
   - 输出一份最终测试结果摘要，追加到测试方案文档或单独生成 test report。

## Assumptions

- 文档保存到仓库 `docs/`，并复制同名文件到 `/Users/xyz/Downloads/`。
- 中文版和英文版分开维护，不做中英混排。
- 第一阶段不接真实 Stripe、银行、on/off-ramp provider。
- 第一阶段不接真实 DEX swap，只做 simulated swap proposal 和 receipt。
- 链上真实执行仍以 Base Sepolia ETH/USDC transfer 为主。
- Off-chain Agent 的核心差异化是 DID mapping、permission、context boundary、trace/evidence、receipt、learning，而不是 fiat payment。
