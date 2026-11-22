import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Pencil,
  MoreVertical
} from 'lucide-react';
import { RequestListItem } from './RequestListItem';

export function SubCollectionItem({
  sub,
  collectionId,
  collectionName,
  isExpanded,
  onToggleExpand,
  activeRequestId,
  responseCache = {},
  onSelectRequest,
  onCreateRequest,
  onDuplicateRequest,
  onDeleteRequest,
  onRenameSubCollection,
  onDuplicateSubCollection,
  onDeleteSubCollection,
  requestConfirm
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sub.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const reqCount = sub.requests ? sub.requests.length : 0;

  const handleStartRename = () => {
    setIsEditing(true);
    setEditName(sub.name);
  };

  const handleSaveRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== sub.name && onRenameSubCollection) {
      onRenameSubCollection(collectionId, sub.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleDeleteSub = () => {
    if (requestConfirm) {
      requestConfirm({
        title: 'Delete Sub-collection',
        message: `Are you sure you want to delete sub-collection "${sub.name}" from "${collectionName}"? All requests inside will be removed.`,
        itemName: sub.name,
        confirmText: 'Delete',
        onConfirm: () => onDeleteSubCollection(collectionId, sub.id)
      });
    } else if (confirm(`Are you sure you want to delete sub-collection "${sub.name}"?`)) {
      onDeleteSubCollection(collectionId, sub.id);
    }
  };

  return (
    <div className="rounded-md border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 transition-colors">
      {/* Sub-collection Header */}
      <div
        onClick={() => {
          if (!isEditing) onToggleExpand();
        }}
        className="px-2 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors rounded-t-md"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1.5">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          )}

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
              className="bg-white dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100 text-xs px-1.5 py-0.5 rounded border border-sky-500 focus:outline-none w-full shadow-xs"
            />
          ) : (
            <span
              className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              title={`${sub.name} (Double click or use menu to rename)`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartRename();
              }}
            >
              {sub.name}
            </span>
          )}
        </div>

        <div ref={menuRef} className="flex items-center gap-1 shrink-0 relative" data-collection-menu>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {reqCount}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className={`p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100' : ''
            }`}
            title="Sub-collection actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Sub-collection Actions Dropdown */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-75 text-xs font-sans select-none"
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onCreateRequest) onCreateRequest(collectionId, sub.id);
                }}
                className="w-full px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Add Request</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleStartRename();
                }}
                className="w-full px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onDuplicateSubCollection) onDuplicateSubCollection(collectionId, sub.id);
                }}
                className="w-full px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Duplicate</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleDeleteSub();
                }}
                className="w-full px-2 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Requests inside this Sub-collection */}
      {isExpanded && (
        <div className="pl-3 pr-1 py-1 space-y-0.5 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/30 rounded-b-md">
          {reqCount === 0 ? (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1.5 pl-2 italic">
              No requests in this sub-collection
            </div>
          ) : (
            sub.requests.map((req) => (
              <RequestListItem
                key={req.id}
                req={req}
                collectionId={collectionId}
                subCollectionId={sub.id}
                isSelected={activeRequestId === req.id}
                cachedResponse={responseCache[req.id]}
                onSelectRequest={onSelectRequest}
                onDuplicateRequest={onDuplicateRequest}
                onDeleteRequest={onDeleteRequest}
                requestConfirm={requestConfirm}
                parentName={sub.name}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
