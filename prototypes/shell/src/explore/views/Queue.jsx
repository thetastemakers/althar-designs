import { useState } from 'react'
import Icon from '../../lib/Icon.jsx'
import { byId, chose, decided, entries, open, taskTitles } from '../data.js'
import { Answer, Reach, Source, Standing } from './parts.jsx'

/* Queue — only what needs deciding.

   The argument: nobody browses what a project knows. They maintain it, or
   they do not, and mostly they do not, because nothing ever asks. So put the
   four things that are actually open in front of you, each answerable where
   it sits, and fold the settled body away behind a count.

   Every item here says what it costs to leave it. That line is doing the
   work brass would do on a task view — and it has to, because none of this
   stops anything, and a colour that means "stopped" would be a lie. */

export default function Queue({ recorded, onRecord }) {
  const [body, setBody] = useState(false)
  const left = open.filter((o) => !decided(recorded, o.id))

  return (
    <div className="kv">
      <div className="kv-scroll">
        <div className="kv-q">
          <header className="kv-q-head">
            <h1>{left.length ? `${left.length} things to decide` : 'Nothing to decide'}</h1>
            <p className="kv-q-lede">
              {left.length
                ? 'None of this is stopping any work. That is exactly why it is still here — and why every item says what leaving it costs.'
                : 'Everything open has been answered. The body of knowledge is consistent with itself again.'}
            </p>
          </header>

          {open.map((item) => (
            <Item key={item.id} item={item} recorded={chose(recorded, item)} onRecord={onRecord} />
          ))}

          <button className={'kv-body-toggle' + (body ? ' is-on' : '')} onClick={() => setBody(!body)}>
            <Icon name="chevron" size={11} className="kv-caret" />
            {entries.length} entries settled · nothing to do
          </button>

          {body && (
            <div className="kv-body-list">
              {entries.map((e) => (
                <div className="kv-brow" key={e.id}>
                  <span className={'kv-brow-t' + (e.disputed ? ' is-disputed' : '')}>{e.t}</span>
                  <span className="kv-brow-m"><Standing e={e} /><Reach e={e} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Item({ item, recorded, onRecord }) {
  const e = byId(item.entry)
  const other = item.against ? byId(item.against) : null

  return (
    <section className={'kv-item is-' + item.sort.toLowerCase() + (recorded ? ' is-done' : '')}>
      <div className="kv-item-head">
        <span className="kv-item-sort">{item.sort}</span>
        <span className="kv-item-at">{item.at}</span>
      </div>
      <h2 className="kv-item-t">{item.t}</h2>
      <p className="kv-item-detail">{item.detail}</p>

      <div className="kv-claims">
        <ClaimRow e={e} />
        {other && <ClaimRow e={other} />}
      </div>

      {/* What it costs to walk away. The only reason any of this gets done. */}
      <p className="kv-item-cost">{item.cost}</p>

      <Answer item={item} recorded={recorded} onRecord={onRecord} />
    </section>
  )
}

function ClaimRow({ e }) {
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
