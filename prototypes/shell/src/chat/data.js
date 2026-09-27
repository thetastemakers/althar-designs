/* Content shared by the catalogue and the example conversation. */

export const refDoc = {
  title: 'Rate limits on refunds',
  body: [
    '# Rate limits on refunds',
    'Refunds draw on the same per-partner budget as charges: 600 requests a minute, shared between the two.',
    '## Over the limit',
    'The API answers `429 Too Many Requests` with a `Retry-After` header, in whole seconds. Nothing is queued: a refused refund was not recorded and can be sent again as it was.',
    '```http\nHTTP/1.1 429 Too Many Requests\nRetry-After: 12\nX-RateLimit-Remaining: 0',
    '## What partners should do',
    '- Wait for `Retry-After`, then resend with the same idempotency key\n- Do not retry faster than the header says\n- Treat `X-RateLimit-Remaining` as advice, not a promise',
    '> Charges and refunds share one budget. A partner sending both at full rate will see refunds refused first.',
    '## Changes',
    'Added in 2.14. Before 2.14 refunds were not limited at all.',
  ],
}

export const summaryDoc = {
  title: 'What changed in task 431',
  body: [
    '## Summary',
    'Refunds now go through the same partner limiter as charges and share its budget.',
    '- `src/refunds/router.ts` wraps the refund route in `withPartnerLimit`\n- `src/refunds/limit.test.ts` covers 429, Retry-After, and the shared bucket\n- `docs/api/refunds-rate-limits.md` documents it for partners',
    '## Verified',
    'Staging was frozen, so yesterday’s 1,200 refunds were replayed against the branch locally. Headers match charges exactly.',
    '## Not done',
    'No change to the limit itself. Partners near 600 a minute will now see refunds refused; three did yesterday.',
  ],
}

/* The team's own instructions for the review step. The result shape is
   fixed; how to review is theirs. */
export const reviewDoc = {
  title: 'review.md',
  body: [
    '# How we review in Meridian',
    'You are reviewing a change before it reaches a partner. Report findings; do not fix them.',
    '## Look hardest at',
    '- Anything that moves money: charges, refunds, payouts\n- Idempotency: a retried request must never act twice\n- What partners see: status codes, headers, error bodies',
    '## Leave alone',
    '- Style the linter already enforces\n- Naming, unless it misleads',
    '## Context reviewers miss',
    'Added from dismissed findings. Each line says where it came from.',
    '> Charges and refunds share one partner budget on purpose; the spec says so, and partner success agreed it with Acme on 12 Sep. (Task 431, set aside by the lead)',
    '## Severity',
    'High means a partner could lose money or see a wrong answer. Medium means we would fix it before merging. Low is worth a note.',
  ],
}

/* One review, two reviewers, combined. */
export const findings = [
  { id: 'f1', sev: 'high', at: 'src/refunds/router.ts:21', by: ['claude-sonnet-5', 'gemini-3-pro'], state: 'open',
    claim: 'The limiter runs after the idempotency lookup, so a replayed request spends budget without doing anything.' },
  { id: 'f2', sev: 'medium', at: 'src/charges/limit.ts:42', by: ['claude-sonnet-5'], state: 'open',
    claim: 'Refunds share the charges bucket, so a partner at full charge volume will have refunds refused. Give refunds their own bucket.',
    against: { model: 'gemini-3-pro', text: 'the spec says one budget per partner, so sharing is intended.' } },
  { id: 'f3', sev: 'low', at: 'src/refunds/limit.test.ts:52', by: ['gemini-3-pro'], state: 'open',
    claim: 'The reset test waits on the wall clock. Use fake timers so it cannot flake.' },
]

/* The steps whose threads can be opened beside the task thread. */
export const STEPS = {
  review: { id: 'review', n: 3, of: 6, label: 'Review', model: 'claude-sonnet-5', agents: ['claude-sonnet-5', 'gemini-3-pro'], state: 'done' },
  security: { id: 'security', n: 4, of: 6, label: 'Security review', model: 'claude-sonnet-5', state: 'done' },
}

/* Task 419's Verify, stuck on one assertion after Charrette tried three ways round it. */
export const STUCK = {
  step: 'Verify',
  what: 'A reused idempotency key returns 200, not 409, on refunds created before PR 1184.',
  tried: [
    { what: 'Ran it again', result: 'failed the same way' },
    { what: 'Repaired the refund fixtures', result: 'regenerated them; still fails' },
    { what: 'Codex took the step', result: 'fails on the same assertion' },
  ],
  read: {
    by: 'claude-opus-5',
    says: 'Refunds made before PR 1184 have no stored key, so the check never sees a reuse. That is the backfill in MER-231, which hasn’t run. Nothing in this task can fix it without writing to production data.',
  },
  output: {
    command: 'pnpm test refunds/idempotency',
    lines: [
      ' ✓ refunds/idempotency › returns 409 for a reused key (12 ms)',
      ' ✗ refunds/idempotency › returns 409 for a key reused on a pre-1184 refund',
      '   Expected status 409, received 200',
      '     at test/refunds/idempotency.test.ts:88:31',
      ' Tests: 1 failed, 23 passed, 24 total',
    ],
    exit: 1,
  },
  agents: [
    { model: 'gemini-3-pro', note: 'Gemini CLI · API key, billed per token' },
    { model: 'qwen3-coder', note: 'Ollama · this Mac, slower' },
    { model: 'gpt-5.2-codex', note: 'Tried already, on this step' },
  ],
}
