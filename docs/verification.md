# 验证记录 — 黑话单 v0.1.0

验证时间：2026-11-08
目标环境：DSH `0.2.1-rc.5`，profile `web`，GUI `https://dsh.zhbc.bid:3003/`（不记录认证参数）
安装方式：`plugin_manager` `install_bundle`，本地目录 link：`/Users/tom/Projects/ask/dsh-jargon-list`

## 1. 自动化

`npm run verify`（build + node --check + node --test + 清单自检）通过。

| 项 | 结果 |
| --- | --- |
| `node tools/build.mjs` | `built client/bundle.js (29.2 KB) [minified]` |
| `node --check`（4 个 Host 文件 + bundle） | 通过 |
| `node --test test/*.test.js` | **73 / 73 通过**（store 12、routes 11、tools 8、host 5、integration 4、client-api 13、client-panel 16、client-bundle 4） |
| `node tools/check-package.mjs` | `package manifest, patch, locale, icon and bundle: OK` |

测试覆盖的关键行为（对应设计稿的 Review Focus）：

- 数据文件损坏：读报 `corrupt` 且带绝对路径；写被拒绝；损坏字节原样保留（store + integration 两处）。
- 同时新增不同词条：两个 `save` 并发后两条都在（store）。
- 同一词条再写：就地更新、`id` 不变、不产生重复（store + integration）。
- 伪造/过期目录：不在工作区列表的绝对路径被拒，且不会在该目录建 `.dsh/`（routes + integration）。
- 冷会话：只给会话 id、无活 agent 时仍能靠 `header.cwd` 工作（routes + integration）。
- 极端输入：空/超长 term、空/超长 definition、大小写与全半角重名、`\r\n` 保留（store）。
- 打包产物：真正发给浏览器的 `client/bundle.js` 在假 ModuleLoader 里跑 `apply()`，断言页签名/id/kind/guide、
  slot 注册形状（key/locale/inject）、头部入口、locale 中英键集；并断言宿主缺少右侧栏时不抛错、不引用任何 Harness Client 包。

## 2. 安装结果

`plugin_manager install_bundle` 返回：

```
stage: enable
application: applied
bundle: @tom2012/dsh-jargon-list
version: 0.1.0
warnings: []
```

`/Users/tom/.dsh/profiles/web/package.json`：依赖 `link:/Users/tom/Projects/ask/dsh-jargon-list`，
且已加入 `dsh.profile.bundles`。**无需重启，热更新即生效。**

## 3. 活体验证（无浏览器控制）

| 检查 | 命令/工具 | 结果 |
| --- | --- | --- |
| 路由已挂载且受鉴权保护 | `curl -o /dev/null -w '%{http_code}' https://dsh.zhbc.bid:3003/-/jargon/state` | **401**（安装前同一路径为 404；POST `/-/jargon/mutate` 同样 401） |
| 客户端页签体已注册 | `cordis_inspect_query` → `Slots.listSubTree root='sidebar.right.pane.tab'` | occupants 含 `{"key":"@tom2012/dsh-jargon-list","active":true}` |
| 三个工具对 agent 可见 | `cordis_inspect_query` → `Tool.listTools` | 含 `jargon_list` / `jargon_save` / `jargon_delete` |
| 端到端写入/读回/更新/删除 | 由一个子 agent 实际调用三个工具 | 见下节 |

### 端到端（agent 路径）

子 agent 依次执行：`jargon_list`（空）→ `jargon_save`（新增）→ `jargon_list`（读回）→
`jargon_save`（同一条更新）→ `jargon_delete` → `jargon_list`（回到空）。

子 agent 实跑输出（原文）：

```
1. jargon_list {}            → "jargon_list: 本项目还没有记录任何黑话。"
2. jargon_save 新增           → "jargon_save: 已记录「自检代号」，共 1 条。"
3. jargon_list               → "jargon_list: 本项目 1 条黑话（/Users/tom/Projects/ask/.dsh/jargon.json）
                                 - 自检代号：这是一次端到端自检写入的条目：…"
4. jargon_save 同 term 再写    → "jargon_save: 已更新「自检代号」，共 1 条。"
5. jargon_delete             → "jargon_delete: 已删除「自检代号」，剩 0 条。"
6. jargon_list               → "jargon_list: 本项目还没有记录任何黑话。"
```

结论：新增 → 读回（定义逐字一致）→ 再写为原地更新（总数仍为 1）→ 删除 → 归零，
落点确认为当前会话的 cwd（`/Users/tom/Projects/ask/.dsh/jargon.json`），没有写到别处。

这一步顺带暴露两个小问题，已修：

1. 空列表时模型看不到文件路径 —— `jargon_list` 的 render 现在空表也带路径。
2. `jargon_save` 判「新增还是更新」用的是 `toLowerCase`，与存储层 NFKC 口径不一致，
   全半角重名时会误报 `updated: false` —— 改为复用存储层的 `sameTerm`，并加了回归测试。

注意：模型看到的是 `output.render` 的文本；工具的结构化 `value`（含 `term`/`total`/`updated`/`file`）
只给 UI 与 presenter 用。所以「有没有更新」在文本里靠「已记录 / 已更新」区分，这是刻意选择。

修完 host 代码后，运行中的进程仍是旧模块，因此用 `plugin_manager` 把插件行
（`include:jargon-list`）关掉再打开一次来重载：`application: applied`，随后再让子 agent 调
`jargon_list`，输出已变为 `本项目还没有记录任何黑话（/Users/tom/Projects/ask/.dsh/jargon.json）。`，
确认热重载生效、无需重启整个 dsh web。重载后 `/-/jargon/state` 仍为 401（路由重新挂上且照样受鉴权保护）。

测试后清理：`/Users/tom/Projects/ask/.dsh/jargon.json` 的测试条目已删除；记录最终文件状态。

## 4. 未验证 / 需要用户在真页面确认

无浏览器控制，以下只做到「代码 + SSR 分支渲染 + 逻辑单测」级别，**没有在真实页面点过**：

- 深浅色切换下页签的观感与对比度；
- 说明文字 3 行截断与「展开」；
- 悬停才出现的「编辑 / 删除」；
- `Esc` 取消编辑、`Cmd/Ctrl+Enter` 保存；
- 删除的两次点击确认（3 秒复位）；
- 搜索无结果态与「清除搜索」；
- 轮询在页签隐藏/切会话时的暂停与旧响应丢弃（时序行为只有纯函数测试 + 代码审查）。

请在页面上依次确认：打开页签 → 新增一条 → 编辑 → 搜索 → 删除 → 切到别的会话看是否切换成该项目的列表。
