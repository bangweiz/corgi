import React, { useState, useEffect, useCallback } from 'react';
import { Send, Plus } from 'lucide-react';
import { Header } from './components/Header';
import { RequestTabsBar } from './components/RequestTabsBar';
import { MethodUrlBar } from './components/MethodUrlBar';
import { RequestWorkspace } from './components/RequestWorkspace';
import { CollectionsSidebar } from './components/CollectionsSidebar';
import { EnvironmentView } from './components/EnvironmentView';
import { SaveRequestModal } from './components/SaveRequestModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ConfirmModal } from './components/ConfirmModal';
import { useTheme } from './hooks/useTheme';
import { useConfirm } from './hooks/useConfirm';
import { useEnvironments } from './hooks/useEnvironments';
import { useHistory } from './hooks/useHistory';
import { useRequestEditor } from './hooks/useRequestEditor';
import { useRequestTabs } from './hooks/useRequestTabs';
import { useCollections } from './hooks/useCollections';
import { runAutoExtraction } from './utils/variableExtractor';
import { api } from './services/api';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { confirmModal, requestConfirm, closeConfirmModal } = useConfirm();

  // Navigation & UI States
  const [mainView, setMainView] = useState('request'); // 'request' | 'environment'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);

  // Request Tabs
  const { tabs, addOrUpdateTab, updateTab, removeTab } = useRequestTabs();

  // Environments
  const {
    environments, activeEnvId, setActiveEnvId, activeEnvVariables, activeEnvName,
    refreshEnvironments, handleSaveEnv, handleCreateEnv, handleDeleteEnv,
    handleDuplicateEnv, handleSetVariable
  } = useEnvironments();

  // Callback to update or add variable to active environment from tooltips
  const handleUpdateActiveVariable = useCallback(
    async (key, value) => {
      let targetId = activeEnvId;
      if (!targetId && environments.length > 0) {
        targetId = environments[0].id;
        setActiveEnvId(targetId);
      }
      if (!targetId) {
        alert('Please select or create an environment first to save variables.');
        return false;
      }
      return await handleSetVariable(targetId, key, value);
    },
    [activeEnvId, environments, handleSetVariable, setActiveEnvId]
  );

  // History
  const { history, refreshHistory, handleClearHistory } = useHistory();

  // Request Editor
  const {
    method, setMethod, url, setUrl, params, headers, setHeaders,
    authType, setAuthType, bearerToken, setBearerToken,
    bodyType, setBodyType, body, setBody, formData, setFormData,
    extractRules, setExtractRules, requestName, setRequestName,
    activeRequestId, setActiveRequestId, activeCollectionId, setActiveCollectionId,
    activeSubCollectionId, setActiveSubCollectionId, response, setResponse,
    responseCache, setResponseCache, isLoading, stashCurrentRequestDraft,
    handleUrlChange, handleParamsChange, handleSendRequest, clearRequestResponse,
    handleSelectTab, handleSelectRequest, handleNewRequest, loadNewBlankRequest,
    handleSelectHistoryItem, handleSendPreset
  } = useRequestEditor();

  const onSelectCollectionRequest = (req, colId, subId) => {
    addOrUpdateTab({
      id: req.id,
      name: req.name || 'Untitled Request',
      method: req.method || 'GET',
      collectionId: colId,
      subCollectionId: subId
    });
    handleSelectRequest(req, colId, subId, setMainView);
  };

  // Collections
  const {
    collections,
    setCollections,
    activeCollection,
    activeSubCollection,
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
    handleDeleteRequest
  } = useCollections({
    activeCollectionId,
    setActiveCollectionId,
    activeSubCollectionId,
    setActiveSubCollectionId,
    activeRequestId,
    setActiveRequestId,
    onSelectRequest: onSelectCollectionRequest,
    onNewRequest: () => {
      const newDraftId = handleNewRequest(setMainView);
      addOrUpdateTab({ id: newDraftId, name: 'New Request', method: 'GET', collectionId: null, subCollectionId: null });
    },
    stashCurrentRequestDraft,
    loadNewBlankRequest: (newReq, colId, subId) => {
      loadNewBlankRequest(newReq, colId, subId);
      addOrUpdateTab({ id: newReq.id, name: newReq.name, method: newReq.method, collectionId: colId, subCollectionId: subId });
    },
    currentResponse: response,
    setResponseCache
  });

  // Load initial backend data
  useEffect(() => {
    refreshCollections();
    refreshEnvironments();
    refreshHistory();
    api.getStorageInfo().then(setStorageInfo).catch(() => {});
  }, [refreshCollections, refreshEnvironments, refreshHistory]);

  // Method & Request Name live sync with active Tab
  const onChangeMethod = (m) => {
    setMethod(m);
    if (activeRequestId) {
      updateTab(activeRequestId, { method: m });
    }
  };

  const onChangeRequestName = (name) => {
    setRequestName(name);
    if (activeRequestId) {
      updateTab(activeRequestId, { name });
    }
  };

  // Send Request: every sent request is guaranteed to be a tab
  const onSend = () => {
    if (!activeRequestId || tabs.length === 0) return;
    addOrUpdateTab({
      id: activeRequestId,
      name: requestName.trim() || `${method} Request`,
      method,
      collectionId: activeCollectionId,
      subCollectionId: activeSubCollectionId
    });
    handleSendRequest(activeEnvVariables, refreshHistory, async (rules, resData) => {
      if (rules && rules.length > 0 && activeEnvId) {
        await runAutoExtraction(rules, resData, activeEnvId, handleSetVariable);
      }
    });
  };

  // Tab actions
  const onSelectTab = (tabId) => {
    handleSelectTab(tabId, collections, tabs);
  };

  const onNewTab = () => {
    const newDraftId = handleNewRequest(setMainView);
    addOrUpdateTab({
      id: newDraftId,
      name: 'New Request',
      method: 'GET',
      collectionId: null,
      subCollectionId: null
    });
  };

  // Closing a tab clears that request's saved response completely
  const onCloseTab = (tabId) => {
    clearRequestResponse(tabId);

    setCollections((prev) =>
      prev.map((c) => ({
        ...c,
        subCollections: (c.subCollections || []).map((s) => ({
          ...s,
          requests: (s.requests || []).map((r) =>
            r.id === tabId ? { ...r, lastResponse: undefined } : r
          )
        }))
      }))
    );

    const { nextTabs, nextActiveId, isCurrentClosed } = removeTab(tabId, activeRequestId);

    if (isCurrentClosed) {
      if (nextActiveId) {
        handleSelectTab(nextActiveId, collections, nextTabs);
      } else {
        setActiveRequestId(null);
        setActiveCollectionId(null);
        setActiveSubCollectionId(null);
        setResponse(null);
      }
    }
  };

  const onQuickSave = () => {
    if (!activeRequestId || tabs.length === 0) return;
    handleQuickSave(
      { method, url, params, headers, authType, bearerToken, bodyType, body, formData, extractRules, requestName },
      () => setIsSaveModalOpen(true)
    );
  };

  const onSaveToCollectionComplete = async (data) => {
    await handleSaveToCollection(data);
    addOrUpdateTab({
      id: data.request.id,
      name: data.request.name,
      method: data.request.method,
      collectionId: data.targetCollectionId || activeCollectionId,
      subCollectionId: data.targetSubCollectionId || activeSubCollectionId
    });
  };

  const onSendPreset = (type) => {
    addOrUpdateTab({
      id: activeRequestId,
      name: type === 'get' ? 'GET Quick Test' : 'POST Quick Test',
      method: type.toUpperCase(),
      collectionId: activeCollectionId,
      subCollectionId: activeSubCollectionId
    });
    handleSendPreset(type, activeEnvVariables, refreshHistory);
  };

  // Keyboard shortcut listener: Cmd/Ctrl+Enter (Send), Cmd/Ctrl+S (Save)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSend();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onQuickSave();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        environments={environments}
        activeEnvId={activeEnvId}
        onSelectEnv={setActiveEnvId}
        onDeleteEnv={handleDeleteEnv}
        requestConfirm={requestConfirm}
        mainView={mainView}
        onSwitchView={setMainView}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        toggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        storageInfo={storageInfo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        <CollectionsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          collections={collections}
          onSelectRequest={onSelectCollectionRequest}
          onCreateCollection={handleCreateCollection}
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
          onDuplicateCollection={handleDuplicateCollection}
          onCreateSubCollection={handleCreateSubCollection}
          onRenameSubCollection={handleRenameSubCollection}
          onDuplicateSubCollection={handleDuplicateSubCollection}
          onDeleteSubCollection={handleDeleteSubCollection}
          onCreateRequestInCollection={handleCreateRequestInCollection}
          onCreateRequestInSubCollection={handleCreateRequestInSubCollection}
          onDuplicateRequest={handleDuplicateRequest}
          onDeleteRequest={handleDeleteRequest}
          activeRequestId={activeRequestId}
          responseCache={responseCache}
          requestConfirm={requestConfirm}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
          {mainView === 'environment' ? (
            <EnvironmentView
              environments={environments}
              activeEnvId={activeEnvId}
              onSelectEnv={setActiveEnvId}
              onSaveEnv={handleSaveEnv}
              onCreateEnv={handleCreateEnv}
              onDeleteEnv={handleDeleteEnv}
              onDuplicateEnv={handleDuplicateEnv}
              onBackToRequest={() => setMainView('request')}
              requestConfirm={requestConfirm}
            />
          ) : (
            <>
              {/* Request Tabs Bar */}
              <RequestTabsBar
                tabs={tabs}
                activeTabId={activeRequestId}
                onSelectTab={onSelectTab}
                onCloseTab={onCloseTab}
                onNewTab={onNewTab}
                requestName={requestName}
                onChangeRequestName={onChangeRequestName}
                activeCollection={activeCollection}
                activeSubCollection={activeSubCollection}
              />

              {tabs.length > 0 && activeRequestId ? (
                <>
                  <MethodUrlBar
                    method={method}
                    onChangeMethod={onChangeMethod}
                    url={url}
                    onChangeUrl={handleUrlChange}
                    onSend={onSend}
                    isLoading={isLoading}
                    activeEnvVariables={activeEnvVariables}
                    activeEnvName={activeEnvName}
                    activeCollection={activeCollection}
                    onSaveRequest={onQuickSave}
                    saveFeedback={saveFeedback}
                    onUpdateVariable={handleUpdateActiveVariable}
                  />

                  <RequestWorkspace
                    params={params}
                    onChangeParams={handleParamsChange}
                    headers={headers}
                    onChangeHeaders={setHeaders}
                    authType={authType}
                    onChangeAuthType={setAuthType}
                    bearerToken={bearerToken}
                    onChangeBearerToken={setBearerToken}
                    bodyType={bodyType}
                    onChangeBodyType={setBodyType}
                    body={body}
                    onChangeBody={setBody}
                    formData={formData}
                    onChangeFormData={setFormData}
                    extractRules={extractRules}
                    onChangeExtractRules={setExtractRules}
                    activeEnvVariables={activeEnvVariables}
                    activeEnvName={activeEnvName}
                    onUpdateVariable={handleUpdateActiveVariable}
                    response={response}
                    isLoading={isLoading}
                    onSendPreset={onSendPreset}
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 select-none">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                    <Send className="w-5 h-5 stroke-1" />
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No open requests
                  </div>
                  <div className="text-xs text-slate-400 mt-1 mb-4">
                    Select a request from the left sidebar or click below to create a new one
                  </div>
                  <button
                    onClick={onNewTab}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Request</span>
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelectHistoryItem={(item) => {
            addOrUpdateTab({
              id: item.id,
              name: item.name || `${item.method} Request`,
              method: item.method || 'GET',
              collectionId: null,
              subCollectionId: null
            });
            handleSelectHistoryItem(item);
            setMainView('request');
          }}
          onClearHistory={handleClearHistory}
          requestConfirm={requestConfirm}
        />
      </div>

      <SaveRequestModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        collections={collections}
        currentRequest={{
          id: activeRequestId,
          name: requestName,
          method,
          url,
          params,
          headers,
          authType,
          bearerToken,
          bodyType,
          body,
          formData,
          extractRules
        }}
        onSaveToCollection={onSaveToCollectionComplete}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        itemName={confirmModal.itemName}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirmModal}
      />
    </div>
  );
}
