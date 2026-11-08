'use strict'

/**
 * Client 数据层契约（docs/contracts/api.md §2）：URL、方法、鉴权模式、错误映射、
 * AbortSignal 透传。全部用 stub fetch，不碰网络。
 */

const test = require('node:test')
const assert = require('node:assert/strict')

const { ApiError, BASE, NETWORK_CODE, createApi, isAbortError } = require('../src/client/api.js')

/** 造一个最小 Response 替身。 */
function response(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  }
}

/** 记录调用的 stub fetch。 */
function stubFetch(impl) {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, init })
    return impl(url, init, calls.length)
  }
  fn.calls = calls
  return fn
}

test('state() 打 GET /-/jargon/state，带 session 与 cwd 查询参数，same-origin 凭据', async () => {
  const fetch = stubFetch(() =>
    response({ ok: true, cwd: '/tmp/ws', file: '/tmp/ws/.dsh/jargon.json', revision: 'abc', terms: [] }),
  )
  const api = createApi({ fetch })
  const body = await api.state({ session: 's1', cwd: '/tmp/ws' })

  assert.equal(fetch.calls.length, 1)
  const { url, init } = fetch.calls[0]
  assert.equal(url, `${BASE}/state?session=s1&cwd=%2Ftmp%2Fws`)
  assert.equal(init.credentials, 'same-origin')
  assert.equal(init.method, 'GET')
  assert.equal(body.revision, 'abc')
  assert.deepEqual(body.terms, [])
})

test('state() 省略空参数，不在 URL 里留下空串', async () => {
  const fetch = stubFetch(() => response({ ok: true, cwd: '/tmp/ws', terms: [] }))
  const api = createApi({ fetch })
  await api.state({ session: 's1', cwd: '' })
  assert.equal(fetch.calls[0].url, `${BASE}/state?session=s1`)
})

test('state() 把 AbortSignal 原样透传给 fetch', async () => {
  const controller = new AbortController()
  const fetch = stubFetch(() => response({ ok: true, terms: [] }))
  const api = createApi({ fetch })
  await api.state({ session: 's1', cwd: '/tmp/ws', signal: controller.signal })
  assert.equal(fetch.calls[0].init.signal, controller.signal)
})

test('mutate() save 是 POST JSON，id 缺省时不出现在请求体里', async () => {
  const fetch = stubFetch(() => response({ ok: true, terms: [], revision: 'r2' }))
  const api = createApi({ fetch })
  await api.mutate({ session: 's1', cwd: '/tmp/ws', action: 'save', term: '三件套', definition: '三步' })

  const { url, init } = fetch.calls[0]
  assert.equal(url, `${BASE}/mutate`)
  assert.equal(init.method, 'POST')
  assert.equal(init.credentials, 'same-origin')
  assert.equal(init.headers['Content-Type'], 'application/json')
  const body = JSON.parse(init.body)
  assert.deepEqual(body, { session: 's1', cwd: '/tmp/ws', action: 'save', term: '三件套', definition: '三步' })
  assert.ok(!('id' in body))
})

test('mutate() 编辑带上 id，删除可以只带 id', async () => {
  const fetch = stubFetch(() => response({ ok: true, terms: [], revision: 'r3' }))
  const api = createApi({ fetch })

  await api.mutate({ session: 's1', cwd: '/tmp/ws', action: 'save', id: 'a1', term: '改名', definition: '说明' })
  await api.mutate({ session: 's1', cwd: '/tmp/ws', action: 'delete', id: 'a1' })

  const save = JSON.parse(fetch.calls[0].init.body)
  const remove = JSON.parse(fetch.calls[1].init.body)
  assert.equal(save.id, 'a1')
  assert.equal(remove.action, 'delete')
  assert.equal(remove.id, 'a1')
  assert.ok(!('term' in remove), 'delete by id must not send an empty term')
})

test('mutate() 透传 AbortSignal', async () => {
  const controller = new AbortController()
  const fetch = stubFetch(() => response({ ok: true, terms: [] }))
  const api = createApi({ fetch })
  await api.mutate({ session: 's1', cwd: '/tmp/ws', action: 'delete', id: 'a1', signal: controller.signal })
  assert.equal(fetch.calls[0].init.signal, controller.signal)
})

test('业务错误：4xx + { ok:false, error:{code,message} } → ApiError 带 code 与 status', async () => {
  const fetch = stubFetch(() =>
    response(
      { ok: false, error: { code: 'duplicate-term', message: '已存在同名黑话：三件套' } },
      { ok: false, status: 409 },
    ),
  )
  const api = createApi({ fetch })
  await assert.rejects(
    () => api.mutate({ session: 's1', cwd: '/tmp/ws', action: 'save', term: '三件套', definition: 'x' }),
    (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.code, 'duplicate-term')
      assert.equal(error.status, 409)
      assert.match(error.message, /三件套/)
      return true
    },
  )
})

test('ok:false 即使 200 也按错误抛（不假装成功）', async () => {
  const fetch = stubFetch(() => response({ ok: false, error: { code: 'corrupt', message: '坏的' } }))
  const api = createApi({ fetch })
  await assert.rejects(
    () => api.state({ session: 's1', cwd: '/tmp/ws' }),
    (error) => {
      assert.equal(error.code, 'corrupt')
      assert.equal(error.status, 200)
      return true
    },
  )
})

test('非 2xx 且没有 error 对象时给状态码派生的 code 与可读提示', async () => {
  const fetch = stubFetch(() => ({
    ok: false,
    status: 503,
    json: async () => {
      throw new Error('not json')
    },
  }))
  const api = createApi({ fetch })
  await assert.rejects(
    () => api.state({ session: 's1', cwd: '/tmp/ws' }),
    (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.code, 'unavailable')
      assert.equal(error.status, 503)
      assert.ok(error.message.length > 0)
      return true
    },
  )
})

test('fetch 自身 reject（网络/鉴权失败）→ code=network，界面可显示', async () => {
  const fetch = async () => {
    throw new TypeError('Failed to fetch')
  }
  const api = createApi({ fetch })
  await assert.rejects(
    () => api.state({ session: 's1', cwd: '/tmp/ws' }),
    (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.code, NETWORK_CODE)
      assert.equal(error.status, 0)
      return true
    },
  )
})

test('中止不伪装成业务错误：AbortError 原样抛出，isAbortError 认它', async () => {
  const fetch = async () => {
    const error = new Error('aborted')
    error.name = 'AbortError'
    throw error
  }
  const api = createApi({ fetch })
  await assert.rejects(
    () => api.state({ session: 's1', cwd: '/tmp/ws' }),
    (error) => {
      assert.equal(error.name, 'AbortError')
      assert.ok(isAbortError(error))
      assert.ok(!(error instanceof ApiError))
      return true
    },
  )
})

test('base 可注入（测试/其它前缀）', async () => {
  const fetch = stubFetch(() => response({ ok: true, terms: [] }))
  const api = createApi({ fetch, base: '/x/y' })
  await api.state({ session: 's', cwd: '/w' })
  assert.equal(fetch.calls[0].url, '/x/y/state?session=s&cwd=%2Fw')
  assert.equal(api.base, '/x/y')
})

test('isAbortError 认得 DOMException 风格的中止与普通错误', () => {
  const aborted = new Error('The operation was aborted')
  aborted.name = 'AbortError'
  assert.equal(isAbortError(aborted), true)
  assert.equal(isAbortError(new Error('boom')), false)
  assert.equal(isAbortError(null), false)
})
