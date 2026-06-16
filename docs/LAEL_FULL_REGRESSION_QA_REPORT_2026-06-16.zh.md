# LAEL / Luffa Fabric 全量回归与前端稳定性测试报告

日期：2026-06-16

## 背景

在 P0-P2 关键闭环完成后，前端刷新一度出现裸 HTML 样式，Chrome 页面显示正常文本但无 Tailwind / panel 样式，之前还曾出现：

```text
Application error: a client-side exception has occurred while loading 127.0.0.1
```

同时用户需要继续使用前端 `Run Full Automated Checks` 做全自动检查。

## 根因

本次裸样式不是钱包连接逻辑坏掉，而是 Next.js dev server 的静态资源目录被全自动检查里的 `frontend-build` 污染。

旧配置把 dev server 和 build 都写入同一个 `src/frontend/.next-dev`：

```text
next dev  -> .next-dev
next build -> .next-dev
```

当 QA Runner 在 dev server 运行期间执行 `next build` 后，dev server 继续返回 HTML，但 HTML 引用的 CSS 路径：

```text
/_next/static/css/app/layout.css
```

曾返回 404，导致页面退回裸 HTML。

## 修复

### 1. 隔离 Next dev / build 输出目录

前端脚本改为：

```text
npm run dev   -> NEXT_DIST_DIR=.next-live
npm run build -> NEXT_DIST_DIR=.next-build
npm run start -> NEXT_DIST_DIR=.next-build
```

`next.config.mjs` 使用：

```js
distDir: process.env.NEXT_DIST_DIR ?? ".next-live"
```

这样 `Run Full Automated Checks` 里的 frontend build 不再覆盖当前 live dev server 的产物。

### 2. 自动检查新增 CSS smoke

`frontend-page-smoke` 不再只检查 HTML 200 和页面文案，还会：

- 拒绝 `Application error: a client-side exception` 页面。
- 从 HTML 中提取 stylesheet links。
- 逐个请求 CSS 资源并要求返回 200。

这能直接捕捉“HTML 正常但 CSS 404 / 页面裸样式”的回归。

### 3. QA Runner 测试环境隔离

QA Runner 日常开启，但 root tests 必须隔离运行环境：

- `LAEL_SETTLEMENT_MODE=mock`
- `LAEL_ENABLE_MAINNET_EXECUTION=false`
- `LAEL_PUBLIC_CALLBACK_BASE_URL=`

否则 API 当前为主网验收运行时，`LAEL_SETTLEMENT_MODE=real` 和 public callback 会污染 root vitest 的 mock / local-only 预期。

### 4. QA Runner 仍保持 localhost-only

API 可以日常用 `ENABLE_LAEL_QA_RUNNER=true` 启动，但 `/v2/qa/runs` 仍只允许本机请求。

即使 QA Runner 开启，带以下代理 / Cloudflare 客户端头的请求也会被拒绝：

- `cf-connecting-ip`
- `x-forwarded-for`
- `x-real-ip`
- `true-client-ip`

## 当前验证结果

### 全自动检查

`POST http://127.0.0.1:3000/v2/qa/runs`

结果：通过。

- runId：`qa_mqg0m76y`
- status：`pass`
- Root typecheck：pass
- Root vitest：pass，18 files / 166 tests
- VARR tests：pass，31 tests
- Frontend build：pass
- Multi-chain docs smoke：pass
- API smoke test：pass
- Frontend page smoke test：pass

### 服务健康

`npm run health:luffa-app`

结果：`ok=true`

覆盖：

- local API runtime-config：200
- local frontend：200
- public callback base configured：`https://lael.clawworld.eu.cc`
- public runtime-config 连续 3 次：200
- 临时 Endless QR session create：201
- public scan page：200，content-type `text/html`

### CSS smoke

当前前端 HTML stylesheet：

```text
/_next/static/css/app/layout.css
```

返回：`200`

### 浏览器检查

Chrome 刷新后：

- 页面标题：`Luffa Fabric MVP 2`
- `Application error`：未出现
- `Run Full Automated Checks`：可见
- 页面样式恢复，Tailwind / panel 样式正常

控制台仍有 EVM 钱包扩展争抢 `window.ethereum` 的报错。这是浏览器扩展注入冲突，不是本次页面裸样式根因；若 EVM 钱包连接不弹窗，建议只保留一个 EVM 钱包扩展启用。

## 当前非阻塞备注

- `demo-video/` 仍为未跟踪目录，本轮不处理 demo video。
- `.next-build`、`.next-live` 为本地运行产物，已加入 `.gitignore`。
- 当前主网运行 API 仍保留 `LAEL_ENABLE_MAINNET_EXECUTION=true` 和 `LAEL_SETTLEMENT_MODE=real`，用于当前验收环境；QA Runner 内部测试命令已显式隔离为 mock 环境。
- Chrome 钱包扩展注入冲突不会导致页面崩溃，但可能影响 EVM provider 选择。

## 结论

最近 P0-P2 测试和更改没有破坏核心自动化基线。发现并修复了一个由全自动检查触发的前端 dev/build 产物污染问题，并把 CSS 资源检查加入 QA Runner，避免以后 HTML 200 但页面裸样式的情况漏检。
