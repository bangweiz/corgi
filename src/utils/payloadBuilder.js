import { interpolateVariables } from './formatters';

export function buildPayload({
  method,
  url,
  headers,
  authType,
  bearerToken,
  bodyType,
  body,
  formData,
  activeEnvVariables
}) {
  const finalUrl = interpolateVariables(url.trim(), activeEnvVariables);
  const headerMap = {};
  headers.forEach((h) => {
    if (h && h.enabled !== false && h.key.trim()) {
      headerMap[interpolateVariables(h.key.trim(), activeEnvVariables)] =
        interpolateVariables(h.value || '', activeEnvVariables);
    }
  });

  if (authType === 'bearer' && bearerToken.trim()) {
    headerMap['Authorization'] = `Bearer ${interpolateVariables(bearerToken.trim(), activeEnvVariables)}`;
  }

  let finalBody = body;
  if (bodyType === 'json' || bodyType === 'raw') {
    finalBody = interpolateVariables(body, activeEnvVariables);
  }

  const finalFormData = formData.map((f) => ({
    key: interpolateVariables(f.key || '', activeEnvVariables),
    value: interpolateVariables(f.value || '', activeEnvVariables),
    enabled: f.enabled !== false
  }));

  return {
    method,
    url: finalUrl,
    headers: headerMap,
    bodyType,
    body: finalBody,
    formData: finalFormData
  };
}
