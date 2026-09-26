import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import GitHub from '../lib/GitHub.jsx'
import Model, { WithModels } from '../lib/Model.jsx'
import { artifacts, changeSet, diff, findings, produced, sessionKnowledge, spikes } from './data.js'
import { Findings, Group, KRow } from './parts.jsx'
import { Spike } from './Talk.jsx'

/* The outputs face.

   What the task made, in the order you would want it when deciding whether
   to accept it. A task that made nothing does not get this face at all — the
   switch simply does not offer it. */

export default function Outputs({ task, st, onFull }) {
  if (task.id === 'session') return <SessionOut task={task} st={st} />
  return <DeliveryOut task={task} st={st} onFull={onFull} />
}

function DeliveryOut({ task, st, onFull }) {
  const done = st.id === 'settled'
  return (
    <div className="tv-scroll">
      <div className="tv-measure is-wide">
        <ChangeSet task={task} st={st} onFull={onFull} />

        <Group title="Artifact" meta="1">
          <ArtifactCard a={artifacts.review} />
          <Findings />
        </Group>

        {/* Nothing is retained until the evidence step runs, so an unfinished
            task does not get to show knowledge it has not written yet. */}
        <Group title="Knowledge retained" meta={done ? String(produced.length) : 'not written yet'}>
          {done
            ? produced.map((k) => <KRow key={k.id} k={k} />)
            : <p className="tv-out-empty">Evidence is the last step. Until it runs, what this task learned is still only in the conversation.</p>}
        </Group>

        <p className="tv-close">{st.close}</p>
      </div>
    </div>
  )
}

/* The change set, as GitHub would show it and as Charrette knows it: one
   piece of work, as many pull requests as it has repositories, merged in
   an order and never as one. Accepting it is yours; nothing merges before. */
function ChangeSet({ task, st, onFull }) {
  const [accepted, setAccepted] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const base = changeSet.states[st.id] || changeSet.states.running
  const p = accepted ? { ...changeSet.states.settled, note: 'Accepted by you · merged in order · just now' } : base
  const files = (paths) => diff.files.filter((f) => paths.includes(f.path))
  const add = diff.files.reduce((n, f) => n + f.add, 0)
  const del = diff.files.reduce((n, f) => n + f.del, 0)
  const most = Math.max(...diff.files.map((f) => f.add + f.del))
  const passed = p.checks.filter((c) => c.state === 'pass').length
  const reviewer = p.checks.find((c) => c.model)?.model
  const prs = changeSet.prs
  const num = (id) => prs.find((x) => x.id === id)?.number
  return (
    <article className={'pr is-' + p.status}>
      <div className="pr-body">
        <div className="pr-status-line">
          <span className={'pr-status is-' + p.status}><Icon name={p.status === 'merged' ? 'check' : 'pr'} size={12} />{p.label}</span>
          <span className="pr-note">{p.note}</span>
        </div>
        <h2 className="pr-title">{task.title}</h2>
        <div className="pr-branch">
          <span className="pr-ref">{task.branch}</span>
          <Icon name="arrow" size={11} />
          <span className="pr-ref">{changeSet.base}</span>
          <span className="pr-commits">{prs.length > 1 ? `${prs.length} repositories · ` : ''}{p.commits} commits</span>
        </div>
        <div className="pr-by">
          <span className="pr-by-i"><span className="pr-by-k">Written by</span><Model id={task.worker} /></span>
          {reviewer && <span className="pr-by-i"><span className="pr-by-k">Reviewed by</span><Model id={reviewer} /></span>}
          {reviewer === task.worker && <span className="pr-warn">Same model wrote and reviewed this</span>}
        </div>
      </div>

      <div className="pr-grid">
        <section className="pr-sec">
          <header className="pr-sub">
            <span>{prs.length > 1 ? 'Pull requests' : 'Pull request'}</span>
            <span className="pr-sub-n">{prs.length}</span>
            <span className="pr-sum"><b className="pr-add">+{add}</b><b className="pr-del">−{del}</b><DiffStat add={add} del={del} /></span>
          </header>
          {prs.map((x, i) => {
            const [org, name] = x.repo.split('/')
            return (
              <div className="pr-one" key={x.id}>
                <div className="pr-one-head">
                  {prs.length > 1 && <span className="pr-order">{i + 1}</span>}
                  <GitHub size={14} className="pr-gh-mark" />
                  <span className="pr-repo"><span>{org} /</span> {name}</span>
                  <span className="pr-num">#{x.number}</span>
                  <a className="pr-gh" href={x.url} target="_blank" rel="noreferrer" title="Open on GitHub">
                    GitHub<Icon name="external" size={10} />
                  </a>
                </div>
                {x.after && <p className="pr-after"><Icon name="after" size={11} />Merges after #{num(x.after)} · {x.why}</p>}
                <ul className="pr-files">
                  {files(x.files).map((f) => {
                    const cut = f.path.lastIndexOf('/') + 1
                    return (
                      <li key={f.path}>
                        <button className="pr-file" onClick={onFull}>
                          <span className="pr-path"><span className="pr-dir">{f.path.slice(0, cut)}</span>{f.path.slice(cut)}</span>
                          <span className="pr-n"><span className="pr-add">+{f.add}</span>{f.del > 0 && <span className="pr-del">−{f.del}</span>}</span>
                          <span className="pr-bar" style={{ '--w': (f.add + f.del) / most, '--a': f.add / (f.add + f.del) }}><i /></span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </section>

        <section className="pr-sec">
          <header className="pr-sub">
            <span>Checks</span>
            <span className="pr-sum">{passed} of {p.checks.length} passed</span>
          </header>
          <ul className="pr-checks">
            {p.checks.map((c) => (
              <li key={c.id} className={'pr-check is-' + c.state}>
                <CheckMark state={c.state} />
                <span className="pr-check-main">
                  <span className="pr-check-name">
                    {c.name}
                    {c.model && <Model id={c.model} short />}
                    {c.added && <span className="pr-rule"><Icon name="plus" size={9} />by rule</span>}
                  </span>
                  <span className="pr-check-d">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {st.id === 'ready' && !accepted ? (
        <footer className="pr-foot is-decide">
          {sending ? (
            <form className="pr-back" onSubmit={(e) => { e.preventDefault(); setSending(false); setSent(true) }}>
              <input autoFocus placeholder="What should change? Repair picks it up with this note." />
              <button className="pr-btn is-quiet" type="button" onClick={() => setSending(false)}>Cancel</button>
              <button className="pr-btn" type="submit">Send back</button>
            </form>
          ) : sent ? (
            <span className="pr-foot-meta">Sent back. Repair has your note; this change set comes back to you when it is verified again.</span>
          ) : (
            <>
              <button className="pr-btn is-accept" onClick={() => setAccepted(true)}>
                Accept and merge{prs.length > 1 ? ' both' : ''}
              </button>
              <button className="pr-btn is-quiet" onClick={() => setSending(true)}>Send back</button>
              <span className="pr-foot-meta">{prs.length > 1 ? `In order: #${prs[0].number}, then #${prs[1].number}` : 'Squash into main'}</span>
              <button className="pr-link" onClick={onFull}>Review the diff<span className="kbd">d</span></button>
            </>
          )}
        </footer>
      ) : (
        <footer className="pr-foot">
          <button className="pr-btn" onClick={onFull}>Review the diff<span className="kbd">d</span></button>
          <span className="pr-foot-meta">{st.outcome ? st.outcome.meta : st.outputsNote}</span>
        </footer>
      )}
    </article>
  )
}

/* GitHub's five squares: how much of the change is addition. */
function DiffStat({ add, del }) {
  const g = Math.round((add / (add + del)) * 5)
  return <span className="pr-stat" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < g ? 'is-add' : 'is-del'} />)}</span>
}

function CheckMark({ state }) {
  if (state === 'running') return <span className="pr-mark"><span className="pulse" /></span>
  if (state === 'held') return <span className="pr-mark"><span className="dot-signal" /></span>
  if (state === 'pass') return <span className="pr-mark is-pass"><Icon name="check" size={10} /></span>
  return <span className="pr-mark is-queued" />
}

/* An artifact is a document the task wrote, so it is drawn as one. */
function ArtifactCard({ a }) {
  const sev = ['high', 'medium', 'low'].map((s) => [s, findings.filter((f) => f.severity === s).length]).filter(([, n]) => n)
  return (
    <div className="art-card">
      <span className="art-sheet" aria-hidden="true"><Icon name="artifact" size={18} /></span>
      <span className="art-main">
        <span className="art-kind">{a.kind}</span>
        <span className="art-t">{a.t}</span>
        <span className="art-meta"><WithModels>{a.meta}</WithModels></span>
      </span>
      <span className="art-sev">
        {sev.map(([s, n]) => <span key={s} className={'tv-sev is-' + s}>{n} {s}</span>)}
      </span>
    </div>
  )
}

function SessionOut({ task, st }) {
  const done = st.id === 'settled'
  return (
    <div className="tv-scroll">
      <div className="tv-measure is-wide">
        {st.outcome && (
          <div className="tv-outcome is-top">
            <span className="tv-outcome-verdict">{st.outcome.verdict}</span>
            <span className="mono tv-outcome-pr">{st.outcome.pr}</span>
            <span className="tv-outcome-meta">{st.outcome.meta}</span>
          </div>
        )}

        <Group title="Attempts" meta={`${spikes.length} · ${done ? 'all branches discarded' : 'nothing merged'}`}>
          {spikes.map((sp) => (
            <Spike key={sp.id} sp={done && sp.verdict === 'Running' ? { ...sp, verdict: 'Discarded' } : sp} />
          ))}
          {st.outputsNote && <p className="tv-out-note">{st.outputsNote}</p>}
        </Group>

        <Group title="Artifact" meta={done ? '1' : 'not written yet'}>
          {done ? (
            <div className="tv-out-card is-static">
              <span className="tv-out-main">
                <span className="tv-out-t"><Icon name="artifact" size={12} />{artifacts.note.t}</span>
                <span className="tv-out-sub">{artifacts.note.kind} · {artifacts.note.meta}</span>
              </span>
            </div>
          ) : (
            <p className="tv-out-empty">
              The note is written when the session closes, not while it is still changing its mind.
            </p>
          )}
        </Group>

        <Group title="Knowledge retained" meta={String(sessionKnowledge.length)}>
          {sessionKnowledge.map((k) => <KRow key={k.id} k={k} />)}
        </Group>

        <p className="tv-close">{st.close}</p>
      </div>
    </div>
  )
}
