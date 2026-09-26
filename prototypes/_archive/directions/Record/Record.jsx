import { useMemo, useRef, useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { useDismiss, useKey } from '../../lib/hooks.js'
import {
  artifacts, attention, execution, intent, knowledge, projects, record, sinceLast,
} from '../../data/project.js'
import './Record.css'

const LENSES = [
  { id: 'all',    label: 'Everything', lanes: null },
  { id: 'signal', label: 'Needs you',  lanes: ['signal'] },
  { id: 'exec',   label: 'Execution',  lanes: ['exec'] },
  { id: 'know',   label: 'Knowledge',  lanes: ['know'] },
  { id: 'you',    label: 'Yours',      lanes: ['you'] },
]

const LANE_LABEL = { signal: 'Needs you', exec: 'Execution', know: 'Knowledge', you: 'You' }

export default function Record() {
  const [lens, setLens] = useState('all')
  const [projectId, setProjectId] = useState('meridian')
  const [switcher, setSwitcher] = useState(false)
  const [finder, setFinder] = useState(false)
  const [openEntry, setOpenEntry] = useState(null)
  const [appended, setAppended] = useState([])
  const [answered, setAnswered] = useState([])
  const [draft, setDraft] = useState('')
  const composerRef = useRef(null)
  const scrollRef = useRef(null)
  const project = projects.find((p) => p.id === projectId)

  const entries = useMemo(() => [...appended, ...record], [appended])
  const lensDef = LENSES.find((l) => l.id === lens)
  const shown = lensDef.lanes ? entries.filter((e) => lensDef.lanes.includes(e.lane)) : entries

  const counts = useMemo(() => {
    const c = {}
    for (const l of LENSES) {
      c[l.id] = l.lanes
        ? entries.filter((e) => l.lanes.includes(e.lane) && !(l.id === 'signal' && isAnswered(e, answered))).length
        : entries.length
    }
    return c
  }, [entries, answered])

  useKey((e, typing) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setFinder(true) }
    if (typing) return
    if (e.key === 'Escape') { setOpenEntry(null); setSwitcher(false) }
    if (e.key === 'c' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); composerRef.current?.focus() }
  }, [])

  const decide = (att, optionLabel) => {
    setAnswered((r) => [...r, att.id])
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setAppended((a) => [{
      id: 'you' + Date.now(), at: 'just now', lane: 'you',
      head: `You chose: ${optionLabel}`,
      sub: att.blocking
        ? `Recorded as the reason. Work held on ${att.blocking} resumes with this as context.`
        : 'Recorded as the reason. Future workers receive this instead of the conflict.',
      tag: 'Decision', ref: null, fresh: true,
    }, ...a])
    setOpenEntry(null)
  }

  const submit = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setAppended((a) => [
      { id: 'co' + Date.now(), at: 'just now', lane: 'exec',
        head: 'Coordinator is refining this into a task',
        sub: 'Pulling the webhook retry contract and the v2 migration plan as context.',
        tag: 'Refining', ref: null, fresh: true },
      { id: 'me' + Date.now(), at: 'just now', lane: 'you',
        head: text, sub: 'Written into the project by you.', tag: 'Intent', ref: null, fresh: true },
      ...a,
    ])
    setDraft('')
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="rec">
      <Chrome
        project={project} intent={intent}
        switcher={switcher} setSwitcher={setSwitcher}
        onPick={(id) => { setProjectId(id); setSwitcher(false); setLens('all') }}
        onFind={() => setFinder(true)}
      />

      <div className="rec-body">
        <aside className="rec-rail">
          <div className="rec-rail-group">
            <div className="eyebrow rec-rail-head">Lens</div>
            {LENSES.map((l) => (
              <button
                key={l.id}
                className={'rec-lens' + (lens === l.id ? ' is-on' : '')}
                onClick={() => setLens(l.id)}
              >
                <span>{l.label}</span>
                <span className={'rec-lens-n tnum' + (l.id === 'signal' && counts.signal ? ' is-signal' : '')}>
                  {counts[l.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="rec-rail-group">
            <div className="eyebrow rec-rail-head">Retained</div>
            <button className="rec-lens" onClick={() => setFinder(true)}>
              <span>Knowledge</span>
              <span className="rec-lens-n tnum">{knowledge.canonical.length + knowledge.episodic.length}</span>
            </button>
            <button className="rec-lens" onClick={() => setFinder(true)}>
              <span>Artifacts</span>
              <span className="rec-lens-n tnum">{artifacts.length}</span>
            </button>
          </div>

          <div className="rec-rail-foot">
            <div className="rec-away">
              <span className="rec-away-n tnum">{sinceLast.away}</span>
              <span>away · {sinceLast.items.length} entries are new</span>
            </div>
          </div>
        </aside>

        <main className="rec-main">
          <Now />
          <div className="rec-scroll" ref={scrollRef}>
            <div className="rec-stream">
              {shown.map((e, idx) => (
                <Entry
                  key={e.id}
                  e={e}
                  prev={shown[idx - 1]}
                  lens={lens}
                  open={openEntry === e.id}
                  answered={isAnswered(e, answered)}
                  onToggle={() => setOpenEntry(openEntry === e.id ? null : e.id)}
                  onDecide={decide}
                />
              ))}
              <div className="rec-origin">
                <span>Project opened 4 February. Everything above is retained.</span>
              </div>
            </div>
          </div>

          <form className="rec-composer" onSubmit={submit}>
            <div className="rec-composer-inner">
              <Icon name="chevron" size={13} className="rec-composer-caret" />
              <input
                ref={composerRef}
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                placeholder="Write into the project"
                spellCheck="false"
              />
              <span className="rec-composer-hint">
                {draft.trim() ? <span className="kbd">↵</span> : <span className="kbd">C</span>}
              </span>
            </div>
          </form>
        </main>
      </div>

      {finder && <Finder onClose={() => setFinder(false)} />}
    </div>
  )
}

/* ---------------------------------------------------------------------- */

function Chrome({ project, intent, switcher, setSwitcher, onPick, onFind }) {
  const ref = useDismiss(switcher, () => setSwitcher(false))
  return (
    <header className="rec-chrome">
      <div className="traffic"><i /><i /><i /></div>

      <div className="rec-switch-wrap" ref={ref}>
        <button
          className={'rec-switch' + (switcher ? ' is-open' : '')}
          onClick={() => setSwitcher(!switcher)}
        >
          <Icon name="project" size={13} />
          <span className="rec-switch-name">{project.name}</span>
          {project.needsYou > 0 && <span className="dot-signal" />}
          <Icon name="chevronD" size={11} className="rec-switch-chev" />
        </button>

        {switcher && (
          <div className="rec-pop">
            <div className="eyebrow rec-pop-head">Projects</div>
            {projects.map((p) => (
              <button key={p.id} className={'rec-pop-item' + (p.id === project.id ? ' is-on' : '')} onClick={() => onPick(p.id)}>
                <span className="rec-pop-main">
                  <span className="rec-pop-name">{p.name}</span>
                  <span className="rec-pop-desc">{p.desc}</span>
                </span>
                <span className="rec-pop-state">
                  {p.needsYou > 0 && <span className="rec-pop-needs"><span className="dot-signal" />{p.needsYou}</span>}
                  {p.active > 0 && <span className="rec-pop-active tnum">{p.active} running</span>}
                  {p.active === 0 && p.needsYou === 0 && <span className="rec-pop-quiet">{p.lastTouched}</span>}
                </span>
              </button>
            ))}
            <div className="rec-pop-sep" />
            <button className="rec-pop-item rec-pop-plain"><Icon name="plus" size={12} />Add a project</button>
            <button className="rec-pop-item rec-pop-plain"><Icon name="settings" size={12} />Project configuration</button>
          </div>
        )}
      </div>

      <div className="rec-intent">
        <span className="rec-intent-label">Intent</span>
        <span className="rec-intent-text">{intent.headline}</span>
      </div>

      <div className="rec-chrome-right">
        <button className="rec-icon-btn" onClick={onFind} title="Find in project">
          <Icon name="search" size={13} />
          <span className="kbd">⌘K</span>
        </button>
        <button className="rec-avatar" title="Account">BK</button>
      </div>
    </header>
  )
}

/* The live band. Not a metric panel — it is the single line of the record
   that has not finished being written yet. */
function Now() {
  return (
    <div className="rec-now">
      <div className="rec-now-head">
        <span className="eyebrow">In progress</span>
        <span className="rec-now-sum tnum">{execution.filter((x) => x.state === 'running').length} workers</span>
      </div>
      <div className="rec-now-rows">
        {execution.map((t) => (
          <div key={t.id} className={'rec-now-row is-' + t.state}>
            {t.state === 'running' ? <span className="pulse" /> : <span className="dot-queue" />}
            <span className="rec-now-stage">{t.stateLabel}</span>
            <span className="rec-now-title">{t.title}</span>
            {t.worker && <span className="rec-now-worker mono">{t.worker}</span>}
            <span className="rec-now-time tnum">{t.elapsed}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Entry({ e, prev, lens, open, answered, onToggle, onDecide }) {
  const found = e.lane === 'signal' ? attention.find((a) => a.title === e.head) : null
  const att = answered ? null : found
  const breakHere = lens === 'all' && prev && isFresh(prev) && !isFresh(e)

  return (
    <>
      {breakHere && (
        <div className="rec-break">
          <span className="rec-break-line" />
          <span className="rec-break-text">You were away {sinceLast.away}</span>
          <span className="rec-break-line" />
        </div>
      )}
      <article className={'rec-entry is-' + e.lane + (open ? ' is-open' : '') + (e.fresh ? ' is-new' : '') + (answered ? ' is-answered' : '')}>
        <div className="rec-when tnum">{e.at}</div>
        <div className="rec-spine">
          <span className="rec-node" />
        </div>
        <div className="rec-content">
          <button className="rec-entry-head" onClick={att ? onToggle : undefined} disabled={!att}>
            <span className="rec-head-text">{e.head}</span>
            {att && <Icon name={open ? 'chevronD' : 'chevron'} size={11} className="rec-head-chev" />}
          </button>
          <p className="rec-sub">{e.sub}</p>
          <div className="rec-meta">
            <span className={'rec-tag' + (e.lane === 'signal' && !answered ? ' is-signal' : '')}>
              {answered ? 'Answered' : e.tag}
            </span>
            {e.ref && <span className="rec-ref mono">task {e.ref}</span>}
            {lens === 'all' && e.lane !== 'exec' && !answered && <span className="rec-lane">{LANE_LABEL[e.lane]}</span>}
          </div>

          {open && att && <Decision a={att} onDecide={(label) => onDecide(att, label)} />}
        </div>
      </article>
    </>
  )
}

function isFresh(e) {
  return !['yesterday', '2 days', '3 days'].includes(e.at)
}

function isAnswered(e, answered) {
  if (e.lane !== 'signal') return false
  const a = attention.find((x) => x.title === e.head)
  return !!a && answered.includes(a.id)
}


function Decision({ a, onDecide }) {
  const [sel, setSel] = useState(a.options[0].id)
  return (
    <div className="rec-decision">
      <p className="rec-because">{a.because}</p>
      <p className="rec-detail">{a.detail}</p>

      <div className="eyebrow rec-dec-head">What the project knows</div>
      <ul className="rec-evidence">
        {a.evidence.map((x) => <li key={x}>{x}</li>)}
      </ul>

      <div className="eyebrow rec-dec-head">Your call</div>
      <div className="rec-options">
        {a.options.map((o) => (
          <button
            key={o.id}
            className={'rec-option' + (sel === o.id ? ' is-sel' : '')}
            onClick={() => setSel(o.id)}
          >
            <span className="rec-radio" />
            <span className="rec-option-text">
              <span className="rec-option-label">{o.label}</span>
              <span className="rec-option-note">{o.note}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="rec-dec-foot">
        {a.blocking && <span className="rec-blocking">Blocking {a.blocking}</span>}
        <button
          className="rec-commit"
          onClick={() => onDecide(a.options.find((o) => o.id === sel).label)}
        >
          Record decision <span className="kbd">↵</span>
        </button>
      </div>
    </div>
  )
}

/* ⌘K — find in project. Searches one index across the record, knowledge
   and artifacts, because in this model they are all the same material. */
function Finder({ onClose }) {
  const [q, setQ] = useState('')
  const ref = useDismiss(true, onClose)
  const items = useMemo(() => [
    ...record.map((r) => ({ id: r.id, t: r.head, k: 'Record', m: r.at })),
    ...knowledge.canonical.map((k) => ({ id: k.id, t: k.t, k: 'Canonical', m: k.used })),
    ...knowledge.episodic.map((k) => ({ id: k.id, t: k.t, k: 'Episodic', m: k.used })),
    ...artifacts.map((r) => ({ id: r.id, t: r.t, k: r.kind, m: r.meta })),
  ], [])
  const hits = q ? items.filter((i) => i.t.toLowerCase().includes(q.toLowerCase())) : items.slice(0, 9)

  return (
    <div className="rec-scrim">
      <div className="rec-finder" ref={ref}>
        <div className="rec-finder-input">
          <Icon name="search" size={14} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find anything the project retained" spellCheck="false" />
          <button className="rec-finder-esc" onClick={onClose}><span className="kbd">esc</span></button>
        </div>
        <div className="rec-finder-list">
          {hits.map((h) => (
            <button key={h.id + h.k} className="rec-finder-item">
              <span className="rec-finder-t">{h.t}</span>
              <span className="rec-finder-k">{h.k}</span>
              <span className="rec-finder-m">{h.m}</span>
            </button>
          ))}
          {!hits.length && <div className="rec-finder-empty">Nothing retained matches “{q}”.</div>}
        </div>
      </div>
    </div>
  )
}
