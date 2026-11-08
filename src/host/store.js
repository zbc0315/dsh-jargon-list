'use strict'

/**
 * @tom2012/dsh-jargon-list — 黑话存储层
 *
 * 唯一的真源是 `<工作区>/.dsh/jargon.json`。这一层不认识 HTTP、不认识工具，
 * 只认识「一个工作区目录 + 一次操作」，所以路由和 agent 工具共用同一套语义
 * （设计稿 §5.2 / §5.3，评审决策 D1 / D2）。
 *
 * 三条硬约束：
 *   1. 读操作绝不创建文件（打开面板不能在工作区里留垃圾）。
 *   2. 文件损坏时读报 corrupt、写直接拒绝 —— 绝不用空表覆盖用户数据。
 *   3. 同一工作区的读改写走串行队列，写入是「临时文件 + rename」的原子替换，
 *      所以并发新增不同词条不会互相吞掉；同一词条的并发编辑是 last-write-wins。
 */

const fsp = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')

/** 数据文件相对工作区根的位置。 */
const JARGON_FILE = path.join('.dsh', 'jargon.json')
/** 文件格式版本；将来改结构时递增并在 read 里做迁移。 */
const FILE_VERSION = 1
/** 单个词条的上限。 */
const MAX_TERM_LENGTH = 80
const MAX_DEFINITION_LENGTH = 4000
/** 一个工作区最多多少条，防止误把整个仓库当黑话写进来。 */
const MAX_TERMS = 5000

/** 带稳定 code 的业务错误：路由映射成 HTTP，工具映射成工具错误。 */
class StoreError extends Error {
  /**
   * @param {string} code 稳定错误码（见 docs/contracts/api.md §2）。
   * @param {string} message 面向用户的说明。
   * @param {object} [extra] 附加字段（例如 file）。
   */
  constructor(code, message, extra) {
    super(message)
    this.name = 'StoreError'
    this.code = code
    if (extra) Object.assign(this, extra)
  }
}

/** NFKC + 小写 + 折叠空白：判重与检索共用的口径。 */
function foldTerm(value) {
  if (typeof value !== 'string') return ''
  let text = value
  try {
    text = text.normalize('NFKC')
  } catch {
    /* 保留原串 */
  }
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** 归一化后的比较：宽窄、大小写、空白差异都算同一条。 */
function sameTerm(a, b) {
  const left = foldTerm(a)
  return left !== '' && left === foldTerm(b)
}

/** 校验并 trim 黑话本身。 */
function validateTerm(raw) {
  if (typeof raw !== 'string') throw new StoreError('invalid-term', '黑话必须是文本。')
  const term = raw.trim()
  if (term === '') throw new StoreError('invalid-term', '黑话不能为空。')
  if (term.length > MAX_TERM_LENGTH) {
    throw new StoreError('term-too-long', `黑话不能超过 ${MAX_TERM_LENGTH} 字。`)
  }
  return term
}

/** 校验并 trim 详细说明（保留内部换行）。 */
function validateDefinition(raw) {
  if (typeof raw !== 'string') throw new StoreError('invalid-definition', '详细说明必须是文本。')
  const definition = raw.trim()
  if (definition === '') throw new StoreError('invalid-definition', '详细说明不能为空。')
  if (definition.length > MAX_DEFINITION_LENGTH) {
    throw new StoreError('definition-too-long', `详细说明不能超过 ${MAX_DEFINITION_LENGTH} 字。`)
  }
  return definition
}

/** 内容短哈希，供客户端做变更检测。 */
function hashRevision(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12)
}

/** 16 位 hex 的稳定条目 id。 */
function newId() {
  return crypto.randomBytes(8).toString('hex')
}

/** 校验 cwd 必须是绝对路径（相对路径会把文件写到进程 cwd，必须拒绝）。 */
function requireAbsolute(cwd) {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    throw new StoreError('no-workspace', '没有可用的工作区目录。')
  }
  const raw = cwd.trim()
  if (!path.isAbsolute(raw)) {
    throw new StoreError('no-workspace', `工作区目录必须是绝对路径：${raw}`)
  }
  return path.resolve(raw)
}

/** 从原始字节解出 { text, terms }；任何结构不符都是 corrupt。 */
function parseFile(text, file) {
  let raw
  try {
    raw = JSON.parse(text)
  } catch {
    throw new StoreError('corrupt', `黑话数据文件不是合法 JSON：${file}`, { file })
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new StoreError('corrupt', `黑话数据文件结构不对：${file}`, { file })
  }
  if (raw.version !== FILE_VERSION) {
    throw new StoreError('corrupt', `黑话数据文件版本不认识（${String(raw.version)}）：${file}`, { file })
  }
  if (!Array.isArray(raw.terms)) {
    throw new StoreError('corrupt', `黑话数据文件缺少 terms 数组：${file}`, { file })
  }
  const seen = new Set()
  const terms = raw.terms.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new StoreError('corrupt', `黑话数据文件里有非对象条目：${file}`, { file })
    }
    const { id, term, definition, createdAt, updatedAt, updatedBy } = entry
    if (typeof id !== 'string' || id === '') {
      throw new StoreError('corrupt', `黑话条目缺少 id：${file}`, { file })
    }
    if (typeof term !== 'string' || term.trim() === '') {
      throw new StoreError('corrupt', `黑话条目缺少 term：${file}`, { file })
    }
    if (typeof definition !== 'string') {
      throw new StoreError('corrupt', `黑话条目缺少 definition：${file}`, { file })
    }
    const key = foldTerm(term)
    if (seen.has(key)) {
      throw new StoreError('corrupt', `黑话数据文件里有重复词条：${term}（${file}）`, { file })
    }
    seen.add(key)
    return {
      id,
      term,
      definition,
      createdAt: typeof createdAt === 'string' ? createdAt : '',
      updatedAt: typeof updatedAt === 'string' ? updatedAt : '',
      updatedBy: updatedBy === 'agent' ? 'agent' : 'user',
    }
  })
  return { terms }
}

/** 展示顺序：最近更新的在前；同一时间按词条名。 */
function sortTerms(terms) {
  return [...terms].sort((a, b) => {
    if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1
    return a.term.localeCompare(b.term, 'zh-Hans-CN')
  })
}

/** 序列化成落盘文本。 */
function serialize(terms) {
  return `${JSON.stringify({ version: FILE_VERSION, terms }, null, 2)}\n`
}

class JargonStore {
  /**
   * @param {object} [options]
   * @param {() => number} [options.now] 可注入的时钟（测试用）。
   * @param {typeof import('node:fs/promises')} [options.fs] 可注入的 fs。
   */
  constructor(options) {
    const { now, fs } = options || {}
    this.now = typeof now === 'function' ? now : () => Date.now()
    this.fs = fs || fsp
    /** @type {Map<string, Promise<unknown>>} 每个工作区一条串行链。 */
    this.queues = new Map()
  }

  /** 工作区里的数据文件绝对路径。 */
  fileFor(cwd) {
    return path.join(requireAbsolute(cwd), JARGON_FILE)
  }

  /** 串行化同一工作区的读改写；不同工作区互不阻塞。 */
  async withLock(cwd, operation) {
    const key = requireAbsolute(cwd)
    const previous = this.queues.get(key) || Promise.resolve()
    const next = previous.then(operation, operation)
    this.queues.set(
      key,
      next.then(
        () => undefined,
        () => undefined,
      ),
    )
    return next
  }

  /** 读原始文本；文件不存在返回 null。 */
  async readText(cwd) {
    const file = this.fileFor(cwd)
    try {
      return { file, text: await this.fs.readFile(file, 'utf8') }
    } catch (error) {
      if (error && error.code === 'ENOENT') return { file, text: null }
      throw new StoreError('io-error', `读取黑话数据文件失败：${file}（${error && error.message}）`, { file })
    }
  }

  /** 原子写：临时文件 + rename，读者永远看到完整的一版。 */
  async writeText(file, text) {
    const dir = path.dirname(file)
    const temp = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`
    try {
      await this.fs.mkdir(dir, { recursive: true })
      await this.fs.writeFile(temp, text, 'utf8')
      await this.fs.rename(temp, file)
    } catch (error) {
      try {
        await this.fs.unlink(temp)
      } catch {
        /* 临时文件可能根本没建出来 */
      }
      throw new StoreError('io-error', `写入黑话数据文件失败：${file}（${error && error.message}）`, { file })
    }
  }

  /**
   * 读全部词条。
   * @param {string} cwd 工作区绝对路径。
   * @returns {Promise<{ terms: any[], revision: string, file: string }>}
   */
  async read(cwd) {
    const { file, text } = await this.readText(cwd)
    if (text === null) return { terms: [], revision: 'empty', file }
    const { terms } = parseFile(text, file)
    return { terms: sortTerms(terms), revision: hashRevision(text), file }
  }

  /**
   * 按黑话 upsert：存在则更新说明，不存在则新增。
   * @param {string} cwd 工作区绝对路径。
   * @param {{ term: string, definition: string, by?: 'user'|'agent' }} input
   * @returns {Promise<{ terms: any[], revision: string, entry: any, file: string }>}
   */
  async save(cwd, input) {
    const term = validateTerm(input && input.term)
    const definition = validateDefinition(input && input.definition)
    const by = input && input.by === 'agent' ? 'agent' : 'user'

    return this.withLock(cwd, async () => {
      const { file, text } = await this.readText(cwd)
      const terms = text === null ? [] : parseFile(text, file).terms
      const now = new Date(this.now()).toISOString()
      const existing = terms.find((entry) => sameTerm(entry.term, term))

      let entry
      if (existing) {
        // 就地更新：id 与 createdAt 保留，只动说明与更新时间。
        existing.definition = definition
        existing.updatedAt = now
        existing.updatedBy = by
        entry = { ...existing }
      } else {
        if (terms.length >= MAX_TERMS) {
          throw new StoreError('too-many-terms', `黑话条目已达上限 ${MAX_TERMS} 条。`, { file })
        }
        entry = { id: newId(), term, definition, createdAt: now, updatedAt: now, updatedBy: by }
        terms.push(entry)
      }

      const nextText = serialize(sortTerms(terms))
      await this.writeText(file, nextText)
      return { terms: sortTerms(terms), revision: hashRevision(nextText), entry: { ...entry }, file }
    })
  }

  /**
   * 删除一条：按 id 或按黑话文本。
   * @param {string} cwd 工作区绝对路径。
   * @param {{ id?: string, term?: string }} target
   * @returns {Promise<{ terms: any[], revision: string, file: string }>}
   */
  async remove(cwd, target) {
    const id = target && typeof target.id === 'string' ? target.id.trim() : ''
    const rawTerm = target && typeof target.term === 'string' ? target.term.trim() : ''
    if (id === '' && rawTerm === '') {
      throw new StoreError('bad-request', '删除黑话需要 id 或 term。')
    }

    return this.withLock(cwd, async () => {
      const { file, text } = await this.readText(cwd)
      const terms = text === null ? [] : parseFile(text, file).terms
      const index = terms.findIndex((entry) =>
        id !== '' ? entry.id === id : sameTerm(entry.term, rawTerm),
      )
      if (index < 0) {
        throw new StoreError('not-found', id !== '' ? `找不到 id 为 ${id} 的黑话。` : `找不到黑话：${rawTerm}`, { file })
      }
      terms.splice(index, 1)
      const nextText = serialize(sortTerms(terms))
      await this.writeText(file, nextText)
      return { terms: sortTerms(terms), revision: hashRevision(nextText), file }
    })
  }
}

module.exports = {
  JargonStore,
  StoreError,
  JARGON_FILE,
  FILE_VERSION,
  MAX_TERM_LENGTH,
  MAX_DEFINITION_LENGTH,
  MAX_TERMS,
  validateTerm,
  validateDefinition,
  sameTerm,
  hashRevision,
  foldTerm,
}
