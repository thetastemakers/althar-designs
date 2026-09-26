import { attention, execution, settled } from '../data/project.js'
import Icon from '../lib/Icon.jsx'
import Model from '../lib/Model.jsx'
import GitHub from '../lib/GitHub.jsx'
import './board.css'

/* The board room. Every piece of work, in the order it moves: what is up
   next, what is running, what has stopped to ask you, what is settled.

   Each column has its own kind of object, because they are read differently:
     up next    handed out but not started, in the order it will start, and
                what it waits for — another task, the worker limit, or a call
                of yours. Not a backlog: triage stays in the tracker, and a
                ticket only arrives here once someone has said "do this".
     running    a task moving along its steps, and who is doing the step
     needs you  a question put to you, with its answers already on the card,
                and the tasks it holds
     settled    a ledger: what each piece of work came to

   There is no separate "held" column. A task held on a decision is simply
   not started or not moving; the decision is what needs you, and it sits in
   Needs you. The task stays in Up next with the question named on it.     */
export default function Board({ live, opened, released, dock, onOpen }) {
  const running = execution.filter((e) => e.state === 'running')
  const held = execution.filter((e) => e.state === 'blocked' && !released)
  const queued = execution.filter((e) => e.state === 'queued')
  const resumed = released ? execution.filter((e) => e.state === 'blocked') : []
  const todo = [...held, ...queued]
  return (
    <section className="bd">
      <div className="bd-cols">
        <Col kind="next" title="Up next" count={todo.length}>
          <ol className="bd-ledger bd-queue">
            {todo.map((t, i) => <NextRow key={t.id} t={t} n={i + 1} on={dock?.id === t.id} onOpen={() => onOpen({ kind: 'work', id: t.id })} />)}
          </ol>
          {!todo.length && <Empty>Nothing is waiting to start.</Empty>}
        </Col>

        <Col kind="running" title="Running" count={running.length + opened.length + resumed.length}>
          {opened.map((t) => <NewCard key={t.id} t={t} on={dock?.id === t.id} onOpen={() => onOpen({ kind: 'new', id: t.id })} />)}
          {resumed.map((t) => <WorkCard key={t.id} t={t} resumed on={dock?.id === t.id} onOpen={() => onOpen({ kind: 'work', id: t.id })} />)}
          {running.map((t) => <WorkCard key={t.id} t={t} on={dock?.id === t.id} onOpen={() => onOpen({ kind: 'work', id: t.id })} />)}
        </Col>

        <Col kind="needs" title="Needs you" count={live.length}>
          {live.map((a) => a.pr
            ? <ReviewCard key={a.id} a={a} on={dock?.id === a.id} onOpen={() => onOpen({ kind: 'att', id: a.id })} />
            : <AskCard key={a.id} a={a} on={dock?.id === a.id} onOpen={() => onOpen({ kind: 'att', id: a.id })} />)}
          {!live.length && <Empty>Nothing is waiting on you.</Empty>}
        </Col>

        <Col kind="settled" title="Settled" count={settled.length}>
          <ol className="bd-ledger">
            {settled.map((s) => <Settled key={s.id} s={s} on={dock?.id === s.id} onOpen={() => onOpen({ kind: 'settled', id: s.id })} />)}
          </ol>
        </Col>
      </div>
    </section>
  )
}

function Col({ kind, title, count, children }) {
  return (
    <div className={'bd-col is-' + kind}>
      <header className="bd-col-head">
        <span className="bd-glyph" aria-hidden="true" />
        <span className="bd-col-title">{title}</span>
        <span className="bd-count">{count}</span>
      </header>
      <div className="bd-col-body">{children}</div>
    </div>
  )
}

const Empty = ({ children }) => <div className="bd-empty">{children}</div>

/* A question put to you. Its answers are on the card, so you can see what
   you are being asked before you open it. */
function AskCard({ a, on, onOpen }) {
  return (
    <button className={'bd-card bd-ask' + (on ? ' is-on' : '')} onClick={onOpen}>
      <span className="bd-top">
        <span className="bd-stamp">{a.kind}</span>
        <span className="bd-at">{a.raisedAt}</span>
      </span>
      <span className="bd-title">{a.title}</span>
      <span className="bd-why">{a.because}</span>
      <span className="bd-opts">
        {a.options.map((o, i) => (
          <span className="bd-opt" key={o.id}>
            <span className="bd-opt-k">{String.fromCharCode(65 + i)}</span>
            <span className="bd-opt-t">{o.label}</span>
          </span>
        ))}
      </span>
      <span className="bd-foot">
        <span className="bd-holds">
          {a.holds ? <>Holds {a.holds.map((r) => <span className="bd-chip" key={r}>{r}</span>)}</> : a.raisedBy}
        </span>
        <span className="bd-go">Decide<Icon name="arrow" size={11} /></span>
      </span>
    </button>
  )
}

/* Finished work, waiting to be accepted. The card is the change in brief:
   where it goes, how big it is, whether it passed. */
function ReviewCard({ a, on, onOpen }) {
  const p = a.pr
  return (
    <button className={'bd-card bd-ask bd-review' + (on ? ' is-on' : '')} onClick={onOpen}>
      <span className="bd-top">
        <span className="bd-stamp">{a.kind}</span>
        <span className="bd-ref">{a.raisedBy.split('task ')[1]}</span>
        <span className="bd-at">{a.raisedAt}</span>
      </span>
      <span className="bd-title">{a.title}</span>
      <span className="bd-pr">
        <GitHub size={12} />
        <span className="bd-pr-repo">{p.repo.split('/')[1]}</span>
        <span className="bd-pr-n">#{p.number}</span>
        <span className="bd-pr-stat"><b className="is-add">+{p.add}</b><b className="is-del">−{p.del}</b></span>
      </span>
      <span className="bd-foot">
        <span className="bd-holds"><Icon name="check" size={11} />{p.checks.length} of {p.checks.length} checks</span>
        <span className="bd-go">Review<Icon name="arrow" size={11} /></span>
      </span>
    </button>
  )
}

/* The steps as a track: done, the one running, the ones to come. A step a
   rule added carries a mark of its own. */
function Track({ graph, resumed }) {
  return (
    <span className="bd-track" aria-hidden="true">
      {graph.map((n, i) => {
        const st = resumed ? (i === 0 ? 'running' : 'queued') : n.state
        return <i key={n.id} className={'is-' + st + (n.added ? ' is-added' : '')} />
      })}
    </span>
  )
}

function WorkCard({ t, on, resumed, onOpen }) {
  const at = resumed ? 0 : t.graph.findIndex((n) => n.state === 'running')
  const added = !resumed && t.graph.find((n) => n.added)
  return (
    <button className={'bd-card bd-work' + (on ? ' is-on' : '')} onClick={onOpen}>
      <span className="bd-top">
        <span className="bd-ref">{t.ref}</span>
        <span className="bd-kind">{t.kind}</span>
        <span className="bd-at is-live"><span className="bd-live" />{t.elapsed}</span>
      </span>
      <span className="bd-title">{t.title}</span>
      <Track graph={t.graph} resumed={resumed} />
      <span className="bd-step">
        <b>{t.graph[at]?.label}</b>
        <span>{at + 1} of {t.graph.length}</span>
      </span>
      <span className="bd-foot">
        <Model id={resumed ? 'claude-opus-5' : t.worker} />
        {added && <span className="bd-added"><Icon name="plus" size={10} />1 step, by rule</span>}
      </span>
    </button>
  )
}

function NewCard({ t, on, onOpen }) {
  return (
    <button className={'bd-card bd-work is-new' + (on ? ' is-on' : '')} onClick={onOpen}>
      <span className="bd-top">
        <span className="bd-ref">{t.ref}</span>
        <span className="bd-kind">Delivery</span>
        <span className="bd-at is-live"><span className="bd-live" />{t.elapsed}</span>
      </span>
      <span className="bd-title">{t.title}</span>
      <Track graph={[{ id: 1, state: 'running' }, { id: 2 }, { id: 3 }, { id: 4 }]} />
      <span className="bd-step"><b>Requirements</b><span>1 of 4</span></span>
      <span className="bd-foot"><Model id={t.worker} /></span>
    </button>
  )
}

/* Not started, so there is no track to draw: the graph a task runs is
   decided when it starts, and may change while it runs. What a queued task
   can honestly say is where it is in line and what it is waiting for. */
function NextRow({ t, n, on, onOpen }) {
  const q = attention.find((a) => a.id === t.waitsOn)
  return (
    <li>
      <button className={'bd-row bd-next' + (q ? ' is-held' : '') + (on ? ' is-on' : '')} onClick={onOpen}>
        <span className="bd-top">
          <span className="bd-n">{n}</span>
          <span className="bd-ref">{t.ref}</span>
          <span className="bd-kind">{t.kind}</span>
        </span>
        <span className="bd-title">{t.title}</span>
        {q
          ? <span className="bd-why-not is-held"><Icon name="hold" size={11} />Waiting on {q.title.charAt(0).toLowerCase() + q.title.slice(1)}</span>
          : <span className="bd-why-not"><Icon name={t.after ? 'after' : 'clock'} size={11} />{t.reason}</span>}
      </button>
    </li>
  )
}

const OUTCOME = { Merged: 'check', Answered: 'answer', Artifact: 'artifact', Abandoned: 'stop', Knowledge: 'knowledge' }

/* Settled work is a ledger, not a pile of cards: what each piece came to. */
function Settled({ s, on, onOpen }) {
  return (
    <li>
      <button className={'bd-row is-' + s.outcome.toLowerCase() + (on ? ' is-on' : '')} onClick={onOpen}>
        <span className="bd-top">
          <span className="bd-outcome"><Icon name={OUTCOME[s.outcome] || 'check'} size={12} />{s.outcome}</span>
          <span className="bd-ref">{s.ref}</span>
          <span className="bd-at">{s.when}</span>
        </span>
        <span className="bd-title">{s.title}</span>
        <span className="bd-meta"><span className="bd-kind">{s.kind}</span>{s.meta}</span>
      </button>
    </li>
  )
}
