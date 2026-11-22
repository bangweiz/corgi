import React, { useState, useMemo, useRef } from 'react';
import { CheckCircle, AlertCircle, Check, Copy } from 'lucide-react';
import { tokenizeJson } from '../../utils/jsonHighlight';
import { FormDataEditor } from './FormDataEditor';

const BODY_TYPES = [
  { id: 'none', label: 'None' },
  { id: 'json', label: 'JSON' },
  { id: 'form-data', label: 'Form-data' },
  { id: 'raw', label: 'Raw' }
];

export function BodyTab({
  bodyType = 'none',
  onChangeBodyType,
  body = '',
  onChangeBody,
  formData = [],
  onChangeFormData,
  activeEnvVariables = [],
  activeEnvName = '',
  onUpdateVariable
}) {
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Validate JSON if bodyType is JSON
  const jsonValidation = useMemo(() => {
    if (bodyType !== 'json' || !body.trim()) {
      return { isValid: true, error: null };
    }
    try {
      JSON.parse(body);
      return { isValid: true, error: null };
    } catch (e) {
      return { isValid: false, error: e.message };
    }
  }, [bodyType, body]);

  // Synchronize scroll between line numbers, highlight layer, and textarea
  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = scrollTop;
        highlightRef.current.scrollLeft = scrollLeft;
      }
    }
  };

  // Autocomplete state for textarea
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [suggestIndex, setSuggestIndex] = useState(0);

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

  const filteredSuggestions = useMemo(() => {
    if (!activeEnvVariables || activeEnvVariables.length === 0) return [];
    const q = suggestQuery.toLowerCase();
    return activeEnvVariables.filter((v) => v && v.key && v.key.toLowerCase().includes(q));
  }, [activeEnvVariables, suggestQuery]);

  const handleSelectSuggestion = (selectedVar) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea ? textarea.selectionStart : body.length;
    const before = body.slice(0, cursorPos);
    const after = body.slice(cursorPos);
    const replacedBefore = before.replace(/\{\{([a-zA-Z0-9_-]*)$/, `{{${selectedVar.key}}}`);
    const newBody = replacedBefore + after;
    onChangeBody(newBody);
    setIsSuggestOpen(false);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(replacedBefore.length, replacedBefore.length);
      }
    });
  };

  // Support Tab key (2 spaces) and Enter key (smart auto-indent)
  const handleKeyDown = (e) => {
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

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      onChangeBody(newVal);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      });
      return;
    }

    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const val = textarea.value;
      const lastLine = val.substring(0, start).split('\n').pop() || '';
      const match = lastLine.match(/^(\s*)/);
      const currentIndent = match ? match[1] : '';
      const extraIndent = lastLine.trim().endsWith('{') || lastLine.trim().endsWith('[') ? '  ' : '';
      const indent = currentIndent + extraIndent;

      if (indent) {
        e.preventDefault();
        const insertText = '\n' + indent;
        const newVal = val.substring(0, start) + insertText + val.substring(textarea.selectionEnd);
        onChangeBody(newVal);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + insertText.length;
          }
        });
      }
    }
  };

  const handleFormatJson = () => {
    if (!body.trim()) return;
    try {
      const parsed = JSON.parse(body);
      onChangeBody(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert(`Cannot format: invalid JSON syntax:\n${e.message}`);
    }
  };

  const handleCopy = () => {
    if (!body) return;
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = useMemo(() => {
    return (body || '').split('\n').length;
  }, [body]);

  const highlightedTokens = useMemo(() => {
    if (!body) return null;
    const tokens = tokenizeJson(body);
    return tokens.map((tok, idx) => {
      let className = 'text-slate-800 dark:text-slate-200';
      switch (tok.type) {
        case 'key':
          className = 'text-sky-700 dark:text-sky-300 font-semibold';
          break;
        case 'string':
          className = 'text-emerald-700 dark:text-emerald-300';
          break;
        case 'number':
          className = 'text-amber-700 dark:text-amber-300 font-medium';
          break;
        case 'boolean':
          className = 'text-purple-700 dark:text-purple-300 font-semibold';
          break;
        case 'null':
          className = 'text-rose-600 dark:text-rose-300/80 italic font-semibold';
          break;
        case 'punctuation':
        case 'colon':
          className = 'text-slate-500 dark:text-slate-400';
          break;
        case 'whitespace':
          return tok.value;
        default:
          className = 'text-slate-800 dark:text-slate-300';
      }

      if (tok.type === 'string' && tok.value.includes('{{')) {
        const parts = tok.value.split(/(\{\{[a-zA-Z0-9_-]+\}\})/g);
        return (
          <span key={idx} className={className}>
            {parts.map((part, pIdx) => {
              if (/^\{\{[a-zA-Z0-9_-]+\}\}$/.test(part)) {
                return (
                  <span
                    key={pIdx}
                    className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-0.5 rounded shadow-[0_0_0_1px_rgba(245,158,11,0.4)]"
                  >
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </span>
        );
      }

      return (
        <span key={idx} className={className}>
          {tok.value}
        </span>
      );
    });
  }, [body]);

  return (
    <div className="flex flex-col h-full">
      {/* Body Type Selection Header */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 text-xs gap-2">
        {/* Left: Body Type Selectors */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-700 dark:text-slate-400 font-medium mr-1">Body Type:</span>
          {BODY_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => onChangeBodyType(t.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                bodyType === t.id
                  ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-semibold border border-sky-300 dark:border-sky-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right: Actions when JSON selected */}
        {bodyType === 'json' && (
          <div className="flex items-center gap-2">
            {/* Validation badge */}
            {body.trim() && (
              <span
                className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded font-mono ${
                  jsonValidation.isValid
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
                }`}
              >
                {jsonValidation.isValid ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>JSON Valid</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Invalid JSON</span>
                  </>
                )}
              </span>
            )}

            {/* Format JSON */}
            <button
              onClick={handleFormatJson}
              className="text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
              title="Beautify JSON (2 spaces)"
            >
              <span>Beautify</span>
            </button>

            {/* Copy button */}
            {body && (
              <button
                onClick={handleCopy}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copy body"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Clear */}
            {body && (
              <button
                onClick={() => onChangeBody('')}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body Content Area */}
      <div className="flex-1 overflow-auto min-h-[160px] flex flex-col">
        {bodyType === 'none' && (
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
            This request does not include a body
          </div>
        )}

        {/* JSON Mode: Editable pretty syntax-highlighted code editor */}
        {bodyType === 'json' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs focus-within:border-sky-500/80 focus-within:ring-1 focus-within:ring-sky-500/30 transition-all">
              {/* Line numbers gutter */}
              <div
                ref={lineNumbersRef}
                className="select-none text-right pr-3 pl-2 py-3 text-slate-400 dark:text-slate-600 border-r border-slate-200 dark:border-slate-800 shrink-0 font-mono text-xs overflow-hidden leading-5 bg-slate-50/50 dark:bg-slate-950/40"
              >
                {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
                  <div key={i} className="h-5 leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea with syntax highlight layer */}
              <div className="relative flex-1 flex overflow-hidden">
                {/* Syntax highlighted background */}
                <div
                  ref={highlightRef}
                  aria-hidden="true"
                  className="absolute inset-0 p-3 font-mono text-xs leading-5 whitespace-pre overflow-hidden pointer-events-none select-none text-slate-800 dark:text-slate-200"
                >
                  {highlightedTokens}
                  {body.endsWith('\n') && '\n'}
                </div>

                {/* Direct editable textarea on top */}
                <textarea
                  ref={textareaRef}
                  onScroll={handleScroll}
                  value={body}
                  onChange={(e) => {
                    onChangeBody(e.target.value);
                    checkAutocomplete(e.target.value, e.target.selectionStart || e.target.value.length);
                  }}
                  onClick={() => checkAutocomplete(body, textareaRef.current?.selectionStart || body.length)}
                  onKeyUp={(e) => {
                    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                      checkAutocomplete(body, textareaRef.current?.selectionStart || body.length);
                    }
                  }}
                  onBlur={() => setTimeout(() => setIsSuggestOpen(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder='{\n  "key": "value"\n}'
                  spellCheck="false"
                  className={`flex-1 w-full p-3 font-mono text-xs leading-5 resize-none focus:outline-none overflow-auto whitespace-pre selection:bg-sky-500/25 selection:text-transparent ${
                    body ? 'bg-transparent text-transparent caret-slate-900 dark:caret-white' : 'bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600'
                  }`}
                />

                {/* Autocomplete Popup */}
                {isSuggestOpen && (
                  <div className="absolute left-6 bottom-4 w-72 max-h-48 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-1 font-sans animate-in fade-in zoom-in-95 duration-75">
                    <div className="px-2.5 py-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Variable Autocomplete</span>
                      <span className="text-[10px]">{filteredSuggestions.length} matches</span>
                    </div>
                    <div className="py-1">
                      {filteredSuggestions.length === 0 ? (
                        <div className="px-3 py-2 text-center text-xs text-slate-400">
                          {activeEnvVariables.length === 0 ? 'No variables in active environment' : 'No matching variables'}
                        </div>
                      ) : (
                        filteredSuggestions.map((v, i) => (
                          <div
                            key={v.key}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(v);
                            }}
                            onMouseEnter={() => setSuggestIndex(i)}
                            className={`px-2 py-1 rounded cursor-pointer text-xs flex items-center justify-between gap-2 ${
                              i === suggestIndex
                                ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 font-medium'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {'{{' + v.key + '}}'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[100px]">
                              {v.value || '(empty)'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Validation error notice if invalid */}
            {!jsonValidation.isValid && jsonValidation.error && (
              <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-400 font-mono px-2 py-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded flex items-center justify-between">
                <span className="truncate">JSON syntax error: {jsonValidation.error}</span>
                <button
                  onClick={handleFormatJson}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline shrink-0 ml-2"
                >
                  Try auto-formatting
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form Data Mode */}
        {bodyType === 'form-data' && (
          <FormDataEditor
            formData={formData}
            onChangeFormData={onChangeFormData}
            activeEnvVariables={activeEnvVariables}
            activeEnvName={activeEnvName}
            onUpdateVariable={onUpdateVariable}
          />
        )}

        {/* Raw Mode */}
        {bodyType === 'raw' && (
          <textarea
            value={body}
            onChange={(e) => onChangeBody(e.target.value)}
            placeholder="Enter raw text body..."
            spellCheck="false"
            className="w-full h-full p-3 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-700 resize-none focus:outline-none focus:border-sky-500/80 leading-relaxed shadow-xs"
          />
        )}
      </div>
    </div>
  );
}
