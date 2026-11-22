import { useState, useCallback } from 'react';
import { api } from '../services/api';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const filterRecentHistory = (list) => {
  if (!Array.isArray(list)) return [];
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
  return list.filter((item) => {
    const t = new Date(item.timestamp).getTime();
    return !isNaN(t) && t >= cutoff;
  });
};

export function useHistory() {
  const [history, setHistory] = useState([]);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await api.getHistory();
      if (Array.isArray(data)) {
        setHistory(filterRecentHistory(data));
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  const handleClearHistory = useCallback(async () => {
    try {
      await api.deleteHistory();
      setHistory([]);
    } catch (err) {
      alert(`Failed to clear history: ${err.message}`);
    }
  }, []);

  return {
    history,
    setHistory,
    refreshHistory,
    handleClearHistory
  };
}
