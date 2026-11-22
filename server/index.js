import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Storage directory setup: pure local JSON files
const DATA_DIR = path.resolve(__dirname, '../data');
const COLLECTIONS_DIR = path.join(DATA_DIR, 'collections');
const ENVIRONMENTS_DIR = path.join(DATA_DIR, 'environments');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directories exist
async function initStorage() {
  await fs.mkdir(COLLECTIONS_DIR, { recursive: true });
  await fs.mkdir(ENVIRONMENTS_DIR, { recursive: true });

  // Create sample collection if not exists
  const sampleCollectionPath = path.join(COLLECTIONS_DIR, 'sample.json');
  try {
    await fs.access(sampleCollectionPath);
  } catch {
    const sampleCollection = {
      id: 'sample',
      name: 'HTTPBin Sample Collection',
      description: 'Built-in sample API debugging requests',
      updatedAt: new Date().toISOString(),
      requests: [
        {
          id: 'req_1',
          name: 'GET Request (with params)',
          method: 'GET',
          url: 'https://httpbin.org/get?greeting=hello&target=corgi',
          params: [
            { key: 'greeting', value: 'hello', enabled: true },
            { key: 'target', value: 'corgi', enabled: true },
            { key: 'debug', value: 'true', enabled: false }
          ],
          headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          authType: 'none', bearerToken: '', bodyType: 'none', body: '', formData: []
        },
        {
          id: 'req_2',
          name: 'POST JSON Body',
          method: 'POST',
          url: 'https://httpbin.org/post',
          params: [],
          headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
          authType: 'bearer', bearerToken: 'corgi-test-token-888', bodyType: 'json',
          body: JSON.stringify({ message: 'Hello from Corgi API Debugger!', framework: 'React + Node proxy', localOnly: true, timestamp: Date.now() }, null, 2),
          formData: []
        },
        {
          id: 'req_3',
          name: 'POST Form-data',
          method: 'POST',
          url: 'https://httpbin.org/post',
          params: [], headers: [], authType: 'none', bearerToken: '', bodyType: 'form-data', body: '',
          formData: [
            { key: 'username', value: 'developer', enabled: true },
            { key: 'source', value: 'local_proxy', enabled: true }
          ]
        },
        {
          id: 'req_4',
          name: 'Local Proxy Health Check',
          method: 'GET',
          url: 'http://localhost:3001/api/health',
          params: [], headers: [], authType: 'none', bearerToken: '', bodyType: 'none', body: '', formData: []
        }
      ]
    };
    await fs.writeFile(sampleCollectionPath, JSON.stringify(sampleCollection, null, 2), 'utf-8');
  }

  // Create sample environment if not exists
  const sampleEnvPath = path.join(ENVIRONMENTS_DIR, 'development.json');
  try {
    await fs.access(sampleEnvPath);
  } catch {
    const sampleEnv = {
      id: 'development',
      name: 'Development',
      updatedAt: new Date().toISOString(),
      variables: [
        { key: 'baseUrl', value: 'https://httpbin.org', enabled: true },
        { key: 'apiToken', value: 'secret-corgi-token-999', enabled: true }
      ]
    };
    await fs.writeFile(sampleEnvPath, JSON.stringify(sampleEnv, null, 2), 'utf-8');
  }

  // Create history file if not exists
  try {
    await fs.access(HISTORY_FILE);
  } catch {
    await fs.writeFile(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Corgi Local HTTP Proxy',
    version: '1.0.0',
    dataDir: DATA_DIR,
    timestamp: new Date().toISOString()
  });
});

// Storage Info
app.get('/api/storage-info', (req, res) => {
  res.json({
    dataDir: DATA_DIR,
    collectionsDir: COLLECTIONS_DIR,
    environmentsDir: ENVIRONMENTS_DIR,
    historyFile: HISTORY_FILE
  });
});

/**
 * Core Proxy Handler
 * Handles GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS
 * Calculates status, timing (ms), response body size (bytes), headers
 */
app.post('/api/proxy', async (req, res) => {
  const {
    method = 'GET',
    url,
    headers = {},
    bodyType = 'none',
    body = '',
    formData = []
  } = req.body;

  if (!url) {
    return res.status(400).json({
      status: 0,
      statusText: 'Bad Request',
      error: 'URL is required',
      durationMs: 0,
      sizeBytes: 0,
      headers: {},
      rawBody: 'Error: URL parameter is required',
      isJson: false
    });
  }

  const startTime = performance.now();

  try {
    // Sanitize headers
    const reqHeaders = new Headers();
    Object.entries(headers).forEach(([key, val]) => {
      if (key && val !== undefined && val !== null) {
        reqHeaders.set(key.trim(), String(val));
      }
    });

    const fetchOptions = {
      method: method.toUpperCase(),
      headers: reqHeaders,
      redirect: 'follow'
    };

    // Body preparation based on method and bodyType
    const canHaveBody = !['GET', 'HEAD'].includes(fetchOptions.method);

    if (canHaveBody) {
      if (bodyType === 'json') {
        if (body && typeof body === 'string') {
          fetchOptions.body = body;
          if (!reqHeaders.has('content-type')) {
            reqHeaders.set('content-type', 'application/json');
          }
        }
      } else if (bodyType === 'form-data') {
        const fd = new FormData();
        if (Array.isArray(formData)) {
          formData.forEach((item) => {
            if (item && item.enabled !== false && item.key) {
              fd.append(item.key, item.value || '');
            }
          });
        }
        fetchOptions.body = fd;
        // Native fetch will automatically generate multipart/form-data with proper boundary,
        // so delete content-type if user didn't override it manually
        if (reqHeaders.get('content-type')?.startsWith('multipart/form-data')) {
          reqHeaders.delete('content-type');
        }
      } else if (bodyType === 'raw') {
        if (body) {
          fetchOptions.body = String(body);
        }
      }
    }

    const response = await fetch(url, fetchOptions);
    const durationMs = Math.round(performance.now() - startTime);

    // Extract response headers
    const resHeaders = {};
    response.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });

    // Read response as text
    const rawBody = await response.text();
    const sizeBytes = Buffer.byteLength(rawBody, 'utf8');

    // Try parsing JSON
    let isJson = false;
    let parsedData = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json') || rawBody.trim().startsWith('{') || rawBody.trim().startsWith('[')) {
      try {
        parsedData = JSON.parse(rawBody);
        isJson = true;
      } catch {
        isJson = false;
      }
    }

    // Save into history (non-blocking)
    saveHistory({
      id: 'hist_' + Date.now(),
      method: fetchOptions.method,
      url,
      status: response.status,
      durationMs,
      sizeBytes,
      timestamp: new Date().toISOString()
    }).catch(console.error);

    return res.json({
      status: response.status,
      statusText: response.statusText || 'OK',
      durationMs,
      sizeBytes,
      headers: resHeaders,
      rawBody,
      isJson,
      data: parsedData
    });
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMsg = err.message || 'Request failed';
    const causeCode = err.cause?.code || err.code || 'PROXY_ERROR';

    return res.status(200).json({
      status: 0,
      statusText: 'Network Error',
      error: `${errorMsg} (${causeCode})`,
      durationMs,
      sizeBytes: 0,
      headers: {},
      rawBody: `Request failed: ${errorMsg}\nCode: ${causeCode}\n\nPlease check if the target URL is valid, reachable, or if the server is running.`,
      isJson: false,
      data: null
    });
  }
});

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Helper to save history to data/history.json
async function saveHistory(entry) {
  try {
    let list = [];
    try {
      const content = await fs.readFile(HISTORY_FILE, 'utf-8');
      list = JSON.parse(content);
    } catch {
      list = [];
    }
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    // Retain only requests within the last 24 hours
    list = Array.isArray(list)
      ? list.filter((item) => {
          const t = new Date(item.timestamp).getTime();
          return !isNaN(t) && t >= cutoff;
        })
      : [];
    list.unshift(entry);
    if (list.length > 50) list = list.slice(0, 50);
    await fs.writeFile(HISTORY_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

// History API: only return requests from the last 24 hours
app.get('/api/history', async (req, res) => {
  try {
    const content = await fs.readFile(HISTORY_FILE, 'utf-8');
    const list = JSON.parse(content);
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    const filtered = Array.isArray(list)
      ? list.filter((item) => {
          const t = new Date(item.timestamp).getTime();
          return !isNaN(t) && t >= cutoff;
        })
      : [];
    res.json(filtered);
  } catch {
    res.json([]);
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Collections CRUD
app.get('/api/collections', async (req, res) => {
  try {
    const files = await fs.readdir(COLLECTIONS_DIR);
    const collections = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(COLLECTIONS_DIR, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const json = JSON.parse(content);
          collections.push(json);
        } catch (e) {
          console.error(`Error reading collection ${file}:`, e);
        }
      }
    }
    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/collections', async (req, res) => {
  try {
    const collection = req.body;
    if (!collection || !collection.id) {
      return res.status(400).json({ error: 'Collection id is required' });
    }
    collection.updatedAt = new Date().toISOString();
    const safeId = collection.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(COLLECTIONS_DIR, `${safeId}.json`);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf-8');
    res.json({ success: true, collection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/collections/:id', async (req, res) => {
  try {
    const safeId = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(COLLECTIONS_DIR, `${safeId}.json`);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Environments CRUD
app.get('/api/environments', async (req, res) => {
  try {
    const files = await fs.readdir(ENVIRONMENTS_DIR);
    const environments = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(ENVIRONMENTS_DIR, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const json = JSON.parse(content);
          environments.push(json);
        } catch (e) {
          console.error(`Error reading env ${file}:`, e);
        }
      }
    }
    res.json(environments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/environments', async (req, res) => {
  try {
    const env = req.body;
    if (!env || !env.id) {
      return res.status(400).json({ error: 'Environment id is required' });
    }
    env.updatedAt = new Date().toISOString();
    const safeId = env.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(ENVIRONMENTS_DIR, `${safeId}.json`);
    await fs.writeFile(filePath, JSON.stringify(env, null, 2), 'utf-8');
    res.json({ success: true, environment: env });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/environments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
    let filePath = path.join(ENVIRONMENTS_DIR, `${safeId}.json`);

    try {
      await fs.access(filePath);
    } catch {
      // Find matching json by checking id field inside each file
      const files = await fs.readdir(ENVIRONMENTS_DIR);
      let foundPath = null;
      for (const file of files) {
        if (file.endsWith('.json')) {
          const curPath = path.join(ENVIRONMENTS_DIR, file);
          try {
            const content = await fs.readFile(curPath, 'utf-8');
            const data = JSON.parse(content);
            if (data.id === id) {
              foundPath = curPath;
              break;
            }
          } catch {}
        }
      }
      if (foundPath) {
        filePath = foundPath;
      }
    }

    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve built frontend assets if dist exists
const DIST_DIR = path.resolve(__dirname, '../dist');
app.use(express.static(DIST_DIR));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Please run "npm run dev" or "npm run build".');
    }
  });
});

// Start Server
initStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Node HTTP Proxy running on http://localhost:${PORT}`);
    console.log(`📁 Local storage folder: ${DATA_DIR}`);
  });
}).catch((err) => {
  console.error('Failed to initialize local storage:', err);
  process.exit(1);
});
