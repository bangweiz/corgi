import React from 'react';
import { History, Trash2, X } from 'lucide-react';
import { getMethodColor, formatDuration, formatBytes, getStatusBadge } from '../utils/formatters';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function formatHistoryTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history = [],
  onSelectHistoryItem,
  onClearHistory,
  requestConfirm
}) {
  if (!isOpen) return null;

  // Only include requests during the last 24 hours
  const now = Date.now();
  const recentHistory = history.filter((item) => {
    const t = new Date(item.timestamp).getTime();
    return !isNaN(t) && now - t <= TWENTY_FOUR_HOURS_MS;
  });

  return (
    <aside className="w-80 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none z-20 transition-colors">
      {/* Header */}
      <div className="h-12 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <History className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Request History</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-mono font-medium">
            Last 24h
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({recentHistory.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {recentHistory.length > 0 && (
            <button
              onClick={() => {
                if (requestConfirm) {
                  requestConfirm({
                    title: 'Clear History',
                    message: 'Are you sure you want to clear all request history from local disk? This action cannot be undone.',
                    itemName: './data/history.json',
                    confirmText: 'Clear',
                    onConfirm: () => onClearHistory()
                  });
                } else if (confirm('Are you sure you want to clear request history?')) {
                  onClearHistory();
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {recentHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            No request history in the last 24 hours. Requests sent will be recorded to ./data/history.json automatically.
          </div>
        ) : (
          recentHistory.map((item) => {
            const mColor = getMethodColor(item.method);
            const statusBadge = getStatusBadge(item.status);
            const timeAgo = formatHistoryTime(item.timestamp);

            return (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem(item)}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase ${mColor.text}`}>
                    {item.method}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono px-1 rounded border ${statusBadge.bg}`}
                    >
                      {item.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {formatDuration(item.durationMs)}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate" title={item.url}>
                  {item.url}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <span>{timeAgo}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Storage Path Indicator */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-950/60">
        <div>📁 Storage: ./data/history.json (Last 24h only)</div>
      </div>
    </aside>
  );
}
