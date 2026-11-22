import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertCircle, Save, Loader2 } from 'lucide-react';

export function EnvVariableTooltip({
  hoveredVar,
  activeEnvName = '',
  onUpdateVariable,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur
}) {
  const [val, setVal] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (hoveredVar) {
      setVal(hoveredVar.value !== null && hoveredVar.value !== undefined ? String(hoveredVar.value) : '');
      setIsSaved(false);
    }
  }, [hoveredVar?.name, hoveredVar?.value]);

  // Click outside to close
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (onClose) onClose();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose]);

  if (!hoveredVar || !hoveredVar.rect) return null;

  const rect = hoveredVar.rect;
  // If near top of viewport (e.g. inside URL bar), flip downwards so it never covers the header!
  const isBelow = rect.top < 160;
  const centerX = rect.left + rect.width / 2;
  const clampedLeft = Math.max(160, Math.min(window.innerWidth - 160, centerX));

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!onUpdateVariable || isSaving) return;

    setIsSaving(true);
    try {
      const success = await onUpdateVariable(hoveredVar.name, val);
      if (success !== false) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 1500);
      }
    } catch (err) {
      console.error('Failed to update variable from tooltip:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (onClose) onClose();
    }
  };

  const tooltipElement = (
    <div
      ref={containerRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed z-[9999] pointer-events-auto transform -translate-x-1/2 w-80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 text-xs select-none animate-in fade-in zoom-in-95 duration-100 ${
        isBelow ? 'mt-2' : '-translate-y-full mb-2'
      }`}
      style={{
        left: clampedLeft,
        top: isBelow ? rect.bottom + 8 : rect.top - 8
      }}
    >
      {/* Header: Variable Name & Environment */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono font-bold text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 truncate">
            {'{{' + hoveredVar.name + '}}'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate shrink-0">
          {activeEnvName || 'Active Environment'}
        </span>
      </div>

      {/* Notice if variable is not defined */}
      {!hoveredVar.isDefined && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Variable not defined in current environment. Enter a value to define and save.</span>
        </div>
      )}

      {/* Value Editor Row */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={hoveredVar.isDefined ? 'Variable value (leave empty for empty string)' : 'Enter initial variable value'}
            className="w-full h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>

        {onUpdateVariable && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-xs shrink-0 ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white active:scale-95'
            }`}
            title="Save variable to current environment (Enter to save)"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isSaved ? (
              <>
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>{hoveredVar.isDefined ? 'Save' : 'Define'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Arrow Indicator */}
      <div
        className={`absolute w-2.5 h-2.5 bg-white dark:bg-slate-900 transform rotate-45 ${
          isBelow
            ? '-top-1.5 border-l border-t border-slate-200 dark:border-slate-800'
            : '-bottom-1.5 border-r border-b border-slate-200 dark:border-slate-800'
        }`}
        style={{
          left: Math.max(12, Math.min(300, centerX - (clampedLeft - 160)))
        }}
      />
    </div>
  );

  return createPortal(tooltipElement, document.body);
}
