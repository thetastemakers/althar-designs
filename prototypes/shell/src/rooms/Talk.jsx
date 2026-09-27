import { useEffect, useRef, useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useDismiss } from '../lib/hooks.js'
import { brief, conversation, intent, issues } from '../data/project.js'
import Model, { MODELS } from '../lib/Model.jsx'
import Composer from '../lib/Composer.jsx'
import { Streamed } from '../lib/Stream.jsx'
import Listening from '../lib/Listening.jsx'
import { COORDINATOR_LISTENS } from '../chat/listen.js'
import { Issue, TaskCard, TaskLaunch, TaskMark } from '../chat/coordinator.jsx'
import { LimitMoved } from '../chat/parts.jsx'
import '../task/task.css'
import '../chat/chat.css'

/* The conversation room. One continuous thread with the coordinator: what
   you asked for, what it did about it, and the work it opened. */
export default function Talk({ said, answered, onOpen, onSay, onStart, onStreamed, composerRef, dock, draft, setDraft, side, project, onRename }) {
  const scroll = useRef(null)
  /* The coordinator is a model too, and you choose it. Swapping keeps the
     whole conversation: it is the project's, compacted, not the model's. */
  const [coord, setCoord] = useState('claude-opus-5')
  const [swaps, setSwaps] = useState([])
  const [listens, setListens] = useState(COORDINATOR_LISTENS)

  useEffect(() => {
    const el = scroll.current
    if (el) el.scrollTop = el.scrollHeight
  }, [said.length, swaps.length])

  /* while a reply streams in, the thread follows it, unless you have
     scrolled up to read something else */
  const pinned = useRef(true)
  useEffect(() => {
    const el = scroll.current
    if (!el) return
    const onScroll = () => { pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90 }
    const ro = new ResizeObserver(() => { if (pinned.current) el.scrollTop = el.scrollHeight })
    el.addEventListener('scroll', onScroll, { passive: true })
    ro.observe(el.firstElementChild)
    return () => { el.removeEventListener('scroll', onScroll); ro.disconnect() }
  }, [])


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
          {(() => {
            const all = [...conversation, ...said]
            /* where each task is now, from its live card; and which of its
               folded lines is the most recent, the one that says so */
            const now = {}, lastMark = {}
            all.forEach((m) => {
              if (m.who === 'card') now[m.task] = m.status === 'you' ? 'Waiting on you' : m.status === 'done' ? (m.kind === 'Question' ? 'Answered' : 'Done') : m.steps?.[m.step]
              if (m.who === 'mark') lastMark[m.task] = m.id
            })
            const jump = (ref) => {
              const el = scroll.current?.querySelector(`.cs-tc[data-task="${ref}"]`)
              if (!el) return
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              el.classList.remove('is-found'); void el.offsetWidth; el.classList.add('is-found')
            }
            return all.map((m, i) => (
              <Entry key={m.id} m={m} first={turnStarts(all, i)} answered={answered} onOpen={onOpen} onStart={onStart} onStreamed={onStreamed}
                now={now[m.task]} last={lastMark[m.task] === m.id} onJump={() => jump(m.task)} />
            ))
          })()}
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
          above={listens.length > 0 && (
            <Listening sources={listens} onStop={(id) => setListens((v) => v.filter((x) => x.id !== id))}
              note="What arrives comes into this conversation. Tasks listen to their own pull requests." />
          )}
        />
      </div>
    </section>
  )
}

/* A turn is everything one side says before the other answers. The quiet
   lines (a task that moved on, a limit handled) belong to neither side, so
   whatever the coordinator says after one starts a turn of its own. */
const side = (m) => (m.who === 'you' ? 'you' : m.who === 'mark' || m.who === 'moved' ? 'line' : 'them')
const turnStarts = (all, i) => i === 0 || side(all[i - 1]) !== side(all[i]) || all[i].who === 'brief' || all[i - 1].who === 'brief'

function Entry({ m, first, answered, onOpen, onStart, onStreamed, now, last, onJump }) {
  if (m.who === 'brief') return <Brief answered={answered} onOpen={onOpen} />
  if (m.who === 'you') {
    return (
      <div className={'rm-you' + (first ? ' is-first' : '')}>
        <p className="rm-you-body">{m.body}</p>
        {m.issue && <div className="cs-unfurl rm-unfurl"><Issue {...issues[m.issue]} /></div>}
        <span className="rm-you-at">{m.at}</span>
      </div>
    )
  }
  if (m.who === 'mark') {
    return (
      <div className={'rm-line' + (first ? ' is-first' : '')}>
        <TaskMark task={m.task} verb={m.verb} detail={m.detail} at={m.at} steps={m.steps} step={m.step} seen={m.seen}
          now={now} last={last} onJump={onJump} />
      </div>
    )
  }
  if (m.who === 'moved') {
    return <div className={'rm-line' + (first ? ' is-first' : '')}><LimitMoved what={m.what} to={m.to} runtime={m.runtime} resets={m.resets} /></div>
  }
  const openTask = () => onOpen(m.who === 'launch'
    ? { kind: 'new', id: 'n' + m.task }
    : { kind: 'thread', ref: m.task, view: m.view, id: m.link, fallback: m.fallback || 'work' })
  return (
    <div className={'rm-turn' + (first ? ' is-first' : '')}>
      {first && (
        <div className="rm-msg-head">
          <span className="rm-msg-who">Coordinator</span>
          <span className="rm-msg-at">{m.at}</span>
        </div>
      )}
      {m.who === 'card'
        ? <TaskCard task={m.task} status={m.status} kind={m.kind} title={m.title} lead={m.lead} branch={m.branch} from={m.from}
            steps={m.steps} at={m.step} seen={m.seen} now={m.now} started={m.started} pr={m.pr} meta={m.meta}
            fresh={m.fresh} onOpen={openTask} />
        : m.who === 'launch'
        ? <TaskLaunch task={m.task} title={m.title} from={m.from} branch={m.branch} steps={m.steps} estimate={m.estimate} now={m.now}
            onStart={(t) => onStart?.({ ...t, id: m.id, ref: m.task })} onOpen={openTask} />
        : m.stream
        ? <Streamed text={m.body} id={m.id} className="rm-msg-body" onDone={() => onStreamed?.(m)} />
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
