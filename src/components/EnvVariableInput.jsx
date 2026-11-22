import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { EnvVariableTooltip } from './EnvVariableTooltip';

/**
 * Parses a string into segments of normal text vs {{variable}} tokens
 */
function parseVariableSegments(text) {
  if (!text) return [];
  const regex = /(\{\{[a-zA-Z0-9_-]+\}\}|\{\{[a-zA-Z0-9_-]*)/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    const token = match[0];
    const isCompleted = /^\{\{[a-zA-Z0-9_-]+\}\}$/.test(token);
    const varName = token.replace(/^\{\{|\}\}$/g, '');

    segments.push({
      type: 'variable',
      content: token,
      varName,
      isCompleted
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return segments;
}

export function EnvVariableInput({
  value = '',
  onChange,
  placeholder = '',
  className = '',
  activeEnvVariables = [],
  activeEnvName = '',
  onUpdateVariable,
  onKeyDown,
  onFocus,
  onBlur,
  autoFocus = false,
  disabled = false,
  type = 'text',
  ...restProps
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const backdropRef = useRef(null);

  // Autocomplete state
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [suggestIndex, setSuggestIndex] = useState(0);

  // Hover tooltip state & refs for hover persistence
  const [hoveredVar, setHoveredVar] = useState(null);
  const closeTimeoutRef = useRef(null);
  const isOverTooltipRef = useRef(false);
  const isTooltipFocusedRef = useRef(false);

  const clearCloseTimer = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = (delay = 250) => {
    clearCloseTimer();
    closeTimeoutRef.current = setTimeout(() => {
      if (!isOverTooltipRef.current && !isTooltipFocusedRef.current) {
        setHoveredVar(null);
      }
    }, delay);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  // Map of active variables by key for fast lookup
  const varMap = useMemo(() => {
    const map = new Map();
    activeEnvVariables.forEach((v) => {
      if (v && v.key) {
        map.set(v.key, v);
      }
    });
    return map;
  }, [activeEnvVariables]);

  // Synchronize horizontal scroll between input and backdrop layer
  const handleScroll = () => {
    if (inputRef.current && backdropRef.current) {
      backdropRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  // Check if cursor is right after `{{...` to trigger autocomplete
  const checkAutocomplete = (text, cursorPos) => {
    const beforeCursor = text.slice(0, cursorPos);
    const match = beforeCursor.match(/\{\{([a-zA-Z0-9_-]*)$/);
    if (match) {
      setSuggestQuery(match[1]);
      setIsSuggestOpen(true);
      setSuggestIndex(0);
    } else {
      setIsSuggestOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    onChange(newVal);
    checkAutocomplete(newVal, e.target.selectionStart || newVal.length);
  };

  const handleInputClick = () => {
    if (inputRef.current) {
      checkAutocomplete(value, inputRef.current.selectionStart || value.length);
    }
  };

  const handleInputKeyUp = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      if (inputRef.current) {
        checkAutocomplete(value, inputRef.current.selectionStart || value.length);
      }
    }
  };

  // Filter suggestion list based on query
  const filteredSuggestions = useMemo(() => {
    if (!activeEnvVariables || activeEnvVariables.length === 0) return [];
    const q = suggestQuery.toLowerCase();
    return activeEnvVariables.filter(
      (v) => v && v.key && v.enabled !== false && v.key.toLowerCase().includes(q)
    );
  }, [activeEnvVariables, suggestQuery]);

  // Select suggestion item
  const handleSelectSuggestion = (selectedVar) => {
    const cursorPos = inputRef.current ? inputRef.current.selectionStart : value.length;
    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);

    // Replace `{{query` with `{{key}}`
    const replacedBefore = before.replace(/\{\{([a-zA-Z0-9_-]*)$/, `{{${selectedVar.key}}}`);
    const newValue = replacedBefore + after;

    onChange(newValue);
    setIsSuggestOpen(false);

    const newCursor = replacedBefore.length;
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  // Handle keyboard events (autocomplete navigation and custom onKeyDown)
  const handleInputKeyDown = (e) => {
    if (isSuggestOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
          setSuggestIndex((prev) => (prev + 1) % filteredSuggestions.length);
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
          setSuggestIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        }
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredSuggestions.length > 0 && filteredSuggestions[suggestIndex]) {
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[suggestIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSuggestOpen(false);
        return;
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Mouse move handler for variable hover tooltip
  const handleMouseMove = (e) => {
    if (!backdropRef.current) return;
    const spans = backdropRef.current.querySelectorAll('[data-var-name]');
    let matched = null;

    for (const span of spans) {
      const rect = span.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        matched = {
          name: span.getAttribute('data-var-name'),
          rect
        };
        break;
      }
    }

    if (matched) {
      clearCloseTimer();
      setHoveredVar((prev) => {
        if (!prev || prev.name !== matched.name) {
          return matched;
        }
        return prev;
      });
    } else if (hoveredVar) {
      scheduleClose(250);
    }
  };

  const handleMouseLeave = () => {
    if (hoveredVar) {
      scheduleClose(250);
    }
  };

  const activeHoveredVar = useMemo(() => {
    if (!hoveredVar) return null;
    const varData = varMap.get(hoveredVar.name);
    return {
      name: hoveredVar.name,
      rect: hoveredVar.rect,
      value: varData ? varData.value : null,
      isDefined: !!varData
    };
  }, [hoveredVar, varMap]);

  const segments = useMemo(() => parseVariableSegments(value), [value]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center w-full min-w-0"
    >
      {/* 1. Underlying Backdrop Layer for Distinct Syntax Highlighting */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none overflow-x-hidden whitespace-pre flex items-center select-none font-mono text-xs ${className}`}
        style={{
          background: 'transparent',
          boxShadow: 'none',
          borderColor: 'transparent'
        }}
      >
        {segments.map((seg, idx) => {
          if (seg.type === 'variable') {
            const varData = varMap.get(seg.varName);
            const isDefined = !!varData;

            if (seg.isCompleted) {
              return (
                <span
                  key={idx}
                  data-var-name={seg.varName}
                  className={`inline-block font-semibold rounded-sm transition-colors ${
                    isDefined
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.45)]'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-[0_0_0_1px_rgba(244,63,94,0.45)]'
                  }`}
                  style={{
                    padding: '0 1px',
                    margin: '0 -1px'
                  }}
                >
                  {seg.content}
                </span>
              );
            } else {
              // Incomplete typing: e.g. `{{base`
              return (
                <span
                  key={idx}
                  className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border-b border-dashed border-amber-500"
                >
                  {seg.content}
                </span>
              );
            }
          }

          // Normal text
          return (
            <span key={idx} className="text-slate-900 dark:text-slate-100">
              {seg.content}
            </span>
          );
        })}
      </div>

      {/* 2. Real Native Input (with transparent text so backdrop shines through, native caret) */}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onKeyUp={handleInputKeyUp}
        onClick={handleInputClick}
        onScroll={handleScroll}
        onFocus={(e) => {
          checkAutocomplete(value, e.target.selectionStart || value.length);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setTimeout(() => setIsSuggestOpen(false), 200);
          scheduleClose(250);
          if (onBlur) onBlur(e);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        spellCheck="false"
        autoComplete="off"
        className={`w-full font-mono text-xs focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${className} ${
          value ? 'text-transparent caret-slate-900 dark:caret-white selection:bg-sky-500/30' : 'text-slate-900 dark:text-slate-100'
        }`}
        {...restProps}
      />

      {/* 3. Hover Tooltip showing current variable value and inline editor */}
      {activeHoveredVar && (
        <EnvVariableTooltip
          hoveredVar={activeHoveredVar}
          activeEnvName={activeEnvName}
          onUpdateVariable={onUpdateVariable}
          onClose={() => {
            clearCloseTimer();
            isOverTooltipRef.current = false;
            isTooltipFocusedRef.current = false;
            setHoveredVar(null);
          }}
          onMouseEnter={() => {
            isOverTooltipRef.current = true;
            clearCloseTimer();
          }}
          onMouseLeave={() => {
            isOverTooltipRef.current = false;
            scheduleClose(250);
          }}
          onFocus={() => {
            isTooltipFocusedRef.current = true;
            clearCloseTimer();
          }}
          onBlur={() => {
            isTooltipFocusedRef.current = false;
            scheduleClose(250);
          }}
        />
      )}

      {/* 4. Autocomplete Dropdown Popup when typing `{{` */}
      {isSuggestOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-80 max-h-56 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-1 font-sans animate-in fade-in zoom-in-95 duration-75">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Variable Autocomplete</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          <div className="py-1">
            {filteredSuggestions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                {activeEnvVariables.length === 0
                  ? 'No variables in active environment'
                  : 'No matching variables found'}
              </div>
            ) : (
              filteredSuggestions.map((v, i) => {
                const isSelected = i === suggestIndex;
                return (
                  <div
                    key={v.key}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(v);
                    }}
                    onMouseEnter={() => setSuggestIndex(i)}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer text-xs flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        {'{{' + v.key + '}}'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                      {v.value || '(empty)'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-2 py-1 bg-slate-50 dark:bg-slate-950/60 rounded border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>↑↓ Navigate, Enter / Tab to select</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
