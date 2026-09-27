import { useEffect, useRef, useState } from 'react'
import * as ui from '@charrette/ui'
import { Room } from '@charrette/ui'
import { useCompact, useKey } from '../lib/hooks.js'
import { attention, defaultPlan, execution, projects, settled } from '../data/project.js'
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

const ROOMS = [Room.Talk, Room.Board, Room.Both]

export default function Rooms() {
  const tight = useCompact(1320)   // dock floats instead of taking its own column
  const compact = useCompact(980)  // chrome sheds labels
  const [room, setRoom] = useState(Room.Talk)
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
  const go = (id) => { setRoom(id); if (id !== Room.Board) setUnread(0) }
  const talking = room === Room.Talk || room === Room.Both

  useKey((e, typing) => {
    /* While a task has the window it owns the keyboard as well. */
    if (task || library) return
    /* Room switching is a window command, so the composer does not get to
       swallow it; plain letters still belong to whatever you are typing. */
    if (e.metaKey || e.ctrlKey) {
      const n = Number(e.key)
      if (n >= 1 && n <= ROOMS.length) { e.preventDefault(); go(ROOMS[n - 1]) }
      return
    }
    if (typing) { if (e.key === 'Escape') e.target.blur(); return }
    if (e.key === 'Escape') { setDock(null); setSwitcher(false); return }
    if (e.altKey) return
    if (e.key === 'b') {
      e.preventDefault()
      go(ROOMS[(ROOMS.indexOf(room) + 1) % ROOMS.length])
    }
    if (e.key === 'K') { e.preventDefault(); setDock(null); setLibrary(true); return }
    if (e.key === 'k') { e.preventDefault(); setDock((d) => (d?.kind === 'know' ? null : { kind: 'know' })) }
    if (e.key === 'a') { e.preventDefault(); setDock((d) => (d?.kind === 'art' ? null : { kind: 'art' })) }
    if (e.key === 'c') {
      e.preventDefault()
      if (!talking) go(Room.Both)
      window.setTimeout(() => composerRef.current?.focus(), 30)
    }
  }, [room, talking, task, library])

  /* The coordinator speaks whether or not you are in the room to hear it. */
  const roomRef = useRef(room)
  useEffect(() => { roomRef.current = room }, [room])

  const speak = (entries) => {
    setSaid((s) => [...s, ...entries])
    setUnread((u) => (roomRef.current !== Room.Board ? 0 : u + entries.filter((e) => e.who === 'coordinator').length))
  }
  /* Whatever you ask for comes back as a plan, once, with a short count
     before it starts. Starting it puts it on the board. */
  const planned = useRef(0)
  const say = (text) => {
    const ref = String(433 + planned.current++)
    const id = 'n' + ref
    const title = text.split(/(?<=[.?!])\s/)[0].replace(/[.?!]$/, '').slice(0, 90)
    setSaid((s) => [...s, { id: id + '-you', who: 'you', at: 'just now', body: text }])
    /* the reply streams in, and the plan follows once it has finished */
    window.setTimeout(() => speak([{
      id: id + '-co', who: 'coordinator', at: 'just now', stream: true,
      body: `Task ${ref}. I read the requirements note and the files this touches, and the project’s rules add the review steps. This is the plan; change anything before it starts.`,
      then: [{
        id: id + '-plan', who: 'launch', task: ref, title, branch: `ch/${ref}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28).replace(/-$/, '')}`,
        estimate: 'About 30 min · on your subscriptions', steps: defaultPlan,
      }],
    }]), 620)
  }
  const followed = useRef(new Set())
  const streamed = (m) => {
    if (!m.then || followed.current.has(m.id)) return
    followed.current.add(m.id)
    speak(m.then)
  }
  const start = (t) => setOpened((o) => o.some((x) => x.ref === t.ref) ? o
    : [...o, { id: 'n' + t.ref, ref: t.ref, title: t.title, state: t.steps[0], steps: t.steps, worker: t.lead, branch: t.branch, elapsed: 'just now' }])

  const record = (a, option) => {
    setAnswered((v) => [...v, a.id])
    setDock(null)
    speak([{
      id: a.id + '-rec', who: 'coordinator', at: 'just now', stream: true,
      body: a.pr && option.label === 'Sent back'
        ? `Sent back to task ${a.raisedBy.split('task ')[1]} with your note. It comes back here when it is verified again.`
        : a.pr
        ? `Accepted. Merging #${a.pr.number} into main; task ${a.raisedBy.split('task ')[1]} settles when it lands.`
        : a.blocking
        ? `Recorded: ${option.label.toLowerCase()}. Work held on ${a.blocking} resumes with this as the reason.`
        : `Recorded: ${option.label.toLowerCase()}. Project knowledge is consistent again.`,
    }])
  }

  const runningCount = execution.filter((e) => e.state === 'running').length + opened.length + (released ? 1 : 0)
  /* the first call that waits on you, from the bar; from inside a task, the task closes first */
  const openYours = () => { setTask(null); if (room === Room.Talk) go(Room.Both); open({ kind: 'att', id: live[0]?.id }) }

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
    <div className={'rm' + (dock ? ' dock-open' : '') + (dock?.kind === 'know' || dock?.kind === 'art' ? ' dock-reading' : '') + (tight || room === Room.Both ? ' is-float' : '')
      + (compact ? ' is-compact' : '')}>
      <ui.TitleBar
        lights="drawn"
        className="rm-chrome"
        end={
          <>
            <ui.WorkStatus running={runningCount} yours={live.length} onYours={openYours} />
            <ui.TitleBarRule />
            <ui.ChromeButton icon="knowledge" label="Knowledge" compact={compact} pressed={dock?.kind === 'know'} onClick={() => open({ kind: 'know' })} title="Knowledge  k" />
            <ui.ChromeButton icon="artifact" label="Artifacts" compact={compact} pressed={dock?.kind === 'art'} onClick={() => open({ kind: 'art' })} title="Artifacts  a" />
          </>
        }
      >
        <ui.ProjectSwitcher
          current={summary(project)}
          projects={all.map(summary)}
          open={switcher}
          onOpenChange={setSwitcher}
          renaming={renaming}
          onRenamingChange={setRenaming}
          onPick={(id) => { setProjectId(id); setDock(null); go(Room.Talk) }}
          onRename={(name) => setNames((n) => ({ ...n, [project.id]: name }))}
          onNew={() => (window.location.hash = '#new')}
        />
        <ui.Elsewhere
          projects={all.filter((p) => p.id !== project.id).map((p) => ({ id: p.id, name: p.name, yours: p.needsYou }))}
          onPick={(id) => { setProjectId(id); setDock(null); go(Room.Board) }}
          onMore={() => setSwitcher(true)}
        />
        <ui.RoomSwitch value={room} onChange={go} news={unread > 0 && room === Room.Board} yours={live.length} />
      </ui.TitleBar>

      <main className={'rm-main' + (room === Room.Both ? ' is-both' : '')} key={room}>
        {talking && (
          <Talk
            side={room === Room.Both}
            said={said} answered={answered} dock={dock}
            onOpen={open} onSay={say} onStart={start} onStreamed={streamed}
            draft={draft} setDraft={setDraft}
            composerRef={composerRef}
            project={project} onRename={() => { setRenaming(true); setSwitcher(true) }}
          />
        )}
        {(room === Room.Board || room === Room.Both) && (
          <Board live={live} opened={opened} released={released} dock={dock} onOpen={open} />
        )}
      </main>

      {dock && (
        <Dock
          dock={dock} opened={opened}
          onClose={() => setDock(null)}
          onRecord={record}
          onLibrary={() => { setDock(null); setLibrary(true) }}
          floating={tight || room === Room.Both}
        />
      )}

      {library && <Knowledge project={project.name} onClose={() => setLibrary(false)} />}
      {task && <TaskView taskRef={task.ref} state={task.state} onClose={() => setTask(null)} running={runningCount} yours={live.length} onYours={openYours} />}
    </div>
  )
}

/* A project as the switcher shows it, from this prototype's data. */
const summary = (p) => ({ id: p.id, name: p.name, about: p.desc, where: p.repos || p.repo, yours: p.needsYou, running: p.active, touched: p.lastTouched })
