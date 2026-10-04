/* Exhibit F — one task, run end to end.

   The graph is not drawn in advance. Each step reveals the next node only
   once the result before it exists, and the appended ones say what caused
   them. The single brass moment is the one decision that is a person's. */

(function () {
  const WHO = {
    coord: { name: 'Coordinator', model: 'Your choice of model', pays: 'Althar', fam: null },
    codex: { name: 'Codex CLI', model: 'OpenAI', pays: 'Your ChatGPT plan', fam: 'OpenAI' },
    claude: { name: 'Claude Code', model: 'Anthropic', pays: 'Your Claude plan', fam: 'Anthropic' },
    local: { name: 'Self-hosted coder', model: 'Open-weight', pays: 'Your GPUs', fam: 'Open-weight' },
    you: { name: 'You', model: 'One question', pays: '', fam: null },
  }

  const NODES = [
    {
      k: 'Brief', who: 'coord',
      why: 'The task starts from project memory, not from a blank prompt. Six claims fall within its scope. Two of them disagree about the session window, so both are supplied and marked. The fix doesn’t depend on the window’s length, so work continues rather than stopping to ask.',
      given: [
        ['Canonical', 'Session tokens rotate on privilege change'],
        ['Canonical', 'Middleware may not perform I/O'],
        ['Canonical', 'All money values are integer minor units'],
        ['Canonical', 'Session code gets independent review and a security audit'],
        ['Contested', 'Sessions refresh on a 15 minute window'],
        ['Contested', 'Production reads 5 minutes'],
      ],
      result: 'Brief assembled. Acceptance: a role change must clear cached permissions within the same request.',
    },
    {
      k: 'Reproduce', who: 'codex',
      why: 'A repair starts from a failing test. Test-writing goes to whichever agent is cheapest for it this month on your plans.',
      result: 'The test fails as expected. After a role change, the old permissions are served until the next refresh.',
    },
    {
      k: 'Implement', who: 'claude',
      why: 'Routed on recent evidence: this agent has the best record on this module’s last five tasks. It receives the brief and the failing test, not a summary of them.',
      result: 'The permissions cache is now cleared inside the rotation write. 2 files, 41 lines. The test passes.',
    },
    {
      k: 'Review', who: 'codex',
      why: 'Policy from project memory: session code gets an independent review. Independent means a different model family from the one that wrote the change.',
      result: 'Finding: three other call sites rotate tokens without clearing the cache.',
      appends: 'Review found a defect, so a repair and a re-review are added.',
    },
    {
      k: 'Repair', who: 'claude', appended: 'Review found three call sites',
      why: 'The repair inherits the finding, the original intent and the no-I/O-in-middleware convention, so it can’t fix one problem by reintroducing another.',
      result: 'All three call sites now rotate and clear the cache in the same write.',
    },
    {
      k: 'Re-review', who: 'codex', appended: 'Every repair is re-reviewed',
      why: 'Checked against both the original task and the earlier finding. It is not treated as a fresh review.',
      result: 'Clean.',
      appends: 'The diff touches token rotation, a path project memory marks sensitive, so a security audit is added.',
    },
    {
      k: 'Security audit', who: 'local', appended: 'Touched a sensitive path',
      why: 'The audit runs on open weights on your own hardware, so this code never leaves your network. It is also a third model family, independent of both earlier agents.',
      result: 'One finding the system can’t settle: if rotation fails, the request now fails too. Before, it quietly continued with the old permissions.',
      appends: 'It changes what users see, and project memory holds only a proposal on it. This decision goes to a person.',
    },
    {
      k: 'Decide', who: 'you', appended: 'Behaviour change, no recorded decision', human: true,
      q: 'When rotation fails, should the request fail, or retry once and then fail?',
      ctx: 'Project memory has a proposal from task 425: write paths fail fast; delivery paths retry. This is a write path.',
      options: [
        { id: 'fast', l: 'Fail fast', d: 'Matches the proposal, which becomes canonical' },
        { id: 'retry', l: 'Retry once, then fail', d: 'Records an exception to the proposal' },
      ],
    },
    {
      k: 'Verify', who: 'coord',
      why: 'Done means evidence, not the agents’ own confidence: the full suite, plus the original failing test run against staging.',
      result: '412 tests pass. On staging, a role change clears cached permissions within the same request.',
    },
    {
      k: 'Record', who: 'coord',
      why: 'The run ends by telling the project what it learned, so the next task starts from it.',
      writes: [
        ['Proposed', 'The permissions cache must be cleared inside the token rotation'],
        ['Decided', null],
        ['Contested', 'Refresh window: 15 minutes documented, 5 minutes in production. Left open for review, with the reading attached'],
      ],
      result: 'Three entries written. The next task on sessions inherits all of them, whichever agent runs it.',
    },
  ]

  const el = (id) => document.getElementById(id)
  const root = el('run-ex')
  if (!root) return
  const graph = el('run-graph'), detail = el('run-detail'), stats = el('run-stats')
  const pos = el('run-pos'), ticks = el('run-ticks')
  const playBtn = el('run-play'), playL = el('run-play-l')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let i = 0
  let answer = null
  let timer = null

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const chosen = () => NODES[7].options.find((o) => o.id === answer)

  function counts() {
    const seen = NODES.slice(0, i + 1)
    const agents = new Set(seen.filter((n) => WHO[n.who].fam).map((n) => n.who))
    const fams = new Set(seen.map((n) => WHO[n.who].fam).filter(Boolean))
    return [
      ['Steps', seen.length],
      ['Added from evidence', seen.filter((n) => n.appended).length],
      ['Agents', agents.size],
      ['Model families', fams.size],
      ['Questions for you', seen.filter((n) => n.human).length],
      ['Written to the record', i === NODES.length - 1 ? 3 : 0],
    ]
  }

  function renderStats() {
    stats.innerHTML = counts().map(([l, v]) => `<div class="rs"><b>${v}</b><span>${l}</span></div>`).join('')
  }

  function renderGraph() {
    graph.innerHTML = NODES.slice(0, i + 1).map((n, j) => {
      const w = WHO[n.who]
      const pending = n.human && !answer
      const cls = ['gn', j === i ? 'is-cur' : '', n.appended ? 'is-app' : '', pending ? 'is-human' : '', j < i || (n.human && answer) ? 'is-done' : ''].join(' ')
      const sub = n.human ? (answer ? `Answered · ${chosen().l}` : 'Waiting for you') : `${w.name}${w.fam ? ' · ' + w.fam : ''}`
      return `<li class="${cls}">
        ${n.appended ? `<span class="gn-why">↳ ${esc(n.appended)}</span>` : ''}
        <button class="gn-b" data-j="${j}">
          <span class="gn-mark" aria-hidden="true"></span>
          <span class="gn-n">${String(j + 1).padStart(2, '0')}</span>
          <span class="gn-k">${esc(n.k)}</span>
          <span class="gn-w">${esc(sub)}</span>
        </button>
      </li>`
    }).join('') + (i < NODES.length - 1 ? `<li class="gn-ghost"><span>The next step depends on this result</span></li>` : `<li class="gn-end"><span>Complete · 10 steps · none planned in advance</span></li>`)
  }

  function renderDetail() {
    const n = NODES[i]
    const w = WHO[n.who]
    let h = `<p class="d-k"><span>Step ${i + 1}</span>${n.appended ? `<span class="d-app">Added from evidence</span>` : ''}</p>
      <h4 class="d-h">${esc(n.k)}</h4>`
    if (n.human) {
      h += `<div class="ask${answer ? ' is-answered' : ''}">
        <p class="ask-k">${answer ? 'Answered' : 'Work is stopped until you answer'}</p>
        <p class="ask-q">${esc(n.q)}</p>
        <p class="ask-c">${esc(n.ctx)}</p>
        <div class="ask-o">${n.options.map((o) => `<button class="opt${answer === o.id ? ' is-on' : ''}" data-opt="${o.id}" ${answer ? 'disabled' : ''}><b>${esc(o.l)}</b><span>${esc(o.d)}</span></button>`).join('')}</div>
      </div>`
      if (answer) h += `<p class="d-res">Recorded as a decision with you as its author. The graph continues without you.</p>`
    } else {
      h += `<dl class="d-who"><div><dt>Agent</dt><dd>${esc(w.name)}</dd></div><div><dt>Model</dt><dd>${esc(w.model)}</dd></div><div><dt>Paid by</dt><dd>${esc(w.pays)}</dd></div></dl>
        <p class="d-l">Why this step, and this agent</p><p class="d-p">${esc(n.why)}</p>`
      if (n.given) h += `<p class="d-l">Supplied from project memory</p><ul class="d-given">${n.given.map(([s, t]) => `<li><span class="d-st ${s === 'Contested' ? 'is-c' : ''}">${s}</span>${esc(t)}</li>`).join('')}</ul>`
      if (n.writes) {
        const d = chosen() || NODES[7].options[0]
        h += `<p class="d-l">Written back to project memory</p><ul class="d-given">${n.writes.map(([s, t]) => `<li><span class="d-st ${s === 'Contested' ? 'is-c' : ''}">${s}</span>${esc(t || (d.id === 'fast' ? 'Write paths fail fast; delivery paths retry. Now canonical' : 'Rotation retries once before failing. An exception to the fail-fast proposal'))}</li>`).join('')}</ul>`
      }
      h += `<p class="d-l">Result</p><p class="d-res">${esc(n.result)}</p>`
      if (n.appends) h += `<p class="d-next">${esc(n.appends)}</p>`
    }
    detail.innerHTML = h
  }

  function renderTicks() {
    ticks.innerHTML = NODES.map((n, j) => `<i class="${j <= i ? 'on' : ''} ${n.human ? 'h' : ''}"></i>`).join('')
  }

  function render() {
    renderStats(); renderGraph(); renderDetail(); renderTicks()
    pos.textContent = `Step ${i + 1} of ${NODES.length}`
    el('run-prev').disabled = i === 0
    el('run-next').disabled = i === NODES.length - 1 || (NODES[i].human && !answer)
    const cur = graph.querySelector('.is-cur')
    if (cur && !reduce) cur.classList.add('is-enter')
  }

  function go(j) {
    j = Math.max(0, Math.min(NODES.length - 1, j))
    if (j > 7 && !answer) j = 7
    if (j <= 7) answer = j === 7 ? answer : null
    i = j
    render()
  }
  const next = () => {
    if (NODES[i].human && !answer) { stop(); return }
    if (i >= NODES.length - 1) { stop(); return }
    go(i + 1)
    if (NODES[i].human && !answer) stop()
  }

  function stop() { clearInterval(timer); timer = null; playL.textContent = 'Play'; playBtn.classList.remove('is-on') }
  function play() {
    if (i >= NODES.length - 1) { answer = null; go(0) }
    playL.textContent = 'Pause'; playBtn.classList.add('is-on')
    timer = setInterval(next, 2600)
  }

  el('run-prev').addEventListener('click', () => { stop(); go(i - 1) })
  el('run-next').addEventListener('click', () => { stop(); next() })
  el('run-reset').addEventListener('click', () => { stop(); answer = null; go(0) })
  playBtn.addEventListener('click', () => (timer ? stop() : play()))
  graph.addEventListener('click', (e) => {
    const b = e.target.closest('.gn-b'); if (!b) return
    stop(); i = +b.dataset.j; render()
  })
  detail.addEventListener('click', (e) => {
    const b = e.target.closest('[data-opt]'); if (!b || answer) return
    answer = b.dataset.opt
    render()
  })
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
    const r = root.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight) return
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(i - 1) }
  })

  render()
})()
