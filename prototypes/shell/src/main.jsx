import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import Rooms from './rooms/Rooms.jsx'
import Explore from './explore/Explore.jsx'
import './styles/paper.css'
import './styles/composer.css'

function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash === '#knowledge' ? <Explore /> : <Rooms />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)
