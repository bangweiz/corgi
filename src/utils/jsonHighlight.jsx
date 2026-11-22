import React, { useMemo } from 'react';

/**
 * Highlights a JSON string by tokenizing its syntax
 */
export function tokenizeJson(jsonString) {
  if (typeof jsonString !== 'string') {
    try {
      jsonString = JSON.stringify(jsonString, null, 2);
    } catch {
      return [{ type: 'text', value: String(jsonString) }];
    }
  }

  const tokenRegex = /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?)|(\b-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],:])|([ \t\r\n]+)|([^\s]+)/g;

  const tokens = [];
  let match;

  while ((match = tokenRegex.exec(jsonString)) !== null) {
    const [
      full,
      strWithColon,
      hasColon,
      number,
      bool,
      nullVal,
      punct,
      ws,
      other
    ] = match;

    if (strWithColon) {
      if (hasColon) {
        // It's a key!
        const keyName = strWithColon.slice(0, -hasColon.length);
        tokens.push({ type: 'key', value: keyName });
        tokens.push({ type: 'colon', value: hasColon });
      } else {
        // String value
        tokens.push({ type: 'string', value: strWithColon });
      }
    } else if (number !== undefined) {
      tokens.push({ type: 'number', value: number });
    } else if (bool !== undefined) {
      tokens.push({ type: 'boolean', value: bool });
    } else if (nullVal !== undefined) {
      tokens.push({ type: 'null', value: nullVal });
    } else if (punct !== undefined) {
      tokens.push({ type: 'punctuation', value: punct });
    } else if (ws !== undefined) {
      tokens.push({ type: 'whitespace', value: ws });
    } else if (other !== undefined) {
      tokens.push({ type: 'other', value: other });
    }
  }

  return tokens;
}

export function JsonHighlightedViewer({ jsonContent, searchTerm = '' }) {
  const formattedString = useMemo(() => {
    if (typeof jsonContent === 'string') {
      try {
        const parsed = JSON.parse(jsonContent);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return jsonContent;
      }
    }
    return JSON.stringify(jsonContent, null, 2);
  }, [jsonContent]);

  const lines = useMemo(() => {
    return formattedString.split('\n');
  }, [formattedString]);

  const tokens = useMemo(() => {
    return tokenizeJson(formattedString);
  }, [formattedString]);

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto flex select-text">
      {/* Line numbers */}
      <div className="select-none text-right pr-4 pl-2 text-slate-400 dark:text-slate-600 border-r border-slate-200 dark:border-slate-800 shrink-0">
        {lines.map((_, i) => (
          <div key={i} className="h-5 leading-5">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Code content */}
      <pre className="pl-4 pr-4 m-0 py-0 flex-1 whitespace-pre">
        {tokens.map((tok, idx) => {
          let className = 'text-slate-800 dark:text-slate-200';
          switch (tok.type) {
            case 'key':
              className = 'text-sky-700 dark:text-sky-300 font-semibold';
              break;
            case 'string':
              className = 'text-emerald-700 dark:text-emerald-300';
              break;
            case 'number':
              className = 'text-amber-700 dark:text-amber-300 font-medium';
              break;
            case 'boolean':
              className = 'text-purple-700 dark:text-purple-300 font-semibold';
              break;
            case 'null':
              className = 'text-rose-600 dark:text-rose-300/80 italic font-semibold';
              break;
            case 'punctuation':
            case 'colon':
              className = 'text-slate-500 dark:text-slate-400';
              break;
            case 'whitespace':
              return tok.value;
            default:
              className = 'text-slate-800 dark:text-slate-300';
          }

          // Search term highlighting if present
          if (searchTerm && tok.value.toLowerCase().includes(searchTerm.toLowerCase())) {
            return (
              <span
                key={idx}
                className={`${className} bg-yellow-200 text-yellow-900 dark:bg-yellow-500/40 dark:text-yellow-100 rounded px-0.5`}
              >
                {tok.value}
              </span>
            );
          }

          // Distinct styling for {{variable}} inside strings
          if (tok.type === 'string' && tok.value.includes('{{')) {
            const parts = tok.value.split(/(\{\{[a-zA-Z0-9_-]+\}\})/g);
            return (
              <span key={idx} className={className}>
                {parts.map((part, pIdx) => {
                  if (/^\{\{[a-zA-Z0-9_-]+\}\}$/.test(part)) {
                    return (
                      <span
                        key={pIdx}
                        className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1 py-0.5 rounded shadow-[0_0_0_1px_rgba(245,158,11,0.4)] inline-block"
                        title="Environment variable placeholder"
                      >
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              </span>
            );
          }

          return (
            <span key={idx} className={className}>
              {tok.value}
            </span>
          );
        })}
      </pre>
    </div>
  );
}
