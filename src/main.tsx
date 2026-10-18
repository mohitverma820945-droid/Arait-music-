import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global handler to suppress cosmetic preview environment errors
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message || '';
  if (
    msg.includes('WebSocket closed without opened') ||
    msg.includes('interrupted by a new load request') ||
    msg.includes('The play() request was interrupted')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
