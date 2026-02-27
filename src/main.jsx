import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Get operator ID from URL params or data attribute
function getOperatorId() {
  // From URL: ?operator=UUID
  const params = new URLSearchParams(window.location.search);
  if (params.get('operator')) return params.get('operator');

  // From script tag: data-operator="UUID"
  const script = document.querySelector('script[data-operator]');
  if (script) return script.getAttribute('data-operator');

  // From container div: data-operator="UUID"
  const container = document.getElementById('ventara-widget');
  if (container) return container.getAttribute('data-operator');

  return null;
}

const operatorId = getOperatorId();
const root = document.getElementById('ventara-widget');

if (root && operatorId) {
  createRoot(root).render(
    <React.StrictMode>
      <App operatorId={operatorId} />
    </React.StrictMode>
  );
} else if (root) {
  root.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">Missing operator ID. Add ?operator=YOUR_ID to the URL.</p>';
}
