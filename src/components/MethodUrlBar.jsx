import React, { useMemo } from 'react';
import { Send, Loader2, Save, Check } from 'lucide-react';
import { interpolateVariables } from '../utils/formatters';
import { EnvVariableInput } from './EnvVariableInput';
import { MethodSelect } from './MethodSelect';

export function MethodUrlBar({
  method,
  onChangeMethod,
  url,
  onChangeUrl,
  onBlurUrl,
  onSend,
  isLoading,
  activeEnvVariables = [],
  activeEnvName = '',
  activeCollection = null,
  onSaveRequest,
  saveFeedback = false,
  onUpdateVariable
}) {
  // Preview interpolated URL if template variables exist
  const previewUrl = useMemo(() => {
    if (url.includes('{{') && activeEnvVariables.length > 0) {
      return interpolateVariables(url, activeEnvVariables);
    }
    return null;
  }, [url, activeEnvVariables]);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading) {
        onSend();
      }
    }
  };

  return (
    <div className="relative z-20 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col gap-1.5">
        {/* Method & URL Input Row with Send and Save buttons */}
        <div className="flex items-center gap-2">
          {/* Method Selector */}
          <MethodSelect value={method} onChange={onChangeMethod} />

          {/* URL Input with {{ autocomplete, distinct styling and hover tooltip */}
          <div className="flex-1 min-w-0">
            <EnvVariableInput
              value={url}
              onChange={onChangeUrl}
              onKeyDown={handleKeyDown}
              onBlur={onBlurUrl}
              activeEnvVariables={activeEnvVariables}
              activeEnvName={activeEnvName}
              onUpdateVariable={onUpdateVariable}
              placeholder="Enter request URL, e.g. https://httpbin.org/get?a=1 or {{baseUrl}}/post"
              className="h-9 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 text-xs"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={onSend}
            disabled={isLoading || !url.trim()}
            className={`h-9 px-4 rounded-lg flex items-center gap-1.5 font-medium text-xs text-white transition-all shadow-xs shrink-0 ${
              isLoading || !url.trim()
                ? 'bg-sky-400 dark:bg-sky-600/50 cursor-not-allowed opacity-60'
                : 'bg-sky-600 hover:bg-sky-500 active:scale-[0.98]'
            }`}
            title="Shortcut: ⌘ + Enter or Ctrl + Enter"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </>
            )}
          </button>

          {/* Save / Add to Collection Button */}
          {onSaveRequest && (
            <button
              onClick={onSaveRequest}
              className={`h-9 px-3.5 rounded-lg border text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 shrink-0 ${
                saveFeedback
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
                  : activeCollection
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                  : 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20'
              }`}
              title={
                activeCollection
                  ? `Quick save changes to "${activeCollection.name}" (.json) Shortcut: ⌘S`
                  : 'Save this draft request to a collection (.json) Shortcut: ⌘S'
              }
            >
              {saveFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{activeCollection ? 'Save' : 'Add to Collection'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Interpolated Preview Hint */}
        {previewUrl && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Resolves to:</span>
            <span className="text-slate-700 dark:text-slate-300 truncate">{previewUrl}</span>
          </div>
        )}
      </div>
    </div>
  );
}
