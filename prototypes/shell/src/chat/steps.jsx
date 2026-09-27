import { useState } from 'react'
import * as ui from '@charrette/ui'
import { MODELS } from '../lib/Model.jsx'
import { model, stepRef } from '../lib/models.js'
import { P, Turn, WorkedFor, Tool } from './parts.jsx'
import { reviewDoc } from './data.js'

/* Steps: how the work of other agents reaches the task thread, from
   @charrette/ui. What is left here adapts the prototype's data: models by
   id, findings with `sev`, graph nodes as { t, s }. */

const PROJECT = 'Meridian'
const INSTRUCTIONS = { path: '.charrette/review.md', ...reviewDoc }

/* How findings reach you. A project setting; shown where findings are. */
export const REACH = [
  { id: 'stuck', t: 'Only when the lead can’t settle one', n: 'The lead fixes or sets aside the rest, and says why' },
  { id: 'all', t: 'Every finding, before the lead acts', n: 'The lead waits for your pass over the list' },
  { id: 'learn', t: 'Every finding at first, then fewer', n: 'Asks less as you agree with the lead’s calls · 6 of 10 so far' },
]

const finding = ({ sev, by, against, ...f }) => ({
  ...f,
  severity: sev,
  by: by.map(model),
  against: against ? { model: model(against.model), text: against.text } : undefined,
})

export const Review = ({ reviewers, findings = [], thread, reach = 'stuck', open, ...rest }) => (
  <ui.Review {...rest} project={PROJECT} instructions={INSTRUCTIONS} learned="6 of 10 so far" defaultReach={reach}
    reviewers={reviewers.map((r) => ({ ...r, model: model(r.model) }))} defaultFindings={findings.map(finding)}
    thread={stepRef(thread)} defaultOpen={open} />
)

const nodesOf = (nodes) => nodes.map((n) => ({ label: n.t, state: n.s }))
export const GraphStrip = ({ nodes }) => <ui.GraphStrip nodes={nodesOf(nodes)} />

export const GraphChanged = ({ by, why, rule, nodes, ...rest }) => (
  <ui.GraphChanged {...rest} nodes={nodesOf(nodes)} project={PROJECT} cause={rule ? { rule } : { by: model(by), why }} />
)

export const GraphProposal = ({ by, nodes, ...rest }) => <ui.GraphProposal {...rest} by={model(by)} nodes={nodesOf(nodes)} />

/* ---- Talking to a step -------------------------------------------------- */
export const SteerLine = ({ step, text, at }) => <ui.SteerLine step={stepRef(step)} said={text} at={at} />
export const Steers = ({ step }) => <ui.Steers step={step} />

/* What each agent said in the step, for its thread. */
const SAID = {
  'claude-sonnet-5': { took: '3m 50s', summary: 'read 6 files · 1 search', text: 'Two findings. The limiter runs after the idempotency lookup, so a replay spends budget; and refunds share the charges bucket, which will refuse refunds for a partner at full charge volume.' },
  'gemini-3-pro': { took: '4m 20s', summary: 'read 5 files', text: 'Two findings. Same one on limiter order; and the reset test waits on the wall clock. The shared bucket matches the spec, so I did not flag it.' },
  security: { took: '3m 40s', summary: 'read 6 files · 1 search', text: 'The limiter runs before the idempotency lookup and before any write, so a refused refund leaves nothing behind. No secrets or partner ids reach the logs.' },
}

/* The step's own thread, beside the task thread. The shell's steer puts one
   line of what you send into the task thread. */
export function StepPanel({ step, onClose }) {
  const { steer } = ui.useShell()
  const ids = step.agents || [step.model?.id ?? step.model]
  const many = ids.length > 1
  const [sent, setSent] = useState([])
  const short = (id) => MODELS[id]?.short ?? id
  const said = (id) => SAID[step.id === 'security' ? 'security' : id]
  const body = (tab) => {
    const shown = tab === 'all' ? ids : [tab]
    const mine = sent.filter((x) => x.tab === tab || x.tab === 'all')
    return (
      <ui.Thread label={`${step.label}: its thread`} className="cs-sp-thread">
        {shown.map((id) => (
          <Turn key={id} who={id} at={id === 'gemini-3-pro' ? '1h 58m ago' : '2h ago'}>
            <WorkedFor took={said(id).took} summary={said(id).summary}>
              <Tool kind="read" verb="Read" target="src/refunds/router.ts" meta="151 lines" />
              <Tool kind="read" verb="Read" target="src/charges/limit.ts" meta="88 lines" />
            </WorkedFor>
            <P>{said(id).text}</P>
          </Turn>
        ))}
        {mine.map((x, i) => (
          <ui.You key={i} at={`sent to ${x.tab === 'all' ? 'both reviewers' : many ? short(x.tab) : step.label}`}>{x.t}</ui.You>
        ))}
        {mine.length > 0 && (
          <Turn who={tab === 'all' ? ids[0] : tab} at="now">
            <P>Checking that too. The webhook retry path calls the limiter through <ui.Code>deliverWithRetry</ui.Code>; reading it now.</P>
          </Turn>
        )}
      </ui.Thread>
    )
  }
  const ref = stepRef(step)
  return (
    <ui.StepPanel step={ref} agents={ids.map(model)} instructions={INSTRUCTIONS} onClose={onClose} body={body}
      onSend={(t, tab) => {
        setSent((v) => [...v, { t, tab }])
        steer(many && tab !== 'all' ? { ...ref, label: `${step.label} · ${short(tab)}` } : ref, t)
      }} />
  )
}

/* ---- Who leads ------------------------------------------------------------ */
export const LEAD_OPTIONS = [
  { id: 'claude-opus-5', note: 'Recommended · led 8 tasks on Meridian, 7 merged after one review round' },
  { id: 'gpt-5.2-codex', note: 'Codex · 38% of this week used · led 3 tasks on Meridian' },
  { id: 'gemini-3-pro', note: 'API key, about $1.90 for a task this size · no tasks on Meridian yet' },
]
const REASONS = [
  'The task changes src/refunds, which Meridian’s rules mark as money handling',
  'Opus led 8 of the last 10 tasks in src/refunds; 7 merged after one review round',
  'Claude Code has 60% of this week left; tasks this size used about 9%',
]

export const LeadPick = ({ value, onChange }) => (
  <ui.LeadPick value={value} onChange={onChange} reasons={REASONS} options={LEAD_OPTIONS.map((o) => ({ model: model(o.id), note: o.note }))} />
)

export const LeadLine = ({ model: id, why }) => <ui.LeadLine model={model(id)} why={why} />
