# 黑话单（dsh-jargon-list）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个 DSH Web 持久化插件：右侧栏「黑话单」页签展示当前项目的黑话与详细说明，用户与 agent 都能增删改查，数据存 `<工作区>/.dsh/jargon.json`。

**Architecture:** Host 半（CJS）持有一个 `JargonStore`，同时供同源路由 `/-/jargon/*` 与三个 agent 工具使用；Client 半（JSX → esbuild 打包）注册右侧栏页签类型 + 页签体 + 会话标题栏按钮，通过同源 `fetch` 读写，页签可见时轮询。

**Tech Stack:** Node ≥ 20、Cordis 4、`ctx.webServer`/`ctx.connection`/`ctx.tools`/`ctx.slots`/`ctx.sidebarRightTabs`、React（宿主提供）、esbuild（dev）。

**Spec:** `docs/superpowers/specs/2026-11-08-jargon-list-design.md`（接口细节见 `docs/contracts/api.md`）

## Global Constraints

- 包名 `@tom2012/dsh-jargon-list`，`private: true`，Host 为 CJS（`require`/`module.exports`），Client 为 JSX 源码。
- 数据文件唯一：`<cwd>/.dsh/jargon.json`；`version: 1`；读操作绝不创建文件。
- 文本约束：`term` trim 后 1–80 字符、文件内大小写不敏感唯一；`definition` trim 后 1–4000 字符。
- 路由前缀 `/-/jargon`；同源 fetch；先过 `ctx.connection.requestRejection`，栅栏抛错回 503。
- 样式只用 `--dsw-*` 令牌，类名前缀 `jargon-`；不 import 任何 Harness Client 包；不写 `document.body`。
- Host 不 import dsh 内部包（`defineTool` 等一概不用）。
- 所有错误对用户可见，禁止静默吞错；文件损坏时禁止写入。
- 目标 profile：`web`（`DSH_PROFILE_DIR=/Users/tom/.dsh/profiles/web`），GUI `https://dsh.zhbc.bid:3003/`。

## Review Focus

这五类是 spec 没逐条展开、但最可能伤到真实使用者的地方。每条都在所属任务里有对应测试：

1. **数据文件损坏**（用户手改坏 / 半截写入）：读应报 `corrupt` 且带路径，任何写操作必须拒绝，绝不能拿空表覆盖。
2. **同一 term 的并发保存**（连点保存 / 双击回车）：第二次必须是更新（保持同一个 `id`），不能产生重复条目。
3. **伪造或过期的 cwd**：客户端传来的路径若不在工作区列表、或是文件/不存在，必须拒绝，不能在任意目录建 `.dsh/`。
4. **页签关闭/切会话后仍回来的请求**：不得对已卸载组件 setState，也不得用旧会话的响应覆盖新会话的列表。
5. **极端输入**：全空格 term、`term` 只有 emoji、4001 字说明、说明里含 `\n` 与 `\r\n`、term 大小写不同的重名。

---

### Task 1: 包骨架、构建与清单检查

**Files:**
- Create: `package.json`, `cordis.patch.yml`, `icon.svg`, `locale/zh.json`, `locale/en.json`, `.gitignore`, `README.md`
- Create: `tools/build.mjs`, `tools/check-package.mjs`
- Test: `tools/check-package.mjs` 自身即断言（`node tools/check-package.mjs` 退出码 0）

**Interfaces:**
- Produces: `package.json` 的 `main: "src/host/index.js"`、`exports['./client']: './client/bundle.js'`、`dsh.bundle.patch`、`dsh.client = { platform:'web', immediately:true, inject:['@deepseek-ai/dsh-client-ui-sidebar-right'] }`。
- Produces: `tools/build.mjs` 从 `src/client/index.js` 打出 `client/bundle.js`（包装成 `window.__ModuleLoader__.load({ id, factory })`，externals `react`/`react-dom`/`react/jsx-runtime`）。

- [ ] **Step 1: 写 `package.json`**，字段照上文 Interfaces；`devDependencies` 只放 `esbuild`、`react`、`react-dom`（后两个仅构建/测试用）；`scripts`: `build` / `check` / `test` / `verify`。
- [ ] **Step 2: 写 `cordis.patch.yml`**：`- insert: [{ id: jargon-list, name: '@tom2012/dsh-jargon-list' }]`。
- [ ] **Step 3: 写 `locale/zh.json` 与 `locale/en.json`**，含 `meta.title` / `meta.description`（中文「黑话单」，英文 "Jargon List"），文案与 `docs/contracts/api.md` §3 一致。
- [ ] **Step 4: 写 `icon.svg`**：24×24 viewBox、`currentColor` 描边的「词条/书签」图形，无位图、无外部引用。
- [ ] **Step 5: 写 `tools/build.mjs`**（照 `dsh-notes/tools/build.mjs` 的 wrapMain 部分，单入口、无 watch 也可）。
- [ ] **Step 6: 写 `tools/check-package.mjs`**：断言名称、`type`、`main`、`exports`、`dsh.bundle.patch`、`dsh.client.platform/immediately/inject`、`files` 覆盖 `src/**` 与 `client/bundle.js`、patch 里含 id 与包名、`locale/{zh,en}.json` 的 `meta.title` 非空、`icon.svg` 以 `<svg` 开头。
- [ ] **Step 7: `npm i` 后跑 `node tools/check-package.mjs`**，期望退出码 0。
- [ ] **Step 8: git init + 首次提交**（`git init && git add -A && git commit -m "chore: scaffold dsh-jargon-list"`）。

### Task 2: `JargonStore`（纯存储层）

**Files:**
- Create: `src/host/store.js`
- Test: `test/store.test.js`

**Interfaces:**
- Produces:
  - `class JargonStore { constructor({ fs?, now? }) }`
  - `async read(cwd) -> { terms, revision, file }`（`terms` 按 `updatedAt` 倒序）
  - `async save(cwd, { term, definition, by }) -> { terms, revision, entry }`（按 term upsert）
  - `async remove(cwd, { id?, term }) -> { terms, revision }`
  - `class StoreError extends Error { code: string }`，`code` ∈ `no-workspace | corrupt | invalid-term | duplicate-term | term-too-long | definition-too-long | not-found | io-error`
  - `JARGON_FILE = '.dsh/jargon.json'`、`hashRevision(text)`、`validateTerm(raw)`、`validateDefinition(raw)`（后三个导出以便单测）

- [ ] **Step 1: 写失败测试** `test/store.test.js`，用临时目录 + 注入 `fs`（`node:fs/promises` 真实实现也可以，tmpdir 隔离）。至少覆盖：
  - `read` 在文件不存在时返回 `{terms: [], revision: 'empty'}` 且**不创建** `.dsh/`
  - `save` 新建后文件内容符合 `version/terms` 形状，`entry.id` 为 16 位 hex，`updatedBy` 为传入值
  - 同一 term 再次 `save` 是更新：`id` 不变、`terms.length` 仍为 1
  - `save({term:'  '})` 抛 `invalid-term`；`term` 81 字符抛 `term-too-long`；`definition` 4001 字符抛 `definition-too-long`
  - 大小写不同的同名 term（`ABC` vs `abc`）视为同一条
  - 手写坏 JSON 后 `read` 抛 `corrupt` 且 message 含绝对路径；随后 `save` 也抛 `corrupt`，且文件内容**未被改写**
  - `remove({term})` 不存在时抛 `not-found`
  - `revision` 在内容变化后改变、无变化时不变
- [ ] **Step 2: 跑测试确认失败**：`node --test test/store.test.js` → 期望 `Cannot find module './store'` 或方法未定义。
- [ ] **Step 3: 实现 `src/host/store.js`**：单文件内串行队列（模块级 `Map<cwd, Promise>` 链）、原子写（`write .tmp-<rand>` → `rename`）、`fs.mkdir(dirname, {recursive:true})` 只在写时调用、读写都 trim/校验。
- [ ] **Step 4: 跑测试确认通过**：`node --test test/store.test.js` → 全绿。
- [ ] **Step 5: 提交**：`git add src/host/store.js test/store.test.js && git commit -m "feat(store): project-local jargon store with atomic writes"`。

### Task 3: 同源路由

**Files:**
- Create: `src/host/routes.js`
- Test: `test/routes.test.js`

**Interfaces:**
- Consumes: `JargonStore`、`StoreError`、`JARGON_FILE`
- Produces:
  - `registerRoutes(ctx, store, { warn }) -> () => void`（内部 `ctx.webServer.register({kind:'prefix', path:'/-/jargon', handler})`，返回 disposer 交回 `ctx.effect`）
  - `handleRequest({ method, url, readBody, store, resolveCwd }) -> { status, body }`（导出以便纯函数单测）
  - `resolveCwd(ctx, { session, cwd }) -> Promise<string>`（导出；校验顺序见 spec §5.3）
- 契约照 `docs/contracts/api.md` §2。

- [ ] **Step 1: 写失败测试** `test/routes.test.js`（用假 store 与假 `resolveCwd`，不启 HTTP）：
  - `GET /-/jargon/state` 正常 → 200 且 body 含 `ok/terms/revision/cwd`
  - `POST /-/jargon/mutate` 的 `save` → 200 且回 `entry`
  - `DELETE` → 405；`POST` 体 65 KiB → 413；action 未知 → 400 `bad-request`
  - `StoreError('duplicate-term')` → 409 且 body.error.code 一致
  - `resolveCwd` 抛 `no-workspace` → 409；未知路径以 `no-workspace` 呈现
- [ ] **Step 2: 跑测试确认失败**：`node --test test/routes.test.js`。
- [ ] **Step 3: 实现 `src/host/routes.js`**：`sendJson`/`sendJsonSafe`/`readJsonBody(limit)`/`connectionRejection`/`rejectionStatus` 照 `dsh-notes` 形态；`resolveCwd` 先查 `ctx.workspaceRegistry?.list()` 的 path 集合，再回退 `ctx.sessions?.get(session)?.header?.cwd`，都不命中抛 `no-workspace`；`path.isAbsolute` + `stat().isDirectory()` 双检。
- [ ] **Step 4: 跑测试确认通过**。
- [ ] **Step 5: 提交**：`git commit -m "feat(routes): same-origin /-/jargon API behind connection trust"`。

### Task 4: agent 工具

**Files:**
- Create: `src/host/tools.js`, `src/host/index.js`
- Test: `test/tools.test.js`

**Interfaces:**
- Consumes: `JargonStore`
- Produces:
  - `registerTools(ctx, store, { warn }) -> void`
  - `compileParameters(propertyMap) -> JSONSchema`（`required: true` 提升到顶层数组）
  - `jargonToolDefinitions(ctx, store) -> ToolDefinition[]`（名字 `jargon_list` / `jargon_save` / `jargon_delete`）
  - `src/host/index.js`: `module.exports = { name, inject: ['webServer','connection','tools','sessions','workspaceRegistry'], apply }`（`inject` 里缺服务时插件仍应能起：`apply` 内部逐项判空）

- [ ] **Step 1: 写失败测试** `test/tools.test.js`：
  - `compileParameters({ term: { type:'string', required:true } })` → `{type:'object', properties:{term:{type:'string'}}, required:['term']}`
  - `jargon_save` 的 `execute({term, definition}, {agent})` 写进 store 并把 `updatedBy` 记为 `agent`
  - `jargon_list` 的 `execute` 返回 `{ terms, total }`，`render` 返回 `[{type:'text', text}]`
  - `jargon_delete` 对不存在 term 返回的错误对象 `isError: true` 而非 throw（用 `output.render` 不影响断言）
  - 无 `agent` 时三个工具都返回明确错误，不写文件
- [ ] **Step 2: 跑测试确认失败**。
- [ ] **Step 3: 实现 `src/host/tools.js` + `src/host/index.js`**：工具描述英文，含「这是本项目内临时简称，起名或遇到陌生代号就记一条」的指令；`ctx.effect(() => ctx.webServer && registerRoutes(...))`、`ctx.effect(() => ctx.tools && registerTools(...))`。
- [ ] **Step 4: 跑测试确认通过**。
- [ ] **Step 5: 提交**：`git commit -m "feat(tools): jargon_list/save/delete for the agent"`。

### Task 5: Client 入口、页签类型、locale 与数据层

**Files:**
- Create: `src/client/index.js`, `src/client/api.js`, `src/client/workspace.js`, `src/client/i18n.js`, `src/client/icons.js`
- Test: `test/client-api.test.js`（用 stub fetch 断言 URL/方法/错误映射）

**Interfaces:**
- Consumes: 契约 §2/§3
- Produces:
  - `src/client/index.js`: `export const inject = ['slots']`；`export function apply(ctx)` 注册 locale、页签类型、页签体、头部按钮
  - `src/client/api.js`: `createApi({ fetch, base }) -> { state({session,cwd,signal}), mutate({session,cwd,action,...}) }`
  - `src/client/workspace.js`: `readCurrentWorkspace(ctx) -> { cwd, title } | null`、`useCurrentWorkspace(ctx)`
  - `src/client/i18n.js`: `registerLocales(ctx)`、`useT(ctx)`（订阅 `ctx.locale` 变化）
  - `src/client/icons.js`: `JargonIcon`（guide 图标）、`HeaderButtonIcon`
- 页签类型：`ctx.sidebarRightTabs.register({ id: '@tom2012/dsh-jargon-list', kind: 'jargon', title: () => t('title'), guide: [{ id:'open', order:45, title, description, icon: JargonIcon }] })`
- 页签体：`ctx.slots.register({ name:'sidebar.right.pane.tab', key:'@tom2012/dsh-jargon-list', locale:'jargonList' }, Panel)`（`sessionId` 由 slot 的 standardProps 提供）
- 头部按钮：`ctx.slots.register({ name:'conversation.session.header.utilities', id:'jargon-open', order:-20, locale:'jargonList' }, OpenAction)`，点击 `ctx.sidebarRight.openTab('jargon')`

- [ ] **Step 1: 写失败测试** `test/client-api.test.js`：stub `fetch` 断言 `state` 打到 `/-/jargon/state?...`、`mutate` 是 POST JSON、非 2xx 时抛出带 `code` 的错误、`AbortSignal` 透传。
- [ ] **Step 2: 跑测试确认失败**。
- [ ] **Step 3: 实现 api/workspace/i18n/icons/index**；`workspace.js` 用 `ctx.sessions.list` 快照取 `byId[sessionId].cwd`（sessionId 优先用 slot props，其次 `uiSession.current`），拿不到返回 `null`。
- [ ] **Step 4: 跑测试确认通过**。
- [ ] **Step 5: 提交**：`git commit -m "feat(client): tab type, header entry, locale and data layer"`。

### Task 6: 面板 UI 与样式

**Files:**
- Create: `src/client/panel.js`, `src/client/styles.js`
- Test: `test/client-panel.test.js`（纯函数：过滤、截断判定、错误码→文案映射）

**Interfaces:**
- Consumes: Task 5 的 api/workspace/i18n/icons
- Produces:
  - `Panel({ sessionId, ctx })` 渲染工具条 + 列表 + 编辑态 + 空态/错误态
  - `filterTerms(terms, query)`、`shouldCollapse(definition)`、`errorText(code, message, file, t)` 导出以便单测
  - `installStyles()`

- [ ] **Step 1: 写失败测试** `test/client-panel.test.js`：`filterTerms`（大小写/说明命中/空查询）、`shouldCollapse`（>3 行或 >120 字为 true）、`errorText` 覆盖契约 §4 全部 code、`isStaleResponse({ current, response })`（会话不同或请求序号更旧为 true）。
- [ ] **Step 2: 跑测试确认失败**。
- [ ] **Step 3: 实现 `panel.js`**：挂载即拉取；页签 `tabInfo.visible` 为真且 `document.visibilityState==='visible'` 时每 2000ms 轮询；`AbortController` 随卸载/切换中止；每次请求带单调递增序号，回包用 `isStaleResponse` 丢弃过期响应（切会话后旧响应不得覆盖新列表）；保存/删除用响应回填；编辑态 `Esc` 取消、`Cmd/Ctrl+Enter` 保存；删除按钮两次点击确认（3 秒后复位）。
- [ ] **Step 4: 实现 `styles.js`**：`jargon-` 前缀，令牌只用 `--dsw-alias-*` / `--dsw-radius-*` / `--dsw-font-family`，hover 用 `bg-layer-2`，错误用 `state-error-primary`，不加动画。
- [ ] **Step 5: 跑测试确认通过 + `node --check client/bundle.js`**（先 `node tools/build.mjs`）。
- [ ] **Step 6: 提交**：`git commit -m "feat(client): jargon panel with search, inline edit and delete"`。

### Task 7: 集成、安装与活体验证

**Files:**
- Create: `docs/verification.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: 全部

- [ ] **Step 1: 全量验证**：`npm run verify`（build + check + node --test）；记录测试条数与产物大小。
- [ ] **Step 2: 安装**：`plugin_manager install_bundle`，`target=/Users/tom/Projects/ask/dsh-jargon-list`；读 `application` / `warnings`。
- [ ] **Step 3: 活体检查（无浏览器控制）**：
  - `cordis_inspect_query Slots.listSubTree root='sidebar.right.pane.tab'` → occupants 出现 `@tom2012/dsh-jargon-list`
  - `cordis_inspect_query Config.listConfigs name='@tom2012/dsh-jargon-list'` → 行已挂载
  - `curl -io /dev/null -w '%{http_code}' https://dsh.zhbc.bid:3003/-/jargon/state` → 期望 401/403（安装前 404）
- [ ] **Step 4: 端到端 agent 验证**：派一个子 agent 调 `jargon_save` 写一条 → 检查 `.dsh/jargon.json` 内容 → 用 `jargon_list` 读回 → 用 `jargon_delete` 删除并确认文件回到空表（清理测试残留）。
- [ ] **Step 5: 写 `docs/verification.md`**：记录命令、输出、通过项、**未验证项（真实浏览器内的深浅色/截断/编辑态需用户确认）**。
- [ ] **Step 6: 提交**：`git commit -m "docs: verification record for v0.1.0"` 并报告用户。
