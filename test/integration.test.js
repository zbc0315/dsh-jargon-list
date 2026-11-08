'use strict'

/**
 * 端到端（Host 内）：真实 JargonStore + 真实路由处理函数 + 真实临时工作区。
 * 用来证明 UI 走的那条路与工具走的那条路落到同一个文件、同一套语义。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

const { JargonStore, JARGON_FILE } = require('../src/host/store')
const { handleRequest } = require('../src/host/routes')

async function makeWorkspace() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'jargon-e2e-'))
  return { dir, ctx: { workspaceRegistry: { list: () => [{ path: dir }] }, sessions: { get: () => undefined } } }
}

function call(ctx, store, { method = 'GET', url, body, cwd } = {}) {
  const target = cwd && !url.includes('cwd=')
    ? `${url}${url.includes('?') ? '&' : '?'}cwd=${encodeURIComponent(cwd)}`
    : url
  return handleRequest({
    method,
    url: `http://jargon.invalid${target}`,
    ctx,
    store,
    readBody: async () => body,
  })
}

test('a full add → list → edit → delete round trip stays in one file', async () => {
  const { dir, ctx } = await makeWorkspace()
  const store = new JargonStore()
  const file = path.join(dir, JARGON_FILE)

  const empty = await call(ctx, store, { url: '/-/jargon/state', cwd: dir })
  assert.equal(empty.status, 200)
  assert.deepEqual(empty.body.terms, [])
  assert.equal(empty.body.revision, 'empty')
  await assert.rejects(fsp.stat(file), { code: 'ENOENT' }, 'reading must not create the file')

  const created = await call(ctx, store, {
    method: 'POST',
    url: '/-/jargon/mutate',
    body: { cwd: dir, action: 'save', term: '三件套', definition: '研究前置三步。' },
  })
  assert.equal(created.status, 200)
  assert.equal(created.body.entry.term, '三件套')
  const firstRevision = created.body.revision
  assert.match(await fsp.readFile(file, 'utf8'), /"version": 1/)

  const edited = await call(ctx, store, {
    method: 'POST',
    url: '/-/jargon/mutate',
    body: { cwd: dir, action: 'save', term: '三件套', definition: '研究前置三步：查实现、读文档、跑现状测试。' },
  })
  assert.equal(edited.body.terms.length, 1, 'editing must not duplicate')
  assert.equal(edited.body.entry.id, created.body.entry.id)
  assert.notEqual(edited.body.revision, firstRevision)

  const listed = await call(ctx, store, { url: '/-/jargon/state', cwd: dir })
  assert.equal(listed.body.terms[0].definition, '研究前置三步：查实现、读文档、跑现状测试。')

  const removed = await call(ctx, store, {
    method: 'POST',
    url: '/-/jargon/mutate',
    body: { cwd: dir, action: 'delete', term: '三件套' },
  })
  assert.equal(removed.status, 200)
  assert.deepEqual(removed.body.terms, [])
})

test('the session header cwd is enough on its own (cold session path)', async () => {
  const { dir } = await makeWorkspace()
  const store = new JargonStore()
  const ctx = { workspaceRegistry: { list: () => [] }, sessions: { get: (id) => (id === 's1' ? { header: { cwd: dir } } : undefined) } }

  const saved = await call(ctx, store, {
    method: 'POST',
    url: '/-/jargon/mutate',
    body: { session: 's1', action: 'save', term: '跑一轮', definition: '一次完整回归。' },
  })
  assert.equal(saved.status, 200)
  assert.equal(saved.body.cwd, dir)

  const listed = await call(ctx, store, { url: '/-/jargon/state?session=s1' })
  assert.equal(listed.body.terms.length, 1)
})

test('a corrupt file blocks both the UI path and the tool path', async () => {
  const { dir, ctx } = await makeWorkspace()
  const store = new JargonStore()
  const file = path.join(dir, JARGON_FILE)
  await fsp.mkdir(path.dirname(file), { recursive: true })
  await fsp.writeFile(file, '{oops', 'utf8')

  const read = await call(ctx, store, { url: '/-/jargon/state', cwd: dir })
  assert.equal(read.status, 409)
  assert.equal(read.body.error.code, 'corrupt')
  assert.ok(read.body.error.message.includes(file))

  const write = await call(ctx, store, {
    method: 'POST',
    url: '/-/jargon/mutate',
    body: { cwd: dir, action: 'save', term: 'x', definition: 'y' },
  })
  assert.equal(write.status, 409)
  assert.equal(await fsp.readFile(file, 'utf8'), '{oops', 'the corrupt bytes must survive')
})

test('a workspace the host does not know is refused', async () => {
  const { dir } = await makeWorkspace()
  const outsides = await fsp.mkdtemp(path.join(os.tmpdir(), 'jargon-outside-'))
  const store = new JargonStore()
  const ctx = { workspaceRegistry: { list: () => [{ path: dir }] }, sessions: { get: () => undefined } }
  const response = await call(ctx, store, {
    method: 'POST',
    url: '/-/jargon/mutate',
    body: { cwd: outsides, action: 'save', term: 'x', definition: 'y' },
  })
  assert.equal(response.status, 409)
  assert.equal(response.body.error.code, 'no-workspace')
  await assert.rejects(fsp.stat(path.join(outsides, JARGON_FILE)), { code: 'ENOENT' })
})
