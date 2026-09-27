import * as ui from '@charrette/ui'
import { SourceKind, sourceBrand } from '@charrette/ui'

/* What the agent is listening to, from @charrette/ui. This app's sources
   name their kind; the package takes the mark. */
export default function Listening({ sources = [], flash, onStop, note, open = false, stay = false }) {
  return (
    <ui.Listening sources={sources.map((s) => ({ ...s, mark: sourceBrand(s.kind === 'github' ? SourceKind.GitHub : s.kind === 'linear' ? SourceKind.Linear : SourceKind.Ci) ?? undefined }))}
      heard={flash} onStop={onStop} note={note} defaultOpen={open} hold={stay} />
  )
}
