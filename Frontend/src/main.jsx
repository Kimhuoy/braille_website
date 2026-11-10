import React from 'react'
import ReactDOM from 'react-dom/client'
import { addCollection } from '@iconify/react'
import App from './App.jsx'
import iconSets from './data/icons.json'

// Icons ship with the website (scripts/build-icons.mjs) instead of loading from api.iconify.design
iconSets.forEach((set) => addCollection(set))
import './Styles/Tailwind.css';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
