import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/urlSync';
import { EnvVariableInput } from '../EnvVariableInput';

export function FormDataEditor({
  formData = [],
  onChangeFormData,
  activeEnvVariables = [],
  activeEnvName = '',
  onUpdateVariable
}) {
  const handleToggleFormRow = (id) => {
    onChangeFormData(
      formData.map((row) => (row.id === id ? { ...row, enabled: !row.enabled } : row))
    );
  };

  const handleUpdateFormRow = (id, field, value) => {
    onChangeFormData(
      formData.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteFormRow = (id) => {
    onChangeFormData(formData.filter((row) => row.id !== id));
  };

  const handleAddFormRow = () => {
    onChangeFormData([
      ...formData,
      { id: generateId(), key: '', value: '', enabled: true }
    ]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-1.5 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          {formData.filter((f) => f.enabled && f.key).length} fields
        </span>
        <button
          onClick={handleAddFormRow}
          className="text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Field</span>
        </button>
      </div>
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
          {formData.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors ${
                !row.enabled ? 'opacity-50' : ''
              }`}
            >
              <td className="py-1 px-2 text-center align-middle whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={() => handleToggleFormRow(row.id)}
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sky-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                />
              </td>
              <td className="py-1 px-2">
                <EnvVariableInput
                  value={row.key}
                  onChange={(val) => handleUpdateFormRow(row.id, 'key', val)}
                  activeEnvVariables={activeEnvVariables}
                  activeEnvName={activeEnvName}
                  onUpdateVariable={onUpdateVariable}
                  placeholder="e.g. username"
                  className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-sky-500"
                />
              </td>
              <td className="py-1 px-2">
                <EnvVariableInput
                  value={row.value}
                  onChange={(val) => handleUpdateFormRow(row.id, 'value', val)}
                  activeEnvVariables={activeEnvVariables}
                  activeEnvName={activeEnvName}
                  onUpdateVariable={onUpdateVariable}
                  placeholder="e.g. admin or {{userId}}"
                  className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-sky-500"
                />
              </td>
              <td className="py-1 px-2 text-center whitespace-nowrap">
                <button
                  onClick={() => handleDeleteFormRow(row.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete field"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className="py-2 px-2">
              <button
                onClick={handleAddFormRow}
                className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors bg-white/40 dark:bg-transparent"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
