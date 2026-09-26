import { entries, taskTitles } from '../data.js'
import { Dispute } from './parts.jsx'

/* Dossier — the brief a worker is handed.

   The argument: this body of claims already exists as a document. It is what
   every task is given before it starts, and nobody has ever looked at it in
   that form. So render it as what it is — prose, in the order a reader needs
   it, with the provenance kept in the gutter where it does not interrupt.

   A contradiction inside a sentence you are reading is a different order of
   alarming from a contradiction in a table row, and it costs no colour. */

const SECTIONS = [
  { klass: 'Architecture', title: 'How the system is built',
    lede: 'Given to every task, whatever it touches. These are the claims a worker is not expected to rediscover.' },
  { klass: 'Convention', title: 'How we write it',
    lede: 'Not opinions. A task that breaks one of these is wrong even if it works.' },
  { klass: 'Decision', title: 'What we chose, and why',
    lede: 'Each of these was a real fork. The reasoning is kept because the fork will be walked up to again.' },
]

export default function Dossier() {
  const asserted = entries.filter((e) => e.standing === 'canonical')
  const waiting = entries.filter((e) => e.standing === 'proposed' || e.standing === 'episodic')
  const gone = entries.filter((e) => e.standing === 'retired')

  return (
    <div className="kv">
      <div className="kv-scroll">
        <article className="kv-doc">
          <header className="kv-doc-head">
            <span className="eyebrow">Meridian · supplied to every task in scope</span>
            <h1>What this project holds to be true</h1>
            <p className="kv-doc-lede">
              {asserted.length} claims, asserted. One of them is disputed and is marked below.
              A worker reads this before it reads any code, and proposes additions to it when it finishes.
            </p>
          </header>

          {SECTIONS.map((s) => {
            const rows = asserted.filter((e) => e.klass === s.klass)
            if (!rows.length) return null
            return (
              <section className="kv-sec" key={s.klass}>
                <h2 className="kv-sec-h">{s.title}</h2>
                <p className="kv-sec-lede">{s.lede}</p>
                {rows.map((e) => <Claim key={e.id} e={e} />)}
              </section>
            )
          })}

          <section className="kv-sec is-quiet">
            <h2 className="kv-sec-h">Not asserted</h2>
            <p className="kv-sec-lede">
              Observed on one task, or waiting for someone to say yes. None of this is supplied to anything;
              a worker finds it only by looking.
            </p>
            {waiting.map((e) => (
              <div className="kv-minor" key={e.id}>
                <p className="kv-minor-t">{e.t}</p>
                <p className="kv-minor-m">
                  {e.standing === 'proposed' ? 'Proposed' : 'Observed'} · task{' '}
                  <span className="mono">{e.from.task}</span> · {e.since}
                </p>
              </div>
            ))}
          </section>

          <section className="kv-sec is-quiet">
            <h2 className="kv-sec-h">No longer true</h2>
            <p className="kv-sec-lede">
              Kept, because work was built on it and that work is unreadable without knowing what it believed.
            </p>
            {gone.map((e) => (
              <div className="kv-minor" key={e.id}>
                <p className="kv-minor-t is-gone">{e.t}</p>
                <p className="kv-minor-m">
                  Canonical until 4 Mar · {e.reach} tasks were given it · superseded by the idempotency contract
                </p>
              </div>
            ))}
          </section>

          <p className="kv-doc-foot">
            Last changed 2 hours ago, when task 418 proposed an addition nobody has answered.
          </p>
        </article>
      </div>
    </div>
  )
}

function Claim({ e }) {
  return (
    <div className={'kv-para' + (e.disputed ? ' has-dispute' : '')}>
      <p className="kv-claim-line">{e.t}.</p>
      <p className="kv-claim-body">{e.body}</p>
      {e.disputed && <Dispute e={e} />}
      <aside className="kv-gutter">
        <span>{e.klass} · {e.since}</span>
        <span>{e.from.task ? <>from task <span className="mono">{e.from.task}</span>, {taskTitles[e.from.task]}</> : e.from.how}</span>
        <span>{e.reach === 1 ? '1 task has been given this' : `${e.reach} tasks have been given this`}</span>
      </aside>
    </div>
  )
}
