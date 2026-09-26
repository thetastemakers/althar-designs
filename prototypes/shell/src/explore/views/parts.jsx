import { useState } from 'react'
import { byId, taskTitles } from '../data.js'

/* Pieces the four directions share. None of them decides a layout.

   Note what is absent: brass. Nothing on these screens stops work, so
   nothing on these screens gets the one saturated colour in the product.
   A disputed claim is marked by being struck through and annotated, which
   is louder in a body of text than a colour would be, and does not spend
   the signal that "answer me or nothing moves" depends on. */

export const STANDING_LABEL = {
  canonical: 'Canonical', episodic: 'Episodic', proposed: 'Proposed', retired: 'Retired',
}

export const Standing = ({ e }) => (
  <span className={'kv-standing is-' + e.standing}>{STANDING_LABEL[e.standing]}</span>
)

/* Provenance in one line: a task, and what it was doing when this happened. */
export function Source({ e, long = false }) {
  if (!e.from.task) return <span className="kv-src">{e.from.how}</span>
  return (
    <span className="kv-src">
      <span className="mono kv-src-ref">{e.from.task}</span>
      {long ? ` ${taskTitles[e.from.task]} — ${e.from.how}` : ` · ${e.from.how}`}
    </span>
  )
}

/* The two-sided fact of a dispute, written from whichever side you are on. */
export function Dispute({ e }) {
  const other = byId(e.disputed)
  return (
    <p className="kv-dispute">
      <span className="kv-dispute-mark" />
      {e.standing === 'canonical'
        ? <>Disputed by an observation from task <span className="mono">{other.from.task}</span>: “{other.t}.” The project cannot hold both.</>
        : <>Disagrees with the canonical entry from {other.since}: “{other.t}.” Nothing is supplied from this one while that stands.</>}
    </p>
  )
}

export const Reach = ({ e }) => (
  <span className={'kv-reach' + (e.stale ? ' is-stale' : '')}>
    {e.reach === 0 ? 'no tasks' : e.reach === 1 ? '1 task' : `${e.reach} tasks`}
  </span>
)

/* Recording an answer is not a receipt. It says what the body of knowledge
   is now, in the same words it will use tomorrow — and in the words of the
   option that was taken, which is why `recorded` is that option and not a
   flag. Every surface that can record shows the same sentence afterwards. */
export function Answer({ item, recorded, onRecord }) {
  const [pick, setPick] = useState(null)
  if (recorded) {
    return (
      <div className="kv-answer is-recorded">
        <span className="eyebrow">Recorded · {recorded.label.toLowerCase()}</span>
        <p className="kv-answer-after">{recorded.after}</p>
      </div>
    )
  }
  return (
    <div className="kv-answer">
      <div className="kv-opts">
        {item.options.map((o) => (
          <button key={o.id} className={'kv-opt' + (pick === o.id ? ' is-on' : '')} onClick={() => setPick(o.id)}>
            <span className="kv-opt-mark" />
            <span className="kv-opt-body">
              <span className="kv-opt-label">{o.label}</span>
              <span className="kv-opt-note">{o.note}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="kv-record" disabled={!pick} onClick={() => onRecord(item.id, pick)}>Record</button>
    </div>
  )
}

export const Evidence = ({ e }) => (
  <div className="kv-ev">
    <span className="eyebrow">What it rests on</span>
    {e.evidence.map((x) => <p key={x}>{x}</p>)}
  </div>
)

/* Every task that was handed this claim. The point of the list is its
   length: that is who is affected if the claim turns out to be wrong. */
export const Supplied = ({ e }) => (
  <div className="kv-supplied">
    <span className="eyebrow">Supplied to</span>
    {e.supplied.length ? (
      <div className="kv-refs">
        {e.supplied.map((r) => (
          <span className="kv-ref" key={r}><span className="mono">{r}</span>{taskTitles[r]}</span>
        ))}
        {e.reach > e.supplied.length && <span className="kv-ref is-more">and {e.reach - e.supplied.length} older</span>}
      </div>
    ) : (
      <p className="kv-none">Nothing has been given this. It is on its task and nowhere else.</p>
    )}
  </div>
)
