/**
 * @tom2012/dsh-jargon-list — Client half 入口。
 *
 * 三样东西，全部走官方席位，不 import 任何 Harness Client 包：
 *   1. 右侧栏页签类型（`ctx.sidebarRightTabs.register`）+ 页签体（`sidebar.right.pane.tab` 的 keyed 席位）；
 *   2. 会话头部一个紧凑图标入口，点开同一个页签（`ctx.sidebarRight.openTab('jargon')`）；
 *   3. locale 字典 `jargonList`（键见 docs/contracts/api.md §3）。
 *
 * 页签体插槽的注册形状照 `@deepseek-ai/dsh-client-ui-sidebar-terminal` 逐字复制：
 * `{ name, key, locale, inject: (sessionId) => ({ sessionId }) }` —— 框架需要的字段一个不省，
 * 面板只读 `sessionId` 与标准 props。
 */

import * as React from 'react'

import { HeaderButtonIcon, JargonIcon } from './icons.js'
import { bindT, registerLocales, useT } from './i18n.js'
import { JargonPanel } from './panel.js'
import { installStyles } from './styles.js'

/** 页签类型 id 与 slot key（契约 §3）。 */
export const TAB_ID = '@tom2012/dsh-jargon-list'

/** 页签 kind：`ctx.sidebarRight.openTab('jargon')` 用它打开。 */
export const TAB_KIND = 'jargon'

/** locale namespace（契约 §3）。 */
export const LOCALE_NS = 'jargonList'

/** 会话头部入口的席位 id。 */
const HEADER_ENTRY_ID = 'jargon-open'

export const inject = ['slots']

/** 取一个可选服务：先走 ctx.get，再退化为直接属性；都拿不到返回 undefined。 */
function service(ctx, name) {
  try {
    if (ctx && typeof ctx.get === 'function') {
      const found = ctx.get(name)
      if (found !== undefined) return found
    }
  } catch {
    /* 服务未注册或形状不认识：继续退化 */
  }
  try {
    return ctx ? ctx[name] : undefined
  } catch {
    return undefined
  }
}

/**
 * 会话头部入口：紧凑图标按钮，点开右侧栏「黑话单」页签。
 * 只在有会话时渲染（本席位本身是 session 作用域，sessionId 缺失就不画）。
 */
function HeaderJargonButton(props) {
  const { ctx, sessionId } = props
  const ownT = useT(ctx)
  const t = typeof props.t === 'function' ? props.t : ownT
  if (!sessionId) return null

  const open = () => {
    const sidebar = service(ctx, 'sidebarRight')
    if (!sidebar) return
    // 先按设计稿的口径开当前会话的页签；宿主没有当前会话时退化为显式 session 版本。
    try {
      if (typeof sidebar.openTab === 'function') {
        sidebar.openTab(TAB_KIND)
        return
      }
    } catch {
      /* 落到 openTabIn */
    }
    try {
      if (typeof sidebar.openTabIn === 'function') sidebar.openTabIn(sessionId, TAB_KIND)
    } catch {
      /* 没有可打开的栏位就什么都不做，不抛给宿主 */
    }
  }

  return (
    <button
      type="button"
      className="jargon-header-btn"
      title={t('open')}
      aria-label={t('open')}
      onClick={open}
    >
      <HeaderButtonIcon size={16} />
    </button>
  )
}

/**
 * 插件浏览器半入口。
 * @param {object} ctx - Client root Context（`inject: ['slots']`）。
 */
export function apply(ctx) {
  // 每次都重新解析一次绑定：万一 apply 时 locale 服务还没就绪，标题也不会永久冻在退化字典上
  // （`locale.bind` 内部按 namespace 缓存，重复解析没有额外开销）。
  const t = (key, params) => bindT(ctx)(key, params)

  ctx.effect(() => installStyles(), 'jargon-list: styles')
  ctx.effect(() => registerLocales(ctx), 'jargon-list: copy')

  // 右侧栏是可选席位：宿主没有 sidebarRightTabs 时（例如精简客户端）静默跳过这一半，
  // 不能因为缺一个服务就让整个插件的 apply 抛错。
  const tabs = service(ctx, 'sidebarRightTabs')
  if (!tabs || typeof tabs.register !== 'function') return
  const slots = service(ctx, 'slots')
  if (!slots || typeof slots.inject !== 'function') return

  // 页签类型：只有类型、不声明 resource patterns；guide 里一条入口，openTab('jargon') 就打开它。
  ctx.effect(
    () =>
      tabs.register({
        id: TAB_ID,
        kind: TAB_KIND,
        priority: 'extension',
        title: () => t('title'),
        guide: [
          {
            id: 'open',
            order: 45,
            title: () => t('title'),
            description: () => t('guideDescription'),
            icon: JargonIcon,
          },
        ],
      }),
    'jargon-list: right tab type',
  )

  // 页签体：keyed 席位，sessionId 由 inject 注入，面板自己取数据。
  ctx.effect(
    () =>
      slots.inject('sidebar.right.pane.tab', () =>
        slots.register(
          {
            name: 'sidebar.right.pane.tab',
            key: TAB_ID,
            locale: LOCALE_NS,
            inject: (sessionId) => ({ sessionId }),
          },
          (props) => <JargonPanel ctx={ctx} {...props} />,
        ),
      ),
    'jargon-list: right tab body',
  )

  // 会话头部入口：紧凑图标按钮，点开同一个页签。
  ctx.effect(
    () =>
      slots.inject('conversation.session.header.utilities', () =>
        slots.register(
          {
            name: 'conversation.session.header.utilities',
            id: HEADER_ENTRY_ID,
            order: -20,
            locale: LOCALE_NS,
          },
          (props) => <HeaderJargonButton ctx={ctx} {...props} />,
        ),
      ),
    'jargon-list: session header entry',
  )
}
