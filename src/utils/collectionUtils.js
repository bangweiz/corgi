/**
 * Utility functions for Collection and Sub-collection hierarchy.
 * A collection can contain direct requests AND multiple sub-collections.
 * A sub-collection can only contain requests.
 */
import { generateId } from './urlSync.js';

export function normalizeCollection(col) {
  if (!col) return col;
  return {
    ...col,
    requests: Array.isArray(col.requests) ? col.requests : [],
    subCollections: Array.isArray(col.subCollections) ? col.subCollections : []
  };
}

export function countCollectionRequests(col) {
  if (!col) return 0;
  const directCount = Array.isArray(col.requests) ? col.requests.length : 0;
  const subCount = Array.isArray(col.subCollections)
    ? col.subCollections.reduce(
        (acc, s) => acc + (Array.isArray(s.requests) ? s.requests.length : 0),
        0
      )
    : 0;
  return directCount + subCount;
}

export function getAllCollectionRequests(col) {
  if (!col) return [];
  const direct = Array.isArray(col.requests) ? col.requests : [];
  const fromSubs = Array.isArray(col.subCollections)
    ? col.subCollections.flatMap((s) => (Array.isArray(s.requests) ? s.requests : []))
    : [];
  return [...direct, ...fromSubs];
}

export function findRequestAndSubCollection(col, requestId) {
  if (!col || !requestId) return { request: null, subCollection: null };

  if (Array.isArray(col.requests)) {
    const directReq = col.requests.find((r) => r.id === requestId);
    if (directReq) {
      return { request: directReq, subCollection: null };
    }
  }

  if (Array.isArray(col.subCollections)) {
    for (const sub of col.subCollections) {
      const found = (sub.requests || []).find((r) => r.id === requestId);
      if (found) {
        return { request: found, subCollection: sub };
      }
    }
  }

  return { request: null, subCollection: null };
}

export function createNewBlankRequest(name = 'New Request') {
  return {
    id: 'req_' + generateId(),
    name,
    method: 'GET',
    url: 'https://httpbin.org/get',
    params: [],
    headers: [
      { id: generateId(), key: 'Accept', value: 'application/json', enabled: true, description: '' }
    ],
    authType: 'none',
    bearerToken: '',
    bodyType: 'none',
    body: '',
    formData: [],
    extractRules: []
  };
}

export function duplicateSubCollectionData(sub) {
  return {
    id: 'sub_' + generateId(),
    name: `${sub.name} (Copy)`,
    requests: (sub.requests || []).map((r) => ({
      ...JSON.parse(JSON.stringify(r)),
      id: 'req_' + generateId()
    }))
  };
}

export function saveRequestIntoCollectionTarget(
  targetCol,
  targetSubCollectionId,
  newSubCollectionName,
  reqWithResponse
) {
  const col = JSON.parse(JSON.stringify(targetCol));
  if (!Array.isArray(col.requests)) col.requests = [];
  if (!Array.isArray(col.subCollections)) col.subCollections = [];

  // Case 1: Create a brand new sub-collection
  if (newSubCollectionName && newSubCollectionName.trim()) {
    const finalSubId = 'sub_' + generateId();
    const newSub = { id: finalSubId, name: newSubCollectionName.trim(), requests: [reqWithResponse] };
    col.subCollections.push(newSub);
    return { updatedCol: col, finalSubId };
  }

  // Case 2: Save into a specific existing sub-collection
  if (targetSubCollectionId) {
    const targetSub = col.subCollections.find((s) => s.id === targetSubCollectionId);
    if (targetSub) {
      const existIdx = (targetSub.requests || []).findIndex((r) => r.id === reqWithResponse.id);
      if (existIdx >= 0) {
        targetSub.requests[existIdx] = reqWithResponse;
      } else {
        targetSub.requests = [...(targetSub.requests || []), reqWithResponse];
      }
      return { updatedCol: col, finalSubId: targetSub.id };
    }
  }

  // Case 3: Save directly into collection requests (root)
  const existIdx = col.requests.findIndex((r) => r.id === reqWithResponse.id);
  if (existIdx >= 0) {
    col.requests[existIdx] = reqWithResponse;
  } else {
    col.requests.push(reqWithResponse);
  }
  return { updatedCol: col, finalSubId: null };
}

export function duplicateCollectionData(sourceCol, existingCollections = []) {
  const baseName = sourceCol.name.replace(/\s*\(Copy\s*\d*\)$/i, '');
  const existingCopies = existingCollections.filter((c) => c.name.startsWith(baseName));
  const copySuffix = existingCopies.length > 1 ? ` (Copy ${existingCopies.length})` : ' (Copy)';
  const newName = `${baseName}${copySuffix}`;
  const newId = `${sourceCol.id.replace(/_copy.*$/, '')}_copy_${Date.now().toString(36)}`;
  const duplicatedSubs = (sourceCol.subCollections || []).map(duplicateSubCollectionData);
  const duplicatedDirectReqs = (sourceCol.requests || []).map((r) => ({
    ...JSON.parse(JSON.stringify(r)),
    id: 'req_' + generateId()
  }));

  return {
    duplicatedCol: {
      ...JSON.parse(JSON.stringify(sourceCol)),
      id: newId,
      name: newName,
      requests: duplicatedDirectReqs,
      subCollections: duplicatedSubs,
      updatedAt: new Date().toISOString()
    },
    newId,
    duplicatedDirectReqs,
    duplicatedSubs
  };
}

export function duplicateRequestInTree(col, subId, reqId) {
  const updatedCol = JSON.parse(JSON.stringify(col));
  let duplicatedReq = null;

  if (subId) {
    const foundSub = (updatedCol.subCollections || []).find((s) => s.id === subId);
    if (foundSub) {
      const idx = (foundSub.requests || []).findIndex((r) => r.id === reqId);
      if (idx >= 0) {
        const srcReq = foundSub.requests[idx];
        duplicatedReq = { ...JSON.parse(JSON.stringify(srcReq)), id: 'req_' + generateId(), name: `${srcReq.name || 'Untitled Request'} (Copy)` };
        foundSub.requests.splice(idx + 1, 0, duplicatedReq);
        return { updatedCol, newReq: duplicatedReq, subId };
      }
    }
  }

  if (Array.isArray(updatedCol.requests)) {
    const idx = updatedCol.requests.findIndex((r) => r.id === reqId);
    if (idx >= 0) {
      const srcReq = updatedCol.requests[idx];
      duplicatedReq = { ...JSON.parse(JSON.stringify(srcReq)), id: 'req_' + generateId(), name: `${srcReq.name || 'Untitled Request'} (Copy)` };
      updatedCol.requests.splice(idx + 1, 0, duplicatedReq);
      return { updatedCol, newReq: duplicatedReq, subId: null };
    }
  }

  for (const s of updatedCol.subCollections || []) {
    const idx = (s.requests || []).findIndex((r) => r.id === reqId);
    if (idx >= 0) {
      const srcReq = s.requests[idx];
      duplicatedReq = { ...JSON.parse(JSON.stringify(srcReq)), id: 'req_' + generateId(), name: `${srcReq.name || 'Untitled Request'} (Copy)` };
      s.requests.splice(idx + 1, 0, duplicatedReq);
      return { updatedCol, newReq: duplicatedReq, subId: s.id };
    }
  }

  return { updatedCol, newReq: null, subId: null };
}

export function deleteRequestFromTree(col, subId, reqId) {
  const updatedCol = JSON.parse(JSON.stringify(col));
  if (subId) {
    const foundSub = (updatedCol.subCollections || []).find((s) => s.id === subId);
    if (foundSub) {
      foundSub.requests = (foundSub.requests || []).filter((r) => r.id !== reqId);
    }
  } else {
    if (Array.isArray(updatedCol.requests)) {
      updatedCol.requests = updatedCol.requests.filter((r) => r.id !== reqId);
    }
    for (const s of updatedCol.subCollections || []) {
      s.requests = (s.requests || []).filter((r) => r.id !== reqId);
    }
  }
  return updatedCol;
}
