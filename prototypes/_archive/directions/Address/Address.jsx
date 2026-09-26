import { useMemo, useRef, useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { useDismiss, useKey } from '../../lib/hooks.js'
import {
  artifacts, attention, execution, intent, knowledge, projects, rules, settled, sinceLast,
} from '../../data/project.js'
import './Address.css'

export default function Address() {
  const [projectId, setProjectId] = useState('meridian')
  const [switcher, setSwitcher] = useState(false)
  const [surface, setSurface] = useState(null)      // { kind, id }
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [focused, setFocused] = useState(false)
  const [resolved, setResolved] = useState([])
  const [said, setSaid] = useState(null)
  const input = useRef(null)
  const project = projects.find((p) => p.id === projectId)
  const live = attention.filter((a) => !resolved.includes(a.id))

  const index = useMemo(() => ([
    ...attention.map((a) => ({ id: a.id, t: a.title, k: 'Needs you', m: a.raisedAt, signal: true, go: { kind: 'attention', id: a.id } })),
    ...execution.map((t) => ({ id: t.id, t: t.title, k: t.stateLabel, m: t.elapsed, go: { kind: 'execution', id: t.id } })),
    ...settled.map((s) => ({ id: s.id, t: s.title, k: s.outcome, m: s.when, go: { kind: 'execution', id: null } })),
    ...knowledge.canonical.map((k) => ({ id: k.id, t: k.t, k: 'Canonical', m: k.used, go: { kind: 'knowledge', id: null } })),
    ...knowledge.episodic.map((k) => ({ id: k.id, t: k.t, k: 'Episodic', m: k.used, go: { kind: 'knowledge', id: null } })),
    ...artifacts.map((r) => ({ id: r.id, t: r.t, k: r.kind, m: r.meta, go: { kind: 'artifacts', id: null } })),
    ...rules.map((g) => ({ id: g.id, t: `When ${g.when}, ${g.then}`, k: 'Rule', m: 'orchestration', go: { kind: 'rules', id: null } })),
  ]), [])

  const hits = q.trim()
    ? index.filter((i) => (i.t + ' ' + i.k).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : []
  const open = focused && (q.trim().length > 0)

  const address = () => { input.current?.focus() }

  useKey((e, typing) => {
    if (typing) return
    if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) { e.preventDefault(); address() }
    if (e.key === 'Escape') { setSurface(null); setSwitcher(false); setSaid(null) }
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); setQ(''); input.current?.blur(); return }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (hits[sel]) { setSurface(hits[sel].go); setQ(''); input.current?.blur() }
      else { start() }
    }
  }

  const start = () => {
    setSaid(q.trim())
    setQ('')
    input.current?.blur()
  }

  return (
    <div className="adr">
      <Chrome
        project={project} live={live.length}
        switcher={switcher} setSwitcher={setSwitcher}
        onPick={(id) => { setProjectId(id); setSwitcher(false); setSurface(null) }}
      />

      <div className="adr-stage">
        <Brief
          project={project} live={live}
          onGo={setSurface} said={said} onDismissSaid={() => setSaid(null)}
        />
        {surface && (
          <Surface
            s={surface}
            onClose={() => setSurface(null)}
            onResolve={(id) => { setResolved((r) => [...r, id]); setSurface(null) }}
          />
        )}
      </div>

      <div className={'adr-line-wrap' + (open ? ' is-open' : '')}>
        {open && (
          <div className="adr-index">
            {hits.map((h, i) => (
              <button
                key={h.id + h.k}
                className={'adr-hit' + (i === sel ? ' is-sel' : '')}
                onMouseEnter={() => setSel(i)}
                onClick={() => { setSurface(h.go); setQ(''); input.current?.blur() }}
              >
                {h.signal ? <span className="dot-signal" /> : <span className="adr-hit-dot" />}
                <span className="adr-hit-t">{h.t}</span>
                <span className="adr-hit-k">{h.k}</span>
                <span className="adr-hit-m">{h.m}</span>
              </button>
            ))}
            <button
              className={'adr-hit adr-hit-start' + (sel === hits.length ? ' is-sel' : '')}
              onMouseEnter={() => setSel(hits.length)}
              onClick={start}
            >
              <Icon name="plus" size={12} />
              <span className="adr-hit-t">Start this as new work</span>
              <span className="adr-hit-m">the coordinator will refine it first</span>
            </button>
          </div>
        )}

        <div className={'adr-line' + (focused ? ' is-focused' : '')} onClick={address}>
          <Icon name="chevron" size={13} className="adr-caret" />
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0) }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            placeholder="Ask the project, or tell it what you want"
            spellCheck="false"
          />
          {!focused && !q && <span className="adr-line-hint"><span className="kbd">/</span></span>}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------- */

function Chrome({ project, live, switcher, setSwitcher, onPick }) {
  const ref = useDismiss(switcher, () => setSwitcher(false))
  const running = execution.filter((e) => e.state === 'running').length
  return (
    <header className="adr-chrome">
      <div className="traffic"><i /><i /><i /></div>
      <div className="adr-switch-wrap" ref={ref}>
        <button className={'adr-switch' + (switcher ? ' is-open' : '')} onClick={() => setSwitcher(!switcher)}>
          {project.name}
          <Icon name="chevronD" size={10} />
        </button>
        {switcher && (
          <div className="adr-pop">
            {projects.map((p) => (
              <button key={p.id} className={'adr-pop-item' + (p.id === project.id ? ' is-on' : '')} onClick={() => onPick(p.id)}>
                <span className="adr-pop-name">{p.name}</span>
                <span className="adr-pop-state">
                  {p.needsYou > 0 && <span className="adr-pop-needs"><span className="dot-signal" />{p.needsYou}</span>}
                  {p.active > 0 ? <span className="tnum">{p.active} running</span> : <span>{p.lastTouched}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="adr-chrome-right">
        <span className="adr-state"><span className="pulse" /><span className="tnum">{running} running</span></span>
        {live > 0 && <span className="adr-state is-signal"><span className="dot-signal" /><span className="tnum">{live} need you</span></span>}
      </div>
    </header>
  )
}

/* The brief. Operational prose, and every noun that matters is a way in. */
function Brief({ project, live, onGo, said, onDismissSaid }) {
  const running = execution.filter((e) => e.state === 'running')
  const added = execution.find((e) => e.graph.some((n) => n.added))
  const retained = knowledge.canonical.length + knowledge.episodic.length

  return (
    <div className="adr-brief">
      <div className="adr-brief-inner">
        <p className="adr-lede">
          <span className="adr-project">{project.name}</span> is{' '}
          <button className="adr-noun" onClick={() => onGo({ kind: 'intent' })}>{intent.headline.toLowerCase()}</button>.
        </p>

        {said && (
          <p className="adr-said">
            <span className="pulse" />
            The coordinator is refining “{said}” into work. It will pull the webhook retry
            contract as context before dispatching.
            <button className="adr-said-x" onClick={onDismissSaid}><Icon name="close" size={11} /></button>
          </p>
        )}

        <p className={'adr-stat' + (live.length ? ' is-signal' : '')}>
          {live.length === 0
            ? <>Nothing needs your judgement right now.</>
            : <>
                <button className="adr-noun is-signal" onClick={() => onGo({ kind: 'attention', id: live[0].id })}>
                  {live.length === 1 ? 'One decision needs you' : `${numberWord(live.length)} decisions need you`}
                </button>.
              </>}
        </p>
        {live.length > 0 && (
          <ul className="adr-sublist">
            {live.map((a) => (
              <li key={a.id}>
                <button className="adr-subitem" onClick={() => onGo({ kind: 'attention', id: a.id })}>
                  <span className="adr-subitem-t">{a.title}</span>
                  <span className="adr-subitem-m">{a.because}</span>
                  <span className="adr-subitem-time tnum">{a.raisedAt}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="adr-stat">
          <button className="adr-noun" onClick={() => onGo({ kind: 'execution' })}>
            {numberWord(running.length)} workers are running
          </button>{' '}
          and one task is held until you decide.
        </p>
        {added && (
          <p className="adr-aside">
            A security review was added to {added.title.toLowerCase()} after the graph touched
            authentication files. No one asked for it —{' '}
            <button className="adr-noun quiet" onClick={() => onGo({ kind: 'rules' })}>a project rule did</button>.
          </p>
        )}

        <p className="adr-stat adr-since">
          Since you left, {sinceLast.away} ago.
        </p>
        <ul className="adr-sublist">
          {sinceLast.items.map((it) => (
            <li key={it.t}>
              <button
                className="adr-subitem"
                onClick={() => onGo({ kind: it.kind === 'know' ? 'knowledge' : it.kind === 'signal' ? 'attention' : 'execution', id: it.kind === 'signal' ? 'a3' : null })}
              >
                <span className="adr-subitem-t">{it.t}</span>
                <span className="adr-subitem-m">{it.meta}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="adr-foot">
          The project retains{' '}
          <button className="adr-noun" onClick={() => onGo({ kind: 'knowledge' })}>{retained} knowledge entries</button>
          {' '}and{' '}
          <button className="adr-noun" onClick={() => onGo({ kind: 'artifacts' })}>{artifacts.length} artifacts</button>
          {' '}from {settled.length + execution.length} pieces of work. None of it lives in a worker.
        </p>
      </div>
    </div>
  )
}

function numberWord(n) {
  return ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'][n] || String(n)
}

/* A surface slides over the brief. There is no navigation to return to —
   only the brief, so Escape always means "back". */
function Surface({ s, onClose, onResolve }) {
  const ref = useDismiss(true, onClose)
  const title = {
    attention: 'Needs you', execution: 'Execution', knowledge: 'Knowledge',
    artifacts: 'Artifacts', rules: 'Orchestration', intent: 'Project intent',
  }[s.kind]

  return (
    <div className="adr-scrim">
      <section className="adr-surface" ref={ref}>
        <header className="adr-surface-head">
          <span className="eyebrow">{title}</span>
          <button className="adr-surface-close" onClick={onClose}>
            <span className="kbd">esc</span>
          </button>
        </header>
        <div className="adr-surface-body">
          {s.kind === 'attention'  && <SAttention id={s.id} onResolve={onResolve} />}
          {s.kind === 'execution'  && <SExecution id={s.id} />}
          {s.kind === 'knowledge'  && <SKnowledge />}
          {s.kind === 'artifacts'  && <SArtifacts />}
          {s.kind === 'rules'      && <SRules />}
          {s.kind === 'intent'     && <SIntent />}
        </div>
      </section>
    </div>
  )
}

function SAttention({ id, onResolve }) {
  const [cur, setCur] = useState(id || attention[0].id)
  const a = attention.find((x) => x.id === cur) || attention[0]
  const [sel, setSel] = useState(a.options[0].id)

  return (
    <>
      <div className="adr-tabs">
        {attention.map((x) => (
          <button key={x.id} className={'adr-tab' + (x.id === a.id ? ' is-on' : '')}
            onClick={() => { setCur(x.id); setSel(x.options[0].id) }}>
            {x.kind}
          </button>
        ))}
      </div>
      <h2 className="adr-h">{a.title}</h2>
      <p className="adr-because">{a.because}</p>
      <p className="adr-p">{a.detail}</p>

      <div className="eyebrow adr-eyebrow">What the project knows</div>
      <ul className="adr-ul">{a.evidence.map((x) => <li key={x}>{x}</li>)}</ul>

      <div className="eyebrow adr-eyebrow">Your call</div>
      <div className="adr-options">
        {a.options.map((o) => (
          <button key={o.id} className={'adr-option' + (sel === o.id ? ' is-sel' : '')} onClick={() => setSel(o.id)}>
            <span className="adr-radio" />
            <span>
              <span className="adr-option-label">{o.label}</span>
              <span className="adr-option-note">{o.note}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="adr-surface-foot">
        {a.blocking && <span className="adr-blocking">Blocking {a.blocking}</span>}
        <button className="adr-commit" onClick={() => onResolve(a.id)}>Record decision <span className="kbd">↵</span></button>
      </div>
    </>
  )
}

function SExecution({ id }) {
  const [openId, setOpenId] = useState(id || execution[0].id)
  return (
    <>
      {execution.map((t) => {
        const on = openId === t.id
        return (
          <div key={t.id} className={'adr-exec' + (on ? ' is-on' : '')}>
            <button className="adr-exec-head" onClick={() => setOpenId(on ? null : t.id)}>
              {t.state === 'running' ? <span className="pulse" /> : <span className="dot-queue" />}
              <span className="adr-exec-stage">{t.stateLabel}</span>
              <span className="adr-exec-title">{t.title}</span>
              <span className="adr-exec-time tnum">{t.elapsed}</span>
            </button>
            {on && (
              <div className="adr-graph">
                {t.graph.map((n) => (
                  <div key={n.id} className={'adr-node is-' + n.state}>
                    <span className="adr-node-dot">
                      {n.state === 'running' ? <span className="pulse" />
                        : n.state === 'done' ? <Icon name="check" size={9} />
                        : <span className="dot-queue" />}
                    </span>
                    <span className="adr-node-label">
                      {n.label}
                      {n.added && <span className="adr-added">added</span>}
                    </span>
                    <span className="adr-node-meta">{n.meta}</span>
                  </div>
                ))}
                {t.note && <p className="adr-graph-note">{t.note}</p>}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function SKnowledge() {
  return (
    <>
      <div className="eyebrow adr-eyebrow first">Canonical — given to every task in the area</div>
      {knowledge.canonical.map((k) => (
        <div key={k.id} className={'adr-krow' + (k.flagged ? ' is-flagged' : '')}>
          {k.flagged ? <span className="dot-signal" /> : <span className="adr-hit-dot" />}
          <span className="adr-krow-t">{k.t}</span>
          <span className="adr-krow-m">{k.meta}</span>
          <span className="adr-krow-u">{k.pending ? 'proposed' : k.used}</span>
        </div>
      ))}
      <div className="eyebrow adr-eyebrow">Episodic — retained from one piece of work</div>
      {knowledge.episodic.map((k) => (
        <div key={k.id} className={'adr-krow' + (k.flagged ? ' is-flagged' : '')}>
          {k.flagged ? <span className="dot-signal" /> : <span className="adr-hit-dot" />}
          <span className="adr-krow-t">{k.t}</span>
          <span className="adr-krow-m">{k.meta}</span>
          <span className="adr-krow-u">{k.used}</span>
        </div>
      ))}
    </>
  )
}

function SArtifacts() {
  return artifacts.map((r) => (
    <div key={r.id} className="adr-krow">
      <Icon name="artifact" size={13} style={{ color: 'var(--t-4)' }} />
      <span className="adr-krow-t">{r.t}</span>
      <span className="adr-krow-m">{r.kind}</span>
      <span className="adr-krow-u">{r.meta}</span>
    </div>
  ))
}

function SRules() {
  return (
    <>
      <p className="adr-p first">These are why work extends itself without asking you.</p>
      {rules.map((g) => (
        <div key={g.id} className="adr-rule">
          <div><span className="adr-rule-kw">When</span>{g.when}</div>
          <div><span className="adr-rule-kw">Then</span>{g.then}</div>
          <div className="adr-rule-meta"><span>{g.src}</span><span>{g.fired}</span></div>
        </div>
      ))}
    </>
  )
}

function SIntent() {
  return (
    <>
      <h2 className="adr-h">{intent.headline}</h2>
      <p className="adr-p">{intent.detail}</p>
      <p className="adr-because">Set by you {intent.set}. Every worker receives this before anything else.</p>
    </>
  )
}
