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
    logger: () => ({ warn() {} }),
  }
  const ctx = {
    ...scope,
    inject(deps, callback) {
      injected.push(deps.join(','))
      const ready = deps.every((dep) => available.includes(dep))
      if (ready) callback(scope)
      return () => {}
    },
    get: (key) => scope[key],
  }
  return { ctx, injected, effects, registered, removed, routes }
}

test('the host entry exports the Cordis plugin shape', () => {
  assert.equal(host.name, 'jargon-list')
  assert.deepEqual(host.inject, [])
  assert.equal(typeof host.apply, 'function')
})

test('both halves activate when their services are present', () => {
  const { ctx, injected, routes, registered, effects } = fakeCtx(['webServer', 'connection', 'tools'])
  host.apply(ctx, {})
  assert.deepEqual(injected.sort(), ['tools', 'webServer,connection'])
  assert.equal(routes.length, 1)
  assert.equal(routes[0].kind, 'prefix')
  assert.equal(routes[0].path, '/-/jargon')
  assert.deepEqual(registered, ['jargon_list', 'jargon_save', 'jargon_delete'])
  assert.ok(effects.some((label) => label === 'jargon-list: routes'))
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
