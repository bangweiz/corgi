/**
 * Utilities for two-way synchronization between URL string and Query Params table
 */

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Split URL into base part and query string
 * Safely handles template variables like {{baseUrl}} and relative URLs
 */
export function splitUrlAndQuery(rawUrl = '') {
  const queryIndex = rawUrl.indexOf('?');
  if (queryIndex === -1) {
    return {
      basePart: rawUrl,
      queryString: ''
    };
  }
  return {
    basePart: rawUrl.substring(0, queryIndex),
    queryString: rawUrl.substring(queryIndex + 1)
  };
}

/**
 * Parses query string from URL into param rows
 */
export function parseQueryStringToParams(queryString = '') {
  if (!queryString.trim()) {
    return [];
  }

  const pairs = queryString.split('&');
  return pairs
    .filter(Boolean)
    .map((pair) => {
      const eqIndex = pair.indexOf('=');
      let key = '';
      let value = '';
      if (eqIndex === -1) {
        key = decodeSafe(pair);
      } else {
        key = decodeSafe(pair.substring(0, eqIndex));
        value = decodeSafe(pair.substring(eqIndex + 1));
      }
      return {
        id: generateId(),
        key,
        value,
        enabled: true,
        description: ''
      };
    });
}

/**
 * Builds full URL from basePart and list of param rows
 */
export function buildUrlWithParams(basePart = '', params = []) {
  const activeParams = params.filter(
    (p) => p.enabled !== false && (p.key.trim() || p.value.trim())
  );

  if (activeParams.length === 0) {
    return basePart;
  }

  const queryParts = activeParams.map((p) => {
    const k = p.key.trim();
    const v = p.value;
    if (!v) {
      return encodeURIComponent(k);
    }
    return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  });

  const separator = basePart.includes('?') ? '&' : '?';
  return `${basePart}${separator}${queryParts.join('&')}`;
}

function decodeSafe(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch {
    return str;
  }
}
