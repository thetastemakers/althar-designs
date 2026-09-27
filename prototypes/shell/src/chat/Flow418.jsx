import { Thread } from '@charrette/ui'
import { P, Question, Step, SubAgents, Terminal, Tool, Turn, WorkedFor, You } from './parts.jsx'
import { GraphChanged, LeadLine, Review } from './steps.jsx'

/* Task 418, told with the chat primitives. The shell has it in four states
   (running, needs, ready, settled); the head of the thread is the same in
   each, and the tail is where they part. It matches the board and the
   coordinator: the rule-added security review, the held repair, PR 1187. */

const FINDINGS = [
  { id: 't1', sev: 'high', at: 'src/auth/principal-cache.ts:31', by: ['gpt-5.2'],
    claim: 'The cached principal survives rotation, so a demoted session keeps its old role until the cache entry expires.' },
  { id: 't2', sev: 'medium', at: 'src/auth/session.ts:148', by: ['gpt-5.2'],
    claim: 'The refresh window is read from config but never validated; a zero or negative value turns refresh off.' },
  { id: 't3', sev: 'low', at: 'test/auth/rotation.test.ts', by: ['gpt-5.2'],
    claim: 'No test covers two refreshes racing on the same session.' },
]

const OF = 7

export default function Flow418({ state = 'running' }) {
  const held = state === 'needs'
  return (
    <Thread label="Task thread" className="cs-flow">
      <p className="tv-lede">A demoted session kept its old permissions until the token expired: the principal cache was read before the rotation hook cleared it.</p>

      <You at="2 days ago">Sessions keep their old permissions after a privilege change until the token expires. Fix it; this is the one that matters for 2.14.</You>

      <LeadLine model="claude-opus-5" why="the auth path; three entries from project knowledge attached" />

      <Step n={1} of={OF} label="Requirements" state="done" outcome="refined by the coordinator" took="3m" />
      <Step n={2} of={OF} label="Implement" model="claude-opus-5" state="done" took="22m" />

      <Turn at="2h ago">
        <WorkedFor took="22m 10s" summary="4 files edited · 3 sub-agents">
          <SubAgents list={[
            { label: 'Clear the principal on rotation', model: 'claude-sonnet-5', state: 'done', meta: 'session.ts · 9m',
              calls: <Tool kind="edit" verb="Edited" target="src/auth/session.ts" meta={<><b className="cs-add">+38</b> <b className="cs-del">−9</b></>} /> },
            { label: 'Invalidate the principal cache', model: 'claude-sonnet-5', state: 'done', meta: 'principal-cache.ts · 7m',
              calls: <Tool kind="edit" verb="Edited" target="src/auth/principal-cache.ts" meta={<><b className="cs-add">+17</b> <b className="cs-del">−4</b></>} /> },
            { label: 'Tests for rotation', model: 'claude-haiku-4-5', state: 'done', meta: 'rotation.test.ts · 11m',
              calls: <Tool kind="create" verb="Created" target="test/auth/rotation.test.ts" meta={<b className="cs-add">+47</b>} /> },
          ]} />
          <Tool kind="run" verb="Ran" target="pnpm test auth" meta="214 passed" took="18s" copy="pnpm test auth">
            <Terminal exit={0} lines={[' Test Files  31 passed (31)', '      Tests  214 passed (214)']} />
          </Tool>
        </WorkedFor>
        <P>Implement is done. A rotation now clears the cached principal before anything reads it, and the refresh window is checked on every refresh. Two sub-agents took the fix and one wrote the tests.</P>
      </Turn>

      <Review n={3} of={OF} reviewers={[{ model: 'gpt-5.2' }]} verdict="changes" took="6m"
        findings={held
          ? [{ ...FINDINGS[0], state: 'fixed' }, { ...FINDINGS[1], state: 'fixed' },
              { ...FINDINGS[2], state: 'open', claim: 'The rotation hook retries in-flight refund calls, and nothing handles a 429 from the rate limiter there.' }]
          : FINDINGS.map((f) => ({ ...f, state: 'fixed' }))} />

      {held ? (
        <>
          <Step n={4} of={OF} label="Repair" model="claude-opus-5" state="stopped" outcome="held on a product call" took="18m" />
          <Turn at="18m ago">
            <WorkedFor took="14m" summary="2 files edited · 2 commands" />
            <P>Fixed the first two. The third led somewhere else: the rotation hook retries in-flight refund calls, and nothing in the project says what a 429 from the rate limiter should do there. Both answers are defensible and this is a product call, so repair is held and nothing else moves on the branch.</P>
            <Question q="When the rate limiter returns 429 during a refund retry, should the refund queue or fail?" options={[
              { t: 'Queue and retry with backoff', n: 'matches webhook retries · up to 40s later' },
              { t: 'Fail fast to the caller', n: 'matches the rest of the refunds API' },
            ]} />
            <P>Task 402 chose fail-fast for reads in February. Three call sites are affected: refunds, disputes, partial capture. Task 422 waits on this too.</P>
          </Turn>
        </>
      ) : (
        <>
          <Turn at="1h 40m ago">
            <WorkedFor took="14m" summary="3 files edited · 2 commands" />
            <P>Fixed all three. The second review came back clean.</P>
          </Turn>
          <Step n={4} of={OF} label="Repair" model="claude-opus-5" state="done" outcome="3 of 3 resolved" took="14m" />
          <GraphChanged settled rev={2} rule="a security review whenever authentication files change"
            summary="Security review added before Verify"
            nodes={[
              { t: 'Requirements', s: 'done' }, { t: 'Implement', s: 'done' }, { t: 'Review', s: 'done' }, { t: 'Repair', s: 'done' },
              { t: 'Security review', s: 'added' }, { t: 'Verify', s: 'next' }, { t: 'Evidence', s: 'next' },
            ]}
            ops={['Added Security review after Repair, because src/auth/ changed', 'Verify now waits for it']} />
        </>
      )}

      {state === 'running' && (
        <Step n={5} of={OF} label="Security review" model="gpt-5.2" state="running" why="rule" />
      )}

      {(state === 'ready' || state === 'settled') && (
        <>
          <Step n={5} of={OF} label="Security review" model="gpt-5.2" state="done" outcome="No findings" took="6m" why="rule" />
          <Step n={6} of={OF} label="Verify" model="gpt-5.2" state="done" outcome="216 unit · 38 integration" took="4m" />
          <Turn at={state === 'ready' ? '4m ago' : '3h 20m ago'}>
            <P>Security review and integration are clean, so it’s ready for you. It’s two pull requests: the API one merges first, because the web middleware calls what it adds. Both are in Outputs.</P>
          </Turn>
        </>
      )}

      {state === 'settled' && (
        <>
          <You at="3h 10m ago">Accept both.</You>
          <Step n={7} of={OF} label="Evidence" state="done" outcome="3 entries kept" took="2m" />
          <Turn at="3h ago">
            <P>Merged as PR 1187, then meridian-web 412. What this task learned is in project knowledge, including the observed 5 minute refresh window.</P>
          </Turn>
        </>
      )}
    </Thread>
  )
}
