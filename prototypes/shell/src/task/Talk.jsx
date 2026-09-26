import { useEffect, useRef, useState } from 'react'
import Icon from '../lib/Icon.jsx'
import Model, { MODELS } from '../lib/Model.jsx'
import Composer from '../lib/Composer.jsx'
import {
  answerKnowledge, choice, decision, offer, produced,
  sessionKnowledge, spikes, used,
} from './data.js'
import { threads } from './threads.js'
import { Ask, Findings, KRow } from './parts.jsx'
import Diff from './Diff.jsx'

/* The conversation face.

   This is what you are in while the work is happening — whatever kind of
   task it is. The things it produced are attached to the moment it produced
   them, rather than filed somewhere else. */

export default function Talk({ task, st, recorded, onRecord, onFull }) {
  const [draft, setDraft] = useState('')
  /* The lead can change mid-task. Earlier entries keep the model that wrote
     them; the swap itself is part of the record. */
  const [swaps, setSwaps] = useState([])
  const lead = swaps.length ? swaps[swaps.length - 1].to : task.worker
  const scroll = useRef(null)
  const thread = [...threads[task.id][st.id], ...swaps]

  useEffect(() => {
    const el = scroll.current
    if (el) el.scrollTop = el.scrollHeight
  }, [task.id, st.id, recorded, swaps.length])

  const swap = (to) => setSwaps((w) => [...w, { who: 'swap', from: lead, to, at: 'now' }])
  const author = (m, i) => {
    const before = swaps.filter((w) => thread.indexOf(w) < i)
    return before.length ? before[before.length - 1].to : task.worker
  }

  return (
    <>
      <div className="tv-scroll" ref={scroll}>
        <div className="tv-measure">
          <p className="tv-lede">{task.because}</p>

          {thread.map((m, i) => m.who === 'swap' ? (
            <div className="tv-swap" key={i}>
              <span>Lead changed to</span><Model id={m.to} />
              <span className="tv-swap-note">· picks up from the task’s record, not from {MODELS[m.from]?.short || m.from}’s memory</span>
            </div>
          ) : m.who === 'handoff' ? (
            <section className="tv-handoff" key={i}>
              <div className="tv-handoff-head">
                <span className="tv-handoff-who">Coordinator</span>
                <Icon name="arrow" size={11} />
                <Model id={task.worker} />
                <span className="tv-handoff-role">lead</span>
                <span className="tv-msg-at">{m.at}</span>
              </div>
              <p className="tv-handoff-body">{m.body}</p>
              <Obj name={m.obj} task={task} st={st} recorded={recorded} onRecord={onRecord} onFull={onFull} />
            </section>
          ) : m.who === 'you' ? (
            <div className="rm-you is-first tv-you" key={i}>
              <p className="rm-you-body">{m.body}</p>
              <span className="rm-you-at">{m.at}</span>
            </div>
          ) : (
            <section className={'tv-msg' + (m.who === 'you' ? ' is-you' : ' is-lead') + (m.thinking ? ' is-thinking' : '')} key={i}>
              <div className="tv-msg-head">
                {m.thinking && <span className="pulse" />}
                {m.who === 'you'
                  ? <span className="tv-msg-who">You</span>
                  : <span className="tv-msg-who is-agent"><Model id={author(m, i)} /></span>}
                <span className="tv-msg-at">{m.at}</span>
              </div>
              {m.body.split('\n\n').map((para) => (
                <p className="tv-msg-body" key={para.slice(0, 24)}>{para}</p>
              ))}
              <Obj name={m.obj} task={task} st={st} recorded={recorded} onRecord={onRecord} onFull={onFull} />
            </section>
          ))}

          <p className="tv-close">{st.close}</p>
        </div>
      </div>

      <div className="tv-composer-wrap">
        <div className="tv-measure">
          <Composer
            className="tv-composer"
            value={draft} onChange={setDraft} onSubmit={() => setDraft('')}
            placeholder={placeholder(task, st, lead)} hint="/"
            model={lead} onModel={swap} role={`Lead agent · task ${task.ref}`}
            context={{ used: CTX[task.id], note: 'Each step starts from the task record, so a full context never loses the task. It compacts itself before it fills.' }}
          />
        </div>
      </div>
    </>
  )
}

const CTX = { delivery: 142, session: 318, question: 18 }

function placeholder(task, st, lead) {
  if (task.id === 'question') return 'Ask something else'
  if (st.id === 'settled') return `Task ${task.ref} is closed — say something to reopen it`
  return `Tell ${MODELS[lead]?.short || 'the lead'} something about ${task.ref}`
}

/* The things a message can carry. */
function Obj({ name, task, st, recorded, onRecord, onFull }) {
  if (!name) return null

  if (name === 'chips') {
    return <div className="tv-chips">{used.map((k) => <span className="tv-chip" key={k.id}>{k.t}</span>)}</div>
  }
  if (name === 'cites') {
    return (
      <div className="tv-chips">
        <span className="tv-chip">Refund writes are fail-fast, not queued</span>
        <span className="tv-chip">Webhook deliveries must remain idempotent</span>
        <span className="tv-chip">Task 402 · February</span>
      </div>
    )
  }
  if (name === 'diff') {
    return (
      <>
        <div className="tv-subs">
          {task.graph[1].sub.map((c) => (
            <span className="tv-sub" key={c.id}><span className="mono">{c.label}</span><span>{c.took}</span></span>
          ))}
          <span className="tv-sub-note">three sub-agents, in parallel</span>
        </div>
        <Diff mode="inline" branch={task.branch} onExpand={onFull} />
      </>
    )
  }
  if (name === 'findings') return <Findings />
  if (name === 'inserted') {
    return (
      <p className="tv-inserted">
        Your rule from 4 February: security review on any change to authentication files.
      </p>
    )
  }
  if (name === 'decision') {
    return <Ask ask={task.id === 'session' ? choice : decision} recorded={recorded} onRecord={onRecord} />
  }
  if (name === 'offer') {
    return <Ask ask={offer} recorded={recorded} onRecord={onRecord} />
  }
  if (name.startsWith('spike:')) {
    const sp = spikes.find((x) => x.id === name.split(':')[1])
    return <Spike sp={sp} />
  }
  if (name === 'outcome') {
    return (
      <div className="tv-outcome">
        <span className="tv-outcome-verdict">{st.outcome.verdict}</span>
        <span className="mono tv-outcome-pr">{st.outcome.pr}</span>
        <span className="tv-outcome-meta">{st.outcome.meta}</span>
      </div>
    )
  }
  if (name === 'knowledge') {
    const items = task.id === 'delivery' ? produced : task.id === 'session' ? sessionKnowledge : answerKnowledge
    return <div className="tv-krows">{items.map((k) => <KRow key={k.id} k={k} />)}</div>
  }
  return null
}

export function Spike({ sp }) {
  return (
    <div className={'tv-spike is-' + sp.verdict.toLowerCase()}>
      <div className="tv-spike-head">
        <span className="tv-spike-label">{sp.label}</span>
        <span className="tv-spike-verdict">{sp.verdict}</span>
      </div>
      <span className="mono tv-spike-branch">{sp.branch}</span>
      <p className="tv-spike-why">{sp.why}</p>
    </div>
  )
}
