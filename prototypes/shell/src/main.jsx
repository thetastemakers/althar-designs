import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
/* the package's tokens and base first, so this app's own styles win where they overlap */
import '@charrette/ui/styles.css'
import './styles/base.css'
import Rooms from './rooms/Rooms.jsx'
import Explore from './explore/Explore.jsx'
import Specimen from './chat/Specimen.jsx'
import Setup from './setup/Setup.jsx'
import './styles/paper.css'
import './styles/composer.css'

function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  /* #chat is the chat-states specimen, #knowledge the old exploration, #start the first run, #new a new project */
  if (hash === '#start' || hash === '#new') return <Setup key={hash} first={hash === '#start'} />
  return hash.startsWith('#chat') ? <Specimen /> : hash === '#knowledge' ? <Explore /> : <Rooms />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)
