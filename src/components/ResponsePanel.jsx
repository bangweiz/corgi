import React, { useState, useEffect } from 'react';
import {
  Clock,
  HardDrive,
  Copy,
  Check,
  Search,
  Send
} from 'lucide-react';
import { formatBytes, formatDuration, getStatusBadge } from '../utils/formatters';
import { JsonHighlightedViewer } from '../utils/jsonHighlight';

export function ResponsePanel({
  response,
  isLoading,
  onSendPreset
}) {
  const [activeTab, setActiveTab] = useState('body'); // 'body' | 'headers'
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);

  // Live timer during request loading
  useEffect(() => {
    let interval;
    if (isLoading) {
      setElapsedMs(0);
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedMs(Date.now() - start);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCopyBody = () => {
    if (!response || !response.rawBody) return;
    navigator.clipboard.writeText(response.rawBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // If loading
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 p-6 text-slate-500 dark:text-slate-400 transition-colors">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-600 dark:border-t-sky-500 animate-spin" />
          <Send className="w-5 h-5 text-sky-600 dark:text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">Sending request and waiting for response...</div>
        <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1">Elapsed: {elapsedMs} ms</div>
      </div>
    );
  }

  // If no response yet (empty state)
  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/30 p-8 text-center select-none transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-400 mb-3 shadow-xs">
          <Send className="w-6 h-6 text-sky-600 dark:text-sky-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No request sent yet</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Enter a URL above or click Send to start debugging. Supports GET/POST/PUT/DELETE/PATCH and local JSON storage.
        </p>

        {/* Quick presets */}
        {onSendPreset && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onSendPreset('get')}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-emerald-400 dark:hover:border-emerald-500 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
              <span>Quick Test GET</span>
            </button>
            <button
              onClick={() => onSendPreset('post')}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-sky-400 dark:hover:border-sky-500 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-xs" />
              <span>Quick Test POST JSON</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const statusBadge = getStatusBadge(response.status);
  const headerKeys = Object.keys(response.headers || {});

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 transition-colors">
      {/* Response Metrics & Tab Bar */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
        {/* Left: Status, Time, Size */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border flex items-center gap-1.5 ${statusBadge.bg}`}
          >
            <span>{response.status}</span>
            <span className="text-[11px] font-normal opacity-90">{response.statusText}</span>
          </div>

          {/* Duration */}
          <div
            className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-mono font-medium"
            title="Total request duration (measured by proxy)"
          >
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{formatDuration(response.durationMs)}</span>
          </div>

          {/* Size */}
          <div
            className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-mono font-medium"
            title="Response body size"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{formatBytes(response.sizeBytes)}</span>
          </div>
        </div>

        {/* Right: Tabs & View toggles */}
        <div className="flex items-center gap-2">
          {/* Response Tabs */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs">
            <button
              onClick={() => setActiveTab('body')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'body'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Body
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'headers'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Headers</span>
              <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {headerKeys.length}
              </span>
            </button>
          </div>

          {/* Copy response body button */}
          <button
            onClick={handleCopyBody}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs transition-colors flex items-center gap-1 shadow-xs"
            title="Copy response body"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Content View */}
      <div className="flex-1 overflow-auto bg-slate-100/70 dark:bg-slate-950 p-2 transition-colors">
        {activeTab === 'body' ? (
          <div className="h-full flex flex-col">
            {/* Search filter in response if JSON */}
            {response.isJson && (
              <div className="mb-2 px-2 flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in JSON response..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-sky-500/80 font-mono shadow-xs"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pretty Display (Always pretty when JSON) */}
            <div className="flex-1 overflow-auto rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
              {response.isJson ? (
                <JsonHighlightedViewer
                  jsonContent={response.data || response.rawBody}
                  searchTerm={searchTerm}
                />
              ) : (
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all leading-relaxed select-text">
                  {response.rawBody || '(Empty response body)'}
                </pre>
              )}
            </div>
          </div>
        ) : (
          /* Headers View */
          <div className="h-full overflow-auto rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <th className="py-2 px-3 w-1/3">Header Name</th>
                  <th className="py-2 px-3 w-2/3">Header Value</th>
                </tr>
              </thead>
              <tbody>
                {headerKeys.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-slate-400 dark:text-slate-500">
                      No response headers
                    </td>
                  </tr>
                ) : (
                  headerKeys.map((key) => (
                    <tr
                      key={key}
                      className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors font-mono"
                    >
                      <td className="py-2 px-3 text-sky-700 dark:text-sky-400 font-medium select-text align-top">
                        {key}
                      </td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 break-all select-text align-top">
                        {response.headers[key]}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
