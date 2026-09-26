import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import Model from '../lib/Model.jsx'
import { useKey } from '../lib/hooks.js'
import { taskFor } from './data.js'
import { Bar } from './parts.jsx'
import Talk from './Talk.jsx'
import Outputs from './Outputs.jsx'
import Graph from './Graph.jsx'
import Diff from './Diff.jsx'
import './task.css'

/* One task, two faces.

   The conversation is where you are while the work happens: it is how you
   watch a worker think, and how you interrupt it. The outputs page is where
   you go when the work is over and you have to accept or reject it. Which
   one opens is a default, not a rule — the state decides, and you can always
   overrule it, in either direction.

   Everything else the task has — the graph it ran, the code it wrote — is an
   expansion. One key away, never in the way.

   The task takes the whole window. It is the work you sit with, not the work
   you check on, so the project chrome goes and there is one way out. */

/* Each face has its own key, so the way back is as obvious as the way in. */
const FACES = { talk: ['Conversation', 'c'], out: ['Outputs', 'o'] }

export default function Task({ taskRef, state, onClose }) {
  const task = taskFor(taskRef)
  const raw = task?.states[state] || task?.states.running

  const [face, setFace] = useState(null)
  const [overlay, setOverlay] = useState(null)
  const [recorded, setRecorded] = useState(null)

  const shown = face || raw?.face
  /* Choosing a face puts the expansion away: the graph and the diff belong to
     the task, not to one of its faces, so leaving one open behind a switch
     would say the switch did nothing. */
  const goFace = (f) => { setFace(f); setOverlay(null) }

  useKey((e, typing) => {
    if (typing) { if (e.key === 'Escape') e.target.blur(); return }
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') { e.stopPropagation(); overlay ? setOverlay(null) : onClose(); return }
    const f = task.faces.length > 1 && task.faces.find((x) => FACES[x][1] === e.key)
    if (f) { e.preventDefault(); goFace(f) }
    if (e.key === '/') { const el = document.querySelector('.tv-composer textarea'); if (el) { e.preventDefault(); el.focus() } return }
    if (e.key === 'g' && task.graph) { e.preventDefault(); setOverlay(overlay === 'graph' ? null : 'graph') }
    if (e.key === 'd' && task.branch) { e.preventDefault(); setOverlay(overlay === 'diff' ? null : 'diff') }
  }, [taskRef, overlay, shown])

  if (!task) return null

  /* Answering is not a receipt, it is a release: the held step starts again,
     the brass goes, and the task stops describing itself as stopped. */
  const st = recorded && raw.released
    ? { ...raw, chrome: raw.releasedChrome || raw.chrome, held: null, active: raw.held, close: raw.released }
    : raw

  const wide = shown === 'out' || overlay === 'graph'

  return (
    <div className="tv-win">
      <div className="tv-bar-top">
        <div className="traffic"><i /><i /><i /></div>
        {/* the way out sits where the eye starts, like a breadcrumb */}
        <button className="tv-bar-out" onClick={onClose}>
          <Icon name="arrow" size={12} className="tv-bar-back" />Meridian<span className="kbd">esc</span>
        </button>
        <span className="tv-bar-sep">/</span>
        <span className="mono tv-bar-ref">{task.ref}</span>
        <span className="tv-bar-t">{task.title}</span>
      </div>

      {overlay === 'diff' ? (
        <div className="tv"><Diff mode="full" branch={task.branch} onClose={() => setOverlay(null)} /></div>
      ) : (
        <div className="tv">
          <header className="tv-head">
            <div className={'tv-measure' + (wide ? ' is-wide' : '')}>
              <div className="tv-title-line">
                <span className="mono tv-ref">{task.ref}</span>
                <h1>{task.title}</h1>
                {/* brass only while a step is actually held: an offer, or an
                    answered question, is not a stoppage */}
                <span className={'tv-state' + (st.held ? ' is-held' : '')}>{st.chrome}</span>
              </div>
              <p className="tv-meta">
                {task.label}
                <i /><Model id={task.worker} short />
                <i />{task.branch || 'no branch'}
                <i />{st.since}
                <i />{st.elapsed}
                {/* what it cost, at API prices, even on a subscription — there
                    if you look, never a meter */}
                {st.cost && <><i /><span className="tv-cost" title="Estimated at API prices">{st.cost}</span></>}
              </p>
              <Bar task={task} st={st} />

              <div className="tv-faces">
                {task.faces.length > 1 ? (
                  <div className="tv-seg">
                    {task.faces.map((f) => (
                      <button key={f} className={'tv-seg-b' + (shown === f ? ' is-on' : '')}
                        onClick={() => goFace(f)}>
                        {FACES[f][0]}<span className="kbd">{FACES[f][1]}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="tv-faces-none">Nothing was built, so there is nothing else to look at.</p>
                )}

                <div className="tv-expands">
                  {task.graph && (
                    <button className={'tv-expand' + (overlay === 'graph' ? ' is-on' : '')}
                      onClick={() => setOverlay(overlay === 'graph' ? null : 'graph')}>
                      <Icon name="branch" size={12} />Graph<span className="kbd">g</span>
                    </button>
                  )}
                  {task.branch && (
                    <button className="tv-expand" onClick={() => setOverlay('diff')}>
                      <Icon name="work" size={12} />Code<span className="kbd">d</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {overlay === 'graph'
            ? <Graph task={task} st={st} onClose={() => setOverlay(null)} />
            : shown === 'out'
              ? <Outputs task={task} st={st} onFull={() => setOverlay('diff')} />
              : <Talk task={task} st={st} recorded={recorded} onRecord={setRecorded}
                  onFull={() => setOverlay('diff')} />}
        </div>
      )}
    </div>
  )
}
