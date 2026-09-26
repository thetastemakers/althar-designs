import { useLayoutEffect, useRef, useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { Dot, Findings, KRow, stepState } from './parts.jsx'
import { produced, used } from './data.js'
import Diff from './Diff.jsx'
import Model from '../lib/Model.jsx'

/* The graph, as an expansion rather than a face.

   One key away, never in the way. Open it to see the shape of the work:
   what ran beside what, what looped, which agent did each step, and which
   step a rule of yours added. It fits the window rather than asking you to
   scroll a diagram. */

const W = 152, H = 84, GAP = 32, ROW = 24, PAD = 30, TOP = 40

const Who = ({ id }) => id === 'coordinator'
  ? <span className="tv-coord">Coordinator</span>
  : <Model id={id} />

export default function Graph({ task, st, onClose }) {
  const [sel, setSel] = useState(null)
  const g = task.graph
  const node = g.find((n) => n.id === sel)
  const rows = Math.max(...g.map((n) => n.row || 0)) + 1
  const cols = Math.max(...g.map((n) => n.col))
  const x = (n) => PAD + (n.col - 1) * (W + GAP)
  const y = (n) => TOP + (n.row || 0) * (H + ROW)
  const subs = g.find((n) => n.sub)
  const loopFrom = g.find((n) => n.loop)
  const loopTo = loopFrom && g.find((n) => n.id === loopFrom.loop)
  const subY = TOP + rows * (H + ROW) + 40
  const width = PAD + cols * (W + GAP) - GAP + PAD
  const height = subs ? subY + subs.sub.length * 38 + 40 : TOP + rows * (H + ROW) + 70

  /* fit the plane to the room it has: smaller on a laptop, a little larger
     on a big screen, never so small the labels stop being text */
  const box = useRef(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(Math.max(0.78, Math.min(1.25, (el.clientWidth - 48) / width, (el.clientHeight - 48) / height)))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  const n = (s) => String(g.indexOf(s) + 1).padStart(2, '0')
  const added = g.filter((m) => m.byRule).length

  return (
    <div className="tv-graph">
      <div className="tv-graph-head">
        <span className="eyebrow">Graph</span>
        <span className="tv-graph-count">
          {g.length} steps
          {loopFrom && ' · 1 loop'}
          {added > 0 && ` · ${added} added by rule`}
          {subs && ` · ${subs.sub.length} sub-agents in ${subs.label}`}
          {task.id === 'session' && ' · 3 spikes off one frame'}
        </span>
        <span className="tv-legend">
          <span><Dot s="done" />done</span>
          <span><Dot s="running" />running</span>
          <span><Dot s="queued" />queued</span>
          <span><i className="tv-legend-rule" />added by rule</span>
        </span>
        <button className="tv-graph-close" onClick={onClose} title="Close  g">
          <Icon name="close" size={12} />
        </button>
      </div>

      <div className="tv-graph-body">
        <div className="tv-canvas-scroll" ref={box}>
          <div className="tv-canvas-fit" style={{ width: width * scale, height: height * scale }}>
            <div className="tv-canvas-plane" style={{ width, height, transform: `scale(${scale})` }}>
              <svg className="tv-wires" width={width} height={height}>
                {g.map((m) => (m.from || []).map((id) => {
                  const p = g.find((z) => z.id === id)
                  const done = st.done?.includes(p.id)
                  return <path key={m.id + id} className={'tv-wire' + (done ? ' is-done' : '')}
                    d={wire(x(p) + W, y(p) + H / 2, x(m), y(m) + H / 2)} />
                }))}
                {subs && (
                  <path className="tv-wire is-sub"
                    d={`M ${x(subs) + W / 2} ${y(subs) + H} V ${subY - 14} M ${x(subs) - 22} ${subY - 14} H ${x(subs) + W + 22}`} />
                )}
                {loopFrom && (
                  <path className="tv-wire is-loop"
                    d={`M ${x(loopFrom) + W / 2} ${y(loopFrom) + H} v 18 q 0 8 -8 8 H ${x(loopTo) + W / 2 + 8} q -8 0 -8 -8 V ${y(loopTo) + H}`} />
                )}
              </svg>

              {g.map((m) => {
                const s = stepState(st, m)
                return (
                  <button key={m.id}
                    className={'tv-node is-' + s + (sel === m.id ? ' is-sel' : '') + (m.byRule ? ' is-added' : '')}
                    style={{ left: x(m), top: y(m), width: W, height: H }}
                    onClick={() => setSel(sel === m.id ? null : m.id)}>
                    <span className="tv-node-top">
                      <span className="tv-node-n">{n(m)}</span>
                      <Dot s={s} />
                      <span className="tv-node-when">{s === 'done' ? m.took : s}</span>
                    </span>
                    <span className="tv-node-label">{m.label}</span>
                    <span className="tv-node-who">
                      {m.worker && <Who id={m.worker} />}
                      {m.byRule && <span className="tv-node-rule">by rule</span>}
                    </span>
                  </button>
                )
              })}

              {subs && (
                <>
                  <div className="tv-canvas-caption" style={{ left: x(subs) - 22, top: subY - 34 }}>in parallel</div>
                  {subs.sub.map((c, i) => (
                    <div key={c.id} className="tv-subnode" style={{ left: x(subs) - 22, top: subY + i * 38, width: W + 44 }}>
                      <span className="mono">{c.label}</span><span className="tv-subnode-t">{c.took}</span>
                    </div>
                  ))}
                </>
              )}

              {loopFrom && (
                <div className="tv-loop-tag" style={{ left: (x(loopTo) + x(loopFrom) + W) / 2, top: y(loopFrom) + H + 26 }}>
                  <Icon name="corner" size={10} />{loopFrom.loopNote}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="tv-panel">
          {!node ? <Summary task={task} st={st} onPick={setSel} /> : (
            <div className="tv-panel-body" key={node.id}>
              <div className="tv-panel-head">
                <span className="tv-panel-n">{n(node)}</span>
                <span className="tv-panel-label">{node.label}</span>
                <button className="tv-panel-close" onClick={() => setSel(null)}><Icon name="close" size={12} /></button>
              </div>
              <p className="tv-panel-meta">{node.worker && <Who id={node.worker} />}{node.took ? <span>· {node.took}</span> : null}</p>
              <p className="tv-panel-what">{node.what}</p>
              {node.byRule && <p className="tv-inserted">Added by your rule from 4 February: security review on any change to authentication files.</p>}
              {node.id === 'n1' && used.map((k) => <KRow key={k.id} k={k} />)}
              {node.out === 'diff' && <Diff mode="inline" branch={task.branch} />}
              {node.out === 'findings' && <Findings />}
              {node.id === 'n7' && produced.map((k) => <KRow key={k.id} k={k} />)}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* With nothing selected, the panel says who worked on this and how the time
   went, which is the question the graph is usually opened to answer. */
function Summary({ task, st, onPick }) {
  const g = task.graph
  const by = {}
  g.forEach((m) => { if (m.worker) (by[m.worker] ||= []).push(m) })
  return (
    <div className="tv-panel-body">
      <p className="tv-panel-line">{st.line}</p>
      <div className="eyebrow tv-panel-label2">Agents</div>
      <ul className="tv-agents">
        {Object.entries(by).map(([id, steps]) => (
          <li key={id}>
            <Who id={id} />
            {id === task.worker && <span className="tv-node-rule">lead</span>}
            <span className="tv-agents-n">{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
          </li>
        ))}
      </ul>
      <div className="eyebrow tv-panel-label2">Steps</div>
      <ol className="tv-steps">
        {g.map((m, i) => {
          const s = stepState(st, m)
          return (
            <li key={m.id}>
              <button className={'tv-step is-' + s} onClick={() => onPick(m.id)}>
                <span className="tv-node-n">{String(i + 1).padStart(2, '0')}</span>
                <Dot s={s} />
                <span className="tv-step-l">{m.label}</span>
                <span className="tv-step-t">{s === 'done' ? m.took : s}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {st.cost && <p className="tv-panel-cost">{st.elapsed} · {st.cost} at API prices</p>}
    </div>
  )
}

function wire(x1, y1, x2, y2) {
  const mid = x1 + (x2 - x1) / 2
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`
}
