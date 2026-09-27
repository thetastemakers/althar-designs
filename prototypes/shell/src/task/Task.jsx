import { useState } from 'react'
import * as ui from '@charrette/ui'
import { TaskStatus, TrackStep } from '@charrette/ui'
import { MODELS } from '../lib/Model.jsx'
import { model } from '../lib/models.js'
import { useKey } from '../lib/hooks.js'
import { taskFor } from './data.js'
import { stepState } from './parts.jsx'
import Talk from './Talk.jsx'
import Outputs from './Outputs.jsx'
import Graph from './Graph.jsx'
import Diff from './Diff.jsx'
import Face from '../chat/Face.jsx'
import { LISTEN } from '../chat/listen.js'
import Flow from '../chat/Flow.jsx'
import Flow418 from '../chat/Flow418.jsx'
import './task.css'

/* Tasks whose conversation is built from the chat primitives. */
const CHATS = { refunds: Flow, token: Flow418 }

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

const STEP = { done: TrackStep.Done, running: TrackStep.Now, held: TrackStep.Now, queued: TrackStep.Next }

/* Violet only while a step is actually held, or a verified change waits on
   you: an offer, or an answered question, is not a stoppage. */
const statusOf = (st) =>
  st.held || st.id === 'ready' ? TaskStatus.Yours
  : st.id === 'settled' ? TaskStatus.Done
  : st.active || st.id === 'running' ? TaskStatus.Running
  : TaskStatus.Done

export default function Task({ taskRef, state, onClose, running = 0, yours = 0, onYours }) {
  const task = taskFor(taskRef)
  const raw = task?.states[state] || task?.states.running

  const [face, setFace] = useState(null)
  const [overlay, setOverlay] = useState(null)
  const [recorded, setRecorded] = useState(null)
  /* stopped from the task menu, until resumed; abandoned settles it */
  const [ended, setEnded] = useState(null)

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
  const status = ended === 'stopped' ? TaskStatus.Stopped : ended === 'abandoned' ? TaskStatus.Done : statusOf(st)

  return (
    <div className="tv-win">
      {/* the way out sits where the eye starts, like a breadcrumb */}
      {/* what else needs you stays in sight while a task has the window */}
      <ui.TitleBar lights="drawn" className="tv-chrome" end={<ui.WorkStatus running={running} yours={yours} onYours={onYours} />}>
        <ui.BackCrumb to="Meridian" kbd="esc" onBack={onClose} task={task.ref} title={task.title} />
      </ui.TitleBar>

      {overlay === 'diff' ? (
        <div className="tv"><Diff mode="full" branch={task.branch} onClose={() => setOverlay(null)} /></div>
      ) : (
        <div className="tv">
          <div className="tv-head">
            <div className={'tv-measure' + (wide ? ' is-wide' : '')}>
              <ui.TaskHeader
                task={task.ref}
                title={task.title}
                status={status}
                state={ended === 'stopped' ? 'Stopped by you' : ended === 'abandoned' ? 'Abandoned' : st.chrome}
                kind={task.label}
                lead={model(task.worker)}
                branch={task.branch || undefined}
                since={st.since}
                elapsed={st.elapsed}
                cost={st.cost}
                steps={task.graph?.map((n) => ({ label: n.label, state: STEP[stepState(st, n)] }))}
                faces={task.faces.map((f) => ({ value: f, label: FACES[f][0], kbd: FACES[f][1] }))}
                face={shown}
                onFace={goFace}
                facesNote={task.faces.length > 1 || task.branch ? undefined : 'Nothing was built, so there is nothing else to look at.'}
                actions={
                  <>
                    {task.graph && (
                      <ui.ChromeButton icon="branch" label="Graph" kbd="g" pressed={overlay === 'graph'} onClick={() => setOverlay(overlay === 'graph' ? null : 'graph')} />
                    )}
                    {task.branch && <ui.ChromeButton icon="work" label="Code" kbd="d" onClick={() => setOverlay('diff')} />}
                    <ui.TaskMenu
                      status={status}
                      onStop={() => setEnded('stopped')}
                      onResume={() => setEnded(null)}
                      onAbandon={() => setEnded('abandoned')}
                      onReopen={() => setEnded(null)}
                    />
                  </>
                }
              />
            </div>
          </div>

          {overlay === 'graph'
            ? <Graph task={task} st={st} onClose={() => setOverlay(null)} />
            : shown === 'out'
              ? <Outputs task={task} st={st} onFull={() => setOverlay('diff')} />
              : CHATS[task.chat]
                ? (() => { const Thread = CHATS[task.chat]; return (
                    <Face key={task.ref + st.id} busy={st.id === 'running'} listen={LISTEN[`${task.ref}:${st.id}`]} composer={{
                      model: task.worker, role: `Lead agent · task ${task.ref}`,
                      placeholder: st.id === 'running' ? 'Add to the queue, or interrupt the lead' : `Tell ${MODELS[task.worker]?.short} something about ${task.ref}`,
                      context: { used: 188, note: 'Each step starts from the task record, so a full context never loses the task.' },
                    }}><Thread state={st.id} /></Face>
                  ) })()
                : <Talk task={task} st={st} recorded={recorded} onRecord={setRecorded}
                    onFull={() => setOverlay('diff')} />}
        </div>
      )}
    </div>
  )
}
