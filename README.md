# 黑话单 · Jargon List

给 DeepSeek Harness Web 用的持久化插件：把 agent 在任务里临时起的**短名（黑话）**和一个项目内的**详细含义**记在一张表里，人和 agent 共用同一份数据。

- 右侧栏一个「黑话单」页签：搜索、新增、就地编辑、删除。
- agent 侧三个工具：`jargon_list` / `jargon_save` / `jargon_delete`。
- 数据跟着项目走：`<工作区>/.dsh/jargon.json`，可读、可 diff、可随仓库提交。
- 切换会话/项目即切换黑话表；别的项目不受影响。

## 为什么

Agent 做研究或执行任务时，常给一段复杂流程起个短名（“三件套”“跑一轮”）。这类名字只在当前项目里有意义：

- 用户看到 agent 说“按三件套来”时不知道它指什么；
- agent 换一轮对话后自己也忘了当初指什么，于是重复解释、前后不一致。

黑话单让「起名」这个动作顺手落成一条可查的记录。

## 安装

### 从 npm 安装（推荐）

```bash
dsh plugin --profile web add @tom2012/dsh-jargon-list
```

或者让 agent 用 `plugin_manager`（`action: install_bundle`，`target` 传 `@tom2012/dsh-jargon-list`）。
装完刷新 Web 页面即可。

兼容性：`engines.dsh` 声明为 `>=0.2.1-rc.5 <0.3.0-0`，已在 `0.2.1-rc.5` 与 `0.2.2-rc.1` 上实测
（路由、三个工具、右侧栏页签注册、boot graph 下发全部通过）。`0.3.x` 未验证，会被有意挡在外面。

### 本地目录开发

```bash
git clone https://github.com/zbc0315/dsh-jargon-list.git && cd dsh-jargon-list
npm install          # 只为构建 client/bundle.js（esbuild + react）
npm run verify       # build + check + node --test + 清单自检
dsh plugin --profile web add "$PWD"
```

改完 `src/client/**` 后要重跑 `npm run build`（产物 `client/bundle.js` 进仓库，安装时不构建）。

## 打开方式

1. 会话标题栏右侧的「黑话单」图标按钮 → 直接在右侧栏打开页签；
2. 右侧栏的 `+` → 指南卡片 → 「黑话单」。

## 数据格式

```json
{
  "version": 1,
  "terms": [
    {
      "id": "9f2c1d7a4b6e8c05",
      "term": "三件套",
      "definition": "研究前置三步：先查既有实现，再读相关文档，最后跑一次现状测试。",
      "createdAt": "2026-11-08T08:12:00.000Z",
      "updatedAt": "2026-11-08T08:12:00.000Z",
      "updatedBy": "agent"
    }
  ]
}
```

- `term`：trim 后 1–80 字；同一文件内**大小写/全半角不敏感**唯一。
- `definition`：trim 后 1–4000 字，内部换行保留。
- `updatedBy`：`user` | `agent`，只用于展示与追溯。

## 行为与限制（重要）

- **黑话单锚定会话的项目目录**（会话 header 里的原始 `cwd`），不跟随 agent 的 `cd`。
  在会话里 `cd` 到别的目录不会把黑话单“搬走”。
- **写入是原子替换**（临时文件 + rename），同一工作区的读改写串行，所以同时新增不同词条不会互相吞掉。
- **同一词条的并发编辑是 last-write-wins**：UI 与 agent 同时改同一条时，后写的覆盖先写的。
  没有冲突提示（v1 的取舍）；面板每 2 秒轮询 `revision`，外部改动最多 2 秒后可见。
- **文件损坏时不覆盖**：JSON 坏掉或结构不符时，读报错并显示文件路径，任何写操作都会拒绝，
  需要用户自己修或删掉该文件。
- 跨进程并发（同一工作区开两个 DSH 实例同时写）没有锁，只有进程内串行。
- 不做全局黑话表、不做自动注入到系统提示、不做别名/标签/撤销历史。

## 开发

```
src/host/     store（纯逻辑）/ routes（同源 HTTP）/ tools（agent 工具）/ index（装配）
src/client/   index（页签与入口）/ panel / api / workspace / i18n / icons / styles
client/       bundle.js（构建产物，提交进仓库）
tools/        build.mjs（esbuild 打包）/ check-package.mjs（清单自检）
test/         node --test
docs/         设计稿、实施计划、接口契约、验证记录
```

- `npm run build`：`src/client/index.js` → `client/bundle.js`（ModuleLoader 协议）。
- `npm test`：`node --test test/*.test.js`。
- `npm run check`：`node --check` 全部 Host 文件与 bundle。
- `npm run verify`：以上全部 + 清单自检。

设计与决策见 `docs/superpowers/specs/2026-11-08-jargon-list-design.md`，
接口契约见 `docs/contracts/api.md`。

## 许可

MIT。验证记录、设计稿、接口契约都在 `docs/` 里（不随 npm 包发布，仓库里可读）。
