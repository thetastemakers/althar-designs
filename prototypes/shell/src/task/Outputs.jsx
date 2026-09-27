import { useState } from 'react'
import * as ui from '@charrette/ui'
import { ChangeState, CheckState, Severity } from '@charrette/ui'
import Icon from '../lib/Icon.jsx'
import { WithModels } from '../lib/Model.jsx'
import { model } from '../lib/models.js'
import { artifacts, changeSet, diff, findings, produced, sessionKnowledge, spikes } from './data.js'
import { Findings, Group, KRow } from './parts.jsx'
import { Spike } from './Talk.jsx'

/* The outputs face.

   What the task made, in the order you would want it when deciding whether
   to accept it. A task that made nothing does not get this face at all — the
   switch simply does not offer it. */

export default function Outputs({ task, st, onFull }) {
  if (task.id === 'session') return <SessionOut task={task} st={st} />
  return <DeliveryOut task={task} st={st} onFull={onFull} />
}

function DeliveryOut({ task, st, onFull }) {
  const done = st.id === 'settled'
  return (
    <div className="tv-scroll">
      <div className="tv-measure is-wide">
        <ChangeSet task={task} st={st} onFull={onFull} />

        <Group title="Artifact" meta="1">
          <ArtifactCard a={artifacts.review} />
          <Findings />
        </Group>

        {/* Nothing is retained until the evidence step runs, so an unfinished
            task does not get to show knowledge it has not written yet. */}
        <Group title="Knowledge retained" meta={done ? String(produced.length) : 'not written yet'}>
          {done
            ? produced.map((k) => <KRow key={k.id} k={k} />)
            : <p className="tv-out-empty">Evidence is the last step. Until it runs, what this task learned is still only in the conversation.</p>}
        </Group>

        <p className="tv-close">{st.close}</p>
      </div>
    </div>
  )
}

/* The change set, from @charrette/ui. What is left here adapts this task's
   data: the state it is in, the pull requests with their files, and the
   checks with who ran them. Accepting and sending back are held here, as
   the app would hold them, and the card follows. */
const STATE = { draft: ChangeState.Draft, open: ChangeState.Ready, merged: ChangeState.Merged }
const CHECK = { pass: CheckState.Passed, running: CheckState.Running, held: CheckState.Held, queued: CheckState.Queued }

function ChangeSet({ task, st, onFull }) {
  const [accepted, setAccepted] = useState(false)
  const [sent, setSent] = useState(false)
  const base = changeSet.states[st.id] || changeSet.states.running
  const p = accepted ? { ...changeSet.states.settled, note: 'Accepted by you · merged in order · just now' } : base
  const prs = changeSet.prs
  const num = (id) => prs.find((x) => x.id === id)?.number
  const reviewers = [...new Set(p.checks.map((c) => c.model).filter(Boolean))].map(model)
  const deciding = st.id === 'ready' && !accepted && !sent
  return (
    <ui.ChangeSet
      state={sent ? ChangeState.Draft : STATE[p.status]}
      note={sent ? 'Sent back · the lead has your note, and this comes back to you when it is checked again' : p.note}
      title={task.title}
      branch={task.branch}
      base={changeSet.base}
      commits={p.commits}
      lead={model(task.worker)}
      reviewers={reviewers}
      prs={prs.map((x) => ({
        repo: x.repo,
        number: x.number,
        url: x.url,
        files: diff.files.filter((f) => x.files.includes(f.path)),
        after: x.after ? { number: num(x.after), why: x.why } : undefined,
      }))}
      checks={p.checks.map((c) => ({
        id: c.id,
        name: c.name,
        state: CHECK[c.state],
        detail: c.detail,
        by: c.model ? [model(c.model)] : undefined,
        added: c.added,
      }))}
      onAccept={deciding ? () => setAccepted(true) : undefined}
      onSendBack={deciding ? () => setSent(true) : undefined}
      onReviewDiff={onFull}
      diffKey="d"
      onOpenFile={() => onFull()}
      className="tv-change"
    />
  )
}

/* An artifact is a document the task wrote, so it is drawn as one. */
function ArtifactCard({ a }) {
  const count = (sev) => findings.filter((f) => f.severity === sev).length
  return (
    <ui.ArtifactCard
      kind={a.kind}
      title={a.t}
      meta={<WithModels>{a.meta}</WithModels>}
      findings={{ [Severity.High]: count('high'), [Severity.Medium]: count('medium'), [Severity.Low]: count('low') }}
    />
  )
}

function SessionOut({ task, st }) {
  const done = st.id === 'settled'
  return (
    <div className="tv-scroll">
      <div className="tv-measure is-wide">
        {st.outcome && (
          <div className="tv-outcome is-top">
            <span className="tv-outcome-verdict">{st.outcome.verdict}</span>
            <span className="mono tv-outcome-pr">{st.outcome.pr}</span>
            <span className="tv-outcome-meta">{st.outcome.meta}</span>
          </div>
        )}

        <Group title="Attempts" meta={`${spikes.length} · ${done ? 'all branches discarded' : 'nothing merged'}`}>
          {spikes.map((sp) => (
            <Spike key={sp.id} sp={done && sp.verdict === 'Running' ? { ...sp, verdict: 'Discarded' } : sp} />
          ))}
          {st.outputsNote && <p className="tv-out-note">{st.outputsNote}</p>}
        </Group>

        <Group title="Artifact" meta={done ? '1' : 'not written yet'}>
          {done ? (
            <div className="tv-out-card is-static">
              <span className="tv-out-main">
                <span className="tv-out-t"><Icon name="artifact" size={12} />{artifacts.note.t}</span>
                <span className="tv-out-sub">{artifacts.note.kind} · {artifacts.note.meta}</span>
              </span>
            </div>
          ) : (
            <p className="tv-out-empty">
              The note is written when the session closes, not while it is still changing its mind.
            </p>
          )}
        </Group>

        <Group title="Knowledge retained" meta={String(sessionKnowledge.length)}>
          {sessionKnowledge.map((k) => <KRow key={k.id} k={k} />)}
        </Group>

        <p className="tv-close">{st.close}</p>
      </div>
    </div>
  )
}
