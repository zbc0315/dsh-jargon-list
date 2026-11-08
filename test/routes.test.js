'use strict'

/**
 * 同源路由的行为契约（设计稿 §5.4，契约 §2）。
 * 这里只测纯函数 handleRequest：不启 HTTP、不碰真实工作区。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

const { handleRequest, resolveCwd, rejectionStatus, STATUS_BY_CODE } = require('../src/host/routes')
const { StoreError } = require('../src/host/store')

const ORIGIN = 'http://jargon.invalid'

async function tmpWorkspace() {
  return fsp.mkdtemp(path.join(os.tmpdir(), 'jargon-routes-'))
}

function makeStore(overrides) {
  return {
    async read(cwd) {
      return { terms: [{ id: 'a1', term: '三件套', definition: '三步', updatedAt: '', createdAt: '', updatedBy: 'user' }], revision: 'rev1', file: path.join(cwd, '.dsh/jargon.json') }
    },
    async save(cwd, input) {
      return { terms: [], revision: 'rev2', entry: { id: 'b2', term: input.term, definition: input.definition, updatedBy: 'user' }, file: path.join(cwd, '.dsh/jargon.json') }
    },
    async remove(cwd) {
      return { terms: [], revision: 'rev3', file: path.join(cwd, '.dsh/jargon.json') }
    },
    ...overrides,
  }
}

function makeRequest({ method = 'GET', url, body = {}, store = makeStore(), cwd, resolveError } = {}) {
  return {
    method,
    url,
    ctx: {},
    store,
    readBody: async () => body,
    resolveCwd: async () => {
      if (resolveError) throw resolveError
      return cwd
    },
  }
}

test('GET state returns the list and the revision', async () => {
  const cwd = await tmpWorkspace()
  const response = await handleRequest(makeRequest({ url: `${ORIGIN}/-/jargon/state?session=s1&cwd=${encodeURIComponent(cwd)}`, cwd }))
  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  assert.equal(response.body.revision, 'rev1')
  assert.equal(response.body.terms.length, 1)
  assert.equal(response.body.cwd, cwd)
})

test('POST mutate saves and returns the entry', async () => {
  const cwd = await tmpWorkspace()
  const response = await handleRequest(
    makeRequest({
      method: 'POST',
      url: `${ORIGIN}/-/jargon/mutate`,
      cwd,
      body: { session: 's1', cwd, action: 'save', term: '跑一轮', definition: '一次完整回归' },
    }),
  )
  assert.equal(response.status, 200)
  assert.equal(response.body.entry.term, '跑一轮')
})

test('POST mutate deletes', async () => {
  const cwd = await tmpWorkspace()
  const response = await handleRequest(
    makeRequest({ method: 'POST', url: `${ORIGIN}/-/jargon/mutate`, cwd, body: { session: 's1', cwd, action: 'delete', term: '三件套' } }),
  )
  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
})

test('unsupported methods and unknown actions are refused', async () => {
  const cwd = await tmpWorkspace()
  const del = await handleRequest(makeRequest({ method: 'DELETE', url: `${ORIGIN}/-/jargon/state`, cwd }))
  assert.equal(del.status, 405)
  assert.equal(del.body.error.code, 'bad-request')

  const unknown = await handleRequest(
    makeRequest({ method: 'POST', url: `${ORIGIN}/-/jargon/mutate`, cwd, body: { session: 's1', cwd, action: 'explode' } }),
  )
  assert.equal(unknown.status, 400)
  assert.equal(unknown.body.error.code, 'bad-request')

  const noAction = await handleRequest(makeRequest({ method: 'POST', url: `${ORIGIN}/-/jargon/mutate`, cwd, body: {} }))
  assert.equal(noAction.status, 400)
})

test('an oversized body is refused with 413', async () => {
  const request = makeRequest({ method: 'POST', url: `${ORIGIN}/-/jargon/mutate`, cwd: '/tmp' })
  request.readBody = async () => {
    throw new StoreError('payload-too-large', '请求体过大。')
  }
  const response = await handleRequest(request)
  assert.equal(response.status, 413)
  assert.equal(response.body.error.code, 'payload-too-large')
})

test('store error codes map to their HTTP status', async () => {
  for (const [code, status] of Object.entries(STATUS_BY_CODE)) {
    if (code === 'payload-too-large') continue
    const cwd = await tmpWorkspace()
    const store = makeStore({
      async read() {
        throw new StoreError(code, `boom:${code}`, { file: '/tmp/x/.dsh/jargon.json' })
      },
      async save() {
        throw new StoreError(code, `boom:${code}`, { file: '/tmp/x/.dsh/jargon.json' })
      },
      async remove() {
        throw new StoreError(code, `boom:${code}`, { file: '/tmp/x/.dsh/jargon.json' })
      },
    })
    const getResponse = await handleRequest(
      makeRequest({ url: `${ORIGIN}/-/jargon/state?cwd=${encodeURIComponent(cwd)}`, cwd, store }),
    )
    assert.equal(getResponse.status, status, `GET should map ${code} to ${status}`)
    assert.equal(getResponse.body.error.code, code)
    assert.equal(getResponse.body.ok, false)
  }
})

test('an unknown workspace is not silently accepted', async () => {
  const response = await handleRequest(
    makeRequest({
      url: `${ORIGIN}/-/jargon/state`,
      resolveError: new StoreError('no-workspace', '目录不在工作区列表里。'),
    }),
  )
  assert.equal(response.status, 409)
  assert.equal(response.body.error.code, 'no-workspace')
})

test('resolveCwd accepts a registered workspace and rejects everything else', async () => {
  const good = await tmpWorkspace()
  const other = await tmpWorkspace()
  const ctx = {
    workspaceRegistry: { list: () => [{ path: good }] },
    sessions: { get: () => undefined },
  }
  assert.equal(await resolveCwd(ctx, { cwd: good }), good)
  await assert.rejects(resolveCwd(ctx, { cwd: other }), (error) => error.code === 'no-workspace')
  await assert.rejects(resolveCwd(ctx, { cwd: 'relative/dir' }), (error) => error.code === 'no-workspace')
  await assert.rejects(resolveCwd(ctx, { cwd: undefined }), (error) => error.code === 'no-workspace')
})

test('resolveCwd falls back to the session header for a cold session', async () => {
  const dir = await tmpWorkspace()
  const ctx = {
    workspaceRegistry: { list: () => [] },
    sessions: { get: (id) => (id === 's1' ? { header: { cwd: dir } } : undefined) },
  }
  assert.equal(await resolveCwd(ctx, { session: 's1' }), dir)
  await assert.rejects(resolveCwd(ctx, { session: 'nope' }), (error) => error.code === 'no-workspace')
})

test('resolveCwd rejects a registered path that is not a directory', async () => {
  const file = path.join(await tmpWorkspace(), 'a-file.txt')
  await fsp.writeFile(file, 'x', 'utf8')
  const ctx = { workspaceRegistry: { list: () => [{ path: file }] }, sessions: { get: () => undefined } }
  await assert.rejects(resolveCwd(ctx, { cwd: file }), (error) => error.code === 'no-workspace')
})

test('rejectionStatus normalizes the trust fence verdict', () => {
  assert.equal(rejectionStatus(undefined), null)
  assert.equal(rejectionStatus(null), null)
  assert.equal(rejectionStatus(false), null)
  assert.equal(rejectionStatus(401), 401)
  assert.equal(rejectionStatus(403), 403)
  assert.equal(rejectionStatus(true), 403)
})
