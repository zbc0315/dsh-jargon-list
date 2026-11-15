/**
 * 对话正文里的黑话高亮（纯逻辑 + 极薄的 DOM 层）。
 *
 * 为什么要这一层：DSH 没有"改消息正文渲染"的扩展点（客户端服务/事件里都没有），
 * 所以只能在已渲染的 markdown 正文容器（`[data-text-interaction-source]`）上做后处理：
 * 找到词条 → 包一层 `<span class="jargon-hl">`（蓝色）→ 交给 tooltip 显示解释。
 *
 * 安全边界：
 *   · 只处理 `[data-conversation-region="chat"]` 里的正文容器，工具卡、侧栏、输入框都不碰；
 *   · 跳过 pre/code/a/公式/我们自己的 span，避免把代码和链接弄花；
 *   · 只做"加一层 span"，文本节点内容不变，选中与复制不受影响；
 *   · 全部逻辑包在 try/catch 里，任何异常都只是"没有高亮"，不影响对话。
 */

export const HIGHLIGHT_CLASS = 'jargon-hl'
const TERM_ATTR = 'data-jargon-term'
const CHAT_REGION = '[data-conversation-region="chat"]'
const TEXT_BODY = '[data-text-interaction-source]'
const SKIP_TAGS = new Set([
  'PRE',
  'CODE',
  'KBD',
  'SAMP',
  'VAR',
  'A',
  'TEXTAREA',
  'INPUT',
  'SCRIPT',
  'STYLE',
  'BUTTON',
  'SELECT',
  'OPTION',
  'SVG',
])
const SKIP_SELECTOR = '.katex, .katex-display, .mermaid, [data-jargon-skip]'

/** NFKC + 小写折叠：用于"简称 → 词条"的查表，容忍全半角与大小写差异。 */
export function foldTerm(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLowerCase()
    .trim()
}

/** 纯 ASCII 单词（含 . - _ + # 这类常见技术写法）才做词边界检查，中文按子串匹配。 */
function asciiOnly(text) {
  return /^[A-Za-z0-9_.+#-]+$/.test(text) && /[A-Za-z]/.test(text)
}

const ASCII_WORD = /[A-Za-z0-9_]/

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 由词条建匹配器。
 * @param {Array<{ term: string, definition: string }>} terms
 * @returns {{ isEmpty: boolean, terms: Map<string, object>, match: (text: string) => Array<{ start: number, end: number, term: string, definition: string }>, definitionFor: (text: string) => object | undefined }}
 */
export function buildMatcher(terms) {
  const byFold = new Map()
  const variants = new Set()
  let longest = 0

  for (const entry of Array.isArray(terms) ? terms : []) {
    if (!entry || typeof entry.term !== 'string') continue
    const term = entry.term.trim()
    if (term === '') continue
    const definition = typeof entry.definition === 'string' ? entry.definition : ''
    const fold = foldTerm(term)
    if (!byFold.has(fold)) byFold.set(fold, { term, definition })
    variants.add(term)
    const normalized = term.normalize('NFKC')
    if (normalized !== term) variants.add(normalized)
    longest = Math.max(longest, term.length)
  }

  if (variants.size === 0) {
    return {
      isEmpty: true,
      longest: 0,
      terms: byFold,
      match: () => [],
      definitionFor: () => undefined,
    }
  }

  // 长的放前面：同一位置优先匹配更长的词，避免"黑话"抢走"黑话单"。
  const alternatives = [...variants].sort((a, b) => b.length - a.length).map(escapeRegExp)
  const pattern = new RegExp(alternatives.join('|'), 'gi')

  function definitionFor(text) {
    return byFold.get(foldTerm(text))
  }

  function match(text) {
    if (typeof text !== 'string' || text.length === 0) return []
    const out = []
    pattern.lastIndex = 0
    let found
    while ((found = pattern.exec(text)) !== null) {
      const termText = found[0]
      const start = found.index
      const end = start + termText.length
      if (asciiOnly(termText)) {
        const before = start > 0 ? text[start - 1] : ''
        const after = end < text.length ? text[end] : ''
        if (ASCII_WORD.test(before) || ASCII_WORD.test(after)) continue
      }
      const entry = definitionFor(termText)
      if (entry === undefined) continue
      out.push({ start, end, term: entry.term, definition: entry.definition })
      pattern.lastIndex = end
    }
    return out
  }

  return { isEmpty: false, longest, terms: byFold, match, definitionFor }
}

/** 这个文本节点该不该被处理：跳过代码/链接/公式/我们自己的 span。 */
export function shouldDecorate(node) {
  if (!node || node.nodeType !== 3) return false
  const text = node.nodeValue
  if (typeof text !== 'string' || text.length === 0 || !/\S/.test(text)) return false
  const parent = node.parentElement
  if (!parent) return false
  try {
    if (parent.closest(`.${HIGHLIGHT_CLASS}`)) return false
    if (parent.closest(SKIP_SELECTOR)) return false
  } catch {
    return false
  }
  let el = parent
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return false
    el = el.parentElement
  }
  return true
}

/** 把一个文本节点里的命中包成 span；返回包了几个。 */
function wrapNode(node, matcher, doc) {
  const text = node.nodeValue
  const matches = matcher.match(text)
  if (matches.length === 0) return 0
  const parent = node.parentNode
  if (!parent) return 0

  const fragment = doc.createDocumentFragment()
  let cursor = 0
  for (const hit of matches) {
    if (hit.start > cursor) fragment.appendChild(doc.createTextNode(text.slice(cursor, hit.start)))
    const span = doc.createElement('span')
    span.className = HIGHLIGHT_CLASS
    span.setAttribute(TERM_ATTR, hit.term)
    span.textContent = text.slice(hit.start, hit.end)
    fragment.appendChild(span)
    cursor = hit.end
  }
  if (cursor < text.length) fragment.appendChild(doc.createTextNode(text.slice(cursor)))
  parent.replaceChild(fragment, node)
  return matches.length
}

/**
 * 在 root 子树里染色；已染过的部分会被跳过（span 里的文本不再命中），
 * 所以重复调用是幂等的，也不会因为自己产生的 DOM 变更而无限循环。
 * @returns {number} 新包了几个
 */
export function decorate(root, matcher, doc) {
  if (!root || !matcher || matcher.isEmpty) return 0
  const view = doc || (typeof document !== 'undefined' ? document : undefined)
  if (!view) return 0
  let count = 0
  let walker
  try {
    walker = view.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */)
  } catch {
    return 0
  }
  const targets = []
  while (walker.nextNode()) {
    if (shouldDecorate(walker.currentNode)) targets.push(walker.currentNode)
  }
  for (const node of targets) {
    try {
      count += wrapNode(node, matcher, view)
    } catch {
      /* 单个节点失败不影响其它节点 */
    }
  }
  return count
}

/** 撤掉自己加的所有 span（词条变化时用），把文本还原成裸节点。 */
export function unwrap(root, doc) {
  if (!root) return 0
  const view = doc || (typeof document !== 'undefined' ? document : undefined)
  if (!view || typeof root.querySelectorAll !== 'function') return 0
  const spans = [...root.querySelectorAll(`.${HIGHLIGHT_CLASS}`)]
  for (const span of spans) {
    try {
      const text = view.createTextNode(span.textContent || '')
      span.parentNode.replaceChild(text, span)
    } catch {
      /* 节点已被回收 */
    }
  }
  if (spans.length > 0) {
    try {
      root.normalize()
    } catch {
      /* 忽略 */
    }
  }
  return spans.length
}

/** 当前会话 id：由会话区根节点上的 `data-conversation-session` 提供。 */
export function readSessionId(doc) {
  try {
    const el = doc.querySelector('[data-conversation-session]')
    const value = el && el.getAttribute('data-conversation-session')
    return typeof value === 'string' && value !== '' ? value : undefined
  } catch {
    return undefined
  }
}

/** 所有正文容器（只取聊天区里的）。 */
export function textBodies(doc) {
  try {
    const region = doc.querySelector(CHAT_REGION)
    const scope = region || doc
    return [...scope.querySelectorAll(TEXT_BODY)]
  } catch {
    return []
  }
}

export const HIGHLIGHT_SELECTOR = `.${HIGHLIGHT_CLASS}`
export const HIGHLIGHT_MARK = TERM_ATTR
export const CHAT_REGION_SELECTOR = CHAT_REGION
export const TEXT_BODY_SELECTOR = TEXT_BODY
