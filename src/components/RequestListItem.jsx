import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { getMethodColor } from '../utils/formatters';

export function RequestListItem({
  req,
  collectionId,
  subCollectionId = null,
  isSelected = false,
  onSelectRequest,
  onDuplicateRequest,
  onDeleteRequest,
  requestConfirm,
  parentName = ''
}) {
  const mColor = getMethodColor(req.method);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (requestConfirm) {
      requestConfirm({
        title: 'Delete Request',
        message: `Are you sure you want to remove this request from "${parentName || 'Collection'}"?`,
        itemName: req.name || req.url,
        confirmText: 'Delete',
        onConfirm: () => onDeleteRequest(collectionId, subCollectionId, req.id)
      });
    } else if (confirm(`Delete request "${req.name || req.url}"?`)) {
      onDeleteRequest(collectionId, subCollectionId, req.id);
    }
  };

  return (
    <div
      onClick={() => onSelectRequest(req, collectionId, subCollectionId)}
      className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${
        isSelected
          ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 font-medium'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <span className={`text-[10px] font-mono font-bold uppercase shrink-0 ${mColor.text}`}>
          {req.method}
        </span>
        <span className="text-xs truncate" title={req.name || req.url}>
          {req.name || req.url}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onDuplicateRequest && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateRequest(collectionId, subCollectionId, req.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
            title="Duplicate request"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}

        {onDeleteRequest && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
            title="Delete request"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
