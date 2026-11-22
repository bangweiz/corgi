import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/urlSync';
import { EnvVariableInput } from '../EnvVariableInput';

export function ParamsTab({
  params = [],
  onChangeParams,
  activeEnvVariables = [],
  activeEnvName = '',
  onUpdateVariable
}) {
  const handleToggleRow = (id) => {
    onChangeParams(
      params.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleUpdateRow = (id, field, value) => {
    onChangeParams(
      params.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleDeleteRow = (id) => {
    onChangeParams(params.filter((p) => p.id !== id));
  };

  const handleAddRow = () => {
    onChangeParams([
      ...params,
      { id: generateId(), key: '', value: '', enabled: true }
    ]);
  };

  const handleClearAll = () => {
    onChangeParams([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Table Action Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-700 dark:text-slate-400 font-medium">Query Parameters</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
            {params.filter((p) => p.enabled && p.key).length} active
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-[11px] hidden sm:inline">
            (synced with URL query parameters in real time)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {params.length > 0 && (
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
            <span>Add Param</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <th className="py-2 px-2 w-14 text-center whitespace-nowrap">Enabled</th>
              <th className="py-2 px-2 w-1/2">Key</th>
              <th className="py-2 px-2 w-1/2">Value</th>
              <th className="py-2 px-2 w-14 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {params.map((row) => (
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

                {/* Key */}
                <td className="py-1 px-2">
                  <EnvVariableInput
                    value={row.key}
                    onChange={(val) => handleUpdateRow(row.id, 'key', val)}
                    activeEnvVariables={activeEnvVariables}
                    activeEnvName={activeEnvName}
                    onUpdateVariable={onUpdateVariable}
                    placeholder="e.g. page"
                    className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-sky-500"
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
                    placeholder="e.g. 1 or {{token}}"
                    className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-sky-500"
                  />
                </td>

                {/* Delete */}
                <td className="py-1 px-2 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete parameter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Quick add empty row on click */}
            <tr>
              <td colSpan={4} className="py-2 px-2">
                <button
                  onClick={handleAddRow}
                  className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors bg-white/40 dark:bg-transparent"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Parameter</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
