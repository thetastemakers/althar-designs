import { useEffect, useRef, useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { useCompact, useDismiss, useKey } from '../../lib/hooks.js'
import {
  artifacts, attention, brief, conversation, execution, intent,
  knowledge, projects, settled,
} from '../../data/project.js'
import './Standup.css'

const VIEWS = [
  { id: 'board', label: 'Board' },
  { id: 'know',  label: 'Knowledge' },
  { id: 'art',   label: 'Artifacts' },
]

export default function Standup() {
  const narrow = useCompact(980)
  const [projectId, setProjectId] = useState('meridian')
  const [switcher, setSwitcher] = useState(false)
  const [view, setView] = useState('board')
  const [peek, setPeek] = useState(null)          // { kind, id }
  const [answered, setAnswered] = useState([])
  const [said, setSaid] = useState([])            // appended conversation
  const [opened, setOpened] = useState([])        // threads opened this session
  const [pane, setPane] = useState('talk')        // narrow windows show one
  const composerRef = useRef(null)
  const project = projects.find((p) => p.id === projectId)

  const live = attention.filter((a) => !answered.includes(a.id))
  const released = answered.includes('a1')

  useKey((e, typing) => {
    if (typing) {
      if (e.key === 'Escape') e.target.blur()
      return
    }
    if (e.key === 'Escape') { setPeek(null); setSwitcher(false) }
    if (e.key === 'c') { e.preventDefault(); composerRef.current?.focus() }
  }, [])

  /* Saying something to the coordinator opens a thread. The thread's interior
     is not this prototype's subject — what matters is that it appears on the
     board as work, immediately. */
  const say = (text) => {
    const ref = String(423 + opened.length)
    const id = 'n' + ref
    setSaid((s) => [...s, { id: id + '-you', who: 'you', at: 'just now', body: text }])
    setOpened((o) => [...o, { id, ref, title: text, state: 'Scoping', worker: 'claude-opus-5', elapsed: 'just now' }])
    window.setTimeout(() => {
      setSaid((s) => [...s, {
        id: id + '-co', who: 'coordinator', at: 'just now',
        body: `Opened task ${ref}. I am scoping it against the project first — if it needs a decision you will get it here rather than a half-finished branch.`,
      }, {
        id: id + '-th', who: 'thread', ref, link: id, title: text,
        state: 'Scoping', at: 'just now', meta: 'claude-opus-5 · 1 of 4 steps',
      }])
    }, 620)
  }

  const record = (a, option) => {
    setAnswered((v) => [...v, a.id])
    setPeek(null)
    setSaid((s) => [...s, {
      id: a.id + '-rec', who: 'coordinator', at: 'just now',
      body: a.blocking
        ? `Recorded: ${option.label.toLowerCase()}. Work held on ${a.blocking} resumes with this as the reason.`
        : `Recorded: ${option.label.toLowerCase()}. Project knowledge is consistent again.`,
    }])
  }

  return (
    <div className={'stu' + (narrow ? ' is-narrow' : '') + (narrow ? ' pane-' + pane : '')}>
      <Chrome
        project={project} projects={projects}
        switcher={switcher} setSwitcher={setSwitcher}
        onPick={(id) => { setProjectId(id); setSwitcher(false); setPeek(null) }}
        needs={live.length}
        running={execution.filter((e) => e.state === 'running').length + opened.length + (released ? 1 : 0)}
        onNeeds={() => { if (narrow) setPane('board'); setPeek(live[0] ? { kind: 'att', id: live[0].id } : null) }}
        narrow={narrow} pane={pane} setPane={setPane}
      />

      <Talk
        said={said} live={live} answered={answered}
        onOpen={(p) => { if (narrow) setPane('board'); setPeek(p) }}
        onSay={say} composerRef={composerRef}
      />

      <Board
        view={view} setView={setView}
        live={live} opened={opened} released={released}
        peek={peek} onOpen={setPeek}
      />

      {peek && (
        <Peek
          peek={peek} opened={opened}
          onClose={() => setPeek(null)}
          onRecord={record}
        />
      )}
    </div>
  )
}

/* ---- Application chrome -------------------------------------------------*/
function Chrome({ project, projects, switcher, setSwitcher, onPick, needs, running, onNeeds, narrow, pane, setPane }) {
  const ref = useDismiss(switcher, () => setSwitcher(false))
  return (
    <header className="stu-chrome">
      <div className="traffic"><i /><i /><i /></div>

      <div className="stu-switch-wrap" ref={ref}>
        <button className={'stu-switch' + (switcher ? ' is-open' : '')} onClick={() => setSwitcher(!switcher)}>
          <span className="stu-switch-name">{project.name}</span>
          <Icon name="chevronD" size={11} className="stu-switch-caret" />
        </button>
        {switcher && (
          <div className="stu-pop">
            <div className="stu-pop-head eyebrow">Projects</div>
            {projects.map((p) => (
              <button key={p.id} className={'stu-pop-row' + (p.id === project.id ? ' is-on' : '')} onClick={() => onPick(p.id)}>
                <span className="stu-pop-main">
                  <span className="stu-pop-name">{p.name}</span>
                  <span className="stu-pop-desc">{p.desc}</span>
                </span>
                <span className="stu-pop-meta">
                  {p.needsYou > 0 && <span className="stu-pop-needs">{p.needsYou}</span>}
                  {p.active > 0 && <span className="pulse" />}
                  <span className="stu-pop-when">{p.lastTouched}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="stu-chrome-intent">{intent.headline}</span>

      {narrow && (
        <div className="stu-panes">
          <button className={'stu-pane-tab' + (pane === 'talk' ? ' is-on' : '')} onClick={() => setPane('talk')}>Conversation</button>
          <button className={'stu-pane-tab' + (pane === 'board' ? ' is-on' : '')} onClick={() => setPane('board')}>Board</button>
        </div>
      )}

      <div className="stu-chrome-right">
        <span className="stu-chrome-run"><span className="pulse" />{running} running</span>
        <button className={'stu-chrome-needs' + (needs ? ' is-signal' : '')} onClick={onNeeds} disabled={!needs}>
          {needs ? `${needs} need you` : 'Nothing needs you'}
        </button>
      </div>
    </header>
  )
}

/* ---- The conversation ---------------------------------------------------
   One continuous thread with the coordinator. It did not start when the
   window opened and it does not end when it closes. */
function Talk({ said, live, answered, onOpen, onSay, composerRef }) {
  const scroll = useRef(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const el = scroll.current
    if (el) el.scrollTop = el.scrollHeight
  }, [said.length])

  const submit = (e) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    onSay(t)
    setDraft('')
  }

  return (
    <section className="stu-talk">
      <div className="stu-talk-head">
        <span className="stu-talk-title">Coordinator</span>
        <span className="stu-talk-sub">Continuous · since 4 January</span>
      </div>

      <div className="stu-talk-scroll" ref={scroll}>
        {conversation.map((m) => (
          <Entry key={m.id} m={m} live={live} answered={answered} onOpen={onOpen} />
        ))}
        {said.map((m) => (
          <Entry key={m.id} m={m} live={live} answered={answered} onOpen={onOpen} />
        ))}
      </div>

      <form className="stu-composer" onSubmit={submit}>
        <input
          ref={composerRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tell the project what you want next"
          aria-label="Tell the project what you want next"
        />
        {draft.trim()
          ? <button className="stu-composer-send" type="submit"><Icon name="arrow" size={13} /></button>
          : <span className="kbd">c</span>}
      </form>
    </section>
  )
}

function Entry({ m, live, answered, onOpen }) {
  if (m.who === 'brief') return <Brief live={live} answered={answered} onOpen={onOpen} />
  if (m.who === 'thread') return <ThreadCard m={m} onOpen={onOpen} />
  return (
    <div className={'stu-msg is-' + m.who}>
      <div className="stu-msg-head">
        <span className="stu-msg-who">{m.who === 'you' ? 'You' : 'Coordinator'}</span>
        <span className="stu-msg-at">{m.at}</span>
      </div>
      <p className="stu-msg-body">{m.body}</p>
    </div>
  )
}

/* A thread the coordinator opened. You can see that it exists, what it is
   doing and how far along it is — opening it is a surface of its own. */
function ThreadCard({ m, onOpen }) {
  const t = execution.find((x) => x.id === m.link)
  const done = t ? t.graph.filter((n) => n.state === 'done').length : 0
  const total = t ? t.graph.length : 4
  return (
    <button className="stu-thread" onClick={() => onOpen({ kind: t ? 'work' : 'new', id: m.link })}>
      <span className="stu-thread-top">
        <span className="mono stu-thread-ref">{m.ref}</span>
        <span className="stu-thread-state">{m.state}</span>
        <span className="stu-thread-at">{m.at}</span>
      </span>
      <span className="stu-thread-title">{m.title}</span>
      <span className="stu-thread-bar">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < done ? 'is-done' : i === done ? 'is-run' : ''} />
        ))}
      </span>
      <span className="stu-thread-meta">{m.meta}</span>
    </button>
  )
}

/* ---- The overnight brief ------------------------------------------------*/
function Brief({ live, answered, onOpen }) {
  return (
    <>
      <div className="stu-away">
        <span className="stu-away-line" />
        <span className="stu-away-text">You were away {brief.away}</span>
        <span className="stu-away-line" />
      </div>

      <div className="stu-msg is-coordinator stu-brief">
        <div className="stu-msg-head">
          <span className="stu-msg-who">Coordinator</span>
          <span className="stu-msg-at">{brief.at}</span>
        </div>
        <p className="stu-msg-body">{brief.open}</p>

        <div className="stu-brief-block">
          <div className="eyebrow stu-brief-label">Needs you</div>
          {brief.needs.map((n) => {
            const done = answered.includes(n.id)
            return (
              <button
                key={n.id}
                className={'stu-brief-need' + (done ? ' is-done' : '')}
                onClick={() => !done && onOpen({ kind: 'att', id: n.id })}
                disabled={done}
              >
                <span className={done ? 'dot-done' : 'dot-signal'} />
                <span className="stu-brief-need-t">{n.t}</span>
                {n.ref && <span className="mono stu-brief-need-ref">{n.ref}</span>}
                {done && <span className="stu-brief-need-ref">answered</span>}
              </button>
            )
          })}
          {!live.length && <div className="stu-brief-empty">All three are answered.</div>}
        </div>

        <div className="stu-brief-block">
          <div className="eyebrow stu-brief-label">Moved</div>
          {brief.moved.map((x) => (
            <div className="stu-brief-row" key={x.t}>
              <span className="stu-brief-row-t">{x.t}</span>
              <span className="stu-brief-row-m">{x.meta}</span>
            </div>
          ))}
        </div>

        <div className="stu-brief-block">
          <div className="eyebrow stu-brief-label">Still running</div>
          {brief.running.map((x) => (
            <div className="stu-brief-row" key={x.t}>
              <span className="stu-brief-row-t">{x.t}</span>
              <span className="stu-brief-row-m">{x.meta}</span>
            </div>
          ))}
        </div>

        <p className="stu-msg-body stu-brief-did">{brief.did}</p>
        <p className="stu-msg-body">{brief.close}</p>
      </div>
    </>
  )
}

/* ---- The board ----------------------------------------------------------*/
function Board({ view, setView, live, opened, released, peek, onOpen }) {
  return (
    <section className="stu-board">
      <div className="stu-board-head">
        <div className="stu-views">
          {VIEWS.map((v) => (
            <button key={v.id} className={'stu-view' + (v.id === view ? ' is-on' : '')} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
        <span className="stu-board-note">
          {view === 'board' && `${execution.length + opened.length} in flight · ${settled.length} settled today`}
          {view === 'know' && `${knowledge.canonical.length} canonical · ${knowledge.episodic.length} episodic · retained by the project, not by a worker`}
          {view === 'art' && `${artifacts.length} artifacts · outputs kept outside the repository`}
        </span>
      </div>

      {view === 'board' && <Columns live={live} opened={opened} released={released} peek={peek} onOpen={onOpen} />}
      {view === 'know' && <Know />}
      {view === 'art' && <Art />}
    </section>
  )
}

function Columns({ live, opened, released, peek, onOpen }) {
  const running = execution.filter((e) => e.state === 'running')
  const held = execution.filter((e) => e.state === 'blocked' && !released)
  const resumed = released ? execution.filter((e) => e.state === 'blocked') : []
  return (
    <div className="stu-cols">
      <Col title="Needs you" count={live.length} signal>
        {live.map((a) => (
          <AttCard key={a.id} a={a} on={peek?.id === a.id} onOpen={() => onOpen({ kind: 'att', id: a.id })} />
        ))}
        {!live.length && <Empty>No decisions are waiting.</Empty>}
      </Col>

      <Col title="Running" count={running.length + opened.length + resumed.length}>
        {opened.map((t) => (
          <NewCard key={t.id} t={t} on={peek?.id === t.id} onOpen={() => onOpen({ kind: 'new', id: t.id })} />
        ))}
        {resumed.map((t) => (
          <WorkCard key={t.id} t={t} resumed on={peek?.id === t.id} onOpen={() => onOpen({ kind: 'work', id: t.id })} />
        ))}
        {running.map((t) => (
          <WorkCard key={t.id} t={t} on={peek?.id === t.id} onOpen={() => onOpen({ kind: 'work', id: t.id })} />
        ))}
      </Col>

      <Col title="Held" count={held.length}>
        {held.map((t) => (
          <WorkCard key={t.id} t={t} on={peek?.id === t.id} onOpen={() => onOpen({ kind: 'work', id: t.id })} />
        ))}
        {!held.length && <Empty>Nothing is waiting on a decision.</Empty>}
      </Col>

      <Col title="Settled" count={settled.length}>
        {settled.map((s) => (
          <SettledCard key={s.id} s={s} on={peek?.id === s.id} onOpen={() => onOpen({ kind: 'settled', id: s.id })} />
        ))}
      </Col>
    </div>
  )
}

function Col({ title, count, signal, children }) {
  return (
    <div className="stu-col">
      <div className="stu-col-head">
        <span className="stu-col-title">{title}</span>
        <span className={'stu-col-count' + (signal && count ? ' is-signal' : '')}>{count}</span>
      </div>
      <div className="stu-col-body">{children}</div>
    </div>
  )
}

const Empty = ({ children }) => <div className="stu-col-empty">{children}</div>

function AttCard({ a, on, onOpen }) {
  return (
    <button className={'stu-card is-att' + (on ? ' is-on' : '')} onClick={onOpen}>
      <span className="stu-card-top">
        <span className="stu-card-kind is-signal">{a.kind}</span>
        <span className="stu-card-at">{a.raisedAt}</span>
      </span>
      <span className="stu-card-title">{a.title}</span>
      <span className="stu-card-foot">{a.blocking ? `Holds ${a.blocking}` : a.raisedBy}</span>
    </button>
  )
}

function WorkCard({ t, on, resumed, onOpen }) {
  const done = t.graph.filter((n) => n.state === 'done').length
  const added = t.graph.some((n) => n.added)
  return (
    <button className={'stu-card' + (on ? ' is-on' : '') + (t.state === 'blocked' && !resumed ? ' is-held' : '')} onClick={onOpen}>
      <span className="stu-card-top">
        <span className="mono stu-card-ref">{t.ref}</span>
        <span className="stu-card-kind">{resumed ? 'Requirements' : t.stateLabel}</span>
        <span className="stu-card-at">{t.elapsed}</span>
      </span>
      <span className="stu-card-title">{t.title}</span>
      <Bar graph={t.graph} resumed={resumed} />
      <span className="stu-card-foot">
        {resumed ? 'claude-opus-5' : t.worker || 'no worker assigned'}
        {added && <span className="stu-card-added">+ security review</span>}
      </span>
    </button>
  )
}

function NewCard({ t, on, onOpen }) {
  return (
    <button className={'stu-card is-new' + (on ? ' is-on' : '')} onClick={onOpen}>
      <span className="stu-card-top">
        <span className="mono stu-card-ref">{t.ref}</span>
        <span className="stu-card-kind">{t.state}</span>
        <span className="stu-card-at">{t.elapsed}</span>
      </span>
      <span className="stu-card-title">{t.title}</span>
      <span className="stu-card-bar">
        <i className="is-run" /><i /><i /><i />
      </span>
      <span className="stu-card-foot">{t.worker}</span>
    </button>
  )
}

function SettledCard({ s, on, onOpen }) {
  return (
    <button className={'stu-card is-settled' + (on ? ' is-on' : '')} onClick={onOpen}>
      <span className="stu-card-top">
        <span className="mono stu-card-ref">{s.ref}</span>
        <span className="stu-card-kind">{s.outcome}</span>
        <span className="stu-card-at">{s.when}</span>
      </span>
      <span className="stu-card-title">{s.title}</span>
      <span className="stu-card-foot">{s.meta}</span>
    </button>
  )
}

function Bar({ graph, resumed }) {
  return (
    <span className="stu-card-bar">
      {graph.map((n, i) => (
        <i
          key={n.id}
          className={
            resumed ? (i === 0 ? 'is-run' : '')
              : n.state === 'done' ? 'is-done'
              : n.state === 'running' ? 'is-run'
              : n.state === 'blocked' ? 'is-held' : ''
          }
        />
      ))}
    </span>
  )
}

function Know() {
  return (
    <div className="stu-plain">
      <div className="stu-plain-col">
        <div className="eyebrow stu-plain-label">Canonical</div>
        {knowledge.canonical.map((k) => (
          <div className="stu-plain-row" key={k.id}>
            <span className="stu-plain-t">
              {k.flagged && <span className="dot-signal" />}
              {k.t}
            </span>
            <span className="stu-plain-meta">
              <span className="stu-plain-m">{k.meta}</span>
              <span className="stu-plain-u">{k.used}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="stu-plain-col">
        <div className="eyebrow stu-plain-label">Episodic</div>
        {knowledge.episodic.map((k) => (
          <div className="stu-plain-row" key={k.id}>
            <span className="stu-plain-t">
              {k.flagged && <span className="dot-signal" />}
              {k.t}
            </span>
            <span className="stu-plain-meta">
              <span className="stu-plain-m">{k.meta}</span>
              <span className="stu-plain-u">{k.used}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Art() {
  return (
    <div className="stu-plain">
      <div className="stu-plain-col stu-plain-wide">
        {artifacts.map((a) => (
          <div className="stu-plain-row" key={a.id}>
            <span className="stu-plain-t">{a.t}</span>
            <span className="stu-plain-meta">
              <span className="stu-plain-m">{a.kind}</span>
              <span className="stu-plain-u">{a.meta}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- Opening a card -----------------------------------------------------
   A card opens far enough to act on: why it stopped, what the choices are,
   how far execution got. The thread's own conversation lives one level
   deeper and is not part of this exploration. */
function Peek({ peek, opened, onClose, onRecord }) {
  const ref = useDismiss(true, onClose)
  const [choice, setChoice] = useState(null)

  let body = null
  let head = null

  if (peek.kind === 'att') {
    const a = attention.find((x) => x.id === peek.id)
    head = <><span className="stu-peek-kind is-signal">{a.kind}</span><span className="stu-peek-at">{a.raisedBy} · {a.raisedAt}</span></>
    body = (
      <>
        <h2 className="stu-peek-title">{a.title}</h2>
        <p className="stu-peek-because">{a.because}</p>
        <p className="stu-peek-detail">{a.detail}</p>

        <div className="eyebrow stu-peek-label">Your choice</div>
        <div className="stu-peek-options">
          {a.options.map((o) => (
            <button
              key={o.id}
              className={'stu-opt' + (choice === o.id ? ' is-on' : '')}
              onClick={() => setChoice(o.id)}
            >
              <span className="stu-opt-mark" />
              <span className="stu-opt-text">
                <span className="stu-opt-label">{o.label}</span>
                <span className="stu-opt-note">{o.note}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="eyebrow stu-peek-label">What the project knows</div>
        <ul className="stu-peek-ev">
          {a.evidence.map((e) => <li key={e}>{e}</li>)}
        </ul>

        <div className="stu-peek-act">
          <button
            className="stu-btn"
            disabled={!choice}
            onClick={() => onRecord(a, a.options.find((o) => o.id === choice))}
          >
            Record decision
          </button>
          <span className="stu-peek-act-note">
            {a.blocking ? `Releases ${a.blocking}` : 'Resolves the contradiction in project knowledge'}
          </span>
        </div>
      </>
    )
  }

  if (peek.kind === 'work') {
    const t = execution.find((x) => x.id === peek.id)
    head = <><span className="mono stu-peek-ref">{t.ref}</span><span className="stu-peek-at">{t.branch || 'no branch'} · {t.elapsed}</span></>
    body = (
      <>
        <h2 className="stu-peek-title">{t.title}</h2>
        {t.note && <p className="stu-peek-because">{t.note}</p>}

        <div className="eyebrow stu-peek-label">Execution</div>
        <ol className="stu-graph">
          {t.graph.map((n) => (
            <li key={n.id} className={'stu-node is-' + n.state}>
              <span className="stu-node-dot">
                {n.state === 'running' ? <span className="pulse" />
                  : n.state === 'done' ? <span className="dot-done" />
                  : n.state === 'blocked' ? <span className="dot-signal" />
                  : <span className="dot-queue" />}
              </span>
              <span className="stu-node-text">
                <span className="stu-node-label">
                  {n.label}
                  {n.added && <span className="stu-node-added">added by rule</span>}
                </span>
                {n.meta && <span className="stu-node-meta">{n.meta}</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className="stu-peek-foot">
          {t.worker ? `Current worker · ${t.worker}` : 'No worker holds this task'}
        </div>
      </>
    )
  }

  if (peek.kind === 'new') {
    const t = opened.find((x) => x.id === peek.id)
    head = <><span className="mono stu-peek-ref">{t.ref}</span><span className="stu-peek-at">opened just now</span></>
    body = (
      <>
        <h2 className="stu-peek-title">{t.title}</h2>
        <p className="stu-peek-because">Opened from the conversation. Scoping against project knowledge before any code is written.</p>
        <div className="eyebrow stu-peek-label">Execution</div>
        <ol className="stu-graph">
          <li className="stu-node is-running"><span className="stu-node-dot"><span className="pulse" /></span>
            <span className="stu-node-text"><span className="stu-node-label">Scope</span><span className="stu-node-meta">reading canonical knowledge</span></span></li>
          <li className="stu-node is-queued"><span className="stu-node-dot"><span className="dot-queue" /></span>
            <span className="stu-node-text"><span className="stu-node-label">Requirements</span></span></li>
          <li className="stu-node is-queued"><span className="stu-node-dot"><span className="dot-queue" /></span>
            <span className="stu-node-text"><span className="stu-node-label">Implement</span></span></li>
          <li className="stu-node is-queued"><span className="stu-node-dot"><span className="dot-queue" /></span>
            <span className="stu-node-text"><span className="stu-node-label">Review</span><span className="stu-node-meta">model chosen once the diff is known</span></span></li>
        </ol>
        <div className="stu-peek-foot">Current worker · {t.worker}</div>
      </>
    )
  }

  if (peek.kind === 'settled') {
    const s = settled.find((x) => x.id === peek.id)
    head = <><span className="mono stu-peek-ref">{s.ref}</span><span className="stu-peek-at">{s.outcome} · {s.when}</span></>
    body = (
      <>
        <h2 className="stu-peek-title">{s.title}</h2>
        <p className="stu-peek-because">{s.meta}</p>
        <div className="stu-peek-foot">Retained by the project. No worker holds it.</div>
      </>
    )
  }

  return (
    <aside className="stu-peek" ref={ref}>
      <div className="stu-peek-head">
        {head}
        <button className="stu-peek-close" onClick={onClose} title="Close  Esc"><Icon name="close" size={12} /></button>
      </div>
      <div className="stu-peek-body">{body}</div>
    </aside>
  )
}
