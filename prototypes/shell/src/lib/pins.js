import { useSyncExternalStore } from 'react'

/* Pinned models: the short list every picker shows first. Pins are a
   preference of yours, not of a project, so they follow you everywhere.
   (Prototype: kept in this browser.) */
const KEY = 'charrette.pins'
const DEFAULT = ['claude-opus-5', 'gpt-5.2-codex', 'claude-sonnet-5']
let pins = (() => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : DEFAULT } catch { return DEFAULT }
})()
const subs = new Set()
const emit = () => { try { localStorage.setItem(KEY, JSON.stringify(pins)) } catch { /* private window */ } subs.forEach((f) => f()) }

export const togglePin = (id) => { pins = pins.includes(id) ? pins.filter((x) => x !== id) : [...pins, id]; emit() }
export const usePins = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => pins)

/* Default effort per model: what a new conversation with that model starts
   at. A conversation can still turn it up or down for itself. */
const EKEY = 'charrette.effort'
let efforts = (() => {
  try { const v = JSON.parse(localStorage.getItem(EKEY)); return v && typeof v === 'object' ? v : {} } catch { return {} }
})()
const esubs = new Set()
export const setDefaultEffort = (id, level) => {
  efforts = { ...efforts, [id]: level }
  try { localStorage.setItem(EKEY, JSON.stringify(efforts)) } catch { /* private window */ }
  esubs.forEach((f) => f())
}
export const useDefaultEfforts = () => useSyncExternalStore((f) => { esubs.add(f); return () => esubs.delete(f) }, () => efforts)
