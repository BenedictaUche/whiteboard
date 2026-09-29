import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { initAnalytics, trackEvent } from './lib/analytics';
import './index.css';
import { Analytics } from "@vercel/analytics/react";

initAnalytics();
trackEvent('page_view');

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

createRoot(document.getElementById('root')!).render(<StrictMode>
    <QueryClientProvider client={queryClient}>
        <Analytics />
        <App />
    </QueryClientProvider>
</StrictMode>);
