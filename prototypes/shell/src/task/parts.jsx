import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { findings } from './data.js'

/* Pieces every face needs. None of them decides the layout. */

export function stepState(st, n) {
  if (st.done?.includes(n.id)) return 'done'
  if (st.held === n.id) return 'held'
  if (st.active === n.id) return 'running'
  return 'queued'
}

export const Dot = ({ s }) =>
  s === 'running' ? <span className="pulse" />
  : s === 'held' ? <span className="dot-signal" />
  : s === 'done' ? <span className="dot-done" />
  : <span className="dot-queue" />

export function Findings({ open = false }) {
  return <div className="tv-findings">{findings.map((f) => <Finding key={f.id} f={f} open={open} />)}</div>
}

function Finding({ f, open }) {
  const [on, setOn] = useState(open)
  return (
    <div className={'tv-finding' + (on ? ' is-open' : '')}>
      <button className="tv-finding-head" onClick={() => setOn(!on)}>
        <span className={'tv-sev is-' + f.severity}>{f.severity}</span>
        <span className="tv-finding-t">{f.title}</span>
        <span className="tv-finding-state">{f.state}</span>
        <Icon name="chevronD" size={11} className="tv-caret" />
      </button>
      {on && <p className="tv-finding-body">{f.body}</p>}
    </div>
  )
}

/* What the task wants from you.

   Brass is not "a human is involved", it is "work is stopped until you
   answer". A blocking decision gets it. An offer — keep this explanation or
   do not — stops nothing, so it stays in the neutral ramp. If everything a
   task asked for were brass, brass would stop meaning anything. */
export function Ask({ ask, recorded, onRecord, tone = 'inline' }) {
  const [pick, setPick] = useState(null)
  const blocking = ask.weight === 'blocking'

  if (recorded) {
    return (
      <div className={'tv-ask is-recorded is-' + tone}>
        <span className="tv-ask-kind">Recorded</span>
        <p className="tv-ask-title">{recorded}</p>
        <p className="tv-ask-because">{ask.after}</p>
      </div>
    )
  }

  return (
    <div className={'tv-ask is-' + tone + (blocking ? ' is-blocking' : ' is-offer')}>
      <div className="tv-ask-head">
        <span className="tv-ask-kind">{blocking ? ask.kind : 'Offer'}</span>
        {ask.raisedBy && <span className="tv-ask-raised">{ask.raisedBy} · {ask.raisedAt}</span>}
      </div>
      <p className="tv-ask-title">{ask.title}</p>
      <p className="tv-ask-because">{ask.detail}</p>

      <div className="tv-options">
        {ask.options.map((o) => (
          <button key={o.id} className={'tv-option' + (pick === o.id ? ' is-on' : '')} onClick={() => setPick(o.id)}>
            <span className="tv-option-mark" />
            <span className="tv-option-body">
              <span className="tv-option-label">{o.label}</span>
              <span className="tv-option-note">{o.note}</span>
            </span>
          </button>
        ))}
      </div>

      {ask.evidence && (
        <div className="tv-dec-ev">
          <span className="eyebrow">Evidence it collected</span>
          {ask.evidence.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      <button className="tv-record" disabled={!pick}
        onClick={() => onRecord?.(ask.options.find((o) => o.id === pick).label)}>
        {blocking ? 'Record decision' : 'Record'}
      </button>
    </div>
  )
}

export const KRow = ({ k }) => (
  <div className={'tv-krow' + (k.flag ? ' is-flagged' : '')}>
    <span className="tv-krow-t">{k.flag && <span className="dot-signal" />}{k.t}</span>
    <span className="tv-krow-m">{k.meta}</span>
    {k.flag && <span className="tv-krow-flag">{k.flag}</span>}
  </div>
)

export const Group = ({ title, meta, children }) => (
  <section className="tv-out">
    <h2 className="tv-out-head"><span className="eyebrow">{title}</span>{meta && <span className="tv-out-meta">{meta}</span>}</h2>
    {children}
  </section>
)
