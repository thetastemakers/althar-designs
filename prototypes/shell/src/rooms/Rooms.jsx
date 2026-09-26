import { useEffect, useRef, useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useCompact, useKey, useDismiss } from '../lib/hooks.js'
import { attention, execution, projects, settled } from '../data/project.js'
import TaskView from '../task/Task.jsx'
import Knowledge from './Knowledge.jsx'
import { taskFor } from '../task/data.js'
import Talk from './Talk.jsx'
import Board from './Board.jsx'
import Dock from './Dock.jsx'
import './rooms.css'

/* Rooms — the shell.
   Two views of one project's work, the conversation and the board, and
   both at once. Knowledge and artifacts are not views of the work: they are
   what the work leaves behind, so they sit apart, on the right of the
   chrome, and open as a panel over whichever view you are in. Knowledge
   can go full size from there, as a takeover like a task.

   A piece of work that has a task view opens it over the whole window
   instead. The dock is a peek; the task view is where you sit. */

const ROOMS = [
  { id: 'talk',  label: 'Conversation' },
  { id: 'board', label: 'Board' },
  { id: 'all',   label: 'Both' },
]

export default function Rooms() {
  const tight = useCompact(1320)   // dock floats instead of taking its own column
  const compact = useCompact(980)  // chrome sheds labels
  const [room, setRoom] = useState('talk')          // 'talk' | 'board' | 'all'
  const [dock, setDock] = useState(null)            // { kind, id }
  const [projectId, setProjectId] = useState('meridian')
  const [switcher, setSwitcher] = useState(false)
  const [renaming, setRenaming] = useState(false)
  /* ?task=418&state=settled opens a task in a given state, for the study */
  const [task, setTask] = useState(() => {
    const q = new URLSearchParams(window.location.search)
    return q.get('task') ? { ref: q.get('task'), state: q.get('state') || 'running' } : null
  })      // { ref, state } — the takeover
  const [library, setLibrary] = useState(false)   // knowledge, full size
  const [answered, setAnswered] = useState([])
  const [said, setSaid] = useState([])
  const [opened, setOpened] = useState([])
  const [unread, setUnread] = useState(0)
  const [draft, setDraft] = useState('')
  const composerRef = useRef(null)
  /* names are yours to change; the rest of a project's identity is not */
  const [names, setNames] = useState({})
  const all = projects.map((p) => ({ ...p, name: names[p.id] || p.name }))
  const project = all.find((p) => p.id === projectId)

  const live = attention.filter((a) => !answered.includes(a.id))
  const released = answered.includes('a1')

  /* Entering a room where the conversation is visible marks it heard. */
  const go = (id) => { setRoom(id); if (id !== 'board') setUnread(0) }
  const talking = room === 'talk' || room === 'all'

  useKey((e, typing) => {
    /* While a task has the window it owns the keyboard as well. */
    if (task || library) return
    /* Room switching is a window command, so the composer does not get to
       swallow it; plain letters still belong to whatever you are typing. */
    if (e.metaKey || e.ctrlKey) {
      const n = Number(e.key)
      if (n >= 1 && n <= ROOMS.length) { e.preventDefault(); go(ROOMS[n - 1].id) }
      return
    }
    if (typing) { if (e.key === 'Escape') e.target.blur(); return }
    if (e.key === 'Escape') { setDock(null); setSwitcher(false); return }
    if (e.altKey) return
    if (e.key === 'b') {
      e.preventDefault()
      go(ROOMS[(ROOMS.findIndex((r) => r.id === room) + 1) % ROOMS.length].id)
    }
    if (e.key === 'K') { e.preventDefault(); setDock(null); setLibrary(true); return }
    if (e.key === 'k') { e.preventDefault(); setDock((d) => (d?.kind === 'know' ? null : { kind: 'know' })) }
    if (e.key === 'a') { e.preventDefault(); setDock((d) => (d?.kind === 'art' ? null : { kind: 'art' })) }
    if (e.key === 'c') {
      e.preventDefault()
      if (!talking) go('all')
      window.setTimeout(() => composerRef.current?.focus(), 30)
    }
  }, [room, talking, task, library])

  /* The coordinator speaks whether or not you are in the room to hear it. */
  const roomRef = useRef(room)
  useEffect(() => { roomRef.current = room }, [room])

  const speak = (entries) => {
    setSaid((s) => [...s, ...entries])
    setUnread((u) => (roomRef.current !== 'board' ? 0 : u + entries.filter((e) => e.who === 'coordinator').length))
  }
  const say = (text) => {
    const ref = String(423 + opened.length)
    const id = 'n' + ref
    setSaid((s) => [...s, { id: id + '-you', who: 'you', at: 'just now', body: text }])
    setOpened((o) => [...o, { id, ref, title: text, state: 'Scoping', worker: 'claude-opus-5', elapsed: 'just now' }])
    window.setTimeout(() => speak([{
      id: id + '-co', who: 'coordinator', at: 'just now',
      body: `Opened task ${ref}. I am scoping it against the project first — if it needs a decision you will get it here rather than a half-finished branch.`,
    }, {
      id: id + '-th', who: 'thread', ref, link: id, title: text,
      state: 'Scoping', at: 'just now', meta: 'claude-opus-5 · 1 of 4 steps',
    }]), 620)
  }

  const record = (a, option) => {
    setAnswered((v) => [...v, a.id])
    setDock(null)
    speak([{
      id: a.id + '-rec', who: 'coordinator', at: 'just now',
      body: a.pr && option.label === 'Sent back'
        ? `Sent back to task ${a.raisedBy.split('task ')[1]} with your note. It comes back here when it is verified again.`
        : a.pr
        ? `Accepted. Merging #${a.pr.number} into main; task ${a.raisedBy.split('task ')[1]} settles when it lands.`
        : a.blocking
        ? `Recorded: ${option.label.toLowerCase()}. Work held on ${a.blocking} resumes with this as the reason.`
        : `Recorded: ${option.label.toLowerCase()}. Project knowledge is consistent again.`,
    }])
  }

  /* A card opens the task it stands for. Only the three tasks that have a
     view written for them get one so far; everything else still opens the
     dock peek it always did. */
  const open = (d) => {
    if (d.kind === 'thread') {
      if (taskFor(d.ref)) { setDock(null); setTask({ ref: d.ref, state: d.view || 'running' }); return }
      d = { kind: d.fallback, id: d.id }
    }
    const ent = d.kind === 'work' ? execution.find((x) => x.id === d.id)
      : d.kind === 'settled' ? settled.find((x) => x.id === d.id) : null
    if (ent && taskFor(ent.ref)) {
      setDock(null)
      setTask({ ref: ent.ref, state: ent.view || (d.kind === 'settled' ? 'settled' : ent.state === 'blocked' ? 'needs' : 'running') })
      return
    }
    setDock((cur) => (cur && cur.kind === d.kind && cur.id === d.id ? null : d))
  }

  return (
    <div className={'rm' + (dock ? ' dock-open' : '') + (dock?.kind === 'know' || dock?.kind === 'art' ? ' dock-reading' : '') + (tight || room === 'all' ? ' is-float' : '')
      + (compact ? ' is-compact' : '')}>
      <header className="rm-chrome">
        <div className="traffic"><i /><i /><i /></div>

        <Switcher
          project={project} projects={all} open={switcher} setOpen={setSwitcher}
          renaming={renaming} setRenaming={setRenaming}
          onPick={(id) => { setProjectId(id); setSwitcher(false); setDock(null); go('talk') }}
          onRename={(name) => setNames((n) => ({ ...n, [project.id]: name }))}
        />
        <Elsewhere projects={all.filter((p) => p.id !== project.id)}
          onPick={(id) => { setProjectId(id); setDock(null); go('board') }}
          onMore={() => setSwitcher(true)} />

        <nav className="rm-rooms">
          {ROOMS.map((r, i) => (
            <button
              key={r.id}
              className={'rm-room' + (room === r.id ? ' is-on' : '')}
              onClick={() => go(r.id)}
              title={`${r.label}  ⌘${i + 1}`}
            >
              {r.label}
              {r.id === 'talk' && unread > 0 && room === 'board' && <span className="rm-room-dot" />}
              {r.id === 'board' && live.length > 0 && <span className="rm-room-dot is-signal" />}
            </button>
          ))}
        </nav>

        <div className="rm-chrome-right">
          <span className="rm-run"><span className="pulse" />
            {execution.filter((e) => e.state === 'running').length + opened.length + (released ? 1 : 0)} running
          </span>
          <button
            className={'rm-needs' + (live.length ? ' is-signal' : '')}
            onClick={() => { if (room === 'talk') go('all'); open({ kind: 'att', id: live[0]?.id }) }}
            disabled={!live.length}
          >
            {live.length ? `${live.length} need you` : 'Nothing needs you'}
          </button>
          <span className="rm-chrome-sep" />
          <button
            className={'rm-bolt' + (dock?.kind === 'know' ? ' is-on' : '')}
            onClick={() => open({ kind: 'know' })} title="Knowledge  k"
          >
            <Icon name="knowledge" size={13} /><span className="rm-bolt-t">Knowledge</span>
          </button>
          <button
            className={'rm-bolt' + (dock?.kind === 'art' ? ' is-on' : '')}
            onClick={() => open({ kind: 'art' })} title="Artifacts  a"
          >
            <Icon name="artifact" size={13} /><span className="rm-bolt-t">Artifacts</span>
          </button>
        </div>
      </header>

      <main className={'rm-main' + (room === 'all' ? ' is-both' : '')} key={room}>
        {talking && (
          <Talk
            side={room === 'all'}
            said={said} answered={answered} dock={dock}
            onOpen={open} onSay={say}
            draft={draft} setDraft={setDraft}
            composerRef={composerRef}
            project={project} onRename={() => { setRenaming(true); setSwitcher(true) }}
          />
        )}
        {(room === 'board' || room === 'all') && (
          <Board live={live} opened={opened} released={released} dock={dock} onOpen={open} />
        )}
      </main>

      {dock && (
        <Dock
          dock={dock} opened={opened}
          onClose={() => setDock(null)}
          onRecord={record}
          onOpen={open}
          onLibrary={() => { setDock(null); setLibrary(true) }}
          floating={tight || room === 'all'}
        />
      )}

      {library && <Knowledge project={project.name} onClose={() => setLibrary(false)} />}
      {task && <TaskView taskRef={task.ref} state={task.state} onClose={() => setTask(null)} />}
    </div>
  )
}

/* ---- Chrome pieces ------------------------------------------------------*/
/* Other projects that need you, said once, in the chrome, without a
   sidebar: the project you are in keeps the window, and the one that wants
   you is a word away. One project by name; more than one, by count. */
function Elsewhere({ projects: others, onPick, onMore }) {
  const waiting = others.filter((p) => p.needsYou > 0)
  if (!waiting.length) return null
  if (waiting.length === 1) {
    const p = waiting[0]
    return (
      <button className="rm-elsewhere" onClick={() => onPick(p.id)} title={`Go to ${p.name}`}>
        <span className="rm-elsewhere-dot" />{p.name}<span className="rm-elsewhere-n">{p.needsYou}</span>
      </button>
    )
  }
  return (
    <button className="rm-elsewhere" onClick={onMore}>
      <span className="rm-elsewhere-dot" />{waiting.length} other projects
    </button>
  )
}

function Switcher({ project, projects: all, open, setOpen, onPick, onRename, renaming, setRenaming }) {
  const ref = useDismiss(open, () => { setOpen(false); setRenaming(false) })
  const [name, setName] = useState(project.name)
  useEffect(() => { if (renaming) setName(project.name) }, [renaming, project.name])
  const [q, setQ] = useState('')
  const waiting = all.filter((p) => p.id !== project.id && p.needsYou > 0)
  const rest = all.filter((p) => !waiting.includes(p) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
  const Row = (p) => (
    <button key={p.id} className={'rm-pop-row' + (p.id === project.id ? ' is-on' : '')} onClick={() => onPick(p.id)}>
      <span className="rm-pop-main">
        <span className="rm-pop-name">{p.name}</span>
        <span className="rm-pop-desc">{p.desc}</span>
      </span>
      <span className="rm-pop-meta">
        {p.needsYou > 0 && p.id !== project.id && <span className="rm-pop-needs">{p.needsYou}</span>}
        {p.active > 0 && <span className="pulse" />}
        <span className="rm-pop-when">{p.lastTouched}</span>
      </span>
    </button>
  )
  return (
    <div className="rm-switch-wrap" ref={ref}>
      <button className={'rm-switch' + (open ? ' is-open' : '')} onClick={() => { setOpen(!open); setRenaming(false); setName(project.name) }}>
        <span className="rm-switch-name">{project.name}</span>
        <Icon name="chevronD" size={11} className="rm-switch-caret" />
      </button>
      {open && (
        <div className="rm-pop">
          <div className="rm-pop-cur">
            {renaming ? (
              <form className="rm-pop-rename" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onRename(name.trim()); setRenaming(false) }}>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setRenaming(false); setName(project.name) } }} />
                <button className="rm-pop-save" type="submit">Save</button>
              </form>
            ) : (
              <>
                <span className="rm-pop-cur-t">
                  <span className="rm-pop-cur-name">{project.name}</span>
                  <span className="rm-pop-desc">{project.repos || project.repo}</span>
                </span>
                <button className="rm-pop-edit" onClick={() => setRenaming(true)} title="Rename"><Icon name="pencil" size={12} /></button>
              </>
            )}
          </div>
          {waiting.length > 0 && (
            <>
              <div className="rm-pop-head eyebrow">Needs you</div>
              {waiting.map(Row)}
            </>
          )}
          <div className="rm-pop-find">
            <Icon name="search" size={12} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a project" />
          </div>
          {rest.map(Row)}
          <button className="rm-pop-new"><Icon name="plus" size={12} />New project</button>
        </div>
      )}
    </div>
  )
}
