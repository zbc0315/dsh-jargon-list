'use strict'

/**
 * 面板纯逻辑（src/client/panel-logic.js）：搜索过滤、折叠判定、错误码 → 文案、
 * 过期响应判定、时间戳格式。都是纯函数，直接 import 断言。
 */

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  COLLAPSE_CHARS,
  DELETE_CONFIRM_MS,
  POLL_MS,
  byLabel,
  errorText,
  filterTerms,
  formatStamp,
  isStaleResponse,
  shouldCollapse,
} = require('../src/client/panel-logic.js')

/** 伪翻译：`key(k=v)` 便于断言参数传到了。 */
function fakeT(key, params) {
  if (!params) return key
  return `${key}(${Object.entries(params)
    .map(([name, value]) => `${name}=${value}`)
    .join(',')})`
}

const TERMS = [
  { id: 'a', term: '三件套', definition: '先查实现，再读文档，最后跑测试' },
  { id: 'b', term: 'Rolling', definition: '跑一轮完整验证 RELEASE 流程' },
  { id: 'c', term: '归档链', definition: '研究结束后把结论写回 docs' },
]

test('filterTerms：空查询原样返回全部，且不复制数组', () => {
  assert.equal(filterTerms(TERMS, '').length, 3)
  assert.equal(filterTerms(TERMS, ''), TERMS)
  assert.equal(filterTerms(TERMS, '   ').length, 3)
  assert.equal(filterTerms(TERMS, undefined).length, 3)
  assert.equal(filterTerms(TERMS, null).length, 3)
})

test('filterTerms：命中黑话本身（大小写不敏感）', () => {
  assert.deepEqual(
    filterTerms(TERMS, '三件套').map((item) => item.id),
    ['a'],
  )
  assert.deepEqual(
    filterTerms(TERMS, 'rolling').map((item) => item.id),
    ['b'],
  )
  assert.deepEqual(
    filterTerms(TERMS, 'ROLL').map((item) => item.id),
    ['b'],
  )
})

test('filterTerms：命中详细说明中的子串', () => {
  assert.deepEqual(
    filterTerms(TERMS, '文档').map((item) => item.id),
    ['a'],
  )
  assert.deepEqual(
    filterTerms(TERMS, 'docs').map((item) => item.id),
    ['c'],
  )
})

test('filterTerms：没有命中返回空数组；非数组输入不崩', () => {
  assert.deepEqual(filterTerms(TERMS, '不存在的词'), [])
  assert.deepEqual(filterTerms(null, 'x'), [])
  assert.deepEqual(filterTerms(undefined, ''), [])
  assert.deepEqual(filterTerms([], 'x'), [])
})

test('filterTerms：三条以内按原顺序（服务端按 updatedAt 倒序）返回', () => {
  const ids = filterTerms(TERMS, 'e').map((item) => item.id)
  assert.deepEqual(ids, ['b', 'c'].filter((id) => ids.includes(id)))
})

test('shouldCollapse：3 行以内且 120 字以内不折起', () => {
  assert.equal(shouldCollapse('短说明'), false)
  assert.equal(shouldCollapse('一\n二\n三'), false)
  assert.equal(shouldCollapse('x'.repeat(COLLAPSE_CHARS)), false)
  assert.equal(shouldCollapse(''), false)
  assert.equal(shouldCollapse(undefined), false)
})

test('shouldCollapse：超过 3 行 或 超过 120 字为 true', () => {
  assert.equal(shouldCollapse('一\n二\n三\n四'), true)
  assert.equal(shouldCollapse('x'.repeat(COLLAPSE_CHARS + 1)), true)
  // 说明里混用 \r\n 也要按行算
  assert.equal(shouldCollapse('一\r\n二\r\n三\r\n四'), true)
  assert.equal(shouldCollapse('一\r\n二\r\n三'), false)
})

test('errorText：契约 §4 的每个 code 都有中英都有的文案键', () => {
  assert.equal(errorText('no-session', '', '', fakeT), 'errorNoSession')
  assert.equal(errorText('no-workspace', '', '', fakeT), 'errorNoWorkspace')
  assert.equal(errorText('invalid-term', '', '', fakeT), 'errorInvalidTerm')
  assert.equal(errorText('duplicate-term', '已存在同名黑话：三件套', '', fakeT), 'errorDuplicateTerm')
  assert.equal(errorText('definition-too-long', '', '', fakeT), 'errorDefinitionTooLong')
  assert.equal(errorText('not-found', '', '', fakeT), 'errorNotFound')
})

test('errorText：corrupt 带上文件路径参数（没有已知路径时退回服务端 message）', () => {
  assert.equal(
    errorText('corrupt', '坏文件', '/tmp/ws/.dsh/jargon.json', fakeT),
    'errorCorrupt(file=/tmp/ws/.dsh/jargon.json)',
  )
  assert.equal(errorText('corrupt', '/tmp/ws/.dsh/jargon.json', '', fakeT), 'errorCorrupt(file=/tmp/ws/.dsh/jargon.json)')
})

test('errorText：未知 code 直接显示服务端 message，空 message 退到通用文案', () => {
  assert.equal(errorText('bad-request', 'JSON 解析失败', '', fakeT), 'JSON 解析失败')
  assert.equal(errorText('io-error', '磁盘只读', '', fakeT), '磁盘只读')
  assert.equal(errorText(undefined, '', '', fakeT), 'errorUnknown')
  assert.equal(errorText('weird', '', '', fakeT), 'errorUnknown')
})

test('errorText：网络失败有自己的文案键；没有 t 时退化为键名而不是抛错', () => {
  assert.equal(errorText('network', 'Failed to fetch', '', fakeT), 'errorNetwork')
  assert.equal(errorText('duplicate-term'), 'errorDuplicateTerm')
})

test('isStaleResponse：会话不同 / 序号更旧 为 true，同一个最新请求为 false', () => {
  const current = { seq: 7, session: 's1' }
  assert.equal(isStaleResponse({ current, response: { seq: 7, session: 's1' } }), false)
  assert.equal(isStaleResponse({ current, response: { seq: 6, session: 's1' } }), true)
  assert.equal(isStaleResponse({ current, response: { seq: 7, session: 's2' } }), true)
  assert.equal(isStaleResponse({ current, response: { seq: 8, session: 's1' } }), false)
})

test('isStaleResponse：缺参数一律当过期（宁可丢一次也不覆盖新数据）', () => {
  assert.equal(isStaleResponse({}), true)
  assert.equal(isStaleResponse({ current: { seq: 1, session: 's' } }), true)
  assert.equal(isStaleResponse({ response: { seq: 1, session: 's' } }), true)
  assert.equal(isStaleResponse(), true)
})

test('formatStamp：ISO 时间转本地 MM-DD HH:mm；坏输入返回空串', () => {
  const stamp = formatStamp('2026-11-08T08:12:00.000Z')
  assert.match(stamp, /^\d{2}-\d{2} \d{2}:\d{2}$/)
  assert.equal(formatStamp(''), '')
  assert.equal(formatStamp(null), '')
  assert.equal(formatStamp('not-a-date'), '')
})

test('byLabel：agent 与 user 两种来源各取各的文案键', () => {
  assert.equal(byLabel('agent', fakeT), 'byAgent')
  assert.equal(byLabel('user', fakeT), 'byUser')
  assert.equal(byLabel(undefined, fakeT), 'byUser')
})

test('时间常量符合设计稿：轮询 2000ms、删除确认 3000ms', () => {
  assert.equal(POLL_MS, 2000)
  assert.equal(DELETE_CONFIRM_MS, 3000)
})
