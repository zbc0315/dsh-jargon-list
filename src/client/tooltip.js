/**
 * 黑话词条的悬浮解释卡片。
 *
 * 为什么不用 `title` 属性：系统 tooltip 有 1s 左右延迟、样式不可控、长定义会被截断。
 * 这里做一张跟随鼠标的卡片：portal 到 `body`（聊天容器会裁切 overflow），
 * 靠近视口边缘时自动翻转，滚动/移出/点击都收起。
 */

import { HIGHLIGHT_CLASS } from './highlight.js'

const TOOLTIP_ID = 'jargon-term-tooltip'
const SHOW_DELAY_MS = 120

/** 卡片内容：简称一行 + 解释若干行。 */
function render(term, definition) {
  const title = document.createElement('div')
  title.className = 'jargon-tip__term'
  title.textContent = term
  const body = document.createElement('div')
  body.className = 'jargon-tip__def'
  body.textContent = definition
  const frag = document.createDocumentFragment()
  frag.appendChild(title)
  frag.appendChild(body)
  return frag
}

/**
 * 安装悬浮卡片，返回 disposer。
 * @param {{ doc?: Document, win?: Window, lookup: (term: string) => { term: string, definition: string } | undefined }} options
 */
export function installTermTooltip(options = {}) {
  const doc = options.doc || (typeof document !== 'undefined' ? document : undefined)
  const win = options.win || (typeof window !== 'undefined' ? window : undefined)
  if (!doc || !win || !doc.body || typeof options.lookup !== 'function') return () => {}

  const el = doc.createElement('div')
  el.id = TOOLTIP_ID
  el.className = 'jargon-tip'
  el.setAttribute('role', 'tooltip')
  el.hidden = true
  doc.body.appendChild(el)

  let showTimer = 0
  let activeTerm = null

  const hide = () => {
    if (showTimer) {
      win.clearTimeout(showTimer)
      showTimer = 0
    }
    activeTerm = null
    el.hidden = true
  }

  const place = (event) => {
    const pad = 14
    const rect = el.getBoundingClientRect()
    const width = rect.width || 280
    const height = rect.height || 80
    let left = event.clientX + pad
    let top = event.clientY + pad
    if (left + width + 8 > win.innerWidth) left = Math.max(8, event.clientX - width - pad)
    if (top + height + 8 > win.innerHeight) top = Math.max(8, event.clientY - height - pad)
    el.style.left = `${Math.round(left)}px`
    el.style.top = `${Math.round(top)}px`
  }

  const show = (term, event) => {
    const entry = options.lookup(term)
    if (!entry) return
    activeTerm = term
    el.textContent = ''
    el.appendChild(render(entry.term, entry.definition))
    el.hidden = false
    el.style.left = '-9999px'
    el.style.top = '-9999px'
    place(event)
  }

  const onOver = (event) => {
    const target = event.target
    if (!target || typeof target.closest !== 'function') return
    const hit = target.closest(`.${HIGHLIGHT_CLASS}`)
    if (!hit) {
      if (activeTerm !== null) hide()
      return
    }
    const term = hit.getAttribute('data-jargon-term')
    if (!term) return
    if (term === activeTerm && el.hidden === false) {
      place(event)
      return
    }
    hide()
    showTimer = win.setTimeout(() => show(term, event), SHOW_DELAY_MS)
  }

  const onMove = (event) => {
    if (activeTerm === null || el.hidden) return
    place(event)
  }

  const onOut = (event) => {
    const target = event.target
    if (target && typeof target.closest === 'function' && target.closest(`.${HIGHLIGHT_CLASS}`)) hide()
  }

  doc.addEventListener('mouseover', onOver, true)
  doc.addEventListener('mousemove', onMove, true)
  doc.addEventListener('mouseout', onOut, true)
  doc.addEventListener('scroll', hide, true)
  doc.addEventListener('click', hide, true)
  win.addEventListener('blur', hide)

  return () => {
    hide()
    doc.removeEventListener('mouseover', onOver, true)
    doc.removeEventListener('mousemove', onMove, true)
    doc.removeEventListener('mouseout', onOut, true)
    doc.removeEventListener('scroll', hide, true)
    doc.removeEventListener('click', hide, true)
    win.removeEventListener('blur', hide)
    try {
      el.remove()
    } catch {
      /* 已移除 */
    }
  }
}
