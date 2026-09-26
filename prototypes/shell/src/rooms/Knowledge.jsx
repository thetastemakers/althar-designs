import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useKey } from '../lib/hooks.js'
import Desk from '../explore/views/Desk.jsx'
import '../explore/views/knowledge.css'
import '../explore/views/combine.css'

/* Knowledge, full size. Not a room beside the conversation and the board:
   those are two ways of looking at the work, and this is the project's
   library. The panel is the glance; this is where you go from it, and it
   takes the window the way a task does, with one way out. */
export default function Knowledge({ project, onClose }) {
  const [recorded, setRecorded] = useState([])
  useKey((e, typing) => {
    if (typing) return
    if (e.key === 'Escape') { e.stopPropagation(); onClose() }
  }, [])
  return (
    <div className="tv-win">
      <div className="tv-bar-top">
        <div className="traffic"><i /><i /><i /></div>
        <button className="tv-bar-out" onClick={onClose}>
          <Icon name="arrow" size={12} className="tv-bar-back" />{project}<span className="kbd">esc</span>
        </button>
        <span className="tv-bar-sep">/</span>
        <span className="tv-bar-t">Knowledge</span>
      </div>
      <section className="rm-know">
        <Desk recorded={recorded} onRecord={(id, opt) => setRecorded((r) => [...r, { id, opt }])} />
      </section>
    </div>
  )
}
