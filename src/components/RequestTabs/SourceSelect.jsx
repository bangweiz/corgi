import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Braces, ListFilter } from 'lucide-react';

const SOURCE_OPTIONS = [
  {
    id: 'body',
    label: 'Body',
    icon: Braces,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-500/10'
  },
  {
    id: 'header',
    label: 'Header',
    icon: ListFilter,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10'
  }
];

export function SourceSelect({
  value = 'body',
  onChange,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentOption = SOURCE_OPTIONS.find((opt) => opt.id === value) || SOURCE_OPTIONS[0];
  const IconComponent = currentOption.icon;

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

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextId = value === 'body' ? 'header' : 'body';
      onChange(nextId);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full h-8 px-2.5 py-1 rounded-md text-xs font-medium flex items-center justify-between gap-1.5 transition-all border shadow-xs select-none ${
          isOpen
            ? 'bg-white dark:bg-slate-900 border-sky-500 ring-2 ring-sky-500/20'
            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className={`p-0.5 rounded ${currentOption.bg}`}>
            <IconComponent className={`w-3.5 h-3.5 ${currentOption.color} shrink-0`} />
          </span>
          <span className="font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {currentOption.label}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[140px] z-50 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          {SOURCE_OPTIONS.map((opt) => {
            const ItemIcon = opt.icon;
            const isSelected = opt.id === value;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`p-0.5 rounded ${opt.bg}`}>
                    <ItemIcon className={`w-3.5 h-3.5 ${opt.color} shrink-0`} />
                  </span>
                  <span className="font-mono whitespace-nowrap">{opt.label}</span>
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 ml-1.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
