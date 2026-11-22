import React from 'react';
import { Plus, Trash2, Database } from 'lucide-react';
import { generateId } from '../../utils/urlSync';
import { SourceSelect } from './SourceSelect';

export function ExtractTab({
  extractRules = [],
  onChangeExtractRules,
  activeEnvName = '',
  activeEnvVariables = []
}) {
  const handleToggleRule = (id) => {
    onChangeExtractRules(
      extractRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleUpdateRule = (id, field, value) => {
    onChangeExtractRules(
      extractRules.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDeleteRule = (id) => {
    onChangeExtractRules(extractRules.filter((r) => r.id !== id));
  };

  const handleAddRule = (preset = null) => {
    const newRule = preset || {
      id: generateId(),
      enabled: true,
      source: 'body',
      property: '',
      varName: ''
    };
    onChangeExtractRules([...extractRules, newRule]);
  };

  const handleClearAll = () => {
    onChangeExtractRules([]);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Rules Action Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Auto-Extract Rules</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
            {extractRules.filter((r) => r.enabled && r.property && r.varName).length} active
          </span>
        </div>

        <div className="flex items-center gap-2">
          {extractRules.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          {/* Quick Preset Buttons */}
          <button
            onClick={() => handleAddRule({ id: generateId(), enabled: true, source: 'body', property: 'token', varName: 'token' })}
            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] transition-colors hidden md:inline-flex items-center gap-1 font-mono"
            title="Quick add token extraction from Body"
          >
            + Token
          </button>
          <button
            onClick={() => handleAddRule({ id: generateId(), enabled: true, source: 'body', property: 'id', varName: 'id' })}
            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] transition-colors hidden md:inline-flex items-center gap-1 font-mono"
            title="Quick add id extraction from Body"
          >
            + ID
          </button>
          <button
            onClick={() => handleAddRule({ id: generateId(), enabled: true, source: 'header', property: 'etag', varName: 'etag' })}
            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] transition-colors hidden md:inline-flex items-center gap-1 font-mono"
            title="Quick add e-tag extraction from Header"
          >
            + E-Tag
          </button>

          <button
            onClick={() => handleAddRule()}
            className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-xs text-left border-collapse min-w-[580px] table-fixed">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-medium">
              <th className="py-2.5 px-3 w-20 text-center whitespace-nowrap" title="Enabled">Enabled</th>
              <th className="py-2.5 px-3 w-32 whitespace-nowrap">Source</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Property / Header Name</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Target Variable</th>
              <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap" title="Actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {extractRules.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Database className="w-8 h-8 mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-medium">No auto-extract rules configured</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      Extract values like tokens, IDs, or E-Tags automatically into environment variables on each request.
                    </p>
                    <button
                      onClick={() => handleAddRule()}
                      className="mt-3 px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium text-xs flex items-center gap-1.5 hover:bg-sky-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Rule</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              extractRules.map((rule) => (
                <tr
                  key={rule.id}
                  className={`border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors ${
                    !rule.enabled ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2 px-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={rule.enabled !== false}
                      onChange={() => handleToggleRule(rule.id)}
                      className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      title="Enable/disable extraction rule"
                    />
                  </td>

                  {/* Source Selector */}
                  <td className="py-2 px-3 align-middle">
                    <SourceSelect
                      value={rule.source || 'body'}
                      onChange={(val) => handleUpdateRule(rule.id, 'source', val)}
                    />
                  </td>

                  {/* Property / Path */}
                  <td className="py-2 px-3 align-middle">
                    <input
                      type="text"
                      value={rule.property}
                      onChange={(e) => handleUpdateRule(rule.id, 'property', e.target.value)}
                      placeholder={rule.source === 'header' ? 'e.g. etag or authorization' : 'e.g. token, id, user.id'}
                      className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Target Variable Name */}
                  <td className="py-2 px-3 align-middle">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400">
                        {'{{'}
                      </span>
                      <input
                        type="text"
                        value={rule.varName}
                        onChange={(e) => handleUpdateRule(rule.id, 'varName', e.target.value)}
                        placeholder={rule.property || 'variable_name'}
                        className="w-full pl-6 pr-6 py-1.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium focus:border-sky-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400">
                        {'}}'}
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-2 px-3 text-center align-middle">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
