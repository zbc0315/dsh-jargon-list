/**
 * 文案：字典 + 订阅。
 *
 * 字典本身注册到宿主的 locale 服务（namespace `jargonList`，见 docs/contracts/api.md §3），
 * 由宿主负责按当前语言解析并支持 `{name}` 占位符插值。这样文案跟宿主的语言切换走，
 * 不需要我们自己读 `document.documentElement.lang`。
 *
 * 但 Client 半要能在没有 locale 服务时也不崩（测试、以及宿主服务形状变化时）：
 * `bindT()` 会退化成用本文件里的字典 + `<html lang>` 自己插值。
 *
 * 语言变化后重渲染：`useT()` 订阅 `locale` 快照（注册与切换都会 bump revision），
 * 强制组件重渲染一次；`t` 本身是稳定函数，每次调用都读当时的快照，所以重渲染即生效。
 */

import { useEffect, useMemo, useState } from 'react'

/** 契约 §3 规定的 locale namespace。 */
export const NS = 'jargonList'

/**
 * 中文文案。
 * 前 20 个键是契约 §3 的必需键；`error*` / `metaBy` 等是界面必需但契约未列名的补充键
 * （契约 §4 只给了错误码对应的 zh 文案，没有给键名，这里补齐以便中英都有）。
 */
export const ZH = {
  title: '黑话单',
  guideDescription: '本项目里 agent 起的简称与它们的详细含义',
  open: '打开黑话单',
  search: '搜索黑话或说明',
  new: '新增',
  save: '保存',
  cancel: '取消',
  edit: '编辑',
  delete: '删除',
  confirmDelete: '再点一次删除',
  expand: '展开',
  collapse: '收起',
  emptyTitle: '还没有黑话',
  emptyHint: '点右上角「新增」，或让 agent 用 jargon_save 记一条。',
  loading: '加载中…',
  retry: '重试',
  termLabel: '黑话',
  definitionLabel: '详细说明',
  termPlaceholder: '例如：三件套',
  definitionPlaceholder: '它具体指什么：步骤、范围、产出……',

  // 契约 §4 的错误文案（键名为本实现补充）
  errorNoSession: '当前会话不在运行，黑话单不可用。',
  errorNoWorkspace: '当前会话没有工作目录。',
  errorCorrupt: '黑话数据文件损坏，已停止写入：{file}',
  errorInvalidTerm: '黑话不能为空，且不超过 80 字。',
  errorDuplicateTerm: '已存在同名黑话。',
  errorDefinitionTooLong: '详细说明不能超过 4000 字。',
  errorNotFound: '这条黑话已经被删除。',
  errorNetwork: '连不上黑话服务，请确认 dsh web 正在运行后重试。',
  errorUnknown: '出错了。',

  // 界面补充文案
  newTermTitle: '新增黑话',
  editTermTitle: '编辑黑话',
  editorHint: '⌘/Ctrl+Enter 保存 · Esc 取消',
  saving: '保存中…',
  noResults: '没有匹配的黑话',
  clearSearch: '清空搜索',
  byAgent: 'agent',
  byUser: '我',
  metaBy: '{who} 记于 {time}',
}

/** 英文文案，与 ZH 一一对应。 */
export const EN = {
  title: 'Jargon List',
  guideDescription: 'Short names coined in this project and what they mean',
  open: 'Open Jargon List',
  search: 'Search terms or meanings',
  new: 'New',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete: 'Click again to delete',
  expand: 'Expand',
  collapse: 'Collapse',
  emptyTitle: 'No jargon yet',
  emptyHint: 'Use New above, or let the agent record one with jargon_save.',
  loading: 'Loading…',
  retry: 'Retry',
  termLabel: 'Term',
  definitionLabel: 'Meaning',
  termPlaceholder: 'e.g. the triple check',
  definitionPlaceholder: 'What it actually means: steps, scope, output…',

  errorNoSession: 'This session is not running, so the Jargon List is unavailable.',
  errorNoWorkspace: 'This session has no working directory.',
  errorCorrupt: 'The jargon data file is corrupt; writing is disabled: {file}',
  errorInvalidTerm: 'A term is required and must be at most 80 characters.',
  errorDuplicateTerm: 'A term with this name already exists.',
  errorDefinitionTooLong: 'The meaning must be at most 4000 characters.',
  errorNotFound: 'That term was already deleted.',
  errorNetwork: 'Cannot reach the jargon service. Make sure dsh web is running, then retry.',
  errorUnknown: 'Something went wrong.',

  newTermTitle: 'New term',
  editTermTitle: 'Edit term',
  editorHint: '⌘/Ctrl+Enter saves · Esc cancels',
  saving: 'Saving…',
  noResults: 'Nothing matched',
  clearSearch: 'Clear search',
  byAgent: 'agent',
  byUser: 'me',
  metaBy: 'recorded by {who} · {time}',
}

/** 宿主 locale 字典里的两套语言。 */
export const DICTS = { zh: ZH, en: EN }

/** 取一个服务；拿不到（或访问抛错）时返回 undefined，绝不抛。 */
function service(ctx, name) {
  try {
    if (ctx && typeof ctx.get === 'function') {
      const found = ctx.get(name)
      if (found !== undefined) return found
    }
  } catch {
    /* 服务不在作用域里就退化 */
  }
  try {
    return ctx ? ctx[name] : undefined
  } catch {
    return undefined
  }
}

/** 当前语言（仅在拿不到宿主 locale 服务时用于退化）。 */
export function currentLang() {
  try {
    const raw = (typeof document !== 'undefined' && document.documentElement.lang) || 'zh-CN'
    return String(raw).toLowerCase().startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'zh'
  }
}

/** 与宿主 `locale.translate` 相同的 `{name}` 插值规则。 */
export function interpolate(template, params) {
  if (typeof template !== 'string') return ''
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
}

/** 本文件字典的翻译函数（退化路径用）。 */
export function localT(lang) {
  const dict = (lang || currentLang()) === 'en' ? EN : ZH
  return (key, params) => {
    const template = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key
    return interpolate(template, params)
  }
}

/**
 * 把字典注册进宿主 locale 服务；返回 disposer（交给 `ctx.effect`）。
 * 宿主缺 locale 服务时静默跳过——此时 `bindT` 会退化到本文件字典。
 */
export function registerLocales(ctx) {
  const locale = service(ctx, 'locale')
  if (!locale || typeof locale.register !== 'function') return () => {}
  return locale.register(NS, DICTS)
}

/**
 * 取一个稳定的翻译函数：优先宿主 `locale.bind(NS)`（支持语言切换、`{name}` 插值），
 * 否则退化成本文件字典 + `<html lang>`。
 */
export function bindT(ctx) {
  const locale = service(ctx, 'locale')
  try {
    if (locale && typeof locale.bind === 'function') return locale.bind(NS)
  } catch {
    /* 退化 */
  }
  return localT()
}

/**
 * React hook：返回 `t`，并在语言（locale 快照）变化后触发一次重渲染。
 * 槽位组件也会从宿主拿到 `t` prop；组件优先用它，但本 hook 始终被调用（hook 顺序稳定）。
 */
export function useT(ctx) {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const locale = service(ctx, 'locale')
    let off
    try {
      if (locale && typeof locale.subscribe === 'function') {
        off = locale.subscribe(() => setRevision((value) => value + 1))
      }
    } catch {
      off = undefined
    }
    return () => {
      if (typeof off !== 'function') return
      try {
        off()
      } catch {
        /* 退订失败不影响卸载 */
      }
    }
  }, [ctx])
  // revision 只用于触发重渲染；t 每次都是当时的快照读取。
  return useMemo(() => bindT(ctx), [ctx, revision])
}
