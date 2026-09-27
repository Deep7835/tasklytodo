import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';
import { Blog } from './blog/Blog';
import { StoreProvider } from './store/store';
import { ToastProvider } from './components/Toast';

// Service worker: precaches the whole app so it works offline and updates silently in the background.
if (import.meta.env.PROD) registerSW({ immediate: true });

// The blog lives at /blog as its own page; everything else is the app.
const isBlog = /^\/blog(\/|$)/.test(location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isBlog ? (
      <Blog path={location.pathname} />
    ) : (
      <StoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    )}
  </StrictMode>,
);
