import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initAnalytics, trackEvent } from './lib/analytics';
import './index.css';
import { Analytics } from "@vercel/analytics/react";
initAnalytics();
trackEvent('page_view');
createRoot(document.getElementById('root')!).render(<StrictMode>
    <Analytics />
    <App />
  </StrictMode>);
