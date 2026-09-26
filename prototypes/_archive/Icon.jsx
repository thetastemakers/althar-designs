/* One icon set, one optical weight. 14px grid, 1.4 stroke, round caps.
   No icon exists here that is not used. */
const P = {
  project:   <><path d="M7 1.6 12.4 4.6v6L7 13.6 1.6 10.6v-6L7 1.6Z"/><path d="M1.7 4.7 7 7.6l5.3-2.9M7 7.6v5.9"/></>,
  work:      <><rect x="1.8" y="2.6" width="10.4" height="9" rx="1.6"/><path d="M4.4 5.9h5.2M4.4 8.3h3.2"/></>,
  execution: <><circle cx="3.2" cy="7" r="1.5"/><circle cx="10.8" cy="3.6" r="1.5"/><circle cx="10.8" cy="10.4" r="1.5"/><path d="M4.5 6.3 9.5 4.1M4.5 7.7l5 2.2"/></>,
  knowledge: <><path d="M2.4 3.1v7.4c0 .5.4.9.9.9H7V3.6a.9.9 0 0 0-.6-.9L3.6 2a.9.9 0 0 0-1.2.9Z"/><path d="M11.6 3.1v7.4c0 .5-.4.9-.9.9H7"/><path d="M11.6 3.1a.9.9 0 0 0-1.2-.9l-2.8.8a.9.9 0 0 0-.6.9"/></>,
  artifact:  <><path d="M8 1.7H4.2c-.8 0-1.4.6-1.4 1.4v7.8c0 .8.6 1.4 1.4 1.4h5.6c.8 0 1.4-.6 1.4-1.4V4.9L8 1.7Z"/><path d="M7.9 1.8v3.1h3.2"/></>,
  repo:      <><path d="M3.4 1.9h6.1c.6 0 1.1.5 1.1 1.1v9.1H4.5c-.6 0-1.1-.5-1.1-1.1V1.9Z"/><path d="M3.4 10.1h7.2"/></>,
  settings:  <><circle cx="7" cy="7" r="2"/><path d="M7 1.5v1.6M7 10.9v1.6M11.9 4.2l-1.4.8M3.5 9l-1.4.8M11.9 9.8l-1.4-.8M3.5 5l-1.4-.8"/></>,
  search:    <><circle cx="6.3" cy="6.3" r="4.1"/><path d="M9.4 9.4 12.2 12.2"/></>,
  chevron:   <path d="M5.2 2.8 9.4 7l-4.2 4.2"/>,
  chevronD:  <path d="M2.8 5.2 7 9.4l4.2-4.2"/>,
  arrow:     <><path d="M2.6 7h8.4"/><path d="M7.6 3.6 11 7l-3.4 3.4"/></>,
  check:     <path d="M2.8 7.3 5.6 10l5.6-6"/>,
  plus:      <><path d="M7 2.8v8.4M2.8 7h8.4"/></>,
  clock:     <><circle cx="7" cy="7" r="5.2"/><path d="M7 4.1V7l2 1.4"/></>,
  inbox:     <><path d="M1.9 7.6h2.9l.9 1.7h2.6l.9-1.7h2.9"/><path d="M3.3 2.6h7.4l1.4 5v3.1c0 .7-.5 1.2-1.2 1.2H3.1c-.7 0-1.2-.5-1.2-1.2V7.6l1.4-5Z"/></>,
  close:     <><path d="M3.4 3.4 10.6 10.6M10.6 3.4 3.4 10.6"/></>,
  panel:     <><rect x="1.8" y="2.6" width="10.4" height="8.8" rx="1.5"/><path d="M5.4 2.6v8.8"/></>,
  dot:       <circle cx="7" cy="7" r="1.6"/>,
  corner:    <><path d="M10.6 3v4.8c0 1-.8 1.8-1.8 1.8H3.1"/><path d="M5.5 7.2 3 9.6l2.5 2.4"/></>,
  branch:    <><circle cx="4" cy="3.4" r="1.6"/><circle cx="4" cy="10.6" r="1.6"/><circle cx="10.4" cy="4.6" r="1.6"/><path d="M4 5v4M5.6 3.8h1.6c1.2 0 1.6.5 1.7 1"/></>,
  time:      <><path d="M7 1.8v10.4"/><path d="M4.2 3.9h5.6M4.2 7h5.6M4.2 10.1h5.6"/></>,
}

export default function Icon({ name, size = 14, style, className }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 14 14"
      fill="none" stroke="currentColor" strokeWidth="1.35"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none', ...style }} className={className} aria-hidden="true"
    >
      {P[name]}
    </svg>
  )
}
