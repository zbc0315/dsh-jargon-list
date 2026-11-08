/**
 * 样式：只用宿主的 `--dsw-*` 令牌（`--dsw-alias-*` / `--dsw-radius-*` / `--dsw-font-family`），
 * 不写字面色值（`currentColor` / `transparent` / `inherit` 是关键字，不是色值），
 * 不加动画，不覆盖宿主选择器；所有类名带 `jargon-` 前缀。
 *
 * `installStyles()` 幂等注入一次，返回清理函数（交给 `ctx.effect`，插件卸载时移除）。
 */

const STYLE_ID = 'dsh-jargon-list-styles'

const CSS = `
.jargon-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  height: 100%;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
  font-size: 13px;
}

/* ---------- 工具条：搜索 + 新增 ---------- */
.jargon-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding: 10px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
}
.jargon-search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-tertiary);
}
.jargon-search:focus-within { border-color: var(--dsw-alias-brand-primary); }
.jargon-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
}
.jargon-search input::placeholder { color: var(--dsw-alias-label-tertiary); }

/* ---------- 按钮 ---------- */
.jargon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.jargon-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.jargon-btn:disabled { opacity: .45; cursor: default; }
.jargon-btn.is-primary {
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
}
.jargon-btn.is-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }

.jargon-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.jargon-icon-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }

/* 行内文字按钮（编辑 / 删除 / 展开） */
.jargon-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.jargon-link:hover { color: var(--dsw-alias-label-primary); }
.jargon-link.is-danger { color: var(--dsw-alias-label-tertiary); }
.jargon-link.is-danger:hover { color: var(--dsw-alias-label-error); }
.jargon-link.is-danger.is-armed {
  color: var(--dsw-alias-label-error);
  background: var(--dsw-alias-interactive-bg-hover-danger);
  border-radius: var(--dsw-radius-sm, 6px);
  padding: 0 4px;
}

.jargon-btn:focus-visible,
.jargon-icon-btn:focus-visible,
.jargon-link:focus-visible,
.jargon-row:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 1px;
}

/* ---------- 错误条 ---------- */
.jargon-banner {
  flex: none;
  margin: 10px 12px 0;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-state-error-primary);
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-error);
  font-size: 12px;
  line-height: 1.6;
}
.jargon-banner-text { overflow-wrap: anywhere; }
.jargon-banner-meta {
  margin-top: 2px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.jargon-banner-actions { display: flex; gap: 8px; margin-top: 6px; }

/* ---------- 列表 ---------- */
.jargon-scroll {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  padding: 8px 10px 16px;
  overflow-y: auto;
}
.jargon-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.jargon-row {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-1);
  padding: 8px 10px;
  min-width: 0;
}
.jargon-row:hover { border-color: var(--dsw-alias-border-l3); }
.jargon-row-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.jargon-term {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  overflow-wrap: anywhere;
}
.jargon-row-actions {
  display: none;
  align-items: center;
  gap: 8px;
  flex: none;
}
.jargon-row:hover .jargon-row-actions,
.jargon-row:focus-within .jargon-row-actions { display: flex; }
@media (hover: none) {
  .jargon-row-actions { display: flex; }
}

.jargon-def {
  margin: 4px 0 0;
  color: var(--dsw-alias-label-secondary);
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.jargon-def.is-collapsed {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
.jargon-expand {
  margin-top: 2px;
  display: inline-block;
}
.jargon-meta {
  margin: 6px 0 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 1.5;
}

/* ---------- 就地编辑 ---------- */
.jargon-editor-title {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 600;
}
.jargon-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-1);
  padding: 10px;
}
.jargon-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.jargon-field-label {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.jargon-input,
.jargon-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  padding: 5px 7px;
  outline: 0;
}
.jargon-input:focus,
.jargon-textarea:focus { border-color: var(--dsw-alias-brand-primary); }
.jargon-input::placeholder,
.jargon-textarea::placeholder { color: var(--dsw-alias-label-tertiary); }
.jargon-textarea { resize: vertical; min-height: 76px; line-height: 1.6; }
.jargon-form-error {
  margin: 0;
  color: var(--dsw-alias-label-error);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.jargon-editor-actions { display: flex; align-items: center; gap: 8px; }
.jargon-editor-hint {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}

/* ---------- 空态 / 加载 ---------- */
.jargon-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  padding: 28px 18px;
  text-align: center;
  color: var(--dsw-alias-label-tertiary);
  line-height: 1.7;
}
.jargon-empty-title { color: var(--dsw-alias-label-secondary); font-weight: 600; }
.jargon-muted {
  margin: 10px 12px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---------- 会话头部入口 ---------- */
.jargon-header-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.jargon-header-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.jargon-header-btn:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: -2px;
}
`

/**
 * 注入一次样式（幂等）。返回清理函数：移除 <style> 并复位注入标记。
 * 拿不到 `document`（例如在 Node 里 import）时什么都不做。
 */
export function installStyles() {
  if (typeof document === 'undefined' || !document.head) return () => {}
  const existing = document.getElementById(STYLE_ID)
  if (existing) return () => {}

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.append(style)

  return () => {
    if (typeof document === 'undefined') return
    const node = document.getElementById(STYLE_ID)
    if (node) node.remove()
  }
}
