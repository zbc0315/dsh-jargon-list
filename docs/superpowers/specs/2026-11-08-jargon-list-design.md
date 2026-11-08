# 黑话单（Jargon List）— 设计说明

一个 DSH Web 插件：把 agent 在任务中临时起的工作代号（黑话）记下来，人可以在插件里看懂，agent 下次可以查回来。
右侧边栏是一个「黑话单」页签，人和 agent 都能增删改查，数据跟着项目走。

## 1. 意图与原因

Agent 做研究或执行任务时，经常给一段复杂流程起个短名（“三件套”“跑一轮”“归档链”），
这些名字只在本次项目里有意义，不是通用术语。当前的问题：

- 用户看到 agent 说“按三件套来”时不知道它指什么；
- agent 换一轮对话后自己也忘了这个代号当初指什么，于是重复解释或前后不一致。

所以需要一个**项目内的黑话词典**：黑话 → 详细具体内容，可被用户读、被 agent 写和查。

## 2. 目标 / 非目标 / 反目标

### 目标

1. 右侧边栏有一个「黑话单」页签，列出当前项目的全部黑话及其详细说明。
2. 用户可在界面上新增、编辑、删除、搜索；agent 有对应的工具做同样的事。
3. 数据按项目隔离：切换会话/项目时看到不同的黑话单；不污染其他项目。
4. 数据落在工作区文件里（`.dsh/jargon.json`），可读、可 diff、可随仓库提交。
5. 界面风格与 DSH 一致：只用主题令牌、跟随深浅色、文案走 locale。

### 非目标（本次不做）

- 不做全局（跨项目）黑话表。
- 不做自动注入到 agent 系统提示（用户选择：agent 按需用工具查）。
- 不做别名/同义词、标签、来源文件、示例字段（用户选择：只要「简称 + 详细说明」）。
- 不做 Markdown 渲染（详细说明按纯文本展示，保留换行）。
- 不做跨进程并发写锁、不做撤销历史、不做 git 集成。

### 反目标（做了就算失败）

- 打开界面就悄悄在工作区创建文件；读操作必须无副作用。
- 文件损坏时用空表覆盖用户数据。
- 让界面的失败不可见（静默吞错、假装保存成功）。
- 为了 UI 引 `@deepseek-ai/dsh-client-ui-primitives` 等 Client 包，或用字面色值代替主题令牌。

## 3. 约束（来自当前安装的 DSH 0.2.1-rc.5）

- **右侧边栏是可扩展的官方席位**：`ctx.sidebarRightTabs.register({ id, kind, title, guide })` 声明页签类型，
  `ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id, inject: (sessionId) => props })` 提供页签内容，
  `ctx.sidebarRight.openTab(kind)` 打开它。已通过 `cordis_inspect_query`（Slots）确认。
- **Host 端有 `ctx.webServer.register()` 与 `ctx.connection.requestRejection()`**，可注册受浏览器鉴权保护的
  同源 HTTP 路由。
- **没有 `@deepseek-ai/dsh-typert-generator`**，无法为自定义 `@Remote` 方法生成 Typert 描述文件，
  所以官方 typed Remote 通道本次不可用。
- Client 侧只能依赖浏览器模块表里的 `react` / `react-dom` / `react/jsx-runtime`，不能 import 任何 Harness Client 包。
- Host 侧不 import dsh 内部包（避免解析风险）：工具用原生 `ctx.tools.register({ name, description,
  parameters, output: { schema, render }, execute })` 直接注册，参数走「属性表 + required 提升」的编译函数。
- **本机已有同构先例，直接沿用其形态**：`@tom2012/dsh-notes`（同作者，已安装于 profile `web`）就是
  「同源路由 `/-/notes/*` + 同一份 Store 同时喂 UI 与 agent 工具 + 右侧栏页签」。本插件照它的骨架做，
  路由前缀取 `/-/jargon`，样式与交互沿用它的视觉约定（`n-` 前缀换成 `jargon-`），保证和用户已有插件观感一致。

## 4. 备选方案与取舍

### 方案 A（选定）：Host 持有数据 + 插件自有 HTTP JSON 路由 + 客户端轮询

Host 插件是唯一数据源：读写 `.dsh/jargon.json`，同时把操作暴露给两个调用方——
agent 工具（进程内直接调用）与浏览器（`GET/POST /__jargon/*`，带浏览器鉴权）。客户端在页签可见时轮询状态。

- 优点：当前安装即可实现，不需要代码生成；Host 与 UI 共用同一份操作实现（一次实现两个调用方）；
  可以用纯函数单测覆盖校验、原子写、错误分支；路由受 `ctx.connection.requestRejection` 保护。
- 代价：自己维护一条小 HTTP 面（约 80 行）；轮询有约 2 秒延迟、每次一个轻请求。

### 方案 B：官方 Typert `@Remote` 通道

Host service 上标 `@Remote`，生成 `typert.host.js` / `typert.remote-client.js`，客户端 `ctx.remote.jargon.*`。

- 淘汰原因：生成器 `@deepseek-ai/dsh-typert-generator` 不在本安装内，手写 90KB 生成物不可维护；
  且生成物标记 “do not edit”。装上 ralph 之外的一整条构建链代价远超收益。

### 方案 C：纯客户端 + localStorage

- 淘汰原因：agent 看不到浏览器存储，做不到“agent 也能查/写”，直接违背核心目标。

### 方案 D：黑话写成 `JARGON.md`，客户端读工作区文件

- 淘汰原因：Client 侧只有 `workspaceFiles.read` 能力，没有写通道，界面无法编辑；
  且 Markdown 表格解析对 agent 误改更脆弱。

**选 A。** 数据、校验、错误语义只实现一次，两个调用方都走它。

## 5. 设计

### 5.1 包与仓库布局

新目录 `dsh-jargon-list/`（与 `dsh-pomodoro-overlay/` 并列），包名 `@tom2012/dsh-jargon-list`，`private: true`。
骨架直接照 `@tom2012/dsh-notes`：Host 为普通 CJS（`require`），Client 为 JSX 源码经 esbuild 打成
`client/bundle.js`（`window.__ModuleLoader__.load` 包装）。

```
dsh-jargon-list/
├── package.json          # main/exports、dsh.bundle.patch、dsh.client（platform web）
├── cordis.patch.yml      # insert 一行 jargon-list
├── icon.svg              # 自有图标：词条/书签
├── locale/
│   ├── en.json           # meta.title / meta.description（插件管理页）
│   └── zh.json
├── src/
│   ├── host/
│   │   ├── index.js      # 入口：组装 store、注册路由与工具
│   │   ├── store.js      # 纯逻辑：读/校验/增删改/原子写/错误码
│   │   ├── routes.js     # /-/jargon/* 同源路由 + 鉴权栅栏
│   │   └── tools.js      # jargon_list / jargon_save / jargon_delete
│   └── client/
│       ├── index.js      # apply：注册页签类型、页签体、头部按钮、locale
│       ├── panel.js      # 面板 UI（列表/搜索/编辑态/空态/错误态）
│       ├── api.js        # fetch 封装
│       ├── workspace.js  # sessionId → { cwd, title }
│       ├── i18n.js       # ctx.locale 字典与 t()
│       ├── icons.js      # 内联 SVG 图标
│       └── styles.js     # CSS 字符串 + installStyles()
├── client/bundle.js      # 构建产物（提交进仓库）
├── tools/
│   ├── build.mjs         # esbuild 打包（follow dsh-notes/tools/build.mjs）
│   └── check-package.mjs # 清单/产物一致性断言
└── test/                 # node --test：store / routes / 纯函数
```

构建需要 `esbuild`（`devDependencies`，`npm i` 可用：本机 registry 可达）。React 只在构建期用于
JSX 转换与本地测试，产物里标记 external，运行时从宿主模块表取。

### 5.2 数据文件

路径：`<工作区>/.dsh/jargon.json`（`<工作区>` = 当前会话的工作目录，来自 `ctx.workingDirectory.get(session)`）。

```json
{
  "version": 1,
  "terms": [
    {
      "id": "9f2c1d7a4b6e8c05",
      "term": "三件套",
      "definition": "研究前置三步：先查既有实现（grep/glob），再读相关文档，最后跑一次现状测试。",
      "createdAt": "2026-11-08T08:12:00.000Z",
      "updatedAt": "2026-11-08T08:12:00.000Z",
      "updatedBy": "agent"
    }
  ]
}
```

规则：

- `id`：Host 生成的 16 位 hex，稳定；改名不改 id。
- `term`：trim 后 1–80 字符，同一文件内**大小写不敏感唯一**（保留原写法）。重复视为冲突，不静默合并。
- `definition`：trim 后 1–4000 字符；保留内部换行。
- `updatedBy`：`"user" | "agent"`，仅作展示与追溯。
- 缺文件 = 空表（读不创建）。父目录 `.dsh/` 只在首次写入时创建。
- 文件损坏（JSON 解析失败 / 结构不符）：读返回 `corrupt` 错误（带绝对路径），**写操作一律拒绝**，
  避免覆盖用户数据；界面显示错误条与路径，由用户决定修或删。
- 写入：`写临时文件 → rename` 原子替换；同一文件内的读改写由进程内串行队列串行化（跨进程不保证，写进 README 局限）。

### 5.3 Host：一次实现，两个调用方

`src/host/store.js` 是纯模块（注入 `fs` 与 `now`，便于测试），导出：

```
list(cwd)                       -> { terms, revision }
save(cwd, { id?, term, definition, by }) -> { terms, revision, entry }
remove(cwd, { id? | term })     -> { terms, revision }
```

`revision` 用文件内容的短哈希（内容变则变），供客户端做变更检测。

错误统一为 `{ code, message }`，code 取值：
`no-workspace | corrupt | invalid-term | duplicate-term | term-too-long | definition-too-long | not-found | io-error`。

工作区怎么定：

- **客户端**用 `ctx.sessions.list` 快照把 `sessionId` 解析成 `cwd`（`dsh-notes/src/client/workspace.js` 的同一套办法），
  调 API 时带上 `session` 与 `cwd` 两个参数。
- **Host** 校验：`cwd` 必须是绝对路径、存在的目录，且命中 `ctx.workspaceRegistry.list()` 里的某个工作区 path
  （或命中某活跃会话的 cwd）；否则 `no-workspace`。这样 UI 不可能借这个接口往任意路径写文件。
- 二者都没有时面板显示「当前会话无工作区」错误态，不崩溃。

### 5.4 Host：HTTP 路由（浏览器侧）

`ctx.webServer.register({ kind: 'prefix', path: '/-/jargon', handler })`，形态照 `dsh-notes/src/host/routes.js`：
先过 `ctx.connection.requestRejection(req)`（栅栏自身抛错回 503），再进业务。

- `GET  /-/jargon/state?session=<id>&cwd=<path>` → `200 {ok:true, cwd, file, revision, terms}`
- `POST /-/jargon/mutate` body `{ session, cwd, action: 'save'|'delete', ... }` → `200 {ok:true, terms, revision, entry?}`
- 非 `GET/POST` → 405；body > 64 KiB → 413；栅栏拒绝 → 401/403；
  业务错误 → 4xx/5xx + `{ok:false, error:{code,message}}`。不返回 HTML、不重定向。
- 路由只为 UI 存在；agent 工具直接调 store，不经过 HTTP。

### 5.5 Host：agent 工具

三个工具，原生 `ctx.tools.register` 注册（不 import dsh 内部包），参数用「属性表 + required 提升」的
`compileParameters()` 编译成 JSON Schema，`output.schema` 为 `{type:'object', additionalProperties:true}`、
`render` 回一段文本。每个工具都从 `exec.agent.session`（无则用客户端传入的 cwd 的同一解析逻辑）定位工作区，
拿不到时返回明确的工具错误而非抛异常。

| 工具 | 参数 | 行为 |
| --- | --- | --- |
| `jargon_list` | `{}` | 返回全部条目（term、definition、updatedAt），按更新时间倒序 |
| `jargon_save` | `{ term, definition }` | 按 term upsert：不存在则新增，存在则更新说明；`updatedBy: 'agent'` |
| `jargon_delete` | `{ term }` | 删除；不存在返回 `not-found` 明确错误 |

描述要点（模型可见）：这些是**本项目内的临时简称**，当你在任务中给一段流程起了短名、
或用户用了你不熟悉的代号时，用 `jargon_save` 记下「简称 + 具体指什么」；需要解释时先 `jargon_list`。
工具结果里回传 `term/total` 便于确认。工具注册失败/存储损坏时返回 `isError` 风格的工具错误，不抛异常。

### 5.6 Client：入口与页签

- locale namespace `jargonList`，注册 zh / en 两套字典（含 `meta.title`、`meta.description`）。
- 页签类型：`ctx.sidebarRightTabs.register({ id: '@tom2012/dsh-jargon-list', kind: 'jargon',
  priority: 'extension', title: () => t('title'), guide: [{ id: 'open', order: 45,
  title: () => t('title'), description: () => t('guideDescription'), icon: JargonIcon }] })`。
- 页签体：`ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id, locale: 'jargonList',
  inject: (sessionId) => ({ sessionId }) }, JargonPanel)`。
- 头部快捷入口：在 `conversation.session.header.utilities` 放一个紧凑图标按钮，点击
  `ctx.sidebarRight.openTab('jargon')`；有会话才渲染，样式对齐宿主图标按钮（hover 用 `--dsw-alias-interactive-bg-hover`）。
- 不声明 resource patterns（纯页签类型），不打开自动浮层。

### 5.7 Client：面板交互

结构（自上而下）：

1. 工具条：搜索框（占位「搜索黑话或说明」）+「＋ 新增」按钮。
2. 列表：每条一张行卡片
   - 上：黑话（600 字重）；右：悬停出现「编辑 / 删除」文字按钮
   - 中：详细说明（`white-space: pre-wrap`，默认 3 行截断，可展开）
   - 下：`agent 记于 11-08 15:20` 之类的小字元信息
3. 编辑态：就地展开表单（黑话输入框 + 说明 textarea + 保存/取消），`Cmd/Ctrl+Enter` 保存、`Esc` 取消，
   下方显示服务端返回的错误文案（例如「已有同名黑话」）。
4. 空态：`还没有黑话。点右上角「新增」，或让 agent 用 jargon_save 记一条。`
5. 错误态（读失败/文件损坏）：红色描边提示条 + 文件路径 + 「重试」。

数据流：挂载时 `GET state`；页签可见时每 2 秒轮询一次，`document.visibilitychange` 回前台立即拉一次；
本地写操作直接用响应体回填（不必等下轮轮询）；请求带 `AbortController`，卸载即中止。
搜索是纯客户端过滤（term + definition 子串，大小写不敏感）。

样式：全部使用 `--dsw-alias-*` 令牌（文字/次要文字/边框/悬停底/危险色/圆角/间距），类名前缀 `jargon-`；
组件内联 `<style>` 作为 React 元素渲染，卸载即移除；不写 `document` 级样式、不接管焦点管理。
深浅色由令牌保证，不写死颜色。

### 5.8 插件元信息

- `package.json`：`dsh.bundle.patch`、`dsh.client = { platform: 'web', immediately: true,
  inject: ['@deepseek-ai/dsh-client-ui-sidebar-right', '@deepseek-ai/dsh-client-locale'] }`、
  `exports` 含 `.`、`./client`、`./locale/*.json`、`./icon`。
- `cordis.patch.yml`：`- insert: [{ id: jargon-list, name: '@tom2012/dsh-jargon-list' }]`。
- `locale/{en,zh}.json` 提供 `meta.title = 黑话单 / Jargon List` 与能力描述。
- `icon.svg`：自绘词条/书签图形，currentColor，不含位图。

## 6. 验证方式

1. 静态：`node --check` 覆盖 `index.js`、`client/client.js`、`src/**/*.js`；`tests/` 用 `node --test` 全绿
   （store 的增删改/去重/原子写/损坏保护/超长校验；http 处理函数的 405/413/401/400/200 分支）。
2. 安装：`plugin_manager install_bundle`（本地目录），读返回的 `application` 与 `warnings`；
   若要求重启则如实报告。
3. 活体验证（无浏览器控制时）：
   - `cordis_inspect_query Slots.listSubTree root='sidebar.right.pane.tab'`：出现我们的 key；
   - `cordis_inspect_query Config.listConfigs name='@tom2012/dsh-jargon-list'`：行已挂载；
   - `curl -i https://dsh.zhbc.bid:3003/-/jargon/state`：未带浏览器 cookie 时应为 401/403，
     证明路由已挂载且鉴权生效（返回值记录下来）；安装前同一路径应为 404；
   - 通过一个子 agent 调 `jargon_save` 写一条，检查 `.dsh/jargon.json` 内容正确；再用 `jargon_list` 读回。
4. 视觉：**声明限制**。无浏览器控制时不假装看过界面；由用户在页面上确认深浅色、截断、编辑态。

## 7. 留给实现者决定的部分

- 具体文案（中英文措辞）、行距与间距数值、图标形状。
- store 内部队列的实现形态（单 Promise 链即可）。
- 轮询间隔常量与是否在 `prefers-reduced-motion` 下调整过渡（默认不加动效）。
- 测试用例数量与文件拆分粒度。

## 8. 风险

| 风险 | 处理 |
| --- | --- |
| 插件 client 的 slot 注册 API 细节与文档略有出入 | 实现时以 `dsh-client-ui-sidebar-terminal` 的实际调用为模板，装完用 `Slots.listSubTree` 复核 |
| 自定义 HTTP 路由被浏览器鉴权挡住 | 统一走 `ctx.connection.requestRejection`；失败时前端显示错误条，并保留“轮询失败重试” |
| 会话不在内存（归档会话）导致拿不到工作区 | 该页签显示「当前会话无工作区」错误态，不崩溃 |
| agent 在无会话上下文调用工具 | 工具返回明确错误文案，不静默丢弃 |
| 同一工作区被两个 DSH 实例同时写 | 明确写入 README 局限：进程内串行，跨进程不做锁 |

## 9. 评审问答（builder-check 结论，已定为决策）

**D1 黑话单锚定哪个目录？** 锚定**会话 header 里的原始项目目录**（不可变），不跟随 agent 的 `cd`。

`ctx.workingDirectory.get(session)` 是「有效目录」，agent 用 `working_directory` 工具 `cd` 会改它；
若跟着它走，agent 一次 `cd` 就让黑话单看起来空了，UI 与工具也可能各自指向不同文件。
因此：客户端从 `ctx.sessions.list` 的会话摘要取 `cwd`（= header 的原始项目），Host 侧回退用
`ctx.sessions.get(session)?.header?.cwd`。会话内 `cd` 不影响黑话单。

**D2 并发写怎么办？** 文件级 read-modify-write 全部在 per-cwd 串行队列里完成，
所以「用户和 agent 同时新增不同词条」不会互相丢；**同一词条的并发编辑是 last-write-wins**。
v1 不加 `expectedRevision` 冲突提示，但 README 与 `docs/verification.md` 明确写出这条语义；
界面每次写操作后用响应回填，并在下一次轮询比对 `revision`，外部改动 2 秒内可见。

**D3 冷会话（没有活 agent）能用吗？** 能。解析链路完全不依赖 `ctx.agents.get`：
客户端给 `cwd`，Host 用「已知工作区 path ∪ 会话 header cwd」校验。只有两者都拿不到时才
返回 `no-workspace`（例如会话刚被删除）。

**D4 客户端打包。** 插件客户端是单个 classic script，`require` 只解析模块表、不解析相对路径，
多文件源码不能直接在浏览器里互相 import —— 因此**用 esbuild 打成单文件 `client/bundle.js`**
（同 `dsh-notes` / `dsh-pomodoro-overlay`），源码保持 `src/client/*` 多文件，视图纯函数仍可被
`node --test` 直接 import 测试。

**D5 页签体注册形状。** 照 `dsh-client-ui-sidebar-terminal` 的 body 注册逐字复制：
`{ name:'sidebar.right.pane.tab', key:<id>, locale, inject:(sessionId)=>({ sessionId }) }`，
不裁剪框架需要的字段；面板只读 `sessionId` 与标准 props。
