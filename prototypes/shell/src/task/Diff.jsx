import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { diff } from './data.js'

/* One diff renderer, three presentations: an object inside a reading column,
   a zone inside a layout, or the whole window.

   Additions and deletions are not green and red. The product has exactly one
   saturated colour and it means "a human is needed"; machine output does not
   get to borrow it. Changed lines are separated by weight and a cool tint. */

export default function Diff({ mode = 'zone', branch = 'working copy', onExpand, onClose }) {
  const [file, setFile] = useState(diff.files[0].path)
  const [open, setOpen] = useState(mode !== 'inline')
  const current = diff.files.find((f) => f.path === file)

  if (mode === 'inline' && !open) {
    return (
      <button className="tv-diff-stub" onClick={() => setOpen(true)}>
        <Icon name="chevron" size={11} className="tv-caret" />
        <span className="mono tv-diff-stub-branch">{branch}</span>
        <span className="tv-diff-stub-stat">{diff.stat}</span>
      </button>
    )
  }

  return (
    <div className={'tv-diff is-' + mode}>
      <div className="tv-diff-head">
        <span className="mono tv-diff-branch">{branch}</span>
        <span className="tv-diff-stat">{diff.stat}</span>
        {mode === 'inline' && (
          <button className="tv-diff-act" onClick={() => setOpen(false)}>Collapse</button>
        )}
        {onExpand && <button className="tv-diff-act" onClick={onExpand}>Open full width</button>}
        {onClose && (
          <button className="tv-diff-act tv-diff-close" onClick={onClose} title="Close  Esc">
            <Icon name="close" size={12} />
          </button>
        )}
      </div>

      <div className="tv-diff-body">
        <div className="tv-diff-files">
          {diff.files.map((f) => (
            <button key={f.path} className={'tv-file' + (f.path === file ? ' is-on' : '')}
              onClick={() => setFile(f.path)}>
              <span className="tv-file-path mono">{f.path}</span>
              <span className="tv-file-stat mono">
                <i className="is-add">+{f.add}</i><i className="is-del">−{f.del}</i>
              </span>
            </button>
          ))}
        </div>

        <div className="tv-diff-code" key={file}>
          {current.hunks.length === 0 ? (
            <p className="tv-diff-none">No hunks retained for this file in the prototype.</p>
          ) : current.hunks.map((h) => (
            <div className="tv-hunk" key={h.at}>
              <div className="mono tv-hunk-at">{h.at}</div>
              {h.lines.map(([sign, text], i) => (
                <div key={i} className={'mono tv-line is-' + (sign.trim() === '+' ? 'add' : sign.trim() === '-' ? 'del' : 'ctx')}>
                  <span className="tv-line-sign">{sign.trim() || ' '}</span>
                  <span className="tv-line-text">{text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
