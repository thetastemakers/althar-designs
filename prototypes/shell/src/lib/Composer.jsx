import { useEffect, useState } from 'react'
import * as ui from '@charrette/ui'
import ModelPick from './ModelPick.jsx'
import { EFFORTS, MODELS, effortFor } from './Model.jsx'
import { model as info } from './models.js'
import { useDefaultEfforts } from './pins.js'

/* The one composer, for the project conversation and for a task, from
   @charrette/ui. This app wires its slots: the model picker with this
   conversation's effort, the context ring, and a stand-in for dictation. */
export default function Composer({
  value, onChange, onSubmit, onSendNow, placeholder, inputRef, hint,
  model, onModel, role, context, className = '', busy = false, above,
}) {
  /* effort starts at the model's default and this conversation can move it;
     changing model goes back to the new model's default */
  const defaults = useDefaultEfforts()
  const [override, setOverride] = useState(null)
  const levels = EFFORTS[MODELS[model]?.lab] || []
  const def = effortFor(model, defaults)
  const eff = levels.includes(override) ? override : def

  const [rec, setRec] = useState(null) // seconds while dictating
  useEffect(() => {
    if (rec === null) return
    const t = setInterval(() => setRec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [rec === null])

  return (
    <ui.Composer value={value} onChange={onChange} onSubmit={onSubmit} onSendNow={onSendNow} placeholder={placeholder} inputRef={inputRef}
      hint={hint} busy={busy} above={above || undefined} className={className} onStopAgent={() => {}}
      picker={<ModelPick value={model} effort={eff} defaultEffort={def} role={role}
        onChange={(id) => { setOverride(null); onModel(id) }} onEffort={setOverride} />}
      meter={context && <ui.ContextRing used={context.used} total={MODELS[model]?.ctx || 200} model={info(model)} note={context.note} />}
      dictation={{
        elapsed: rec === null ? null : `0:${String(rec).padStart(2, '0')}`,
        onStart: () => setRec(0),
        onStop: () => {
          setRec(null)
          onChange((value ? value.replace(/\s*$/, ' ') : '') + 'Also check the webhook retry path while you are in there.')
        },
      }} />
  )
}
