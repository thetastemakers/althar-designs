import { useRef, useState } from 'react'
import { byId, chose, decided, entries, open } from '../data.js'
import { Answer } from './parts.jsx'
import { Filters, Table, bring } from './combine.jsx'

/* Desk — the record on the table, the open items in the margin.

   The argument: these two want different things from the screen and should
   stop competing for it. The register is the subject and keeps the width.
   The queue is a margin: four items, always visible, never in the way.

   What makes it a combination rather than two panes is that they point at
   each other. Pick an item in the rail and the rows it concerns are marked
   and brought into view — you decide while looking at the six tasks that
   were told the thing you are deciding about. Open a marked row and the
   rail selects the item, so the answer is always one glance to the right. */
export default function Desk({ recorded, onRecord }) {
  const [filter, setFilter] = useState('all')
  const [openRow, setOpenRow] = useState(null)
  const [sel, setSel] = useState(open[0].id)
  const rows = useRef({})

  const left = open.filter((o) => !decided(recorded, o.id))

  const pick = (id) => {
    setSel(id)
    const item = open.find((o) => o.id === id)
    requestAnimationFrame(() => bring(rows.current[item.entry]))
  }

  return (
    <div className="kv kc-desk">
      <div className="kc-desk-main">
        <header className="kv-head">
          <h1>Knowledge</h1>
          <p className="kv-head-line">
            {entries.length} claims, with where each came from and how many tasks have been
            handed it. What is unsettled is marked here and answered in the margin.
          </p>
          <Filters filter={filter} setFilter={setFilter} />
        </header>

        <div className="kv-scroll">
          <Table
            filter={filter}
            openRow={openRow}
            setOpenRow={setOpenRow}
            rowRef={(id, el) => { rows.current[id] = el }}
            selected={sel}
            onPick={setSel}
            recorded={recorded}
            onRecord={onRecord}
          />
        </div>
      </div>

      <aside className="kc-rail">
        <div className="kc-rail-head">
          <span className="eyebrow">Unsettled</span>
          <span className="kc-rail-n">{left.length} of {open.length}</span>
        </div>
        <p className="kc-rail-lede">
          {left.length
            ? 'None of this stops any work. Each one says what leaving it costs.'
            : 'Everything the record was unsure of has been answered.'}
        </p>

        <div className="kc-rail-list">
          {open.map((item) => {
            const e = byId(item.entry)
            const on = sel === item.id
            const done = chose(recorded, item)
            return (
              <div key={item.id} className={'kc-ritem' + (on ? ' is-on' : '') + (done ? ' is-done' : '')}>
                <button className="kc-ritem-top" onClick={() => pick(item.id)}>
                  <span className="kc-ritem-head">
                    <span className="kv-item-sort">{item.sort}</span>
                    <span className="kv-item-at">{done ? 'decided' : item.at}</span>
                  </span>
                  <span className="kc-ritem-t">{item.t}</span>
                  {/* Which row in the table this is about, so the rail never
                      floats free of the record it is annotating. */}
                  <span className="kc-ritem-on">on “{e.t}”</span>
                </button>

                {on && (
                  <div className="kc-ritem-open">
                    <p className="kv-item-detail">{item.detail}</p>
                    <p className="kv-item-cost">{item.cost}</p>
                    <Answer item={item} recorded={done} onRecord={onRecord} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
