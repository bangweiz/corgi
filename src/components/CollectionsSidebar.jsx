import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FolderKanban, Plus, X } from 'lucide-react';
import { CollectionCard } from './CollectionCard';

export function CollectionsSidebar({
  isOpen,
  onClose,
  collections = [],
  onSelectRequest,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onDuplicateCollection,
  onCreateSubCollection,
  onRenameSubCollection,
  onDuplicateSubCollection,
  onDeleteSubCollection,
  onCreateRequestInCollection,
  onCreateRequestInSubCollection,
  onDuplicateRequest,
  onDeleteRequest,
  activeRequestId,
  responseCache = {},
  requestConfirm
}) {
  const [expandedCollections, setExpandedCollections] = useState({ sample: true });
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNewModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleExpand = (id) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    onCreateCollection(newCollectionName.trim(), newCollectionDesc.trim());
    setNewCollectionName('');
    setNewCollectionDesc('');
    setShowNewModal(false);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none z-20 transition-colors">
      {/* Sidebar Header */}
      <div className="h-12 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <FolderKanban className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Collections</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">(.json)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewModal(true)}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="New Collection"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors md:hidden"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {collections.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
            No collections found. Click + above to create your first collection.
          </div>
        ) : (
          collections.map((col) => (
            <CollectionCard
              key={col.id}
              col={col}
              isExpanded={!!expandedCollections[col.id]}
              onToggleExpand={() => toggleExpand(col.id)}
              activeRequestId={activeRequestId}
              responseCache={responseCache}
              onSelectRequest={onSelectRequest}
              onRenameCollection={onRenameCollection}
              onDeleteCollection={onDeleteCollection}
              onDuplicateCollection={onDuplicateCollection}
              onCreateSubCollection={onCreateSubCollection}
              onRenameSubCollection={onRenameSubCollection}
              onDuplicateSubCollection={onDuplicateSubCollection}
              onDeleteSubCollection={onDeleteSubCollection}
              onCreateRequestInCollection={onCreateRequestInCollection}
              onCreateRequestInSubCollection={onCreateRequestInSubCollection}
              onDuplicateRequest={onDuplicateRequest}
              onDeleteRequest={onDeleteRequest}
              requestConfirm={requestConfirm}
            />
          ))
        )}
      </div>

      {/* Storage Path Indicator */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-950/60">
        <div>📁 Storage: ./data/collections/</div>
      </div>

      {/* New Collection Modal */}
      {showNewModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNewModal(false);
              }
            }}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150 select-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>New Collection (.json)</span>
              </h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Collection Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g. Order Service API"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    placeholder="Collection description..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}
