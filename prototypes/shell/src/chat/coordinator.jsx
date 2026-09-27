import { useState } from 'react'
import * as ui from '@charrette/ui'
import { Brand, IssuePriority, IssueStatus, TaskEnd } from '@charrette/ui'
import ModelPick from '../lib/ModelPick.jsx'
import { effortFor } from '../lib/Model.jsx'
import { model } from '../lib/models.js'
import { useDefaultEfforts } from '../lib/pins.js'

/* The coordinator's cards, from @charrette/ui: the issue a task came from,
   the plan before it runs, the task as it runs, and the marks it leaves.
   What is left here adapts this app's data: models by id, issues from
   Linear by id, and each step's one model or several. */

const PROJECT = 'Meridian'
const from = (id) => id && { mark: Brand.Linear, id, linear: true }

const STATE = { Todo: IssueStatus.Todo, Backlog: IssueStatus.Backlog, 'In Progress': IssueStatus.InProgress, Done: IssueStatus.Done }
const PRIORITY = { Urgent: IssuePriority.Urgent, High: IssuePriority.High, Medium: IssuePriority.Medium, Low: IssuePriority.Low }

export function Issue({ id, title, state, priority, meta, unread }) {
  const base = { mark: Brand.Linear, source: 'Linear', id, tone: 'linear' }
  if (unread) return <ui.IssueUnread {...base} reason={unread} onConnect={() => {}} />
  return (
    <ui.Issue {...base} title={title} href={`https://linear.app/meridian/issue/${id}`} meta={meta}
      status={state && { state: STATE[state] ?? IssueStatus.Todo, label: state }}
      priority={priority && { level: PRIORITY[priority] ?? IssuePriority.None, label: priority }} />
  )
}

const noop = () => {}

export const TaskCard = ({ task, lead, from: source, kind, cardRef, seen, steps = [], ...rest }) => (
  <ui.TaskCard onOpen={noop} {...rest} steps={steps} ref={cardRef} task={String(task)} lead={model(lead)} from={from(source)} question={kind === 'Question'} seen={seen} />
)

export const TaskMark = ({ task, ...rest }) => <ui.TaskMark {...rest} task={String(task)} />

/* One agent in the plan: the composer's picker, bordered. A new model starts
   at its own default effort. */
function Agent({ agent, owner, onChange }) {
  const defaults = useDefaultEfforts()
  const [effort, setEffort] = useState(null)
  const def = effortFor(agent.id, defaults)
  return (
    <ModelPick role={owner} value={agent.id} effort={effort || def} defaultEffort={def} variant="field" placement="below"
      onChange={(id) => { setEffort(null); onChange(id) }} onEffort={setEffort} />
  )
}

const ENDS = { [TaskEnd.DraftPr]: 'Draft PR', [TaskEnd.ReadyPr]: 'PR for review', [TaskEnd.PushOnly]: 'Push branch' }

/* The plan, before it runs; once started, the task's card in its place. A
   step waits when its runtime is out. */
export function TaskLaunch({ task, title, from: source, steps: start, estimate, branch, limited, now = 'Reading the code it touches', onStart, onOpen }) {
  const [steps, setSteps] = useState(() => start.map(({ model: m, models, ...st }) => ({ ...st, agents: (models || [m]).map(model) })))
  const [started, setStarted] = useState(null)
  const shown = steps.map((st) => ({ ...st, waits: !!limited && !st.skipped && st.agents.some((a) => a.runtime === limited.via) }))
  const lead = steps[0].agents[0]

  if (started) {
    return <ui.TaskCard fresh task={String(task)} title={title} from={from(source)} lead={lead} branch={branch} status="running"
      steps={started} at={0} now={`${started[0]} · ${now.charAt(0).toLowerCase() + now.slice(1)}`} started="started just now" onOpen={onOpen} />
  }
  return (
    <ui.TaskLaunch task={String(task)} title={title} from={from(source)} project={PROJECT} estimate={estimate}
      limited={limited && { name: limited.name, until: limited.until }}
      steps={shown} onStepsChange={(next) => setSteps(next.map(({ waits, ...st }) => st))}
      picker={({ step, agent, k, owner }) => (
        <Agent agent={agent} owner={owner} onChange={(id) => setSteps((all) => all.map((st) => (st.id === step.id ? { ...st, agents: st.agents.map((a, i) => (i === k ? model(id) : a)) } : st)))} />
      )}
      onStart={(run, end) => {
        const labels = [...run.filter((st) => !st.skipped).map((st) => st.label), ENDS[end]]
        setStarted(labels)
        onStart?.({ task, title, branch, lead: lead.id, steps: labels })
      }} />
  )
}
