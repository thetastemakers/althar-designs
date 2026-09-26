import { useEffect, useRef, useState } from 'react'

/* Global key handler. Ignores keystrokes aimed at a text field so the
   composer never fights the shell. */
export function useKey(handler, deps = []) {
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      handler(e, typing)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* Dismiss on outside click / Escape. */
export function useDismiss(open, onClose) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, onClose])
  return ref
}

/* Reports the shell's own width so directions can respond to a compact
   window rather than to the viewport. */
export function useCompact(threshold = 1180) {
  const [compact, setCompact] = useState(() => window.innerWidth < threshold)
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < threshold)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [threshold])
  return compact
}
