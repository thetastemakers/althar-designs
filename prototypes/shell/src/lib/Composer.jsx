import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import ModelPick from './ModelPick.jsx'
import { EFFORTS, MODELS, ctxLabel, effortFor } from './Model.jsx'
import { useDefaultEfforts } from './pins.js'

/* The one composer, for the project conversation and for a task.

   Two rows: what you are writing, then what it goes to. Enter sends,
   shift-enter breaks the line. The model, its effort, and how full its
   context is sit in the lower row where they are there when you look and
   quiet when you do not. */
export default function Composer({
  value, onChange, onSubmit, placeholder, inputRef, hint,
  model, onModel, role, context, className = '',
}) {
  const own = useRef(null)
  const ref = inputRef || own
  const [rec, setRec] = useState(null) // seconds while dictating

  /* effort starts at the model's default and this conversation can move it;
     changing model goes back to the new model's default */
  const defaults = useDefaultEfforts()
  const [override, setOverride] = useState(null)
  const levels = EFFORTS[MODELS[model]?.lab] || []
  const def = effortFor(model, defaults)
  const eff = levels.includes(override) ? override : def

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [value, ref])

  useEffect(() => {
    if (rec === null) return
    const t = setInterval(() => setRec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [rec === null])

  const stopDictating = () => {
    setRec(null)
    onChange((value ? value.replace(/\s*$/, ' ') : '') + 'Also check the webhook retry path while you are in there.')
    ref.current?.focus()
  }

  const submit = (e) => {
    e?.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <form className={'cz ' + className + (rec !== null ? ' is-rec' : '')} onSubmit={submit}>
      <textarea
        ref={ref} rows={1} value={value} placeholder={rec !== null ? 'Listening…' : placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e) }}
      />
      <div className="cz-bar">
        <ModelPick value={model} effort={eff} defaultEffort={def}
          onChange={(id) => { setOverride(null); onModel(id) }} onEffort={setOverride} role={role} />
        <span className="cz-sp" />
        {value.includes('\n') && <span className="cz-hint">⇧↵ new line</span>}
        {context && <ContextRing {...context} model={model} />}
        {rec !== null ? (
          <button type="button" className="cz-icon is-rec" onClick={stopDictating} title="Stop dictating">
            <span className="cz-rec-dot" />0:{String(rec).padStart(2, '0')}<Icon name="square" size={11} />
          </button>
        ) : (
          <button type="button" className="cz-icon" onClick={() => setRec(0)} title="Dictate">
            <Icon name="mic" size={14} />
          </button>
        )}
        {value.trim()
          ? <button className="cz-send" type="submit" title="Send  ↵"><Icon name="up" size={13} /></button>
          : <span className="kbd cz-kbd">{hint}</span>}
      </div>
    </form>
  )
}

/* How full the model's context is: a ring you can read at a glance and
   ignore otherwise. The detail is behind it, not beside it. */
function ContextRing({ used, note, model }) {
  const total = MODELS[model]?.ctx || 200
  const pct = Math.min(1, used / total)
  const r = 6, c = 2 * Math.PI * r
  return (
    <span className="cz-ctx" tabIndex={0} aria-label={`Context ${Math.round(pct * 100)}% used`}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r={r} className="cz-ctx-track" />
        <circle cx="8" cy="8" r={r} className="cz-ctx-fill" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 8 8)" />
      </svg>
      <span className="cz-ctx-pop">
        <span className="cz-ctx-top"><b>{Math.round(pct * 100)}%</b> of context</span>
        <span className="cz-ctx-bar"><i style={{ width: pct * 100 + '%' }} /></span>
        <span className="cz-ctx-n">{used}k of {ctxLabel(total)} · {MODELS[model]?.short}</span>
        {note && <span className="cz-ctx-note">{note}</span>}
      </span>
    </span>
  )
}
