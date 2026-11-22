import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileJson,
  Plus,
  Trash2,
  Copy,
  Pencil,
  MoreVertical,
  FolderPlus
} from 'lucide-react';
import { SubCollectionItem } from './SubCollectionItem';
import { RequestListItem } from './RequestListItem';
import { countCollectionRequests } from '../utils/collectionUtils';

export function CollectionCard({
  col,
  isExpanded,
  onToggleExpand,
  activeRequestId,
  responseCache,
  onSelectRequest,
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
  requestConfirm
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(col.name);
  const [expandedSubIds, setExpandedSubIds] = useState({ general: true });
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const menuRef = useRef(null);

  // Close 3-dots menu on outside click or Escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const totalReqCount = countCollectionRequests(col);
  const subCollections = col.subCollections || [];
  const directRequests = col.requests || [];

  const handleStartRename = () => {
    setIsEditing(true);
    setEditName(col.name);
  };

  const handleSaveRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== col.name && onRenameCollection) {
      onRenameCollection(col.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (requestConfirm) {
      requestConfirm({
        title: 'Delete Collection',
        message: 'Are you sure you want to delete this collection file? All requests and sub-collections inside will be removed.',
        itemName: `${col.name}.json`,
        confirmText: 'Delete',
        onConfirm: () => onDeleteCollection(col.id)
      });
    } else if (confirm(`Are you sure you want to delete collection "${col.name}.json"?`)) {
      onDeleteCollection(col.id);
    }
  };

  const toggleSubExpand = (subId) => {
    setExpandedSubIds((prev) => ({
      ...prev,
      [subId]: prev[subId] === undefined ? false : !prev[subId]
    }));
  };

  const handleAddSubSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSubName.trim();
    if (trimmed && onCreateSubCollection) {
      onCreateSubCollection(col.id, trimmed);
      setNewSubName('');
      setIsAddingSub(false);
    }
  };

  return (
    <div className="rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs transition-colors">
      {/* Collection Title Bar */}
      <div
        className="px-2.5 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
        onClick={() => {
          if (!isEditing) onToggleExpand();
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1.5">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <FileJson className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveRename();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsEditing(false);
                }
              }}
              onBlur={handleSaveRename}
              autoFocus
              onFocus={(e) => e.target.select()}
              className="bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100 text-xs px-1.5 py-0.5 rounded border border-sky-500 focus:outline-none w-full shadow-xs"
            />
          ) : (
            <span
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              title={`${col.name} (Double click or use menu to rename)`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartRename();
              }}
            >
              {col.name}
            </span>
          )}
        </div>

        <div ref={menuRef} className="flex items-center gap-1 shrink-0 relative" data-collection-menu>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
            {totalReqCount}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className={`p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
              isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100' : ''
            }`}
            title="Collection options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Actions Dropdown */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-75 text-xs font-sans select-none"
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onCreateRequestInCollection) onCreateRequestInCollection(col.id);
                  if (!isExpanded) onToggleExpand();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Add Request</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAddingSub(true);
                  if (!isExpanded) onToggleExpand();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Add Sub-collection</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleStartRename();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onDuplicateCollection) onDuplicateCollection(col.id);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Duplicate</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleDelete();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content: Sub-collections & Direct Requests */}
      {isExpanded && (
        <div className="p-1.5 space-y-1.5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-900/40 rounded-b-lg">
          {/* Sub-collections */}
          {subCollections.map((sub) => (
            <SubCollectionItem
              key={sub.id}
              sub={sub}
              collectionId={col.id}
              collectionName={col.name}
              isExpanded={expandedSubIds[sub.id] !== false}
              onToggleExpand={() => toggleSubExpand(sub.id)}
              activeRequestId={activeRequestId}
              responseCache={responseCache}
              onSelectRequest={onSelectRequest}
              onCreateRequest={onCreateRequestInSubCollection}
              onDuplicateRequest={onDuplicateRequest}
              onDeleteRequest={onDeleteRequest}
              onRenameSubCollection={onRenameSubCollection}
              onDuplicateSubCollection={onDuplicateSubCollection}
              onDeleteSubCollection={onDeleteSubCollection}
              requestConfirm={requestConfirm}
            />
          ))}

          {/* Direct Requests under this Collection */}
          {directRequests.map((req) => (
            <RequestListItem
              key={req.id}
              req={req}
              collectionId={col.id}
              subCollectionId={null}
              isSelected={activeRequestId === req.id}
              cachedResponse={responseCache[req.id]}
              onSelectRequest={onSelectRequest}
              onDuplicateRequest={onDuplicateRequest}
              onDeleteRequest={onDeleteRequest}
              requestConfirm={requestConfirm}
              parentName={col.name}
            />
          ))}

          {/* Empty State */}
          {subCollections.length === 0 && directRequests.length === 0 && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 py-2 pl-2 italic">
              No requests or sub-collections
            </div>
          )}

          {/* Add Sub-collection Form */}
          {isAddingSub && (
            <div className="p-1.5 bg-white dark:bg-slate-900 rounded-md border border-sky-400 dark:border-sky-500 shadow-xs">
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubSubmit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsAddingSub(false);
                    setNewSubName('');
                  }
                }}
                placeholder="Sub-collection name..."
                autoFocus
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none mb-1.5 px-1 py-0.5"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSub(false);
                    setNewSubName('');
                  }}
                  className="px-2 py-0.5 rounded text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSubSubmit}
                  className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
