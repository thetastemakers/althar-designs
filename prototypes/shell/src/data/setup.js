import { Brand, ConnectKind, RuntimeState, SourceOrigin } from '@charrette/ui'

/* What a first run finds on this Mac. */
export const runtimes = [
  { id: 'claude-code', name: 'Claude Code', brand: Brand.ClaudeCode, state: RuntimeState.Ready, account: 'you@meridian.dev · Max', version: '2.4.1' },
  { id: 'codex', name: 'Codex', brand: Brand.Codex, state: RuntimeState.SignedOut },
  { id: 'gemini-cli', name: 'Gemini CLI', brand: Brand.GeminiCli, state: RuntimeState.Missing },
]

/* Who Codex turns out to be signed in as, once its own sign-in finishes. */
export const signedIn = { codex: { account: 'you@meridian.dev · Pro', version: '0.52.0' } }

/* Every other way to reach an agent from this Mac. */
export const connect = [
  { id: 'cursor', name: 'Cursor', brand: Brand.Cursor, kind: ConnectKind.App, state: 'Not installed' },
  { id: 'copilot', name: 'GitHub Copilot', brand: Brand.GitHubCopilot, kind: ConnectKind.App, state: 'Not installed' },
  { id: 'anthropic', name: 'Anthropic API', brand: Brand.Anthropic, kind: ConnectKind.Key },
  { id: 'openai', name: 'OpenAI API', brand: Brand.OpenAI, kind: ConnectKind.Key },
  { id: 'openrouter', name: 'OpenRouter', brand: Brand.OpenRouter, kind: ConnectKind.Key },
  { id: 'ollama', name: 'Ollama', brand: Brand.Ollama, kind: ConnectKind.Local, state: 'Running · 3 models', ready: true },
  { id: 'lm-studio', name: 'LM Studio', brand: Brand.LMStudio, kind: ConnectKind.Local, state: 'Not running' },
]

export const roles = [
  { value: 'service', label: 'Service' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'library', label: 'Library' },
  { value: 'docs', label: 'Docs' },
  { value: 'other', label: 'Other' },
]

/* The folders the picker hands back, as they read once reading finishes. */
export const folders = {
  api: {
    id: 'api',
    name: 'meridian-api',
    where: '~/code/meridian-api',
    origin: SourceOrigin.Existing,
    branch: 'main',
    remote: 'github.com/meridian/api',
    role: 'service',
    findings: [{ id: 'dirty', text: 'Changes not yet committed on main. They stay as they are; tasks work in a worktree of their own.' }],
  },
  web: {
    id: 'web',
    name: 'meridian-web',
    where: '~/code/meridian-web',
    origin: SourceOrigin.Existing,
    branch: 'refund-status',
    remote: 'github.com/you/meridian-web',
    role: 'frontend',
    findings: [
      {
        id: 'fork',
        text: 'Its remote is your fork of meridian/web.',
        choice: {
          label: 'Where tasks open pull requests',
          options: [
            { value: 'upstream', label: 'Pull requests on meridian/web' },
            { value: 'fork', label: 'Pull requests on your fork' },
          ],
          value: 'upstream',
        },
      },
    ],
  },
}
