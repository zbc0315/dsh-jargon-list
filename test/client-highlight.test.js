'use strict'

/**
 * 正文高亮的纯逻辑契约：
 *   · 中文按子串、英文按词边界（PR 不能命中 PRACTICE）；
 *   · 长词优先（黑话单 不能被 黑话 抢走）；
 *   · 大小写/全半角折叠；
 *   · 代码、链接、公式、我们自己的 span 都不碰；
 *   · 重复装饰是幂等的（span 里的文本不再命中）。
 */

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildMatcher,
  foldTerm,
  shouldDecorate,
  readSessionId,
  textBodies,
  HIGHLIGHT_CLASS,
} = require('../src/client/highlight.js')

function entry(term, definition = '') {
  return { term, definition }
}

test('Chinese terms match as substrings', () => {
  const matcher = buildMatcher([entry('三件套', '三步')])
  const hits = matcher.match('今天先跑三件套，然后再说')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].term, '三件套')
  assert.equal(hits[0].definition, '三步')
  assert.equal('今天先跑三件套，然后再说'.slice(hits[0].start, hits[0].end), '三件套')
})

test('ASCII terms respect word boundaries (PR must not hit PRACTICE)', () => {
  const matcher = buildMatcher([entry('PR', 'pull request')])
  assert.equal(matcher.match('走 PRACTICE 流程').length, 0)
  assert.equal(matcher.match('先 README 再 PR').length, 1)
  assert.equal(matcher.match('pr 小写也算').length, 1)
})

test('the longest term wins at the same position', () => {
  const matcher = buildMatcher([entry('黑话', '短'), entry('黑话单', '长')])
  const hits = matcher.match('打开黑话单看看')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].term, '黑话单')
})

test('case and full-width variants fold together', () => {
  const matcher = buildMatcher([entry('SSS', '三个 s'), entry('ＡＢＣ', '全角')])
  assert.equal(matcher.match('sss 也行').length, 1)
  assert.equal(matcher.match('ABC 也行').length, 1, 'full-width term should match the ASCII form')
  assert.ok(matcher.definitionFor('abc'), 'lookup folds width and case')
})

test('empty or blank term lists produce an inert matcher', () => {
  const matcher = buildMatcher([{ term: '   ', definition: 'x' }, null])
  assert.equal(matcher.isEmpty, true)
  assert.deepEqual(matcher.match('随便写点什么'), [])
  assert.equal(matcher.definitionFor('随便'), undefined)
})

test('foldTerm normalizes width, case and surrounding space', () => {
  assert.equal(foldTerm('  ＡＢＣ  '), 'abc')
  assert.equal(foldTerm('三件套'), '三件套')
})

/** 造一个最小节点链：textNode → parent → …，每层实现 closest() 与 tagName。 */
function chain(tags, classes = []) {
  const nodes = tags.map((tagName, index) => ({
    tagName,
    classList: { contains: (name) => classes.includes(name) },
    closest(selector) {
      if (selector.startsWith('.') && classes.includes(selector.slice(1))) return this
      if (selector === '.katex' || selector === '.katex-display') return undefined
      if (selector === '[data-jargon-skip]') return undefined
      return undefined
    },
    parentElement: undefined,
  }))
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].parentElement = nodes[i + 1]
  return nodes
}

function textNodeIn(tags, value = '三件套', classes = []) {
  const nodes = chain(tags, classes)
  // 文本节点的 parentElement 就是链的第一层（CODE / A / P …），不能再被展开覆盖。
  return { nodeType: 3, nodeValue: value, parentElement: nodes[0] }
}

test('code, links, formulas and our own spans are skipped', () => {
  assert.equal(shouldDecorate(textNodeIn(['P', 'DIV'])), true)
  assert.equal(shouldDecorate(textNodeIn(['CODE', 'P', 'DIV'])), false, 'inline code')
  assert.equal(shouldDecorate(textNodeIn(['PRE', 'DIV'])), false, 'code block')
  assert.equal(shouldDecorate(textNodeIn(['A', 'P', 'DIV'])), false, 'link text')
  assert.equal(shouldDecorate(textNodeIn(['SPAN', 'P', 'DIV'], '三件套', [HIGHLIGHT_CLASS])), false, 'our own span')
  assert.equal(shouldDecorate(textNodeIn(['P', 'DIV'], '   ')), false, 'whitespace only')
  assert.equal(shouldDecorate({ nodeType: 1 }), false, 'not a text node')
})

test('session id comes from the conversation root attribute', () => {
  const doc = {
    querySelector(selector) {
      if (selector === '[data-conversation-session]') {
        return { getAttribute: () => 'session-abc' }
      }
      return null
    },
  }
  assert.equal(readSessionId(doc), 'session-abc')
  assert.equal(readSessionId({ querySelector: () => null }), undefined)
  assert.equal(readSessionId(undefined), undefined)
})

test('text bodies are collected only inside the chat region', () => {
  const bodies = [{ id: 1 }, { id: 2 }]
  const region = { querySelectorAll: (selector) => (selector === '[data-text-interaction-source]' ? bodies : []) }
  const doc = { querySelector: () => region }
  assert.deepEqual(textBodies(doc), bodies)
  assert.deepEqual(textBodies({ querySelector: () => null }), [], 'a null region has nothing to scan')
})
