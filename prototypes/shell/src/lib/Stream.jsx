import { Stream as UiStream, Streamed as UiStreamed } from '@charrette/ui'

/* A message arriving a word at a time, from @charrette/ui. This app names
   the text `text`; the package calls it `content`. */
export default function Stream({ text, ...rest }) {
  return <UiStream content={text} {...rest} />
}

export function Streamed({ text, ...rest }) {
  return <UiStreamed content={text} {...rest} />
}
