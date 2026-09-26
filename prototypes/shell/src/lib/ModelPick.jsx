import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'
import Model, { CONNECTIONS, EFFORTS, MODELS, Mark, ctxLabel, effortFor } from './Model.jsx'
import { useDismiss } from './hooks.js'
import { setDefaultEffort, togglePin, useDefaultEfforts, usePins } from './pins.js'

/* Which model sits behind a conversation, and how hard it thinks.
   The short list is your pins; everything connected is one step away in
   the browser. Changeable at any point: the record belongs to the project,
   so the next model reads the same task, not the last model's memory. */
export default function ModelPick({ value, effort, defaultEffort, onChange, onEffort, role }) {
  const [open, setOpen] = useState(false)
  const [browse, setBrowse] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const pins = usePins()
  const m = MODELS[value]
  const efforts = EFFORTS[m?.lab] || []
  const list = pins.includes(value) ? pins : [value, ...pins]

  return (
    <span className="mp" ref={ref}>
      <button type="button" className={'mp-b' + (open ? ' is-open' : '')} onClick={() => setOpen(!open)}
        title={`${role} · model and effort`}>
        <Model id={value} short />
        {efforts.length > 0 && <span className="mp-effort">{effort}</span>}
        <Icon name="chevronD" size={10} />
      </button>
      {open && (
        <span className="mp-pop" role="dialog">
          <span className="mp-head">{role}</span>
          {list.map((id) => (
            <span key={id} className={'mp-opt' + (id === value ? ' is-on' : '')}>
              <button type="button" className="mp-opt-b" onClick={() => { if (id !== value) onChange(id) }}>
                <Model id={id} />
                {!pins.includes(id) && <span className="mp-opt-n">not pinned</span>}
              </button>
              {id === value && <Icon name="check" size={11} />}
            </span>
          ))}

          {efforts.length > 0 && (
            <span className="mp-sec">
              <span className="mp-sec-top">
                <span className="mp-sec-k">Effort</span>
                {effort === defaultEffort
                  ? <span className="mp-sec-d">{MODELS[value].short} default</span>
                  : <button type="button" className="mp-sec-set" onClick={() => setDefaultEffort(value, effort)}>
                      Make default for {MODELS[value].short}
                    </button>}
              </span>
              <span className="mp-seg">
                {efforts.map((e) => (
                  <button type="button" key={e} className={'mp-seg-b' + (e === effort ? ' is-on' : '')} onClick={() => onEffort(e)}>
                    {e}{e === defaultEffort && e !== effort && <i className="mp-seg-def" title="Default" />}
                  </button>
                ))}
              </span>
            </span>
          )}

          <button type="button" className="mp-all" onClick={() => { setOpen(false); setBrowse(true) }}>
            All models<span className="mp-all-n">{Object.keys(MODELS).length}</span>
            <Icon name="chevron" size={10} />
          </button>
        </span>
      )}
      {browse && <ModelBrowser value={value} role={role} onClose={() => setBrowse(false)}
        onPick={(id) => { setBrowse(false); if (id !== value) onChange(id) }} />}
    </span>
  )
}

/* Set once per model; a conversation can still move it for itself. */
function EffortDefault({ id, lab, value }) {
  const levels = EFFORTS[lab] || []
  if (!levels.length) return <span className="mb-eff is-none">—</span>
  return (
    <span className="mb-eff" onClick={(e) => e.stopPropagation()}>
      <select value={value} onChange={(e) => setDefaultEffort(id, e.target.value)} aria-label={`Default effort for ${MODELS[id].name}`}>
        {levels.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <Icon name="chevronD" size={9} />
    </span>
  )
}

/* Every model every connected runtime offers, searchable, with pins.
   Laid out like a command palette with a filter rail: you arrive typing. */
export function ModelBrowser({ value, role, onPick, onClose }) {
  const pins = usePins()
  const defaults = useDefaultEfforts()
  const [q, setQ] = useState('')
  const [via, setVia] = useState('all')
  const [at, setAt] = useState(0)
  const input = useRef(null)
  useEffect(() => { input.current?.focus() }, [])

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return Object.entries(MODELS)
      .filter(([id, m]) => via === 'all' || (via === 'pinned' ? pins.includes(id) : m.via === via))
      .filter(([id, m]) => !t || (m.name + ' ' + id + ' ' + m.via).toLowerCase().includes(t))
      .sort(([a], [b]) => (pins.includes(b) - pins.includes(a)))
  }, [q, via, pins])

  const key = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setAt((i) => Math.min(rows.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAt((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' && rows[at]) { e.preventDefault(); onPick(rows[at][0]) }
    else if (e.key === 'p' && e.metaKey && rows[at]) { e.preventDefault(); togglePin(rows[at][0]) }
  }

  const rail = [
    { id: 'all', name: 'All models', n: Object.keys(MODELS).length },
    { id: 'pinned', name: 'Pinned', n: pins.length },
  ]

  return createPortal(
    <div className="mb-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mb" role="dialog" aria-label="Models" onKeyDown={key}>
        <div className="mb-search">
          <Icon name="search" size={14} />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setAt(0) }}
            placeholder={`Models for ${role.toLowerCase()}`} />
          <span className="kbd">esc</span>
        </div>
        <div className="mb-body">
          <nav className="mb-rail">
            {rail.map((r) => (
              <button key={r.id} className={'mb-rail-b' + (via === r.id ? ' is-on' : '')} onClick={() => { setVia(r.id); setAt(0) }}>
                {r.id === 'pinned' ? <Icon name="pin" size={12} /> : <Icon name="work" size={12} />}
                <span>{r.name}</span><span className="mb-rail-n">{r.n}</span>
              </button>
            ))}
            <span className="mb-rail-k">Connected</span>
            {CONNECTIONS.map((c) => (
              <button key={c.id} className={'mb-rail-b' + (via === c.id ? ' is-on' : '')} onClick={() => { setVia(c.id); setAt(0) }}>
                <Mark lab={c.lab} size={12} />
                <span>{c.name}</span>
                <span className="mb-rail-n">{Object.values(MODELS).filter((m) => m.via === c.id).length}</span>
              </button>
            ))}
            <button className="mb-rail-b is-add"><Icon name="plus" size={12} /><span>Connect a runtime</span></button>
          </nav>

          <div className="mb-list">
            <div className="mb-cols"><span>Model</span><span>Runtime</span><span>Context</span><span>Default effort</span><span /></div>
            {rows.map(([id, m], i) => {
              const c = CONNECTIONS.find((x) => x.id === m.via)
              const pinned = pins.includes(id)
              return (
                <div key={id} className={'mb-row' + (i === at ? ' is-at' : '') + (id === value ? ' is-cur' : '')}
                  onMouseEnter={() => setAt(i)} onClick={() => onPick(id)}>
                  <span className="mb-name"><Model id={id} />{id === value && <span className="mb-cur">in use</span>}</span>
                  <span className="mb-via">{c.name} <span>· {c.how}</span></span>
                  <span className="mb-ctx">{ctxLabel(m.ctx)}</span>
                  <EffortDefault id={id} lab={m.lab} value={effortFor(id, defaults)} />
                  <button className={'mb-pin' + (pinned ? ' is-on' : '')} title={pinned ? 'Unpin' : 'Pin'}
                    onClick={(e) => { e.stopPropagation(); togglePin(id) }}>
                    <Icon name="pin" size={13} />
                  </button>
                </div>
              )
            })}
            {!rows.length && <p className="mb-none">No model matches “{q}”.</p>}
          </div>
        </div>
        <div className="mb-foot">
          <span><span className="kbd">↑</span><span className="kbd">↓</span> move</span>
          <span><span className="kbd">↵</span> use</span>
          <span><span className="kbd">⌘P</span> pin</span>
          <span className="mb-foot-r">Pinned models are the short list in every picker</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
