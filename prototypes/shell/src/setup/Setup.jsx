import { useEffect, useRef, useState } from 'react'
import * as ui from '@charrette/ui'
import { RuntimeState, SourceOrigin } from '@charrette/ui'
import { connect, folders, roles, runtimes as found, signedIn } from '../data/setup.js'
import './setup.css'

/* Before a project: the first run (#start), which opens on the welcome,
   and making a project (#new). The kit draws all of it; this screen fakes
   the machine behind it: sign-ins that finish after a moment, a folder
   picker, reading a repository, a key going to the Keychain. */
export default function Setup({ first }) {
  const [step, setStep] = useState(first ? 'welcome' : 'new')
  const [runtimes, setRuntimes] = useState(found)
  const [sources, setSources] = useState([])
  const [name, setName] = useState('')
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (ms, f) => timers.current.push(setTimeout(f, ms))

  const runtime = (id, patch) => setRuntimes((now) => now.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const source = (id, f) => setSources((now) => now.map((x) => (x.id === id ? f(x) : x)))

  /* A folder arrives unread; reading it takes a moment and changes nothing. */
  const pick = (ids) => {
    setSources((now) => [...now, ...ids.filter((id) => !now.some((x) => x.id === id)).map((id) => ({ ...folders[id], branch: undefined, findings: undefined, reading: true }))])
    ids.forEach((id, i) => later(900 + i * 500, () => source(id, () => folders[id])))
  }

  const leave = () => (window.location.hash = '')

  /* the welcome has the whole window, the way a first launch should */
  if (step === 'welcome') return <div className="su-welcome"><ui.Welcome onDone={() => setStep('start')} /></div>

  return (
    <div className="su">
      <ui.TitleBar lights="drawn" className="su-chrome">
        {step === 'new' && first ? <ui.BackCrumb to="Charrette" onBack={() => setStep('start')} /> : <span />}
      </ui.TitleBar>
      <main className="su-page">
        {step === 'start' ? (
          <ui.Start
            runtimes={runtimes}
            onSignIn={(id) => {
              runtime(id, { state: RuntimeState.SigningIn })
              later(2200, () => runtime(id, { state: RuntimeState.Ready, ...signedIn[id] }))
            }}
            onCancel={(id) => runtime(id, { state: RuntimeState.SignedOut })}
            onCheck={(id) => {
              runtime(id, { state: RuntimeState.Checking })
              later(1100, () => runtime(id, { state: RuntimeState.Missing }))
            }}
            onHelp={() => {}}
            onAdd={() => {}}
            onCreate={() => {
              /* the system's folder picker would open here; these two come back */
              setName('Meridian')
              pick(['api', 'web'])
              setStep('new')
            }}
            connect={
              <ui.ConnectAgent
                options={connect}
                onHelp={() => {}}
                onKey={(id) => setRuntimes((now) => [...now, { id, name: connect.find((c) => c.id === id).name, brand: connect.find((c) => c.id === id).brand, state: RuntimeState.Ready, account: 'API key · in your Keychain' }])}
                onConnect={(id) => setRuntimes((now) => [...now, { id, name: 'Ollama', brand: connect.find((c) => c.id === id).brand, state: RuntimeState.Ready, account: 'This Mac · 3 models' }])}
                onCommand={(command) => setRuntimes((now) => [...now, { id: command, name: command.split(' ')[0], state: RuntimeState.Checking }])}
              />
            }
          />
        ) : (
          <div className="su-form">
            <ui.NewProject
              name={name}
              onNameChange={setName}
              sources={sources}
              roles={roles}
              onRoleChange={(id, role) => source(id, (x) => ({ ...x, role }))}
              onOriginChange={(id, origin) => source(id, (x) => ({ ...x, origin }))}
              onFindingChange={(id, f, value) =>
                source(id, (x) => ({ ...x, findings: x.findings.map((g) => (g.id === f ? { ...g, choice: { ...g.choice, value } } : g)) }))
              }
              onRemove={(id) => setSources((now) => now.filter((x) => x.id !== id))}
              onChooseFolders={() => pick(['api', 'web'])}
              onAddUrl={(url) => {
                const n = url.replace(/\.git$/, '').split('/').pop() || url
                setSources((now) => [...now, { id: n, name: n, where: url, origin: SourceOrigin.Clone, role: 'infrastructure' }])
              }}
              onCreate={leave}
              onCancel={() => (first ? setStep('start') : leave())}
            />
          </div>
        )}
      </main>
    </div>
  )
}
