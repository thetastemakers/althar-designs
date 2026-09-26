import { useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { byId, chose, decided, entries, open } from '../data.js'
import { Filters, ItemBody, Table } from './combine.jsx'

/* Deck — both panes, both live.

   The argument: the other combinations all make one of the two views give
   something up — its density, its width, its position in the sequence. This
   one refuses. The queue keeps its shape above, the record keeps its shape
   below, each scrolls on its own, and a hairline states the split in words
   instead of hiding it behind a tab.

   The concession is honest and visible: you read fifteen entries through a
   slot. In exchange nothing is ever a click away, and when the last item is
   answered the top pane folds to a line and gives the record everything. */
export default function Deck({ recorded, onRecord }) {
  const [filter, setFilter] = useState('all')
  const [openRow, setOpenRow] = useState(null)
  const [shut, setShut] = useState(false)

  const left = open.filter((o) => !decided(recorded, o.id))
  const clear = !left.length
  const folded = shut || clear

  return (
    <div className="kv kc-deck">
      <section className={'kc-deck-top' + (folded ? ' is-folded' : '')}>
        {folded ? (
          <button className="kc-deck-clear" onClick={() => !clear && setShut(false)}>
            {clear
              ? <>Nothing unsettled. All {open.length} were answered — the record stands on its own.</>
              : <><Icon name="chevron" size={11} className="kv-caret" />{left.length} still to decide</>}
          </button>
        ) : (
          <>
            <div className="kc-deck-head">
              <span className="eyebrow">Unsettled</span>
              <span className="kc-deck-n">{left.length} of {open.length}</span>
              <span className="kc-deck-note">Nothing here is stopping work. That is why it needs a pane.</span>
              <button className="kc-deck-shut" onClick={() => setShut(true)}>Fold</button>
            </div>
            <div className="kc-deck-scroll">
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
            </div>
          </>
        )}
      </section>

      {/* The divider is the record's own header: it says what is below it,
          and holds the one control the record needs. */}
      <div className="kc-div">
        <span className="kc-div-t">The record</span>
        <span className="kc-div-m">{entries.length} claims · everything the project asserts, observed or retired</span>
        <Filters filter={filter} setFilter={setFilter} />
      </div>

      <div className="kv-scroll kc-deck-bot">
        <Table
          filter={filter}
          openRow={openRow}
          setOpenRow={setOpenRow}
          recorded={recorded}
          onRecord={onRecord}
        />
      </div>
    </div>
  )
}
