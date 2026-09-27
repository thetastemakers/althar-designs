import { Thread } from '@charrette/ui'
import { Fragment, useEffect, useRef, useState } from 'react'
import Icon from '../lib/Icon.jsx'
import Model from '../lib/Model.jsx'
import Composer from '../lib/Composer.jsx'
import {
  Cite, CodeBlock, Divider, DocPanel, Document, FileArtifact, FileRef, Lightbox, McpCall, MiniDiff, P,
  Allowed, LimitMoved, Permission, Permissions, Plan, Question, RateLimit, Reasoning, Shell, Shots, Snippet, Step, Interrupted, Restarted, Streaming, Stuck,
  SubAgents, Table, Terminal, Thinking, Tool, ToolGroup, Turn, WebFetch, WebReads, WebSearch, WorkedFor, You, Arrived,
} from './parts.jsx'
import Listening from '../lib/Listening.jsx'
import { COORDINATOR_LISTENS, LISTEN } from './listen.js'
import { STEPS, STUCK, findings, refDoc, summaryDoc } from './data.js'
import { GraphChanged, GraphProposal, LeadPick, Review, SteerLine, StepPanel, Steers } from './steps.jsx'
import { ProjectRules } from './rules.jsx'
import { Issue, TaskCard, TaskLaunch, TaskMark } from './coordinator.jsx'
import Flow from './Flow.jsx'
import '../task/task.css'
import './chat.css'

/* The chat workshop.

   Two ways to look at the same primitives. The catalogue is a specimen
   sheet: one thread, each state named in the margin, an index on the left.
   The conversation is the same pieces in use, the way a finished task reads,
   with its work folded. Variants of undecided things sit in the top bar. */

const INDEX = [
  ['Coordinator', [
    ['launch', 'Task about to start'], ['out', 'Plan, an agent is out'], ['unread', 'A link it can’t read'], ['empty', 'Held, in the task'],
    ['started', 'Task running'], ['paused', 'Paused or stopped'], ['history', 'Task over time'],
  ]],
  ['You ask', [
    ['you', 'Your message'], ['attach', 'With attachments'], ['reason', 'Reasoning, folded'], ['plan', 'Plan'],
  ]],
  ['It works', [
    ['group', 'Grouped run'], ['reply', 'Reply, with references'], ['edit', 'Edit, with diff'], ['run', 'Command'],
    ['failed', 'Command, failed'], ['web', 'Web'], ['mcp', 'MCP tool'], ['subs', 'Sub-agents'],
  ]],
  ['Steps', [
    ['step', 'Step lines'], ['steer', 'Talking to a step'], ['graph', 'Graph changed'], ['proposal', 'Graph change, needs you'],
  ]],
  ['Review', [
    ['settled', 'Settled by the lead'], ['review', 'Waits for you'], ['parallel', 'Parallel, needs your call'],
  ]],
  ['Permissions', [
    ['perm', 'One request'], ['perms', 'Several, stacked'], ['many', 'Many at once'], ['allowed', 'Allowed without you'],
  ]],
  ['Usage limits', [
    ['limit', 'Asks you'], ['moved', 'Handled by the rule'], ['wait', 'Nothing else free'],
  ]],
  ['When it can’t finish', [
    ['stuck', 'Stuck'], ['restart', 'After a restart'],
  ]],
  ['Questions', [
    ['question', 'Question'],
  ]],
  ['It hands back', [
    ['worked', 'Finished turn, folded'], ['code', 'Code block'], ['snippet', 'Command to copy'], ['shots', 'Images'], ['table', 'Table'],
    ['file', 'File'], ['doc', 'Markdown document'], ['actions', 'Message actions'],
  ]],
  ['Over time', [
    ['compact', 'Context compacted'], ['swap', 'Model changed'], ['stopped', 'Interrupted by you'],
    ['live', 'Working now'], ['queued', 'Queued message'],
  ]],
  ['Listening', [
    ['listen', 'One source'], ['listens', 'Several sources'], ['heard', 'Something arrived'], ['arrived', 'In the thread'],
  ]],
  ['Project', [
    ['rules', 'Project rules'],
  ]],
  ['Edges', [
    ['thinking', 'Before the first word'], ['jump', 'New below'],
  ]],
]

const PR1206 = { ...LISTEN['431:running'].script[0].listen, what: 'checks, comments' }

export const SET_ASIDE = 'The spec attached to this task says one budget per partner, and Gemini 3 Pro read it the same way.'

export const ALLOWED = [
  { step: 'Security review', cmd: 'pnpm test webhooks/deliver', by: 'rule', rule: 'Rule: tests always run' },
  { step: 'Security review', cmd: 'rg -n "partnerId" src/logging/', by: 'lead', lead: 'claude-opus-5', why: 'read-only, inside the workspace' },
  { step: 'Implement', cmd: 'pnpm add -D @sinonjs/fake-timers', by: 'lead', lead: 'claude-opus-5', why: 'dev dependency the fix needs' },
]

export const LIMIT_OPTIONS = [
  { id: 'gpt-5.2-codex', note: 'Codex · 38% of this week used' },
  { id: 'gemini-3-pro', note: 'Gemini CLI · API key, billed per token' },
  { id: 'qwen3-coder', note: 'Ollama · this Mac, slower' },
  { id: 'claude-sonnet-5', note: 'Claude Code · same limit, resets 14:00', busy: true },
]

function Spec({ id, name, children }) {
  return (
    <div className="cs-spec" id={'s-' + id} data-spec={id}>
      <span className="cs-spec-k">{name}</span>
      <Thread label={name}>{children}</Thread>
    </div>
  )
}

const mode0 = () => (window.location.hash === '#chat/flow' ? 'flow' : 'catalogue')

export default function Specimen() {
  const scroll = useRef(null)
  const [mode, setMode] = useState(mode0)
  const [term, setTerm] = useState('paper')
  const [at, setAt] = useState('you')
  const [draft, setDraft] = useState('')
  const [doc, setDoc] = useState(null)
  const [step, setStep] = useState(null)
  const [steers, setSteers] = useState([])
  const [image, setImage] = useState(null)

  useEffect(() => { window.history.replaceState(null, '', mode === 'flow' ? '#chat/flow' : '#chat') }, [mode])

  useEffect(() => {
    const root = scroll.current
    if (!root || mode !== 'catalogue') return
    const io = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setAt(vis[0].target.dataset.spec)
    }, { root, rootMargin: '-8% 0px -72% 0px' })
    root.querySelectorAll('[data-spec]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [mode])

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape' && (doc || step) && !image && !e.defaultPrevented) { setDoc(null); setStep(null) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [doc, step, image])

  const go = (id) => scroll.current?.querySelector('#s-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <Shell.Provider value={{
      openDoc: (d) => { setStep(null); setDoc(d) },
      openImage: setImage,
      openStep: (st) => { setDoc(null); setStep(st) },
      steers,
      steer: (st, text) => setSteers((v) => [...v, { id: v.length + 1, step: st, text }]),
    }}>
      <div className={'tv-win cs-win is-' + mode + (doc || step ? ' has-panel' : '')} data-term={term}>
        <div className="tv-bar-top">
          <div className="traffic"><i /><i /><i /></div>
          <span className="tv-bar-t">Chat workshop</span>
          <span className="tv-bar-sep">/</span>
          <span className="tv-bar-ref">task 431</span>
          <span className="cs-bar-sp" />
          <Seg label="View" value={mode} onChange={setMode} options={[['catalogue', 'Catalogue'], ['flow', 'Conversation']]} />
          <Seg label="Terminal" value={term} onChange={setTerm} options={[['paper', 'Paper'], ['dark', 'Dark']]} />
        </div>

        <div className="cs-body">
          {mode === 'catalogue' && (
            <nav className="cs-rail">
              {INDEX.map(([group, items]) => (
                <div key={group} className="cs-rail-g">
                  <span className="eyebrow">{group}</span>
                  {items.map(([id, name]) => (
                    <button key={id} className={'cs-rail-b' + (at === id ? ' is-on' : '')} onClick={() => go(id)}>{name}</button>
                  ))}
                </div>
              ))}
            </nav>
          )}

          <div className="cs-main">
            <div className="cs-scroll tv-scroll" ref={scroll} key={mode}>
              <div className="tv-measure cs-measure">
                {mode === 'catalogue' ? <Catalogue /> : <Flow />}
              </div>
            </div>

            <div className="tv-composer-wrap cs-composer">
              <div className="tv-measure">
                <Composer className="tv-composer" busy value={draft} onChange={setDraft} onSubmit={() => setDraft('')}
                  placeholder="Add to the queue, or interrupt the lead" hint="/"
                  model="gpt-5.2-codex" onModel={() => {}} role="Lead agent · task 431"
                  context={{ used: 188, note: 'Each step starts from the task record, so a full context never loses the task.' }} />
              </div>
            </div>
          </div>

          {doc && <DocPanel doc={doc} onClose={() => setDoc(null)} />}
          {step && <StepPanel key={step.id} step={step} onClose={() => setStep(null)} />}
        </div>
      </div>
      {image && <Lightbox image={image} onClose={() => setImage(null)} />}
    </Shell.Provider>
  )
}

function Seg({ label, value, onChange, options }) {
  return (
    <span className="cs-seg-wrap">
      <span className="cs-seg-k">{label}</span>
      <span className="cs-seg">
        {options.map(([id, name]) => (
          <button key={id} className={'cs-seg-b' + (value === id ? ' is-on' : '')} onClick={() => onChange(id)}>{name}</button>
        ))}
      </span>
    </span>
  )
}

/* ---- A task over time -----------------------------------------------------
   Each status change is posted as a new card at that point in the
   conversation. The card it replaces folds into a TaskMark in its old place,
   so looking back shows when things changed, and the live card is always the
   latest one. */
const T432 = {
  task: 432, title: 'Backfill idempotency keys on refunds created before PR 1184', from: 'MER-231',
  lead: 'claude-opus-5', branch: 'ch/432-backfill-idempotency',
  steps: ['Implement', 'Dry run on a copy', 'Review', 'Security review', 'Draft PR'],
}
const STAGES = [
  { status: 'running', step: 0, at: '11:02', verb: 'started', detail: 'Opus 5 leads', now: 'Implement · reading the refunds schema', started: 'started 11:02', label: 'Implement' },
  { status: 'running', step: 1, at: '11:31', verb: 'moved to Dry run on a copy', detail: '3 files, one migration', now: 'Dry run · replaying last night’s snapshot', started: 'started 11:02', label: 'Dry run' },
  { status: 'running', step: 2, at: '11:44', verb: 'moved to Review', detail: 'dry run clean on 18,402 refunds', now: 'Review · Sonnet 5 and Gemini 3 Pro', started: 'started 11:02', label: 'Review' },
  { status: 'running', step: 0, seen: 2, at: '11:50', verb: 'went back to Implement', detail: 'review asked for 2 fixes', now: 'Implement · round 2 · fixing what review found', started: 'started 11:02', label: 'Implement, round 2' },
  { status: 'you', step: 3, at: '12:05', verb: 'waited on you', detail: 'to run a command on staging', now: 'Security review · a command that reaches staging', started: 'started 11:02', label: 'Waiting on you' },
  { status: 'done', step: 5, at: '12:20', verb: 'is done', detail: 'Draft PR 1191; checks passed', now: 'Draft PR opened; checks passed', started: 'took 1h 18m', label: 'Done', pr: 'Draft PR 1191' },
]
const BETWEEN = {
  0: (
    <>
      <You at="11:09">Also, the nightly export got slow this week. Can someone look?</You>
      <Turn coordinator at="11:09"><P>That’s separate from 432, so I’ll plan it as its own task once you’ve said which export: partner or finance?</P></Turn>
    </>
  ),
  3: <You at="11:52">Partner. No rush.</You>,
}

function TaskOverTime() {
  const [stage, setStage] = useState(4)
  const card = useRef(null)
  const jump = () => {
    const el = card.current
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.remove('is-found'); void el.offsetWidth; el.classList.add('is-found')
  }
  const live = STAGES[stage]
  return (
    <Thread label="Task over time" className="cs-tot">
      {STAGES.slice(0, stage).map((st, i) => (
        <Fragment key={i}>
          <TaskMark task={T432.task} verb={st.verb} detail={st.detail} at={st.at} steps={T432.steps} step={st.step} seen={st.seen} now={live.label} last={i === stage - 1} onJump={jump} />
          {BETWEEN[i]}
        </Fragment>
      ))}
      <Turn coordinator at={live.at}>
        <TaskCard key={stage} fresh={stage > 0} cardRef={card} {...T432} status={live.status} at={live.step} seen={live.seen}
          now={live.now} started={live.started} pr={live.pr} />
      </Turn>
      {BETWEEN[stage]}
      <div className="cs-tot-ctl">
        <button type="button" className="cs-more" disabled={stage === STAGES.length - 1} onClick={() => setStage(stage + 1)}>Next status change</button>
        <button type="button" className="cs-more" disabled={stage === 0} onClick={() => setStage(0)}>Back to the start</button>
      </div>
    </Thread>
  )
}

/* ---- The catalogue --------------------------------------------------------*/
function Catalogue() {
  return (
    <>
      <p className="tv-lede">Refunds over a partner’s limit skip rate limiting today; charges return 429 with Retry-After.</p>

      <Spec id="launch" name="Task about to start">
        <You at="just now" unfurl={<Issue id="MER-231" title="Backfill idempotency keys on refunds created before PR 1184" state="Todo" priority="High" meta="Due 2.20 · Partner success" />}>
          linear.app/meridian/issue/MER-231 Take this end to end. It’s a one-off script, but it writes to refunds.
        </You>
        <Turn coordinator at="just now">
          <P>Task 432, from MER-231. This is the plan; change anything before it starts.</P>
          <TaskLaunch task={432} from="MER-231" branch="ch/432-backfill-idempotency" title="Backfill idempotency keys on refunds created before PR 1184"
            estimate="About 40 min · about $2 on your subscriptions"
            steps={[
              { id: 'impl', label: 'Implement', model: 'claude-opus-5', why: 'recommended · writes to money records', fixed: 'the lead' },
              { id: 'dry', label: 'Dry run on a copy', model: 'gpt-5.2-codex', why: 'replays against last night’s snapshot', optional: true },
              { id: 'review', label: 'Review', models: ['claude-sonnet-5', 'gemini-3-pro'], why: 'two labs, combined', optional: true },
              { id: 'sec', label: 'Security review', model: 'claude-sonnet-5', why: 'required by your rule for money handling', fixed: 'Meridian’s rule' },
            ]} />
        </Turn>
        <P dim>Leaving it alone is a yes: it starts when the count runs out. Hold stops the clock.</P>
      </Spec>

      <Spec id="out" name="Plan, an agent is out">
        <Turn coordinator at="just now">
          <P>Task 433. Claude Code is out until 14:00, so Codex leads. Security review stays on Sonnet by your rule, so it waits for the reset unless you move it.</P>
          <TaskLaunch task={433} branch="ch/433-export-speed" title="Find why the nightly partner export got slow"
            estimate="About 25 min of work" limited={{ via: 'claude-code', name: 'Claude Code', until: '14:00' }}
            steps={[
              { id: 'impl', label: 'Implement', model: 'gpt-5.2-codex', why: 'Claude Code is out; Codex is free', fixed: 'the lead' },
              { id: 'review', label: 'Review', model: 'gemini-3-pro', why: 'a different lab from the lead', optional: true },
              { id: 'sec', label: 'Security review', model: 'claude-sonnet-5', why: 'required by your rule', fixed: 'Meridian’s rule' },
            ]} />
        </Turn>
        <P dim>Change Security review’s agent and the wait goes away.</P>
      </Spec>

      <Spec id="unread" name="A link it can’t read">
        <You at="just now" unfurl={<Issue id="MER-240" unread="Linear isn’t connected to Meridian yet" />}>
          linear.app/meridian/issue/MER-240 Can you pick this up?
        </You>
        <Turn coordinator at="just now">
          <P>I can’t open MER-240, so I haven’t planned anything. Connect Linear and I’ll read it, or paste what it says.</P>
        </Turn>
      </Spec>

        <Spec id="empty" name="Held, in the task">
          <NewTask />
        </Spec>


      <Spec id="started" name="Task running">
        <Turn coordinator at="just now">
          <TaskCard task={432} status="running" title="Backfill idempotency keys on refunds created before PR 1184" from="MER-231"
            lead="claude-opus-5" branch="ch/432-backfill-idempotency" started="started 4m ago" now="Implement · writing the backfill script"
            steps={['Implement', 'Dry run on a copy', 'Review', 'Security review', 'Draft PR']} at={0} />
        </Turn>
        <Turn coordinator at="12m ago" bare>
          <TaskCard task={431} status="you" title="Refunds rate-limit like charges" lead="gpt-5.2-codex" branch="ch/431-refund-limits"
            started="started 2h ago" now="Verify on staging · a command that reaches staging"
            steps={['Triage', 'Implement', 'Review', 'Security review', 'Verify', 'Draft PR']} at={4} />
        </Turn>
        <Turn coordinator at="1h ago" bare>
          <TaskCard task={429} status="done" title="Webhook retries respect partner limits" lead="claude-sonnet-5" branch="ch/429-webhook-retries"
            started="took 48m" now="Draft PR opened; checks passed" pr="Draft PR 1187"
            steps={['Implement', 'Review', 'Draft PR']} at={3} />
        </Turn>
        <P dim>One live card per task. Starting one from the plan above lands here.</P>
      </Spec>

      <Spec id="paused" name="Paused or stopped">
        <Turn coordinator at="14m ago">
          <TaskCard task={433} status="paused" title="Find why the nightly partner export got slow" lead="gpt-5.2-codex" branch="ch/433-export-speed"
            started="started 40m ago" now="Security review waits for Claude Code · resets 14:00"
            steps={['Implement', 'Review', 'Security review', 'Draft PR']} at={2} />
        </Turn>
        <Turn coordinator at="2h ago" bare>
          <TaskCard task={428} status="stopped" title="Move partner webhooks to the new queue" lead="claude-opus-5" branch="ch/428-webhook-queue"
            started="ran 22m" now="during Implement · the branch is kept"
            steps={['Implement', 'Review', 'Draft PR']} at={0} />
        </Turn>
        <P dim>Neither is waiting on you, so neither is violet. A paused task resumes on its own; a stopped one keeps its branch and record.</P>
      </Spec>

      <Spec id="history" name="Task over time">
        <TaskOverTime />
      </Spec>

      <Spec id="you" name="Your message">
        <You at="2h ago">Refunds should rate-limit like charges do. Match the headers exactly.</You>
      </Spec>

      <Spec id="attach" name="With attachments">
        <You at="2h ago" attach={[
          { kind: 'file', name: 'rate-limits.md', meta: '4 KB' },
          { kind: 'image', name: '429-response.png' },
          { kind: 'paste', name: 'Pasted text', meta: '38 lines' },
        ]}>The spec and the response partners expect. The pasted bit is the current limiter config.</You>
      </Spec>

      <Spec id="reason" name="Reasoning, folded">
        <Turn at="2h ago">
          <Reasoning took="14s">
            Charges wrap the handler in withPartnerLimit. Refunds were added later behind their own router and never picked it up. The limiter keys by partner id, so refunds and charges should share a bucket or partners get double the budget. Check which the spec wants before writing anything.
          </Reasoning>
          <Spec id="plan" name="Plan">
            <Plan updated="just now" steps={[
              { t: 'Find how charges apply the partner limit', state: 'done' },
              { t: 'Wrap the refund router in the same limiter', state: 'done' },
              { t: 'Test 429 and Retry-After on refunds', state: 'running' },
              { t: 'Update the API reference', state: 'queued' },
            ]} />
          </Spec>
        </Turn>
      </Spec>

      <Spec id="group" name="Grouped run">
        <Turn at="2h ago">
          <ToolGroup summary="Explored 4 files and ran 2 searches" took="22s" open>
            <Tool kind="search" verb="Searched" target="withPartnerLimit  src/" meta="6 results" />
            <Tool kind="search" verb="Searched" target="Retry-After  src/" meta="3 results" />
            <Tool kind="read" verb="Read" target="src/charges/limit.ts" meta="88 lines" />
            <Tool kind="read" verb="Read" target="src/refunds/router.ts" meta="142 lines" />
            <Tool kind="list" verb="Listed" target="src/refunds/" meta="9 files" />
            <Tool kind="read" verb="Read" target="docs/rate-limits.md" meta="attached" />
          </ToolGroup>

          <Spec id="reply" name="Reply, with references">
            <P>
              Charges apply the limit in <FileRef path="src/charges/limit.ts" line="42" />; the refund router was added
              after and never wrapped. I will share the partner’s bucket rather than give refunds their own, since the
              spec counts both against one limit<Cite n="1"><b>rate-limits.md</b> · “Refunds and charges draw on one budget per partner.”</Cite>.
              Refund writes stay fail-fast, not queued<Cite n="2"><b>Knowledge · canonical</b> · Refund writes are fail-fast, not queued. Decided on task 402.</Cite>.
            </P>
          </Spec>
        </Turn>
      </Spec>

      <Spec id="edit" name="Edit, with diff">
        <Turn at="1h 50m ago">
          <Tool kind="edit" verb="Edited" target="src/refunds/router.ts" sheet meta={<><b className="cs-add">+14</b> <b className="cs-del">−3</b></>} open>
            <RouterDiff />
          </Tool>
          <Tool kind="create" verb="Created" target="src/refunds/limit.test.ts" meta={<b className="cs-add">+61</b>} />
        </Turn>
      </Spec>

      <Spec id="run" name="Command">
        <Turn at="1h 45m ago">
          <Tool kind="run" verb="Ran" target="pnpm test refunds" meta="38 passed" took="12s" copy="pnpm test refunds" open>
            <Terminal exit={0} more={6} lines={[
              ' ✓ refunds/router › returns 429 over the partner limit',
              ' ✓ refunds/router › sets Retry-After in seconds',
              ' ✓ refunds/router › shares the bucket with charges',
              '',
              ' Test Files  4 passed (4)',
              '      Tests  38 passed (38)',
            ]} />
          </Tool>
          <Tool kind="run" verb="Ran" target="pnpm typecheck" meta="no errors" took="9s" copy="pnpm typecheck"><Terminal exit={0} lines={['Found 0 errors.']} /></Tool>
        </Turn>
      </Spec>

      <Spec id="failed" name="Command, failed">
        <Turn at="1h 44m ago">
          <Tool kind="run" verb="Ran" target="pnpm lint" state="failed" meta="exit 1 · 2 problems" took="4s" copy="pnpm lint" open>
            <Terminal exit={1} lines={[
              'src/refunds/limit.test.ts',
              "  14:7  error  'partner' is assigned a value but never used",
              '  52:3  error  Unexpected console statement',
              '',
              '✗ 2 problems (2 errors, 0 warnings)',
            ]} />
          </Tool>
          <P>Two lint errors in the test file. Fixed both.</P>
          <Tool kind="edit" verb="Edited" target="src/refunds/limit.test.ts" meta={<><b className="cs-add">+1</b> <b className="cs-del">−3</b></>} />
          <Tool kind="run" verb="Ran" target="pnpm lint" meta="clean" took="4s" />
        </Turn>
      </Spec>

      <Spec id="web" name="Web">
        <Turn at="1h 40m ago">
          <WebSearch query="Retry-After seconds or HTTP date 429" open results={[
            { t: 'RFC 9110 · HTTP Semantics · 10.2.3 Retry-After', host: 'rfc-editor.org' },
            { t: '429 Too Many Requests · HTTP', host: 'developer.mozilla.org' },
            { t: 'Rate limits · API reference', host: 'docs.stripe.com' },
          ]} />
          <WebReads pages={[
            { title: 'RFC 9110 · 10.2.3 Retry-After', url: 'https://www.rfc-editor.org/rfc/rfc9110#section-10.2.3' },
            { title: '429 Too Many Requests', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429' },
            { title: 'Rate limits', url: 'https://docs.stripe.com/rate-limits' },
            { title: 'Handling rate limits', url: 'https://docs.adyen.com/development-resources/rate-limits' },
          ]} />
          <WebFetch title="RFC 9110 · 10.2.3 Retry-After" url="https://www.rfc-editor.org/rfc/rfc9110#section-10.2.3" open
            excerpt="The value of this field can be either an HTTP-date or a number of seconds to delay after receiving the response." />
        </Turn>
      </Spec>

      <Spec id="mcp" name="MCP tool">
        <Turn at="1h 39m ago">
          <McpCall server="Linear" tool="get_issue" args={'"MER-212"'} open result={{
            summary: 'MER-212 · In progress',
            fields: [['Title', 'Partner limits for refunds'], ['Status', 'In progress'], ['Asked by', 'Partner success · Acme'], ['Due', '2.14']],
          }} />
        </Turn>
      </Spec>

      <Spec id="subs" name="Sub-agents">
        <Turn at="1h 38m ago">
          <P>Splitting the rest across two sub-agents.</P>
          <SubAgents list={[
            { label: 'Edge cases: burst, reset, clock skew', model: 'claude-sonnet-5', state: 'done', meta: '9 tests · 6m', calls: <>
              <Tool kind="read" verb="Read" target="src/charges/limit.test.ts" meta="210 lines" />
              <Tool kind="edit" verb="Edited" target="src/refunds/limit.test.ts" meta={<b className="cs-add">+48</b>} />
              <Tool kind="run" verb="Ran" target="pnpm test refunds/limit" meta="9 passed" took="6s" />
            </> },
            { label: 'API reference for 429 on refunds', model: 'gpt-5-mini', state: 'running', meta: 'writing · 3m', calls: <>
              <Tool kind="read" verb="Read" target="docs/api/charges-rate-limits.md" meta="58 lines" />
              <Tool kind="create" verb="Writing" target="docs/api/refunds-rate-limits.md" state="running" meta="now" />
            </> },
          ]} />
        </Turn>
      </Spec>

      <Spec id="step" name="Step lines">
        <Step n={2} of={6} label="Implement" model="claude-opus-5" state="running" />
        <Step n={4} of={6} label="Security review" model="claude-sonnet-5" state="done" outcome="No findings" took="4m" thread={STEPS.security}
          why="Added by your rule: security review on changes that touch money handling."
          detail={<P>Checked the limiter order, what reaches the logs, and the webhook retry path you asked about. Nothing to report.</P>} />
        <Step n={5} of={6} label="Verify on staging" model="gpt-5.2-codex" state="stopped" outcome="stopped by the lead after your message" took="2m in" />
      </Spec>

      <Spec id="steer" name="Talking to a step">
        <Step n={4} of={6} label="Security review" model="claude-sonnet-5" state="running" thread={STEPS.security} why="Added by your rule: security review on changes that touch money handling." />
        <SteerLine step={STEPS.security} text="Also check the webhook retry path; it calls the same limiter." at="2m ago" />
        <Steers step="security" />
        <P dim>Open the step’s thread to talk to it: its agent answers there, and one line lands here.</P>
      </Spec>

      <Spec id="graph" name="Graph changed">
        <GraphChanged rev={3} by="gpt-5.2-codex" why="after your message about staging"
          summary="Verify on staging replaced by Verify on fixtures"
          nodes={[
            { t: 'Triage', s: 'done' }, { t: 'Implement', s: 'done' }, { t: 'Review', s: 'done' }, { t: 'Security review', s: 'done' },
            { t: 'Verify on staging', s: 'stopped' }, { t: 'Verify on fixtures', s: 'added' }, { t: 'Open PR', s: 'next' },
          ]}
          ops={['Stopped Verify on staging, 2 minutes in. It had only read; nothing to undo.', 'Added Verify on fixtures: replay yesterday’s refund log against the branch locally.', 'Open PR now waits on Verify on fixtures.']} />
        <P dim>Undo lasts ten seconds, and the step it adds waits that long before it starts. After that, a different graph is something you ask the lead for.</P>
      </Spec>

      <Spec id="proposal" name="Graph change, needs you">
        <Turn who="gpt-5.2-codex" at="30m ago">
          <P>Partners will hit this first on staging. I would deploy there after the merge and watch the 429 rate for an hour.</P>
          <GraphProposal by="gpt-5.2-codex" what="Add Deploy to staging and Watch 429s after the PR merges"
            nodes={[{ t: 'Open PR', s: 'now' }, { t: 'Merge', s: 'next' }, { t: 'Deploy to staging', s: 'added' }, { t: 'Watch 429s · 1h', s: 'added' }]}
            needs="Deploying to staging, which this run was not given" budget="About $3 more, within the project’s monthly limit" />
        </Turn>
      </Spec>

      <Spec id="settled" name="Review, settled by the lead">
        <Review n={3} of={6} reviewers={[{ model: 'claude-sonnet-5' }, { model: 'gemini-3-pro' }]} verdict="changes" thread={STEPS.review}
          findings={findings.map((f) => (f.id === 'f2' ? { ...f, state: 'aside', reason: SET_ASIDE } : { ...f, state: 'fixed', round: 2 }))} />
        <P dim>The usual case. The lead fixed two and set one aside; nothing waited on you. It opens if you want to check.</P>
      </Spec>

      <Spec id="review" name="Review, waits for you">
        <Review n={3} of={6} reviewers={[{ model: 'claude-sonnet-5' }]} verdict="changes" took="4m" thread={STEPS.security} reach="all"
          findings={findings.filter((f) => f.by.includes('claude-sonnet-5')).map((f) => ({ ...f, by: ['claude-sonnet-5'], against: null }))} />
      </Spec>

      <Spec id="parallel" name="Parallel review">
        <Review n={3} of={6} state="running" reviewers={[
          { model: 'claude-sonnet-5', state: 'done', meta: 'done · 2 findings · 3m 50s' },
          { model: 'gemini-3-pro', state: 'running', meta: 'reading src/refunds/router.ts · 2m 10s' },
        ]} />
        <Review n={3} of={6} reviewers={[{ model: 'claude-sonnet-5' }, { model: 'gemini-3-pro' }]} verdict="changes" took="4m 20s" thread={STEPS.review}
          findings={findings.map((f) => (f.id === 'f2' ? { ...f, state: 'yours', ask: 'The reviewers disagree and nothing on the task settles it. One budget, or a bucket for refunds?' } : f))} />
      </Spec>

      <Spec id="perm" name="Permission">
        <Turn who="gpt-5.2-codex" at="1h 20m ago">
          <P>To check the headers against real traffic I need to replay yesterday’s refund log on staging.</P>
          <Permission
            what="Run a command that reaches staging"
            cmd="pnpm replay --env staging --from 2026-09-25 refunds"
            why="Passed to you by the lead: staging is on Meridian’s always-ask list."
          />
        </Turn>
      </Spec>

      <Spec id="perms" name="Permissions, stacked">
        <Turn who="gpt-5.2-codex" at="1h 18m ago" bare>
          <Permissions items={[
            { step: 'Verify on staging', agent: 'gpt-5.2-codex', what: 'Run a command that reaches staging', cmd: 'pnpm replay --env staging --from 2026-09-25 refunds', why: 'Passed to you by the lead: staging is on Meridian’s always-ask list.' },
            { step: 'Verify on staging', agent: 'gpt-5.2-codex', what: 'Fetch a page on staging', cmd: 'curl https://staging.meridian.dev/health', why: 'Staging is on Meridian’s always-ask list.' },
            { step: 'Docs', agent: 'gpt-5-mini', what: 'Publish a preview of the docs', cmd: 'pnpm docs:publish --preview', why: 'Publishing is on Meridian’s always-ask list.' },
          ]} />
        </Turn>
      </Spec>

      <Spec id="many" name="Many at once">
        <Turn who="gpt-5.2-codex" at="40m ago" bare>
          <Permissions items={[
            { step: 'Verify on staging', agent: 'gpt-5.2-codex', what: 'Run a command that reaches staging', cmd: 'pnpm replay --env staging --from 2026-09-25 refunds', why: 'Staging is on Meridian’s always-ask list.' },
            { step: 'Verify on staging', agent: 'gpt-5.2-codex', what: 'Fetch a page on staging', cmd: 'curl https://staging.meridian.dev/health', why: 'Staging is on Meridian’s always-ask list.' },
            { step: 'Verify on staging', agent: 'gpt-5.2-codex', what: 'Read staging logs', cmd: 'kubectl logs -n staging deploy/refunds --since=1h', why: 'Staging is on Meridian’s always-ask list.' },
            { step: 'Docs', agent: 'gpt-5-mini', what: 'Publish a preview of the docs', cmd: 'pnpm docs:publish --preview', why: 'Publishing is on Meridian’s always-ask list.' },
            { step: 'Docs', agent: 'gpt-5-mini', what: 'Post the preview link on MER-212', cmd: 'linear comment MER-212', why: 'Messages to people are on Meridian’s always-ask list.' },
            { step: 'Implement', agent: 'claude-opus-5', what: 'Push to main', cmd: 'git push origin main', why: 'The lead would not answer this one: pushing to main is always yours.' },
            { step: 'Implement', agent: 'claude-opus-5', what: 'Spend past $5 on this task', cmd: 'budget +$4 (now $5.20)', why: 'Spending is on Meridian’s always-ask list.' },
          ]} />
        </Turn>
        <P dim>Seven from three steps. The stack never shows more than two behind the front card, and each answer goes back to its own step. Allow all is one click, but it covers only what is in the stack.</P>
      </Spec>

      <Spec id="allowed" name="Allowed without you">
        <Allowed items={ALLOWED} open />
      </Spec>

      <Spec id="limit" name="Usage limit">
        <Turn at="1h 5m ago" bare>
          <RateLimit runtime="Claude Code" resets="14:00, in 2h 10m" options={LIMIT_OPTIONS}
            affects={[{ label: 'the lead', model: 'claude-opus-5' }, { label: 'Security review', model: 'claude-sonnet-5' }]} />
        </Turn>
        <P dim>Only when the project says to ask. By default the work moves on its own, as in “Usage limit, handled”.</P>
      </Spec>

      <Spec id="moved" name="Usage limit, handled">
        <LimitMoved what="Security review" to="gemini-3-pro" runtime="Claude Code" resets="14:00" />
        <LimitMoved what="Lead" to="gpt-5.2-codex" runtime="Claude Code" resets="14:00" />
      </Spec>

      <Spec id="wait" name="Nothing else free">
        <LimitMoved what="The lead" runtime="Claude Code" resets="14:00" />
        <P dim>Every connected runtime is out, or the rule says wait. One line, no card: the task keeps its place and resumes on its own. Its card in the coordinator shows Paused.</P>
      </Spec>

      <Spec id="stuck" name="Stuck">
        <Stuck {...STUCK} />
      </Spec>

      <Spec id="restart" name="After a restart">
        <Restarted checking />
        <Restarted />
      </Spec>

      <Spec id="question" name="Question">
        <Turn at="1h 12m ago">
          <Question q="Should a partner over the limit get the refund queued, or refused?" options={[
            { t: 'Refuse with 429 and Retry-After', n: 'matches charges' },
            { t: 'Queue it and return 202', n: 'conflicts with a canonical entry' },
          ]} />
        </Turn>
        <You at="1h 10m ago">Refuse. Same as charges.</You>
      </Spec>

      <Spec id="worked" name="Finished turn, folded">
        <Turn at="58m ago">
          <WorkedFor took="12m 40s" summary="3 files edited · 4 commands · 1 search">
            <ToolGroup summary="Explored 3 files" took="8s">
              <Tool kind="read" verb="Read" target="src/charges/limit.ts" meta="88 lines" />
            </ToolGroup>
            <Tool kind="edit" verb="Edited" target="src/refunds/router.ts" meta={<><b className="cs-add">+14</b> <b className="cs-del">−3</b></>} />
            <Tool kind="run" verb="Ran" target="pnpm test refunds" meta="38 passed" took="12s" />
          </WorkedFor>
          <P>Refunds now share the partner budget with charges and answer 429 with Retry-After in seconds. Tests and lint pass.</P>
        </Turn>
      </Spec>

      <Spec id="code" name="Code block">
        <Turn at="58m ago">
          <P>This is the whole change to the router, for review:</P>
          <CodeBlock file="src/refunds/router.ts" line={18} lang="TypeScript" highlight={[2, 4, 5, 6, 7]} code={`import { idempotent } from '../idempotency'
import { withPartnerLimit } from '../charges/limit'

refunds.post('/', withPartnerLimit(idempotent(createRefund), {
  bucket: 'partner',
  retryAfter: 'seconds',
}))`} />
        </Turn>
      </Spec>

      <Spec id="snippet" name="Command to copy">
        <Turn at="57m ago">
          <P>To see it yourself against the branch:</P>
          <Snippet cmd="curl -i -X POST localhost:4000/v1/refunds -H 'Partner: acme' -H 'Idempotency-Key: 7f3c9e' -d @fixtures/refund.json" />
          <Snippet cmd="pnpm dev" />
        </Turn>
      </Spec>

      <Spec id="shots" name="Images">
        <Turn who="gpt-5.2-codex" at="56m ago">
          <P>How a partner sees a refused refund in the dashboard, before and after:</P>
          <Shots items={[
            { name: 'refund-refused-before.png', label: 'Before', meta: '1440 × 900', view: <Dash /> },
            { name: 'refund-refused-after.png', label: 'After', meta: '1440 × 900', view: <Dash after /> },
          ]} />
        </Turn>
      </Spec>

      <Spec id="table" name="Table">
        <Turn at="55m ago">
          <P>Limits as they now apply:</P>
          <Table head={['Endpoint', 'Budget', 'Window', 'Over the limit']} rows={[
            ['POST /charges', '600', '1 min', '429 · Retry-After'],
            ['POST /refunds', 'shared', '1 min', '429 · Retry-After'],
            ['GET /refunds/:id', 'none', '—', '—'],
          ]} />
        </Turn>
      </Spec>

      <Spec id="file" name="File">
        <Turn at="50m ago">
          <P>The API reference for partners:</P>
          <FileArtifact path="docs/api/refunds-rate-limits.md" kind="Markdown" size="2.1 KB" lines={64} doc={refDoc} />
        </Turn>
      </Spec>

      <Spec id="doc" name="Markdown document">
        <Turn at="49m ago">
          <Document {...summaryDoc} />
        </Turn>
      </Spec>

      <Spec id="actions" name="Message actions">
        <Turn at="48m ago" actions="2.4k tokens" forceActions>
          <P>Done with the reference. Nothing else is left on the plan but the replay you allowed.</P>
        </Turn>
      </Spec>

      <Spec id="compact" name="Context compacted">
        <Divider icon="compress" action="Show summary">Earlier turns summarised · 212k → 38k tokens</Divider>
      </Spec>

      <Spec id="swap" name="Model changed">
        <div className="tv-swap">
          <span>Lead changed to</span><Model id="gpt-5.2-codex" />
          <span className="tv-swap-note">· picks up from the task’s record</span>
        </div>
      </Spec>

      <Spec id="stopped" name="Interrupted by you">
        <Turn who="gpt-5.2-codex" at="20m ago">
          <P>Replaying the staging log now. The first 1,200 refunds match charges exactly; I am going to widen it to the full day and</P>
          <Interrupted />
        </Turn>
        <You at="19m ago">The first 1,200 is enough. Open the PR.</You>
      </Spec>

      <Spec id="live" name="Working now">
        <Turn who="gpt-5.2-codex" at="now">
          <Tool kind="run" verb="Running" target="pnpm test" state="running" meta="1m 12s" copy="pnpm test" open>
            <Terminal lines={[' ✓ charges/limit (14)', ' ✓ refunds/router (38)']} live=" ⋯ webhooks/deliver (running 22 of 41)" />
          </Tool>
          <Streaming text="All refund tests pass. Running the full suite before I open the PR, since the limiter is shared with charges and a regression there would not show in the refund tests alone." />
        </Turn>
      </Spec>

      <Spec id="queued" name="Queued message">
        <You queued>Title the PR “Rate-limit refunds like charges”.</You>
      </Spec>

      <Spec id="listen" name="Listening, one source">
        <div className="cs-ls-demo"><Listening sources={[PR1206]} /></div>
      </Spec>

      <Spec id="listens" name="Several sources, opened">
        <div className="cs-ls-demo is-open"><Listening open sources={COORDINATOR_LISTENS} note="What arrives comes into this conversation. Tasks listen to their own pull requests." /></div>
      </Spec>

      <Spec id="heard" name="Something arrived">
        <div className="cs-ls-demo"><Listening sources={[PR1206]} flash={{ key: 1, text: 'New comment · dana' }} stay /></div>
      </Spec>

      <Spec id="arrived" name="Arrived in the thread">
        <Arrived from="dana" where="PR 1206" at="2m ago">Retry-After here is in seconds, but I remember charges sending an HTTP date. Which one do partners get from refunds?</Arrived>
        <Turn who="gpt-5.2-codex" at="2m ago">
          <Tool kind="comment" verb="Replied on" target="PR 1206" meta="to dana" />
          <P>Seconds, the same as charges. The HTTP date was only ever in the v1 charges handler, and refunds don’t go through v1. I answered on the PR with the line in src/refunds/limit.ts.</P>
        </Turn>
        <Arrived kind="ci" verb="All 41 checks passed on" where="PR 1206" at="just now" />
      </Spec>

      <Spec id="rules" name="Project rules">
        <ProjectRules />
      </Spec>

      <div className="cs-edges">
        <Spec id="thinking" name="Before the first word">
          <div className="cs-frame is-short">
            <Turn who="gpt-5.2-codex" at="now">
              <Thinking label="Reading the webhook delivery tests" />
            </Turn>
          </div>
        </Spec>

        <Spec id="jump" name="New below">
          <div className="cs-frame is-short">
            <P dim>…earlier in the thread, where you scrolled up to read.</P>
            <button className="cs-jump"><span className="pulse" />3 new<Icon name="down" size={11} /></button>
          </div>
        </Spec>
      </div>
    </>
  )
}

/* A task you held before it started, opened: the coordinator's pick for
   lead, with its reasons, sits above the composer; the composer follows the
   pick. */
function NewTask() {
  const [lead, setLead] = useState('claude-opus-5')
  const short = { 'claude-opus-5': 'Opus 5', 'gpt-5.2-codex': 'Codex', 'gemini-3-pro': 'Gemini 3 Pro' }[lead]
  return (
    <div className="cs-frame">
      <div className="cs-empty">
        <span className="cs-empty-k">Task 432 · held before it started</span>
        <p className="cs-empty-t">Backfill idempotency keys on refunds created before PR 1184</p>
        <p className="cs-empty-m">You held the plan in the coordinator. Nothing has run yet; tell the lead how to start, or start it as planned.</p>
        <div className="cs-empty-acts"><button type="button" className="cs-btn">Start as planned</button><span>4 steps · Opus 5 leads · draft PR at the end</span></div>
      </div>
      <LeadPick value={lead} onChange={setLead} />
      <Composer value="" onChange={() => {}} onSubmit={() => {}} placeholder={`Tell ${short} how to start`} hint="/"
        model={lead} onModel={setLead} role="Lead agent · task 432" context={{ used: 0 }} />
    </div>
  )
}

/* A partner dashboard, drawn for the screenshots the agent sends. */
function Dash({ after }) {
  return (
    <span className="dsh">
      <span className="dsh-bar"><i />Acme<span>Refunds</span></span>
      <span className="dsh-body">
        <span className="dsh-h">Refunds</span>
        <span className="dsh-row"><b>re_3Pq · order 88213</b><span>€42.00</span><span>just now</span></span>
        <span className="dsh-row"><b>re_3Pp · order 88207</b><span>€18.50</span><span>1 min ago</span></span>
        {after
          ? <span className="dsh-note"><b>Too many refunds right now.</b> Sent again automatically in 12 s.</span>
          : <span className="dsh-toast">Something went wrong. Try again.</span>}
      </span>
    </span>
  )
}

export function RouterDiff() {
  return (
    <MiniDiff lines={[
      ['@', '', '@@ -18,9 +18,20 @@ export const refunds = router()'],
      [' ', 18, "import { idempotent } from '../idempotency'"],
      ['+', 19, "import { withPartnerLimit } from '../charges/limit'"],
      [' ', 20, ''],
      ['-', 21, "refunds.post('/', idempotent(createRefund))", 'idempotent(createRefund))'],
      ['+', 21, "refunds.post('/', withPartnerLimit(idempotent(createRefund), {", 'withPartnerLimit('],
      ['+', 22, "  bucket: 'partner',"],
      ['+', 23, "  retryAfter: 'seconds',"],
      ['+', 24, '}))'],
    ]} />
  )
}
