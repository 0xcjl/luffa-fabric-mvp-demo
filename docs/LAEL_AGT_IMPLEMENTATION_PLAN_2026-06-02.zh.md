# LAEL / Luffa Fabric × Microsoft AGT 未来阶段落地规划

日期：2026-06-02  
对应评估：`LAEL_AGT_NEXT_STEP_EVALUATION_2026-06-02.zh.md`  
当前基础：`MicrosoftAgtAdapter` PoC 已接入 LAEL core，默认不作为硬依赖。

## 0. 当前 MVP 决策

本文件不作为当前 MVP 阶段的完整实施范围。当前 MVP 阶段只需要证明：

- Microsoft AGT 可以作为 Permission / Governance Extension 的外部治理积木接入。
- AGT Adapter PoC 可以输出 governance decision / decision record。
- AGT decision record 可以被 Luffa Fabric 重新包装进 Permission、Receipt、Evidence、Learning 闭环。
- 前端可以清楚展示 Governance Source、AGT Decision Record、Evidence disclosure 和 Learning boundary。

当前 MVP 阶段不要求落地：

- 真实 Microsoft AGT runtime / policy engine 作为生产依赖。
- 真实 AGT MCP Security Gateway 接入全部 MCP tool call。
- fork AGT 并适配 Luffa DID、wallet/value action、A2A delegation、settlement metadata。
- AGT 接管 wallet signing、settlement、on-chain value execution 或 human confirmation。

因此，本文件改为 **未来阶段落地规划**。等 LAEL / Luffa Fabric MVP v0.3 主闭环验收稳定后，再按本文件拆分 spike / pilot / production hardening 推进。

## 1. 未来阶段目标

在未来阶段，把 Microsoft AGT 从“本地 PoC Adapter”推进到“可验证的外部治理积木接入路径”，但继续保持 Luffa Fabric 的核心闭环不变：

```text
Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning
```

未来阶段目标不是把 LAEL 改造成 AGT wrapper，而是分阶段补齐：

- AGT sidecar client。
- MCP tool-call governance wrapper。
- 浏览器人工验收截图报告。
- fork decision gate。

## 2. 未来实施顺序

| 顺序 | 项目 | 产出 | 状态 |
| --- | --- | --- | --- |
| 0 | MVP PoC boundary | Adapter PoC、前端展示、evidence mapping | 当前 MVP 保留 |
| 1 | AGT sidecar client spike | `AgtSidecarClient`，实现 `GovernanceAdapter` 接口 | 未来阶段 Spike |
| 2 | MCP governance wrapper pilot | MCP tool call 进入 AGT/Luffa governance path | 未来阶段 Pilot |
| 3 | 浏览器验收截图报告升级 | 覆盖真实 sidecar / MCP gateway 的验收截图 | 未来阶段补充 |
| 4 | fork decision gate | 根据真实阻塞点评估是否 fork | 未来阶段决策，不默认 fork |

## 3. AGT Sidecar Client

### 3.1 目标

新增 sidecar client，允许 LAEL 调用外部 AGT policy engine / runtime，而不是只能使用本地模拟 Adapter。

### 3.2 行为

`AgtSidecarClient` 作为 `GovernanceAdapter`：

- 输入 LAEL 标准 governance request。
- 调用 `POST /governance/evaluate`。
- 将 sidecar response 归一成 `GovernanceDecisionRecord`。
- sidecar 超时或失败时返回 `degraded=true` 的 fallback record。

### 3.3 安全边界

- sidecar 不接管 LAEL core。
- sidecar 不执行 wallet signing。
- sidecar 不执行 settlement。
- sidecar 不绕过 capability、permission 或 human confirmation。

## 4. MCP Governance Wrapper

### 4.1 目标

在 `src/mcp/tools.ts` 的 tool call 入口前加入 governance wrapper，让真实 MCP tool call 可以被 AGT / Luffa governance path 检查。

### 4.2 行为

- `lael.register_agent` 不经过 AGT execution guard。
- `lael.invoke` 和 `luffa.*` tool call 进入 LAEL invoke pipeline。
- 工具名写入 `context.toolName`。
- prompt injection / private context / destructive tool metadata 可以通过 `context` 传入 AGT adapter。
- AGT decision record 最终进入 execution result / receipt metadata。

## 5. 浏览器人工验收截图报告

### 5.1 目标

生成一份 UI 验收报告，证明前端能清楚展示：

- Mapping DID / Agent ID / External Agent ID / Wallet Address。
- Governance Source = Microsoft AGT Adapter。
- AGT Decision Record。
- Evidence disclosure。
- Learning boundary。

### 5.2 输出

- 仓库：`docs/LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md`
- Downloads：`/Users/xyz/Downloads/LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md`
- 截图目录：`docs/assets/agt-browser-acceptance-2026-06-02/`

## 6. Fork Decision Gate

当前 MVP 不 fork AGT。未来阶段也不默认 fork，只有出现实际阻塞才重新评估。

只有出现以下阻塞才重新评估 fork：

- AGT schema 无法表达 Luffa DID / Mapping DID。
- AGT decision record 无法携带 wallet / value action metadata。
- AGT 无法表达 A2A delegation chain。
- AGT 无法输出 Luffa receipt 所需 deterministic evidence field。

## 7. 测试方案

当前 MVP 已覆盖：

- AGT Adapter PoC decision mapping。
- AGT decision record 进入 Luffa receipt metadata / evidence 展示。
- Project Docs 与 AGT 文档索引。

未来阶段需要新增：

自动化测试：

- `AgtSidecarClient` allow / deny / requires confirmation / timeout fallback。
- MCP governance wrapper 将 toolName 写入 execution context。
- AGT decision record 进入 MCP-triggered execution result。
- 文档索引包含 AGT next-step evaluation、implementation plan、browser acceptance report。

验证命令：

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
./node_modules/.bin/vitest run --config vitest.config.ts
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
cd src/frontend && npm run build
```
