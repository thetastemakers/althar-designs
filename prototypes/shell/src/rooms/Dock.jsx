import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useDismiss } from '../lib/hooks.js'
import { artifacts, attention, execution, knowledge, settled } from '../data/project.js'
import Model from '../lib/Model.jsx'
import GitHub from '../lib/GitHub.jsx'

/* ---- The dock -----------------------------------------------------------
   One panel, three occupants: project knowledge, artifacts, or the thing you
   just opened. It stays with you when you change rooms. */
export default function Dock({ dock, opened, onClose, onRecord, onOpen, onLibrary, floating }) {
  const ref = useDismiss(floating, onClose)
  const isBolt = dock.kind === 'know' || dock.kind === 'art'

  return (
    <aside className="rm-dock" ref={floating ? ref : undefined}>
      <div className="rm-dock-head">
        {isBolt ? (
          /* which one is open is already said by the chrome button that
             opened it; the panel only names itself */
          <span className="rm-dock-name">{dock.kind === 'know' ? 'Knowledge' : 'Artifacts'}</span>
        ) : (
          <DockLabel dock={dock} opened={opened} />
        )}
        <button className="rm-dock-close" onClick={onClose} title="Close  Esc"><Icon name="close" size={12} /></button>
      </div>
      <div className="rm-dock-body" key={dock.kind + (dock.id || '')}>
        {dock.kind === 'know' && <Know onLibrary={onLibrary} />}
        {dock.kind === 'art' && <Art />}
        {dock.kind === 'att' && (() => {
          const a = attention.find((x) => x.id === dock.id)
          return a.pr ? <ReviewDetail a={a} onRecord={onRecord} /> : <AttDetail a={a} onRecord={onRecord} />
        })()}
        {dock.kind === 'work' && <WorkDetail t={execution.find((x) => x.id === dock.id)} />}
        {dock.kind === 'new' && <NewDetail t={opened.find((x) => x.id === dock.id)} />}
        {dock.kind === 'settled' && <SettledDetail s={settled.find((x) => x.id === dock.id)} />}
      </div>
    </aside>
  )
}

function DockLabel({ dock, opened }) {
  if (dock.kind === 'att') {
    const a = attention.find((x) => x.id === dock.id)
    return <><span className="rm-dock-kind is-signal">{a.kind}</span><span className="rm-dock-sub">{a.raisedBy} · {a.raisedAt}</span></>
  }
  if (dock.kind === 'settled') {
    const s = settled.find((x) => x.id === dock.id)
    return <><span className="mono rm-dock-kind">{s.ref}</span><span className="rm-dock-sub">{s.outcome} · {s.when}</span></>
  }
  const t = dock.kind === 'work' ? execution.find((x) => x.id === dock.id) : opened.find((x) => x.id === dock.id)
  return <><span className="mono rm-dock-kind">{t.ref}</span><span className="rm-dock-sub">{t.branch || 'no branch'} · {t.elapsed}</span></>
}

function AttDetail({ a, onRecord }) {
  const [choice, setChoice] = useState(null)
  return (
    <>
      <h2 className="rm-dock-title">{a.title}</h2>
      <p className="rm-dock-because">{a.because}</p>
      <p className="rm-dock-detail">{a.detail}</p>

      <div className="eyebrow rm-dock-label">Your choice</div>
      <div className="rm-opts">
        {a.options.map((o) => (
          <button key={o.id} className={'rm-opt' + (choice === o.id ? ' is-on' : '')} onClick={() => setChoice(o.id)}>
            <span className="rm-opt-mark" />
            <span className="rm-opt-text">
              <span className="rm-opt-label">{o.label}</span>
              <span className="rm-opt-note">{o.note}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="eyebrow rm-dock-label">What the project knows</div>
      <ul className="rm-ev">{a.evidence.map((e) => <li key={e}>{e}</li>)}</ul>

      <div className="rm-act">
        <button className="rm-btn" disabled={!choice} onClick={() => onRecord(a, a.options.find((o) => o.id === choice))}>
          Record decision
        </button>
        <span className="rm-act-note">
          {a.blocking ? `Releases ${a.blocking}` : 'Resolves the contradiction'}
        </span>
      </div>
    </>
  )
}

/* Accepting from the board: enough to decide on a small change without
   opening the task, and the task one click away when it is not small. */
function ReviewDetail({ a, onRecord }) {
  const p = a.pr
  const [back, setBack] = useState(false)
  const most = Math.max(...p.files.map((f) => f.add + f.del))
  return (
    <>
      <h2 className="rm-dock-title">{a.title}</h2>
      <p className="rm-dock-because">{a.because}</p>
      <div className="rm-rv-pr">
        <GitHub size={14} />
        <span className="rm-rv-repo">{p.repo}</span>
        <span className="rm-rv-n">#{p.number}</span>
        <a className="rm-rv-gh" href={`https://github.com/${p.repo}/pull/${p.number}`} target="_blank" rel="noreferrer">
          <Icon name="external" size={11} />
        </a>
      </div>
      <p className="rm-rv-by">Written by <Model id={p.writer} /> · reviewed by <Model id={p.reviewer} /></p>

      <div className="eyebrow rm-dock-label">Files · <span className="rm-rv-add">+{p.add}</span> <span className="rm-rv-del">−{p.del}</span></div>
      <ul className="rm-rv-files">
        {p.files.map((f) => (
          <li key={f.path}>
            <span className="rm-rv-path">{f.path}</span>
            <span className="rm-rv-add">+{f.add}</span>{f.del > 0 && <span className="rm-rv-del">−{f.del}</span>}
            <span className="pr-bar" style={{ '--w': (f.add + f.del) / most, '--a': f.add / (f.add + f.del) }}><i /></span>
          </li>
        ))}
      </ul>

      <div className="eyebrow rm-dock-label">Checks</div>
      <ul className="rm-rv-checks">
        {p.checks.map((c) => (
          <li key={c.name}><span className="pr-mark is-pass"><Icon name="check" size={10} /></span><b>{c.name}</b><span>{c.detail}</span></li>
        ))}
      </ul>

      {back ? (
        <form className="rm-act rm-rv-back" onSubmit={(e) => { e.preventDefault(); onRecord(a, { label: 'Sent back' }) }}>
          <input autoFocus placeholder="What should change?" />
          <button className="rm-btn" type="submit">Send back</button>
        </form>
      ) : (
        <div className="rm-act">
          <button className="rm-btn" onClick={() => onRecord(a, { label: 'Accepted' })}>Accept and merge</button>
          <button className="rm-btn is-quiet" onClick={() => setBack(true)}>Send back</button>
        </div>
      )}
    </>
  )
}

function WorkDetail({ t }) {
  return (
    <>
      <h2 className="rm-dock-title">{t.title}</h2>
      {t.note && <p className="rm-dock-because">{t.note}</p>}
      {t.graph ? (
        <>
          <div className="eyebrow rm-dock-label">Execution</div>
          <Graph nodes={t.graph} />
        </>
      ) : (
        <>
          <div className="eyebrow rm-dock-label">Waiting for</div>
          <p className="rm-dock-detail">{t.reason}. The steps are chosen when it starts, not before.</p>
        </>
      )}
      <div className="rm-dock-foot">{t.worker ? <>Lead agent · <Model id={t.worker} /></> : 'Not started · no agent holds it yet'}</div>
    </>
  )
}

function NewDetail({ t }) {
  return (
    <>
      <h2 className="rm-dock-title">{t.title}</h2>
      <p className="rm-dock-because">Opened from the conversation. Scoping against project knowledge before any code is written.</p>
      <div className="eyebrow rm-dock-label">Execution</div>
      <Graph nodes={[
        { id: 'n1', label: 'Scope', state: 'running', meta: 'reading canonical knowledge' },
        { id: 'n2', label: 'Requirements', state: 'queued', meta: '' },
        { id: 'n3', label: 'Implement', state: 'queued', meta: '' },
        { id: 'n4', label: 'Review', state: 'queued', meta: 'model chosen once the diff is known' },
      ]} />
      <div className="rm-dock-foot">Lead agent · <Model id={t.worker} /></div>
    </>
  )
}

function SettledDetail({ s }) {
  return (
    <>
      <h2 className="rm-dock-title">{s.title}</h2>
      <p className="rm-dock-because">{s.meta}</p>
      <div className="rm-dock-foot">Retained by the project. No worker holds it.</div>
    </>
  )
}

function Graph({ nodes }) {
  return (
    <ol className="rm-graph">
      {nodes.map((n) => (
        <li key={n.id} className={'rm-node is-' + n.state}>
          <span className="rm-node-dot">
            {n.state === 'running' ? <span className="pulse" />
              : n.state === 'done' ? <span className="dot-done" />
              : n.state === 'blocked' ? <span className="dot-signal" />
              : <span className="dot-queue" />}
          </span>
          <span className="rm-node-text">
            <span className="rm-node-label">
              {n.label}
              {n.added && <span className="rm-node-added">added by rule</span>}
            </span>
            {n.meta && <span className="rm-node-meta">{n.meta}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Know({ onLibrary }) {
  return (
    <>
      <button className="rm-dock-go" onClick={onLibrary}>
        Open knowledge full size<span className="kbd">⇧K</span>
      </button>
      <p className="rm-dock-because">Held by the project. Every task starts with the canonical entries and adds to the episodic ones.</p>
      <div className="eyebrow rm-dock-label">Canonical</div>
      {knowledge.canonical.map((k) => <KRow key={k.id} k={k} />)}
      <div className="eyebrow rm-dock-label">Episodic</div>
      {knowledge.episodic.map((k) => <KRow key={k.id} k={k} />)}
    </>
  )
}

const KRow = ({ k }) => (
  <div className="rm-krow">
    <span className="rm-krow-t">
      {k.flagged && <span className="dot-signal" />}
      {k.t}
    </span>
    <span className="rm-krow-m">{k.meta} · {k.used}</span>
  </div>
)

function Art() {
  return (
    <>
      <p className="rm-dock-because">Outputs worth keeping that are not repository documentation.</p>
      {artifacts.map((a) => (
        <div className="rm-krow" key={a.id}>
          <span className="rm-krow-t">{a.t}</span>
          <span className="rm-krow-m">{a.kind} · {a.meta}</span>
        </div>
      ))}
    </>
  )
}
