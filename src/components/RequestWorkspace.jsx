import React, { useState } from 'react';
import { Columns2, Rows2 } from 'lucide-react';
import { ParamsTab } from './RequestTabs/ParamsTab';
import { HeadersTab } from './RequestTabs/HeadersTab';
import { AuthTab } from './RequestTabs/AuthTab';
import { BodyTab } from './RequestTabs/BodyTab';
import { ExtractTab } from './RequestTabs/ExtractTab';
import { ResponsePanel } from './ResponsePanel';

export function RequestWorkspace({
  params,
  onChangeParams,
  headers,
  onChangeHeaders,
  authType,
  onChangeAuthType,
  bearerToken,
  onChangeBearerToken,
  bodyType,
  onChangeBodyType,
  body,
  onChangeBody,
  formData,
  onChangeFormData,
  extractRules = [],
  onChangeExtractRules,
  activeEnvVariables,
  activeEnvName,
  onUpdateVariable,
  response,
  isLoading,
  onSendPreset
}) {
  const [activeReqTab, setActiveReqTab] = useState('params');
  const [splitDirection, setSplitDirection] = useState('horizontal'); // 'horizontal' | 'vertical'

  return (
    <div
      className={`flex-1 flex overflow-hidden ${
        splitDirection === 'horizontal' ? 'flex-col md:flex-row' : 'flex-col'
      }`}
    >
      {/* Upper / Left: Request Configuration Tabs */}
      <div
        className={`flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 ${
          splitDirection === 'horizontal'
            ? 'w-full md:w-1/2 border-b md:border-b-0 md:border-r'
            : 'h-1/2 border-b'
        }`}
      >
        {/* Tab Selector Bar */}
        <div className="h-10 px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-1 text-xs">
            {/* Params Tab */}
            <button
              onClick={() => setActiveReqTab('params')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeReqTab === 'params'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700/80 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Params</span>
              {params.filter((p) => p.enabled && p.key).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </button>

            {/* Headers Tab */}
            <button
              onClick={() => setActiveReqTab('headers')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeReqTab === 'headers'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700/80 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Headers</span>
              {headers.filter((h) => h.enabled && h.key).length > 0 && (
                <span className="text-[10px] font-mono px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {headers.filter((h) => h.enabled && h.key).length}
                </span>
              )}
            </button>

            {/* Auth Tab */}
            <button
              onClick={() => setActiveReqTab('auth')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeReqTab === 'auth'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700/80 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Auth</span>
              {authType === 'bearer' && bearerToken && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
              )}
            </button>

            {/* Body Tab */}
            <button
              onClick={() => setActiveReqTab('body')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeReqTab === 'body'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700/80 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Body</span>
              {bodyType !== 'none' && (
                <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                  {bodyType}
                </span>
              )}
            </button>

            {/* Extract Tab */}
            <button
              onClick={() => setActiveReqTab('extract')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeReqTab === 'extract'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700/80 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Extract</span>
              {extractRules.filter((r) => r.enabled && r.property && r.varName).length > 0 && (
                <span className="text-[10px] font-mono px-1 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium">
                  {extractRules.filter((r) => r.enabled && r.property && r.varName).length}
                </span>
              )}
            </button>
          </div>

          {/* Layout split direction switcher */}
          <button
            onClick={() =>
              setSplitDirection(splitDirection === 'horizontal' ? 'vertical' : 'horizontal')
            }
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title={splitDirection === 'horizontal' ? 'Switch to vertical split (top/bottom)' : 'Switch to horizontal split (side-by-side)'}
          >
            {splitDirection === 'horizontal' ? (
              <Columns2 className="w-3.5 h-3.5" />
            ) : (
              <Rows2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="flex-1 p-3 overflow-auto bg-white dark:bg-slate-900/40 transition-colors">
          {activeReqTab === 'params' && (
            <ParamsTab
              params={params}
              onChangeParams={onChangeParams}
              activeEnvVariables={activeEnvVariables}
              activeEnvName={activeEnvName}
              onUpdateVariable={onUpdateVariable}
            />
          )}
          {activeReqTab === 'headers' && (
            <HeadersTab
              headers={headers}
              onChangeHeaders={onChangeHeaders}
              activeEnvVariables={activeEnvVariables}
              activeEnvName={activeEnvName}
              onUpdateVariable={onUpdateVariable}
            />
          )}
          {activeReqTab === 'auth' && (
            <AuthTab
              authType={authType}
              onChangeAuthType={onChangeAuthType}
              bearerToken={bearerToken}
              onChangeBearerToken={onChangeBearerToken}
              activeEnvVariables={activeEnvVariables}
              activeEnvName={activeEnvName}
              onUpdateVariable={onUpdateVariable}
            />
          )}
          {activeReqTab === 'body' && (
            <BodyTab
              bodyType={bodyType}
              onChangeBodyType={onChangeBodyType}
              body={body}
              onChangeBody={onChangeBody}
              formData={formData}
              onChangeFormData={onChangeFormData}
              activeEnvVariables={activeEnvVariables}
              activeEnvName={activeEnvName}
              onUpdateVariable={onUpdateVariable}
            />
          )}
          {activeReqTab === 'extract' && (
            <ExtractTab
              extractRules={extractRules}
              onChangeExtractRules={onChangeExtractRules}
              activeEnvName={activeEnvName}
              activeEnvVariables={activeEnvVariables}
            />
          )}
        </div>
      </div>

      {/* Lower / Right: Response Panel */}
      <div
        className={`flex-1 overflow-hidden ${
          splitDirection === 'horizontal' ? 'w-full md:w-1/2' : 'h-1/2'
        }`}
      >
        <ResponsePanel
          response={response}
          isLoading={isLoading}
          onSendPreset={onSendPreset}
        />
      </div>
    </div>
  );
}
