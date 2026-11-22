import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { getMethodColor } from '../utils/formatters';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export function MethodSelect({
  value = 'GET',
  onChange,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentStyle = getMethodColor(value);

  // Close when clicking outside
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
    if (disabled) return;
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
        const idx = METHODS.indexOf(value);
        const next = (idx + 1) % METHODS.length;
        onChange(METHODS[next]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const idx = METHODS.indexOf(value);
        const prev = (idx - 1 + METHODS.length) % METHODS.length;
        onChange(METHODS[prev]);
      }
    }
  };

  const handleSelect = (m) => {
    onChange(m);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`h-10 pl-3 pr-2.5 rounded-lg font-bold text-xs font-mono border flex items-center justify-between gap-2 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40 select-none ${
          currentStyle.bg
        } ${currentStyle.text} ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
        }`}
        style={{ minWidth: '102px' }}
      >
        <span className="tracking-wide uppercase">{value}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-150 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute top-full left-0 mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-75 select-none"
        >
          <div className="px-2 py-1 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1">
            HTTP Method
          </div>
          <div className="space-y-0.5">
            {METHODS.map((m) => {
              const mColor = getMethodColor(m);
              const isSelected = m === value;

              return (
                <div
                  key={m}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(m)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold'
                  }`}
                >
                  <span className={`uppercase font-bold ${mColor.text}`}>{m}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
