import React from 'react';
import { Database, FolderKanban, History, Terminal, Sun, Moon, Send, Settings2 } from 'lucide-react';
import { EnvironmentSelect } from './EnvironmentSelect';

export function Header({
  environments = [],
  activeEnvId = '',
  onSelectEnv,
  onDeleteEnv,
  requestConfirm,
  mainView = 'request',
  onSwitchView,
  toggleSidebar,
  isSidebarOpen,
  toggleHistory,
  isHistoryOpen,
  storageInfo,
  theme = 'dark',
  onToggleTheme
}) {
  return (
    <header className="relative z-30 h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none transition-colors">
      {/* Left brand & collection toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded-md border text-xs flex items-center gap-1.5 transition-colors ${
            isSidebarOpen
              ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-400 font-medium'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
          }`}
          title="Toggle collections sidebar"
        >
          <FolderKanban className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="hidden sm:inline">Collections</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:border-slate-800" />

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 dark:border-sky-500/40 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">Corgi API</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 font-medium">
                Node Proxy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: View Switcher & Environment Selector */}
      <div className="flex items-center space-x-3">
        {/* Workspace View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-lg p-0.5 text-xs border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <button
            onClick={() => onSwitchView && onSwitchView('request')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors font-medium ${
              mainView === 'request'
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request</span>
          </button>
          <button
            onClick={() => onSwitchView && onSwitchView('environment')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors font-medium ${
              mainView === 'environment'
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Environments</span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-500">
              {environments.length}
            </span>
          </button>
        </div>

        {/* Environment Selector Dropdown */}
        <div className="relative z-30 flex items-center bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg p-0.5 text-xs shadow-xs">
          <EnvironmentSelect
            environments={environments}
            activeEnvId={activeEnvId}
            onSelectEnv={onSelectEnv}
            onDeleteEnv={onDeleteEnv}
            requestConfirm={requestConfirm}
            onOpenManage={() => onSwitchView && onSwitchView('environment')}
          />
          <button
            onClick={() => onSwitchView && onSwitchView(mainView === 'environment' ? 'request' : 'environment')}
            className={`px-2 py-1 rounded text-xs transition-colors font-medium ${
              mainView === 'environment'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
            title={mainView === 'environment' ? 'Back to request debugging' : 'Manage environment variables'}
          >
            {mainView === 'environment' ? 'Back' : 'Manage'}
          </button>
        </div>

        {/* Local Storage Indicator */}
        <div
          className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/70"
          title={`Local storage directory: ${storageInfo?.dataDir || './data'} (.json)`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">./data</span>
          <span className="text-slate-400 dark:text-slate-500">(.json)</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Request History Button */}
        <button
          onClick={toggleHistory}
          className={`p-1.5 rounded-md border text-xs flex items-center transition-colors shadow-xs ${
            isHistoryOpen
              ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/50 text-sky-700 dark:text-sky-400'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
          }`}
          title="View request history"
        >
          <History className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
