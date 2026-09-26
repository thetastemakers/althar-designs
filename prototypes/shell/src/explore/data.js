/* What the project knows.

   Knowledge is the reason the project persists and the agents do not. Every
   task starts by being told some of this, and ends by proposing more of it.
   So the material here is not a list of notes — it is a body of claims, each
   with a standing, a source, and a reach.

   Standing is the whole argument:
     canonical — supplied to every task the scope matches. The project asserts it.
     episodic  — observed once, on one task. True of that moment, not of the project.
     proposed  — a task wants it made canonical. Nobody has said yes.
     retired   — was canonical, is not any more, and the record of that matters.

   Two of these disagree. Note what that is NOT: it is not brass. No work is
   stopped — every task is simply being told something the project cannot
   both believe. That is worse than an interruption and quieter than one, and
   getting the difference right is most of this design.

   The corpus matches src/data/project.js and src/task/data.js: the refresh
   window, task 418's findings, and the answer task 425 gave are the same
   objects the other surfaces already show. */

export const entries = [
  /* ---- Canonical ------------------------------------------------------*/
  {
    id: 'k1', t: 'Webhook deliveries must remain idempotent',
    standing: 'canonical', klass: 'Decision', since: '4 Mar',
    from: { task: '407', how: 'promoted when the retry contract was documented' },
    reach: 9, last: 'supplied 22m ago',
    body: 'A delivery may arrive more than once and the receiver must be unchanged by the repeat. This binds the sender as well: retry state lives in the delivery record, not in the handler.',
    evidence: [
      'Task 407 documented the contract and it was promoted rather than filed',
      'Task 419 is migrating the v2 endpoint against this entry now',
    ],
    supplied: ['419', '424', '414', '407', '402'],
  },
  {
    id: 'k2', t: 'All money values are integer minor units',
    standing: 'canonical', klass: 'Convention', since: '12 Jan',
    from: { task: null, how: 'written by hand in the first week of the project' },
    reach: 24, last: 'supplied 6m ago',
    body: 'No floats, no decimal strings, no currency-aware types at the boundary. Conversion happens at render time and nowhere else.',
    evidence: ['24 tasks have received this. None has argued with it.'],
    supplied: ['418', '414', '411', '409', '407'],
  },
  {
    id: 'k3', t: 'Sessions refresh on a 15 minute window',
    standing: 'canonical', klass: 'Architecture', since: '14 Jan',
    from: { task: null, how: 'recorded from the January architecture review' },
    reach: 6, last: 'supplied 2 days ago',
    disputed: 'e3',
    body: 'The refresh window bounds how long a stale principal can survive. Every task that reasons about session lifetime has been given this number.',
    evidence: [
      'Recorded from the architecture review, not measured',
      'Nobody has checked it against a running environment since it was written',
    ],
    supplied: ['418', '421', '402', '398'],
  },
  {
    id: 'k6', t: 'Session tokens rotate on privilege change',
    standing: 'canonical', klass: 'Architecture', since: '14 Jan',
    from: { task: null, how: 'recorded from the January architecture review' },
    reach: 6, last: 'supplied 2h ago',
    body: 'A change of role issues a new token rather than amending the old one. Task 418 is repairing the half of this that was never true: the cached principal outlived the token it came from.',
    evidence: ['Task 418 found the rotation hook and the cache were not in the same write'],
    supplied: ['418', '421', '402'],
  },
  {
    id: 'k7', t: 'Middleware may not perform I/O',
    standing: 'canonical', klass: 'Convention', since: '9 Jan',
    from: { task: null, how: 'written by hand' },
    reach: 15, last: 'supplied 2h ago',
    body: 'Anything a request handler needs must be resolved before middleware runs or after it returns. This is why the principal cache exists at all.',
    evidence: ['Task 418 worked within it rather than around it'],
    supplied: ['418', '419', '402'],
  },
  {
    id: 'k4', t: 'We do not rely on ORM-level cascades',
    standing: 'canonical', klass: 'Convention', since: '2 Feb',
    from: { task: '398', how: 'promoted after a delete removed more than it should have' },
    reach: 11, last: 'supplied yesterday',
    body: 'Deletions are written out in full, in the order they must happen. A cascade that lives in the model is invisible at the call site and has removed production rows once already.',
    evidence: ['Task 398 · the incident that produced this entry'],
    supplied: ['419', '414', '398'],
  },
  {
    id: 'k8', t: 'Feature flags are read once at boot',
    standing: 'canonical', klass: 'Convention', since: '21 Nov',
    from: { task: null, how: 'written by hand' },
    reach: 2, last: 'last supplied 71 days ago',
    stale: true,
    body: 'Flags are resolved at startup and held for the life of the process, so a flag change needs a deploy.',
    evidence: [
      'The flag service moved to long-polling in February',
      'No task has been given this entry since 12 Jan',
    ],
    supplied: ['361', '344'],
  },

  /* ---- Episodic -------------------------------------------------------*/
  {
    id: 'e3', t: 'The refresh window is 5 minutes in production configuration',
    standing: 'episodic', klass: 'Observation', since: '2h ago',
    from: { task: '418', how: 'read out of the running configuration while checking the rotation fix' },
    reach: 0, last: 'never supplied',
    disputed: 'k3',
    body: 'The repair read the deployed value rather than the documented one. It is a third of what the canonical entry says.',
    evidence: [
      'Read from production configuration, not from the review',
      'Staging still reads 15 minutes',
    ],
    supplied: [],
  },
  {
    id: 'e1', t: 'Checkout timeouts correlate with cold Lambda starts',
    standing: 'episodic', klass: 'Observation', since: '41m ago',
    from: { task: '420', how: 'six findings across 14 days of traces' },
    reach: 0, last: 'never supplied',
    body: 'Every timeout in the sample fell inside 400ms of a cold start. The investigation has not yet shown that the reverse holds.',
    evidence: ['14 days of traces · 6 findings', 'Task 420 is still running'],
    supplied: [],
  },
  {
    id: 'e5', t: 'One destination takes 61% of webhook throughput at peak',
    standing: 'episodic', klass: 'Observation', since: '1 day ago',
    from: { task: '424', how: 'measured while replaying yesterday’s peak' },
    reach: 1, last: 'supplied 22m ago',
    body: 'Measured over six hours of real traffic. It is the reason host-based sharding was discarded inside the hour.',
    evidence: ['Replay of 6 hours of peak traffic', 'Shape A discarded on this number alone'],
    supplied: ['424'],
  },
  {
    id: 'e2', t: 'Test-mode webhooks omit the account field',
    standing: 'episodic', klass: 'Observation', since: 'yesterday',
    from: { task: '419', how: 'hit during the v2 migration' },
    reach: 1, last: 'supplied yesterday',
    body: 'Only in test mode, and only on the v1 payload. Worth keeping until the migration is done, and probably worth nothing after.',
    evidence: ['Task 419 · reproduced twice'],
    supplied: ['419'],
  },
  {
    id: 'e4', t: 'The worker pool saturates above 60 concurrent captures',
    standing: 'episodic', klass: 'Observation', since: '2 days ago',
    from: { task: '409', how: 'measured on an approach that was then abandoned' },
    reach: 0, last: 'never supplied',
    body: 'The approach did not hold. The measurement still does, and it is the only number anyone has for the pool.',
    evidence: ['Task 409 · abandoned', 'The ceiling was not what made the approach fail'],
    supplied: [],
  },

  /* ---- Proposed -------------------------------------------------------*/
  {
    id: 'p1', t: 'The principal cache must be invalidated inside the rotation write',
    standing: 'proposed', klass: 'Architecture', since: '2h ago',
    from: { task: '418', how: 'raised by the repair step, before the task is finished' },
    reach: 0, last: 'not supplied until it is accepted',
    body: 'Two writes, one transaction. The repair on task 418 is the first place this is true; nothing stops the next task from making the same mistake until it is canonical.',
    evidence: [
      'Task 418 · the bug this entry describes shipped in January',
      'Three call sites currently rotate without invalidating',
    ],
    supplied: [],
  },
  {
    id: 'p2', t: 'Write paths fail fast; delivery paths retry',
    standing: 'proposed', klass: 'Decision', since: '11m ago',
    from: { task: '425', how: 'worked out from two entries and a decision, to answer a question' },
    reach: 0, last: 'not supplied until it is accepted',
    body: 'A refund that cannot be written tells the caller. A webhook that cannot be delivered keeps trying. Nothing recorded this: it was reconstructed from k1 and the fail-fast decision on task 402.',
    evidence: [
      'Task 425 asked; the answer did not exist anywhere',
      'Task 402 chose fail-fast for reads, February',
      'The 429 decision on task 418 turns on exactly this',
    ],
    supplied: [],
  },

  /* ---- Retired --------------------------------------------------------*/
  {
    id: 'r1', t: 'Refunds are processed synchronously end to end',
    standing: 'retired', klass: 'Architecture', since: 'retired 4 Mar',
    from: { task: '388', how: 'canonical from 3 Dec until the queue landed' },
    reach: 7, last: 'last supplied 4 Mar',
    supersededBy: 'k1',
    body: 'True until refunds moved behind the delivery queue. It is kept because four tasks were built on it and their reasoning is unreadable without it.',
    evidence: ['Superseded by the idempotency contract', '7 tasks were given this while it was true'],
    supplied: ['388', '372', '366'],
  },
]

export const byId = (id) => entries.find((e) => e.id === id)

/* Enough of the project's history to say what a task was, when an entry
   names it. Provenance that reads as a number is not provenance. */
export const taskTitles = {
  '344': 'Retire the maintenance banner',
  '361': 'Split the checkout bundle',
  '366': 'Backfill refund timestamps',
  '372': 'Add refund reason codes',
  '388': 'Move refunds behind the delivery queue',
  '398': 'Remove the cascade on account delete',
  '402': 'Decide 429 handling for read paths',
  '407': 'Document the webhook retry contract',
  '409': 'Reduce cold start on the checkout worker',
  '411': 'Audit third-party script loading',
  '414': 'Add idempotency keys to the refund endpoint',
  '418': 'Repair token refresh on privilege change',
  '419': 'Migrate billing webhooks to the v2 endpoint',
  '420': 'Investigate intermittent checkout timeout',
  '421': 'Drop the legacy_session table',
  '424': 'Find a shape for webhook queue sharding',
  '425': 'Why do refunds fail fast when webhooks retry?',
}

export const STANDINGS = [
  { id: 'canonical', label: 'Canonical', note: 'Asserted by the project. Supplied to every task in scope.' },
  { id: 'episodic',  label: 'Episodic',  note: 'Observed once, on one task. True of a moment, not of the project.' },
  { id: 'proposed',  label: 'Proposed',  note: 'A task wants this made canonical. Nobody has said yes.' },
  { id: 'retired',   label: 'Retired',   note: 'Was canonical. Kept because work was built on it.' },
]

export const CLASSES = ['Architecture', 'Convention', 'Decision', 'Observation']

/* ---- What is open ------------------------------------------------------
   Four things the body of knowledge is asking of you. None of them stops any
   work, which is exactly why none of them is brass — and exactly why they
   would rot forever without a surface that keeps count. */
export const open = [
  {
    id: 'q1', sort: 'Contradiction', at: 'raised 2h ago', entry: 'k3', against: 'e3',
    t: 'The project cannot hold both refresh windows',
    detail: 'A canonical entry from the January review says 15 minutes. Task 418 read 5 minutes out of production configuration two hours ago, while repairing the rotation. Four tasks were given the January entry while it was the only one.',
    cost: 'Nothing is stopped. Every task that reasons about session lifetime is being told a number nobody has checked.',
    options: [
      { id: 'o1', label: 'Promote the observed value', note: 'Replaces the January entry. Task 418 becomes its provenance, and the January entry retires rather than disappears.',
        after: 'The observed value is canonical. The January entry is retired against it, and the four tasks that received it are listed on the retirement.' },
      { id: 'o2', label: 'Keep both, scoped by environment', note: 'Staging 15, production 5. Both stand, each with a condition, and tasks are given the one that matches where they run.',
        after: 'Both stand, each with a condition. A task is given the window for the environment it runs in, and neither entry is disputed any more.' },
      { id: 'o3', label: 'Neither — measure it first', note: 'Opens a question against the deployed configuration. Both entries stay disputed until it answers.',
        after: 'A question is open against the deployed configuration. Both entries stay disputed, and nothing is supplied from either until it answers.' },
    ],
  },
  {
    id: 'q2', sort: 'Proposal', at: 'proposed 2h ago', entry: 'p1',
    t: 'Task 418 is proposing its repair as canonical',
    detail: 'The repair step raised it two hours ago, while the task is still under review. Three call sites in the repository still rotate without invalidating the cache.',
    cost: 'Until it is accepted, nothing supplies it, and the next task to touch rotation starts from the same wrong assumption task 418 did.',
    options: [
      { id: 'o1', label: 'Accept as canonical', note: 'Supplied to every task touching authentication from now on.',
        after: 'Canonical from now on, with task 418 as its provenance. The next task to touch rotation is told it without having to ask.' },
      { id: 'o2', label: 'Keep it episodic', note: 'Stays on task 418. Findable, never volunteered.',
        after: 'It stays on task 418 — findable by anyone who looks, volunteered to nobody. The three call sites that rotate without invalidating are still on nobody’s list.' },
    ],
  },
  {
    id: 'q3', sort: 'Proposal', at: 'proposed 11m ago', entry: 'p2',
    t: 'An answer with no home',
    detail: 'Task 425 was a question. It reconstructed the rule from two canonical entries and a February decision, and the reconstruction is better than either source.',
    cost: 'The fallback decision on task 418 turns on this. Answering it again costs another task.',
    options: [
      { id: 'o1', label: 'Accept as canonical', note: 'Supplied to every task touching a write path. Task 425 recorded as provenance.',
        after: 'Canonical, with task 425 as its provenance. The next task touching a write path is told this without having to ask.' },
      { id: 'o2', label: 'Leave it', note: 'Nothing is written. The answer stays on task 425 only.',
        after: 'Nothing was written. The answer stays on task 425, and the next task that needs it will work it out again.' },
    ],
  },
  {
    id: 'q4', sort: 'Decay', at: 'flagged yesterday', entry: 'k8',
    t: 'Nothing has used the feature flag entry in 71 days',
    detail: 'The flag service moved to long-polling in February. The entry still says flags need a deploy, and it is still canonical.',
    cost: 'A canonical entry nobody uses is not harmless: it is what a worker will believe if it ever matches scope again.',
    options: [
      { id: 'o1', label: 'Retire it', note: 'Kept and marked retired. The two tasks built on it stay readable.',
        after: 'Retired, and kept. The two tasks that were built on it still read correctly, and nothing is supplied it again.' },
      { id: 'o2', label: 'Correct it', note: 'Opens a question against the flag service, and holds the entry disputed until it answers.',
        after: 'A question is open against the flag service. The entry is held disputed until it answers, and is supplied to nothing meanwhile.' },
      { id: 'o3', label: 'Leave it', note: 'It stands. The count starts again and you will be asked in another 30 days.',
        after: 'It stands, unchanged and canonical. The count starts again, and you will be asked about it in another 30 days.' },
    ],
  },
]

/* An answer is not a receipt. What is recorded is which option you took, so
   every surface can say what the body of knowledge is now — in the words of
   the option you actually chose, not a single outcome written in advance. */
export const decided = (recorded, id) => recorded.some((r) => r.id === id)
export const chose = (recorded, item) => {
  const r = recorded.find((x) => x.id === item.id)
  return r ? item.options.find((o) => o.id === r.opt) : null
}

/* ---- The four directions ----------------------------------------------*/
export const DIRECTIONS = [
  {
    id: 'register', n: 1, label: 'Register',
    shape: 'Every claim, in one dense table',
    line: 'Knowledge is a record, and the job of a record is to be inspectable. Standing, class, source, reach and last use on one line each, sorted so the disputed and the unused rise.',
    wins: 'You can audit the whole body in one screen, and reach makes consequence visible — you can see that six tasks were told the disputed number.',
    costs: 'It reads as inventory. Nothing about it says which of these you actually have to do something about today.',
  },
  {
    id: 'dossier', n: 2, label: 'Dossier',
    shape: 'The brief a worker is handed',
    line: 'Show it as the thing it actually is: the document every task is given before it starts. Claims in prose, provenance in the gutter, disputes marked in place.',
    wins: 'It is the only view that answers "what does a worker believe when it starts", and a contradiction inside a sentence is far more alarming than a contradiction in a row.',
    costs: 'Terrible at maintenance. Finding the one entry you want means reading, and reach and decay have nowhere natural to live.',
  },
  {
    id: 'queue', n: 3, label: 'Queue',
    shape: 'Only what needs deciding',
    line: 'Nobody browses knowledge. What matters is what changed, what disagrees and what has rotted — four items, each answerable here, with the settled body folded away behind a count.',
    wins: 'It is the only direction that makes knowledge maintainable rather than admirable, and it gives the contradiction somewhere to be loud without being brass.',
    costs: 'Hides the body of knowledge behind a line of text. You cannot read what the project believes, only what it is unsure of.',
  },
  {
    id: 'trace', n: 4, label: 'Trace',
    shape: 'Where a claim came from and where it went',
    line: 'An entry is worth what its evidence is worth. Pick one and see the task that made it and every task that was handed it since, on one spine.',
    wins: 'Blast radius becomes literal: you see exactly which four tasks were told the wrong number before you decide anything.',
    costs: 'One entry at a time. It answers questions about a claim and nothing at all about the body as a whole.',
  },
]

/* ---- Combinations ------------------------------------------------------
   The register and the queue are not rivals: one is the durable record of
   what the project holds, the other is the short list of what it is unsure
   of. Both are needed and neither is a mode of the other. The question these
   four ask is only where attention sits relative to the record —

     inside it   the open items are rows, marked in the margin
     beside it   the record is the screen, the open items are its margin
     above it    two panes, both live, neither hiding the other
     before it   the open items are the door you come through to the record

   Every one of them is still brass-free. An open item is not an alarm. */
export const COMBOS = [
  {
    id: 'ledger', n: 1, label: 'Ledger',
    shape: 'One table. Open rows bracketed.',
    line: 'There is no second list. An open item is a row of the register, standing where its claim stands, marked with a hairline in the margin — and the head carries a stepper that walks you through the four of them and tells you when you are through.',
    wins: 'One grammar, one scroll, one place a claim can be. You answer a contradiction in the row you would have read it in, so maintenance happens exactly where browsing already does.',
    costs: 'Attention is quiet by construction. Four bracketed rows in fifteen are easy to scroll past, and a table row has nowhere to say what leaving it costs until you open it.',
  },
  {
    id: 'desk', n: 2, label: 'Desk',
    shape: 'The record, with the open items in the margin',
    line: 'The register keeps the screen and the four open items sit in a rail beside it. Picking one in the rail marks and scrolls to the rows it concerns; opening a bracketed row picks it in the rail. The two halves point at each other.',
    wins: 'You can see the consequence while you decide: the rail says what it costs, the table says which six tasks were told it. Neither view gives anything up.',
    costs: 'Widest of the four, and the rail is permanent furniture — on a project with nothing open it is 320px of "nothing to do". It also wants a wide window to be honest.',
  },
  {
    id: 'deck', n: 3, label: 'Deck',
    shape: 'Two panes, both live',
    line: 'The queue above, the record below, a hairline between them and a scroll each. Nothing is hidden behind a count or a tab. When the last item is answered the top pane folds to a single line and gives the record the whole window.',
    wins: 'The most literal reading, and the most legible: both views keep their own shape and their own density, and the divider states the trade in words rather than hiding it.',
    costs: 'Halves the record. You are reading fifteen entries through a slot, and the split is fixed whether there are four open items or none.',
  },
  {
    id: 'rounds', n: 4, label: 'Rounds',
    shape: 'The queue is the door to the record',
    line: 'You arrive at what needs deciding. Answer it, or walk past it, and you cross into the register with the rows you just changed still marked. A count in the head takes you back. Two whole screens, one sequence.',
    wins: 'Both views stay exactly themselves, and attention is spent before the browsing starts rather than competing with it. It is the only one that can say "you are through".',
    costs: 'A door you have to pass every time you want to look something up. Cheap on the first visit of the day, an obstacle on the fifth.',
  },
]

export const PLACEMENTS = [
  { id: 'room', label: 'A room',
    note: 'Knowledge is a fourth room beside the conversation and the board. It gets the whole window and it is somewhere you go.' },
  { id: 'side', label: 'The sidecar',
    note: 'Knowledge bolts onto the room you are already in, as it does in the shell today. Never a destination, always at hand.' },
]
