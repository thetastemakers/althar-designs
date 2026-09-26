/* What each task sounds like. Inside a task you talk to its lead agent;
   the coordinator only appears where it handed the work over.
   `who`: you · lead · handoff (the coordinator, once, at the top).
   A delivery keeps a sparse log; a session is an 
   actual back and forth; a question is two messages and an offer.
   `obj` attaches a thing to an entry — a diff, findings, a decision. */

const d = {
  open: [
    { who: 'you', at: '2 days ago',
      body: 'Sessions keep their old permissions after a privilege change until the token expires. Fix it — this is the one that matters for 2.14.' },
    { who: 'handoff', at: '2 days ago',
      body: 'Opened 418 and handed it over with three entries from project knowledge.',
      obj: 'chips' },
    { who: 'lead', at: '2h ago',
      body: 'Implement is done. I split it across three sub-agents — two on the fix, one writing the tests for it.',
      obj: 'diff' },
    { who: 'lead', at: '1h 40m ago',
      body: 'Review came back with three findings, all resolved in repair.',
      obj: 'findings' },
  ],
  running: [
    { who: 'lead', at: '6m ago',
      body: 'Security review is running. The project adds it when auth files change.',
      obj: 'inserted' },
  ],
  needs: [
    { who: 'lead', at: '18m ago',
      body: 'Repair stopped at the third finding. There are two defensible behaviours here and I will not choose product semantics on your behalf, so I am holding the branch rather than guessing.',
      obj: 'decision' },
  ],
  ready: [
    { who: 'lead', at: '4m ago',
      body: 'Security review and integration are clean, so it is ready for you. It is two pull requests: the API one has to merge first, because the web middleware calls what it adds.' },
  ],
  settled: [
    { who: 'lead', at: '20m ago',
      body: 'Security review cleared it. It was inserted by a rule when the graph touched authentication files.' },
    { who: 'lead', at: '3h ago',
      body: 'You accepted it. Both pull requests merged, API first, after the second review came back clean.',
      obj: 'outcome' },
    { who: 'lead', at: '3h ago',
      body: 'Two things are retained in project knowledge. One of them disagrees with a canonical entry from January, which is now its own item on the board.',
      obj: 'knowledge' },
  ],
}

const s = {
  open: [
    { who: 'you', at: 'yesterday',
      body: 'Webhook delivery falls behind at peak. I want to explore sharding the queue before we commit to anything — do not put a line of this near main.' },
    { who: 'handoff', at: 'yesterday',
      body: 'Opened 424 as a session. Every attempt is a spike on its own branch, thrown away unless you say otherwise.' },
    { who: 'lead', at: 'yesterday',
      body: 'I framed three shapes worth trying from the traffic you already have.' },
    { who: 'lead', at: '6h ago',
      body: 'Shape A first, because it is the cheapest to reason about: shard by destination host.',
      obj: 'spike:sp1' },
    { who: 'you', at: '5h ago',
      body: 'Hot shards are exactly what I am worried about. What does one big customer do to that?' },
    { who: 'lead', at: '5h ago',
      body: 'Measured it rather than argued about it. One destination took 61% of throughput in yesterday’s peak, so Shape A rebuilds the problem it was meant to solve. I have discarded it and kept the reason.' },
    { who: 'lead', at: '2h ago',
      body: 'Shape B holds. Shard by tenant, with a spill queue for anything over its own ceiling.',
      obj: 'spike:sp2' },
  ],
  running: [
    { who: 'lead', at: '22m ago',
      body: 'Shape C is still replaying against the worst window we have. I would rather show you all three together than hand you one at a time.' },
  ],
  needs: [
    { who: 'lead', at: '24m ago',
      body: 'Both surviving shapes clear peak in the replay. The difference between them is operational, not technical — what you are willing to page on — so it is not mine to settle.',
      obj: 'decision' },
  ],
  settled: [
    { who: 'lead', at: '2h 40m ago',
      body: 'Shape C came back even under the worst window, so the choice was real rather than a formality.' },
    { who: 'you', at: '2h 20m ago',
      body: 'Shape B. I would rather have a thing I can page on than an even thing I cannot watch.' },
    { who: 'lead', at: '2h ago',
      body: 'Taken forward. Both spike branches are gone and the reasoning is written down, so the next attempt starts from what we learned instead of from nothing.',
      obj: 'outcome' },
  ],
}

const q = {
  open: [
    { who: 'you', at: '11m ago',
      body: 'Why do refunds fail fast when webhooks retry? I keep forgetting which way round it is.' },
  ],
  handoff: [
    { who: 'handoff', at: '11m ago',
      body: 'Asked from the conversation. It reads and answers; it opens no branch.' },
  ],
  running: [
    { who: 'lead', at: 'now', thinking: true,
      body: 'Reading 2 canonical entries and 9 tasks that touched either path.' },
  ],
  answer: [
    { who: 'lead', at: '11m ago',
      body: 'Because one of them is a write the caller is waiting on and the other is a delivery nobody is waiting on.\n\nA refund is a write path: the caller is holding a response, so a retry only turns a visible failure into a slow one. Task 402 settled that for reads in February and the refunds API has followed it since. A webhook is a delivery path: nobody is on the other end of it, the contract is at-least-once, and retrying is the whole point.\n\nThe short version is that we retry where nobody is waiting, and fail where somebody is.',
      obj: 'cites' },
  ],
  needs: [
    { who: 'lead', at: '11m ago',
      body: 'One thing before you go.',
      obj: 'offer' },
  ],
  settled: [
    { who: 'lead', at: '10m ago',
      body: 'Kept. It is canonical now, with this task as its provenance, so the next worker on a write path is told without having to ask.',
      obj: 'knowledge' },
  ],
}

export const threads = {
  delivery: {
    running: [...d.open, ...d.running],
    needs: [...d.open, ...d.needs],
    ready: [...d.open, ...d.running, ...d.ready],
    settled: [...d.open, ...d.running, ...d.settled],
  },
  session: {
    running: [...s.open, ...s.running],
    needs: [...s.open, ...s.needs],
    settled: [...s.open, ...s.settled],
  },
  question: {
    running: [...q.open, ...q.handoff, ...q.running],
    needs: [...q.open, ...q.handoff, ...q.answer, ...q.needs],
    settled: [...q.open, ...q.handoff, ...q.answer, ...q.settled],
  },
}
