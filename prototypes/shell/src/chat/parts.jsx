import { useEffect, useState } from 'react'
import * as ui from '@charrette/ui'
import { AllowedBy, Decision, PermissionScope, SourceKind, sourceBrand } from '@charrette/ui'
import Icon from '../lib/Icon.jsx'
import { model, stepRef } from '../lib/models.js'

/* Chat primitives: everything a turn can hold, from @charrette/ui.

   What is left here adapts the prototype's data to the package: models by
   id become ModelInfo, the prototype's field names become the package's,
   and the project's name is filled in. The Specimen and the flows keep
   calling these names. */

const PROJECT = 'Meridian'
const noop = () => {}

/* The shell context is the package's, so its components find the side panel. */
export const Shell = ui.Shell

/* ---- Folding and copying, for the parts not yet on the package ---------- */
export function Fold({ open, children, className = '' }) {
  return (
    <div className={'cs-fold' + (open ? ' is-open' : '') + (className ? ' ' + className : '')} aria-hidden={!open}>
      <div className="cs-fold-in">{children}</div>
    </div>
  )
}

export function CopyButton({ text, label = 'Copy', className = '' }) {
  const [done, setDone] = useState(false)
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 1400); return () => clearTimeout(t) }, [done])
  return (
    <button type="button" className={'cs-copy' + (done ? ' is-done' : '') + ' ' + className}
      onClick={(e) => { e.stopPropagation(); try { navigator.clipboard?.writeText(text) } catch { /* no clipboard */ } setDone(true) }}
      title={label}>
      <Icon name={done ? 'check' : 'copy'} size={12} />
      <span>{done ? 'Copied' : label}</span>
    </button>
  )
}

/* ---- Messages ------------------------------------------------------------*/
export const You = ({ children, at, attach, queued, interrupting, unfurl }) => (
  <ui.You at={at} attach={attach} queued={queued} interrupting={interrupting} unfurl={unfurl} onOpenAttachment={noop}>{children}</ui.You>
)

/* With no picture of its own, the lightbox shows the response the screenshot was of. */
const MOCK = (
  <div className="cs-lb-mock">
    <span className="mono">HTTP/1.1 429 Too Many Requests</span>
    <span className="mono">Retry-After: 12</span>
    <span className="mono">X-RateLimit-Remaining: 0</span>
  </div>
)
export const Lightbox = ({ image, onClose }) => (
  <ui.Lightbox image={{ ...image, meta: image.meta || '1280 × 720 · 84 KB · attached 2h ago', view: image.view ?? MOCK }} onClose={onClose} onOpen={noop} />
)

export const Turn = ({ who = 'claude-opus-5', at, children, actions, forceActions, bare, coordinator }) => (
  <ui.Turn who={coordinator ? { name: 'Coordinator' } : model(who)} at={at} actions={actions} forceActions={forceActions} bare={bare}
    copy="(the message as markdown)" onQuote={noop}>{children}</ui.Turn>
)

export const P = ({ children, dim }) => <ui.Prose dim={dim} className="cs-p">{children}</ui.Prose>
export const Code = ui.Code
export const FileRef = ({ path, line }) => <ui.FileRef path={path} line={line} onOpen={noop} />
export const Cite = ({ n, children }) => <ui.Cite n={n}>{children}</ui.Cite>

export const WorkedFor = ({ took, summary, children, open }) => <ui.WorkedFor took={took} summary={summary} defaultOpen={open}>{children}</ui.WorkedFor>
export const Thinking = ({ label }) => <ui.Thinking>{label}</ui.Thinking>
export const Reasoning = ({ took, children, open }) => <ui.Reasoning took={took} defaultOpen={open}>{children}</ui.Reasoning>

/* A failed call's meta starts with its exit code. */
export function Tool({ meta, state = 'done', open, ...rest }) {
  const [exit, ...after] = state === 'failed' && meta ? meta.split(' · ') : []
  return <ui.Tool {...rest} state={state} exit={exit} meta={state === 'failed' ? after.join(' · ') : meta} defaultOpen={open} />
}
export const ToolGroup = ({ summary, took, children, open }) => <ui.ToolGroup summary={summary} took={took} defaultOpen={open}>{children}</ui.ToolGroup>

/* `more` is how many earlier lines are held back, above the rest. */
export const Terminal = ({ lines, exit, more, live }) => (
  <ui.Terminal lines={lines} exit={exit} live={live} earlier={more ? Array.from({ length: more }, (_, i) => `  ✓ refunds/handler › case ${i + 1}`) : undefined} />
)
export const MiniDiff = ({ lines }) => <ui.Diff lines={lines} />

/* ---- Web and MCP -------------------------------------------------------- */
export const WebFetch = ({ open, ...p }) => <ui.WebFetch {...p} defaultOpen={open} />
export const WebReads = ({ open, ...p }) => <ui.WebReads {...p} defaultOpen={open} />
export const WebSearch = ({ query, results, open }) => <ui.WebSearch query={query} results={results.map((r) => ({ title: r.t, host: r.host }))} defaultOpen={open} />
export const McpCall = ({ open, ...p }) => <ui.McpCall {...p} defaultOpen={open} />

/* ---- Delegation --------------------------------------------------------- */
export const SubAgents = ({ list }) => <ui.SubAgents list={list.map((a) => ({ ...a, model: model(a.model) }))} />

export const Step = ({ id, model: m, thread, open, ...rest }) => <ui.Step {...rest} model={model(m)} thread={stepRef(thread)} defaultOpen={open} />

export function Track({ n, of, state }) {
  return (
    <span className="cs-step-track" aria-label={`Step ${n} of ${of}`}>
      {Array.from({ length: of }, (_, i) => {
        const k = i + 1
        const c = k < n || (k === n && state === 'done') ? 'is-done' : k === n ? (state === 'stopped' ? 'is-stopped' : 'is-now') : ''
        return <i key={i} className={c} />
      })}
    </span>
  )
}

/* ---- Waiting on you ----------------------------------------------------- */
const KIND = 'anything that reaches staging'
const request = ({ agent = 'gpt-5.2-codex', ...r }) => ({ kind: KIND, ...r, agent: model(agent) })

export const Permission = ({ settled, ...card }) => (
  <ui.Permission {...request(card)} project={PROJECT}
    defaultAnswer={settled ? { decision: Decision.AllowAlways, cmd: card.cmd, scope: PermissionScope.Prefix } : undefined} />
)
export const Permissions = ({ items }) => <ui.Permissions items={items.map(request)} project={PROJECT} />
export const Allowed = ({ items, open }) => (
  <ui.Allowed project={PROJECT} defaultOpen={open}
    items={items.map((it) => (it.by === AllowedBy.Lead ? { ...it, lead: model(it.lead) } : it))} />
)

/* ---- Plan and artifacts ------------------------------------------------- */
export const Plan = ({ steps, updated }) => <ui.Plan steps={steps.map((s) => ({ label: s.t, state: s.state }))} updated={updated} />

const EDITOR = { open: 'Open in VS Code', openTitle: (where) => `Open ${where} in VS Code` }
export const CodeBlock = (p) => <ui.CodeBlock {...p} onOpen={noop} text={EDITOR} />
export const Snippet = ui.Snippet
export const Shots = ui.Shots
export const Table = ui.Table
export const FileArtifact = ({ doc, ...p }) => <ui.FileArtifact {...p} body={doc.body} onOpen={noop} />
export const Document = ui.Document
export const Markdown = ({ blocks }) => <ui.Markdown blocks={blocks} />

/* ---- Thread furniture --------------------------------------------------- */
export const Divider = ({ icon, children, action }) => <ui.Divider icon={icon} action={action} onAction={action ? noop : undefined}>{children}</ui.Divider>
export const Interrupted = ui.Interrupted
export const Restarted = ui.Restarted
/* a task that can't finish: the lead and the agents it could hand the step to, resolved */
export const Stuck = ({ read, agents, ...p }) => (
  <ui.Stuck {...p} read={read && { ...read, by: model(read.by) }} agents={agents?.map((a) => ({ ...a, model: model(a.model) }))}
    onTell={noop} onRetry={noop} onAbandon={noop} />
)

export const RateLimit = ({ runtime, resets, options = [], affects = [], onSwap }) => (
  <ui.RateLimit runtime={runtime} resets={resets} onSwap={onSwap}
    options={options.map((o) => ({ model: model(o.id), note: o.note, busy: o.busy }))}
    affects={affects.map((a) => ({ label: a.label, model: model(a.model) }))} />
)
export const LimitMoved = ({ to, ...p }) => <ui.LimitMoved {...p} to={model(to)} project={PROJECT} />

export const Streaming = ({ text, loop = true }) => <ui.Streaming content={text} loop={loop} />

export const Arrived = ({ kind = 'github', children, ...p }) => (
  <ui.Arrived {...p} mark={kind === 'github' ? sourceBrand(SourceKind.GitHub) : undefined}>{children}</ui.Arrived>
)

export const Question = ({ q, options }) => <ui.Question question={q} options={options.map((o) => ({ label: o.t, note: o.n }))} />

export const DocPanel = ({ doc, onClose }) => <ui.DocPanel doc={doc} onClose={onClose} onOpen={noop} text={EDITOR} />
