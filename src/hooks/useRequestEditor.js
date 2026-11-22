import { useState, useRef, useCallback } from 'react';
import { splitUrlAndQuery, parseQueryStringToParams, buildUrlWithParams, generateId } from '../utils/urlSync';
import { buildPayload } from '../utils/payloadBuilder';
import { findRequestAndSubCollection } from '../utils/collectionUtils';
import { api } from '../services/api';

export const DEFAULT_URL = 'https://httpbin.org/get?greeting=hello&target=corgi';

export function useRequestEditor() {
  // Request States
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState(DEFAULT_URL);
  const [params, setParams] = useState(() => {
    const { queryString } = splitUrlAndQuery(DEFAULT_URL);
    return parseQueryStringToParams(queryString);
  });
  const [headers, setHeaders] = useState([
    { id: generateId(), key: 'Accept', value: 'application/json', enabled: true, description: '' }
  ]);
  const [authType, setAuthType] = useState('none');
  const [bearerToken, setBearerToken] = useState('');
  const [bodyType, setBodyType] = useState('none');
  const [body, setBody] = useState('');
  const [formData, setFormData] = useState([]);
  const [extractRules, setExtractRules] = useState([]);
  const [requestName, setRequestName] = useState('GET Request (with params)');
  const [activeRequestId, setActiveRequestId] = useState('req_1');
  const [activeCollectionId, setActiveCollectionId] = useState('sample');
  const [activeSubCollectionId, setActiveSubCollectionId] = useState(null);

  // Response & Loading States
  const [response, setResponse] = useState(null);
  const [responseCache, setResponseCache] = useState({});
  const requestDraftsRef = useRef({});
  const [isLoading, setIsLoading] = useState(false);

  // Ref to prevent feedback loops in two-way URL <-> Params sync
  const isSyncingFromParamsRef = useRef(false);

  // Helper to batch-apply request field states
  const applyRequestState = useCallback((data) => {
    setMethod(data.method || 'GET');
    setUrl(data.url || '');
    setParams(data.params || []);
    setHeaders(data.headers || []);
    setAuthType(data.authType || 'none');
    setBearerToken(data.bearerToken || '');
    setBodyType(data.bodyType || 'none');
    setBody(data.body || '');
    setFormData(data.formData || []);
    setExtractRules(data.extractRules || []);
    setRequestName(data.requestName || data.name || 'Untitled Request');
  }, []);

  /**
   * Helper to stash current active request editor state and response
   */
  const stashCurrentRequestDraft = useCallback(() => {
    if (activeRequestId) {
      requestDraftsRef.current[activeRequestId] = {
        method, url, params, headers, authType, bearerToken,
        bodyType, body, formData, extractRules, requestName,
        collectionId: activeCollectionId,
        subCollectionId: activeSubCollectionId,
        response
      };
    }
  }, [
    activeRequestId, activeCollectionId, activeSubCollectionId, method, url, params,
    headers, authType, bearerToken, bodyType, body, formData, extractRules, requestName, response
  ]);

  /**
   * Two-way sync: When URL changes via user typing in URL input
   */
  const handleUrlChange = useCallback((newUrl) => {
    setUrl(newUrl);

    if (isSyncingFromParamsRef.current) return;

    const { queryString } = splitUrlAndQuery(newUrl);
    const parsed = parseQueryStringToParams(queryString);

    setParams((prev) =>
      parsed.map((item) => {
        const found = prev.find((p) => p.key === item.key);
        if (found) {
          return {
            ...item,
            id: found.id,
            description: found.description || '',
            enabled: found.enabled !== false
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Two-way sync: When Query Params table is edited
   */
  const handleParamsChange = useCallback(
    (newParams) => {
      setParams(newParams);

      isSyncingFromParamsRef.current = true;
      const { basePart } = splitUrlAndQuery(url);
      const newUrl = buildUrlWithParams(basePart, newParams);
      setUrl(newUrl);

      setTimeout(() => {
        isSyncingFromParamsRef.current = false;
      }, 20);
    },
    [url]
  );

  /**
   * Send HTTP Request through local Node Proxy
   */
  const handleSendRequest = useCallback(
    async (activeEnvVariables = [], onAfterSend = null, onAutoExtract = null) => {
      if (!url.trim() || isLoading) return;

      setIsLoading(true);
      setResponse(null);

      try {
        const payload = buildPayload({
          method, url, headers, authType, bearerToken, bodyType, body, formData, activeEnvVariables
        });

        const data = await api.sendProxyRequest(payload);
        setResponse(data);

        const currentReqId = activeRequestId || 'req_' + generateId();
        if (!activeRequestId) {
          setActiveRequestId(currentReqId);
        }
        setResponseCache((prev) => ({
          ...prev,
          [currentReqId]: data
        }));
        requestDraftsRef.current[currentReqId] = {
          method, url, params, headers, authType, bearerToken,
          bodyType, body, formData, extractRules, requestName,
          collectionId: activeCollectionId,
          subCollectionId: activeSubCollectionId,
          response: data
        };

        if (onAutoExtract) {
          await onAutoExtract(extractRules, data);
        }

        if (onAfterSend) {
          onAfterSend();
        }
      } catch (err) {
        const errResponse = {
          status: 0,
          statusText: 'Proxy Error',
          durationMs: 0,
          sizeBytes: 0,
          headers: {},
          rawBody: `Local proxy communication failed: ${err.message}\nPlease make sure the backend service (port 3001) is running.`,
          isJson: false,
          data: null
        };
        setResponse(errResponse);
        const currentReqId = activeRequestId || 'req_' + generateId();
        setResponseCache((prev) => ({
          ...prev,
          [currentReqId]: errResponse
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [url, isLoading, headers, authType, bearerToken, body, bodyType, formData, extractRules, method, activeRequestId, activeCollectionId, params, requestName]
  );

  /**
   * Clear saved response for a given request ID (called when closing a tab)
   */
  const clearRequestResponse = useCallback(
    (reqId) => {
      setResponseCache((prev) => {
        const next = { ...prev };
        delete next[reqId];
        return next;
      });

      if (requestDraftsRef.current[reqId]) {
        requestDraftsRef.current[reqId].response = null;
      }

      if (activeRequestId === reqId) {
        setResponse(null);
      }
    },
    [activeRequestId]
  );

  /**
   * Select an open tab to load into the workspace editor
   */
  const handleSelectTab = useCallback(
    (tabId, collectionsList = [], tabsList = []) => {
      if (tabId === activeRequestId) return;

      stashCurrentRequestDraft();

      const draft = requestDraftsRef.current[tabId];
      const tabObj = tabsList.find((t) => t.id === tabId);

      let targetColId = draft?.collectionId ?? tabObj?.collectionId ?? null;
      let targetSubColId = draft?.subCollectionId ?? tabObj?.subCollectionId ?? null;

      if (!targetColId && collectionsList.length > 0) {
        for (const col of collectionsList) {
          const found = findRequestAndSubCollection(col, tabId);
          if (found?.request) {
            targetColId = col.id;
            targetSubColId = found.subCollection ? found.subCollection.id : null;
            break;
          }
        }
      }

      if (draft) {
        applyRequestState(draft);
        setResponse(responseCache[tabId] || draft.response || null);
      } else {
        let foundInCols = false;
        for (const col of collectionsList) {
          const found = findRequestAndSubCollection(col, tabId);
          if (found?.request) {
            foundInCols = true;
            const req = found.request;
            applyRequestState({
              ...req,
              params: req.params || parseQueryStringToParams(splitUrlAndQuery(req.url || '').queryString)
            });
            setResponse(responseCache[tabId] || req.lastResponse || null);
            targetColId = col.id;
            targetSubColId = found.subCollection ? found.subCollection.id : null;
            break;
          }
        }
        if (!foundInCols && tabObj) {
          const { queryString } = splitUrlAndQuery(DEFAULT_URL);
          applyRequestState({
            method: tabObj.method || 'GET',
            url: DEFAULT_URL,
            params: parseQueryStringToParams(queryString),
            headers: [{ id: generateId(), key: 'Accept', value: 'application/json', enabled: true, description: '' }],
            authType: 'none',
            bearerToken: '',
            bodyType: 'none',
            body: '',
            formData: [],
            extractRules: [],
            requestName: tabObj.name || 'New Request'
          });
          setResponse(null);
        }
      }

      setActiveCollectionId(targetColId);
      setActiveSubCollectionId(targetSubColId);
      setActiveRequestId(tabId);
    },
    [activeRequestId, stashCurrentRequestDraft, applyRequestState, responseCache]
  );

  /**
   * Select a request from Collections to load into editor
   */
  const handleSelectRequest = useCallback(
    (req, colId, subId, setMainView) => {
      stashCurrentRequestDraft();

      const targetId = req.id;
      const draft = requestDraftsRef.current[targetId];

      if (draft) {
        applyRequestState(draft);
      } else {
        applyRequestState({
          ...req,
          params:
            req.params ||
            parseQueryStringToParams(splitUrlAndQuery(req.url || '').queryString)
        });
      }

      setActiveRequestId(targetId);
      setActiveCollectionId(colId || null);
      setActiveSubCollectionId(subId || null);
      if (setMainView) setMainView('request');

      const restoredResponse =
        responseCache[targetId] || draft?.response || req.lastResponse || null;
      setResponse(restoredResponse);
    },
    [stashCurrentRequestDraft, applyRequestState, responseCache]
  );

  /**
   * Reset to a clean new draft request
   */
  const handleNewRequest = useCallback(
    (setMainView, explicitId = null) => {
      stashCurrentRequestDraft();

      const newDraftId = explicitId || 'draft_' + generateId();
      setActiveRequestId(newDraftId);
      setActiveCollectionId(null);
      setActiveSubCollectionId(null);
      if (setMainView) setMainView('request');

      const { queryString } = splitUrlAndQuery(DEFAULT_URL);
      const initialState = {
        method: 'GET',
        url: DEFAULT_URL,
        params: parseQueryStringToParams(queryString),
        headers: [{ id: generateId(), key: 'Accept', value: 'application/json', enabled: true, description: '' }],
        authType: 'none', bearerToken: '', bodyType: 'none', body: '',
        formData: [], extractRules: [], requestName: 'New Request',
        collectionId: null, subCollectionId: null, response: null
      };
      requestDraftsRef.current[newDraftId] = initialState;
      applyRequestState(initialState);
      setResponse(null);
      return newDraftId;
    },
    [stashCurrentRequestDraft, applyRequestState]
  );

  /**
   * Load a newly added blank request
   */
  const loadNewBlankRequest = useCallback(
    (newReq, colId, subId) => {
      setActiveCollectionId(colId);
      setActiveSubCollectionId(subId || null);
      setActiveRequestId(newReq.id);
      applyRequestState({
        ...newReq,
        url: 'https://httpbin.org/get',
        requestName: 'New Request'
      });
      setResponse(null);
    },
    [applyRequestState]
  );

  /**
   * Select an item from History
   */
  const handleSelectHistoryItem = useCallback(
    (item) => {
      stashCurrentRequestDraft();

      const histId = item.id;
      setActiveRequestId(histId);

      const draft = requestDraftsRef.current[histId];
      if (draft) {
        applyRequestState(draft);
      } else {
        const { queryString } = splitUrlAndQuery(item.url || '');
        applyRequestState({
          ...item,
          params: parseQueryStringToParams(queryString),
          requestName:
            item.name || `${item.method} ${item.url.split('?')[0].split('/').pop() || 'Request'}`
        });
      }

      const restoredResponse =
        responseCache[histId] ||
        draft?.response ||
        (item.status !== undefined
          ? {
              status: item.status,
              statusText: item.status === 200 ? 'OK' : item.statusText || '',
              durationMs: item.durationMs,
              sizeBytes: item.sizeBytes,
              headers: item.headers || {},
              rawBody: item.rawBody || '',
              isJson: item.isJson || false,
              data: item.data || null
            }
          : null);

      setResponse(restoredResponse);
    },
    [stashCurrentRequestDraft, applyRequestState, responseCache]
  );

  /**
   * Quick preset tester for empty state
   */
  const handleSendPreset = useCallback(
    (type, activeEnvVariables, onAfterSend) => {
      if (type === 'get') {
        applyRequestState({
          method: 'GET',
          url: 'https://httpbin.org/get?greeting=hello&target=corgi',
          params: parseQueryStringToParams('greeting=hello&target=corgi'),
          bodyType: 'none'
        });
      } else if (type === 'post') {
        applyRequestState({
          method: 'POST',
          url: 'https://httpbin.org/post',
          params: [],
          bodyType: 'json',
          body: JSON.stringify(
            { message: 'Hello Corgi Local HTTP Debugger!', status: 'working' },
            null,
            2
          )
        });
      }
      setTimeout(() => {
        handleSendRequest(activeEnvVariables, onAfterSend);
      }, 50);
    },
    [applyRequestState, handleSendRequest]
  );

  return {
    method,
    setMethod,
    url,
    setUrl,
    params,
    setParams,
    headers,
    setHeaders,
    authType,
    setAuthType,
    bearerToken,
    setBearerToken,
    bodyType,
    setBodyType,
    body,
    setBody,
    formData,
    setFormData,
    extractRules,
    setExtractRules,
    requestName,
    setRequestName,
    activeRequestId,
    setActiveRequestId,
    activeCollectionId,
    setActiveCollectionId,
    activeSubCollectionId,
    setActiveSubCollectionId,
    response,
    setResponse,
    responseCache,
    setResponseCache,
    isLoading,
    stashCurrentRequestDraft,
    handleUrlChange,
    handleParamsChange,
    handleSendRequest,
    clearRequestResponse,
    handleSelectTab,
    handleSelectRequest,
    handleNewRequest,
    loadNewBlankRequest,
    handleSelectHistoryItem,
    handleSendPreset
  };
}
