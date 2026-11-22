import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, Copy, Check } from 'lucide-react';
import { EnvVariableInput } from '../EnvVariableInput';

export function AuthTab({
  authType = 'none',
  onChangeAuthType,
  bearerToken = '',
  onChangeBearerToken,
  activeEnvVariables = [],
  activeEnvName = '',
  onUpdateVariable
}) {
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!bearerToken) return;
    navigator.clipboard.writeText(bearerToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl py-1">
      {/* Auth Type Selector */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
        <span className="text-slate-700 dark:text-slate-400 font-medium">Auth Type:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeAuthType('none')}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              authType === 'none'
                ? 'bg-slate-100 dark:bg-slate-800 border-sky-400 dark:border-sky-500/50 text-sky-700 dark:text-sky-400 font-medium'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            No Auth
          </button>
          <button
            onClick={() => onChangeAuthType('bearer')}
            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              authType === 'bearer'
                ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-400 font-medium'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Bearer Token</span>
          </button>
        </div>
      </div>

      {/* Auth Config Details */}
      {authType === 'bearer' ? (
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Token
            </label>
            <div className="relative flex items-center">
              <EnvVariableInput
                type={showToken ? 'text' : 'password'}
                value={bearerToken}
                onChange={onChangeBearerToken}
                activeEnvVariables={activeEnvVariables}
                activeEnvName={activeEnvName}
                onUpdateVariable={onUpdateVariable}
                placeholder="Paste or enter Bearer Token, {{variable}} supported"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 pr-24 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={showToken ? 'Hide Token' : 'Show Token'}
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {bearerToken && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Copy Token"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Helper Note */}
          <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-lg text-xs text-sky-800 dark:text-sky-300/90 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sky-900 dark:text-sky-200">Automatically injects Authorization Header</p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                When sending requests, the proxy automatically adds to Headers:
                <code className="text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded ml-1 font-mono border border-sky-100 dark:border-transparent">
                  Authorization: Bearer {bearerToken ? (showToken ? bearerToken : (bearerToken.startsWith('{{') ? bearerToken : '••••••••')) : '[Token]'}
                </code>
                , no need to enter it manually in the Headers tab.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500 text-xs">
          This request does not include authentication credentials. Select Bearer Token above if needed.
        </div>
      )}
    </div>
  );
}
