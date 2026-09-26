/* Three kinds of task, because they are not the same object.

   A delivery is handed off and comes back as validated work. A session is
   worked through with you, out loud, and most of what it makes is thrown
   away. A question makes nothing at all — and getting that one right is the
   whole point of separating them.

   Task 418 is the same task the shell already shows on its board: the
   branch, the inserted security review and the decision it raised all match
   src/data/project.js, so the two surfaces never disagree. */

/* ---- Shared objects, referenced from thread entries by name ------------*/

export const diff = {
  stat: '4 files · +102 −22',
  files: [
    {
      path: 'src/auth/session.ts', add: 38, del: 12,
      hunks: [
        { at: '@@ -142,10 +142,24 @@ export async function rotateOnPrivilegeChange(', lines: [
          [' ', '  const next = await issueToken(userId, { reason: "privilege-change" })'],
          ['-', '  await store.put(userId, next)'],
          ['-', '  return next'],
          ['+', '  // The cached principal outlives the token it was derived from, so it'],
          ['+', '  // has to be dropped in the same write as the rotation.'],
          ['+', '  await store.transaction(async (tx) => {'],
          ['+', '    await tx.put(userId, next)'],
          ['+', '    await principalCache.invalidate(userId)'],
          ['+', '  })'],
          ['+', '  return next'],
        ] },
        { at: '@@ -188,6 +202,14 @@ function refreshWindow(config: AuthConfig) {', lines: [
          ['-', '  return config.refreshWindowSeconds'],
          ['+', '  const window = config.refreshWindowSeconds'],
          ['+', '  if (!Number.isFinite(window) || window <= 0) {'],
          ['+', '    throw new ConfigError("refreshWindowSeconds must be a positive number")'],
          ['+', '  }'],
          ['+', '  return window'],
        ] },
      ],
    },
    {
      path: 'src/auth/principal-cache.ts', add: 21, del: 4,
      hunks: [
        { at: '@@ -31,6 +31,23 @@ export class PrincipalCache {', lines: [
          [' ', '  async invalidate(userId: string) {'],
          ['-', '    this.entries.delete(userId)'],
          ['+', '    this.entries.delete(userId)'],
          ['+', '    await this.replicas.publish({ type: "invalidate", userId })'],
          [' ', '  }'],
        ] },
      ],
    },
    { path: 'src/middleware/require-auth.ts', add: 9, del: 6, hunks: [] },
    { path: 'test/auth/rotation.test.ts', add: 34, del: 0, hunks: [] },
  ],
}

export const findings = [
  { id: 'f1', severity: 'high', title: 'Cached principal survives rotation',
    body: 'require-auth reads principalCache before the rotation hook clears it, so a demoted session keeps its old role for the length of the refresh window.',
    state: 'Resolved in repair' },
  { id: 'f2', severity: 'medium', title: 'Refresh window is read but never validated',
    body: 'A zero or negative refreshWindowSeconds disables rotation silently rather than failing at startup.',
    state: 'Resolved in repair' },
  { id: 'f3', severity: 'low', title: 'No test covers two refreshes racing',
    body: 'Concurrent privilege changes on one session are untested. The fix is a transaction, so the case is worth pinning.',
    state: 'Resolved in repair · test added' },
]

/* The decision task 418 is holding. Identical copy to the shell's a1. */
export const decision = {
  weight: 'blocking',
  kind: 'Decision',
  title: 'Review API fallback decision',
  raisedBy: 'Repair · task 418',
  raisedAt: '18 min ago',
  detail: 'When the upstream rate limiter returns 429 during a refund retry, the repair step found no existing convention for whether the refund should queue or fail visibly to the caller.',
  options: [
    { id: 'o1', label: 'Queue and retry with backoff',
      note: 'Caller sees pending. Matches webhook retry behaviour. Delays the failure signal by up to 40s.' },
    { id: 'o2', label: 'Fail fast to the caller',
      note: 'Caller handles retry. Consistent with the rest of the refunds API. Increases visible error rate.' },
  ],
  evidence: [
    '3 call sites affected — refunds, disputes, partial capture',
    'No canonical knowledge covers 429 handling for write paths',
    'Task 402 chose fail-fast for reads, February',
  ],
  after: 'Repair resumed with this as the reason. Written to project knowledge.',
}

/* The choice a session is holding. Also blocking: the session stops. */
export const choice = {
  weight: 'blocking',
  kind: 'Decision',
  title: 'Two shapes both hold. Pick the one to take forward',
  raisedBy: 'Session · task 424',
  raisedAt: '24 min ago',
  detail: 'Sharding by tenant and sharding by consistent hash both clear peak load in the replay. The difference is operational, not technical, so it is yours.',
  options: [
    { id: 'o1', label: 'Shape B — shard by tenant, with a spill queue',
      note: 'Simple to reason about and to page on. One noisy tenant can still fill its own shard, and the spill queue is extra surface.' },
    { id: 'o2', label: 'Shape C — consistent hashing with rebalancing',
      note: 'Even under the worst traffic in the replay. Rebalancing is a moving part nobody can watch directly.' },
  ],
  evidence: [
    'Replayed 6 hours of yesterday’s peak against all three shapes',
    'One destination took 61% of throughput in that window',
    'Shape A discarded: hot shards reappear within the hour',
  ],
  after: 'Shape B is now the one being taken forward. The other two branches are gone; the reasoning stays.',
}

/* What a question asks for. Deliberately NOT blocking, and so not brass:
   nothing is stopped while you ignore it. */
export const offer = {
  weight: 'offer',
  title: 'None of this is written down',
  detail: 'I worked the answer out from two canonical entries and a decision on task 402. The next worker will have to work it out again unless it is retained.',
  options: [
    { id: 'o1', label: 'Keep it as canonical', note: 'Supplied to every task touching a write path. Task 425 recorded as provenance.' },
    { id: 'o2', label: 'Leave it', note: 'Nothing is written. The answer stays in this task only.' },
  ],
  after: 'Written as canonical. Task 425 is its provenance.',
}

export const artifacts = {
  review: { t: 'Token refresh — review findings', kind: 'Review', meta: '3 findings · written by gpt-5.2' },
  note: { t: 'Webhook queue sharding — what held and what did not', kind: 'Note', meta: 'three shapes · written from the session' },
}

/* What the delivery hands back: a change set. Here it spans two
   repositories, so it is two pull requests with an order between them —
   never one atomic merge. Charrette opens each as a draft once its branch
   has a first commit (a project setting; the default is to ask). The graph's
   own steps are the change set's checks; each PR keeps its own CI. */
export const changeSet = {
  base: 'main',
  prs: [
    { id: 'p1', repo: 'stripe-internal/meridian-api', number: 1187,
      url: 'https://github.com/stripe-internal/meridian-api/pull/1187',
      files: ['src/auth/session.ts', 'src/auth/principal-cache.ts', 'test/auth/rotation.test.ts'],
      ci: '214 passed' },
    { id: 'p2', repo: 'stripe-internal/meridian-web', number: 412,
      url: 'https://github.com/stripe-internal/meridian-web/pull/412',
      files: ['src/middleware/require-auth.ts'],
      after: 'p1', why: 'calls invalidate() from the API change',
      ci: '38 passed' },
  ],
  states: {
    running: {
      status: 'draft', label: 'Draft', note: 'Opens for review when verify passes', commits: 9,
      checks: [
        { id: 'c1', name: 'Unit', detail: '214 passed', state: 'pass' },
        { id: 'c2', name: 'Code review', model: 'gpt-5.2', detail: '3 findings, 3 resolved', state: 'pass' },
        { id: 'c3', name: 'Security review', model: 'gpt-5.2', detail: 'reading the diff · 6m', state: 'running', added: true },
        { id: 'c4', name: 'Integration', detail: 'after security review', state: 'queued' },
      ],
    },
    needs: {
      status: 'draft', label: 'Draft', note: 'Held at repair until you decide the fallback', commits: 6,
      checks: [
        { id: 'c1', name: 'Unit', detail: '209 passed', state: 'pass' },
        { id: 'c2', name: 'Code review', model: 'gpt-5.2', detail: '3 findings · repair held on your call', state: 'held' },
        { id: 'c4', name: 'Integration', detail: 'after repair', state: 'queued' },
      ],
    },
    ready: {
      status: 'open', label: 'Ready', note: 'Every check passed · nothing merges until you accept', commits: 11,
      checks: [
        { id: 'c1', name: 'Unit', detail: '216 passed', state: 'pass' },
        { id: 'c2', name: 'Code review', model: 'gpt-5.2', detail: '2 cycles · clean on the second', state: 'pass' },
        { id: 'c3', name: 'Security review', model: 'gpt-5.2', detail: 'no findings', state: 'pass', added: true },
        { id: 'c4', name: 'Integration', detail: '38 passed, across both repositories', state: 'pass' },
      ],
    },
    settled: {
      status: 'merged', label: 'Merged', note: 'Accepted by you · merged in order · 3h ago', commits: 11,
      checks: [
        { id: 'c1', name: 'Unit', detail: '216 passed', state: 'pass' },
        { id: 'c2', name: 'Code review', model: 'gpt-5.2', detail: '2 cycles · clean on the second', state: 'pass' },
        { id: 'c3', name: 'Security review', model: 'gpt-5.2', detail: 'no findings', state: 'pass', added: true },
        { id: 'c4', name: 'Integration', detail: '38 passed, across both repositories', state: 'pass' },
      ],
    },
  },
}

export const spikes = [
  { id: 'sp1', label: 'Shape A — shard by destination host', branch: 'spike/424-by-host',
    verdict: 'Discarded', why: 'Hot shards reappear within the hour. One destination is 61% of throughput.' },
  { id: 'sp2', label: 'Shape B — shard by tenant, with a spill queue', branch: 'spike/424-by-tenant',
    verdict: 'Holds', why: 'Clears peak in the replay. Simple to page on. The spill queue is extra surface.' },
  { id: 'sp3', label: 'Shape C — consistent hashing with rebalancing', branch: 'spike/424-hashring',
    verdict: 'Running', why: 'Even under the worst window so far. Rebalancing is a moving part nobody watches.' },
]

export const used = [
  { id: 'u1', t: 'Session tokens rotate on privilege change', meta: 'Canonical · Architecture · 14 Jan' },
  { id: 'u2', t: 'Middleware may not perform I/O', meta: 'Canonical · Convention · 9 Jan' },
  { id: 'u3', t: 'Security review on changes to authentication files', meta: 'Rule · 4 Feb' },
]

export const produced = [
  { id: 'p1', t: 'Observed token refresh window is 5 minutes in prod', meta: 'Episodic · retained from verify',
    flag: 'Disagrees with the canonical 15 minute entry from January.' },
  { id: 'p2', t: 'Principal cache must be invalidated inside the rotation write', meta: 'Episodic · proposed as canonical' },
]

export const sessionKnowledge = [
  { id: 'sk1', t: 'One destination is 61% of webhook throughput at peak', meta: 'Episodic · measured in the session' },
  { id: 'sk2', t: 'Hot shards reappear within an hour of host-based sharding', meta: 'Episodic · why Shape A was discarded' },
]

export const answerKnowledge = [
  { id: 'ak1', t: 'Write paths fail fast; delivery paths retry', meta: 'Proposed as canonical · from task 425' },
]

export const rulesFired = [
  { id: 'g1', when: 'authentication or session files change',
    then: 'add a security review before verification', at: 'fired 6m ago · inserted step 5' },
  { id: 'g5', when: 'no convention covers a product behaviour',
    then: 'stop and ask the human', at: 'fired 18m ago · raised the decision' },
]

/* ---- The graph, for the tasks that have one --------------------------- */
const deliveryGraph = [
  { id: 'n1', col: 1, label: 'Requirements', worker: 'coordinator', took: '3m',
    what: 'Refined your ask against project knowledge before any code was written.' },
  { id: 'n2', col: 2, from: ['n1'], label: 'Implement', worker: 'claude-opus-5', took: '22m',
    what: 'Cleared the cached principal on rotation and validated the refresh window.',
    out: 'diff',
    sub: [
      { id: 'n2a', label: 'session.ts', took: '9m' },
      { id: 'n2b', label: 'principal-cache.ts', took: '7m' },
      { id: 'n2c', label: 'rotation.test.ts', took: '11m' },
    ] },
  { id: 'n3', col: 3, from: ['n2'], label: 'Review', worker: 'gpt-5.2', took: '6m',
    what: 'Returned three findings on the diff.',
    out: 'findings' },
  { id: 'n4', col: 4, from: ['n3'], label: 'Repair', worker: 'claude-opus-5', took: '14m',
    what: 'Resolved three of three, then sent the change back for a second review.',
    loop: 'n3', loopNote: 're-review · 2 of 2 allowed' },
  { id: 'n5', col: 5, from: ['n4'], label: 'Security review', worker: 'gpt-5.2', took: '6m',
    what: 'Authentication files changed, so a rule from 4 February inserted this step.',
    byRule: 'g1' },
  { id: 'n6', col: 6, from: ['n5'], label: 'Verify', worker: 'gpt-5.2', took: '4m',
    what: 'Unit and integration, against the tests written in the implement step.' },
  { id: 'n7', col: 7, from: ['n6'], label: 'Evidence', worker: 'coordinator', took: '2m',
    what: 'Retains what was learned so the next task does not rediscover it.' },
]

/* A session fans out instead of running down a line. */
const sessionGraph = [
  { id: 'm1', col: 1, row: 1, label: 'Frame', worker: 'coordinator', took: '4m',
    what: 'Turned the ask into three shapes worth trying, from the traffic you already have.' },
  { id: 'm2', col: 2, row: 0, from: ['m1'], label: 'Spike A', worker: 'claude-opus-5', took: '38m',
    what: 'Shard by destination host. Discarded: hot shards reappear within the hour.' },
  { id: 'm3', col: 2, row: 1, from: ['m1'], label: 'Spike B', worker: 'claude-opus-5', took: '51m',
    what: 'Shard by tenant with a spill queue. Holds under the replay.' },
  { id: 'm4', col: 2, row: 2, from: ['m1'], label: 'Spike C', worker: 'gpt-5.2', took: '1h 04m',
    what: 'Consistent hashing with rebalancing. Still running against the worst window.' },
  { id: 'm5', col: 3, row: 1, from: ['m2', 'm3', 'm4'], label: 'Replay', worker: 'claude-opus-5', took: '12m',
    what: 'Six hours of yesterday’s peak, run against every shape that survived.' },
  { id: 'm6', col: 4, row: 1, from: ['m5'], label: 'Note', worker: 'claude-opus-5', took: '6m',
    what: 'Writes down what held and what did not, so the next attempt starts further on.' },
]

/* ---- The three tasks ---------------------------------------------------*/
export const tasks = [
  {
    id: 'delivery', label: 'Delivery', ref: '418',
    title: 'Repair token refresh on privilege change',
    because: 'A demoted session kept its old permissions until the token expired: the principal cache was read before the rotation hook cleared it.',
    worker: 'claude-opus-5', branch: 'ch/418-token-refresh',
    graph: deliveryGraph, faces: ['talk', 'out'],
    states: {
      running: {
        id: 'running', chrome: 'Security review', elapsed: '2h 14m', cost: '$4.10', since: 'security review · 6m',
        face: 'talk', done: ['n1', 'n2', 'n3', 'n4'], active: 'n5',
        line: 'Five of seven steps. Nothing needs you.',
        close: 'The security review is reading the diff now. Nothing here needs you.',
        outputsNote: 'Under security review. The diff can still change before it is offered to you.',
      },
      needs: {
        id: 'needs', chrome: 'Waiting on a decision', elapsed: '1h 52m', cost: '$3.20', since: 'held · 18m',
        face: 'talk', done: ['n1', 'n2', 'n3'], held: 'n4',
        line: 'Repair stopped on purpose. It will not choose product semantics.',
        close: 'Nothing else is moving on this branch until the fallback is decided.',
        /* Answering releases the step it was holding: the screen has to say so
           rather than keep showing you a question you already answered. */
        releasedChrome: 'Repair resumed',
        released: 'Repair picked it up again the moment you answered. Nothing else on the branch changed while it waited.',
        outputsNote: 'The branch is held where repair stopped. Nothing further has been written.',
      },
      /* Verified and waiting for you. Nothing merges until you accept it. */
      ready: {
        id: 'ready', chrome: 'Ready for you', elapsed: '3h 12m', cost: '$5.90', since: 'verified · 4m ago',
        face: 'out', done: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'],
        line: 'Verified. Waiting for you to accept it.',
        close: 'Nothing merges until you accept it. Send it back with a note and repair picks it up again.',
      },
      settled: {
        id: 'settled', chrome: 'Merged', elapsed: '3h 41m total', cost: '$6.85', since: 'merged 3h ago',
        face: 'out', done: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'],
        line: 'Merged. Two review cycles, one repair, evidence retained.',
        close: 'Merged as PR 1187 after a second review came back clean. Everything it learned is in project knowledge.',
        outcome: { verdict: 'Merged', pr: 'PR 1187', meta: '2 review cycles · 1 repair · evidence retained' },
      },
    },
  },
  {
    id: 'session', label: 'Session', ref: '424',
    title: 'Find a shape for webhook queue sharding',
    because: 'Webhook delivery falls behind at peak. Nothing here is meant to reach main until one shape is chosen.',
    worker: 'claude-opus-5', branch: null,
    graph: sessionGraph, faces: ['talk', 'out'],
    states: {
      running: {
        id: 'running', chrome: 'Spike C running', elapsed: '1d 4h', cost: '$11.40', since: 'spike C · 22m',
        face: 'talk', done: ['m1', 'm2', 'm3'], active: 'm4',
        line: 'Two shapes tried, one running. Nothing needs you.',
        close: 'Shape C is still replaying. I will bring you all three together rather than one at a time.',
        outputsNote: 'Nothing has left the session. Three spike branches, one of them still moving.',
      },
      needs: {
        id: 'needs', chrome: 'Waiting on you', elapsed: '1d 6h', cost: '$12.05', since: 'held · 24m',
        face: 'talk', done: ['m1', 'm2', 'm3', 'm4'], held: 'm5',
        line: 'Two shapes both hold. The difference is operational, not technical.',
        close: 'I can carry either one forward, but which one we live with is not mine to choose.',
        releasedChrome: 'Taking it forward',
        released: 'That is the one I will take forward. The other branches go; what they taught us stays.',
        outputsNote: 'Two spikes hold, one is discarded. Nothing is merged and nothing will be until you choose.',
      },
      settled: {
        id: 'settled', chrome: 'Closed', elapsed: '1d 9h total', cost: '$13.30', since: 'closed 2h ago',
        face: 'talk', done: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
        line: 'Shape B taken forward. Two branches discarded, reasoning retained.',
        close: 'The branches are gone. What we learned from them is not, and task 426 starts from it.',
        outcome: { verdict: 'Closed', pr: 'Shape B', meta: '3 spikes · 2 discarded · 1 note retained' },
      },
    },
  },
  {
    id: 'question', label: 'Question', ref: '425',
    title: 'Why do refunds fail fast when webhooks retry?',
    because: 'Asked in the conversation. It touches no code and opens no branch.',
    worker: 'claude-sonnet-5', branch: null,
    graph: null, faces: ['talk'],
    states: {
      running: {
        id: 'running', chrome: 'Reading', elapsed: '9s', cost: '$0.02', since: 'reading · now',
        face: 'talk',
        line: 'Reading 2 canonical entries and 9 tasks.',
        close: 'This is the whole task. It will be over before you have finished reading this sentence.',
      },
      needs: {
        id: 'needs', chrome: 'Answered', elapsed: '40s', cost: '$0.08', since: 'answered · 11m ago',
        face: 'talk',
        line: 'Answered. It is asking whether to keep the reasoning, which stops nothing.',
        close: 'Ignore this and nothing breaks. The answer stays on the task either way.',
        released: 'Recorded. The next task touching a write path is told this without having to ask.',
      },
      settled: {
        id: 'settled', chrome: 'Answered', elapsed: '40s total', cost: '$0.08', since: 'answered 11m ago',
        face: 'talk',
        line: 'Answered, and the reasoning was kept as canonical.',
        close: 'The next task touching a write path is told this without having to ask.',
        outcome: { verdict: 'Answered', pr: 'Canonical', meta: 'nothing built · 1 entry retained' },
      },
    },
  },
]

/* A task is opened by reference from the board or the conversation. */
export function taskFor(ref) {
  return tasks.find((t) => t.ref === ref) || null
}
