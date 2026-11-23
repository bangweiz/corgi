import { useState, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { generateId } from '../utils/urlSync';
import {
  normalizeCollection,
  getAllCollectionRequests,
  findRequestAndSubCollection,
  createNewBlankRequest,
  duplicateSubCollectionData,
  duplicateCollectionData,
  duplicateRequestInTree,
  deleteRequestFromTree,
  saveRequestIntoCollectionTarget,
  stripResponses,
  patchRequestInTree
} from '../utils/collectionUtils';

export function useCollections({
  activeCollectionId,
  setActiveCollectionId,
  activeSubCollectionId,
  setActiveSubCollectionId,
  activeRequestId,
  setActiveRequestId,
  onSelectRequest,
  onNewRequest,
  stashCurrentRequestDraft,
  loadNewBlankRequest,
  currentResponse,
  setResponseCache
}) {
  const [collections, setCollections] = useState([]);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const refreshCollections = useCallback(async () => {
    try {
      const data = await api.getCollections();
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeCollection);
        setCollections(normalized);
        return normalized;
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
    return [];
  }, []);

  const activeCollection = useMemo(() => {
    return collections.find((c) => c.id === activeCollectionId) || null;
  }, [collections, activeCollectionId]);

  const activeSubCollection = useMemo(() => {
    if (!activeCollection || !activeSubCollectionId) return null;
    return (activeCollection.subCollections || []).find((s) => s.id === activeSubCollectionId) || null;
  }, [activeCollection, activeSubCollectionId]);

  const triggerSaveFeedback = useCallback(() => {
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  }, []);

  const saveAndRefresh = useCallback(async (updatedCol) => {
    const data = await api.saveCollection(stripResponses(updatedCol));
    if (data.success) {
      const cols = await api.getCollections();
      setCollections(cols.map(normalizeCollection));
    }
    return data;
  }, []);

  /**
   * 1-Click Quick Save into active collection and sub-collection
   */
  const handleQuickSave = useCallback(
    async (currentReqData, openSaveModal) => {
      if (activeCollectionId) {
        const targetCol = collections.find((c) => c.id === activeCollectionId);
        if (targetCol) {
          const reqToSave = {
            id: activeRequestId || 'req_' + generateId(),
            name: currentReqData.requestName.trim() || `${currentReqData.method} Request`,
            method: currentReqData.method,
            url: currentReqData.url,
            params: currentReqData.params,
            headers: currentReqData.headers,
            authType: currentReqData.authType,
            bearerToken: currentReqData.bearerToken,
            bodyType: currentReqData.bodyType,
            body: currentReqData.body,
            formData: currentReqData.formData,
            extractRules: currentReqData.extractRules || []
          };

          const { updatedCol } = saveRequestIntoCollectionTarget(
            targetCol,
            activeSubCollectionId,
            null,
            reqToSave
          );

          try {
            await saveAndRefresh(updatedCol);
            triggerSaveFeedback();
            return;
          } catch (e) {
            console.error('Quick save failed:', e);
          }
        }
      }

      if (openSaveModal) {
        openSaveModal();
      }
    },
    [activeCollectionId, activeSubCollectionId, collections, activeRequestId, saveAndRefresh, triggerSaveFeedback]
  );

  /**
   * Save request into a collection and sub-collection file (.json)
   */
  const handleSaveToCollection = useCallback(
    async ({
      targetCollectionId,
      targetSubCollectionId,
      newCollectionName,
      newSubCollectionName,
      request
    }) => {
      try {
        const reqWithResponse = { ...request };
        let finalColId;
        let finalSubColId;
        let colToSave;

        if (newCollectionName) {
          finalColId =
            newCollectionName.toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '_' + Date.now().toString(36);
          if (newSubCollectionName) {
            finalSubColId = 'sub_' + generateId();
            colToSave = {
              id: finalColId,
              name: newCollectionName.trim(),
              requests: [],
              subCollections: [
                { id: finalSubColId, name: newSubCollectionName.trim(), requests: [reqWithResponse] }
              ]
            };
          } else {
            finalSubColId = null;
            colToSave = {
              id: finalColId,
              name: newCollectionName.trim(),
              requests: [reqWithResponse],
              subCollections: []
            };
          }
        } else {
          finalColId = targetCollectionId;
          const found = collections.find((c) => c.id === targetCollectionId);
          if (!found) return;
          const result = saveRequestIntoCollectionTarget(
            found,
            targetSubCollectionId,
            newSubCollectionName,
            reqWithResponse
          );
          colToSave = result.updatedCol;
          finalSubColId = result.finalSubId;
        }

        await saveAndRefresh(colToSave);
        setActiveCollectionId(finalColId);
        if (setActiveSubCollectionId) setActiveSubCollectionId(finalSubColId);
        setActiveRequestId(request.id);
        triggerSaveFeedback();
        if (currentResponse && setResponseCache) {
          setResponseCache((prev) => ({ ...prev, [request.id]: currentResponse }));
        }
      } catch (err) {
        alert(`Failed to save: ${err.message}`);
      }
    },
    [collections, currentResponse, saveAndRefresh, setActiveCollectionId, setActiveSubCollectionId, setActiveRequestId, setResponseCache, triggerSaveFeedback]
  );

  /**
   * Collection operations
   */
  const handleCreateCollection = useCallback(async (name, description) => {
    try {
      const colId = name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '_' + Date.now().toString(36);
      const newCol = {
        id: colId,
        name: name.trim(),
        description: (description || '').trim(),
        requests: [],
        subCollections: []
      };
      await saveAndRefresh(newCol);
    } catch (err) {
      alert(`Failed to create collection: ${err.message}`);
    }
  }, [saveAndRefresh]);

  const handleRenameCollection = useCallback(
    async (colId, newName) => {
      const trimmed = (newName || '').trim();
      if (!trimmed) return;
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol || targetCol.name === trimmed) return;
      const updatedCol = { ...JSON.parse(JSON.stringify(targetCol)), name: trimmed, updatedAt: new Date().toISOString() };
      try {
        await saveAndRefresh(updatedCol);
      } catch (err) {
        alert(`Failed to rename collection: ${err.message}`);
      }
    },
    [collections, saveAndRefresh]
  );

  const handleDeleteCollection = useCallback(
    async (colId) => {
      try {
        await api.deleteCollection(colId);
        setCollections((prev) => prev.filter((c) => c.id !== colId));
        if (activeCollectionId === colId) {
          setActiveCollectionId(null);
          if (setActiveSubCollectionId) setActiveSubCollectionId(null);
        }
      } catch (err) {
        alert(`Failed to delete collection: ${err.message}`);
      }
    },
    [activeCollectionId, setActiveCollectionId, setActiveSubCollectionId]
  );

  const handleDuplicateCollection = useCallback(
    async (colId) => {
      try {
        const sourceCol = collections.find((c) => c.id === colId);
        if (!sourceCol) return;
        const { duplicatedCol, newId, duplicatedDirectReqs, duplicatedSubs } =
          duplicateCollectionData(sourceCol, collections);
        await saveAndRefresh(duplicatedCol);
        setActiveCollectionId(newId);
        if (duplicatedDirectReqs.length > 0 && onSelectRequest) {
          if (setActiveSubCollectionId) setActiveSubCollectionId(null);
          onSelectRequest(duplicatedDirectReqs[0], newId, null);
        } else {
          const firstSub = duplicatedSubs[0];
          if (firstSub && setActiveSubCollectionId) setActiveSubCollectionId(firstSub.id);
          if (firstSub?.requests?.length > 0 && onSelectRequest) {
            onSelectRequest(firstSub.requests[0], newId, firstSub.id);
          }
        }
      } catch (err) {
        alert(`Failed to duplicate collection: ${err.message}`);
      }
    },
    [collections, saveAndRefresh, setActiveCollectionId, setActiveSubCollectionId, onSelectRequest]
  );

  /**
   * Sub-collection operations
   */
  const handleCreateSubCollection = useCallback(
    async (colId, subName) => {
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const trimmed = (subName || '').trim() || 'untitled';
      const newSub = { id: 'sub_' + generateId(), name: trimmed, requests: [] };
      const updatedCol = JSON.parse(JSON.stringify(targetCol));
      updatedCol.subCollections = [...(updatedCol.subCollections || []), newSub];
      try {
        await saveAndRefresh(updatedCol);
        return newSub.id;
      } catch (err) {
        alert(`Failed to create sub-collection: ${err.message}`);
      }
    },
    [collections, saveAndRefresh]
  );

  const handleRenameSubCollection = useCallback(
    async (colId, subId, newName) => {
      const trimmed = (newName || '').trim();
      if (!trimmed) return;
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const updatedCol = JSON.parse(JSON.stringify(targetCol));
      const targetSub = (updatedCol.subCollections || []).find((s) => s.id === subId);
      if (!targetSub || targetSub.name === trimmed) return;
      targetSub.name = trimmed;
      try {
        await saveAndRefresh(updatedCol);
      } catch (err) {
        alert(`Failed to rename sub-collection: ${err.message}`);
      }
    },
    [collections, saveAndRefresh]
  );

  const handleDuplicateSubCollection = useCallback(
    async (colId, subId) => {
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const targetSub = (targetCol.subCollections || []).find((s) => s.id === subId);
      if (!targetSub) return;
      const updatedCol = JSON.parse(JSON.stringify(targetCol));
      const subIdx = updatedCol.subCollections.findIndex((s) => s.id === subId);
      const newSub = duplicateSubCollectionData(targetSub);
      updatedCol.subCollections.splice(subIdx + 1, 0, newSub);
      try {
        await saveAndRefresh(updatedCol);
      } catch (err) {
        alert(`Failed to duplicate sub-collection: ${err.message}`);
      }
    },
    [collections, saveAndRefresh]
  );

  const handleDeleteSubCollection = useCallback(
    async (colId, subId) => {
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const updatedCol = JSON.parse(JSON.stringify(targetCol));
      updatedCol.subCollections = (updatedCol.subCollections || []).filter((s) => s.id !== subId);
      try {
        await saveAndRefresh(updatedCol);
        if (activeSubCollectionId === subId && setActiveSubCollectionId) {
          setActiveSubCollectionId(null);
        }
      } catch (err) {
        alert(`Failed to delete sub-collection: ${err.message}`);
      }
    },
    [collections, saveAndRefresh, activeSubCollectionId, setActiveSubCollectionId]
  );

  /**
   * Request operations within a collection or sub-collection
   */
  const handleCreateRequestInCollection = useCallback(
    async (colId) => {
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const updatedCol = JSON.parse(JSON.stringify(targetCol));
      if (!Array.isArray(updatedCol.requests)) updatedCol.requests = [];

      if (stashCurrentRequestDraft) stashCurrentRequestDraft();
      const newReq = createNewBlankRequest();
      updatedCol.requests = [...updatedCol.requests, newReq];

      try {
        await saveAndRefresh(updatedCol);
        if (loadNewBlankRequest) {
          loadNewBlankRequest(newReq, colId, null);
        }
      } catch (err) {
        alert(`Failed to create request: ${err.message}`);
      }
    },
    [collections, saveAndRefresh, stashCurrentRequestDraft, loadNewBlankRequest]
  );

  const handleCreateRequestInSubCollection = useCallback(
    async (colId, subId) => {
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const updatedCol = JSON.parse(JSON.stringify(targetCol));
      const targetSub = (updatedCol.subCollections || []).find((s) => s.id === subId);
      if (!targetSub) return;

      if (stashCurrentRequestDraft) stashCurrentRequestDraft();
      const newReq = createNewBlankRequest();
      targetSub.requests = [...(targetSub.requests || []), newReq];

      try {
        await saveAndRefresh(updatedCol);
        if (loadNewBlankRequest) {
          loadNewBlankRequest(newReq, colId, subId);
        }
      } catch (err) {
        alert(`Failed to create request: ${err.message}`);
      }
    },
    [collections, saveAndRefresh, stashCurrentRequestDraft, loadNewBlankRequest]
  );

  const handleDuplicateRequest = useCallback(
    async (colId, subId, reqId) => {
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const { updatedCol, newReq, subId: finalSubId } = duplicateRequestInTree(targetCol, subId, reqId);
      if (!newReq) return;
      try {
        await saveAndRefresh(updatedCol);
        if (onSelectRequest) onSelectRequest(newReq, colId, finalSubId);
      } catch (err) {
        alert(`Failed to duplicate request: ${err.message}`);
      }
    },
    [collections, saveAndRefresh, onSelectRequest]
  );

  /**
   * Auto-save: patch only some fields (e.g. name, url) of an already-saved request.
   * No-op for unsaved drafts or when nothing changed.
   */
  const handlePatchSavedRequest = useCallback(
    async (colId, reqId, patch) => {
      if (!colId || !reqId) return;
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const { updatedCol, changed } = patchRequestInTree(targetCol, reqId, patch);
      if (!changed) return;
      try {
        await saveAndRefresh(updatedCol);
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    },
    [collections, saveAndRefresh]
  );

  const handleDeleteRequest = useCallback(
    async (colId, subId, reqId) => {
      const targetCol = collections.find((c) => c.id === colId);
      if (!targetCol) return;
      const updatedCol = deleteRequestFromTree(targetCol, subId, reqId);
      try {
        await saveAndRefresh(updatedCol);
        if (activeRequestId === reqId) {
          const allReqs = getAllCollectionRequests(updatedCol);
          if (allReqs.length > 0 && onSelectRequest) {
            const firstFound = findRequestAndSubCollection(updatedCol, allReqs[0].id);
            onSelectRequest(allReqs[0], colId, firstFound?.subCollection?.id || null);
          } else if (onNewRequest) {
            onNewRequest();
          }
        }
      } catch (err) {
        alert(`Failed to delete request: ${err.message}`);
      }
    },
    [collections, saveAndRefresh, activeRequestId, onSelectRequest, onNewRequest]
  );

  return {
    collections,
    setCollections,
    activeCollection,
    activeSubCollection,
    activeSubCollectionId,
    setActiveSubCollectionId,
    saveFeedback,
    refreshCollections,
    handleQuickSave,
    handleSaveToCollection,
    handleCreateCollection,
    handleRenameCollection,
    handleDeleteCollection,
    handleDuplicateCollection,
    handleCreateSubCollection,
    handleRenameSubCollection,
    handleDuplicateSubCollection,
    handleDeleteSubCollection,
    handleCreateRequestInCollection,
    handleCreateRequestInSubCollection,
    handleDuplicateRequest,
    handlePatchSavedRequest,
    handleDeleteRequest
  };
}
