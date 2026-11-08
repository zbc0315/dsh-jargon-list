'use strict'

/**
 * JargonStore 的行为契约（对应设计稿 §5.2 / §5.3 与评审决策 D1/D2）。
 * 全部用临时目录，不碰真实工作区。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

const {
  JargonStore,
  StoreError,
  JARGON_FILE,
  validateTerm,
  validateDefinition,
  sameTerm,
  hashRevision,
} = require('../src/host/store')

async function workspace() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'jargon-store-'))
  return dir
}

function rejectCode(promise, code) {
  return assert.rejects(promise, (error) => {
    assert.ok(error instanceof StoreError, `expected StoreError, got ${error?.constructor?.name}`)
    assert.equal(error.code, code, `expected code ${code}, got ${error.code} (${error.message})`)
    return true
  })
}

test('read on a fresh workspace returns an empty list and creates nothing', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  const state = await store.read(dir)
  assert.deepEqual(state.terms, [])
  assert.equal(state.revision, 'empty')
  assert.equal(state.file, path.join(dir, JARGON_FILE))
  await assert.rejects(fsp.stat(path.join(dir, '.dsh')), { code: 'ENOENT' })
})

test('save creates the file with the documented shape', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  const { entry, terms, revision } = await store.save(dir, {
    term: '  三件套 ',
    definition: '  先查既有实现，再读文档，最后跑一次现状测试。 ',
    by: 'agent',
  })
  assert.equal(entry.term, '三件套', 'term must be trimmed')
  assert.equal(entry.definition, '先查既有实现，再读文档，最后跑一次现状测试。')
  assert.equal(entry.updatedBy, 'agent')
  assert.match(entry.id, /^[0-9a-f]{16}$/)
  assert.equal(entry.createdAt, entry.updatedAt)
  assert.equal(terms.length, 1)
  assert.notEqual(revision, 'empty')

  const raw = JSON.parse(await fsp.readFile(path.join(dir, JARGON_FILE), 'utf8'))
  assert.equal(raw.version, 1)
  assert.equal(raw.terms.length, 1)
  assert.deepEqual(Object.keys(raw.terms[0]).sort(), [
    'createdAt',
    'definition',
    'id',
    'term',
    'updatedAt',
    'updatedBy',
  ])
})

test('saving the same term updates it in place and keeps its id', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  const first = await store.save(dir, { term: '三件套', definition: '旧说明', by: 'user' })
  const second = await store.save(dir, { term: '三件套', definition: '新说明', by: 'agent' })
  assert.equal(second.terms.length, 1)
  assert.equal(second.entry.id, first.entry.id)
  assert.equal(second.entry.definition, '新说明')
  assert.equal(second.entry.updatedBy, 'agent')
  assert.equal(second.entry.createdAt, first.entry.createdAt)
})

test('terms that differ only by case or width are the same term', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  await store.save(dir, { term: 'ABC', definition: '一', by: 'user' })
  const { terms } = await store.save(dir, { term: 'ａｂｃ', definition: '二', by: 'user' })
  assert.equal(terms.length, 1)
  assert.equal(terms[0].term, 'ABC', 'the first spelling wins')
})

test('two writers saving different terms concurrently keep both', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  await Promise.all([
    store.save(dir, { term: '甲', definition: '第一个', by: 'user' }),
    store.save(dir, { term: '乙', definition: '第二个', by: 'agent' }),
  ])
  const { terms } = await store.read(dir)
  assert.deepEqual(terms.map((entry) => entry.term).sort(), ['乙', '甲'])
})

test('validation rejects blank, over-long and degenerate input', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  await rejectCode(store.save(dir, { term: '   ', definition: 'x', by: 'user' }), 'invalid-term')
  await rejectCode(store.save(dir, { term: 'x'.repeat(81), definition: 'x', by: 'user' }), 'term-too-long')
  await rejectCode(store.save(dir, { term: 'ok', definition: '   ', by: 'user' }), 'invalid-definition')
  await rejectCode(
    store.save(dir, { term: 'ok', definition: 'x'.repeat(4001), by: 'user' }),
    'definition-too-long',
  )
  await rejectCode(store.save(dir, { term: 42, definition: 'x', by: 'user' }), 'invalid-term')
})

test('a corrupt file is reported and never overwritten', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  await fsp.mkdir(path.join(dir, '.dsh'), { recursive: true })
  const file = path.join(dir, JARGON_FILE)
  const corrupt = '{"version":1,"terms":[{"id":"x"'
  await fsp.writeFile(file, corrupt, 'utf8')

  await assert.rejects(store.read(dir), (error) => {
    assert.equal(error.code, 'corrupt')
    assert.ok(error.message.includes(file), 'the message must name the file')
    return true
  })
  await rejectCode(store.save(dir, { term: '三件套', definition: '新', by: 'user' }), 'corrupt')
  assert.equal(await fsp.readFile(file, 'utf8'), corrupt, 'corrupt bytes must survive untouched')
})

test('remove deletes by term and by id, and reports a missing entry', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  const { entry } = await store.save(dir, { term: '跑一轮', definition: '一次完整回归', by: 'agent' })
  const byTerm = await store.remove(dir, { term: '跑一轮' })
  assert.equal(byTerm.terms.length, 0)

  const again = await store.save(dir, { term: '跑一轮', definition: '一次完整回归', by: 'agent' })
  assert.notEqual(again.entry.id, entry.id, 'a re-created term gets a fresh id')
  const byId = await store.remove(dir, { id: again.entry.id })
  assert.equal(byId.terms.length, 0)

  await rejectCode(store.remove(dir, { term: '不存在' }), 'not-found')
})

test('revision changes with content and is stable without it', async () => {
  const dir = await workspace()
  const store = new JargonStore()
  const first = await store.save(dir, { term: '甲', definition: '一', by: 'user' })
  const unchanged = await store.read(dir)
  assert.equal(unchanged.revision, first.revision)
  const second = await store.read(dir)
  assert.equal(second.revision, first.revision)
  const changed = await store.save(dir, { term: '乙', definition: '二', by: 'user' })
  assert.notEqual(changed.revision, first.revision)
})

test('list order is newest-updated first', async () => {
  const dir = await workspace()
  let clock = 1_700_000_000_000
  const store = new JargonStore({ now: () => (clock += 1000) })
  await store.save(dir, { term: '甲', definition: '一', by: 'user' })
  await store.save(dir, { term: '乙', definition: '二', by: 'user' })
  await store.save(dir, { term: '甲', definition: '一改', by: 'user' })
  const { terms } = await store.read(dir)
  assert.deepEqual(terms.map((entry) => entry.term), ['甲', '乙'])
})

test('relative or non-existent directories are rejected as no-workspace', async () => {
  const store = new JargonStore()
  await rejectCode(store.read('relative/path'), 'no-workspace')
  await rejectCode(store.save('/definitely/not/here/jargon', { term: 'a', definition: 'b', by: 'user' }), 'io-error')
})

test('pure helpers behave as the routes and tools expect', () => {
  assert.equal(validateTerm(' 甲 '), '甲')
  assert.equal(sameTerm('ABC', 'ａｂｃ'), true)
  assert.equal(sameTerm('abc', 'abd'), false)
  assert.equal(validateDefinition('a\r\nb'), 'a\r\nb', 'line endings are preserved')
  assert.equal(hashRevision('same'), hashRevision('same'))
  assert.notEqual(hashRevision('a'), hashRevision('b'))
})
