import { useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { byId, chose, decided, entries, open } from '../data.js'
import { Filters, ItemBody, Table } from './combine.jsx'

/* Rounds — the queue is the door to the record.

   The argument: these two are not simultaneous activities. Deciding is
   short, bounded and rare; looking something up is long and unbounded. So
   put them in sequence rather than in competition. You arrive at what needs
   deciding — answer it or walk past it — and you cross into the register
   with the rows you just changed still marked. A count in the head takes
   you back.

   It is the only one of the four that can say "you are through", and the
   only one that makes you pass something on your way to a lookup. Those are
   the same property, seen from the two ends of a day. */
export default function Rounds({ recorded, onRecord }) {
  const [phase, setPhase] = useState('door')
  const [filter, setFilter] = useState('all')
  const [openRow, setOpenRow] = useState(null)

  const left = open.filter((o) => !decided(recorded, o.id))
  const cleared = open.filter((o) => decided(recorded, o.id))
  /* Both sides of a contradiction changed, so both rows say so. */
  const changed = cleared.flatMap((o) => [o.entry, o.against]).filter(Boolean)

  if (phase === 'door') {
    return (
      <div className="kv">
        <div className="kv-scroll">
          <div className="kv-q kc-door">
            <header className="kv-q-head">
              <span className="eyebrow">Before the record</span>
              <h1>{left.length ? `${left.length} things to decide` : 'You are through'}</h1>
              <p className="kv-q-lede">
                {left.length
                  ? 'None of it is stopping any work, which is why it would sit here forever if the record did not open behind it. Each one says what leaving it costs.'
                  : `All ${open.length} answered. The record behind this is consistent with itself again.`}
              </p>
            </header>

            {open.map((item) => (
              <article key={item.id} className={'kv-item' + (decided(recorded, item.id) ? ' is-done' : '')}>
                <ItemBody
                  item={item}
                  claims
                  other={item.against && byId(item.against)}
                  recorded={chose(recorded, item)}
                  onRecord={onRecord}
                />
              </article>
            ))}

            <div className={'kc-cross' + (left.length ? '' : ' is-clear')}>
              <button className="kc-cross-b" onClick={() => setPhase('record')}>
                {left.length ? `Leave ${left.length} and open the record` : 'Open the record'}
                <Icon name="arrow" size={12} />
              </button>
              {left.length > 0 && (
                <span className="kc-cross-m">They will still be counted in the head, and still be here tomorrow.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="kv">
      <header className="kv-head">
        <div className="kc-back-row">
          <button className="kc-back" onClick={() => setPhase('door')}>
            <Icon name="chevron" size={11} style={{ transform: 'rotate(-90deg)' }} />
            {left.length
              ? `${left.length} still to decide`
              : `${cleared.length} decided`}
          </button>
          {cleared.length > 0 && <span className="kc-back-m">Changed rows are marked below.</span>}
        </div>
        <h1>The record</h1>
        <p className="kv-head-line">
          {entries.length} claims, with where each came from and how many tasks have been handed
          it. Nothing on this screen is asking anything of you — that happened at the door.
        </p>
        <Filters filter={filter} setFilter={setFilter} />
      </header>

      <div className="kv-scroll">
        <Table
          filter={filter}
          openRow={openRow}
          setOpenRow={setOpenRow}
          changed={changed}
          recorded={recorded}
          onRecord={onRecord}
        />
      </div>
    </div>
  )
}
