/**
 * 「当前会话的工作区」推导（设计稿 §5.3 / 评审决策 D1）。
 *
 * D1：黑话单锚定**会话 header 里的原始项目目录**，不跟随 agent 的 `cd`。
 * 所以 cwd 只从 `ctx.sessions.list` 的会话摘要上取（`byId[sessionId].cwd`），
 * 绝不用 `ctx.workingDirectory.get(session)`（那是会被 `cd` 改写的有效目录）。
 *
 * 会话不在内存（归档/已删除）时返回 null，面板显示「当前会话没有工作目录」，
 * 不崩、也不去猜别的目录。
 */

import { useEffect, useState } from 'react'

/** 取一个服务；拿不到就返回 undefined（服务形状不同不抛错）。 */
function service(ctx, name) {
  try {
    if (ctx && typeof ctx.get === 'function') return ctx.get(name)
  } catch {
    /* 退化 */
  }
  return undefined
}

/** cwd 的显示名：优先工作区行上的 title，退化为末段目录名。 */
function workspaceTitle(ctx, cwd) {
  try {
    const workspaces = service(ctx, 'workspaces')
    const snapshot = workspaces && workspaces.list && workspaces.list.getSnapshot()
    const items = (snapshot && snapshot.items) || []
    const hit = items.find((item) => item && item.path === cwd)
    if (hit) {
      const title = hit.title || hit.displayTitle || hit.name
      if (title) return title
    }
  } catch {
    /* 只影响显示名 */
  }
  const parts = String(cwd).split(/[\\/]/).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : String(cwd)
}

/** 同步读一次：`sessionId` → `{ cwd, title }`，拿不到返回 null。 */
export function readCurrentWorkspace(ctx, sessionId) {
  if (!sessionId) return null
  try {
    const sessions = service(ctx, 'sessions')
    const snapshot = sessions && sessions.list && sessions.list.getSnapshot()
    const summary = snapshot && snapshot.byId && snapshot.byId[sessionId]
    const cwd = summary && summary.cwd
    if (typeof cwd !== 'string' || cwd === '') return null
    return { cwd, title: workspaceTitle(ctx, cwd) }
  } catch {
    return null
  }
}

/**
 * React hook：跟随会话表变化重算工作区。
 * 订阅 `sessions.list`（会话新建/归档/切换都会换快照）；卸载退订。
 */
export function useCurrentWorkspace(ctx, sessionId) {
  const [workspace, setWorkspace] = useState(() => readCurrentWorkspace(ctx, sessionId))

  useEffect(() => {
    setWorkspace(readCurrentWorkspace(ctx, sessionId))
    const sessions = service(ctx, 'sessions')
    const store = sessions && sessions.list
    if (!store || typeof store.subscribe !== 'function') return undefined
    let off
    try {
      off = store.subscribe(() => setWorkspace(readCurrentWorkspace(ctx, sessionId)))
    } catch {
      off = undefined
    }
    return () => {
      if (typeof off !== 'function') return
      try {
        off()
      } catch {
        /* 退订失败不影响卸载 */
      }
    }
  }, [ctx, sessionId])

  return workspace
}
