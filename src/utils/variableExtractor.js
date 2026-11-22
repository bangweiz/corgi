/**
 * Utilities for extracting variables from response headers and body.
 */

/**
 * Safely extracts a value from a nested object using a dot/bracket path.
 * Examples: 'token', 'user.id', 'items[0].id', 'data.token'
 */
export function extractFromPath(obj, path) {
  if (obj === null || obj === undefined || !path) return undefined;

  const cleanPath = String(path).replace(/\[(\w+)\]/g, '.$1').trim();
  const parts = cleanPath.split('.').filter(Boolean);

  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Flattens JSON object keys into an array of { path, value, label } for easy selection.
 */
export function flattenJsonKeys(obj, prefix = '', depth = 0, maxDepth = 4) {
  if (depth > maxDepth || obj === null || obj === undefined) return [];

  const results = [];

  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      const limit = Math.min(obj.length, 3);
      for (let i = 0; i < limit; i++) {
        const itemPath = prefix ? `${prefix}.${i}` : `${i}`;
        const itemVal = obj[i];
        if (typeof itemVal === 'object' && itemVal !== null) {
          results.push(...flattenJsonKeys(itemVal, itemPath, depth + 1, maxDepth));
        } else {
          results.push({
            path: itemPath,
            value: itemVal,
            label: `${itemPath} (${JSON.stringify(itemVal)})`
          });
        }
      }
    } else {
      for (const [key, val] of Object.entries(obj)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null) {
          results.push(...flattenJsonKeys(val, currentPath, depth + 1, maxDepth));
        } else {
          results.push({
            path: currentPath,
            value: val,
            label: `${currentPath}: ${JSON.stringify(val)}`
          });
        }
      }
    }
  }

  return results;
}

/**
 * Automatically extracts variables from response header and body according to rules,
 * and updates target environment.
 */
export async function runAutoExtraction(rules = [], response = null, activeEnvId = '', onSetVariable = null) {
  if (!rules || rules.length === 0 || !response || !activeEnvId || !onSetVariable) {
    return [];
  }

  const enabledRules = rules.filter((r) => r.enabled && r.property && r.varName);
  if (enabledRules.length === 0) return [];

  let jsonData = response.data;
  if (!jsonData && response.rawBody) {
    try {
      jsonData = JSON.parse(response.rawBody);
    } catch {
      jsonData = null;
    }
  }

  const extracted = [];

  for (const rule of enabledRules) {
    let extractedValue = undefined;

    if (rule.source === 'header') {
      const headers = response.headers || {};
      const propLower = rule.property.trim().toLowerCase();
      const matchedKey = Object.keys(headers).find((k) => k.toLowerCase() === propLower);
      if (matchedKey !== undefined) {
        extractedValue = headers[matchedKey];
      }
    } else {
      if (jsonData) {
        extractedValue = extractFromPath(jsonData, rule.property.trim());
      }
    }

    if (extractedValue !== undefined) {
      const stringValue =
        typeof extractedValue === 'object' ? JSON.stringify(extractedValue) : String(extractedValue);
      await onSetVariable(activeEnvId, rule.varName.trim(), stringValue);
      extracted.push({
        varName: rule.varName.trim(),
        value: stringValue,
        source: rule.source,
        property: rule.property
      });
    }
  }

  return extracted;
}
