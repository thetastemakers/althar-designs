import { useState } from 'react'
import { DIRECTIONS } from './directions/index.js'
import { useKey } from './lib/hooks.js'
import Icon from './lib/Icon.jsx'
import './Picker.css'

export default function Picker({ onPick }) {
  const [focus, setFocus] = useState(0)

  useKey((e, typing) => {
    if (typing) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => (f + 1) % DIRECTIONS.length) }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); setFocus((f) => (f - 1 + DIRECTIONS.length) % DIRECTIONS.length) }
    if (e.key === 'Enter') onPick(DIRECTIONS[focus].id)
  }, [focus, onPick])

  const d = DIRECTIONS[focus]

  return (
    <div className="pick">
      <header className="pick-head">
        <div className="pick-mark">
          <Icon name="project" size={15} />
          <span>Charrette</span>
        </div>
        <p className="pick-sub">
          Five structural answers to one question: if the project is the persistent
          object, what should the shell become?
        </p>
      </header>

      <div className="pick-body">
        <ol className="pick-list">
          {DIRECTIONS.map((x, i) => (
            <li key={x.id}>
              <button
                className={'pick-item' + (i === focus ? ' is-focus' : '')}
                onMouseEnter={() => setFocus(i)}
                onClick={() => onPick(x.id)}
              >
                <span className="pick-n">{x.n}</span>
                <span className="pick-item-text">
                  <span className="pick-name">{x.name}</span>
                  <span className="pick-line">{x.line}</span>
                </span>
                <Icon name="arrow" size={13} className="pick-go" />
              </button>
            </li>
          ))}
        </ol>

        <div className="pick-detail" key={d.id}>
          <dl className="pick-dl">
            {d.thesis.map(([k, v]) => (
              <div className="pick-row" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <footer className="pick-foot">
        <span>{DIRECTIONS.map((x) => <span className="kbd" key={x.id}>{x.n}</span>)} open a direction</span>
        <span className="pick-foot-sep" />
        <span><span className="kbd">↑</span><span className="kbd">↓</span> move</span>
        <span className="pick-foot-sep" />
        <span><span className="kbd">↵</span> enter</span>
        <span className="pick-foot-sep" />
        <span>Arrow keys switch directions once inside</span>
      </footer>
    </div>
  )
}
