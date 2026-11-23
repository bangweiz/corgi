import React from 'react';
import { X, XCircle, Plus, FolderKanban } from 'lucide-react';
import { getMethodColor } from '../utils/formatters';

export function RequestTabsBar({
  tabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onCloseAllTabs,
  requestName = '',
  onChangeRequestName,
  onBlurRequestName,
  activeCollection = null,
  activeSubCollection = null
}) {
  return (
    <div className="flex items-center justify-between px-3 pt-1.5 bg-slate-100/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none transition-colors">
      {/* Left: Tabs List & New Tab */}
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const methodStyle = getMethodColor(tab.method);

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-lg cursor-pointer transition-all border-t-2 w-[200px] shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-sky-500 shadow-xs border-r border-l border-slate-200 dark:border-slate-800 font-medium'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border-transparent'
              }`}
              title={`${tab.method} ${tab.name || 'Untitled Request'}`}
            >
              <span className={`font-mono text-[10px] font-bold uppercase shrink-0 ${methodStyle.text}`}>
                {tab.method || 'GET'}
              </span>

              {isActive && onChangeRequestName ? (
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => onChangeRequestName(e.target.value)}
                  onBlur={onBlurRequestName}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Request Name"
                  className="bg-transparent font-medium text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-1 -my-0.5 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500 flex-1 min-w-0 truncate placeholder:text-slate-400"
                  title="Click to rename request"
                />
              ) : (
                <span className="truncate flex-1 min-w-0">
                  {tab.name || 'Untitled Request'}
                </span>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all shrink-0 ${
                  isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          type="button"
          onClick={onNewTab}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0 ml-1"
          title="New Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Close All Tabs Button */}
        {onCloseAllTabs && tabs.length > 0 && (
          <button
            type="button"
            onClick={onCloseAllTabs}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Close All Tabs"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right: Active Collection Association Badge */}
      {tabs.length > 0 && activeTabId && (
        <div className="flex items-center gap-1.5 shrink-0 ml-3 pl-3 pb-1 border-l border-slate-200 dark:border-slate-800 text-xs">
          {activeCollection ? (
            <span
              className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-medium font-mono truncate flex items-center gap-1 max-w-[260px]"
              title={`Collection: ${activeCollection.name}${activeSubCollection ? ' / ' + activeSubCollection.name : ''}`}
            >
              <FolderKanban className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {activeCollection.name}
                {activeSubCollection && (
                  <span className="opacity-75"> / {activeSubCollection.name}</span>
                )}
              </span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/60">
              Draft
            </span>
          )}
        </div>
      )}
    </div>
  );
}
