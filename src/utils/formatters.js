/**
 * Formatting and helper functions
 */

export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i]}`;
}

export function formatDuration(ms) {
  if (ms === undefined || ms === null || isNaN(ms)) return '0 ms';
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

export function getStatusBadge(status) {
  if (status === 0) {
    return {
      bg: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/40',
      text: 'Network Error / Failed'
    };
  }
  if (status >= 200 && status < 300) {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/40',
      text: `${status} OK`
    };
  }
  if (status >= 300 && status < 400) {
    return {
      bg: 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/40',
      text: `${status} Redirect`
    };
  }
  if (status >= 400 && status < 500) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/40',
      text: `${status} Client Error`
    };
  }
  return {
    bg: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/40',
    text: `${status} Server Error`
  };
}

export function getMethodColor(method = 'GET') {
  switch ((method || 'GET').toUpperCase()) {
    case 'GET':
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
        badge: 'bg-emerald-500 text-white dark:text-slate-950 font-bold'
      };
    case 'POST':
      return {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
        badge: 'bg-amber-500 text-white dark:text-slate-950 font-bold'
      };
    case 'PUT':
      return {
        text: 'text-sky-600 dark:text-sky-400',
        bg: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30',
        badge: 'bg-sky-500 text-white dark:text-slate-950 font-bold'
      };
    case 'DELETE':
      return {
        text: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
        badge: 'bg-rose-500 text-white dark:text-slate-950 font-bold'
      };
    case 'PATCH':
      return {
        text: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30',
        badge: 'bg-purple-500 text-white dark:text-slate-950 font-bold'
      };
    case 'HEAD':
      return {
        text: 'text-teal-600 dark:text-teal-400',
        bg: 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30',
        badge: 'bg-teal-500 text-white dark:text-slate-950 font-bold'
      };
    case 'OPTIONS':
      return {
        text: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30',
        badge: 'bg-indigo-500 text-white dark:text-slate-950 font-bold'
      };
    default:
      return {
        text: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/30',
        badge: 'bg-slate-500 text-white dark:text-slate-950 font-bold'
      };
  }
}

/**
 * Replaces {{variableName}} in string with environment variable values
 */
export function interpolateVariables(template = '', variables = []) {
  if (!template || typeof template !== 'string' || !Array.isArray(variables)) {
    return template;
  }
  let result = template;
  for (const v of variables) {
    if (v && v.enabled !== false && v.key) {
      const regex = new RegExp(`{{\\s*${v.key.trim()}\\s*}}`, 'g');
      result = result.replace(regex, v.value || '');
    }
  }
  return result;
}
