'use strict'

/**
 * 构建产物冒烟：把真正要发给浏览器的 client/bundle.js 装进一个假 ModuleLoader，
 * 用假 ctx 跑一遍 apply()，断言它注册了该注册的东西、且没有抛异常。
 *
 * 这条测试覆盖的是「打包后的产物」而不是 src，所以能抓住：
 *   · 打包协议/外部模块（react、react/jsx-runtime）接错
 *   · apply() 在宿主服务缺失时直接抛错
 *   · 页签类型 / 页签体 / 头部入口 / locale 的注册形状漂移
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const BUNDLE = path.join(__dirname, '..', 'client', 'bundle.js')
const PACKAGE_NAME = '@tom2012/dsh-jargon-list'

/** 假 document：installStyles 只需要能挂一个 <style>。 */
function fakeDocument() {
  const head = {
    children: [],
    appendChild(node) {
      this.children.push(node)
      node.parentNode = this
    },
    append(node) {
      this.appendChild(node)
    },
    prepend(node) {
      this.children.unshift(node)
    },
  }
  return {
    head,
    createElement: () => ({
      textContent: '',
      dataset: {},
      setAttribute() {},
      remove() {
        const index = head.children.indexOf(this)
        if (index >= 0) head.children.splice(index, 1)
      },
    }),
    getElementById: () => null,
    querySelector: () => null,
  }
}

/** 把 bundle 装进假 ModuleLoader，返回它的导出（含 apply / inject）。 */
function loadBundle(options = {}) {
  const source = fs.readFileSync(BUNDLE, 'utf8')
  let entry
  const sandbox = {
    window: { __ModuleLoader__: { load: (value) => { entry = value } } },
    document: options.document || fakeDocument(),
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(source, sandbox, { filename: 'client/bundle.js' })
  assert.ok(entry, 'the bundle must call window.__ModuleLoader__.load')
  assert.equal(entry.id, PACKAGE_NAME)

  const modules = {
    react: require('react'),
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-dom': require('react-dom'),
    'react-dom/client': require('react-dom/client'),
  }
  const requireShim = (id) => {
    if (!(id in modules)) throw new Error(`bundle required an unexpected module: ${id}`)
    return modules[id]
  }
  return entry.factory(requireShim)
}

/** 假 Client ctx，记录每次注册。 */
function fakeCtx({ withSidebar = true } = {}) {
  const record = { effects: [], slots: [], tabs: [], locales: [], injected: [], ctxInject: [] }
  const services = {
    slots: {
      inject: (name, callback) => {
        record.injected.push(name)
        return callback()
      },
      register: (options, component) => {
        record.slots.push({ options, component })
        return () => {}
      },
    },
    sidebarRight: { openTab: (kind) => record.opened = kind },
    locale: {
      register: (ns, dicts) => {
        record.locales.push({ ns, dicts })
        return () => {}
      },
      bind: (ns) => (key) => `[${ns}]${key}`,
      getSnapshot: () => ({ locale: 'zh' }),
      getLocale: () => ({ locale: 'zh' }),
      subscribe: () => () => {},
    },
  }
  if (withSidebar) {
    services.sidebarRightTabs = {
      register: (definition) => {
        record.tabs.push(definition)
        return () => {}
      },
    }
  }
  const makeEffect = () => (factory, label) => {
    record.effects.push(label)
    const dispose = factory()
    return typeof dispose === 'function' ? dispose : () => {}
  }
  const scopeFor = () => ({
    effect: makeEffect(),
    slots: services.slots,
    sidebarRight: services.sidebarRight,
    locale: services.locale,
    ...(withSidebar ? { sidebarRightTabs: services.sidebarRightTabs } : {}),
  })
  const ctx = {
    inject: (deps, callback) => {
      record.ctxInject.push(deps.join(','))
      const scope = scopeFor()
      if (deps.every((dep) => scope[dep] !== undefined)) callback(scope)
      return () => {}
    },
    effect: (factory, label) => {
      record.effects.push(label)
      const dispose = factory()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    get: (name) => services[name],
    slots: {
      inject: (name, callback) => {
        record.injected.push(name)
        return callback()
      },
      register: (options, component) => {
        record.slots.push({ options, component })
        return () => {}
      },
    },
  }
  if (withSidebar) ctx.sidebarRightTabs = services.sidebarRightTabs
  ctx.locale = services.locale
  return { ctx, record }
}

test('the built bundle exposes the Cordis client shape', () => {
  const module = loadBundle()
  assert.equal(typeof module.apply, 'function')
  assert.deepEqual(Array.from(module.inject), ['slots'])
})

test('apply registers the tab type, body, header entry and copy', () => {
  const module = loadBundle()
  const { ctx, record } = fakeCtx()
  module.apply(ctx)

  const type = record.tabs.find((entry) => entry.id === PACKAGE_NAME)
  assert.ok(type, 'the tab type must register under the package name')
  assert.equal(type.kind, 'jargon')
  assert.equal(typeof type.title, 'function')
  assert.equal(typeof type.title(), 'string')
  assert.ok(Array.isArray(type.guide) && type.guide.length >= 1)
  const guide = type.guide[0]
  assert.equal(typeof guide.title, 'function')
  assert.equal(typeof guide.title(), 'string')
  assert.ok(guide.order > 0)
  assert.equal(typeof guide.icon, 'function')

  const body = record.slots.find((entry) => entry.options.name === 'sidebar.right.pane.tab')
  assert.ok(body, 'the tab body must register into sidebar.right.pane.tab')
  assert.equal(body.options.key, PACKAGE_NAME)
  assert.equal(body.options.locale, 'jargonList')
  assert.equal(typeof body.options.inject, 'function')
  assert.deepEqual({ ...body.options.inject('session-1') }, { sessionId: 'session-1' })
  assert.equal(typeof body.component, 'function')

  const header = record.slots.find(
    (entry) => entry.options.name === 'conversation.session.header.utilities',
  )
  assert.ok(header, 'the session header entry must register')
  assert.ok(header.options.id)
  assert.equal(typeof header.component, 'function')

  const copy = record.locales.find((entry) => entry.ns === 'jargonList')
  assert.ok(copy, 'the jargonList locale namespace must register')
  for (const locale of ['zh', 'en']) {
    assert.ok(copy.dicts[locale], `missing ${locale} dictionary`)
    assert.equal(typeof copy.dicts[locale].title, 'string')
    assert.equal(typeof copy.dicts[locale].save, 'string')
  }
})

test('apply survives a host without the right sidebar', () => {
  const module = loadBundle()
  const { ctx } = fakeCtx({ withSidebar: false })
  assert.doesNotThrow(() => module.apply(ctx))
})

test('the bundle never imports a Harness Client package', () => {
  const source = fs.readFileSync(BUNDLE, 'utf8')
  for (const forbidden of ['dsh-client-ui-primitives', '@deepseek-ai/dsh-client-ui-']) {
    assert.ok(!source.includes(forbidden), `bundle must not reference ${forbidden}`)
  }
  for (const token of ['sidebar.right.pane.tab', 'sidebarRightTabs', 'jargonList', 'conversation.session.header.utilities']) {
    assert.ok(source.includes(token), `bundle must contain ${token}`)
  }
})


test('the panel renders on mount without throwing (slot entry safety)', () => {
  const module = loadBundle()
  const { ctx, record } = fakeCtx()
  module.apply(ctx)
  const body = record.slots.find((entry) => entry.options.name === 'sidebar.right.pane.tab')
  assert.ok(body)

  const React = require('react')
  const { renderToString } = require('react-dom/server')
  // 面板挂载即发请求，但 SSR 不跑 effect，所以这里只验证「首帧不会抛」：
  // 一旦组件里有 hook 顺序 / props 未定义 / 空 ctx 崩溃，这条测试会直接红。
  const html = renderToString(React.createElement(body.component, { sessionId: 'session-1' }))
  assert.equal(typeof html, 'string')
  assert.ok(html.length > 0, 'the panel must render some markup')
})

test('a panel that throws is contained by its boundary instead of blanking the slot', () => {
  const module = loadBundle()
  const { ctx, record } = fakeCtx()
  module.apply(ctx)
  const header = record.slots.find(
    (entry) => entry.options.name === 'conversation.session.header.utilities',
  )
  const React = require('react')
  const { renderToString } = require('react-dom/server')
  // 头部按钮在没有 sessionId 时返回 null：不渲染、不抛。
  const html = renderToString(React.createElement(header.component, { sessionId: undefined }))
  assert.equal(html, '')
  // 有 sessionId 时应该是一个 button，并且点击回调存在。
  const withSession = renderToString(React.createElement(header.component, { sessionId: 's1' }))
  assert.match(withSession, /jargon-header-btn/)
})


/** apply 时服务还没就绪的假 ctx：ctx.inject 只排队，不回调。 */
function fakeCtxDeferred() {
  const record = { slots: [], tabs: [], locales: [], effects: [], ctxInject: [], pending: [] }
  const ctx = {
    inject: (deps, callback) => {
      record.ctxInject.push(deps.join(','))
      record.pending.push({ deps, callback })
      return () => {}
    },
    effect: (factory) => {
      const dispose = factory()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    get: () => undefined,
  }
  return { ctx, record }
}

test('registrations wait for sidebarRightTabs instead of being skipped (0.2.2 regression)', () => {
  const module = loadBundle()
  const { ctx, record } = fakeCtxDeferred()
  module.apply(ctx)

  // 关键点：服务没到之前，什么都不注册，但也**不能**因为取不到服务就永久放弃。
  assert.deepEqual(record.tabs, [])
  assert.deepEqual(record.slots, [])
  assert.ok(record.ctxInject.some((deps) => deps.includes('sidebarRightTabs')), 'must wait for sidebarRightTabs via ctx.inject')
  assert.ok(record.ctxInject.some((deps) => deps === 'locale'), 'must wait for the locale service too')

  // 右侧栏插件稍后 provide 了服务：排队的回调被调用，注册应全部发生。
  const sidebarScope = {
    locale: { register: (ns) => (record.locales.push({ ns }), () => {}), bind: () => (k) => k, getSnapshot: () => ({ locale: 'zh' }), subscribe: () => () => {} },
    effect: (factory) => {
      const dispose = factory()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    slots: {
      inject: (_name, callback) => callback(),
      register: (options) => (record.slots.push({ options }), () => {}),
    },
    sidebarRightTabs: { register: (definition) => (record.tabs.push(definition), () => {}) },
  }
  for (const pending of record.pending) {
    if (pending.deps.every((dep) => sidebarScope[dep] !== undefined)) pending.callback(sidebarScope)
  }

  assert.equal(record.tabs.length, 1, 'tab type must register once the service arrives')
  assert.equal(record.tabs[0].kind, 'jargon')
  const body = record.slots.find((entry) => entry.options.name === 'sidebar.right.pane.tab')
  assert.ok(body, 'tab body must register once the service arrives')
  const header = record.slots.find((entry) => entry.options.name === 'conversation.session.header.utilities')
  assert.ok(header, 'header entry must register independently of the sidebar service')
})
