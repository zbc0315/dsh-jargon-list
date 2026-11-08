'use strict'

/**
 * agent 工具的行为契约（设计稿 §5.5）。
 * 用假 store + 假 exec 直接调定义，不启动宿主。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const { compileParameters, jargonToolDefinitions, registerTools } = require('../src/host/tools')

const CWD = '/Users/tom/Projects/ask'

function fakeExec(cwd = CWD) {
  return { agent: { session: { header: { cwd } } } }
}

function fakeStore(overrides) {
  return {
    async read(cwd) {
      assert.equal(cwd, CWD)
      return {
        terms: [
          { id: 'a1', term: '三件套', definition: '三步', createdAt: 't0', updatedAt: 't2', updatedBy: 'user' },
        ],
        revision: 'rev1',
        file: path.join(CWD, '.dsh/jargon.json'),
      }
    },
    async save(cwd, input) {
      assert.equal(cwd, CWD)
      return {
        terms: [{ id: 'b2', term: input.term, definition: input.definition, updatedAt: 't3' }],
        revision: 'rev2',
        entry: { id: 'b2', term: input.term, definition: input.definition, updatedBy: input.by },
        file: path.join(CWD, '.dsh/jargon.json'),
      }
    },
    async remove(cwd, target) {
      assert.equal(cwd, CWD)
      return { terms: [], revision: 'rev3', file: path.join(CWD, '.dsh/jargon.json') }
    },
    ...overrides,
  }
}

function pick(definitions, name) {
  const found = definitions.find((definition) => definition.name === name)
  assert.ok(found, `missing tool ${name}`)
  return found
}

test('compileParameters lifts required flags into the top-level array', () => {
  const compiled = compileParameters({
    term: { type: 'string', required: true, description: 'name' },
    definition: { type: 'string', required: true, description: 'meaning' },
    id: { type: 'string' },
  })
  assert.deepEqual(compiled, {
    type: 'object',
    properties: {
      term: { type: 'string', description: 'name' },
      definition: { type: 'string', description: 'meaning' },
      id: { type: 'string' },
    },
    required: ['term', 'definition'],
  })
  assert.deepEqual(compileParameters({}), { type: 'object', properties: {} })
})

test('the three tools exist with model-facing shape', () => {
  const definitions = jargonToolDefinitions({}, fakeStore())
  assert.deepEqual(definitions.map((definition) => definition.name), [
    'jargon_list',
    'jargon_save',
    'jargon_delete',
  ])
  for (const definition of definitions) {
    assert.equal(typeof definition.description, 'string')
    assert.ok(definition.description.length > 40, `${definition.name} needs a useful description`)
    assert.equal(definition.parameters.type, 'object')
    assert.equal(definition.output.schema.type, 'object')
    assert.equal(typeof definition.output.render, 'function')
    assert.equal(typeof definition.execute, 'function')
  }
  // 模型必须从描述里知道「这是项目内的临时简称，该记下来」。
  const save = pick(definitions, 'jargon_save')
  assert.match(save.description, /jargon|short name|shorthand/i)
  assert.deepEqual(save.parameters.required, ['term', 'definition'])
})

test('jargon_list reads the session workspace and reports the total', async () => {
  const definitions = jargonToolDefinitions({}, fakeStore())
  const result = await pick(definitions, 'jargon_list').execute({}, fakeExec())
  assert.equal(result.total, 1)
  assert.equal(result.terms[0].term, '三件套')
  assert.equal(result.file, path.join(CWD, '.dsh/jargon.json'))
  const rendered = pick(definitions, 'jargon_list').output.render({}, result)
  assert.equal(rendered[0].type, 'text')
  assert.match(rendered[0].text, /三件套/)
})

test('jargon_save writes as the agent and reports whether it was an update', async () => {
  let seen
  const store = fakeStore({
    async save(cwd, input) {
      seen = { cwd, input }
      return {
        terms: [],
        revision: 'rev9',
        entry: { id: 'c1', term: input.term, definition: input.definition, updatedBy: input.by },
        file: path.join(CWD, '.dsh/jargon.json'),
      }
    },
  })
  const definitions = jargonToolDefinitions({}, store)
  const result = await pick(definitions, 'jargon_save').execute(
    { term: '跑一轮', definition: '一次完整回归' },
    fakeExec(),
  )
  assert.equal(seen.cwd, CWD)
  assert.equal(seen.input.by, 'agent')
  assert.equal(result.term, '跑一轮')
  assert.equal(result.total, 0)
})

test('jargon_delete removes by term', async () => {
  let seen
  const store = fakeStore({
    async remove(cwd, target) {
      seen = target
      return { terms: [], revision: 'rev3', file: path.join(CWD, '.dsh/jargon.json') }
    },
  })
  const definitions = jargonToolDefinitions({}, store)
  const result = await pick(definitions, 'jargon_delete').execute({ term: '三件套' }, fakeExec())
  assert.deepEqual(seen, { term: '三件套' })
  assert.equal(result.total, 0)
})

test('every tool fails loudly without a workspace instead of writing anywhere', async () => {
  const definitions = jargonToolDefinitions({}, fakeStore())
  for (const definition of definitions) {
    await assert.rejects(definition.execute({ term: 'x', definition: 'y' }, {}), /工作目录|workspace/i)
  }
})

test('registerTools registers each definition as an effect', () => {
  const registered = []
  const effects = []
  const ctx = {
    tools: { register: (definition) => (registered.push(definition.name), () => {}) },
    effect: (factory) => {
      effects.push(factory)
      factory()
      return () => {}
    },
  }
  registerTools(ctx, fakeStore())
  assert.deepEqual(registered, ['jargon_list', 'jargon_save', 'jargon_delete'])
  assert.equal(effects.length, 3)
})

test('registerTools is a no-op without a tool registry', () => {
  assert.doesNotThrow(() => registerTools({}, fakeStore()))
})
