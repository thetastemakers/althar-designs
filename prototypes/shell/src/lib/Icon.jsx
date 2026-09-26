/* One icon set, one optical weight. 14px grid, 1.4 stroke, round caps.
   No icon exists here that is not used. */
const P = {
  work:      <><rect x="1.8" y="2.6" width="10.4" height="9" rx="1.6"/><path d="M4.4 5.9h5.2M4.4 8.3h3.2"/></>,
  knowledge: <><path d="M2.4 3.1v7.4c0 .5.4.9.9.9H7V3.6a.9.9 0 0 0-.6-.9L3.6 2a.9.9 0 0 0-1.2.9Z"/><path d="M11.6 3.1v7.4c0 .5-.4.9-.9.9H7"/><path d="M11.6 3.1a.9.9 0 0 0-1.2-.9l-2.8.8a.9.9 0 0 0-.6.9"/></>,
  artifact:  <><path d="M8 1.7H4.2c-.8 0-1.4.6-1.4 1.4v7.8c0 .8.6 1.4 1.4 1.4h5.6c.8 0 1.4-.6 1.4-1.4V4.9L8 1.7Z"/><path d="M7.9 1.8v3.1h3.2"/></>,
  chevron:   <path d="M5.2 2.8 9.4 7l-4.2 4.2"/>,
  chevronD:  <path d="M2.8 5.2 7 9.4l4.2-4.2"/>,
  arrow:     <><path d="M2.6 7h8.4"/><path d="M7.6 3.6 11 7l-3.4 3.4"/></>,
  close:     <><path d="M3.4 3.4 10.6 10.6M10.6 3.4 3.4 10.6"/></>,
  corner:    <><path d="M10.6 3v4.8c0 1-.8 1.8-1.8 1.8H3.1"/><path d="M5.5 7.2 3 9.6l2.5 2.4"/></>,
  check:     <path d="M2.9 7.3 5.7 10l5.4-6"/>,
  answer:    <><path d="M2.4 3.8c0-.8.6-1.4 1.4-1.4h6.4c.8 0 1.4.6 1.4 1.4v4.4c0 .8-.6 1.4-1.4 1.4H6.4L3.9 11.6V9.6h-.1c-.8 0-1.4-.6-1.4-1.4Z"/></>,
  stop:      <><circle cx="7" cy="7" r="4.6"/><path d="M3.8 10.2 10.2 3.8"/></>,
  hold:      <path d="M5.2 3.6v6.8M8.8 3.6v6.8"/>,
  plus:      <path d="M7 3.4v7.2M3.4 7h7.2"/>,
  branch:    <><circle cx="4" cy="3.4" r="1.6"/><circle cx="4" cy="10.6" r="1.6"/><circle cx="10.4" cy="4.6" r="1.6"/><path d="M4 5v4M5.6 3.8h1.6c1.2 0 1.6.5 1.7 1"/></>,
  pin:       <><path d="M8.6 2.2 11.8 5.4 9.9 6.4 8.3 9.9 4.1 5.7 7.6 4.1Z"/><path d="M6.2 7.8 2.6 11.4"/></>,
  mic:       <><rect x="5" y="1.8" width="4" height="6.8" rx="2"/><path d="M3 6.8a4 4 0 0 0 8 0M7 10.8v1.6"/></>,
  search:    <><circle cx="6.2" cy="6.2" r="3.9"/><path d="m9.1 9.1 2.8 2.8"/></>,
  square:    <rect x="3.6" y="3.6" width="6.8" height="6.8" rx="1.4"/>,
  pencil:    <><path d="M9.2 2.6 11.4 4.8 5 11.2 2.4 11.6 2.8 9Z"/><path d="M8 3.8 10.2 6"/></>,
  more:      <><circle cx="3.2" cy="7" r=".9"/><circle cx="7" cy="7" r=".9"/><circle cx="10.8" cy="7" r=".9"/></>,
  gear:      <><circle cx="7" cy="7" r="1.9"/><path d="M7 1.8v1.6M7 10.6v1.6M1.8 7h1.6M10.6 7h1.6M3.3 3.3l1.1 1.1M9.6 9.6l1.1 1.1M3.3 10.7l1.1-1.1M9.6 4.4l1.1-1.1"/></>,
  up:        <><path d="M7 11.4V2.8"/><path d="M3.6 6.2 7 2.8l3.4 3.4"/></>,
  clock:     <><circle cx="7" cy="7" r="4.8"/><path d="M7 4.4V7l1.8 1.2"/></>,
  after:     <><circle cx="3.6" cy="7" r="1.5"/><path d="M5.1 7h6"/><path d="M8.8 4.8 11.1 7l-2.3 2.2"/></>,
  external:  <><path d="M5.6 3H3.8c-.5 0-.8.3-.8.8v6.4c0 .5.3.8.8.8h6.4c.5 0 .8-.3.8-.8V8.4"/><path d="M8 3h3v3M11 3 6.6 7.4"/></>,
  pr:        <><circle cx="3.8" cy="3.4" r="1.5"/><circle cx="3.8" cy="10.6" r="1.5"/><circle cx="10.2" cy="10.6" r="1.5"/><path d="M3.8 4.9v4.2M10.2 9.1V5.6c0-.8-.6-1.4-1.4-1.4H6.4"/><path d="M7.6 3 6.4 4.2l1.2 1.2"/></>,
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
