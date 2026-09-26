import { useState } from 'react'
import { byId, entries, STANDINGS, taskTitles } from '../data.js'
import { Dispute, Reach, Standing } from './parts.jsx'

/* Trace — where a claim came from and where it went.

   The argument: an entry is worth exactly what its evidence is worth, and
   the cost of it being wrong is exactly the list of tasks that were handed
   it. Both of those are invisible in every other direction. Here they are
   the whole screen: one spine, running from the task that wrote the claim,
   through every task that was given it since, to whatever is true of it now.

   On the disputed entry the spine is the argument. Four tasks were told a
   number, and then a fifth read a different one out of production. */

export default function Trace() {
  const [sel, setSel] = useState('k3')
  const e = byId(sel)

  return (
    <div className="kv is-split">
      <div className="kv-list">
        {STANDINGS.map((s) => {
          const rows = entries.filter((x) => x.standing === s.id)
          if (!rows.length) return null
          return (
            <section key={s.id}>
              <div className="kv-list-head eyebrow">{s.label}</div>
              {rows.map((x) => (
                <button key={x.id} className={'kv-lrow' + (sel === x.id ? ' is-on' : '')} onClick={() => setSel(x.id)}>
                  <span className={'kv-lrow-t' + (x.disputed ? ' is-disputed' : '')}>{x.t}</span>
                  <span className="kv-lrow-m">{x.klass} · <Reach e={x} /></span>
                </button>
              ))}
            </section>
          )
        })}
      </div>

      <div className="kv-spine-wrap" key={sel}>
        <header className="kv-spine-head">
          <div className="kv-spine-top"><Standing e={e} /><span className="kv-spine-class">{e.klass} · {e.since}</span></div>
          <h1 className={e.disputed ? 'is-disputed' : ''}>{e.t}</h1>
          <p className="kv-spine-body">{e.body}</p>
          {e.disputed && <Dispute e={e} />}
        </header>

        <div className="kv-spine-scroll">
          <ol className="kv-spine">
            <Node mark="written" head="Written">
              {e.from.task
                ? <>Task <span className="mono">{e.from.task}</span> — {taskTitles[e.from.task]}. {cap(e.from.how)}.</>
                : cap(e.from.how) + '.'}
              <ul className="kv-node-ev">{e.evidence.map((x) => <li key={x}>{x}</li>)}</ul>
            </Node>

            {e.supplied.length === 0 ? (
              <Node mark="none" head="Never supplied">
                Nothing has been given this claim. It lives on the task that made it, and a worker
                reaches it only by going and looking.
              </Node>
            ) : e.supplied.map((r, i) => (
              <Node key={r} mark="used" head={`Supplied to task ${r}`}>
                {taskTitles[r]}
                {i === 0 && e.supplied.length > 1 && <span className="kv-node-note">and {e.supplied.length - 1} more below</span>}
              </Node>
            ))}

            {e.reach > e.supplied.length && (
              <Node mark="used" head={`${e.reach - e.supplied.length} older tasks`}>
                Given the same claim before the ones above. Kept as a count rather than a list.
              </Node>
            )}

            {e.disputed && (
              <Node mark="dispute" head="Contradicted">
                Task <span className="mono">{byId(e.disputed).from.task}</span> read a different value
                out of the running configuration. Neither claim has been withdrawn, so a worker matching
                this scope is still given one of them.
              </Node>
            )}

            <Node mark="now" head="Now">{now(e)}</Node>
          </ol>
        </div>
      </div>
    </div>
  )
}

function Node({ mark, head, children }) {
  return (
    <li className={'kv-node is-' + mark}>
      <span className="kv-node-mark" />
      <div className="kv-node-body">
        <span className="kv-node-head">{head}</span>
        <div className="kv-node-text">{children}</div>
      </div>
    </li>
  )
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function now(e) {
  if (e.standing === 'proposed') return 'Waiting for someone to say yes. Nothing is supplied from it until then.'
  if (e.standing === 'retired') return 'Retired. Kept so the work built on it still reads.'
  if (e.standing === 'episodic') return 'True of one moment on one task. The project does not assert it.'
  if (e.disputed) return 'Still asserted to every task that matches scope, and still disputed.'
  return `Still asserted. ${cap(e.last)}.`
}
