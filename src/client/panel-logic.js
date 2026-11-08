/**
 * 面板的纯逻辑（不含 JSX、不碰 DOM），给 `node --test` 直接 import 单测。
 *
 * panel.js 从这里 re-export，所以界面的唯一实现仍在 panel.js 一侧；
 * 拆出来的原因只有一个：带 JSX 的文件 Node 不能直接解析，纯函数要能被测到。
 */

/** 页签可见时的轮询间隔（设计稿 §5.7）。 */
export const POLL_MS = 2000

/** 删除的二次确认窗口：3 秒内再点一次才真删（设计稿 §5.7）。 */
export const DELETE_CONFIRM_MS = 3000

/** 说明超过 3 行或 120 字就默认折起，可展开。 */
export const COLLAPSE_LINES = 3
export const COLLAPSE_CHARS = 120

/**
 * 客户端搜索过滤：term + definition 子串，大小写不敏感（设计稿 §5.7）。
 * 空查询（或全空白）返回原数组（不复制、不改顺序——服务端按 updatedAt 倒序给）。
 * @param {Array} terms - 黑话条目。
 * @param {string} query - 用户输入。
 * @returns {Array} 命中的条目。
 */
export function filterTerms(terms, query) {
  const list = Array.isArray(terms) ? terms : []
  const needle = String(query === undefined || query === null ? '' : query)
    .trim()
    .toLowerCase()
  if (needle === '') return list
  return list.filter((item) => {
    if (!item) return false
    const term = String(item.term === undefined || item.term === null ? '' : item.term).toLowerCase()
    const definition = String(
      item.definition === undefined || item.definition === null ? '' : item.definition,
    ).toLowerCase()
    return term.includes(needle) || definition.includes(needle)
  })
}

/**
 * 说明是否需要「展开/收起」：超过 3 行，或超过 120 字。
 * @param {string} definition - 详细说明。
 * @returns {boolean}
 */
export function shouldCollapse(definition) {
  const text = String(definition === undefined || definition === null ? '' : definition)
  if (text === '') return false
  if (text.length > COLLAPSE_CHARS) return true
  return text.split(/\r\n|\r|\n/).length > COLLAPSE_LINES
}

/**
 * 错误码 → 界面文案（契约 §4）。未知 code 直接显示服务端 message。
 * @param {string} code - `error.code`。
 * @param {string} message - 服务端 message（可能带文件路径）。
 * @param {string} file - 已知的数据文件绝对路径（`state` 成功时拿到的）。
 * @param {(key: string, params?: object) => string} t - 翻译函数。
 * @returns {string}
 */
export function errorText(code, message, file, t) {
  const translate = typeof t === 'function' ? t : (key) => key
  switch (code) {
    case 'no-session':
      return translate('errorNoSession')
    case 'no-workspace':
      return translate('errorNoWorkspace')
    case 'corrupt':
      return translate('errorCorrupt', { file: file || message || '' })
    case 'invalid-term':
      return translate('errorInvalidTerm')
    case 'duplicate-term':
      return translate('errorDuplicateTerm')
    case 'definition-too-long':
      return translate('errorDefinitionTooLong')
    case 'not-found':
      return translate('errorNotFound')
    case 'network':
      return translate('errorNetwork')
    default:
      return message || translate('errorUnknown')
  }
}

/**
 * 过期响应判定（设计稿评审关注点 4）：会话不同、或请求序号更旧，都该丢弃。
 * @param {{current?: {seq: number, session: string}, response?: {seq: number, session: string}}} input
 * @returns {boolean}
 */
export function isStaleResponse({ current, response } = {}) {
  if (!current || !response) return true
  if (current.session !== response.session) return true
  return typeof response.seq === 'number' && typeof current.seq === 'number'
    ? response.seq < current.seq
    : false
}

/** `updatedAt` → 本地 `MM-DD HH:mm`；解析不了返回空串。 */
export function formatStamp(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 元信息里 `updatedBy` 的展示：只有 agent 与 user 两种。 */
export function byLabel(updatedBy, t) {
  const translate = typeof t === 'function' ? t : (key) => key
  return updatedBy === 'agent' ? translate('byAgent') : translate('byUser')
}
