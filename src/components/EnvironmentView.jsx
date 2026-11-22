import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, Plus, Trash2, Copy, Check, FileJson, ArrowLeft, Save, Search, Sparkles, HelpCircle } from 'lucide-react';

export function EnvironmentView({
  environments = [],
  activeEnvId = '',
  onSelectEnv,
  onSaveEnv,
  onCreateEnv,
  onDeleteEnv,
  onDuplicateEnv,
  onBackToRequest,
  requestConfirm
}) {
  const [selectedEnvId, setSelectedEnvId] = useState(
    activeEnvId || (environments[0] ? environments[0].id : '')
  );
  const [editingEnv, setEditingEnv] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Sync editingEnv whenever selectedEnvId or environments change
  useEffect(() => {
    const found = environments.find((e) => e.id === selectedEnvId);
    if (found) {
      setEditingEnv(JSON.parse(JSON.stringify(found)));
    } else if (environments.length > 0) {
      setSelectedEnvId(environments[0].id);
      setEditingEnv(JSON.parse(JSON.stringify(environments[0])));
    } else {
      setEditingEnv(null);
    }
  }, [selectedEnvId, environments]);

  // Keyboard shortcut Cmd+S / Ctrl+S to save environment
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingEnv]);

  const handleAddVariable = () => {
    if (!editingEnv) return;
    const vars = editingEnv.variables || [];
    setEditingEnv({
      ...editingEnv,
      variables: [...vars, { key: '', value: '', enabled: true }]
    });
  };

  const handleUpdateVar = (index, field, value) => {
    if (!editingEnv) return;
    const vars = [...(editingEnv.variables || [])];
    vars[index] = { ...vars[index], [field]: value };
    setEditingEnv({ ...editingEnv, variables: vars });
  };

  const handleDeleteVar = (index) => {
    if (!editingEnv) return;
    const vars = (editingEnv.variables || []).filter((_, i) => i !== index);
    setEditingEnv({ ...editingEnv, variables: vars });
  };

  const handleToggleVar = (index) => {
    if (!editingEnv) return;
    const vars = [...(editingEnv.variables || [])];
    vars[index] = { ...vars[index], enabled: !vars[index].enabled };
    setEditingEnv({ ...editingEnv, variables: vars });
  };

  const handleSave = async () => {
    if (!editingEnv) return;
    await onSaveEnv(editingEnv);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    const id = newEnvName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const newEnv = {
      id: id + '_' + Date.now().toString(36),
      name: newEnvName.trim(),
      variables: [
        { key: 'baseUrl', value: 'https://httpbin.org', enabled: true }
      ]
    };
    onCreateEnv(newEnv);
    setSelectedEnvId(newEnv.id);
    setNewEnvName('');
    setIsCreating(false);
  };

  const handleDuplicate = async (envId) => {
    if (!onDuplicateEnv) return;
    const newId = await onDuplicateEnv(envId);
    if (newId) {
      setSelectedEnvId(newId);
    }
  };

  const filteredVariables = useMemo(() => {
    if (!editingEnv || !editingEnv.variables) return [];
    if (!searchTerm.trim()) {
      return editingEnv.variables.map((v, originalIndex) => ({ ...v, originalIndex }));
    }
    const term = searchTerm.toLowerCase();
    return editingEnv.variables
      .map((v, originalIndex) => ({ ...v, originalIndex }))
      .filter(
        (v) =>
          (v.key && v.key.toLowerCase().includes(term)) ||
          (v.value && v.value.toLowerCase().includes(term))
      );
  }, [editingEnv, searchTerm]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Header Bar of Environment View */}
      <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRequest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
            title="Back to Request Debugger"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Back to Request</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Environment Configuration</span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/80">
                  ./data/environments/*.json
                </span>
              </div>
            </div>
          </div>
        </div>

        {editingEnv && (
          <div className="flex items-center gap-2">
            {/* Set as Active / Active Badge */}
            {activeEnvId !== editingEnv.id ? (
              <button
                onClick={() => onSelectEnv(editingEnv.id)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium transition-colors shadow-xs"
                title="Set this environment as active"
              >
                Set as Active
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-500/40">
                <Check className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            )}
            {/* Save Environment Button */}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs ${
                saveFeedback
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
              title="Save changes to local file (.json) Shortcut: ⌘S"
            >
              {saveFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved to Disk</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes (⌘S)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Environments File List */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col justify-between shrink-0 transition-colors">
          <div className="flex-1 overflow-auto p-3 space-y-1.5">
            <div className="flex items-center justify-between px-2 pb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-amber-500" />
                <span>Environments</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {environments.length}
              </span>
            </div>

            {environments.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No environment files found. Click below to create one.
              </div>
            ) : (
              environments.map((env) => {
                const isSelected = env.id === selectedEnvId;
                const isActive = env.id === activeEnvId;
                const varCount = Array.isArray(env.variables) ? env.variables.length : 0;

                return (
                  <div
                    key={env.id}
                    onClick={() => setSelectedEnvId(env.id)}
                    className={`group px-3 py-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 font-medium border border-sky-200 dark:border-sky-500/30 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <FileJson
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{env.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                          {varCount} vars
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs mr-0.5"
                          title="Active environment"
                        />
                      )}
                      {onDuplicateEnv && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(env.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
                          title="Duplicate environment"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteEnv && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (requestConfirm) {
                              requestConfirm({
                                title: 'Delete Environment',
                                message: 'Are you sure you want to delete this environment file? All variables defined in it will be permanently removed.',
                                itemName: `${env.name}.json`,
                                confirmText: 'Delete',
                                onConfirm: () => onDeleteEnv(env.id)
                              });
                            } else if (confirm(`Are you sure you want to delete environment configuration "${env.name}.json"?`)) {
                              onDeleteEnv(env.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
                          title="Delete environment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom: New Environment Form / Button */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
            {isCreating ? (
              <form onSubmit={handleCreateSubmit} className="space-y-2">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="New environment name (e.g. Staging)"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                />
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs py-1.5 rounded-md font-medium transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewEnvName('');
                    }}
                    className="px-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs py-1.5 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center justify-center gap-1.5 transition-colors bg-white dark:bg-slate-800 shadow-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Environment (.json)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Full-width Variables Table Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60 dark:bg-slate-950 p-6">
          {editingEnv ? (
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              {/* Title & Search bar */}
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="text"
                    value={editingEnv.name}
                    onChange={(e) => setEditingEnv({ ...editingEnv, name: e.target.value })}
                    placeholder="Environment name..."
                    className="bg-transparent font-bold text-slate-900 dark:text-slate-100 text-base focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-2 py-0.5 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500 transition-colors max-w-sm truncate"
                    title="Click to rename environment"
                  />
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                    {editingEnv.id}.json
                  </span>
                </div>

                {/* Search variables filter */}
                <div className="relative w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter variables by key or value..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Usage Hint Banner */}
              <div className="px-5 py-2.5 bg-sky-50/60 dark:bg-sky-950/20 border-b border-sky-100 dark:border-sky-900/30 flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>
                  Variable substitution: Use{' '}
                  <code className="font-mono bg-sky-100 dark:bg-sky-900/50 px-1 py-0.5 rounded font-bold text-sky-900 dark:text-sky-200">
                    {'{{variable_name}}'}
                  </code>{' '}
                  in any URL, Headers, Token, or Body for dynamic interpolation at request time (e.g.{' '}
                  <code className="font-mono text-[11px]">{'{{baseUrl}}/get'}</code>).
                </span>
              </div>

              {/* Variables Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-mono text-[11px] sticky top-0 z-10">
                      <th className="py-2.5 px-3 w-14 text-center whitespace-nowrap">Enabled</th>
                      <th className="py-2.5 px-3 w-1/3">Variable Key</th>
                      <th className="py-2.5 px-3 flex-1">Variable Value</th>
                      <th className="py-2.5 px-3 w-14 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVariables.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                          {searchTerm ? 'No matching variables' : 'No variables yet. Click below to add one.'}
                        </td>
                      </tr>
                    ) : (
                      filteredVariables.map((v) => {
                        const idx = v.originalIndex;
                        return (
                          <tr
                            key={idx}
                            className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              !v.enabled ? 'opacity-50' : ''
                            }`}
                          >
                            <td className="py-1.5 px-3 text-center align-middle whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={v.enabled !== false}
                                onChange={() => handleToggleVar(idx)}
                                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sky-600 focus:ring-0 cursor-pointer w-4 h-4"
                                title="Enable/disable variable"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={v.key}
                                onChange={(e) => handleUpdateVar(idx, 'key', e.target.value)}
                                placeholder="e.g. baseUrl"
                                className="w-full bg-transparent px-2.5 py-1 rounded font-mono font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={v.value}
                                onChange={(e) => handleUpdateVar(idx, 'value', e.target.value)}
                                placeholder="e.g. https://httpbin.org"
                                className="w-full bg-transparent px-2.5 py-1 rounded font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteVar(idx)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Delete variable"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                    <tr>
                      <td colSpan={4} className="py-3 px-4">
                        <button
                          onClick={handleAddVariable}
                          className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 rounded-xl text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 font-mono text-xs flex items-center justify-center gap-2 transition-colors bg-white/40 dark:bg-transparent font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Variable</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom bar of table */}
              <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Enabled: {(editingEnv.variables || []).filter((v) => v.enabled !== false).length}</span>
                  <span>/</span>
                  <span>Total: {(editingEnv.variables || []).length} vars</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Tip: Press ⌘S / Ctrl+S to save</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Settings2 className="w-12 h-12 mb-3 stroke-1 text-slate-300 dark:text-slate-700" />
              <div className="text-sm font-medium">Select or create an environment file on the left</div>
              <div className="text-xs text-slate-400 mt-1">Each environment is stored as a standalone .json file in ./data/environments/</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
