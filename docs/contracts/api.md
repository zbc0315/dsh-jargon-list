# 黑话单 — 接口契约（Host ⇄ Client）

这份文件是 Host 与 Client 两侧并行实现的唯一接口约定。两侧都按此实现，不要各自另创字段名。

## 1. 数据文件

路径：`<工作区>/.dsh/jargon.json`

```json
{
  "version": 1,
  "terms": [
    {
      "id": "9f2c1d7a4b6e8c05",
      "term": "三件套",
      "definition": "研究前置三步：……",
      "createdAt": "2026-11-08T08:12:00.000Z",
      "updatedAt": "2026-11-08T08:12:00.000Z",
      "updatedBy": "agent"
    }
  ]
}
```

- `id`: 16 位小写 hex，Host 生成，稳定。
- `term`: 1–80 字符（trim 后），文件内大小写不敏感唯一。
- `definition`: 1–4000 字符（trim 后），保留内部换行。
- `updatedBy`: `"user" | "agent"`。

## 2. HTTP 路由（Host 注册，Client 调用）

前缀 `/-/jargon`，同源 `fetch`，`credentials: 'same-origin'`，请求与响应都是 JSON。

### GET `/-/jargon/state?session=<sessionId>&cwd=<绝对路径>`

200：

```json
{
  "ok": true,
  "cwd": "/Users/tom/Projects/ask",
  "file": "/Users/tom/Projects/ask/.dsh/jargon.json",
  "revision": "3f9c2a1b",
  "terms": [ /* 条目，按 updatedAt 倒序 */ ]
}
```

### POST `/-/jargon/mutate`

请求体：

```json
{ "session": "<sessionId>", "cwd": "<绝对路径>", "action": "save", "id": "<可选>", "term": "三件套", "definition": "……" }
{ "session": "<sessionId>", "cwd": "<绝对路径>", "action": "delete", "id": "<id>" }
{ "session": "<sessionId>", "cwd": "<绝对路径>", "action": "delete", "term": "三件套" }
```

200（`entry` 只在 save 时出现）：

```json
{ "ok": true, "cwd": "...", "file": "...", "revision": "…", "terms": [ ... ], "entry": { ... } }
```

失败（HTTP 状态 + 体）：

```json
{ "ok": false, "error": { "code": "duplicate-term", "message": "已存在同名黑话：三件套" } }
```

| code | HTTP | 含义 |
| --- | --- | --- |
| `no-workspace` | 409 | cwd 不是已知工作区或不是目录 |
| `no-session` | 404 | 会话不在运行且未给出 cwd |
| `corrupt` | 409 | 数据文件损坏，拒绝写入，message 带文件路径 |
| `invalid-term` | 400 | 空/超长黑话 |
| `duplicate-term` | 409 | 新增时重名 |
| `definition-too-long` | 400 | 说明超长 |
| `not-found` | 404 | 删除/更新目标不存在 |
| `invalid-definition` | 400 | 说明为空 |
| `too-many-terms` | 409 | 单工作区超过 5000 条 |
| `payload-too-large` | 413 | 请求体超过 64 KiB |
| `bad-request` | 400 | JSON 解析失败、action 未知、缺字段 |
| `io-error` | 500 | 磁盘错误 |

其它约定：非 GET/POST → 405；请求体 > 64 KiB → 413；未通过浏览器鉴权 → 401/403（由
`ctx.connection.requestRejection` 决定，handler 不自己写 401 文案）。

## 3. Client 组件契约

### 页签

- 类型 id / slot key：`@tom2012/dsh-jargon-list`
- kind：`jargon`
- 页签体 props（由 `inject(sessionId)` 注入）：`{ sessionId: string }`
- 页签体内部自己取数据（见第 2 节），不要求宿主传数据。

### locale namespace

`jargonList`，键（中英都必须有）：

| key | zh | en |
| --- | --- | --- |
| `title` | 黑话单 | Jargon List |
| `guideDescription` | 本项目里 agent 起的简称与它们的详细含义 | Short names coined in this project and what they mean |
| `open` | 打开黑话单 | Open Jargon List |
| `search` | 搜索黑话或说明 | Search terms or meanings |
| `new` | 新增 | New |
| `save` | 保存 | Save |
| `cancel` | 取消 | Cancel |
| `edit` | 编辑 | Edit |
| `delete` | 删除 | Delete |
| `confirmDelete` | 再点一次删除 | Click again to delete |
| `expand` | 展开 | Expand |
| `collapse` | 收起 | Collapse |
| `emptyTitle` | 还没有黑话 | No jargon yet |
| `emptyHint` | 点右上角「新增」，或让 agent 用 jargon_save 记一条。 | Use New above, or let the agent record one with jargon_save. |
| `loading` | 加载中… | Loading… |
| `retry` | 重试 | Retry |
| `termLabel` | 黑话 | Term |
| `definitionLabel` | 详细说明 | Meaning |
| `termPlaceholder` | 例如：三件套 | e.g. the triple check |
| `definitionPlaceholder` | 它具体指什么：步骤、范围、产出…… | What it actually means: steps, scope, output… |
| `meta.title`（locale/{zh,en}.json） | 黑话单 | Jargon List |
| `meta.description`（locale/{zh,en}.json） | 记录本项目里临时起的简称（黑话）及其详细含义，供人和 agent 查询、增删改。 | Records project-local shorthand names and what they mean, editable by user and agent. |

## 4. 错误码 → 界面文案

界面按 `error.code` 取文案；未知 code 直接显示 `message`。

| code | 文案（zh） |
| --- | --- |
| `no-session` | 当前会话不在运行，黑话单不可用。 |
| `no-workspace` | 当前会话没有工作目录。 |
| `corrupt` | 黑话数据文件损坏，已停止写入：{file} |
| `invalid-term` | 黑话不能为空，且不超过 80 字。 |
| `duplicate-term` | 已存在同名黑话。 |
| `definition-too-long` | 详细说明不能超过 4000 字。 |
| `not-found` | 这条黑话已经被删除。 |
| `invalid-definition` | 详细说明不能为空。 |
| `too-many-terms` | 这个项目的黑话太多了（上限 5000 条）。 |
| `payload-too-large` | 请求内容过大。 |
| 其它 | 直接显示服务端 message。 |

## 5. 非目标（两侧都不要做）

- 不要新增该文件以外的持久化（不写 localStorage 副本作为事实源；允许纯 UI 偏好如展开状态）。
- 不要引入 `@deepseek-ai/dsh-client-ui-primitives` 或任何 Harness Client 包。
- 不要在 Client 侧缓存数据超过一次面板生命周期。
