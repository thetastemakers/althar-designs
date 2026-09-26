/* Seed data for the Charrette shell.
   Every string here is written as operational interface language: what the
   system would actually say about itself, never what marketing would say. */

export const projects = [
  { id: 'meridian', name: 'Meridian',  repo: 'stripe-internal/meridian-web', repos: 'meridian-api · meridian-web', desc: 'Billing and payments surface',
    active: 4, needsYou: 4, lastTouched: 'now' },
  { id: 'halyard',  name: 'Halyard',   repo: 'stripe-internal/halyard-api',  desc: 'Internal API gateway',
    active: 1, needsYou: 0, lastTouched: '2h ago' },
  { id: 'tessera',  name: 'Tessera',   repo: 'stripe-internal/tessera-ds',   desc: 'Design system',
    active: 0, needsYou: 1, lastTouched: 'yesterday' },
  { id: 'ferrous',  name: 'Ferrous',   repo: 'stripe-internal/ferrous-ingest', desc: 'Event ingestion',
    active: 0, needsYou: 0, lastTouched: '11 days ago' },
]

/* ---- What genuinely needs a human ---------------------------------------
   Each of these exists because execution reached a boundary it must not
   cross alone: a product choice, an irreversible action, a contradiction. */
export const attention = [
  {
    id: 'a1',
    kind: 'Decision',
    title: 'Review API fallback decision',
    raisedBy: 'Repair · task 418',
    raisedAt: '18 min ago',
    because: 'Two defensible behaviours. The coordinator will not choose product semantics.',
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
    blocking: 'task 422',
    holds: ['422'],
  },
  /* Finished and verified. Accepting it is the one step no rule takes for you. */
  {
    id: 'a4',
    kind: 'Review',
    title: 'Return 409 when a refund idempotency key is reused',
    raisedBy: 'Verify · task 416',
    raisedAt: '9 min ago',
    because: 'Every check passed. Nothing merges until you accept it.',
    pr: {
      repo: 'stripe-internal/meridian-api', number: 1191, branch: 'ch/416-idem-409',
      add: 48, del: 9, files: [
        { path: 'src/refunds/create.ts', add: 21, del: 7 },
        { path: 'src/refunds/idempotency.ts', add: 9, del: 2 },
        { path: 'test/refunds/idempotency.test.ts', add: 18, del: 0 },
      ],
      writer: 'gpt-5.2-codex', reviewer: 'claude-opus-5',
      checks: [
        { name: 'Unit', detail: '88 passed' },
        { name: 'Code review', detail: '1 finding, resolved' },
        { name: 'Integration', detail: '12 passed' },
      ],
    },
    blocking: null,
  },
  {
    id: 'a2',
    kind: 'Approval',
    title: 'Approve dropping legacy_session table',
    raisedBy: 'Verify · task 421',
    raisedAt: '1h ago',
    because: 'Irreversible action. Policy requires approval before destructive migrations.',
    detail: 'Migration 0094 removes legacy_session after the token rotation work. Verification confirms zero reads in 30 days, but the step cannot be undone without a restore.',
    options: [
      { id: 'o1', label: 'Approve the migration', note: 'Runs on the next deploy. Restore path is a 40 minute point-in-time recovery.' },
      { id: 'o2', label: 'Hold and keep the table', note: 'Task completes without the drop. Leaves a follow-up in the project.' },
    ],
    evidence: [
      'Zero reads observed in 30 days of query logs',
      '2 services still hold the model definition — both unused paths',
      'Backfill to the new table verified against 1.2M rows',
    ],
    blocking: 'task 421',
    holds: ['421'],
  },
  {
    id: 'a3',
    kind: 'Contradiction',
    title: 'Two knowledge entries disagree on the token refresh window',
    raisedBy: 'Project knowledge',
    raisedAt: '2h ago',
    because: 'Future workers will receive conflicting context until this is resolved.',
    detail: 'A canonical entry from January states the refresh window is 15 minutes. An episodic finding from task 418 read 5 minutes out of production configuration two hours ago.',
    options: [
      { id: 'o1', label: 'Promote the observed value', note: 'Replaces the January entry. Records task 418 as provenance.' },
      { id: 'o2', label: 'Keep both, scope by environment', note: 'Staging 15 min, production 5 min. Both entries retained with conditions.' },
    ],
    evidence: [
      'Canonical · "Sessions refresh on a 15 minute window" · 14 Jan · from architecture review',
      'Episodic · "Observed refresh window is 5 minutes in prod config" · task 418 · 2h ago',
      '4 tasks have received the January entry as context since it was written',
    ],
    blocking: null,
  },
]

/* ---- Active execution ---------------------------------------------------*/
export const execution = [
  {
    id: 't418',
    ref: '418',
    kind: 'Delivery',
    title: 'Repair token refresh on privilege change',
    state: 'running',
    stateLabel: 'Security review',
    worker: 'claude-opus-5',
    elapsed: '6m',
    branch: 'ch/418-token-refresh',
    note: 'Security review was added after the graph touched authentication files.',
    graph: [
      { id: 'n1', label: 'Requirements',    state: 'done',    meta: 'refined by coordinator' },
      { id: 'n2', label: 'Implement',       state: 'done',    meta: '7 files · claude-opus-5' },
      { id: 'n3', label: 'Review',          state: 'done',    meta: '3 findings · gpt-5.2' },
      { id: 'n4', label: 'Repair',          state: 'done',    meta: '3 of 3 resolved' },
      { id: 'n5', label: 'Security review', state: 'running', meta: 'added after auth files changed', added: true },
      { id: 'n6', label: 'Verify',          state: 'queued',  meta: 'unit + integration' },
      { id: 'n7', label: 'Evidence',        state: 'queued',  meta: '' },
    ],
  },
  {
    id: 't419',
    ref: '419',
    kind: 'Delivery',
    title: 'Migrate billing webhooks to the v2 endpoint',
    state: 'running',
    stateLabel: 'Implement',
    worker: 'claude-opus-5',
    elapsed: '22m',
    branch: 'ch/419-webhooks-v2',
    note: null,
    graph: [
      { id: 'n1', label: 'Requirements', state: 'done',    meta: 'from migration plan' },
      { id: 'n2', label: 'Implement',    state: 'running', meta: '11 files touched' },
      { id: 'n3', label: 'Review',       state: 'queued',  meta: '' },
      { id: 'n4', label: 'Verify',       state: 'queued',  meta: '' },
    ],
  },
  {
    id: 't420',
    ref: '420',
    kind: 'Delivery',
    title: 'Investigate intermittent checkout timeout',
    state: 'running',
    stateLabel: 'Investigating',
    worker: 'gpt-5.2',
    elapsed: '41m',
    branch: null,
    note: 'Produces findings, not code.',
    graph: [
      { id: 'n1', label: 'Scope',      state: 'done',    meta: 'last 14 days of traces' },
      { id: 'n2', label: 'Investigate',state: 'running', meta: '6 findings so far' },
      { id: 'n3', label: 'Synthesise', state: 'queued',  meta: '' },
    ],
  },
  {
    id: 't424',
    ref: '424',
    kind: 'Session',
    title: 'Find a shape for webhook queue sharding',
    state: 'running',
    stateLabel: 'Spike C',
    worker: 'claude-opus-5',
    elapsed: '22m',
    branch: null,
    note: 'Three throwaway branches. Nothing here is meant to reach main until one shape is chosen.',
    graph: [
      { id: 'm1', label: 'Frame',   state: 'done',    meta: 'three shapes worth trying' },
      { id: 'm2', label: 'Spike A', state: 'done',    meta: 'discarded · hot shards return' },
      { id: 'm3', label: 'Spike B', state: 'done',    meta: 'holds under the replay' },
      { id: 'm4', label: 'Spike C', state: 'running', meta: 'gpt-5.2 · worst window so far' },
      { id: 'm5', label: 'Replay',  state: 'queued',  meta: '' },
      { id: 'm6', label: 'Note',    state: 'queued',  meta: '' },
    ],
  },
  {
    id: 't418b',
    ref: '422',
    kind: 'Delivery',
    title: 'Extract rate-limit policy into a shared module',
    state: 'blocked',
    stateLabel: 'Waiting on decision',
    worker: null,
    elapsed: '18m',
    branch: null,
    note: 'Held until the API fallback decision is made.',
    waitsOn: 'a1',
    graph: [
      { id: 'n1', label: 'Requirements', state: 'blocked', meta: 'depends on fallback decision' },
      { id: 'n2', label: 'Implement',    state: 'queued',  meta: '' },
      { id: 'n3', label: 'Review',       state: 'queued',  meta: '' },
    ],
  },
  /* Planned, not started. A task waits on another task, on the project's
     own worker limit, or on you — and says which. */
  {
    id: 't429',
    ref: '429',
    kind: 'Delivery',
    title: 'Sign webhook v2 payloads with rotating keys',
    state: 'queued',
    worker: null,
    elapsed: 'queued 40m',
    branch: null,
    after: '419',
    reason: 'Starts when 419 merges',
    note: 'Planned from the 2.14 intent. Waits for webhook v2 so the two never touch the same handler at once.',
  },
  {
    id: 't427',
    ref: '427',
    kind: 'Delivery',
    title: 'Backfill idempotency keys on refunds created before PR 1184',
    state: 'queued',
    worker: null,
    elapsed: 'queued 2h',
    branch: null,
    reason: 'Next up · 4 of 4 workers busy',
    note: 'Follow-up retained when 414 settled. Runs as soon as a worker is free.',
  },
  {
    id: 't428',
    ref: '428',
    kind: 'Question',
    title: 'Which partners still call the v1 webhook endpoint?',
    state: 'queued',
    worker: null,
    elapsed: 'queued 3h',
    branch: null,
    reason: 'After 427',
    note: 'Asked in the conversation this morning. Answered from traffic, nothing built.',
  },
]

/* ---- Settled recently ---------------------------------------------------*/
export const settled = [
  { id: 's0', ref: '425', kind: 'Question', title: 'Why do refunds fail fast when webhooks retry?',
    outcome: 'Answered', meta: 'Nothing built · 1 entry proposed', when: '11m ago', view: 'needs' },
  { id: 's1', ref: '414', kind: 'Delivery', title: 'Add idempotency keys to the refund endpoint',
    outcome: 'Merged', meta: 'PR 1184 · 2 review cycles · evidence retained', when: '3h ago' },
  { id: 's2', ref: '411', kind: 'Delivery', title: 'Audit third-party script loading',
    outcome: 'Artifact', meta: 'No code changed · 9 findings', when: 'yesterday' },
  { id: 's3', ref: '409', kind: 'Session', title: 'Reduce cold start on the checkout worker',
    outcome: 'Abandoned', meta: 'Approach did not hold · reasoning retained', when: '2 days ago' },
  { id: 's4', ref: '407', kind: 'Delivery', title: 'Document the webhook retry contract',
    outcome: 'Knowledge', meta: 'Promoted to canonical', when: '3 days ago' },
]

/* ---- Knowledge ----------------------------------------------------------*/
export const knowledge = {
  canonical: [
    { id: 'k1', t: 'Webhook deliveries must remain idempotent', meta: 'Decision · 4 Mar · task 407', used: 'used by 9 tasks' },
    { id: 'k2', t: 'All money values are integer minor units', meta: 'Convention · 12 Jan', used: 'used by 24 tasks' },
    { id: 'k3', t: 'Session tokens rotate on privilege change', meta: 'Architecture · 14 Jan', used: 'used by 6 tasks', flagged: true },
    { id: 'k4', t: 'We do not rely on ORM-level cascades', meta: 'Convention · 2 Feb', used: 'used by 11 tasks' },
    { id: 'k5', t: 'Refund writes are fail-fast, not queued', meta: 'Decision · pending this session', used: 'proposed', pending: true },
  ],
  episodic: [
    { id: 'e1', t: 'Checkout timeouts correlate with cold Lambda starts', meta: 'task 420 · 6 findings', used: 'retained 41m ago' },
    { id: 'e2', t: 'Stripe test-mode webhooks omit the account field', meta: 'task 419', used: 'retained yesterday' },
    { id: 'e3', t: 'Observed token refresh window is 5 minutes in prod', meta: 'task 418', used: 'contradicts k3', flagged: true },
    { id: 'e4', t: 'Worker pool saturates above 60 concurrent captures', meta: 'task 409 · abandoned approach', used: 'retained 2 days ago' },
  ],
}

/* ---- Artifacts ----------------------------------------------------------*/
export const artifacts = [
  { id: 'r1', t: 'Release readiness — 2.14', kind: 'Assessment', meta: 'task 415 · 4 days ago' },
  { id: 'r2', t: 'Billing webhook v2 migration plan', kind: 'Plan', meta: 'task 419 · in use' },
  { id: 'r3', t: 'Checkout latency investigation', kind: 'Investigation', meta: 'task 420 · updating' },
  { id: 'r4', t: 'Token refresh — review findings', kind: 'Review', meta: 'task 418 · 3 findings' },
  { id: 'r5', t: 'Third-party script audit', kind: 'Audit', meta: 'task 411 · 9 findings' },
]

/* ---- What the project is currently for -----------------------------------*/
export const intent = {
  headline: 'Prepare 2.14 for release',
  detail: 'Token rotation, webhook v2, and refund idempotency must land. Checkout latency is being investigated but is not blocking.',
  set: '3 days ago',
}

/* ---- Orchestration rules ------------------------------------------------
   How this project has decided work should be performed. These are the
   reason graphs extend themselves without asking. Nothing renders these or
   the repository state yet; they are the material for the parts still to
   be designed. */
export const rules = [
  { id: 'g1', when: 'authentication or session files change',
    then: 'add a security review before verification', src: 'team policy · 4 Feb', fired: 'fired 6m ago on task 418' },
  { id: 'g2', when: 'a migration is irreversible',
    then: 'require human approval before the step runs', src: 'team policy · 4 Feb', fired: 'fired 1h ago on task 421' },
  { id: 'g3', when: 'review returns findings',
    then: 'repair, then re-review, up to twice', src: 'team policy · 12 Feb', fired: 'fired 18m ago on task 418' },
  { id: 'g4', when: 'a task touches money handling',
    then: 'implementer and reviewer must be different models', src: 'team policy · 20 Feb', fired: 'fired 3h ago on task 414' },
  { id: 'g5', when: 'no convention covers a product behaviour',
    then: 'stop and ask the human', src: 'default · cannot be disabled', fired: 'fired 18m ago on task 418' },
]

export const repo = {
  name: 'meridian-web',
  head: 'main · 4e1a9c2',
  worktrees: [
    { id: 'w1', branch: 'ch/418-token-refresh', task: '418', state: 'in review', ahead: 7 },
    { id: 'w2', branch: 'ch/419-webhooks-v2',   task: '419', state: 'implementing', ahead: 11 },
    { id: 'w3', branch: 'ch/414-refund-idem',   task: '414', state: 'merged', ahead: 0 },
  ],
}

/* ---- The continuous conversation with the coordinator --------------------
   Oldest first — this is a thread you have been in for days, not a session
   that starts when the app opens.
   `thread` entries are work the coordinator opened out of something you said. */
export const conversation = [
  { id: 'c1', who: 'you', at: '3 days ago',
    body: 'Target 2.14 for release. Token rotation, webhook v2 and refund idempotency have to land. Checkout latency can slip.' },
  { id: 'c2', who: 'coordinator', at: '3 days ago',
    body: 'Recorded as the project intent — every worker gets it as context from now on. I opened three threads and I will hold anything that is not in scope rather than starting it.' },
  { id: 'c4', who: 'coordinator', at: '3h ago',
    body: 'Refund idempotency is merged after two review cycles. Evidence is kept on the task.' },
  { id: 'c3', who: 'thread', ref: '414', link: 's1',
    title: 'Add idempotency keys to the refund endpoint',
    state: 'Merged', at: '3h ago', meta: 'PR 1184 · 2 review cycles · 1 repair' },

  /* Everything below arrived while the window was closed. */
  { id: 'c5', who: 'brief', at: '07:41' },

  { id: 'c6', who: 'thread', ref: '418', link: 't418',
    title: 'Repair token refresh on privilege change',
    state: 'Security review', at: '6m ago', meta: 'claude-opus-5 · 5 of 7 steps' },

  { id: 'c7', who: 'you', at: '14m ago',
    body: 'Why do refunds fail fast when webhooks retry?' },
  { id: 'c7b', who: 'coordinator', at: '11m ago',
    body: 'Because a queued refund can pay out twice if the webhook retries while it waits. That was decided in February, on task 402. The full answer and its sources are on 425, and it proposes one knowledge entry for you to accept.' },
  { id: 'c8', who: 'thread', ref: '425', link: 't425', bare: true, view: 'needs',
    title: 'Why do refunds fail fast when webhooks retry?',
    state: 'Answered', at: '11m ago', meta: 'nothing built · 1 entry proposed' },
]

/* The overnight brief. Written as the coordinator reporting to you, not as
   a summary widget: it says what it did without asking, and what it thinks
   you should do first. */
export const brief = {
  away: '14 hours',
  at: '07:41',
  open: 'Meridian ran overnight. Three things need you, and one task gained a step by rule.',
  needs: [
    { id: 'a1', t: 'Review API fallback decision', ref: '418' },
    { id: 'a2', t: 'Approve dropping legacy_session table', ref: '421' },
    { id: 'a3', t: 'Two knowledge entries disagree on the token refresh window', ref: null },
  ],
  moved: [
    { t: 'Refund idempotency merged', meta: 'task 414 · PR 1184' },
    { t: 'Six findings retained from the checkout investigation', meta: 'task 420' },
    { t: 'Webhook retry contract promoted to canonical', meta: 'task 407' },
  ],
  running: [
    { t: 'Token refresh repair', meta: 'security review · 6m' },
    { t: 'Webhook v2 migration', meta: 'implementing · 22m' },
    { t: 'Checkout timeout investigation', meta: '41m' },
  ],
  did: 'I added a security review to task 418 after the graph touched authentication files. A rule from 4 February requires it for auth changes.',
  close: 'Task 422 is held until you make the fallback decision. I would start there.',
}
