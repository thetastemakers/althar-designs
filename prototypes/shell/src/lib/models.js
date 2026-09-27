import { Lab, labBrand } from '@charrette/ui'
import { EFFORTS, MODELS } from './Model.jsx'

/* The prototype names models by id; @charrette/ui takes them resolved. This
   is the consumer's side of that: an id in, a ModelInfo out. Local models
   take their maker's mark. */
const LAB = { claude: Lab.Anthropic, openai: Lab.OpenAI, gemini: Lab.Google }
const MAKER = { 'qwen3-coder': Lab.Alibaba, 'devstral-small': Lab.Mistral }

const cache = new Map()
export function model(id) {
  if (!id) return undefined
  if (typeof id !== 'string') return id
  if (cache.has(id)) return cache.get(id)
  const m = MODELS[id]
  const lab = MAKER[id] ?? LAB[m?.lab]
  const info = m
    ? { id, name: m.name, short: m.short, mark: lab ? labBrand(lab) : undefined, runtime: m.via, context: m.ctx, efforts: EFFORTS[m.lab] ?? [], note: m.note }
    : { id, name: id, short: id, runtime: '', context: 0, efforts: [] }
  cache.set(id, info)
  return info
}

/* A step reference as the shell passes it around, with its model resolved. */
export const stepRef = (ref) => ref && { ...ref, model: model(ref.model) }
