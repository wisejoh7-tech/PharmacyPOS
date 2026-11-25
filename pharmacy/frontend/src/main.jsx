import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import syncService from './services/syncService';
import { registerSW } from 'virtual:pwa-register';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Global Online/Offline Listeners
window.addEventListener('online', () => {
  console.log('App is online. Starting sync...');
  syncService.sync();
});

window.addEventListener('offline', () => {
  console.log('App is offline.');
});

// Initial sync check
if (navigator.onLine) {
  syncService.sync();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
