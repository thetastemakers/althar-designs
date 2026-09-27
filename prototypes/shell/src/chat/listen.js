/* What each agent is listening to, and what arrives while you watch.

   Task 431 opens its draft PR a few seconds after you open the task, and
   starts listening to it; a comment comes in, the lead answers it, then
   the checks pass and it marks the PR ready, as it was asked to. */

const pr1206 = { id: 'pr1206', kind: 'github', label: 'PR 1206', where: 'meridian-api', what: 'checks, comments', last: 'opened just now' }

export const LISTEN = {
  '431:running': {
    id: '431',
    note: 'Comments, reviews and checks come into this thread. The lead stops listening when the task settles.',
    sources: [],
    script: [
      {
        at: 3600, listen: pr1206,
        tools: [
          { kind: 'push', verb: 'Pushed', target: 'ch/431-refund-limits', meta: '3 commits' },
          { kind: 'pr', verb: 'Opened draft', target: 'PR 1206', meta: 'Rate-limit refunds like charges' },
        ],
        lead: 'The full suite passed, so the branch is pushed and draft PR 1206 is open, titled as you asked. I’m listening to it: once its checks pass I’ll mark it ready for review, and comments on it come into this thread.',
      },
      {
        at: 14500, flash: 'New comment · dana',
        update: { id: 'pr1206', last: 'comment from dana, just now' },
        arrive: { from: 'dana', verb: 'commented on', where: 'PR 1206', text: 'Retry-After here is in seconds, but I remember charges sending an HTTP date. Which one do partners get from refunds?' },
        tools: [{ kind: 'comment', verb: 'Replied on', target: 'PR 1206', meta: 'to dana' }],
        lead: 'Seconds, the same as charges. The HTTP date was only ever in the v1 charges handler, and refunds don’t go through v1. I answered on the PR with the line in src/refunds/limit.ts.',
      },
      {
        at: 27000, flash: 'Checks passed · PR 1206',
        update: { id: 'pr1206', what: 'reviews, comments', last: 'checks passed, just now' },
        arrive: { kind: 'ci', verb: 'All 41 checks passed on', where: 'PR 1206' },
        tools: [{ kind: 'pr', verb: 'Marked ready', target: 'PR 1206', meta: 'requested payments-owners' }],
        lead: 'Checks passed, so PR 1206 is ready for review and payments-owners are requested. I’m still listening for their review.',
      },
    ],
  },
  '418:ready': {
    id: '418',
    note: 'Reviews and checks on both pull requests come into this thread. The lead stops listening when you accept or send back.',
    sources: [
      { id: 'pr1187', kind: 'github', label: 'PR 1187', where: 'meridian-api', what: 'reviews, checks', last: 'checks passed 4m ago' },
      { id: 'web412', kind: 'github', label: 'PR 412', where: 'meridian-web', what: 'reviews, checks', last: 'checks passed 3m ago' },
    ],
    script: [],
  },
}

/* The coordinator listens for the project, not for one task. */
export const COORDINATOR_LISTENS = [
  { id: 'cycle', kind: 'linear', label: 'Meridian 2.14', where: 'Linear cycle', what: 'new and changed issues', last: 'MER-231 changed 3m ago' },
  { id: 'main', kind: 'github', label: 'main', where: 'meridian-api', what: 'failing checks', last: 'green 22m ago' },
]
