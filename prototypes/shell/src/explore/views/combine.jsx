import Icon from '../../lib/Icon.jsx'
import { byId, chose, decided, entries, open, STANDINGS, taskTitles } from '../data.js'
import { Answer, Dispute, Evidence, Reach, Source, Standing, Supplied } from './parts.jsx'

/* The pieces the four combinations share.

   The register and the queue are two grammars — a row and a card — and a
   combination is an argument about how they sit together, not a new way of
   drawing either one. So both grammars are written once here, and each
   direction only decides where they go and what they do to each other. */

/* An entry is open if something is being asked about it. A contradiction is
   asked about both of its sides, so both rows carry the mark. */
export const itemFor = (id) => open.find((o) => o.entry === id || o.against === id) || null

/* The rows an item is asked *on*, in the order the table shows them. The
   other side of a contradiction is marked but not stepped through: walking
   the same question twice is not progress. */
export const flagged = () =>
  groupsOf().flatMap((g) => g.rows.filter((e) => open.some((o) => o.entry === e.id))).map((e) => e.id)

export const FILTERS = [{ id: 'all', label: 'All' }, ...STANDINGS]

export function groupsOf(filter = 'all') {
  return STANDINGS
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
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const bring = (el) => el && el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' })

/* ---- The record ---------------------------------------------------------
   The register's table, unchanged in its columns. What a combination may
   add: a margin mark on the rows something is open about, a selection from
   somewhere else on the screen, and the item itself folded into the row. */
export function Table({
  filter, openRow, setOpenRow, rowRef, inline, selected, onPick,
  changed = [], recorded = [], onRecord,
}) {
  return (
    <div className="kv-table">
      <div className="kv-tr is-head">
        <span>Claim</span><span>Class</span><span>Source</span><span>Reach</span><span>Last supplied</span>
      </div>

      {groupsOf(filter).map((g) => (
        <section key={g.id}>
          <div className="kv-group">
            <span className="eyebrow">{g.label}</span>
            <span className="kv-group-note">{g.note}</span>
          </div>

          {g.rows.map((e) => {
            const item = itemFor(e.id)
            const done = item && decided(recorded, item.id)
            const on = openRow === e.id
            const sel = item && selected === item.id
            const just = changed.includes(e.id)
            return (
              <div
                key={e.id}
                ref={(el) => rowRef && rowRef(e.id, el)}
                className={'kv-row'
                  + (on ? ' is-open' : '')
                  + (item && !done ? ' is-flag' : '')
                  + (sel ? ' is-sel' : '')
                  + (just ? ' is-changed' : '')}
              >
                <button className="kv-tr" onClick={() => {
                  if (onPick && item) onPick(item.id)
                  setOpenRow(on ? null : e.id)
                }}>
                  <span className="kv-claim-cell">
                    <Icon name="chevron" size={10} className="kv-caret" />
                    <span className={'kv-claim-t' + (e.disputed && !done ? ' is-disputed' : '')}>{e.t}</span>
                    {item && <span className={'kc-tag' + (done ? ' is-done' : '')}>{done ? 'decided' : item.sort}</span>}
                  </span>
                  <span className="kv-cell">{e.klass}</span>
                  <span className="kv-cell"><Source e={e} /></span>
                  <span className="kv-cell"><Reach e={e} /></span>
                  <span className={'kv-cell' + (e.stale && !done ? ' is-stale' : '')}>
                    {just ? <span className="kc-just">changed just now</span> : e.last}
                  </span>
                </button>

                {on && (
                  <div className="kv-expand">
                    <div className="kv-expand-main">
                      <p className="kv-body">{e.body}</p>
                      {e.disputed && !done && <Dispute e={e} />}
                      {e.supersededBy && (
                        <p className="kv-dispute"><span className="kv-dispute-mark" />
                          Retired against the idempotency contract. Kept because the tasks below were built on it.</p>
                      )}
                      {/* The item, in the row. Only the directions that have
                          nowhere else to put it ask for this. */}
                      {inline && item && (
                        <div className="kv-inline-open">
                          <ItemBody item={item} recorded={chose(recorded, item)} onRecord={onRecord} other={item.against && byId(item.against)} />
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
  )
}

/* ---- The item -----------------------------------------------------------
   What is being asked, what it costs to leave it, and the answers. The cost
   line is doing the work brass does on a task view, and has to: nothing
   here is stopped, and a colour that means stopped would be a lie. */
export function ItemBody({ item, recorded, onRecord, other, claims }) {
  const e = byId(item.entry)
  return (
    <>
      <div className="kv-item-head">
        <span className="kv-item-sort">{item.sort}</span>
        <span className="kv-item-at">{item.at}</span>
      </div>
      <h2 className="kv-item-t">{item.t}</h2>
      <p className="kv-item-detail">{item.detail}</p>

      {claims && (
        <div className="kv-claims">
          <ClaimRow e={e} />
          {other && <ClaimRow e={other} />}
        </div>
      )}
      {!claims && other && (
        <p className="kc-against">
          <span className="kv-dispute-mark" />
          Against <span className="kc-against-t">{other.t}</span>
          <Source e={other} />
        </p>
      )}

      <p className="kv-item-cost">{item.cost}</p>
      <Answer item={item} recorded={recorded} onRecord={onRecord} />
    </>
  )
}

export function ClaimRow({ e }) {
  return (
    <div className="kv-crow">
      <Standing e={e} />
      <span className="kv-crow-t">{e.t}</span>
      <span className="kv-crow-m">
        <Source e={e} />
        {e.from.task && <span className="kv-crow-task">{taskTitles[e.from.task]}</span>}
      </span>
    </div>
  )
}

/* The filter tabs, which belong to the record in every direction that has
   room for them. */
export const Filters = ({ filter, setFilter }) => (
  <div className="kv-filters">
    {FILTERS.map((f) => (
      <button key={f.id} className={'kv-filter' + (filter === f.id ? ' is-on' : '')} onClick={() => setFilter(f.id)}>
        {f.label}
        <span className="kv-filter-n">
          {f.id === 'all' ? entries.length : entries.filter((x) => x.standing === f.id).length}
        </span>
      </button>
    ))}
  </div>
)
