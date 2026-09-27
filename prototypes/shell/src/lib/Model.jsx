import { BrandMark, Lab, labBrand, Model as UiModel, WithModels as UiWithModels } from '@charrette/ui'
import { model } from './models.js'

/* Models: which lab a worker comes from, and the runtimes that drive them.
   The drawings are @charrette/ui's. */
const LAB_BRAND = { claude: labBrand(Lab.Anthropic), openai: labBrand(Lab.OpenAI), gemini: labBrand(Lab.Google) }


/* Where a model comes from on this machine: the agent runtime Charrette
   drives it through, and how that runtime is signed in. Status, not pitch. */
export const CONNECTIONS = [
  { id: 'claude-code', name: 'Claude Code', how: 'signed in', lab: 'claude' },
  { id: 'codex', name: 'Codex', how: 'signed in', lab: 'openai' },
  { id: 'gemini-cli', name: 'Gemini CLI', how: 'API key', lab: 'gemini' },
  { id: 'ollama', name: 'Ollama', how: 'this Mac', lab: 'local' },
]

/* Effort, in each runtime's own words. A model with none gets no control. */
export const EFFORTS = {
  claude: ['Low', 'Medium', 'High', 'Max'],
  openai: ['Low', 'Medium', 'High', 'Extra high'],
  gemini: ['Low', 'High'],
  local: [],
}

/* A model's default effort: yours if you set one, else High where the
   runtime has it, else its top level. */
export function effortFor(id, defaults = {}) {
  const levels = EFFORTS[MODELS[id]?.lab] || []
  if (!levels.length) return null
  if (levels.includes(defaults[id])) return defaults[id]
  return levels.includes('High') ? 'High' : levels[levels.length - 1]
}

/* Every model the connected runtimes offer, by id. */
export const MODELS = {
  'claude-opus-5':   { name: 'Claude Opus 5',   short: 'Opus 5',   lab: 'claude', via: 'claude-code', ctx: 1000, note: 'Largest Claude' },
  'claude-sonnet-5': { name: 'Claude Sonnet 5', short: 'Sonnet 5', lab: 'claude', via: 'claude-code', ctx: 1000 },
  'claude-haiku-4-5':{ name: 'Claude Haiku 4.5',short: 'Haiku 4.5',lab: 'claude', via: 'claude-code', ctx: 200 },
  'gpt-5.2':         { name: 'GPT-5.2',         short: 'GPT-5.2',  lab: 'openai', via: 'codex', ctx: 400 },
  'gpt-5.2-codex':   { name: 'GPT-5.2 Codex',   short: 'Codex',    lab: 'openai', via: 'codex', ctx: 400, note: 'Tuned for agentic coding' },
  'gpt-5-mini':      { name: 'GPT-5 mini',      short: 'GPT-5 mini', lab: 'openai', via: 'codex', ctx: 400 },
  'gemini-3-pro':    { name: 'Gemini 3 Pro',    short: 'Gemini 3 Pro', lab: 'gemini', via: 'gemini-cli', ctx: 1000 },
  'gemini-3-flash':  { name: 'Gemini 3 Flash',  short: 'Gemini 3 Flash', lab: 'gemini', via: 'gemini-cli', ctx: 1000 },
  'qwen3-coder':     { name: 'Qwen3 Coder 30B', short: 'Qwen3 Coder', lab: 'local', via: 'ollama', ctx: 256 },
  'devstral-small':  { name: 'Devstral Small',  short: 'Devstral', lab: 'local', via: 'ollama', ctx: 128 },
}
export const ctxLabel = (k) => (k >= 1000 ? `${k / 1000}M` : `${k}k`)

/* Marks and names come from @charrette/ui; `model` resolves an id. The
   class keeps this app's `.model` rules working where a view restyles it. */
export function Mark({ lab, size = 12 }) {
  const brand = LAB_BRAND[lab]
  return brand ? <BrandMark brand={brand} size={size} /> : null
}

export default function Model({ id, short, className = '' }) {
  return <UiModel model={model(id)} short={short} className={'model ' + className} />
}

const ALL = Object.keys(MODELS)
export function WithModels({ children }) {
  return <UiWithModels models={ALL.map(model)}>{children}</UiWithModels>
}
