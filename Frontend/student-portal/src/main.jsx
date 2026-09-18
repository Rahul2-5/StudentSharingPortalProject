import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            border: '1px solid #e3e8f0',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#172033',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 12px 30px -18px rgba(15, 23, 42, 0.45)',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
