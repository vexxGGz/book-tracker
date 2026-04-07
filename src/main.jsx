import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Apply stored theme immediately so there is no flash of wrong theme during splash
const storedTheme = localStorage.getItem('appTheme');
if (storedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
