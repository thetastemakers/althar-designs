import { useCallback, useState } from 'react'
import { DIRECTIONS } from './directions/index.js'
import { useKey } from './lib/hooks.js'
import Picker from './Picker.jsx'
import './App.css'

export default function App() {
  const [active, setActive] = useState(null)   // null = picker
  const i = DIRECTIONS.findIndex((d) => d.id === active)

  const go = useCallback((delta) => {
    setActive((cur) => {
      const idx = DIRECTIONS.findIndex((d) => d.id === cur)
      if (idx === -1) return cur
      const next = (idx + delta + DIRECTIONS.length) % DIRECTIONS.length
      return DIRECTIONS[next].id
    })
  }, [])

  useKey((e, typing) => {
    if (typing) return
    if (e.metaKey || e.ctrlKey || e.altKey) return   // modified keys belong to the prototype
    if (e.key >= '1' && e.key <= String(DIRECTIONS.length)) {
      setActive(DIRECTIONS[Number(e.key) - 1].id)
    } else if (active && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      // Only steer between directions when nothing inside the prototype wants
      // arrow keys; directions stop propagation when they do.
      go(e.key === 'ArrowRight' ? 1 : -1)
    }
  }, [active, go])

  if (!active) return <Picker onPick={setActive} />

  const dir = DIRECTIONS[i]
  const { Component } = dir

  return (
    <div className="app">
      <div className="protobar">
        <button className="protobar-back" onClick={() => setActive(null)}>
          Althar · shell explorations
        </button>
        <nav className="protobar-tabs">
          {DIRECTIONS.map((d) => (
            <button
              key={d.id}
              className={'protobar-tab' + (d.id === active ? ' is-on' : '')}
              onClick={() => setActive(d.id)}
            >
              <span className="protobar-num">{d.n}</span>
              {d.name}
            </button>
          ))}
        </nav>
        <div className="protobar-hint">
          {DIRECTIONS.map((d) => <span className="kbd" key={d.id}>{d.n}</span>)}
          <span className="protobar-hint-sep" />
          <span className="kbd">←</span><span className="kbd">→</span>
        </div>
      </div>
      <div className="app-stage" key={active}>
        <Component />
      </div>
    </div>
  )
}
