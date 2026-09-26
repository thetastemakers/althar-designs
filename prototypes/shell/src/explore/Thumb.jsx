/* Abstract wireframes for the picker. Not screenshots — the shape of what
   opens, so the four arguments can be told apart before any of them is. */
export default function Thumb({ dir }) {
  return (
    <svg className="ex-thumb" viewBox="0 0 108 52" aria-hidden="true">
      <rect className="ex-th-bg" x="0" y="0" width="108" height="52" rx="2" />
      {dir === 'register' && <Register />}
      {dir === 'dossier' && <Dossier />}
      {dir === 'queue' && <Queue />}
      {dir === 'trace' && <Trace />}
      {dir === 'ledger' && <Ledger />}
      {dir === 'desk' && <Desk />}
      {dir === 'deck' && <Deck />}
      {dir === 'rounds' && <Rounds />}
    </svg>
  )
}

/* Every claim, in columns, with the disputed one marked. */
function Register() {
  return (
    <>
      <rect className="ex-th-d" x="10" y="8" width="26" height="2" rx="1" />
      <rect className="ex-th-line" x="10" y="15" width="88" height="0.7" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect className="ex-th-b" x="10" y={19 + i * 5} width={i === 2 ? 40 : 34} height="2" rx="1" />
          {i === 2 && <rect className="ex-th-u" x="10" y={23} width="40" height="0.7" />}
          <rect className="ex-th-f" x="56" y={19 + i * 5} width="12" height="2" rx="1" />
          <rect className="ex-th-f" x="72" y={19 + i * 5} width="10" height="2" rx="1" />
          <rect className="ex-th-f" x="86" y={19 + i * 5} width="12" height="2" rx="1" />
        </g>
      ))}
    </>
  )
}

/* A document: one measure, prose, a marked passage. */
function Dossier() {
  return (
    <>
      <rect className="ex-th-d" x="30" y="8" width="34" height="2.6" rx="1.3" />
      <rect className="ex-th-line" x="30" y="15" width="48" height="0.7" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect className="ex-th-b" x="30" y={20 + i * 14} width="40" height="2" rx="1" />
          <rect className="ex-th-f" x="30" y={24 + i * 14} width="48" height="1.6" rx="0.8" />
          <rect className="ex-th-f" x="30" y={27.5 + i * 14} width="44" height="1.6" rx="0.8" />
        </g>
      ))}
      <rect className="ex-th-rule" x="27" y="33" width="0.8" height="11" />
      <rect className="ex-th-f" x="30" y="48" width="30" height="1.6" rx="0.8" />
    </>
  )
}

/* Four cards, each with something to answer. */
function Queue() {
  return (
    <>
      <rect className="ex-th-d" x="12" y="7" width="28" height="2.4" rx="1.2" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect className="ex-th-card" x="12" y={14 + i * 17} width="84" height="14" rx="2" />
          <rect className="ex-th-b" x="16" y={17 + i * 17} width="34" height="2" rx="1" />
          <circle className="ex-th-o" cx="17.5" cy="23.5" r="1.6" />
          <rect className="ex-th-f" x="22" y={22.5 + i * 17} width="30" height="1.6" rx="0.8" />
          <circle className="ex-th-o" cx="56.5" cy={23.5 + i * 17} r="1.6" />
          <rect className="ex-th-f" x="61" y={22.5 + i * 17} width="26" height="1.6" rx="0.8" />
        </g>
      ))}
      <rect className="ex-th-line" x="12" y="45" width="84" height="0.7" />
      <rect className="ex-th-f" x="12" y="48" width="38" height="1.6" rx="0.8" />
    </>
  )
}

/* A list, and one claim's spine beside it. */
function Trace() {
  return (
    <>
      <rect className="ex-th-rail" x="0" y="0" width="34" height="52" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} className={'ex-th-f' + (i === 1 ? ' is-sel' : '')} x="5" y={9 + i * 7} width="24" height="2" rx="1" />
      ))}
      <rect className="ex-th-b" x="42" y="9" width="44" height="2.4" rx="1.2" />
      <rect className="ex-th-line" x="42" y="17" width="56" height="0.7" />
      <rect className="ex-th-rule" x="43.6" y="24" width="0.8" height="21" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle className={'ex-th-o' + (i === 0 ? ' is-fill' : '')} cx="44" cy={24 + i * 10} r="2" />
          <rect className="ex-th-f" x="50" y={23 + i * 10} width="30" height="2" rx="1" />
        </g>
      ))}
    </>
  )
}

/* ---- The combinations ---------------------------------------------------
   Four places attention can sit relative to the record: in it, beside it,
   above it, in front of it. The thumbnails are that and nothing else. */

/* One table. Three rows carry a mark in the margin; the head carries a count. */
function Ledger() {
  return (
    <>
      <rect className="ex-th-d" x="10" y="7" width="22" height="2" rx="1" />
      <rect className="ex-th-card" x="10" y="12" width="88" height="7" rx="1.5" />
      <rect className="ex-th-b" x="14" y="15" width="3" height="2" rx="1" />
      <rect className="ex-th-f" x="20" y="15" width="26" height="2" rx="1" />
      <rect className="ex-th-f" x="86" y="15" width="8" height="2" rx="1" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          {(i === 1 || i === 3 || i === 5) && <rect className="ex-th-rule" x="7" y={23.5 + i * 4.6} width="0.8" height="3" />}
          <rect className={i === 1 || i === 3 || i === 5 ? 'ex-th-b' : 'ex-th-f'} x="10" y={24 + i * 4.6} width={i === 1 ? 38 : 32} height="2" rx="1" />
          <rect className="ex-th-f" x="58" y={24 + i * 4.6} width="12" height="2" rx="1" />
          <rect className="ex-th-f" x="76" y={24 + i * 4.6} width="18" height="2" rx="1" />
        </g>
      ))}
    </>
  )
}

/* The record keeps the width; the open items stand in the margin. */
function Desk() {
  return (
    <>
      <rect className="ex-th-rail" x="72" y="0" width="36" height="52" />
      <rect className="ex-th-d" x="8" y="8" width="20" height="2" rx="1" />
      <rect className="ex-th-line" x="8" y="14" width="58" height="0.7" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          {(i === 1 || i === 4) && <rect className="ex-th-rule" x="5" y={17.5 + i * 5} width="0.8" height="3" />}
          <rect className={i === 1 || i === 4 ? 'ex-th-b' : 'ex-th-f'} x="8" y={18 + i * 5} width="30" height="2" rx="1" />
          <rect className="ex-th-f" x="44" y={18 + i * 5} width="10" height="2" rx="1" />
          <rect className="ex-th-f" x="58" y={18 + i * 5} width="8" height="2" rx="1" />
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect className={'ex-th-card' + (i === 0 ? ' is-sel' : '')} x="78" y={8 + i * 14} width="24" height="11" rx="1.5" />
          <rect className="ex-th-b" x="81" y={11 + i * 14} width="14" height="2" rx="1" />
          <rect className="ex-th-f" x="81" y={15 + i * 14} width="18" height="1.6" rx="0.8" />
        </g>
      ))}
    </>
  )
}

/* Two panes, a hairline between, both scrolling. */
function Deck() {
  return (
    <>
      <rect className="ex-th-rail" x="0" y="0" width="108" height="24" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect className="ex-th-card" x={10 + i * 46} y="6" width="42" height="14" rx="2" />
          <rect className="ex-th-b" x={14 + i * 46} y="9" width="24" height="2" rx="1" />
          <circle className="ex-th-o" cx={15.5 + i * 46} cy="15.5" r="1.6" />
          <rect className="ex-th-f" x={20 + i * 46} y="14.5" width="24" height="1.6" rx="0.8" />
        </g>
      ))}
      <rect className="ex-th-line" x="0" y="24" width="108" height="0.9" />
      <rect className="ex-th-d" x="10" y="28" width="16" height="2" rx="1" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect className="ex-th-f" x="10" y={35 + i * 4.4} width="44" height="2" rx="1" />
          <rect className="ex-th-f" x="62" y={35 + i * 4.4} width="14" height="2" rx="1" />
          <rect className="ex-th-f" x="82" y={35 + i * 4.4} width="16" height="2" rx="1" />
        </g>
      ))}
    </>
  )
}

/* Two whole screens, one sequence: you come through the left to reach the right. */
function Rounds() {
  return (
    <>
      <rect className="ex-th-card" x="6" y="8" width="38" height="36" rx="2" />
      <rect className="ex-th-d" x="10" y="12" width="18" height="2" rx="1" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect className="ex-th-line" x="10" y={19 + i * 11} width="30" height="0.7" />
          <rect className="ex-th-b" x="10" y={22 + i * 11} width="24" height="2" rx="1" />
          <circle className="ex-th-o" cx="11.5" cy={28 + i * 11} r="1.6" />
          <rect className="ex-th-f" x="16" y={27 + i * 11} width="20" height="1.6" rx="0.8" />
        </g>
      ))}
      <rect className="ex-th-b" x="49" y="25.5" width="9" height="1" rx="0.5" />
      <rect className="ex-th-b" x="55.5" y="23" width="1" height="1" rx="0.5" transform="rotate(45 56 23.5)" />
      <rect className="ex-th-b" x="54" y="22.5" width="4.4" height="1" rx="0.5" transform="rotate(45 56.2 23)" />
      <rect className="ex-th-b" x="54" y="27.5" width="4.4" height="1" rx="0.5" transform="rotate(-45 56.2 28)" />
      <rect className="ex-th-rail" x="63" y="8" width="39" height="36" rx="2" />
      <rect className="ex-th-d" x="67" y="12" width="16" height="2" rx="1" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect className={i === 0 ? 'ex-th-b' : 'ex-th-f'} x="67" y={19 + i * 5} width="20" height="2" rx="1" />
          <rect className="ex-th-f" x="91" y={19 + i * 5} width="8" height="2" rx="1" />
        </g>
      ))}
    </>
  )
}
