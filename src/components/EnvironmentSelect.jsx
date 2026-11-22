import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Settings2, Globe, Trash2 } from 'lucide-react';

export function EnvironmentSelect({
  environments = [],
  activeEnvId = '',
  onSelectEnv,
  onDeleteEnv,
  requestConfirm,
  onOpenManage,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeEnv = useMemo(() => {
    return environments.find((e) => e.id === activeEnvId) || null;
  }, [environments, activeEnvId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const allIds = ['', ...environments.map((e) => e.id)];
        const currentIdx = allIds.indexOf(activeEnvId);
        const nextIdx = (currentIdx + 1) % allIds.length;
        onSelectEnv(allIds[nextIdx]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const allIds = ['', ...environments.map((e) => e.id)];
        const currentIdx = allIds.indexOf(activeEnvId);
        const prevIdx = (currentIdx - 1 + allIds.length) % allIds.length;
        onSelectEnv(allIds[prevIdx]);
      }
    }
  };

  const handleSelect = (id) => {
    onSelectEnv(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-sky-500/50 max-w-[220px]"
        title={activeEnv ? `Active Environment: ${activeEnv.name}` : 'No environment selected'}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
            activeEnv ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-400 dark:bg-slate-500'
          }`}
        />
        <span className="truncate">
          {activeEnv ? activeEnv.name : 'No Environment'}
        </span>
        {activeEnv && Array.isArray(activeEnv.variables) && (
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
            ({activeEnv.variables.length})
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-75 select-none"
        >
          {/* Menu Header */}
          <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>Switch Environment</span>
            </span>
            <span className="font-mono text-[10px]">{environments.length} {environments.length === 1 ? 'env' : 'envs'}</span>
          </div>

          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {/* Option: No Environment */}
            <div
              role="option"
              aria-selected={!activeEnvId}
              onClick={() => handleSelect('')}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                !activeEnvId
                  ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                <span className="truncate">No Environment</span>
              </div>
              {!activeEnvId && (
                <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              )}
            </div>

            {/* Environment List */}
            {environments.map((env) => {
              const isSelected = env.id === activeEnvId;
              const varCount = Array.isArray(env.variables) ? env.variables.length : 0;

              return (
                <div
                  key={env.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(env.id)}
                  className={`group w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <span className="truncate">{env.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {varCount} vars
                    </span>
                    {onDeleteEnv && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          if (requestConfirm) {
                            requestConfirm({
                              title: 'Delete Environment',
                              message: 'Are you sure you want to delete this environment file? All variables defined in it will be permanently removed.',
                              itemName: `${env.name}.json`,
                              confirmText: 'Delete',
                              onConfirm: () => onDeleteEnv(env.id)
                            });
                          } else if (confirm(`Are you sure you want to delete "${env.name}.json"?`)) {
                            onDeleteEnv(env.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
                        title="Delete environment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Management Link */}
          {onOpenManage && (
            <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenManage();
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 flex items-center gap-1.5 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 shrink-0" />
                <span>Manage Environments...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
