'use strict'

/**
 * Host 入口的装配契约：导出形状、两半各自等待服务、缺服务时不炸。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const host = require('../src/host/index')
const { JargonStore } = require('../src/host/store')

/** 最小可用的假 ctx：记录 inject 的依赖与 effect。 */
function fakeCtx(available) {
  const injected = []
  const effects = []
  const registered = []
  const removed = []
  const routes = []
  const prompts = { sections: [], contexts: [] }
  const scope = {
    effect(factory, label) {
      effects.push(label)
      const dispose = factory()
      return () => {
        if (typeof dispose === 'function') dispose()
      }
    },
    tools: available.includes('tools')
      ? {
          register(definition) {
            registered.push(definition.name)
            return () => removed.push(definition.name)
          },
        }
      : undefined,
    webServer: available.includes('webServer')
      ? {
          register(route) {
            routes.push(route)
            return () => {
              const index = routes.indexOf(route)
              if (index >= 0) routes.splice(index, 1)
            }
          },
        }
      : undefined,
    connection: available.includes('connection') ? { requestRejection: () => undefined } : undefined,
    systemPrompt: available.includes('systemPrompt')
      ? {
          section(definition) {
            prompts.sections.push(definition)
            return () => {}
          },
          context(definition) {
            prompts.contexts.push(definition)
            return () => {}
          },
        }
      : undefined,
    logger: () => ({ warn() {} }),
  }
  const listeners = []
  const ctx = {
    ...scope,
    on(event, callback) {
      listeners.push([event, callback])
      return () => {}
    },
    inject(deps, callback) {
      injected.push(deps.join(','))
      const ready = deps.every((dep) => available.includes(dep))
      if (ready) callback(scope)
      return () => {}
    },
    get: (key) => scope[key],
  }
  return { ctx, injected, effects, registered, removed, routes, prompts, listeners }
}

test('the host entry exports the Cordis plugin shape', () => {
  assert.equal(host.name, 'jargon-list')
  assert.deepEqual(host.inject, [])
  assert.equal(typeof host.apply, 'function')
})

test('both halves activate when their services are present', async () => {
  const { ctx, injected, routes, registered, effects, prompts, listeners } = fakeCtx([
    'webServer',
    'connection',
    'tools',
    'systemPrompt',
  ])
  host.apply(ctx, {})
  assert.deepEqual(injected.sort(), ['systemPrompt', 'tools', 'webServer,connection'])
  assert.equal(routes.length, 1)
  assert.equal(routes[0].kind, 'prefix')
  assert.equal(routes[0].path, '/-/jargon')
  assert.deepEqual(registered, ['jargon_list', 'jargon_save', 'jargon_delete'])
  assert.ok(effects.some((label) => label === 'jargon-list: routes'))

  // A：固定指令段；B：动态上下文（空表时文本为 ''，宿主会整条过滤）
  assert.equal(prompts.sections.length, 1)
  assert.equal(prompts.sections[0].name, 'ui:jargon-list')
  assert.match(prompts.sections[0].text, /jargon_save/)
  assert.match(prompts.sections[0].text, /jargon_list/)
  assert.equal(prompts.contexts.length, 1)
  assert.equal(prompts.contexts[0].name, 'jargon-list')
  assert.equal(typeof prompts.contexts[0].text, 'function')
  assert.equal(prompts.contexts[0].text({}), '', 'no agent/cwd -> no context')
  assert.ok(effects.some((label) => label === 'jargon-list: prompt'))

  // agent 创建时预热缓存，而且是 await 的（否则首轮装配撞空缓存）
  assert.deepEqual(listeners.map(([event]) => event), ['agent/created'])
  const [, listener] = listeners[0]
  const result = listener({ agent: { session: { header: { cwd: '/tmp/jargon-host-test' } } } })
  assert.equal(typeof result.then, 'function', 'the warm-up listener must be awaited')
  return result
})

test('a host without web/connection still gets the tools', () => {
  const { ctx, routes, registered } = fakeCtx(['tools'])
  assert.doesNotThrow(() => host.apply(ctx, {}))
  assert.equal(routes.length, 0)
  assert.equal(registered.length, 3)
})

test('a host without tools still gets the route', () => {
  const { ctx, routes, registered } = fakeCtx(['webServer', 'connection'])
  assert.doesNotThrow(() => host.apply(ctx, {}))
  assert.equal(routes.length, 1)
  assert.equal(registered.length, 0)
})

test('the store it exposes writes inside the given workspace only', async () => {
  const store = new JargonStore()
  const dir = await require('node:fs/promises').mkdtemp(path.join(require('node:os').tmpdir(), 'jargon-host-'))
  await store.save(dir, { term: '三件套', definition: '三步', by: 'user' })
  const state = await store.read(dir)
  assert.equal(state.file, path.join(dir, '.dsh', 'jargon.json'))
  assert.equal(state.terms[0].term, '三件套')
})


test('apply never throws, whatever the host context looks like', () => {
  const hostile = [
    {},
    { logger() { throw new Error('logger exploded') } },
    {
      logger: () => ({ warn() { throw new Error('warn exploded') } }),
      inject() { throw new Error('inject exploded') },
      effect() {},
    },
    {
      inject(_deps, callback) { callback({}) },
      effect() { throw new Error('effect exploded') },
      logger: () => ({ warn() {} }),
    },
    {
      inject(_deps, callback) { callback({ tools: { register() { throw new Error('register exploded') } }, effect() {} }) },
      effect(factory) { return factory() },
      logger: () => ({ warn() {} }),
    },
  ]
  for (const ctx of hostile) {
    assert.doesNotThrow(() => host.apply(ctx, {}), `apply threw for ${JSON.stringify(Object.keys(ctx))}`)
  }
})
