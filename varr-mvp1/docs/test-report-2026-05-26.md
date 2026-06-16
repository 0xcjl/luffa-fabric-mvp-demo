# Luffa Fabric VARR 前四项后续建议修复与验证报告

日期：2026-05-26  
分支：`codex/varr-api-route-fixes`  
范围：仅处理上一轮报告中“后续建议”的前四项，不进入真实钱包、真实链上、RPC 或 Luffa 第三步接入。

## 1. 结论

前四项建议已经完成并通过本地验证：

1. VARR API 集成测试已加入 CI。
2. 新增 `pnpm demo:api`，可一键跑通 HTTP API 版 VARR 闭环。
3. 明确推荐 Node.js 24 LTS，并用 `.nvmrc` 与 `engines` 固定支持边界。
4. 新增 API 可选快照持久化能力，并补充“重启后可读取状态”的集成测试。

当前最小可信闭环仍保持通过：Agent 注册、Capability 授权、Context 边界、Workflow 执行、ExecutionReceipt、Feedback、LearningSignal，以及安全拒绝路径均在测试覆盖内。

## 2. 已完成修改

### 2.1 CI 覆盖 VARR API 集成测试

修改文件：

- `.github/workflows/ci.yml`

新增独立 `varr-mvp1` job：

- 使用仓库 `.nvmrc` 指定 Node 24。
- 在 `varr-mvp1` 目录安装依赖。
- 执行 `pnpm test`。
- 执行 `pnpm demo:api`。

这样可以避免只跑根目录 Core Fabric 测试，而遗漏 VARR MVP1 API 路由、闭环和安全边界回归。

### 2.2 新增 API demo 脚本

修改文件：

- `varr-mvp1/package.json`
- `varr-mvp1/scripts/demo-api.ts`
- `varr-mvp1/tests/integration/api-demo-script.test.ts`

新增命令：

```bash
pnpm demo:api
```

该命令会启动本地临时 API 服务，并通过 SDK 调用标准 OpenAPI 路径完成：

- `POST /v1/agents`
- `POST /v1/contexts`
- `POST /v1/workflows`
- `POST /v1/capabilities`
- `POST /v1/execution/run`
- `POST /v1/feedback`
- `GET /v1/learning/signals?receipt_id=receipt_001`

成功输出包括：

```text
API execution status: success
API receipt generated: receipt_001
API feedback accepted: yes
API learning signal emitted: yes
```

### 2.3 明确 Node.js 推荐版本

修改文件：

- `.nvmrc`
- `package.json`
- `varr-mvp1/.nvmrc`
- `varr-mvp1/package.json`
- `varr-mvp1/docs/quickstart.md`

处理结果：

- 推荐本地和 CI 使用 Node.js 24 LTS。
- `engines` 调整为 `>=20 <26`。
- 保留 `pnpm@11.1.3`。
- quickstart 增加 Node 24 说明和 `npx pnpm@11.1.3` fallback。

原因：

- 本机当前 Node `v26.0.0` 能运行测试，但会触发引擎警告。
- 之前已观察到 Node 26 下 Corepack/pnpm 兼容性和可选原生依赖 `better-sqlite3` 构建风险。
- 因此建议 CI 和同事本地验证统一使用 Node 24，减少环境噪音。

### 2.4 API 可选快照持久化与重启验证

修改文件：

- `varr-mvp1/packages/api/src/persistence.ts`
- `varr-mvp1/packages/api/src/server.ts`
- `varr-mvp1/tests/integration/api.persistence.test.ts`
- `varr-mvp1/docs/quickstart.md`

新增能力：

```bash
LAEL_STATE_FILE=.lael/api-state.json pnpm api
```

当 `LAEL_STATE_FILE` 存在时，API 会：

- 启动时从 JSON snapshot 加载 repositories。
- 非 GET 请求成功后写回 snapshot。
- 重启后继续读取已注册的 Agent、Capability、Context、Workflow 等状态。

本轮没有实现真正 SQLite repository。原因是当前 `sqlite.repository.ts` 明确标记为 MVP1 extension point，且 `better-sqlite3` 在 Node 26 环境下已有构建风险。为了保持改动小、风险低，本轮采用已有 memory repository snapshot 机制做 opt-in 本地持久化。

## 3. 测试覆盖

新增测试：

- `varr-mvp1/tests/integration/project-readiness.test.ts`
  - 检查 `.nvmrc`。
  - 检查 `demo:api` 脚本存在。
  - 检查 CI 中存在 VARR MVP1 job，且执行 `pnpm test` 与 `pnpm demo:api`。
- `varr-mvp1/tests/integration/api-demo-script.test.ts`
  - 实际运行 `scripts/demo-api.ts`。
  - 校验 API 闭环输出。
- `varr-mvp1/tests/integration/api.persistence.test.ts`
  - 创建 API 状态。
  - 写入 snapshot。
  - 模拟服务重启。
  - 从 snapshot 重新加载并读取 Agent 与 Capability。

已有测试继续覆盖：

- 标准 API 路径完整闭环。
- 缺失 capability 拒绝。
- 跨 namespace context 拒绝。
- critical action 拒绝。
- high-risk publish 返回 `pending_approval`。
- 无效 receipt feedback 拒绝。
- 所有关键 runtime 路径生成 `ExecutionReceipt`。

## 4. 验证结果

本地环境：

- 当前机器 Node：`v26.0.0`
- 推荐 Node：`24`
- 包管理器：`pnpm@11.1.3`

验证命令与结果：

```bash
cd varr-mvp1 && rtk npx pnpm@11.1.3 test
```

结果：

- 26 个测试通过。
- 0 个失败。
- 覆盖 API route、API demo、API persistence、项目 readiness、安全边界和 VARR core 规则。

```bash
cd varr-mvp1 && rtk npx pnpm@11.1.3 demo:api
```

结果：

- API execution status: `success`
- API receipt generated: `receipt_001`
- API feedback accepted: `yes`
- API learning signal emitted: `yes`

```bash
cd varr-mvp1 && rtk npx pnpm@11.1.3 demo
```

结果：

- CLI execution status: `success`
- Receipt generated: `receipt_001`
- Feedback accepted: `yes`
- Learning signal emitted: `yes`

```bash
rtk npx pnpm@11.1.3 test
```

结果：

- 根目录 Core Fabric 测试通过。
- 7 个测试文件通过。
- 74 个测试通过。

说明：

- 因本机实际 Node 为 `v26.0.0`，上述命令会出现 `Unsupported engine` 警告。
- 该警告符合本轮新增约束预期：项目现在明确建议使用 Node 24，并将 Node 26 标为非推荐运行时。

## 5. 对同事的反馈建议

### 5.1 已修复项

- OpenAPI 标准路径可用性已修复。
- API 集成测试已覆盖标准闭环和关键安全拒绝路径。
- CI 已补上 VARR MVP1 验证。
- API demo 已可一键执行。
- API 状态可通过 `LAEL_STATE_FILE` 做本地重启验证。
- Node 运行时建议已明确。

### 5.2 仍建议后续处理

1. 如果 VARR API 要进入长期服务形态，需要决定正式 persistence 方案：
   - 继续 JSON snapshot 仅适合本地 demo 和轻量验证。
   - SQLite/Postgres 适合服务化验证，但需要补事务、并发、迁移和 schema version。
2. `better-sqlite3` 兼容性建议单独处理：
   - 要么固定 Node 24。
   - 要么升级 native dependency 并做 Node 26 构建验证。
3. API 错误语义仍偏 MVP：
   - 现在业务拒绝多数返回 200 + receipt/ok。
   - 如果给外部开发者接入，建议补充统一错误码、HTTP status 约定和错误 schema。
4. Luffa 第三步接入前，应准备最小 adapter contract：
   - Luffa 侧身份标识如何映射到 `AgentResource`。
   - Luffa 侧权限如何映射到 `CapabilityGrant`。
   - Luffa 侧内容/频道/会话如何映射到 `ContextResource`。
   - Luffa 侧动作如何映射到 `WorkflowResource.steps` 和 `ExecutionIntent.requested_actions`。

## 6. 第三步接入前的建议验收标准

进入 Luffa 接入验证前，建议先确认以下四个输入：

1. 选择一个低风险 Luffa 场景，例如“读取公开频道内容并生成摘要草稿”。
2. 明确接入对象是 SuperBox、小程序、频道、Hermes，还是 Luffa Wallet 相关能力。
3. 明确第一版只验证 mock execution，不做真实发布、支付、钱包签名或链上结算。
4. 明确 Luffa 侧数据边界：公开数据、授权数据、私密数据分别如何进入 Context。

建议第三步仍按最小闭环推进：

```text
Luffa 场景样例
-> AgentResource
-> CapabilityGrant
-> ContextResource
-> WorkflowResource
-> ExecutionIntent
-> ExecutionReceipt
-> Feedback
-> LearningSignal
```

目标不是一次性接完整产品，而是先证明 Luffa 的一个低风险真实场景能被 VARR 模型表达、执行、审计和学习。
