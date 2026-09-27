import * as ui from '@charrette/ui'
import { CheckState, TaskStatus, TrackStep } from '@charrette/ui'
import { useDismiss } from '../lib/hooks.js'
import { artifacts, attention, execution, knowledge, settled } from '../data/project.js'
import { model } from '../lib/models.js'

/* The dock, from @charrette/ui: one panel beside the board, holding project
   knowledge, artifacts, or the card you just opened. It stays with you when
   you change rooms. What is left here finds the thing the dock was opened
   on and puts this project's data into the peek for it. */
export default function Dock({ dock, opened, onClose, onRecord, onLibrary, floating }) {
  const ref = useDismiss(floating, onClose)
  const { name, sub, call = false, body } = peek(dock, opened, onRecord, onLibrary)
  return (
    <div className="rm-dock" ref={floating ? ref : undefined}>
      <ui.Dock key={dock.kind + (dock.id || '')} label={name} name={name} sub={sub} call={call} onClose={onClose}>
        {body}
      </ui.Dock>
    </div>
  )
}

function peek(dock, opened, onRecord, onLibrary) {
  switch (dock.kind) {
    case 'know':
      return { name: 'Knowledge', body: <Know onLibrary={onLibrary} /> }
    case 'art':
      return {
        name: 'Artifacts',
        body: (
          <ui.ListPeek
            about="What tasks wrote that is worth keeping, and isn’t in the repository."
            sections={[{ entries: artifacts.map((a) => ({ id: a.id, title: a.t, meta: `${a.kind} · ${a.meta}` })) }]}
          />
        ),
      }
    case 'att': {
      const a = attention.find((x) => x.id === dock.id)
      return { name: a.kind, sub: `${a.raisedBy} · ${a.raisedAt}`, call: true, body: a.pr ? <Accept a={a} onRecord={onRecord} /> : <Call a={a} onRecord={onRecord} /> }
    }
    case 'settled': {
      const s = settled.find((x) => x.id === dock.id)
      return { name: s.ref, sub: `${s.outcome} · ${s.when}`, body: <ui.SettledPeek title={s.title} meta={s.meta} /> }
    }
    case 'new': {
      const t = opened.find((x) => x.id === dock.id)
      const steps = (t.steps || ['Implement', 'Review']).map((label, i) => ({ label, state: i === 0 ? TrackStep.Now : TrackStep.Next, meta: i === 0 ? 'started just now' : undefined }))
      return {
        name: t.ref,
        sub: `${t.branch || 'no branch'} · ${t.elapsed}`,
        body: <ui.WorkPeek title={t.title} note="Started from the plan in the conversation. The lead is reading the code it touches." steps={steps} lead={model(t.worker)} />,
      }
    }
    default: {
      const t = execution.find((x) => x.id === dock.id)
      return { name: t.ref, sub: `${t.branch || 'no branch'} · ${t.elapsed}`, body: <Work t={t} /> }
    }
  }
}

function Call({ a, onRecord }) {
  return (
    <ui.CallPeek
      title={a.title}
      because={a.because}
      detail={a.detail}
      options={a.options}
      evidence={a.evidence}
      releases={a.blocking ? `Releases ${a.blocking}` : 'Resolves the contradiction'}
      onRecord={(id) => onRecord(a, a.options.find((o) => o.id === id))}
    />
  )
}

/* Accepting from the board: enough to decide on a small change without
   opening the task, and the task one click away when it is not small. */
function Accept({ a, onRecord }) {
  const p = a.pr
  return (
    <ui.AcceptPeek
      title={a.title}
      because={a.because}
      repo={p.repo}
      number={p.number}
      url={`https://github.com/${p.repo}/pull/${p.number}`}
      lead={model(p.writer)}
      reviewers={[model(p.reviewer)]}
      files={p.files}
      checks={p.checks.map((c) => ({ id: c.name, name: c.name, state: CheckState.Passed, detail: c.detail }))}
      onAccept={() => onRecord(a, { label: 'Accepted' })}
      onSendBack={() => onRecord(a, { label: 'Sent back' })}
    />
  )
}

const STEP = { done: TrackStep.Done, running: TrackStep.Now, blocked: TrackStep.Now, queued: TrackStep.Next }

function Work({ t }) {
  if (!t.graph) return <ui.WorkPeek title={t.title} note={t.note} waiting={t.reason} />
  return (
    <ui.WorkPeek
      title={t.title}
      note={t.note}
      status={t.state === 'blocked' ? TaskStatus.Yours : TaskStatus.Running}
      steps={t.graph.map((n) => ({ label: n.label, state: STEP[n.state], meta: n.meta || undefined, added: n.added }))}
      lead={model(t.worker)}
    />
  )
}

const entry = (k) => ({ id: k.id, title: k.t, meta: `${k.meta} · ${k.used}`, flagged: k.flagged })

function Know({ onLibrary }) {
  return (
    <ui.ListPeek
      action={<ui.ActionButton kbd="⇧K" onClick={onLibrary}>Open knowledge full size</ui.ActionButton>}
      about="Held by the project. Every task starts with its notes, and adds what it saw."
      sections={[
        { label: 'Notes', entries: knowledge.canonical.map(entry) },
        { label: 'Seen in tasks', entries: knowledge.episodic.map(entry) },
      ]}
    />
  )
}
