import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/urlSync';
import { EnvVariableInput } from '../EnvVariableInput';

const COMMON_HEADER_KEYS = [
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Content-Type',
  'Origin',
  'User-Agent',
  'X-Requested-With',
  'X-Custom-Header'
];

const PRESETS = [
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Accept', value: 'application/json' },
  { key: 'Cache-Control', value: 'no-cache' }
];

export function HeadersTab({
  headers = [],
  onChangeHeaders,
  activeEnvVariables = [],
  activeEnvName = '',
  onUpdateVariable
}) {
  const handleToggleRow = (id) => {
    onChangeHeaders(
      headers.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h))
    );
  };

  const handleUpdateRow = (id, field, value) => {
    onChangeHeaders(
      headers.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  const handleDeleteRow = (id) => {
    onChangeHeaders(headers.filter((h) => h.id !== id));
  };

  const handleAddRow = () => {
    onChangeHeaders([
      ...headers,
      { id: generateId(), key: '', value: '', enabled: true, description: '' }
    ]);
  };

  const handleApplyPreset = (preset) => {
    const existing = headers.find(
      (h) => h.key.toLowerCase() === preset.key.toLowerCase()
    );
    if (existing) {
      onChangeHeaders(
        headers.map((h) =>
          h.id === existing.id ? { ...h, value: preset.value, enabled: true } : h
        )
      );
    } else {
      onChangeHeaders([
        ...headers,
        { id: generateId(), key: preset.key, value: preset.value, enabled: true, description: '' }
      ]);
    }
  };

  const handleClearAll = () => {
    onChangeHeaders([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick Presets & Header Action Bar */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-700 dark:text-slate-400 font-medium">Headers</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
            {headers.filter((h) => h.enabled && h.key).length} active
          </span>

          {/* Quick presets chips */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.key + p.value}
                onClick={() => handleApplyPreset(p)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono transition-colors"
                title={`Add ${p.key}: ${p.value}`}
              >
                + {p.key === 'Content-Type' ? 'JSON' : p.value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {headers.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={handleAddRow}
            className="text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Header</span>
          </button>
        </div>
      </div>

      <datalist id="common-headers-list">
        {COMMON_HEADER_KEYS.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <th className="py-2 px-2 w-14 text-center whitespace-nowrap">Enabled</th>
              <th className="py-2 px-2 w-1/3">Key</th>
              <th className="py-2 px-2 w-1/3">Value</th>
              <th className="py-2 px-2">Description</th>
              <th className="py-2 px-2 w-14 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors ${
                  !row.enabled ? 'opacity-50' : ''
                }`}
              >
                {/* Enable toggle */}
                <td className="py-1 px-2 text-center align-middle whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={row.enabled !== false}
                    onChange={() => handleToggleRow(row.id)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sky-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                </td>

                {/* Key with datalist suggestions */}
                <td className="py-1 px-2">
                  <input
                    type="text"
                    list="common-headers-list"
                    value={row.key}
                    onChange={(e) => handleUpdateRow(row.id, 'key', e.target.value)}
                    placeholder="e.g. Authorization"
                    className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </td>

                {/* Value */}
                <td className="py-1 px-2">
                  <EnvVariableInput
                    value={row.value}
                    onChange={(val) => handleUpdateRow(row.id, 'value', val)}
                    activeEnvVariables={activeEnvVariables}
                    activeEnvName={activeEnvName}
                    onUpdateVariable={onUpdateVariable}
                    placeholder="e.g. Bearer {{apiToken}}"
                    className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-sky-500"
                  />
                </td>

                {/* Description */}
                <td className="py-1 px-2">
                  <input
                    type="text"
                    value={row.description || ''}
                    onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                    placeholder="Optional description"
                    className="w-full bg-transparent px-2 py-1 rounded text-slate-600 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </td>

                {/* Delete */}
                <td className="py-1 px-2 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete header"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Quick add empty row on click */}
            <tr>
              <td colSpan={5} className="py-2 px-2">
                <button
                  onClick={handleAddRow}
                  className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors bg-white/40 dark:bg-transparent"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Header</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
