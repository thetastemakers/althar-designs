import { useRef, useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { decided, entries, open } from '../data.js'
import { Filters, Table, bring, flagged, itemFor } from './combine.jsx'

/* Ledger — the register, with the queue dissolved into it.

   The argument: a project does not have a body of knowledge and an inbox
   about that body. It has one record, and some of it is unsettled. So an
   open item is a row — standing exactly where its claim stands, marked with
   a hairline in the margin — and the only thing the queue keeps is its
   count, which becomes a stepper in the head.

   That stepper is the whole bet. Without it the four marked rows are just
   four rows, and the maintenance never happens. */
export default function Ledger({ recorded, onRecord }) {
  const [filter, setFilter] = useState('all')
  const [openRow, setOpenRow] = useState(null)
  const rows = useRef({})

  const marks = flagged()
  const left = marks.filter((id) => !decided(recorded, itemFor(id).id))
  const done = marks.length - left.length

  const step = (dir) => {
    const list = left.length ? left : marks
    const at = list.indexOf(openRow)
    const next = list[(at + dir + list.length) % list.length]
    if (filter !== 'all') setFilter('all')
    setOpenRow(next)
    /* The row has to exist before it can be brought into view. */
    requestAnimationFrame(() => bring(rows.current[next]))
  }

  return (
    <div className="kv">
      <header className="kv-head">
        <h1>The record</h1>
        <p className="kv-head-line">
          {entries.length} claims the project holds, and everything it is unsure of, in the same
          list. The unsettled rows are marked in the margin; nothing has been moved out of the
          record to be dealt with elsewhere.
        </p>

        {/* The queue, reduced to the only thing a table cannot say by itself:
            how many of these rows are still asking something. */}
        <div className={'kc-step' + (left.length ? '' : ' is-clear')}>
          {left.length ? (
            <>
              <span className="kc-step-n">{left.length}</span>
              <span className="kc-step-t">
                {left.length === 1 ? 'row is unsettled' : 'rows are unsettled'}
                {done > 0 && <span className="kc-step-done"> · {done} decided</span>}
              </span>
              <span className="kc-step-go">
                <button onClick={() => step(-1)} aria-label="Previous unsettled row">
                  <Icon name="chevron" size={11} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button onClick={() => step(1)} aria-label="Next unsettled row">
                  <Icon name="chevron" size={11} />
                </button>
              </span>
              <button className="kc-step-b" onClick={() => step(1)}>Go to the next</button>
            </>
          ) : (
            <span className="kc-step-t">
              You are through. Every row in the record stands on its own, and the {open.length} that
              were asking something have been answered.
            </span>
          )}
        </div>

        <Filters filter={filter} setFilter={setFilter} />
      </header>

      <div className="kv-scroll">
        <Table
          filter={filter}
          openRow={openRow}
          setOpenRow={setOpenRow}
          rowRef={(id, el) => { rows.current[id] = el }}
          inline
          recorded={recorded}
          onRecord={onRecord}
        />
      </div>
    </div>
  )
}
