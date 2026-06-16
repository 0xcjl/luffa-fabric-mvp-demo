# LAEL / Luffa Fabric Microsoft AGT 融合测试报告

日期：2026-06-02  
分支：`codex/varr-api-route-fixes`  
范围：Microsoft AGT Adapter PoC、Governance Extension 文档、Runtime Agent 前端展示、文档一致性测试。

## 1. 测试结论

本轮测试已通过。

Microsoft AGT 已作为 **Luffa Fabric Permission / Governance Extension Layer 的可选治理积木** 接入当前 MVP 代码。当前实现没有把 AGT 设置为核心依赖，也没有替代 Luffa DID、wallet signing、settlement、receipt、learning 或 reputation。

## 2. 本轮更新验证范围

| 模块 | 更新内容 | 验证结果 |
| --- | --- | --- |
| Governance Adapter | 新增 `MicrosoftAgtAdapter` PoC | 通过 |
| LAEL Core | 支持可选 `governanceAdapter` | 通过 |
| Permission | 新增外部治理决策记录入口 | 通过 |
| Runtime Agent UI | 展示 Governance Source、AGT Decision Record、Disclosure | 通过 |
| Evidence | AGT decision record 进入 evidence card | 通过 |
| Docs | 新增 AGT 融合文档，并更新 requirements / MVP / test plan / timeline | 通过 |
| Tests | 新增 AGT adapter tests 和文档一致性检查 | 通过 |

## 3. 自动化测试结果

### 3.1 TypeScript Root Check

命令：

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

结果：通过。

### 3.2 Targeted Tests

命令：

```bash
./node_modules/.bin/vitest run tests/governance-adapter.test.ts tests/docs.test.ts --config vitest.config.ts
```

结果：

```text
Test Files  2 passed (2)
Tests       19 passed (19)
```

覆盖内容：

- AGT `ALLOW` -> Luffa execution receipt metadata。
- AGT `DENY` -> Luffa denied receipt。
- AGT `REQUIRES_CONFIRMATION` -> Luffa denied / pending human confirmation record。
- AGT unavailable -> fallback to Luffa Native Policy，并记录 degraded evidence。
- Agent capability 不通过时，不调用 AGT。
- 文档包含 AGT Adapter 定位、索引和测试计划映射。

### 3.3 Full Root Vitest

命令：

```bash
./node_modules/.bin/vitest run --config vitest.config.ts
```

结果：

```text
Test Files  13 passed (13)
Tests       107 passed (107)
```

### 3.4 VARR Tests

命令：

```bash
node --experimental-strip-types --test varr-mvp1/tests/**/*.test.ts
```

结果：

```text
tests 31
pass  31
fail  0
```

### 3.5 Frontend Build

命令：

```bash
cd src/frontend
npm run build
```

结果：通过。

备注：

- 构建过程中仍出现 WalletConnect / pino 的既有 optional warning：`pino-pretty` 未解析。
- 该 warning 在之前版本中已存在，不影响本次构建通过。
- Next.js 页面 `/` 成功完成 static prerender。

## 4. AGT Adapter 行为验收

| 场景 | 预期 | 实际结果 |
| --- | --- | --- |
| low-risk summary / public context | AGT `ALLOW`，继续执行 | 通过 |
| destructive tool，如 delete/drop/truncate | AGT `DENY`，生成 denied receipt | 通过 |
| private context / prompt injection | AGT `DENY`，阻断执行 | 通过 |
| publish / delegate / transfer / swap / high risk | AGT `REQUIRES_CONFIRMATION`，不直接执行 | 通过 |
| AGT unavailable | fallback to Luffa Native Policy，记录 degraded evidence | 通过 |
| Agent capability denied | 不调用 AGT，先由 Luffa capability gate 阻断 | 通过 |

## 5. 安全边界验证

| 边界 | 结果 |
| --- | --- |
| AGT 不替代 Luffa DID / Mapping DID | 符合 |
| AGT 不负责 wallet signing | 符合 |
| AGT 不执行 settlement | 符合 |
| AGT 不绕过 human confirmation | 符合 |
| AGT decision record 只作为 evidence item / receipt metadata | 符合 |
| 默认 LAEL 行为不依赖 AGT | 符合 |

## 6. 当前未完成项

本轮是 Adapter PoC，不是完整 AGT SDK 接入。

后续如果继续推进，需要单独评估：

- 是否接入真实 Microsoft AGT runtime / policy engine。
- 是否 fork AGT 并适配 Luffa DID、wallet/value action、A2A delegation、settlement metadata。
- 是否把 AGT MCP Security Gateway 接入真实 MCP tool call。
- 是否新增浏览器人工验收截图报告。

## 7. 最终结论

本轮 Microsoft AGT 融合方案已经完成 PoC 级实现和自动化验证。

当前最稳妥的产品定位仍然是：

> AGT 是 Luffa Fabric Permission / Governance Extension Layer 的一个可选治理积木；Luffa Fabric 仍然负责 Identity、Permission、Execution、Settlement、Evidence、Feedback、Learning 的完整闭环。

