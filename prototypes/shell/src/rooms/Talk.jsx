import { useEffect, useRef, useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useDismiss } from '../lib/hooks.js'
import { brief, conversation, execution, intent } from '../data/project.js'
import Model, { MODELS, WithModels } from '../lib/Model.jsx'
import Composer from '../lib/Composer.jsx'

/* The conversation room. One continuous thread with the coordinator: what
   you asked for, what it did about it, and the work it opened. */
export default function Talk({ said, answered, onOpen, onSay, composerRef, dock, draft, setDraft, side, project, onRename }) {
  const scroll = useRef(null)
  /* The coordinator is a model too, and you choose it. Swapping keeps the
     whole conversation: it is the project's, compacted, not the model's. */
  const [coord, setCoord] = useState('claude-opus-5')
  const [swaps, setSwaps] = useState([])

  useEffect(() => {
    const el = scroll.current
    if (el) el.scrollTop = el.scrollHeight
  }, [said.length, swaps.length])


  return (
    <section className={'rm-talk' + (side ? ' is-side' : '')}>
      <div className="rm-talk-head">
        <div className="rm-measure rm-talk-open">
          <span className="rm-talk-open-l">
            <span className="rm-talk-open-t">{intent.headline}</span>
            <span className="rm-talk-open-m">Project intent · set {intent.set}</span>
          </span>
          <ProjectMenu project={project} onRename={onRename} />
        </div>
      </div>

      <div className="rm-talk-scroll" ref={scroll}>
        <div className="rm-measure">
          {/* a turn is everything one side says before the other answers:
              the coordinator's messages and the work it opened sit under one
              name, and yours sit on the right */}
          {[...conversation, ...said].map((m, i, all) => (
            <Entry key={m.id} m={m} first={turnStarts(all, i)} answered={answered} onOpen={onOpen} dock={dock} />
          ))}
          {swaps.map((w, i) => (
            <div className="tv-swap" key={i}>
              <span>Coordinator changed to</span><Model id={w.to} />
              <span className="tv-swap-note">· reads the same conversation, from {MODELS[w.from]?.short}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rm-composer-wrap">
        <Composer
          className="rm-measure"
          inputRef={composerRef}
          value={draft} onChange={setDraft} onSubmit={(t) => { onSay(t); setDraft('') }}
          placeholder="Tell the project what you want next" hint="c"
          model={coord} role="Coordinator · Meridian"
          onModel={(to) => { setSwaps((w) => [...w, { from: coord, to }]); setCoord(to) }}
          context={{ used: 412, note: 'Compacted as it fills. The whole conversation stays in the project; older turns reach the model as a summary.' }}
        />
      </div>
    </section>
  )
}

const side = (m) => (m.who === 'you' ? 'you' : 'them')
const turnStarts = (all, i) => i === 0 || side(all[i - 1]) !== side(all[i]) || all[i].who === 'brief'

function Entry({ m, first, answered, onOpen, dock }) {
  if (m.who === 'brief') return <Brief answered={answered} onOpen={onOpen} />
  if (m.who === 'you') {
    return (
      <div className={'rm-you' + (first ? ' is-first' : '')}>
        <p className="rm-you-body">{m.body}</p>
        <span className="rm-you-at">{m.at}</span>
      </div>
    )
  }
  return (
    <div className={'rm-turn' + (first ? ' is-first' : '')}>
      {first && (
        <div className="rm-msg-head">
          <span className="rm-msg-who">Coordinator</span>
          <span className="rm-msg-at">{m.at}</span>
        </div>
      )}
      {m.who === 'thread'
        ? <ThreadCard m={m} onOpen={onOpen} dock={dock} />
        : <p className="rm-msg-body">{m.body}</p>}
    </div>
  )
}

/* The project's own controls, where the project is named in this view.
   Renaming happens in the switcher, where the name is. */
function ProjectMenu({ project, onRename }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const item = (icon, label, meta, act) => (
    <button className="rm-menu-i" onClick={() => { setOpen(false); act?.() }}>
      <Icon name={icon} size={12} /><span>{label}</span>{meta && <span className="rm-menu-m">{meta}</span>}
    </button>
  )
  return (
    <span className="rm-menu-wrap" ref={ref}>
      <button className={'rm-menu-b' + (open ? ' is-open' : '')} onClick={() => setOpen(!open)} title={`${project.name} options`}>
        <Icon name="more" size={14} />
      </button>
      {open && (
        <div className="rm-menu" role="menu">
          {item('pencil', 'Rename project', null, onRename)}
          {item('corner', 'Change the intent')}
          {item('branch', 'Repositories', (project.repos || project.repo || '').split(' · ').length)}
          {item('check', 'Rules', 4)}
          <span className="rm-menu-sep" />
          {item('gear', 'Project settings')}
        </div>
      )}
    </span>
  )
}

function ThreadCard({ m, onOpen, dock }) {
  const t = execution.find((x) => x.id === m.link)
  const done = t ? t.graph.filter((n) => n.state === 'done').length : 0
  const total = t ? t.graph.length : 4
  const on = dock?.id === m.link
  return (
    <button className={'rm-thread' + (on ? ' is-on' : '')}
      onClick={() => onOpen({ kind: 'thread', ref: m.ref, view: m.view, id: m.link, fallback: t ? 'work' : 'new' })}>
      <span className="rm-thread-top">
        <span className="mono rm-thread-ref">{m.ref}</span>
        <span className="rm-thread-state">{m.state}</span>
        <span className="rm-thread-at">{m.at}</span>
      </span>
      <span className="rm-thread-title">{m.title}</span>
      {/* A question has no steps to run down, and settled work has none
          left, so neither gets a bar to lie with. */}
      {!m.bare && !m.link?.startsWith('s') && (
        <span className="rm-bar">
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i < done ? 'is-done' : i === done ? 'is-run' : ''} />
          ))}
        </span>
      )}
      <span className="rm-thread-meta"><WithModels>{m.meta}</WithModels></span>
    </button>
  )
}

function Brief({ answered, onOpen }) {
  return (
    <>
      <div className="rm-away">
        <span className="rm-away-line" />
        <span className="rm-away-text">You were away {brief.away}</span>
        <span className="rm-away-line" />
      </div>

      <div className="rm-msg is-coordinator rm-brief">
        <div className="rm-msg-head">
          <span className="rm-msg-who">Coordinator</span>
          <span className="rm-msg-at">{brief.at}</span>
        </div>
        <p className="rm-msg-body">{brief.open}</p>

        <div className="rm-brief-block">
          <div className="eyebrow rm-brief-label">Needs you</div>
          {brief.needs.map((n) => {
            const done = answered.includes(n.id)
            return (
              <button
                key={n.id}
                className={'rm-need' + (done ? ' is-done' : '')}
                onClick={() => !done && onOpen({ kind: 'att', id: n.id })}
                disabled={done}
              >
                <span className={done ? 'dot-done' : 'dot-signal'} />
                <span className="rm-need-t">{n.t}</span>
                <span className="rm-need-ref">{done ? 'answered' : n.ref}</span>
              </button>
            )
          })}
        </div>

        <div className="rm-brief-block">
          <div className="eyebrow rm-brief-label">Moved</div>
          {brief.moved.map((x) => (
            <div className="rm-brief-row" key={x.t}>
              <span className="rm-brief-row-t">{x.t}</span>
              <span className="rm-brief-row-m">{x.meta}</span>
            </div>
          ))}
        </div>

        <div className="rm-brief-block">
          <div className="eyebrow rm-brief-label">Still running</div>
          {brief.running.map((x) => (
            <div className="rm-brief-row" key={x.t}>
              <span className="rm-brief-row-t">{x.t}</span>
              <span className="rm-brief-row-m">{x.meta}</span>
            </div>
          ))}
        </div>

        <p className="rm-msg-body">{brief.did}</p>
        <p className="rm-msg-body">{brief.close}</p>
      </div>
    </>
  )
}
