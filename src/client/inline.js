/**
 * 对话正文黑话高亮的装配层：把「当前会话 → 项目目录 → 词条 → DOM 染色」串起来。
 *
 * 关键约束（见 highlight.js 顶部注释）：
 *   · 只在聊天区的 markdown 正文容器里工作；
 *   · 词条变化时先撤掉旧 span 再重染，避免同一段文字出现嵌套；
 *   · 所有 DOM 操作包 try/catch，失败只是"没有高亮"；
 *   · 只在页面可见时轮询词条，隐藏时停手。
 */

import { api } from './api.js'
import { buildMatcher, decorate, unwrap, textBodies, readSessionId } from './highlight.js'
import { installTermTooltip } from './tooltip.js'
import { readCurrentWorkspace } from './workspace.js'

const DEBOUNCE_MS = 150
const POLL_MS = 5000

function noop() {}

/**
 * @param {object} ctx Client root Context（用来从 sessions 快照取会话的 cwd）。
 * @param {{ doc?: Document, win?: Window, api?: object }} [options]
 * @returns {() => void} disposer
 */
export function installInlineHighlight(ctx, options = {}) {
  const doc = options.doc || (typeof document !== 'undefined' ? document : undefined)
  const win = options.win || (typeof window !== 'undefined' ? window : undefined)
  const client = options.api || api
  if (!doc || !win || !doc.body) return noop

  let matcher = buildMatcher([])
  let cwd
  let sessionId
  let revision
  let disposed = false
  let timer = 0
  let pollTimer = 0
  let polling = false

  const decorator = installTermTooltip({
    doc,
    win,
    lookup: (term) => matcher.definitionFor(term),
  })

  /** 把当前词条刷到所有正文容器上（幂等；已染过的不会再包一层）。 */
  function apply() {
    if (disposed || matcher.isEmpty) return
    for (const body of textBodies(doc)) {
      try {
        decorate(body, matcher, doc)
      } catch {
        /* 单个容器失败不影响其它 */
      }
    }
  }

  /** 词条变了：先撤旧 span，再整体重染。 */
  function applyForced() {
    if (disposed) return
    for (const body of textBodies(doc)) {
      try {
        unwrap(body, doc)
        if (!matcher.isEmpty) decorate(body, matcher, doc)
      } catch {
        /* 忽略 */
      }
    }
  }

  function schedule() {
    if (disposed || matcher.isEmpty) return
    if (timer) return
    timer = win.setTimeout(() => {
      timer = 0
      apply()
    }, DEBOUNCE_MS)
  }

  /** 会话切换 / 词条变化后重建匹配器。 */
  async function refreshTerms() {
    if (disposed) return
    const nextSession = readSessionId(doc)
    const workspace = nextSession ? readCurrentWorkspace(ctx, nextSession) : null
    const nextCwd = workspace && workspace.cwd

    if (nextCwd === undefined) {
      if (!matcher.isEmpty) {
        matcher = buildMatcher([])
        applyForced()
      }
      sessionId = nextSession
      cwd = undefined
      revision = undefined
      return
    }

    const sessionChanged = nextSession !== sessionId || nextCwd !== cwd
    sessionId = nextSession
    cwd = nextCwd

    try {
      const state = await client.state({ cwd: nextCwd })
      if (disposed) return
      if (!sessionChanged && state.revision === revision) return
      revision = state.revision
      matcher = buildMatcher(state.terms)
      applyForced()
    } catch {
      /* 拿不到词条就保持现状，不影响阅读 */
    }
  }

  function poll() {
    if (disposed || polling) return
    if (doc.hidden) return
    polling = true
    refreshTerms()
      .catch(noop)
      .finally(() => {
        polling = false
      })
  }

  // 正文是流式渲染的：只处理新增/变化的节点，自己产生的 span 变更直接忽略。
  let observer
  try {
    observer = new win.MutationObserver((records) => {
      if (disposed || matcher.isEmpty) return
      let touched = false
      for (const record of records) {
        const target = record.target
        if (target && typeof target.closest === 'function' && target.closest('.jargon-hl')) continue
        if (record.type === 'characterData') {
          touched = true
          break
        }
        for (const node of record.addedNodes) {
          if (node.nodeType === 3) {
            touched = true
            break
          }
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('jargon-hl')) continue
            touched = true
            break
          }
        }
        if (touched) break
      }
      if (touched) schedule()
    })
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true })
  } catch {
    observer = undefined
  }

  // 会话区出现（新建/切换会话）时立刻刷一次，不用等轮询。
  const onVisible = () => {
    if (!doc.hidden) poll()
  }
  doc.addEventListener('visibilitychange', onVisible)

  poll()
  pollTimer = win.setInterval(poll, POLL_MS)

  return () => {
    disposed = true
    if (timer) win.clearTimeout(timer)
    if (pollTimer) win.clearInterval(pollTimer)
    timer = 0
    pollTimer = 0
    try {
      observer && observer.disconnect()
    } catch {
      /* 忽略 */
    }
    doc.removeEventListener('visibilitychange', onVisible)
    try {
      decorator()
    } catch {
      /* 忽略 */
    }
    for (const body of textBodies(doc)) {
      try {
        unwrap(body, doc)
      } catch {
        /* 忽略 */
      }
    }
  }
}
