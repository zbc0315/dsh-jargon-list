'use strict'

/**
 * 提示词半的行为契约（A + B）：
 *   A 固定指令段——必须提到 jargon_save / jargon_list，否则模型不知道该维护它；
 *   B 动态上下文——空表必须渲染成 ''（宿主会整条过滤，零开销），非空要能截断且给出余量提示；
 *   缓存——写操作落地后立刻生效；读失败不注入、不打断对话；过期后台刷新。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const {
  INSTRUCTION,
  renderJargonContext,
  cwdOfAssembly,
  createJargonPrompt,
  registerPrompt,
} = require('../src/host/prompt')

const CWD = '/Users/tom/Projects/ask'

function term(name, definition) {
  return { term: name, definition, id: name, createdAt: '', updatedAt: '', updatedBy: 'user' }
}

test('the instruction tells the model when to write and when to read', () => {
  assert.match(INSTRUCTION, /jargon_save/)
  assert.match(INSTRUCTION, /jargon_list/)
  assert.match(INSTRUCTION, /project/i)
  assert.ok(INSTRUCTION.length > 150 && INSTRUCTION.length < 1200, 'keep the section compact')
})

test('an empty list renders to an empty string (so the host drops the row)', () => {
  assert.equal(renderJargonContext([]), '')
  assert.equal(renderJargonContext(undefined), '')
  assert.equal(renderJargonContext([{ term: '   ', definition: 'x' }]), '')
})

test('entries render as "name — meaning" one line each, with the meaning flattened', () => {
  const text = renderJargonContext([
    term('三件套', '研究前置三步：\n1) 查实现 2) 读文档 3) 跑测试'),
    term('跑一轮', '一次完整回归'),
  ])
  assert.match(text, /- 三件套 — 研究前置三步： 1\) 查实现 2\) 读文档 3\) 跑测试/)
  assert.match(text, /- 跑一轮 — 一次完整回归/)
  assert.equal(text.split('\n').filter((line) => line.startsWith('- ')).length, 2)
  assert.ok(!text.includes('\n1)'), 'newlines inside a meaning must be flattened')
})

test('long meanings are truncated and the overflow is announced', () => {
  const many = Array.from({ length: 60 }, (_, i) => term(`代号${i}`, 'x'.repeat(500)))
  const text = renderJargonContext(many)
  assert.match(text, /…/, 'meaning should be truncated with an ellipsis')
  assert.match(text, /还有 \d+ 条未列出/)
  assert.ok(text.length <= 2400 + 200, 'the injected text stays bounded')
})

test('cwd comes from the session header, and only then', () => {
  assert.equal(cwdOfAssembly({ agent: { session: { header: { cwd: CWD } } } }), CWD)
  assert.equal(cwdOfAssembly({}), undefined)
  assert.equal(cwdOfAssembly({ agent: { session: { header: {} } } }), undefined)
})

function fakeStore(initial) {
  const state = new Map(Object.entries(initial || {}))
  const listeners = new Set()
  return {
    async read(cwd) {
      const terms = state.get(cwd)
      if (terms instanceof Error) throw terms
      return { terms: terms || [], revision: 'r', file: path.join(cwd, '.dsh/jargon.json') }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    notify(cwd, terms) {
      state.set(cwd, terms)
      for (const listener of listeners) listener({ cwd, terms, revision: 'r2', file: 'f' })
    },
    set(cwd, terms) {
      state.set(cwd, terms)
    },
    listeners,
  }
}

test('the cache is empty until refreshed, then serves the rendered text', async () => {
  const store = fakeStore({ [CWD]: [term('三件套', '三步')] })
  const prompt = createJargonPrompt({ store })
  assert.equal(prompt.text(CWD), '', 'unknown workspace renders nothing yet')

  await prompt.refresh(CWD)
  assert.match(prompt.text(CWD), /三件套/)
  prompt.dispose()
})

test('a write updates the cache immediately (no re-read needed)', async () => {
  const store = fakeStore({ [CWD]: [] })
  const prompt = createJargonPrompt({ store })
  await prompt.refresh(CWD)
  assert.equal(prompt.text(CWD), '')

  store.notify(CWD, [term('跑一轮', '一次完整回归')])
  assert.match(prompt.text(CWD), /跑一轮/, 'subscribe must refresh the snapshot')

  store.notify(CWD, [])
  assert.equal(prompt.text(CWD), '', 'clearing the list removes the context again')
  prompt.dispose()
})

test('a stale cache is refreshed in the background on the next read', async () => {
  let clock = 1_000
  const store = fakeStore({ [CWD]: [term('甲', '一')] })
  const prompt = createJargonPrompt({ store, now: () => clock, staleMs: 100 })
  await prompt.refresh(CWD)
  assert.match(prompt.text(CWD), /甲/)

  store.set(CWD, [term('乙', '二')])
  assert.match(prompt.text(CWD), /甲/, 'still serving the old snapshot synchronously')

  clock += 10_000
  prompt.text(CWD) // 触发后台刷新
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.match(prompt.text(CWD), /乙/, 'after the background refresh the new term shows')
  prompt.dispose()
})

test('a broken file degrades to no context instead of throwing', async () => {
  const broken = new Error('corrupt')
  const store = fakeStore({ [CWD]: broken })
  const warnings = []
  const prompt = createJargonPrompt({ store, warn: (message) => warnings.push(message) })
  await prompt.refresh(CWD)
  assert.equal(prompt.text(CWD), '')
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /提示词缓存读取失败/)
  prompt.dispose()
})

test('registerPrompt installs one section and one context', () => {
  const sections = []
  const contexts = []
  const ctx = {
    systemPrompt: {
      section: (definition) => (sections.push(definition), () => {}),
      context: (definition) => (contexts.push(definition), () => {}),
    },
  }
  const prompt = { text: (cwd) => (cwd === CWD ? 'CTX' : '') }
  const dispose = registerPrompt(ctx, prompt)
  assert.equal(typeof dispose, 'function')

  assert.equal(sections.length, 1)
  assert.equal(sections[0].name, 'ui:jargon-list')
  assert.equal(sections[0].interpolate, false)
  assert.ok(Number.isFinite(sections[0].order))

  assert.equal(contexts.length, 1)
  assert.equal(contexts[0].name, 'jargon-list')
  assert.equal(contexts[0].interpolate, false)
  assert.equal(typeof contexts[0].order, 'number')
  assert.equal(contexts[0].text({}), '')
  assert.equal(contexts[0].text({ agent: { session: { header: { cwd: CWD } } } }), 'CTX')
})

test('registerPrompt is a no-op (but still safe) without the prompt service', () => {
  const warnings = []
  const dispose = registerPrompt({}, { text: () => '' }, { warn: (m) => warnings.push(m) })
  assert.equal(typeof dispose, 'function')
  assert.doesNotThrow(() => dispose())
  assert.equal(warnings.length, 1)
})


test('the assembly waterfall never rejects, even when the refresh throws', async () => {
  const listeners = []
  const ctx = {
    on: (event, callback) => (listeners.push([event, callback]), () => {}),
    systemPrompt: {
      section: () => () => {},
      context: () => () => {},
    },
  }
  const prompt = {
    text: () => '',
    ensure: async () => {
      throw new Error('disk on fire')
    },
  }
  registerPrompt(ctx, prompt)
  assert.equal(listeners.length, 1)
  const [event, waterfall] = listeners[0]
  assert.equal(event, 'system-prompt/assemble')

  const next = async () => ({ ok: true })
  // 附件异常不能让装配失败：这一轮最多是少一段上下文，不能整轮报错。
  const result = await waterfall({}, { agent: { session: { header: { cwd: CWD } } } }, next)
  assert.deepEqual(result, { ok: true })
})

test('the waterfall refreshes the snapshot before the (sync) context is read', async () => {
  const order = []
  const cache = { text: '' }
  const ctx = {
    on: (event, callback) => (() => {}), // 不触发，只验证注册
    systemPrompt: { section: () => () => {}, context: () => () => {} },
  }
  let listener
  ctx.on = (event, callback) => {
    listener = callback
    return () => {}
  }
  const prompt = {
    text: () => cache.text,
    ensure: async () => {
      order.push('ensure')
      cache.text = 'CTX'
    },
  }
  registerPrompt(ctx, prompt)
  order.push('assemble-start')
  await listener({}, { agent: { session: { header: { cwd: CWD } } } }, async () => {
    order.push('next')
    return {}
  })
  assert.deepEqual(order, ['assemble-start', 'ensure', 'next'], 'refresh must happen before next()')
})


test('a completely broken prompt layer cannot fail the assembly', async () => {
  let waterfall
  const ctx = {
    on: (_event, callback) => ((waterfall = callback), () => {}),
    systemPrompt: { section: () => () => {}, context: () => () => {} },
  }
  const provider = []
  const prompt = {
    text: () => {
      throw new Error('boom in text')
    },
    ensure: async () => {
      throw new Error('boom in ensure')
    },
  }
  registerPrompt(ctx, prompt)

  // 装配上下文本身坏掉（取 cwd 抛错）
  const hostile = {}
  Object.defineProperty(hostile, 'agent', {
    get() {
      throw new Error('hostile agent getter')
    },
  })
  const result = await waterfall({}, hostile, async () => ({ ok: true }))
  assert.deepEqual(result, { ok: true })
})
