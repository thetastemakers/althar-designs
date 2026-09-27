import { Thread } from '@charrette/ui'
import Model from '../lib/Model.jsx'
import {
  Cite, CodeBlock, Divider, Document, FileArtifact, FileRef, McpCall, P, Plan, Question,
  Allowed, LimitMoved, Reasoning, Snippet, Step, Streaming, SubAgents, Table, Terminal, Tool, ToolGroup, Turn,
  WebFetch, WorkedFor, You,
} from './parts.jsx'
import { GraphChanged, LeadLine, Review, SteerLine, Steers } from './steps.jsx'
import { STEPS, findings, refDoc, summaryDoc } from './data.js'
import { ALLOWED, RouterDiff, SET_ASIDE } from './Specimen.jsx'

/* One task, start to now, the way it reads when you come back to it.

   The thread is you and the lead. The lead triages and implements; other
   agents run as steps and report back as one line each, which opens. Only
   what needs you breaks in. Finished turns fold their work into "Worked
   for"; the turn in progress shows everything as it happens. */
export default function Flow() {
  return (
    <Thread label="Task thread" className="cs-flow">
      <p className="tv-lede">Refunds over a partner’s limit skip rate limiting today; charges return 429 with Retry-After.</p>

      <LeadLine model="claude-opus-5" why="src/refunds is money handling; led 8 tasks here, 7 merged after one review round" />

      <You at="2h 40m ago" attach={[
        { kind: 'file', name: 'rate-limits.md', meta: '4 KB' },
        { kind: 'image', name: '429-response.png' },
      ]}>Refunds should rate-limit like charges do. Match the headers exactly; the spec and the response partners expect are attached.</You>

      <Step n={1} of={6} label="Triage" model="claude-opus-5" state="done" took="2m" />

      <Turn at="2h 38m ago">
        <WorkedFor took="2m 10s" summary="read 5 files · 1 issue · 1 web page">
          <Reasoning took="14s">
            Charges wrap the handler in withPartnerLimit. Refunds were added later behind their own router and never picked it up. Check whether the spec wants a shared bucket before writing anything.
          </Reasoning>
          <ToolGroup summary="Explored 4 files and ran 2 searches" took="22s">
            <Tool kind="search" verb="Searched" target="withPartnerLimit  src/" meta="6 results" />
            <Tool kind="read" verb="Read" target="src/charges/limit.ts" meta="88 lines" />
            <Tool kind="read" verb="Read" target="src/refunds/router.ts" meta="142 lines" />
          </ToolGroup>
          <McpCall server="Linear" tool="get_issue" args={'"MER-212"'} result={{
            summary: 'MER-212 · In progress',
            fields: [['Title', 'Partner limits for refunds'], ['Asked by', 'Partner success · Acme'], ['Due', '2.14']],
          }} />
          <WebFetch title="RFC 9110 · 10.2.3 Retry-After" url="https://www.rfc-editor.org/rfc/rfc9110#section-10.2.3"
            excerpt="The value of this field can be either an HTTP-date or a number of seconds to delay after receiving the response." />
        </WorkedFor>
        <P>
          Charges apply the limit in <FileRef path="src/charges/limit.ts" line="42" />; the refund router was added after and
          never wrapped. The spec counts refunds and charges against one budget<Cite n="1"><b>rate-limits.md</b> · “Refunds and charges draw on one budget per partner.”</Cite>,
          so I will share the partner’s bucket. Retry-After goes out in seconds, as charges do<Cite n="2"><b>RFC 9110 §10.2.3</b> · seconds or an HTTP-date; charges use seconds.</Cite>.
        </P>
        <Plan steps={[
          { t: 'Find how charges apply the partner limit', state: 'done' },
          { t: 'Wrap the refund router in the same limiter', state: 'queued' },
          { t: 'Test 429 and Retry-After on refunds', state: 'queued' },
          { t: 'Update the API reference', state: 'queued' },
        ]} />
        <Question q="One thing first: should a partner over the limit get the refund queued, or refused?" options={[
          { t: 'Refuse with 429 and Retry-After', n: 'matches charges' },
          { t: 'Queue it and return 202', n: 'conflicts with a canonical entry' },
        ]} />
      </Turn>

      <You at="2h 30m ago">Refuse. Same as charges.</You>

      <Step n={2} of={6} label="Implement" model="claude-opus-5" state="done" took="12m" />

      <Turn at="2h 12m ago">
        <WorkedFor took="12m 40s" summary="3 files edited · 5 commands · 2 sub-agents">
          <Tool kind="edit" verb="Edited" target="src/refunds/router.ts" sheet meta={<><b className="cs-add">+14</b> <b className="cs-del">−3</b></>}><RouterDiff /></Tool>
          <Tool kind="create" verb="Created" target="src/refunds/limit.test.ts" meta={<b className="cs-add">+61</b>} />
          <Tool kind="run" verb="Ran" target="pnpm lint" state="failed" meta="exit 1 · 2 problems" took="4s" copy="pnpm lint">
            <Terminal exit={1} lines={["  14:7  error  'partner' is assigned a value but never used", '✗ 2 problems (2 errors, 0 warnings)']} />
          </Tool>
          <Tool kind="edit" verb="Edited" target="src/refunds/limit.test.ts" meta={<><b className="cs-add">+1</b> <b className="cs-del">−3</b></>} />
          <SubAgents list={[
            { label: 'Edge cases: burst, reset, clock skew', model: 'claude-sonnet-5', state: 'done', meta: '9 tests · 6m', calls: <Tool kind="run" verb="Ran" target="pnpm test refunds/limit" meta="9 passed" took="6s" /> },
            { label: 'API reference for 429 on refunds', model: 'claude-haiku-4-5', state: 'done', meta: '1 file · 4m', calls: <Tool kind="create" verb="Created" target="docs/api/refunds-rate-limits.md" meta={<b className="cs-add">+64</b>} /> },
          ]} />
          <Tool kind="run" verb="Ran" target="pnpm test refunds" meta="47 passed" took="12s" copy="pnpm test refunds">
            <Terminal exit={0} lines={[' Test Files  5 passed (5)', '      Tests  47 passed (47)']} />
          </Tool>
        </WorkedFor>
        <P>Refunds now go through the partner limiter and share its budget. This is the change:</P>
        <CodeBlock file="src/refunds/router.ts" line={18} lang="TypeScript" highlight={[2, 4, 5, 6, 7]} code={`import { idempotent } from '../idempotency'
import { withPartnerLimit } from '../charges/limit'

refunds.post('/', withPartnerLimit(idempotent(createRefund), {
  bucket: 'partner',
  retryAfter: 'seconds',
}))`} />
        <Table head={['Endpoint', 'Budget', 'Window', 'Over the limit']} rows={[
          ['POST /charges', '600', '1 min', '429 · Retry-After'],
          ['POST /refunds', 'shared', '1 min', '429 · Retry-After'],
        ]} />
        <P>47 tests pass, lint is clean. The reference for partners is written:</P>
        <FileArtifact path="docs/api/refunds-rate-limits.md" kind="Markdown" size="2.1 KB" lines={64} doc={refDoc} />
      </Turn>

      <Review n={3} of={6} reviewers={[{ model: 'claude-sonnet-5' }, { model: 'gemini-3-pro' }]} verdict="changes" took="4m 20s" thread={STEPS.review}
        findings={findings.map((f) => (f.id === 'f2' ? { ...f, state: 'aside', reason: SET_ASIDE } : { ...f, state: 'fixed', round: 2 }))} />

      <Turn at="1h 50m ago">
        <WorkedFor took="3m 05s" summary="2 files edited · 1 command" />
        <P>Fixed two of the review’s three findings: the limiter now runs before the idempotency lookup, and the reset test uses fake timers. I set aside the one asking refunds for their own bucket; your spec says one budget per partner.</P>
      </Turn>

      <Step n={3} of={6} label="Review · round 2" model="claude-sonnet-5" state="done" outcome="Passed" took="2m" thread={STEPS.review} />

      <Divider icon="compress" action="Show summary">Earlier turns summarised · 212k → 38k tokens</Divider>

      <SteerLine step={STEPS.security} text="Also check the webhook retry path; it calls the same limiter." at="1h 32m ago" />
      <Steers step="security" />
      <Step n={4} of={6} label="Security review" model="claude-sonnet-5" state="done" outcome="No findings" took="4m" thread={STEPS.security}
        why="Added by your rule: security review on changes that touch money handling."
        detail={<P>Checked the limiter order, what reaches the logs, and the webhook retry path you asked about. Nothing to report.</P>} />
      <Allowed items={ALLOWED} />

      <LimitMoved what="Lead" to="gpt-5.2-codex" runtime="Claude Code" resets="14:00" />

      <Step n={5} of={6} label="Verify on staging" model="gpt-5.2-codex" state="stopped" outcome="stopped after your message" took="2m in" />

      <You at="1h 12m ago">Ops froze staging this morning. Check against yesterday’s refund log locally instead.</You>

      <Turn who="gpt-5.2-codex" at="1h 12m ago">
        <P>Stopped the staging replay; it had only read, so there is nothing to undo there. Replaying the log against the branch locally instead.</P>
        <GraphChanged settled rev={3} by="gpt-5.2-codex" why="after your message about staging"
          summary="Verify on staging replaced by Verify on fixtures"
          nodes={[
            { t: 'Triage', s: 'done' }, { t: 'Implement', s: 'done' }, { t: 'Review', s: 'done' }, { t: 'Security review', s: 'done' },
            { t: 'Verify on staging', s: 'stopped' }, { t: 'Verify on fixtures', s: 'added' }, { t: 'Open PR', s: 'next' },
          ]}
          ops={['Stopped Verify on staging, 2 minutes in. It had only read; nothing to undo.', 'Added Verify on fixtures: replay yesterday’s refund log against the branch locally.', 'Open PR now waits on Verify on fixtures.']} />
      </Turn>

      <Step n={5} of={6} label="Verify on fixtures" model="gpt-5.2-codex" state="done" outcome="1,200 of 1,200 refunds match charges" took="31m" />

      <Turn who="gpt-5.2-codex" at="8m ago">
        <Document {...summaryDoc} />
        <P>To try it against the branch yourself:</P>
        <Snippet cmd="curl -i -X POST localhost:4000/v1/refunds -H 'Partner: acme' -H 'Idempotency-Key: 7f3c9e' -d @fixtures/refund.json" />
      </Turn>

      <Step n={6} of={6} label="Draft PR" model="gpt-5.2-codex" state="running" />

      <You at="6m ago">Looks right. Mark it ready for review once checks pass.</You>

      <Turn who="gpt-5.2-codex" at="now">
        <Plan updated="just now" steps={[
          { t: 'Run the full suite', state: 'running' },
          { t: 'Push ch/431-refund-limits', state: 'queued' },
          { t: 'Open a draft PR, then mark it ready when checks pass', state: 'queued' },
        ]} />
        <Tool kind="run" verb="Running" target="pnpm test" state="running" meta="1m 12s" copy="pnpm test" open>
          <Terminal lines={[' ✓ charges/limit (14)', ' ✓ refunds/router (49)']} live=" ⋯ webhooks/deliver (running 22 of 41)" />
        </Tool>
        <Streaming loop={false} text="Refund tests pass. Running the full suite before I push, since the limiter is shared with charges and a regression there would not show in the refund tests alone." />
      </Turn>

      <You queued>Title it “Rate-limit refunds like charges”.</You>
    </Thread>
  )
}
