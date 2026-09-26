import { useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { chose, entries, open, STANDINGS } from '../data.js'
import { Answer, Dispute, Evidence, Reach, Source, Standing, Supplied } from './parts.jsx'

/* Register — every claim, in one dense table.

   The argument: knowledge is a record, and a record earns its keep by being
   inspectable. So the columns are the things that decide whether a claim
   deserves to stand — where it came from, how many tasks were handed it,
   when it was last used — and the rows are sorted so the ones with a problem
   rise to the top of their group. */

const FILTERS = [{ id: 'all', label: 'All' }, ...STANDINGS]

export default function Register({ recorded, onRecord }) {
  const [filter, setFilter] = useState('all')
  const [openRow, setOpenRow] = useState(null)

  const disputed = entries.filter((e) => e.disputed).length
  const canon = entries.filter((e) => e.standing === 'canonical').length

  const groups = STANDINGS
    .filter((s) => filter === 'all' || filter === s.id)
    .map((s) => ({
      ...s,
      rows: entries
        .filter((e) => e.standing === s.id)
        /* A problem outranks a date: disputed first, then unused, then reach. */
        .sort((a, b) => (b.disputed ? 1 : 0) - (a.disputed ? 1 : 0)
          || (b.stale ? 1 : 0) - (a.stale ? 1 : 0)
          || b.reach - a.reach),
    }))
    .filter((g) => g.rows.length)

  return (
    <div className="kv">
      <header className="kv-head">
        <h1>What Meridian knows</h1>
        <p className="kv-head-line">
          {entries.length} claims. {canon} are asserted to every task in scope,
          {' '}{disputed} disagree with each other, and one has not been supplied to anything in 71 days.
        </p>
        <div className="kv-filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={'kv-filter' + (filter === f.id ? ' is-on' : '')} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="kv-filter-n">
                {f.id === 'all' ? entries.length : entries.filter((e) => e.standing === f.id).length}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="kv-scroll">
        <div className="kv-table">
          <div className="kv-tr is-head">
            <span>Claim</span><span>Class</span><span>Source</span><span>Reach</span><span>Last supplied</span>
          </div>

          {groups.map((g) => (
            <section key={g.id}>
              <div className="kv-group">
                <span className="eyebrow">{g.label}</span>
                <span className="kv-group-note">{g.note}</span>
              </div>
              {g.rows.map((e) => {
                const on = openRow === e.id
                const item = open.find((o) => o.entry === e.id)
                return (
                  <div key={e.id} className={'kv-row' + (on ? ' is-open' : '')}>
                    <button className="kv-tr" onClick={() => setOpenRow(on ? null : e.id)}>
                      <span className="kv-claim-cell">
                        <Icon name="chevron" size={10} className="kv-caret" />
                        <span className={'kv-claim-t' + (e.disputed ? ' is-disputed' : '')}>{e.t}</span>
                      </span>
                      <span className="kv-cell">{e.klass}</span>
                      <span className="kv-cell"><Source e={e} /></span>
                      <span className="kv-cell"><Reach e={e} /></span>
                      <span className={'kv-cell' + (e.stale ? ' is-stale' : '')}>{e.last}</span>
                    </button>

                    {on && (
                      <div className="kv-expand">
                        <div className="kv-expand-main">
                          <p className="kv-body">{e.body}</p>
                          {e.disputed && <Dispute e={e} />}
                          {e.supersededBy && (
                            <p className="kv-dispute"><span className="kv-dispute-mark" />
                              Retired against the idempotency contract. Kept because the tasks below were built on it.</p>
                          )}
                          {item && (
                            <div className="kv-inline-open">
                              <span className="eyebrow">{item.sort} · open</span>
                              <p className="kv-inline-t">{item.t}</p>
                              <Answer item={item} recorded={chose(recorded, item)} onRecord={onRecord} />
                            </div>
                          )}
                        </div>
                        <div className="kv-expand-side">
                          <Evidence e={e} />
                          <Supplied e={e} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
