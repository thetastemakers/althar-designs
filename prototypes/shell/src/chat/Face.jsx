import { useEffect, useState } from 'react'
import { TaskFace, Thread } from '@charrette/ui'
import Composer from '../lib/Composer.jsx'
import Listening from '../lib/Listening.jsx'
import { Streamed } from '../lib/Stream.jsx'
import { Arrived, DocPanel, Lightbox, Shell, Tool, Turn, You } from './parts.jsx'
import { StepPanel } from './steps.jsx'
import '../task/task.css'
import './chat.css'

/* A task's conversation face, built from the chat primitives.

   The layout is @charrette/ui's TaskFace: the thread scrolls and follows
   what arrives, the composer talks to the lead, and a step's thread or a
   document opens beside it. The side panel hears Escape before the task.

   What you send lands at the end of the thread. While the lead works it
   waits there, queued until the lead is done with what it is doing, or is
   sent now and interrupts it; otherwise the lead answers, and
   the answer streams in.

   `listen` is what the lead is listening to, and a script of what arrives
   while you watch: each beat can add a source, bring in an event from one,
   and have the lead answer it. */
export default function Face({ children, composer, busy, reply, listen }) {
  const [draft, setDraft] = useState('')
  const [doc, setDoc] = useState(null)
  const [step, setStep] = useState(null)
  const [steers, setSteers] = useState([])
  const [image, setImage] = useState(null)
  const [tail, setTail] = useState([])
  const [sources, setSources] = useState(listen?.sources || [])
  const [flash, setFlash] = useState(null)

  /* the script plays once, from when the task is opened */
  useEffect(() => {
    const timers = (listen?.script || []).map((b, i) => window.setTimeout(() => {
      if (b.listen) setSources((v) => [...v.filter((x) => x.id !== b.listen.id), b.listen])
      if (b.update) setSources((v) => v.map((x) => (x.id === b.update.id ? { ...x, ...b.update } : x)))
      if (b.flash) setFlash({ key: i, text: b.flash })
      if (b.arrive) setTail((v) => [...v, { id: listen.id + 'a' + i, type: 'arrive', ...b.arrive }])
      if (b.lead) setTail((v) => [...v, { id: listen.id + 'l' + i, type: 'lead', text: b.lead, tools: b.tools, delay: b.arrive ? 1400 : 0 }])
    }, b.at))
    return () => timers.forEach(window.clearTimeout)
  }, [listen])

  const send = (text) => {
    setDraft('')
    setTail((v) => [...v, { id: 'y' + v.length, type: 'you', text, queued: busy }])
    if (!busy) setTail((v) => [...v, { id: 'r' + v.length, type: 'lead', text: reply || 'Understood. I’ll take that into what I do next and say here what changed.', delay: 700 }])
  }
  /* sent now: the lead stops at a safe point, then carries on with both */
  const sendNow = (text) => {
    setDraft('')
    const id = 'y' + Date.now()
    setTail((v) => [...v, { id, type: 'you', text, interrupting: true }])
    window.setTimeout(() => {
      setTail((v) => [
        ...v.map((m) => (m.id === id ? { ...m, interrupting: false } : m)),
        { id: id + 'r', type: 'lead', text: 'Broke off once the test run finished, so nothing was left half done. Taking that into account, then carrying on with the rest.' },
      ])
    }, 1600)
  }

  return (
    <Shell.Provider value={{
      openDoc: (d) => { setStep(null); setDoc(d) },
      openImage: setImage,
      openStep: (st) => { setDoc(null); setStep(st) },
      steers,
      steer: (st, text) => setSteers((v) => [...v, { id: v.length + 1, step: st, text }]),
    }}>
      <TaskFace
        panel={doc ? <DocPanel doc={doc} onClose={() => setDoc(null)} /> : step ? <StepPanel key={step.id} step={step} onClose={() => setStep(null)} /> : undefined}
        composer={
          <Composer className="tv-composer" busy={busy} value={draft} onChange={setDraft} onSubmit={send} onSendNow={sendNow}
            hint="/" onModel={() => {}} {...composer}
            above={sources.length > 0 && (
              <Listening sources={sources} flash={flash} note={listen?.note}
                onStop={(id) => setSources((v) => v.filter((x) => x.id !== id))} />
            )} />
        }>
        {children}
        {tail.length > 0 && (
          <Thread label="Since you opened this" className="cs-flow cs-said">
            {tail.map((m) => <TailEntry key={m.id} m={m} lead={composer?.model} />)}
          </Thread>
        )}
      </TaskFace>
      {image && <Lightbox image={image} onClose={() => setImage(null)} />}
    </Shell.Provider>
  )
}

function TailEntry({ m, lead }) {
  if (m.type === 'you') return <You at="just now" queued={m.queued} interrupting={m.interrupting}>{m.text}</You>
  if (m.type === 'arrive') return <Arrived from={m.from} verb={m.verb} where={m.where} kind={m.kind} at="just now">{m.text}</Arrived>
  return <LeadAnswer m={m} lead={lead} />
}

/* The lead's answer: what it did, if anything, then what it says. */
function LeadAnswer({ m, lead }) {
  const [ready, setReady] = useState(!m.delay)
  useEffect(() => {
    if (!m.delay) return
    const t = window.setTimeout(() => setReady(true), m.delay)
    return () => window.clearTimeout(t)
  }, [m.delay])
  if (!ready) return null
  return (
    <Turn who={lead} at="just now">
      {m.tools?.map((t) => <Tool key={t.target} {...t} />)}
      <Streamed text={m.text} id={m.id} className="tv-msg-body cs-p" />
    </Turn>
  )
}
