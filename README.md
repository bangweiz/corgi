# Corgi API Debugger

A lightweight, fast, fully local HTTP API debugging client built with **React + Node.js Proxy**.

## 🌟 Key Features

- **Full HTTP Method Support**: Native support for `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, and `OPTIONS`.
- **Node.js CORS Proxy**: Forwards requests through a local proxy to bypass browser Cross-Origin Resource Sharing (CORS) and restricted header limitations.
- **Bi-directional Query Params & URL Sync**:
  - Editing query parameters in the URL bar immediately reflects in the Params table.
  - Adding, deleting, editing, or toggling rows in the Params table dynamically recalculates the URL.
- **Header Key-Value Editor**:
  - Multi-row editing with enable/disable toggles and description notes.
  - Integrated header auto-complete suggestions (Datalist) and common presets (`application/json`, `no-cache`, etc.).
- **Versatile Request Body Support**:
  - `None`: Empty request body.
  - `JSON`: Real-time syntax validation, formatting (Beautify), and template injection.
  - `Form-data`: Multi-field form data table with native `multipart/form-data` compilation.
  - `Raw`: Plain text payload editor.
- **Bearer Token Authentication**:
  - Dedicated Auth tab to configure Bearer tokens with visibility toggle and quick copy.
  - Automatically injects the `Authorization: Bearer <token>` header on send.
- **Feature-Rich Response Panel**:
  - **Key Metrics**: Color-coded HTTP status badges (2xx/3xx/4xx/5xx), millisecond latency (`ms`), and payload size (`B`/`KB`).
  - **Zero-Dependency JSON Highlighting**: Native syntax highlighter with color tokens for keys, strings, numbers, booleans, and nulls, complete with line numbers and search filtering.
  - **Headers Inspector**: Full response headers list with search and clipboard copy.
  - **Auto-Extract to Environment Variables**: Extract header or JSON body fields automatically to environment variables upon response.
  - **Flexible Layouts**: One-click toggling between horizontal and vertical split views.
- **100% Local File Storage (Zero Cloud / Zero Database)**:
  - Collections stored locally in `./data/collections/*.json`.
  - Environment variables stored locally in `./data/environments/*.json` with `{{variable}}` template parsing and hover tooltips.
  - Request history stored in `./data/history.json`.
  - Zero external database required, zero account login, zero cloud tracking, and completely offline-ready.

---

## 📁 Directory Structure

```text
corgi/
├── server/
│   └── index.js             # Node.js local proxy server and JSON file storage
├── src/
│   ├── components/
│   │   ├── Header.jsx             # Top bar (branding, environment selector, view toggles)
│   │   ├── MethodUrlBar.jsx       # Method selector, URL input, send, and quick save
│   │   ├── CollectionsSidebar.jsx # Local collections file sidebar
│   │   ├── EnvironmentView.jsx    # Environment variable manager
│   │   ├── HistoryDrawer.jsx      # Recent request history drawer
│   │   ├── SaveRequestModal.jsx   # Save request to collection modal
│   │   ├── ResponsePanel.jsx      # Response display (metrics, highlighted JSON, headers)
│   │   └── RequestTabs/           # Request configuration tabs
│   │       ├── ParamsTab.jsx      # Query parameters table with URL synchronization
│   │       ├── HeadersTab.jsx     # Headers key-value editor
│   │       ├── AuthTab.jsx        # Bearer token authentication
│   │       ├── BodyTab.jsx        # JSON / Form-data / Raw body editor
│   │       └── ExtractTab.jsx     # Post-response auto-extraction rules
│   ├── hooks/                     # Custom React hooks (state, persistence, tabs)
│   ├── utils/                     # Formatters, URL sync, and JSON highlighter
│   ├── App.jsx                    # Main application workbench
│   ├── index.css                  # Tailwind styles and theme setup
│   └── main.jsx                   # React entry point
├── data/                          # Local JSON storage directory
│   ├── collections/               # Collection files (*.json)
│   ├── environments/              # Environment configuration files (*.json)
│   └── history.json               # Request history log
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Getting Started

### 1. Development Mode (Hot Reload + Local Proxy)

Start both the Node proxy server (port 3001) and the Vite hot-reloading frontend (port 5173):

```bash
npm run dev
```

Open your browser at: `http://localhost:5173`

### 2. Production Single-Port Mode

Build frontend static assets and serve both frontend and proxy API from a single Node.js instance:

```bash
npm run build
npm start
```

Open your browser at: `http://localhost:3001`

---

## ⌨️ Shortcuts & Tips

- **Send Request**: Press <kbd>⌘ + Enter</kbd> (Mac) or <kbd>Ctrl + Enter</kbd> (Windows/Linux) from any input.
- **Quick Save**: Press <kbd>⌘ + S</kbd> (Mac) or <kbd>Ctrl + S</kbd> (Windows/Linux) to save the current request.
- **URL Parameter Sync**: Type `?page=1&limit=20` directly in the URL bar to see parameters auto-populate in the Params table.
- **Environment Variables**: Use `{{baseUrl}}/api` in URLs, Headers, or Body. Hover over any variable badge to inspect or edit its value directly.
