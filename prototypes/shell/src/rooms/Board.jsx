import * as ui from '@charrette/ui'
import { BoardLane, Outcome, TaskStatus, Wait } from '@charrette/ui'
import { attention, execution, settled } from '../data/project.js'
import { model } from '../lib/models.js'
import './board.css'

/* The board room, from @charrette/ui: up next, running, needs you, settled.
   What is left here adapts this project's data to the cards: the step the
   graph is on, what a queued task waits for, and how each piece settled. */
export default function Board({ live, opened, released, dock, onOpen }) {
  const running = execution.filter((e) => e.state === 'running')
  const held = execution.filter((e) => e.state === 'blocked' && !released)
  const queued = execution.filter((e) => e.state === 'queued' && !opened.some((o) => o.ref === e.ref))
  const resumed = released ? execution.filter((e) => e.state === 'blocked') : []
  const todo = [...held, ...queued]
  const on = (id) => dock?.id === id
  return (
    <div className="bd">
      <ui.Board label="The project’s work" className="bd-board">
        <ui.BoardColumn lane={BoardLane.Next} count={todo.length}>
          <ui.BoardList>
            {todo.map((t, i) => <Next key={t.id} t={t} place={i + 1} current={on(t.id)} onOpen={() => onOpen({ kind: 'work', id: t.id })} />)}
          </ui.BoardList>
        </ui.BoardColumn>

        <ui.BoardColumn lane={BoardLane.Running} count={running.length + opened.length + resumed.length}>
          {opened.map((t) => <New key={t.id} t={t} current={on(t.id)} onOpen={() => onOpen({ kind: 'new', id: t.id })} />)}
          {resumed.map((t) => <Work key={t.id} t={t} resumed current={on(t.id)} onOpen={() => onOpen({ kind: 'work', id: t.id })} />)}
          {running.map((t) => <Work key={t.id} t={t} current={on(t.id)} onOpen={() => onOpen({ kind: 'work', id: t.id })} />)}
        </ui.BoardColumn>

        <ui.BoardColumn lane={BoardLane.Yours} count={live.length}>
          {live.map((a) => (a.pr
            ? <Accept key={a.id} a={a} current={on(a.id)} onOpen={() => onOpen({ kind: 'att', id: a.id })} />
            : <Call key={a.id} a={a} current={on(a.id)} onOpen={() => onOpen({ kind: 'att', id: a.id })} />))}
        </ui.BoardColumn>

        <ui.BoardColumn lane={BoardLane.Settled} count={settled.length}>
          <ui.BoardList>
            {settled.map((s) => <Settled key={s.id} s={s} current={on(s.id)} onOpen={() => onOpen({ kind: 'settled', id: s.id })} />)}
          </ui.BoardList>
        </ui.BoardColumn>
      </ui.Board>
    </div>
  )
}

/* A running task: the step it is on, and how many steps a rule added. */
function Work({ t, resumed, ...rest }) {
  const at = resumed ? 0 : Math.max(0, t.graph.findIndex((n) => n.state === 'running'))
  return (
    <ui.WorkCard
      {...rest}
      task={t.ref}
      kind={t.kind}
      title={t.title}
      steps={t.graph.map((n) => n.label)}
      at={at}
      elapsed={t.elapsed}
      lead={model(resumed ? 'claude-opus-5' : t.worker)}
      added={resumed ? 0 : t.graph.filter((n) => n.added).length}
    />
  )
}

/* Just started from the conversation: its first step, of the steps it was given. */
function New({ t, ...rest }) {
  const steps = t.steps?.length ? t.steps : ['Requirements', 'Implement', 'Review', 'Verify']
  return <ui.WorkCard {...rest} task={t.ref} kind="Delivery" title={t.title} steps={steps} at={0} elapsed={t.elapsed} lead={model(t.worker)} status={TaskStatus.Running} />
}

/* Up next: held on a call of yours, after another task, or for a free worker. */
function Next({ t, ...rest }) {
  const q = attention.find((a) => a.id === t.waitsOn)
  const wait = q ? Wait.You : t.after || /^After /.test(t.reason ?? '') ? Wait.After : Wait.Workers
  const reason = q ? `Waiting on ${q.title.charAt(0).toLowerCase()}${q.title.slice(1)}` : t.reason
  return <ui.NextRow {...rest} task={t.ref} kind={t.kind} title={t.title} wait={wait} reason={reason} />
}

function Call({ a, ...rest }) {
  return (
    <ui.CallCard
      {...rest}
      kind={a.kind}
      title={a.title}
      because={a.because}
      options={a.options.map((o) => o.label)}
      holds={a.holds}
      from={a.raisedBy}
      at={a.raisedAt}
    />
  )
}

function Accept({ a, ...rest }) {
  const p = a.pr
  return (
    <ui.AcceptCard
      {...rest}
      task={a.raisedBy.split('task ')[1]}
      title={a.title}
      prs={[{ repo: p.repo.split('/')[1], number: p.number, add: p.add, del: p.del }]}
      checks={p.checks.length}
      at={a.raisedAt}
    />
  )
}

const OUTCOME = { Merged: Outcome.Merged, Answered: Outcome.Answered, Artifact: Outcome.Artifact, Abandoned: Outcome.Abandoned, Knowledge: Outcome.Knowledge }

function Settled({ s, ...rest }) {
  return <ui.SettledRow {...rest} outcome={OUTCOME[s.outcome]} task={s.ref} kind={s.kind} title={s.title} meta={s.meta} at={s.when} />
}
