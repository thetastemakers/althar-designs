import { useState } from 'react'
import * as ui from '@charrette/ui'
import { Brand } from '@charrette/ui'
import { CONNECTIONS, MODELS, effortFor } from './Model.jsx'
import { model } from './models.js'
import { setDefaultEffort, togglePin, useDefaultEfforts, usePins } from './pins.js'

/* Which model sits behind a conversation, and how hard it thinks, from
   @charrette/ui. Pins and default efforts are this app's (pins.js); the
   browser opens from the picker's last row. */
export default function ModelPick({ value, effort, defaultEffort, onChange, onEffort, role, variant, placement }) {
  const pins = usePins()
  const [browse, setBrowse] = useState(false)
  return (
    <>
      <ui.ModelPick model={model(value)} pinned={pins.map(model)} effort={effort} defaultEffort={defaultEffort}
        onChange={onChange} onEffort={onEffort} onMakeDefault={(level) => setDefaultEffort(value, level)}
        onBrowse={() => setBrowse(true)} count={Object.keys(MODELS).length} owner={role} variant={variant} placement={placement} />
      {browse && <ModelBrowser value={value} role={role} onClose={() => setBrowse(false)}
        onPick={(id) => { setBrowse(false); if (id !== value) onChange(id) }} />}
    </>
  )
}

const BRAND = { 'claude-code': Brand.ClaudeCode, codex: Brand.Codex, 'gemini-cli': Brand.GeminiCli, ollama: Brand.Ollama }
const RUNTIMES = CONNECTIONS.map((c) => ({ id: c.id, name: c.name, how: c.how, brand: BRAND[c.id] }))
const ALL = Object.keys(MODELS)

/* Every model every connected runtime offers, searchable, with pins. */
export function ModelBrowser({ value, role, onPick, onClose }) {
  const pins = usePins()
  const defaults = useDefaultEfforts()
  return (
    <ui.ModelBrowser models={ALL.map(model)} runtimes={RUNTIMES} value={value} pins={pins}
      defaultEffort={(m) => effortFor(m.id, defaults)} onPick={onPick} onClose={onClose}
      onTogglePin={togglePin} onSetDefaultEffort={setDefaultEffort} onConnect={() => {}}
      text={{ search: `Models for ${role.toLowerCase()}` }} />
  )
}
