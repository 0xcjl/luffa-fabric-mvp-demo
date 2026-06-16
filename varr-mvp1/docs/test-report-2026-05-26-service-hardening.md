# Luffa Fabric VARR API 服务化修复验证报告

日期：2026-05-26  
分支：`codex/varr-api-route-fixes`  
范围：处理 VARR API 的服务化持久化、Node / SQLite 兼容性、API 错误语义；不接真实钱包、真实链上、RPC、测试币或 Luffa 生产数据。

## 1. 结论

本轮三项后续建议已完成：

1. Persistence：新增 SQLite JSON repository，作为 VARR API 本地长期服务化的第一版持久化方案。
2. Node / SQLite：`better-sqlite3` 升级到 `12.10.0`，Node 24 继续作为默认 CI / `.nvmrc` 基线，同时增加 Node 26 兼容性检查。
3. API 错误语义：业务拒绝不再全部返回 HTTP 200，新增统一 error envelope；执行拒绝路径仍保留 `ExecutionReceipt`。

当前 VARR API 已支持三种 storage driver：

```text
memory   -> 临时测试
snapshot -> JSON snapshot demo
sqlite   -> 本地长期服务化验证
```

## 2. 已完成修改

### 2.1 SQLite JSON Repository

新增 `createSqliteRepositories(dbPath)`，用 `better-sqlite3` 存储各类 VARR resource：

- AgentResource
- CapabilityGrant
- ContextResource
- WorkflowResource
- ExecutionReceipt
- FeedbackResource
- LearningSignal

SQLite schema 使用统一 `records(collection, id, json)` 表，保持现有 repository interface 不变。这样能在不引入复杂迁移系统的前提下，把 memory repository 的行为扩展为本地可重启持久化。

启动方式：

```bash
LAEL_STORAGE_DRIVER=sqlite LAEL_SQLITE_PATH=.lael/varr.db pnpm api
```

### 2.2 Storage Driver 配置

新增 API state factory：

```text
LAEL_STORAGE_DRIVER=memory
LAEL_STORAGE_DRIVER=snapshot LAEL_STATE_FILE=.lael/api-state.json
LAEL_STORAGE_DRIVER=sqlite LAEL_SQLITE_PATH=.lael/varr.db
```

默认行为：

- 未设置 driver 时使用 `memory`。
- 设置 `LAEL_STATE_FILE` 但未设置 driver 时兼容旧行为，走 `snapshot`。
- 缺失必要路径或非法 driver 时启动失败并给出清晰错误。

### 2.3 Node / better-sqlite3 兼容

处理结果：

- 根目录 `better-sqlite3` 升级到 `12.10.0`。
- `varr-mvp1` 新增 `better-sqlite3@^12.10.0` 依赖。
- `engines.node` 调整为 `>=20 <27`。
- `.nvmrc` 保持 `24`，继续作为默认稳定基线。
- CI 新增 `node26-compatibility` job，覆盖 root install/test/build 和 VARR install/test。

本机当前 Node `v26.0.0` 下已验证 `better-sqlite3` 可加载并可创建内存数据库。

### 2.4 API 错误语义

新增统一错误结构：

```json
{
  "error": {
    "code": "execution_denied",
    "message": "Capability denied",
    "status": 403,
    "method": "POST",
    "path": "/v1/execution/run",
    "details": {}
  },
  "receipt": {}
}
```

HTTP status 约定已实现：

- `400`：JSON 解析 / schema validation
- `404`：route not found / resource not found / invalid receipt feedback
- `409`：duplicate resource
- `422`：invalid reference / rejected execution
- `403`：capability denied、context boundary denied、critical action denied
- `202`：`pending_approval`
- `502`：execution failed
- `500`：server internal error

执行拒绝、失败、待审批路径继续生成并返回 `ExecutionReceipt`，因此不会牺牲审计证据。

### 2.5 SDK 错误处理

SDK 新增 `LaelApiError`：

- 非 2xx 响应抛出 typed error。
- 保留 `status`。
- 保留完整 error payload。
- 若响应包含 receipt，调用方仍可读取审计凭证。

## 3. 测试覆盖

新增和更新的测试覆盖：

- SQLite repository 重启后可读取 Agent / Capability / Context / Workflow。
- SQLite repository 可持久化 ExecutionReceipt / Feedback / LearningSignal。
- API 支持 `memory` / `snapshot` / `sqlite` 三种 driver。
- 缺失 `LAEL_STATE_FILE`、缺失 `LAEL_SQLITE_PATH`、非法 driver 都会失败。
- 缺失 capability 返回 HTTP `403`，并包含 `execution_denied` 与 receipt。
- 跨 namespace context 返回 HTTP `403`，并包含 receipt。
- critical action 返回 HTTP `403`，并包含 receipt。
- high-risk publish 返回 HTTP `202`，receipt 为 `pending_approval`。
- invalid receipt feedback 返回 HTTP `404`，使用统一 error schema。
- duplicate resource 返回 HTTP `409`。
- unknown route 返回 HTTP `404`，包含 method/path/code。
- SDK 对非 2xx 响应抛出 `LaelApiError`，并保留 payload。

## 4. 验证结果

本地环境：

- Node：`v26.0.0`
- pnpm：`11.1.3`
- SQLite dependency：`better-sqlite3@12.10.0`

验证命令与结果：

```bash
cd varr-mvp1 && rtk npx pnpm@11.1.3 install --frozen-lockfile
```

结果：通过。

```bash
cd varr-mvp1 && rtk npx pnpm@11.1.3 test
```

结果：31 个测试通过，0 个失败。

```bash
cd varr-mvp1 && rtk npx pnpm@11.1.3 demo:api
```

结果：

- API execution status: `success`
- API receipt generated: `receipt_001`
- API feedback accepted: `yes`
- API learning signal emitted: `yes`

```bash
cd varr-mvp1 && LAEL_STORAGE_DRIVER=sqlite LAEL_SQLITE_PATH=.lael/varr.db rtk npx pnpm@11.1.3 demo:api
```

结果：

- API execution status: `success`
- API receipt generated: fresh DB 为 `receipt_001`；重复使用同一个 SQLite DB 时会按已有记录递增
- API feedback accepted: `yes`
- API learning signal emitted: `yes`

```bash
rtk npx pnpm@11.1.3 install --frozen-lockfile
```

结果：通过。

```bash
rtk npx pnpm@11.1.3 test
```

结果：7 个测试文件通过，74 个测试通过。

```bash
rtk npx pnpm@11.1.3 build
```

结果：通过。

```bash
node -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); db.exec('select 1')"
```

结果：root 与 `varr-mvp1` 目录均可加载并执行。

## 5. 对同事的反馈建议

已修复：

- VARR API 已从 MVP memory-only 形态推进到本地可重启 SQLite service verification。
- Node 26 不再因为旧版 `better-sqlite3` 成为已知阻塞点。
- 外部开发者接 API 时可以依赖统一错误结构和 HTTP status，而不是只解析 HTTP 200 内部字段。
- SDK 现在能保留错误响应 payload 和 receipt，便于接入方做审计和 UI 提示。

仍需注意：

- SQLite 当前是本地单机服务化验证方案，不等同于生产级多实例数据库。
- JSON-in-SQLite schema 适合当前 MVP resource 模型；后续如果查询维度增多，应再设计列式索引或迁移到正式 relational schema。
- 真实 Luffa 接入前仍应保持低风险场景，先验证 Identity / Permission / Context / Workflow / Receipt / Feedback / LearningSignal 映射。
