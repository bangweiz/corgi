/**
 * API service for communication with the local backend proxy.
 */

export const api = {
  // Collections
  getCollections: async () => {
    const res = await fetch('/api/collections');
    return res.json();
  },
  saveCollection: async (collection) => {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collection)
    });
    return res.json();
  },
  deleteCollection: async (id) => {
    const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Environments
  getEnvironments: async () => {
    const res = await fetch('/api/environments');
    return res.json();
  },
  saveEnvironment: async (environment) => {
    const res = await fetch('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(environment)
    });
    return res.json();
  },
  deleteEnvironment: async (id) => {
    const res = await fetch(`/api/environments/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // History
  getHistory: async () => {
    const res = await fetch('/api/history');
    return res.json();
  },
  deleteHistory: async () => {
    const res = await fetch('/api/history', { method: 'DELETE' });
    return res.json();
  },

  // Storage info
  getStorageInfo: async () => {
    const res = await fetch('/api/storage-info');
    return res.json();
  },

  // Proxy request
  sendProxyRequest: async (payload) => {
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
