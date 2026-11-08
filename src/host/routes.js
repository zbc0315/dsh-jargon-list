'use strict'

/**
 * @tom2012/dsh-jargon-list — 同源 HTTP 路由（浏览器半的唯一入口）
 *
 * 形态照 @tom2012/dsh-notes 的 routes.js：
 *   · `ctx.webServer.register({ kind:'prefix', path:'/-/jargon', handler })`
 *   · 先过 `ctx.connection.requestRejection(req)`（宿主鉴权 + Host/Origin 信任栅栏）
 *   · 业务全部交给 JargonStore，路由只做「解析 → 调 store → 序列化」
 *
 * 为了让这段逻辑能被 node --test 直接覆盖，真正的处理写成纯函数 handleRequest()，
 * 请求对象/响应只用一个只含 status + body 的普通对象表示。
 */

const fsp = require('node:fs/promises')
const path = require('node:path')

const { StoreError, JARGON_FILE } = require('./store')

const API_PREFIX = '/-/jargon'
const MAX_BODY_BYTES = 64 * 1024

/** 错误码 → HTTP 状态（契约 §2 的表）。 */
const STATUS_BY_CODE = {
  'bad-request': 400,
  'invalid-term': 400,
  'term-too-long': 400,
  'invalid-definition': 400,
  'definition-too-long': 400,
  'payload-too-large': 413,
  'no-session': 404,
  'not-found': 404,
  'no-workspace': 409,
  corrupt: 409,
  'duplicate-term': 409,
  'too-many-terms': 409,
  'io-error': 500,
}

function statusFor(code) {
  return STATUS_BY_CODE[code] || 500
}

function fail(code, message, extra) {
  return { status: statusFor(code), body: { ok: false, error: { code, message, ...(extra || {}) } } }
}

/* ------------------------------------------------------------------ *
 * 工作区解析（评审决策 D1 / D3）
 * ------------------------------------------------------------------ */

/** 已知工作区路径集合：注册表 + 会话 header。 */
function knownWorkspacePaths(ctx) {
  const paths = new Set()
  try {
    const list = ctx && ctx.workspaceRegistry && ctx.workspaceRegistry.list()
    for (const workspace of list || []) {
      if (workspace && typeof workspace.path === 'string' && workspace.path !== '') {
        paths.add(path.resolve(workspace.path))
      }
    }
  } catch {
    /* 服务不在就跳过 */
  }
  return paths
}

/** 取会话 header 里那个**原始项目目录**（不是可变的 effective cwd）。 */
function sessionCwd(ctx, session) {
  if (typeof session !== 'string' || session === '') return ''
  try {
    const record = ctx && ctx.sessions && ctx.sessions.get(session)
    const cwd = record && record.header && record.header.cwd
    if (typeof cwd === 'string' && cwd !== '') return path.resolve(cwd)
  } catch {
    /* 服务不在就跳过 */
  }
  return ''
}

/** 两个路径是否指向同一个真实目录（容忍符号链接与大小写差异）。 */
async function sameDirectory(a, b) {
  if (path.resolve(a) === path.resolve(b)) return true
  try {
    const [left, right] = await Promise.all([fsp.realpath(a), fsp.realpath(b)])
    return left === right
  } catch {
    return false
  }
}

/**
 * 把客户端给的工作区落成真实目录，且必须属于「已知工作区」。
 *
 * 这是唯一防止 UI 借接口往任意路径写文件的关卡：路径必须绝对、必须存在且是目录、
 * 并且命中工作区注册表或会话 header。拿不到时一律 no-workspace。
 *
 * @param {object} ctx Host 上下文（用到的服务都做存在性判断）。
 * @param {{ session?: string, cwd?: string }} input
 * @returns {Promise<string>} 绝对路径。
 */
async function resolveCwd(ctx, input) {
  const requested = input && typeof input.cwd === 'string' ? input.cwd.trim() : ''
  const session = input && typeof input.session === 'string' ? input.session.trim() : ''

  let candidate = ''
  if (requested !== '') {
    if (!path.isAbsolute(requested)) {
      throw new StoreError('no-workspace', `工作区目录必须是绝对路径：${requested}`)
    }
    candidate = path.resolve(requested)
  } else {
    candidate = sessionCwd(ctx, session)
    if (candidate === '') {
      throw new StoreError('no-workspace', '拿不到当前会话的工作区目录。')
    }
  }

  let stat
  try {
    stat = await fsp.stat(candidate)
  } catch (error) {
    throw new StoreError('no-workspace', `工作区目录不存在：${candidate}`, { file: candidate })
  }
  if (!stat.isDirectory()) {
    throw new StoreError('no-workspace', `工作区目录不是文件夹：${candidate}`, { file: candidate })
  }

  const known = knownWorkspacePaths(ctx)
  const fromSession = sessionCwd(ctx, session)
  if (fromSession !== '') known.add(fromSession)

  if (known.size > 0) {
    let matched = false
    for (const entry of known) {
      if (await sameDirectory(entry, candidate)) {
        matched = true
        break
      }
    }
    if (!matched) {
      throw new StoreError('no-workspace', `目录不在工作区列表里：${candidate}`, { file: candidate })
    }
  }
  return candidate
}

/* ------------------------------------------------------------------ *
 * 纯处理函数
 * ------------------------------------------------------------------ */

/**
 * 处理一次请求。
 *
 * @param {object} input
 * @param {string} input.method HTTP 方法。
 * @param {string} input.url 请求 URL（可带 origin）。
 * @param {object} input.ctx Host 上下文。
 * @param {object} input.store JargonStore（或同形对象）。
 * @param {() => Promise<any>} input.readBody 读并解析 JSON 请求体。
 * @returns {Promise<{ status: number, body: object }>}
 */
async function handleRequest(input) {
  const { method, url, ctx, store, readBody } = input
  let parsed
  try {
    parsed = new URL(typeof url === 'string' && url !== '' ? url : API_PREFIX, 'http://jargon.invalid')
  } catch {
    return fail('bad-request', `请求地址无法解析：${String(url).slice(0, 200)}`)
  }
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/'
  const verb = String(method || 'GET').toUpperCase()

  if (pathname !== API_PREFIX && pathname !== `${API_PREFIX}/state` && pathname !== `${API_PREFIX}/mutate`) {
    return fail('not-found', `没有这个接口：${pathname}`)
  }

  if (verb === 'GET' && (pathname === API_PREFIX || pathname === `${API_PREFIX}/state`)) {
    const session = parsed.searchParams.get('session') || ''
    const cwdParam = parsed.searchParams.get('cwd') || ''
    try {
      const cwd = await resolveCwd(ctx, { session, cwd: cwdParam })
      const state = await store.read(cwd)
      return {
        status: 200,
        body: { ok: true, session, cwd, file: state.file, revision: state.revision, terms: state.terms },
      }
    } catch (error) {
      return fromStoreError(error)
    }
  }

  if (verb === 'POST' && (pathname === `${API_PREFIX}/mutate` || pathname === API_PREFIX)) {
    let body
    try {
      body = await readBody()
    } catch (error) {
      return fromStoreError(error)
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return fail('bad-request', '请求体必须是 JSON 对象。')
    }
    const action = typeof body.action === 'string' ? body.action.trim() : ''
    if (action !== 'save' && action !== 'delete') {
      // 先判输入形状，再解析工作区：参数写错时给 400，而不是一个误导性的 409。
      return fail('bad-request', `不认识的 action：${action || '(空)'}`)
    }
    try {
      const cwd = await resolveCwd(ctx, { session: body.session, cwd: body.cwd })
      if (action === 'save') {
        const result = await store.save(cwd, { term: body.term, definition: body.definition, by: body.by })
        return {
          status: 200,
          body: {
            ok: true,
            cwd,
            file: result.file,
            revision: result.revision,
            terms: result.terms,
            entry: result.entry,
          },
        }
      }
      if (action === 'delete') {
        const result = await store.remove(cwd, { id: body.id, term: body.term })
        return { status: 200, body: { ok: true, cwd, file: result.file, revision: result.revision, terms: result.terms } }
      }
      return fail('bad-request', `不认识的 action：${action || '(空)'}`)
    } catch (error) {
      return fromStoreError(error)
    }
  }

  return {
    status: 405,
    body: { ok: false, error: { code: 'bad-request', message: `不支持的请求方法：${verb}` } },
  }
}

/** 把任何抛出来的东西归一成响应。 */
function fromStoreError(error) {
  if (error && typeof error.code === 'string' && STATUS_BY_CODE[error.code] !== undefined) {
    return fail(error.code, error.message || error.code, error.file ? { file: error.file } : undefined)
  }
  const message = (error && error.message) || String(error)
  return fail('io-error', `黑话单内部错误：${message}`)
}

/* ------------------------------------------------------------------ *
 * 挂到宿主
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * 小工具：与 dsh-notes 同形的读写辅助
 * ------------------------------------------------------------------ */

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(body.length),
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function sendJsonSafe(res, status, payload) {
  try {
    if (res.headersSent) {
      res.end()
      return
    }
    sendJson(res, status, payload)
  } catch {
    /* 连接已断 */
  }
}

/** 信任栅栏：返回 null 表示放行。 */
function rejectionStatus(rejection) {
  if (typeof rejection === 'number' && rejection > 0) return rejection
  if (rejection === undefined || rejection === null || rejection === false) return null
  return 403
}

function connectionRejection(ctx, req) {
  const connection = ctx && ctx.connection
  if (!connection || typeof connection.requestRejection !== 'function') return undefined
  return connection.requestRejection(req)
}

/** 读 JSON 请求体，超过 limit 抛 payload-too-large。 */
function readJsonBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new StoreError('payload-too-large', `请求体超过 ${limit} 字节。`))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) return resolve({})
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new StoreError('bad-request', '请求体不是合法 JSON。'))
      }
    })
    req.on('error', (error) => reject(new StoreError('bad-request', `读取请求体失败：${error && error.message}`)))
  })
}

/**
 * 注册 `/-/jargon` 前缀路由。
 *
 * @param {object} ctx Host 上下文。
 * @param {object} store JargonStore。
 * @param {{ warn?: (message: string) => void }} [options]
 * @returns {() => void} disposer（交给 ctx.effect 回收）。
 */
function registerRoutes(ctx, store, options) {
  const warn = (options && options.warn) || (() => {})
  const webServer = ctx && ctx.webServer
  if (!webServer || typeof webServer.register !== 'function') {
    warn('webServer 不可用，黑话单 API 未注册')
    return () => {}
  }

  try {
    return webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
    handler: async (req, res) => {
      let rejection
      try {
        rejection = connectionRejection(ctx, req)
      } catch (error) {
        warn(`信任栅栏不可用：${(error && error.message) || error}`)
        return sendJsonSafe(res, 503, {
          ok: false,
          error: { code: 'gate-unavailable', message: '宿主连接服务不可用，请重启 dsh web 后刷新页面' },
        })
      }
      const status = rejectionStatus(rejection)
      if (status !== null) {
        try {
          res.statusCode = status
          res.end()
        } catch {
          /* 连接已断 */
        }
        return
      }

      // 最后一道兜底：路由处理绝不允许把 rejection 交给 webserver（虽然它会 catch 并记日志，
      // 但那样客户端只会拿到 400，且日志噪音掩盖真实原因）。这里统一成 500 + 结构化错误。
      try {
        const response = await handleRequest({
          method: req.method,
          url: req.url,
          ctx,
          store,
          readBody: () => readJsonBody(req),
        })
        sendJsonSafe(res, response.status, response.body)
      } catch (error) {
        warn(`处理 ${String(req.method)} ${String(req.url)} 时出错：${(error && error.message) || error}`)
        sendJsonSafe(res, 500, {
          ok: false,
          error: { code: 'io-error', message: `黑话单内部错误：${(error && error.message) || error}` },
        })
      }
    },
  })
  } catch (error) {
    warn(`注册 /-/jargon 路由失败：${(error && error.message) || error}`)
    return () => {}
  }
}

module.exports = {
  API_PREFIX,
  MAX_BODY_BYTES,
  STATUS_BY_CODE,
  registerRoutes,
  handleRequest,
  resolveCwd,
  rejectionStatus,
  readJsonBody,
  statusFor,
}
