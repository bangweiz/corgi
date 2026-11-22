import React, { useState, useEffect } from 'react';
import { X, FolderKanban } from 'lucide-react';
import { generateId } from '../utils/urlSync';
import { countCollectionRequests } from '../utils/collectionUtils';

export function SaveRequestModal({
  isOpen,
  onClose,
  collections = [],
  currentRequest,
  onSaveToCollection
}) {
  const [requestName, setRequestName] = useState('');
  const [targetCollectionId, setTargetCollectionId] = useState('');
  const [newColName, setNewColName] = useState('');
  const [isCreatingCol, setIsCreatingCol] = useState(false);

  const [targetSubCollectionId, setTargetSubCollectionId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [isCreatingSub, setIsCreatingSub] = useState(false);

  useEffect(() => {
    if (isOpen && currentRequest) {
      setRequestName(
        currentRequest.name ||
        `${currentRequest.method} ${currentRequest.url.split('?')[0].split('/').pop() || 'Request'}`
      );
      if (collections.length > 0) {
        const firstCol = collections[0];
        setTargetCollectionId(firstCol.id);
        setIsCreatingCol(false);
        setTargetSubCollectionId('');
        setIsCreatingSub(false);
      } else {
        setIsCreatingCol(true);
        setIsCreatingSub(false);
      }
      setNewColName('');
      setNewSubName('');
    }
  }, [isOpen, currentRequest, collections]);

  const selectedCol = collections.find((c) => c.id === targetCollectionId);
  const subCollections = selectedCol?.subCollections || [];

  const handleCollectionChange = (newColId) => {
    setTargetCollectionId(newColId);
    setTargetSubCollectionId('');
    setIsCreatingSub(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestName.trim()) return;

    onSaveToCollection({
      targetCollectionId: isCreatingCol ? null : targetCollectionId,
      targetSubCollectionId: isCreatingCol || isCreatingSub ? null : (targetSubCollectionId || null),
      newCollectionName: isCreatingCol ? newColName.trim() : null,
      newSubCollectionName: isCreatingCol
        ? newSubName.trim() || null
        : isCreatingSub
        ? newSubName.trim() || null
        : null,
      request: {
        ...currentRequest,
        id: currentRequest.id || 'req_' + generateId(),
        name: requestName.trim()
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Save Request to Collection (.json)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Request Name */}
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Request Name</label>
            <input
              type="text"
              required
              autoFocus
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="e.g. Get User Profile"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500 font-medium"
            />
          </div>

          {/* Collection Selection / Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-400 font-medium">Target Collection</label>
              {collections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCol(!isCreatingCol)}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 text-[11px]"
                >
                  {isCreatingCol ? 'Select existing collection' : '+ New Collection'}
                </button>
              )}
            </div>

            {isCreatingCol ? (
              <input
                type="text"
                required
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="New collection name (e.g. Order Service API)..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500"
              />
            ) : (
              <select
                value={targetCollectionId}
                onChange={(e) => handleCollectionChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({countCollectionRequests(col)} requests)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sub-collection Selection / Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-400 font-medium">
                Target Sub-collection
              </label>
              {!isCreatingCol && (
                <button
                  type="button"
                  onClick={() => setIsCreatingSub(!isCreatingSub)}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 text-[11px]"
                >
                  {isCreatingSub ? 'Choose from list' : '+ New Sub-collection'}
                </button>
              )}
            </div>

            {isCreatingCol ? (
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="Sub-collection (optional, leave blank for collection root)..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500"
              />
            ) : isCreatingSub ? (
              <input
                type="text"
                required
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="New sub-collection name (e.g. auth, order)..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500"
              />
            ) : (
              <select
                value={targetSubCollectionId}
                onChange={(e) => setTargetSubCollectionId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">Root (Direct in Collection)</option>
                {subCollections.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    Folder: {sub.name} ({sub.requests ? sub.requests.length : 0} requests)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Request Quick Info */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex gap-2">
              <span className="text-slate-400">Method:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentRequest.method}</span>
            </div>
            <div className="flex gap-2 truncate">
              <span className="text-slate-400 shrink-0">URL:</span>
              <span className="text-slate-700 dark:text-slate-300 truncate">{currentRequest.url}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-medium text-white transition-colors shadow-xs"
            >
              Save to Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
