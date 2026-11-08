/**
 * 右侧栏「黑话单」页签面板（设计稿 §5.7）。
 *
 * 数据只有一条路：同源 `/-/jargon`（api.js）。挂载即拉、页签可见时 2000ms 轮询、
 * 回前台立即拉；所有读请求带 AbortController + 单调请求序号，过期响应按
 * `isStaleResponse` 丢弃；写操作直接用响应体回填，不等下一轮轮询。
 *
 * 面板只认 slot 给的标准 props（`sessionId` / `t` / `useTabInfo`），不向宿主索要数据。
 */

import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { api, isAbortError } from './api.js'
import { CloseIcon, PlusIcon, SearchIcon } from './icons.js'
import { useT } from './i18n.js'
import {
  DELETE_CONFIRM_MS,
  POLL_MS,
  byLabel,
  errorText,
  filterTerms,
  formatStamp,
  isStaleResponse,
  shouldCollapse,
} from './panel-logic.js'
import { useCurrentWorkspace } from './workspace.js'

export { DELETE_CONFIRM_MS, POLL_MS, errorText, filterTerms, formatStamp, isStaleResponse, shouldCollapse }

/** 面板初始状态。 */
const INITIAL = { phase: 'idle', terms: [], revision: null, file: null, error: null }

function abort(ref) {
  const controller = ref.current
  ref.current = null
  if (!controller) return
  try {
    controller.abort()
  } catch {
    /* 已中止 */
  }
}

function isVisibleNow() {
  try {
    return typeof document === 'undefined' || document.visibilityState !== 'hidden'
  } catch {
    return true
  }
}

/** 从 mutate 响应回填列表；`entry` 只在 save 时出现，这里不需要它。 */
function fromResponse(body, previous) {
  return {
    phase: 'ready',
    terms: Array.isArray(body.terms) ? body.terms : [],
    revision: body.revision || null,
    file: body.file || (previous && previous.file) || null,
    error: null,
  }
}

/** 就地编辑表单（新增与编辑共用）。 */
function TermEditor({ draft, t, saving, error, onDraftChange, onSave, onCancel, autoFocus }) {
  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onSave()
    }
  }

  return (
    <form
      className="jargon-editor"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
      onKeyDown={onKeyDown}
    >
      <div className="jargon-editor-title">{draft.id ? t('editTermTitle') : t('newTermTitle')}</div>
      <label className="jargon-field">
        <span className="jargon-field-label">{t('termLabel')}</span>
        <input
          className="jargon-input"
          type="text"
          value={draft.term}
          maxLength={120}
          autoFocus={autoFocus}
          placeholder={t('termPlaceholder')}
          onChange={(event) => onDraftChange({ term: event.target.value })}
        />
      </label>
      <label className="jargon-field">
        <span className="jargon-field-label">{t('definitionLabel')}</span>
        <textarea
          className="jargon-textarea"
          value={draft.definition}
          rows={5}
          placeholder={t('definitionPlaceholder')}
          onChange={(event) => onDraftChange({ definition: event.target.value })}
        />
      </label>
      {error ? (
        <p className="jargon-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="jargon-editor-actions">
        <button type="submit" className="jargon-btn is-primary" disabled={saving}>
          {saving ? t('saving') : t('save')}
        </button>
        <button type="button" className="jargon-btn" onClick={onCancel} disabled={saving}>
          {t('cancel')}
        </button>
        <span className="jargon-editor-hint">{t('editorHint')}</span>
      </div>
    </form>
  )
}

/** 一条黑话（或它的编辑形态）。 */
function TermRow({ item, t, expanded, armed, deleting, onEdit, onDelete, onToggleExpand }) {
  const collapsible = shouldCollapse(item.definition)
  return (
    <li className="jargon-row">
      <div className="jargon-row-head">
        <span className="jargon-term">{item.term}</span>
        <span className="jargon-row-actions">
          <button type="button" className="jargon-link" onClick={() => onEdit(item)}>
            {t('edit')}
          </button>
          <button
            type="button"
            className={armed ? 'jargon-link is-danger is-armed' : 'jargon-link is-danger'}
            onClick={() => onDelete(item)}
            disabled={deleting}
            aria-label={armed ? t('confirmDelete') : t('delete')}
          >
            {deleting ? t('delete') : armed ? t('confirmDelete') : t('delete')}
          </button>
        </span>
      </div>
      <p className={collapsible && !expanded ? 'jargon-def is-collapsed' : 'jargon-def'}>
        {item.definition}
      </p>
      {collapsible ? (
        <button type="button" className="jargon-link jargon-expand" onClick={() => onToggleExpand(item.id)}>
          {expanded ? t('collapse') : t('expand')}
        </button>
      ) : null}
      <p className="jargon-meta">
        {t('metaBy', {
          who: byLabel(item.updatedBy, t),
          time: formatStamp(item.updatedAt),
        })}
      </p>
    </li>
  )
}

/**
 * 页签体。
 * @param {object} props - slot 标准 props + `ctx`：`{ ctx, sessionId, t?, useTabInfo? }`。
 */
/**
 * 渲染降级边界：面板自己出 bug 时只坏这一个页签，而不是让 slot entry 整块变成空白。
 *
 * 宿主对抛错组件的处理是「把该 slot entry 崩掉」（console: slot entry crashed in '<slot>'），
 * 不会影响应用外壳；这里再加一层，把它变成一条可读错误 + 「重试」，成本很低。
 */
class JargonBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.retry = () => this.setState({ error: null })
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    try {
      console.error('[jargon-list] panel crashed', error)
    } catch {
      /* 忽略 */
    }
  }

  render() {
    if (this.state.error) {
      const message = (this.state.error && this.state.error.message) || String(this.state.error)
      return (
        <div className="jargon-panel jargon-crash">
          <div className="jargon-empty-title">{this.props.label}</div>
          <div className="jargon-error-detail">{message}</div>
          <button type="button" className="jargon-btn" onClick={this.retry}>
            {this.props.retryLabel}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function JargonPanel(props) {
  const { ctx } = props
  const t = useT(ctx)
  return (
    <JargonBoundary
      label={t('errorUnknown')}
      retryLabel={t('retry')}
    >
      <JargonPanelBody {...props} />
    </JargonBoundary>
  )
}

function JargonPanelBody(props) {
  const { ctx, sessionId, useTabInfo } = props
  const ownT = useT(ctx)
  const t = typeof props.t === 'function' ? props.t : ownT

  // 页签可见性由宿主的 hookContext 提供；本组件只在本席位使用，所以这个判断在实例内恒定
  // （不构成条件 hook 的漂移），备用分支让组件在没有该 hook 的席位里也能渲染。
  const tabInfo = typeof useTabInfo === 'function' ? useTabInfo() : null
  const tabVisible = !tabInfo || !tabInfo.tab || tabInfo.tab.visible !== false

  const workspace = useCurrentWorkspace(ctx, sessionId)
  const cwd = workspace ? workspace.cwd : null

  const [data, setData] = useState(INITIAL)
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [armedId, setArmedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const aliveRef = useRef(true)
  const seqRef = useRef(0)
  const latestRef = useRef({ seq: 0, session: sessionId })
  const readAbortRef = useRef(null)
  const writeAbortRef = useRef(null)
  const armTimerRef = useRef(null)

  const clearArmTimer = useCallback(() => {
    if (armTimerRef.current === null) return
    clearTimeout(armTimerRef.current)
    armTimerRef.current = null
  }, [])

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      clearArmTimer()
      abort(readAbortRef)
      abort(writeAbortRef)
    }
  }, [clearArmTimer])

  /** 拉一次状态。`silent` 用于轮询：不把已有列表切回 loading。 */
  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!sessionId) return
      const request = { seq: (seqRef.current += 1), session: sessionId }
      latestRef.current = request
      abort(readAbortRef)
      const controller = typeof AbortController === 'function' ? new AbortController() : null
      readAbortRef.current = controller

      if (!cwd) {
        if (!aliveRef.current) return
        setData((prev) => ({
          ...prev,
          phase: 'error',
          error: { code: 'no-workspace', message: '' },
        }))
        return
      }

      if (!silent && aliveRef.current) {
        setData((prev) => (prev.phase === 'ready' ? { ...prev, phase: 'refreshing' } : { ...prev, phase: 'loading' }))
      }

      try {
        const body = await api.state({
          session: sessionId,
          cwd,
          signal: controller ? controller.signal : undefined,
        })
        if (!aliveRef.current) return
        if (isStaleResponse({ current: latestRef.current, response: request })) return
        setData(fromResponse(body, null))
      } catch (error) {
        if (isAbortError(error)) return
        if (!aliveRef.current) return
        if (isStaleResponse({ current: latestRef.current, response: request })) return
        setData((prev) => ({
          ...prev,
          phase: 'error',
          error: { code: error.code || 'http-error', message: error.message || '' },
        }))
      }
    },
    [sessionId, cwd],
  )

  // 挂载 / 换会话 / 换工作区：立刻拉一次。
  useEffect(() => {
    void load()
  }, [load])

  // 页签可见时轮询；回到前台立即拉一次并恢复轮询，切走则暂停。
  useEffect(() => {
    if (!tabVisible) return undefined
    let timer = null
    const stop = () => {
      if (timer === null) return
      clearInterval(timer)
      timer = null
    }
    const start = () => {
      if (timer !== null) return
      timer = setInterval(() => {
        if (isVisibleNow()) void load({ silent: true })
      }, POLL_MS)
    }
    const onVisibilityChange = () => {
      if (isVisibleNow()) {
        void load({ silent: true })
        start()
      } else {
        stop()
      }
    }
    if (isVisibleNow()) start()
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stop()
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [tabVisible, load])

  /**
   * 写操作成功后直接用响应体回填，并**提升请求序号 + 中止在途读**：
   * 否则一个先发出、后返回的 GET 会把刚写好的列表盖回旧内容（要等下一轮轮询才恢复）。
   */
  const applyWrite = useCallback(
    (body) => {
      abort(readAbortRef)
      const request = { seq: (seqRef.current += 1), session: sessionId }
      latestRef.current = request
      setData((prev) => fromResponse(body, prev))
    },
    [sessionId],
  )

  const closeDraft = useCallback(() => {
    setDraft(null)
    setFormError(null)
  }, [])

  const openCreate = useCallback(() => {
    clearArmTimer()
    setArmedId(null)
    setFormError(null)
    setDraft({ id: null, term: '', definition: '' })
  }, [clearArmTimer])

  const openEdit = useCallback(
    (item) => {
      clearArmTimer()
      setArmedId(null)
      setFormError(null)
      setDraft({ id: item.id, term: item.term, definition: item.definition })
    },
    [clearArmTimer],
  )

  const updateDraft = useCallback((patch) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const saveDraft = useCallback(async () => {
    if (!draft || saving) return
    if (!cwd) {
      setFormError(errorText('no-workspace', '', data.file, t))
      return
    }
    const term = String(draft.term || '').trim()
    const definition = String(draft.definition || '').trim()
    if (term === '') {
      setFormError(errorText('invalid-term', '', data.file, t))
      return
    }

    setSaving(true)
    setFormError(null)
    abort(writeAbortRef)
    const controller = typeof AbortController === 'function' ? new AbortController() : null
    writeAbortRef.current = controller
    try {
      const body = await api.mutate({
        session: sessionId,
        cwd,
        action: 'save',
        ...(draft.id ? { id: draft.id } : {}),
        term,
        definition,
        signal: controller ? controller.signal : undefined,
      })
      if (!aliveRef.current) return
      applyWrite(body)
      closeDraft()
    } catch (error) {
      if (isAbortError(error)) return
      if (!aliveRef.current) return
      setFormError(errorText(error.code, error.message, data.file, t))
    } finally {
      if (aliveRef.current) setSaving(false)
    }
  }, [applyWrite, closeDraft, cwd, data.file, draft, saving, sessionId, t])

  const performDelete = useCallback(
    async (item) => {
      if (!cwd) {
        setData((prev) => ({ ...prev, phase: 'error', error: { code: 'no-workspace', message: '' } }))
        return
      }
      setDeletingId(item.id)
      abort(writeAbortRef)
      const controller = typeof AbortController === 'function' ? new AbortController() : null
      writeAbortRef.current = controller
      try {
        const body = await api.mutate({
          session: sessionId,
          cwd,
          action: 'delete',
          id: item.id,
          signal: controller ? controller.signal : undefined,
        })
        if (!aliveRef.current) return
        applyWrite(body)
      } catch (error) {
        if (isAbortError(error)) return
        if (!aliveRef.current) return
        setData((prev) => ({
          ...prev,
          phase: 'error',
          error: { code: error.code || 'http-error', message: error.message || '' },
        }))
      } finally {
        if (aliveRef.current) setDeletingId(null)
      }
    },
    [applyWrite, cwd, sessionId],
  )

  /** 删除要两次点击：第一次进入 3 秒确认窗口，第二次真删。 */
  const requestDelete = useCallback(
    (item) => {
      if (deletingId !== null) return
      if (armedId !== item.id) {
        clearArmTimer()
        setArmedId(item.id)
        armTimerRef.current = setTimeout(() => {
          armTimerRef.current = null
          if (aliveRef.current) setArmedId(null)
        }, DELETE_CONFIRM_MS)
        return
      }
      clearArmTimer()
      setArmedId(null)
      void performDelete(item)
    },
    [armedId, clearArmTimer, deletingId, performDelete],
  )

  const toggleExpanded = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const terms = data.terms || []
  const visibleTerms = useMemo(() => filterTerms(terms, query), [terms, query])
  const creating = !!draft && !draft.id
  const retry = useCallback(() => {
    void load()
  }, [load])

  const showLoading = data.phase === 'loading' && terms.length === 0
  const showEmpty = data.phase === 'ready' && !data.error && !creating && terms.length === 0
  const showNoResults = data.phase === 'ready' && !data.error && terms.length > 0 && visibleTerms.length === 0

  return (
    <div className="jargon-panel">
      <div className="jargon-toolbar">
        <div className="jargon-search">
          <SearchIcon size={13} />
          <input
            type="search"
            value={query}
            aria-label={t('search')}
            placeholder={t('search')}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="jargon-icon-btn"
              aria-label={t('clearSearch')}
              onClick={() => setQuery('')}
            >
              <CloseIcon size={12} />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="jargon-btn is-primary"
          onClick={openCreate}
          disabled={!cwd || creating}
          title={t('new')}
        >
          <PlusIcon size={13} />
          {t('new')}
        </button>
      </div>

      {data.error ? (
        <div className="jargon-banner" role="alert">
          <div className="jargon-banner-text">
            {errorText(data.error.code, data.error.message, data.file, t)}
          </div>
          {data.error.code === 'corrupt' && data.file && data.error.message ? (
            <div className="jargon-banner-meta">{data.error.message}</div>
          ) : null}
          <div className="jargon-banner-actions">
            <button type="button" className="jargon-btn" onClick={retry}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : null}

      {showLoading ? (
        <p className="jargon-muted" role="status">
          {t('loading')}
        </p>
      ) : null}

      <div className="jargon-scroll">
        {creating ? (
          <TermEditor
            draft={draft}
            t={t}
            saving={saving}
            error={formError}
            onDraftChange={updateDraft}
            onSave={saveDraft}
            onCancel={closeDraft}
            autoFocus
          />
        ) : null}

        {showEmpty ? (
          <div className="jargon-empty">
            <span className="jargon-empty-title">{t('emptyTitle')}</span>
            <span>{t('emptyHint')}</span>
          </div>
        ) : null}

        {showNoResults ? (
          <div className="jargon-empty">
            <span className="jargon-empty-title">{t('noResults')}</span>
          </div>
        ) : null}

        <ul className="jargon-list" aria-label={t('title')}>
          {visibleTerms.map((item) =>
            draft && draft.id === item.id ? (
              <li key={item.id}>
                <TermEditor
                  draft={draft}
                  t={t}
                  saving={saving}
                  error={formError}
                  onDraftChange={updateDraft}
                  onSave={saveDraft}
                  onCancel={closeDraft}
                  autoFocus
                />
              </li>
            ) : (
              <TermRow
                key={item.id}
                item={item}
                t={t}
                expanded={expandedIds.has(item.id)}
                armed={armedId === item.id}
                deleting={deletingId === item.id}
                onEdit={openEdit}
                onDelete={requestDelete}
                onToggleExpand={toggleExpanded}
              />
            ),
          )}
        </ul>
      </div>
    </div>
  )
}
