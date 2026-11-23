import { useState, useCallback } from 'react';

export function useRequestTabs() {
  const [tabs, setTabs] = useState([]);

  const addOrUpdateTab = useCallback((tabData) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabData.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...tabData };
        return next;
      }
      return [...prev, tabData];
    });
  }, []);

  const updateTab = useCallback((id, updates) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const removeTab = useCallback(
    (tabId, currentActiveId) => {
      const idx = tabs.findIndex((t) => t.id === tabId);
      const nextTabs = tabs.filter((t) => t.id !== tabId);
      let nextActiveId = currentActiveId;

      const isCurrentClosed = currentActiveId === tabId;
      if (isCurrentClosed) {
        if (nextTabs.length > 0) {
          const nextIdx = Math.max(0, Math.min(idx, nextTabs.length - 1));
          nextActiveId = nextTabs[nextIdx].id;
        } else {
          nextActiveId = null;
        }
      }

      setTabs(nextTabs);
      return { nextTabs, nextActiveId, isCurrentClosed };
    },
    [tabs]
  );

  return {
    tabs,
    setTabs,
    addOrUpdateTab,
    updateTab,
    removeTab
  };
}
