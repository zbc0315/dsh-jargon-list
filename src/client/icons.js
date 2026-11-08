/**
 * 图标：全部内联 SVG，只吃 `currentColor`，跟随宿主深浅色。
 *
 * 统一 24×24 视框、1.7 描边，与 DSH 自身的线性图标同调（同一套视觉约定见
 * `@tom2012/dsh-notes` 的 src/client/icons.js）。
 */

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/**
 * 页签类型 / guide 条目图标：一张带两条字行的书签卡片（“黑话单”本身就是一条条词条）。
 * 宿主按 `size` 传给 guide（22/26），也会在别的投影里传 16，所以尺寸完全由调用方决定。
 */
export function JargonIcon({ size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-13Z" {...S} />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" {...S} />
    </svg>
  )
}

/** 会话头部的紧凑入口按钮：小一号的同款词条卡片。 */
export function HeaderButtonIcon({ size = 16 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path d="M5.5 6A1.5 1.5 0 0 1 7 4.5h10A1.5 1.5 0 0 1 18.5 6v12.5A1.5 1.5 0 0 1 17 20H7a1.5 1.5 0 0 1-1.5-1.5V6Z" {...S} />
      <path d="M9 9.5h6M9 13h6M9 16.5h3.5" {...S} />
    </svg>
  )
}

/** 工具条「新增」前的加号。 */
export function PlusIcon({ size = 13 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" fill="none">
      <path d="M12 5.5v13M5.5 12h13" {...S} />
    </svg>
  )
}

/** 搜索框左端的放大镜。 */
export function SearchIcon({ size = 13 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" fill="none">
      <circle cx="11" cy="11" r="5.75" {...S} />
      <path d="M15.4 15.4 19 19" {...S} />
    </svg>
  )
}

/** 搜索框右端的清空叉。 */
export function CloseIcon({ size = 12 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" fill="none">
      <path d="M6 6l12 12M18 6 6 18" {...S} />
    </svg>
  )
}
