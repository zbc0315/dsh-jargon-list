'use strict'

/**
 * @tom2012/dsh-jargon-list — agent 工具
 *
 * 三个窄工具，全部走同一个 JargonStore（与 UI 的同源路由同源语义）。
 * 形态照 @tom2012/dsh-notes：原生 ctx.tools.register + compileParameters，
 * 不 import dsh 内部包。
 *
 * 为什么需要这些工具：agent 给流程起短名是常态，但短名只在本项目里有意义，
 * 下一轮它就忘了。工具让「起名」这个动作顺手落成一条可查的记录，
 * 人和 agent 看的是同一份。
 */

const path = require('node:path')

/* ------------------------------------------------------------------ *
 * 参数编译：{ key: { required: true, ...schema } } → { type:'object', properties, required }
 * ------------------------------------------------------------------ */

function compileParameters(propertyMap) {
  const properties = {}
  const required = []
  for (const [key, definition] of Object.entries(propertyMap || {})) {
    if (!definition || typeof definition !== 'object') continue
    const { required: isRequired, ...rest } = definition
    if (isRequired === true) required.push(key)
    properties[key] = rest
  }
  const schema = { type: 'object', properties }
  if (required.length > 0) schema.required = required
  return schema
}

/* ------------------------------------------------------------------ *
 * 工作区
 * ------------------------------------------------------------------ */

/**
 * 取调用者会话的**原始项目目录**（header.cwd，不受 agent 的 cd 影响）。
 * @param {{ agent?: any }} exec 工具执行上下文。
 * @returns {string} 绝对路径。
 */
function workspaceOf(exec) {
  const session = exec && exec.agent && exec.agent.session
  const cwd = session && session.header && session.header.cwd
  if (typeof cwd === 'string' && cwd.trim() !== '') return path.resolve(cwd.trim())
  throw new Error('黑话单需要在一个有工作目录的会话里使用：拿不到当前会话的项目目录。')
}

/* ------------------------------------------------------------------ *
 * 工具定义
 * ------------------------------------------------------------------ */

/** 组装一个工具定义（与 dsh-notes 同形）。 */
function tool(name, description, parameters, execute) {
  return {
    name,
    description,
    parameters: compileParameters(parameters),
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: renderSummary(name, value) }],
    },
    execute,
  }
}

/** 工具结果的一行摘要（模型看到的就是这段）。 */
function renderSummary(name, value) {
  if (!value || typeof value !== 'object') return `${name}: done`
  if (name === 'jargon_list') {
    const terms = Array.isArray(value.terms) ? value.terms : []
    if (terms.length === 0) return 'jargon_list: 本项目还没有记录任何黑话。'
    const lines = terms.map((entry) => `- ${entry.term}：${oneLine(entry.definition)}`)
    return `jargon_list: 本项目 ${terms.length} 条黑话（${value.file || ''}）\n${lines.join('\n')}`
  }
  if (name === 'jargon_save') {
    return `jargon_save: ${value.updated ? '已更新' : '已记录'}「${value.term}」，共 ${value.total} 条。`
  }
  if (name === 'jargon_delete') {
    return `jargon_delete: 已删除「${value.term}」，剩 ${value.total} 条。`
  }
  return `${name}: ${JSON.stringify(value)}`
}

function oneLine(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

const TERM_PROPERTY = {
  type: 'string',
  required: true,
  description:
    'The project-local short name, exactly as it is used in conversation (up to 80 characters, e.g. "三件套").',
}

const DEFINITION_PROPERTY = {
  type: 'string',
  required: true,
  description:
    'What the name actually stands for, concretely: the steps, scope, inputs/outputs, or the decision it encodes. Up to 4000 characters; newlines are kept.',
}

/**
 * 构建三个工具定义。
 * @param {object} ctx Host 上下文（当前未使用，保留给将来的服务）。
 * @param {object} store JargonStore。
 * @returns {object[]} ToolDefinition[]
 */
function jargonToolDefinitions(ctx, store) {
  const list = tool(
    'jargon_list',
    'List this project\'s jargon: the short names coined during work in this project (not general terminology), each with the concrete meaning recorded for it. Read it before explaining a name you do not recognize, and before re-deriving a workflow someone may have already named. Newest-first.',
    {},
    async (_args, exec) => {
      const state = await store.read(workspaceOf(exec))
      return {
        file: state.file,
        total: state.terms.length,
        terms: state.terms.map((entry) => ({
          term: entry.term,
          definition: entry.definition,
          updatedAt: entry.updatedAt,
          updatedBy: entry.updatedBy,
        })),
      }
    },
  )

  const save = tool(
    'jargon_save',
    'Record or update one project-local short name (jargon) together with its exact meaning. Use it whenever you coin a shorthand for a multi-step procedure, a research flow, or a repeated operation, and whenever the user uses an unfamiliar code name: write the name plus the precise steps, scope, and output it stands for, so the user can understand it and you do not forget it next turn. Saving an existing term updates its meaning in place instead of adding a duplicate.',
    { term: TERM_PROPERTY, definition: DEFINITION_PROPERTY },
    async (args, exec) => {
      const cwd = workspaceOf(exec)
      const before = await store.read(cwd)
      const existing = before.terms.find(
        (entry) => entry.term.toLowerCase() === String(args.term || '').trim().toLowerCase(),
      )
      const result = await store.save(cwd, { term: args.term, definition: args.definition, by: 'agent' })
      return {
        term: result.entry.term,
        definition: result.entry.definition,
        updated: existing !== undefined,
        total: result.terms.length,
        file: result.file,
      }
    },
  )

  const remove = tool(
    'jargon_delete',
    'Delete one recorded jargon term from this project\'s list. Use it when a name is obsolete, was renamed, or was recorded by mistake; prefer jargon_save for correcting the meaning.',
    { term: TERM_PROPERTY },
    async (args, exec) => {
      const result = await store.remove(workspaceOf(exec), { term: args.term })
      return { term: String(args.term || '').trim(), total: result.terms.length, file: result.file }
    },
  )

  return [list, save, remove]
}

/**
 * 把三个工具注册到宿主，每个都包在 ctx.effect 里随插件卸载回收。
 * @param {object} ctx Host 上下文。
 * @param {object} store JargonStore。
 * @param {{ warn?: (message: string) => void }} [options]
 */
function registerTools(ctx, store, options) {
  const warn = (options && options.warn) || (() => {})
  const registry = ctx && ctx.tools
  if (!registry || typeof registry.register !== 'function') {
    warn('tools 服务不可用，黑话单工具未注册')
    return
  }
  for (const definition of jargonToolDefinitions(ctx, store)) {
    if (ctx.effect) ctx.effect(() => registry.register(definition), `jargon-list: tool ${definition.name}`)
    else registry.register(definition)
  }
}

module.exports = {
  compileParameters,
  jargonToolDefinitions,
  registerTools,
  workspaceOf,
}
