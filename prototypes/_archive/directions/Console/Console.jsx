import { useEffect, useRef, useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { useCompact, useDismiss, useKey } from '../../lib/hooks.js'
import {
  artifacts, attention, elsewhere, execution, intent, knowledge, projects, repo, rules, settled, sinceLast,
} from '../../data/project.js'
import './Console.css'

const DESTS = [
  { id: 'home',    label: 'Project',       icon: 'project' },
  { id: 'work',    label: 'Work',          icon: 'work' },
  { id: 'exec',    label: 'Execution',     icon: 'execution' },
  { id: 'know',    label: 'Knowledge',     icon: 'knowledge' },
  { id: 'art',     label: 'Artifacts',     icon: 'artifact' },
  { id: 'repo',    label: 'Repository',    icon: 'repo' },
  { id: 'rules',   label: 'Orchestration', icon: 'settings' },
]

export default function Console() {
  const autoCompact = useCompact(1180)
  const [dest, setDest] = useState('home')
  const [projectId, setProjectId] = useState('meridian')
  const [switcher, setSwitcher] = useState(false)
  const [railOpen, setRailOpen] = useState(true)
  const [coordOpen, setCoordOpen] = useState(true)
  const [openItem, setOpenItem] = useState(null)
  const [palette, setPalette] = useState(false)
  const [account, setAccount] = useState(false)
  const [resolved, setResolved] = useState([])
  const project = projects.find((p) => p.id === projectId)

  // A narrow window collapses the rails rather than squeezing every zone.
  useEffect(() => {
    if (autoCompact) { setRailOpen(false); setCoordOpen(false) }
    else { setRailOpen(true); setCoordOpen(true) }
  }, [autoCompact])

  useKey((e, typing) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette(true); return }
    if (typing) return
    if (e.key === 'Escape') { setOpenItem(null); setSwitcher(false); setAccount(false) }
    if (e.key === '[' ) setRailOpen((v) => !v)
    if (e.key === ']' ) setCoordOpen((v) => !v)
  }, [])

  const live = attention.filter((a) => !resolved.includes(a.id))
  const totalNeeds = projects.reduce((n, p) => n + p.needsYou, 0)

  return (
    <div className={'con' + (railOpen ? '' : ' rail-closed') + (coordOpen ? '' : ' coord-closed')}>
      <Rail
        open={railOpen} setOpen={setRailOpen}
        dest={dest} setDest={(d) => { setDest(d); setOpenItem(null) }}
        project={project} projects={projects}
        switcher={switcher} setSwitcher={setSwitcher}
        onPick={(id) => { setProjectId(id); setSwitcher(false); setDest('home'); setOpenItem(null) }}
        needs={live.length} totalNeeds={totalNeeds}
        account={account} setAccount={setAccount}
      />

      <main className="con-main">
        <Header
          dest={dest} openItem={openItem} onBack={() => setOpenItem(null)}
          coordOpen={coordOpen} setCoordOpen={setCoordOpen}
          project={project} onSearch={() => setPalette(true)}
        />
        <div className="con-surface" key={openItem ? 'item-' + openItem : dest}>
          {openItem
            ? <AttentionDetail
                a={attention.find((x) => x.id === openItem)}
                onResolve={() => { setResolved((r) => [...r, openItem]); setOpenItem(null) }}
              />
            : <Surface dest={dest} live={live} onOpen={setOpenItem} setDest={setDest} project={project} />}
        </div>
      </main>

      <Coordinator open={coordOpen} setOpen={setCoordOpen} />

      {palette && (
        <Palette
          onClose={() => setPalette(false)}
          onGo={(d) => { setDest(d); setOpenItem(null); setPalette(false) }}
          onOpenItem={(id) => { setOpenItem(id); setPalette(false) }}
        />
      )}

      <div className="con-status">
        <span className="con-status-item">
          <span className="pulse" />
          {execution.filter((e) => e.state === 'running').length} workers active
        </span>
        <span className="con-status-sep" />
        <span className={'con-status-item' + (live.length ? ' is-signal' : '')}>
          {live.length ? `${live.length} need you` : 'Nothing needs you'}
        </span>
        <span className="con-status-sep" />
        <span className="con-status-item con-status-intent">{intent.headline}</span>
        <span className="con-status-right mono">{repo.head}</span>
      </div>
    </div>
  )
}

/* ---- Zone 1: application + project navigation --------------------------*/
function Rail({ open, setOpen, dest, setDest, project, projects, switcher, setSwitcher, onPick, needs, totalNeeds, account, setAccount }) {
  const ref = useDismiss(switcher, () => setSwitcher(false))
  const accRef = useDismiss(account, () => setAccount(false))
  return (
    <aside className="con-rail">
      <div className="con-rail-top">
        <div className="traffic"><i /><i /><i /></div>
        <button className="con-rail-toggle" onClick={() => setOpen(!open)} title="Toggle navigation  [">
          <Icon name="panel" size={13} />
        </button>
      </div>

      <div className="con-switch-wrap" ref={ref}>
        <button className={'con-switch' + (switcher ? ' is-open' : '')} onClick={() => setSwitcher(!switcher)}>
          <span className="con-switch-badge">{project.name[0]}</span>
          <span className="con-switch-text">
            <span className="con-switch-name">{project.name}</span>
            <span className="con-switch-repo mono">{project.repo.split('/')[1]}</span>
          </span>
          <Icon name="chevronD" size={11} className="con-switch-chev" />
        </button>
        {switcher && (
          <div className="con-pop">
            <div className="eyebrow con-pop-head">Projects</div>
            {projects.map((p) => (
              <button key={p.id} className={'con-pop-item' + (p.id === project.id ? ' is-on' : '')} onClick={() => onPick(p.id)}>
                <span className="con-switch-badge sm">{p.name[0]}</span>
                <span className="con-pop-text">
                  <span className="con-pop-name">{p.name}</span>
                  <span className="con-pop-desc">{p.desc}</span>
                </span>
                <span className="con-pop-state">
                  {p.needsYou > 0 && <span className="con-pop-needs tnum"><span className="dot-signal" />{p.needsYou}</span>}
                  {p.active > 0
                    ? <span className="con-pop-run tnum">{p.active}</span>
                    : p.needsYou === 0 && <span className="con-pop-quiet">{p.lastTouched}</span>}
                </span>
              </button>
            ))}
            <div className="con-pop-sep" />
            <button className="con-pop-item con-pop-plain"><Icon name="plus" size={12} />Add a project</button>
          </div>
        )}
      </div>

      <button
        className={'con-inbox' + (dest === 'inbox' ? ' is-on' : '')}
        onClick={() => setDest('inbox')}
        title="Attention across all projects"
      >
        <Icon name="inbox" size={14} />
        <span className="con-inbox-label">Attention</span>
        <span className="con-inbox-n tnum">{totalNeeds}</span>
      </button>

      <div className="con-rail-sep" />

      <nav className="con-nav">
        {DESTS.map((d) => (
          <button
            key={d.id}
            className={'con-nav-item' + (dest === d.id ? ' is-on' : '')}
            onClick={() => setDest(d.id)}
            title={d.label}
          >
            <Icon name={d.icon} size={14} />
            <span className="con-nav-label">{d.label}</span>
            {d.id === 'home' && needs > 0 && <span className="con-nav-badge dot-signal" />}
            {d.id === 'exec' && <span className="con-nav-n tnum">{execution.length}</span>}
          </button>
        ))}
      </nav>

      <div className="con-rail-bottom" ref={accRef}>
        <button className={'con-nav-item' + (account ? ' is-on' : '')} onClick={() => setAccount(!account)}>
          <span className="con-me">BK</span>
          <span className="con-nav-label">Balazs</span>
        </button>
        {account && (
          <div className="con-pop con-pop-up">
            <button className="con-pop-item con-pop-plain"><Icon name="settings" size={12} />Application settings</button>
            <button className="con-pop-item con-pop-plain"><Icon name="project" size={12} />Agent providers</button>
            <div className="con-pop-sep" />
            <button className="con-pop-item con-pop-plain"><Icon name="close" size={12} />Sign out</button>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ---- Zone 2 header ------------------------------------------------------*/
function Header({ dest, openItem, onBack, coordOpen, setCoordOpen, project, onSearch }) {
  const d = DESTS.find((x) => x.id === dest)
  return (
    <header className="con-head">
      {openItem ? (
        <button className="con-back" onClick={onBack}>
          <Icon name="corner" size={13} /> Project
        </button>
      ) : (
        <h1 className="con-title">{d ? (d.id === 'home' ? project.name : d.label) : 'Attention'}</h1>
      )}
      <div className="con-head-right">
        <button className="con-ghost" onClick={onSearch}><Icon name="search" size={13} /><span className="kbd">⌘K</span></button>
        <button
          className={'con-ghost icon' + (coordOpen ? ' is-on' : '')}
          onClick={() => setCoordOpen(!coordOpen)}
          title="Toggle coordinator  ]"
        >
          <Icon name="panel" size={13} style={{ transform: 'scaleX(-1)' }} />
        </button>
      </div>
    </header>
  )
}

/* ---- Zone 2 content -----------------------------------------------------*/
function Surface({ dest, live, onOpen, setDest, project }) {
  if (dest === 'inbox') return <Inbox live={live} onOpen={onOpen} project={project} />
  if (dest === 'home') return <Home live={live} onOpen={onOpen} setDest={setDest} />
  if (dest === 'work') return <Work />
  if (dest === 'exec') return <Exec />
  if (dest === 'know') return <Know />
  if (dest === 'art')  return <Art />
  if (dest === 'repo') return <Repo />
  return <Rules />
}

function Home({ live, onOpen, setDest }) {
  return (
    <div className="con-page">
      <Section
        title="Needs you"
        note={live.length ? 'Execution stopped here on purpose.' : null}
        signal={live.length > 0}
      >
        {live.length === 0 && (
          <p className="con-empty">No decisions need your attention. Four workers are continuing without you.</p>
        )}
        {live.map((a) => (
          <button key={a.id} className="con-row is-signal" onClick={() => onOpen(a.id)}>
            <span className="dot-signal" />
            <span className="con-row-kind">{a.kind}</span>
            <span className="con-row-title">{a.title}</span>
            <span className="con-row-why">{a.raisedBy}</span>
            <span className="con-row-time tnum">{a.raisedAt}</span>
            <Icon name="chevron" size={12} className="con-row-go" />
          </button>
        ))}
      </Section>

      <Section title="Running" action={{ label: 'All execution', onClick: () => setDest('exec') }}>
        {execution.map((t) => <ExecRow key={t.id} t={t} />)}
      </Section>

      <Section title="Settled" action={{ label: 'All work', onClick: () => setDest('work') }}>
        {settled.map((s) => (
          <div key={s.id} className="con-row is-static">
            <span className="dot-done" />
            <span className="con-row-kind">{s.outcome}</span>
            <span className="con-row-title">{s.title}</span>
            <span className="con-row-why">{s.meta}</span>
            <span className="con-row-time tnum">{s.when}</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Section({ title, note, action, signal, children }) {
  return (
    <section className="con-section">
      <div className="con-section-head">
        <h2 className={'con-section-title' + (signal ? ' is-signal' : '')}>{title}</h2>
        {note && <span className="con-section-note">{note}</span>}
        {action && <button className="con-section-action" onClick={action.onClick}>{action.label}</button>}
      </div>
      <div className="con-section-body">{children}</div>
    </section>
  )
}

function ExecRow({ t }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={'con-exec' + (open ? ' is-open' : '')}>
      <button className="con-row" onClick={() => setOpen(!open)}>
        {t.state === 'running' ? <span className="pulse" /> : <span className="dot-queue" />}
        <span className="con-row-kind">{t.stateLabel}</span>
        <span className="con-row-title">{t.title}</span>
        {t.worker && <span className="con-row-why mono">{t.worker}</span>}
        <span className="con-row-time tnum">{t.elapsed}</span>
        <Icon name={open ? 'chevronD' : 'chevron'} size={12} className="con-row-go is-always" />
      </button>
      {open && (
        <div className="con-graph">
          {t.graph.map((n, i) => (
            <div key={n.id} className={'con-node is-' + n.state}>
              {i > 0 && <span className="con-edge" />}
              <span className="con-node-dot">
                {n.state === 'running' ? <span className="pulse" />
                  : n.state === 'done' ? <Icon name="check" size={9} />
                  : <span className="dot-queue" />}
              </span>
              <span className="con-node-text">
                <span className="con-node-label">
                  {n.label}
                  {n.added && <span className="con-node-added">added</span>}
                </span>
                {n.meta && <span className="con-node-meta">{n.meta}</span>}
              </span>
            </div>
          ))}
          {t.note && <p className="con-graph-note">{t.note}</p>}
        </div>
      )}
    </div>
  )
}

function AttentionDetail({ a, onResolve }) {
  const [sel, setSel] = useState(a.options[0].id)
  return (
    <div className="con-page con-detail">
      <div className="con-detail-head">
        <span className="con-detail-kind">{a.kind}</span>
        <span className="con-detail-time tnum">{a.raisedAt} · {a.raisedBy}</span>
      </div>
      <h2 className="con-detail-title">{a.title}</h2>
      <p className="con-detail-because">{a.because}</p>
      <p className="con-detail-body">{a.detail}</p>

      <div className="con-detail-grid">
        <div>
          <div className="eyebrow con-detail-eyebrow">Your call</div>
          <div className="con-options">
            {a.options.map((o) => (
              <button key={o.id} className={'con-option' + (sel === o.id ? ' is-sel' : '')} onClick={() => setSel(o.id)}>
                <span className="con-radio" />
                <span>
                  <span className="con-option-label">{o.label}</span>
                  <span className="con-option-note">{o.note}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="con-detail-foot">
            {a.blocking && <span className="con-blocking">Blocking {a.blocking}</span>}
            <button className="con-commit" onClick={onResolve}>Record decision <span className="kbd">↵</span></button>
          </div>
        </div>
        <div>
          <div className="eyebrow con-detail-eyebrow">What the project knows</div>
          <ul className="con-evidence">{a.evidence.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
    </div>
  )
}

function Work() {
  const all = [
    ...execution.map((t) => ({ id: t.id, ref: t.ref, t: t.title, s: t.stateLabel, m: t.worker || t.note, w: t.elapsed, live: t.state === 'running' })),
    ...settled.map((s) => ({ id: s.id, ref: s.ref, t: s.title, s: s.outcome, m: s.meta, w: s.when, live: false })),
  ]
  return (
    <div className="con-page">
      <Section title="All work" note="Newest first. Outcome is not always code.">
        {all.map((x) => (
          <div key={x.id} className="con-row is-static">
            {x.live ? <span className="pulse" /> : <span className="dot-done" />}
            <span className="con-row-ref mono">{x.ref}</span>
            <span className="con-row-kind">{x.s}</span>
            <span className="con-row-title">{x.t}</span>
            <span className="con-row-why">{x.m}</span>
            <span className="con-row-time tnum">{x.w}</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Exec() {
  return (
    <div className="con-page">
      <Section title="Active graphs" note="Steps are appended when findings require them.">
        {execution.map((t) => <ExecRow key={t.id} t={t} />)}
      </Section>
    </div>
  )
}

function Know() {
  return (
    <div className="con-page">
      <Section title="Canonical" note="Supplied to every task that touches the area.">
        {knowledge.canonical.map((k) => (
          <div key={k.id} className={'con-row is-static' + (k.flagged ? ' is-flagged' : '')}>
            {k.flagged ? <span className="dot-signal" /> : <span className="dot-done" />}
            <span className="con-row-title wide">{k.t}</span>
            <span className="con-row-why">{k.meta}</span>
            <span className="con-row-time">{k.pending ? 'proposed' : k.used}</span>
          </div>
        ))}
      </Section>
      <Section title="Episodic" note="Retained from one piece of work. Not doctrine.">
        {knowledge.episodic.map((k) => (
          <div key={k.id} className={'con-row is-static' + (k.flagged ? ' is-flagged' : '')}>
            {k.flagged ? <span className="dot-signal" /> : <span className="dot-done" />}
            <span className="con-row-title wide">{k.t}</span>
            <span className="con-row-why">{k.meta}</span>
            <span className="con-row-time">{k.used}</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Art() {
  return (
    <div className="con-page">
      <Section title="Artifacts" note="Useful output that does not belong in the repository.">
        {artifacts.map((r) => (
          <div key={r.id} className="con-row is-static">
            <Icon name="artifact" size={13} style={{ color: 'var(--t-4)' }} />
            <span className="con-row-kind">{r.kind}</span>
            <span className="con-row-title">{r.t}</span>
            <span className="con-row-why">{r.meta}</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Repo() {
  return (
    <div className="con-page">
      <Section title="Worktrees" note={`Each task works in isolation. HEAD is ${repo.head}.`}>
        {repo.worktrees.map((w) => (
          <div key={w.id} className="con-row is-static">
            <Icon name="branch" size={13} style={{ color: 'var(--t-4)' }} />
            <span className="con-row-title mono">{w.branch}</span>
            <span className="con-row-kind">{w.state}</span>
            <span className="con-row-why">task {w.task}</span>
            <span className="con-row-time tnum">{w.ahead ? `+${w.ahead}` : '—'}</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Rules() {
  return (
    <div className="con-page">
      <Section title="Orchestration" note="Why graphs extend themselves without asking.">
        {rules.map((g) => (
          <div key={g.id} className="con-rule">
            <div className="con-rule-line">
              <span className="con-rule-kw">When</span> {g.when}
            </div>
            <div className="con-rule-line">
              <span className="con-rule-kw">Then</span> {g.then}
            </div>
            <div className="con-rule-meta">
              <span>{g.src}</span>
              <span className="con-rule-fired">{g.fired}</span>
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}

/* Attention across every project. The only surface in this direction that
   is not scoped to the project you are inside. */
function Inbox({ live, onOpen, project }) {
  return (
    <div className="con-page">
      <Section title={project.name} note="In the project you are inside." signal={live.length > 0}>
        {live.map((a) => (
          <button key={a.id} className="con-row is-signal" onClick={() => onOpen(a.id)}>
            <span className="dot-signal" />
            <span className="con-row-kind">{a.kind}</span>
            <span className="con-row-title">{a.title}</span>
            <span className="con-row-why">{a.raisedBy}</span>
            <span className="con-row-time tnum">{a.raisedAt}</span>
            <Icon name="chevron" size={12} className="con-row-go" />
          </button>
        ))}
        {!live.length && <p className="con-empty">Nothing here needs you.</p>}
      </Section>

      <Section title="Elsewhere" note="Switching project is not required to see it.">
        {elsewhere.map((a) => (
          <div key={a.id} className="con-row is-static is-signal">
            <span className="dot-signal" />
            <span className="con-row-kind">{a.kind}</span>
            <span className="con-row-title">{a.title}</span>
            <span className="con-row-why">{a.project} · {a.raisedBy}</span>
            <span className="con-row-time tnum">{a.raisedAt}</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

/* ⌘K. In a keyboard-first console this is how work actually starts. */
function Palette({ onClose, onGo, onOpenItem }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const ref = useDismiss(true, onClose)

  const items = [
    ...attention.map((a) => ({ id: 'a' + a.id, t: a.title, g: 'Needs you', m: a.raisedAt, signal: true, run: () => onOpenItem(a.id) })),
    ...execution.map((t) => ({ id: 'e' + t.id, t: t.title, g: t.stateLabel, m: t.elapsed, run: () => onGo('exec') })),
    ...DESTS.filter((d) => d.id !== 'home').map((d) => ({ id: 'd' + d.id, t: d.label, g: 'Go to', m: '', run: () => onGo(d.id) })),
    ...knowledge.canonical.map((k) => ({ id: 'k' + k.id, t: k.t, g: 'Canonical', m: k.used, run: () => onGo('know') })),
    ...artifacts.map((r) => ({ id: 'r' + r.id, t: r.t, g: r.kind, m: r.meta, run: () => onGo('art') })),
  ]
  const hits = q.trim()
    ? items.filter((i) => (i.t + ' ' + i.g).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 9)
    : items.slice(0, 9)

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((x) => Math.min(x + 1, hits.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel((x) => Math.max(x - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); hits[sel]?.run() }
    if (e.key === 'Escape')    { e.preventDefault(); onClose() }
  }

  return (
    <div className="con-scrim">
      <div className="con-palette" ref={ref}>
        <div className="con-palette-input">
          <Icon name="search" size={14} />
          <input
            autoFocus value={q} spellCheck="false"
            onChange={(e) => { setQ(e.target.value); setSel(0) }}
            onKeyDown={onKeyDown}
            placeholder="Go to, open, or search what the project retained"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="con-palette-list">
          {hits.map((h, i) => (
            <button
              key={h.id}
              className={'con-palette-item' + (i === sel ? ' is-sel' : '')}
              onMouseEnter={() => setSel(i)}
              onClick={h.run}
            >
              {h.signal ? <span className="dot-signal" /> : <span className="dot-done" />}
              <span className="con-palette-t">{h.t}</span>
              <span className="con-palette-g">{h.g}</span>
              {h.m && <span className="con-palette-m">{h.m}</span>}
            </button>
          ))}
          {!hits.length && <div className="con-palette-empty">Nothing matches “{q}”.</div>}
        </div>
      </div>
    </div>
  )
}

/* ---- Zone 3: the coordinator, permanently docked ------------------------*/
const SEED = [
  { who: 'co', text: `You were away ${sinceLast.away}. Two things need you: the API fallback decision on task 418, and approval before legacy_session is dropped.` },
  { who: 'co', text: 'Everything else moved. Refund idempotency merged. A security review was added to token refresh on its own after the graph touched authentication files.' },
]

function Coordinator({ open, setOpen }) {
  const [msgs, setMsgs] = useState(SEED)
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs])

  const send = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMsgs((m) => [...m, { who: 'me', text }])
    setDraft('')
    setTimeout(() => {
      setMsgs((m) => [...m, {
        who: 'co',
        text: 'Refining that into a task. It touches the delivery path, so the webhook retry contract and the v2 migration plan will go to the worker as context.',
        pending: true,
      }])
    }, 420)
  }

  if (!open) return null

  return (
    <aside className="con-coord">
      <div className="con-coord-head">
        <span className="eyebrow">Coordinator</span>
        <span className="con-coord-state">
          <span className="pulse" />
          <span className="tnum">{execution.filter((e) => e.state === 'running').length} running</span>
        </span>
        <button className="con-coord-close" onClick={() => setOpen(false)}><Icon name="close" size={12} /></button>
      </div>

      <div className="con-workers">
        {execution.map((t) => (
          <div key={t.id} className={'con-worker is-' + t.state} title={t.title}>
            <span className="con-worker-bar" />
            <span className="con-worker-text">
              <span className="con-worker-stage">{t.stateLabel}</span>
              <span className="con-worker-title">{t.title}</span>
            </span>
            <span className="con-worker-time tnum">{t.elapsed}</span>
          </div>
        ))}
      </div>

      <div className="con-thread">
        {msgs.map((m, i) => (
          <div key={i} className={'con-msg is-' + m.who}>
            {m.who === 'co' && <span className="con-msg-mark" />}
            <p>{m.text}</p>
            {m.pending && <span className="con-msg-pending"><span className="pulse" />preparing context</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="con-say" onSubmit={send}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tell the project what you want" spellCheck="false" />
        <button type="submit" className="con-say-go" disabled={!draft.trim()}><Icon name="arrow" size={13} /></button>
      </form>
    </aside>
  )
}
