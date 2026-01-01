import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/ui/App';
import { SettingsProvider } from './src/contexts/SettingsContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
);