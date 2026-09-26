import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useKey } from '../lib/hooks.js'
import { COMBOS, DIRECTIONS, PLACEMENTS, entries, open } from './data.js'
import Thumb from './Thumb.jsx'
import Register from './views/Register.jsx'
import Dossier from './views/Dossier.jsx'
import Queue from './views/Queue.jsx'
import Trace from './views/Trace.jsx'
import Ledger from './views/Ledger.jsx'
import Desk from './views/Desk.jsx'
import Deck from './views/Deck.jsx'
import Rounds from './views/Rounds.jsx'
import './explore.css'
import './views/knowledge.css'
import './views/combine.css'

/* The knowledge exploration, second round.

   The first round asked what you should see when you go to look at what the
   project knows, and two of its four answers survived: the register, which
   is the durable record of what is, and the queue, which is the short list
   of what wants deciding. They are not the same view at different zooms and
   neither is a mode of the other.

   So the question is now narrower and more useful: where does attention sit
   relative to the record? Four answers — in it, beside it, above it, in
   front of it — over the same corpus, with the first round's four still
   reachable underneath for comparison. */

const VIEWS = {
  ledger: Ledger, desk: Desk, deck: Deck, rounds: Rounds,
  register: Register, dossier: Dossier, queue: Queue, trace: Trace,
}
const ALL = [...COMBOS, ...DIRECTIONS]

export default function Explore() {
  const [id, setId] = useState(COMBOS[0].id)
  const [p, setP] = useState(0)
  const [shown, setShown] = useState(false)
  const [recorded, setRecorded] = useState([])

  const dir = ALL.find((x) => x.id === id)
  const place = PLACEMENTS[p]
  const View = VIEWS[dir.id]
  const combo = COMBOS.some((x) => x.id === dir.id)

  /* Each direction presents itself fresh: a decision recorded while reading
     one of them does not follow you into the next. */
  const go = (v) => { setId(v); setRecorded([]) }
  const record = (id, opt) => setRecorded((r) => [...r, { id, opt }])

  useKey((e, typing) => {
    if (typing) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key
    if (k === 'Escape') { setShown(false); return }
    if (k === 'Enter') { setShown(true); return }
    if (k >= '1' && k <= '4') { go(COMBOS[Number(k) - 1].id); return }
    if (k >= '5' && k <= '8') { go(DIRECTIONS[Number(k) - 5].id); return }
    if (k === 'p') { e.preventDefault(); setP((p + 1) % PLACEMENTS.length); return }
    /* The arrows stay inside the tier you are in. */
    const tier = combo ? COMBOS : DIRECTIONS
    const at = tier.findIndex((x) => x.id === id)
    if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); go(tier[(at + 1) % tier.length].id) }
    if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); go(tier[(at + tier.length - 1) % tier.length].id) }
  }, [id, p, shown, combo])

  const view = <View recorded={recorded} onRecord={record} />

  if (shown) {
    return (
      <div className="ex">
        <Bar id={id} go={go} p={p} setP={setP} onBack={() => setShown(false)} />
        <Stage place={place.id} key={dir.id + place.id}>{view}</Stage>
      </div>
    )
  }

  return (
    <div className="ex">
      <div className="ex-pick">
        <header className="ex-head">
          <div className="ex-mark"><Icon name="knowledge" size={15} /><span>Knowledge · the record and what is open</span></div>
          <p className="ex-sub">
            {entries.length} claims, {open.length} of them asking something, over the same project the
            shell shows. The register and the queue both earned their place — one is what the project
            holds, the other is what it is unsure of. Four ways to put them on one screen.
          </p>
        </header>

        <div className="ex-placement">
          <span className="eyebrow">Where it lives</span>
          <div className="ex-seg">
            {PLACEMENTS.map((x, i) => (
              <button key={x.id} className={'ex-seg-b' + (p === i ? ' is-on' : '')} onClick={() => setP(i)}>{x.label}</button>
            ))}
          </div>
          <p className="ex-placement-note">{place.note}</p>
          <span className="kbd">p</span>
        </div>

        <div className="ex-grid">
          {COMBOS.map((x) => (
            <button key={x.id}
              className={'ex-cell' + (id === x.id ? ' is-focus' : '')}
              onMouseEnter={() => go(x.id)}
              onClick={() => { go(x.id); setShown(true) }}>
              <Thumb dir={x.id} />
              <span className="ex-cell-foot">
                <span className="ex-n">{x.n}</span>
                <span className="ex-cell-text">
                  <span className="ex-name">{x.label}</span>
                  <span className="ex-owns">{x.shape}</span>
                </span>
                <span className="ex-cell-go"><Icon name="arrow" size={12} /></span>
              </span>
            </button>
          ))}
        </div>

        <div className="ex-detail" key={dir.id}>
          <div className="ex-detail-main">
            <h2>{dir.label}</h2>
            <p className="ex-line">{dir.line}</p>
          </div>
          <dl className="ex-dl">
            <div><dt>Wins</dt><dd>{dir.wins}</dd></div>
            <div><dt>Costs</dt><dd>{dir.costs}</dd></div>
          </dl>
        </div>

        {/* The first round, kept reachable. Two of these are what the four
            above are made of; the other two are the arguments they beat. */}
        <div className="ex-also">
          <span className="eyebrow">The round before</span>
          {DIRECTIONS.map((x, i) => (
            <button key={x.id}
              className={'ex-also-b' + (id === x.id ? ' is-on' : '')}
              onMouseEnter={() => go(x.id)}
              onClick={() => { go(x.id); setShown(true) }}>
              <span className="kbd">{i + 5}</span>{x.label}
            </button>
          ))}
        </div>

        <footer className="ex-foot">
          <span><span className="kbd">1</span><span className="kbd">4</span> combination</span>
          <span className="ex-foot-sep" />
          <span><span className="kbd">5</span><span className="kbd">8</span> the round before</span>
          <span className="ex-foot-sep" />
          <span><span className="kbd">p</span> placement</span>
          <span className="ex-foot-sep" />
          <span><span className="kbd">↵</span> open</span>
          <a className="ex-foot-link" href="#">Back to the shell</a>
        </footer>
      </div>
    </div>
  )
}

/* ---- Prototype chrome, deliberately not the product ---------------------*/
function Bar({ id, go, p, setP, onBack }) {
  return (
    <div className="ex-bar">
      <button className="ex-bar-back" onClick={onBack}>
        <Icon name="chevron" size={11} style={{ transform: 'rotate(180deg)' }} />
        Knowledge · directions
      </button>
      <div className="ex-bar-seg">
        {COMBOS.map((x) => (
          <button key={x.id} className={'ex-bar-b' + (id === x.id ? ' is-on' : '')} onClick={() => go(x.id)}>
            <span className="ex-bar-n">{x.n}</span>{x.label}
          </button>
        ))}
      </div>
      <div className="ex-bar-seg is-quiet is-prior">
        {DIRECTIONS.map((x) => (
          <button key={x.id} className={'ex-bar-b' + (id === x.id ? ' is-on' : '')} onClick={() => go(x.id)}>{x.label}</button>
        ))}
      </div>
      <div className="ex-bar-seg is-quiet">
        {PLACEMENTS.map((x, i) => (
          <button key={x.id} className={'ex-bar-b' + (p === i ? ' is-on' : '')} onClick={() => setP(i)}>{x.label}</button>
        ))}
      </div>
      <div className="ex-bar-hint">
        <span className="kbd">p</span><span className="ex-bar-hint-sep" /><span className="kbd">esc</span>
      </div>
    </div>
  )
}

/* ---- The two placements --------------------------------------------------
   A room of its own, or bolted onto the room you were already standing in.
   The shell behind the sidecar is drawn, not mocked: it is the reason the
   question is worth asking. */
function Stage({ place, children }) {
  if (place === 'room') {
    return (
      <div className="ex-stage">
        <div className="ex-win">
          <Chrome room="knowledge" />
          <div className="ex-win-body">{children}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="ex-stage">
      <div className="ex-win">
        <Chrome room="board" side />
        <div className="ex-win-body">
          <div className="ex-behind" aria-hidden="true">
            {['Needs you', 'Running', 'Held', 'Settled'].map((c) => (
              <div className="ex-behind-col" key={c}>
                <span className="ex-behind-head">{c}</span>
                {Array.from({ length: c === 'Running' ? 4 : c === 'Settled' ? 3 : 2 }, (_, i) => (
                  <span className="ex-behind-card" key={i} />
                ))}
              </div>
            ))}
          </div>
          <aside className="ex-side">{children}</aside>
        </div>
      </div>
    </div>
  )
}

const Chrome = ({ room, side }) => (
  <div className="ex-chrome">
    <div className="traffic"><i /><i /><i /></div>
    <span className="ex-chrome-project">Meridian</span>
    <div className="ex-chrome-rooms">
      <span>Conversation</span>
      <span className={room === 'board' ? 'is-on' : ''}>Board</span>
      <span>All</span>
      {room === 'knowledge' && <span className="is-on">Knowledge</span>}
    </div>
    <div className="ex-chrome-right">
      <span className="pulse" /><span>4 running</span>
      <span className="ex-chrome-needs">3 need you</span>
      {side && <span className="ex-chrome-bolt is-on"><Icon name="knowledge" size={12} />Knowledge</span>}
    </div>
  </div>
)
