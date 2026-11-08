/**
 * 同源 HTTP 客户端（契约 docs/contracts/api.md §2）。
 *
 * 只做三件事：拼 URL、发请求、把 `{ ok:false, error:{code,message} }` 变成带 `code`
 * 的 `ApiError`。业务语义（什么状态怎么显示）在 panel.js 里。
 *
 * 所有请求 `credentials: 'same-origin'`：鉴权复用宿主网关，浏览器侧不自己带 token。
 * `fetch` / `base` 可注入，方便 `node --test` 用 stub 断言 URL 与方法。
 */

/** 路由前缀。 */
export const BASE = '/-/jargon'

/** 网络层失败（fetch 自身 reject）用的错误码，契约 §4 之外、仅供界面显示。 */
export const NETWORK_CODE = 'network'

/** 带契约错误码的 API 错误。`code` 来自 `error.code`，`status` 是 HTTP 状态。 */
export class ApiError extends Error {
  constructor(code, message, status) {
    super(message || code || 'request failed')
    this.name = 'ApiError'
    this.code = code || 'unknown'
    this.status = status
  }
}

/** 状态码 → 兜底提示（服务端没给 `error` 对象时用）。 */
function hint(status) {
  if (status === 404) return 'jargon route not found (host plugin may not be mounted)'
  if (status === 403 || status === 401) return 'the host rejected the request (not authorized)'
  if (status === 409) return 'the jargon file changed in a conflicting way'
  if (status === 413) return 'request body too large'
  if (status === 503) return 'the host service is unavailable; restart dsh web'
  if (status >= 500) return 'host internal error'
  return `HTTP ${status}`
}

/** 非 2xx 且没有服务端错误码时的错误码。 */
function statusCode(status) {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 413) return 'too-large'
  if (status === 503) return 'unavailable'
  return 'http-error'
}

function qs(params) {
  const parts = []
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

/** 读 JSON 响应体；`ok:false` 一律抛 `ApiError`。 */
async function readJson(res) {
  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  const failure = body && body.ok === false ? body.error : null
  if (!res.ok || failure) {
    const code = failure && failure.code ? failure.code : statusCode(res.status)
    const message = failure && failure.message ? failure.message : hint(res.status)
    throw new ApiError(code, message, res.status)
  }
  return body || {}
}

/** 是不是被 AbortController 中止的请求（调用方应静默丢弃）。 */
export function isAbortError(error) {
  return !!error && (error.name === 'AbortError' || error.code === 20)
}

/**
 * 建一个 api 客户端。
 * @param {object} [options] - `fetch`（默认全局 fetch）与 `base`（默认 `/-/jargon`）。
 * @returns {{ base: string, state: Function, mutate: Function }}
 */
export function createApi({ fetch: fetchImpl, base = BASE } = {}) {
  const doFetch = typeof fetchImpl === 'function' ? fetchImpl : (...args) => globalThis.fetch(...args)
  const url = (path) => `${base}${path}`

  async function send(path, init) {
    let res
    try {
      res = await doFetch(url(path), { credentials: 'same-origin', ...init })
    } catch (error) {
      if (isAbortError(error)) throw error
      const message = error && error.message ? error.message : 'network error'
      throw new ApiError(NETWORK_CODE, message, 0)
    }
    return readJson(res)
  }

  return {
    base,

    /** GET /state：`{ session, cwd, signal }` → `{ cwd, file, revision, terms }`。 */
    state({ session, cwd, signal } = {}) {
      return send(`/state${qs({ session, cwd })}`, { signal, method: 'GET' })
    },

    /**
     * POST /mutate。
     * `{ session, cwd, action:'save', id?, term, definition }` 或
     * `{ session, cwd, action:'delete', id? , term? }` → `{ cwd, file, revision, terms, entry? }`。
     */
    mutate({ session, cwd, action, id, term, definition, signal } = {}) {
      const body = { session, cwd, action }
      if (id !== undefined) body.id = id
      if (term !== undefined) body.term = term
      if (definition !== undefined) body.definition = definition
      return send('/mutate', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    },
  }
}

/** 默认实例（浏览器里就是同源 fetch）。 */
export const api = createApi()
