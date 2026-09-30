import React from 'react';
import ReactDOM from 'react-dom/client';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import App from './App';

// MapLibre 6 locates its web worker with a runtime-computed URL that bundlers can't follow,
// so hand it the worker Vite has bundled (with its shared chunk) instead.
setWorkerUrl(maplibreWorkerUrl);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
