'use strict'

/**
 * @tom2012/dsh-jargon-list — 提示词半（A + B）
 *
 * A. 一段**固定指令**（systemPrompt.section）：告诉模型本项目有黑话单、什么时候写、什么时候查。
 *    只靠工具描述不够——`jargon_save` 是元行为，没有任务驱动，模型不会主动想起它。
 *
 * B. 一段**动态上下文**（systemPrompt.context）：把已有条目按「简称 — 一句话」注入运行时上下文，
 *    让模型能直接看懂并复用。空表时返回空字符串，宿主会把它整条过滤掉（见 system-prompt 的
 *    renderContextSections），所以没用过的项目零开销。
 *
 * 上下文 provider 必须是同步的，而读文件是异步的，所以这里维护一个按工作区缓存的快照：
 *   · 写操作落地后由 store.subscribe 立刻刷新（UI 与 agent 写都覆盖）
 *   · 超过 TTL 后，在下一次求值时后台刷新（应对用户手改 JSON）
 *   · agent 创建时预热一次，保证第一轮就能看到
 */

/** 固定指令的文本（模型可见，英文与内置提示词风格一致）。 */
const INSTRUCTION = [
  'This project has a jargon list (黑话单): project-local short names for procedures, research flows, or repeated operations, recorded with what they concretely mean. It exists because these names are meaningless outside this project and are easy to forget.',
  '- When you coin a short name for a multi-step procedure, a research flow, or a repeated operation, record it right away with `jargon_save` — the name plus the concrete steps, scope, and output it stands for (not a dictionary definition).',
  '- When the user uses a short name you do not recognize, call `jargon_list` before guessing.',
  '- Do not record general terminology every reader would already know, and do not record one-off filenames.',
].join('\n')

/** 上下文快照的头部说明。 */
const CONTEXT_HEADER =
  'Jargon recorded in this project (short name — what it means). Call `jargon_list` for the full text of any entry.'

/** 单个条目在上下文里最多保留多少字符。 */
const PER_ENTRY_CHARS = 160
/** 上下文里最多列多少条。 */
const MAX_ENTRIES = 40
/** 整段上下文最多多少字符（超过就截断并提示用工具查）。 */
const MAX_CHARS = 2400
/** 缓存超过这个时间就在下次求值时后台刷新（应对手改文件）。 */
const STALE_MS = 30_000

/** 把多行说明压成一行。 */
function oneLine(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

/**
 * 把条目渲染成注入用的上下文文本；空表返回 ''（宿主会整条过滤）。
 * @param {Array<{ term: string, definition: string }>} terms
 * @param {{ maxEntries?: number, perEntryChars?: number, maxChars?: number }} [limits]
 * @returns {string}
 */
function renderJargonContext(terms, limits) {
  const list = Array.isArray(terms) ? terms : []
  if (list.length === 0) return ''

  const maxEntries = Math.max(1, (limits && limits.maxEntries) || MAX_ENTRIES)
  const perEntry = Math.max(20, (limits && limits.perEntryChars) || PER_ENTRY_CHARS)
  const maxChars = Math.max(80, (limits && limits.maxChars) || MAX_CHARS)

  const lines = []
  let used = CONTEXT_HEADER.length
  for (const term of list) {
    if (lines.length >= maxEntries) break
    const name = oneLine(term.term)
    if (name === '') continue
    let meaning = oneLine(term.definition)
    if (meaning.length > perEntry) meaning = `${meaning.slice(0, perEntry - 1)}…`
    const line = `- ${name} — ${meaning}`
    if (used + line.length + 1 > maxChars) break
    lines.push(line)
    used += line.length + 1
  }

  if (lines.length === 0) return ''
  const shown = lines.length
  const rest = list.length - shown
  const footer = rest > 0 ? `\n…还有 ${rest} 条未列出，用 \`jargon_list\` 查看全部。` : ''
  return `${CONTEXT_HEADER}\n\n${lines.join('\n')}${footer}`
}

/** 从装配上下文里取当前会话的项目目录（评审决策 D1：header 的原始 cwd）。 */
function cwdOfAssembly(assembly) {
  const session = assembly && assembly.agent && assembly.agent.session
  const cwd = session && session.header && session.header.cwd
  return typeof cwd === 'string' && cwd !== '' ? cwd : undefined
}

/**
 * 按工作区缓存黑话单的上下文文本。
 * @param {{ store: object, warn?: (message: string) => void, now?: () => number, staleMs?: number }} options
 */
function createJargonPrompt(options) {
  const store = options.store
  const warn = options.warn || (() => {})
  const now = options.now || (() => Date.now())
  const staleMs = options.staleMs === undefined ? STALE_MS : options.staleMs

  /** @type {Map<string, { text: string, at: number, terms: any[] }>} */
  const cache = new Map()
  /** @type {Map<string, Promise<void>>} 同一个工作区的刷新去重 */
  const inflight = new Map()

  /**
   * 读一次并更新缓存。
   * @param {string} cwd
   * @returns {Promise<void>}
   */
  function refresh(cwd) {
    const key = String(cwd)
    const running = inflight.get(key)
    if (running) return running
    const task = (async () => {
      try {
        const state = await store.read(key)
        cache.set(key, { text: renderJargonContext(state.terms), at: now(), terms: state.terms })
      } catch (error) {
        // 读失败（文件损坏、目录消失）不注入，也不打断这一轮对话；留给工具与面板报错。
        warn(`提示词缓存读取失败（${key}）：${(error && error.message) || error}`)
        cache.set(key, { text: '', at: now(), terms: [] })
      } finally {
        inflight.delete(key)
      }
    })()
    inflight.set(key, task)
    return task
  }

  /**
   * 装配前调用：缓存缺失或过期就 await 读一次（同一工作区去重，带超时上限）。
   * 这是 B 段真正可靠的时机——上下文 provider 是同步的，只能在装配前把数据备好。
   * @param {string} cwd
   * @param {number} [timeoutMs]
   * @returns {Promise<void>}
   */
  async function ensure(cwd, timeoutMs) {
    const key = String(cwd)
    const entry = cache.get(key)
    if (entry !== undefined && now() - entry.at <= staleMs) return
    const limit = timeoutMs === undefined ? 2000 : timeoutMs
    let timer
    const timeout = new Promise((resolve) => {
      timer = setTimeout(resolve, limit)
      if (timer && typeof timer.unref === 'function') timer.unref()
    })
    try {
      await Promise.race([refresh(key).catch(() => {}), timeout])
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * 同步取缓存文本；过期则后台刷新。
   * @param {string | undefined} cwd
   * @returns {string}
   */
  function text(cwd) {
    if (typeof cwd !== 'string' || cwd === '') return ''
    const entry = cache.get(cwd)
    if (entry === undefined) {
      refresh(cwd)
      return ''
    }
    if (now() - entry.at > staleMs) refresh(cwd)
    return entry.text
  }

  /** 写操作落地后直接更新（不必等下一次读盘）。 */
  function apply(event) {
    if (!event || typeof event.cwd !== 'string') return
    cache.set(event.cwd, { text: renderJargonContext(event.terms), at: now(), terms: event.terms || [] })
  }

  const unsubscribe = typeof store.subscribe === 'function' ? store.subscribe(apply) : () => {}

  return { text, ensure, refresh, apply, cache, dispose: unsubscribe }
}

/**
 * 注册提示词半：固定指令 + 动态上下文。
 *
 * @param {object} ctx Host 上下文（需要 systemPrompt 服务）。
 * @param {object} prompt createJargonPrompt() 的返回值。
 * @param {{ warn?: (message: string) => void, sectionOrder?: number, contextOrder?: number }} [options]
 * @returns {() => void} disposer（交回 ctx.effect）。
 */
function registerPrompt(ctx, prompt, options) {
  const warn = (options && options.warn) || (() => {})
  const scope = ctx && ctx.systemPrompt
  if (!scope || typeof scope.section !== 'function' || typeof scope.context !== 'function') {
    warn('systemPrompt 服务不可用，提示词半未注册')
    return () => {}
  }
  const sectionOrder = (options && options.sectionOrder) || 3050
  const contextOrder = (options && options.contextOrder) || 105

  const disposeSection = scope.section({
    name: 'ui:jargon-list',
    order: sectionOrder,
    interpolate: false,
    text: INSTRUCTION,
  })
  const disposeContext = scope.context({
    name: 'jargon-list',
    order: contextOrder,
    interpolate: false,
    text: (assembly) => {
      try {
        return prompt.text(cwdOfAssembly(assembly))
      } catch {
        // 取值出错就当没有条目：少一段上下文，好过整轮装配失败。
        return ''
      }
    },
  })

  // 瀑布：装配前把该工作区的快照补好。上下文 provider 同步取值，没有这一步就会在
  // 首次装配时读到空缓存（实测：规则段在、条目不在）。
  let disposeWaterfall = () => {}
  if (ctx && typeof ctx.on === 'function' && typeof prompt.ensure === 'function') {
    disposeWaterfall = ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
      // 这里是装配瀑布：这里抛错 = 这一轮直接失败，所以整段兜底。
      try {
        const cwd = cwdOfAssembly(context)
        if (cwd !== undefined) await prompt.ensure(cwd)
      } catch {
        /* 黑话单缺席无所谓，装配必须继续 */
      }
      return next()
    })
  }

  return () => {
    try {
      if (typeof disposeWaterfall === 'function') disposeWaterfall()
    } catch {
      /* 已释放 */
    }
    try {
      disposeContext()
    } catch {
      /* 已释放 */
    }
    try {
      disposeSection()
    } catch {
      /* 已释放 */
    }
  }
}

module.exports = {
  INSTRUCTION,
  CONTEXT_HEADER,
  PER_ENTRY_CHARS,
  MAX_ENTRIES,
  MAX_CHARS,
  STALE_MS,
  renderJargonContext,
  cwdOfAssembly,
  createJargonPrompt,
  registerPrompt,
}
