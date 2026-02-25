# AGENTS.md

## Important: Working with a Non-Technical User

The user is a non-technical person with no programming experience.
- Always explain what you are doing in simple, plain language
- Never ask the user to manually edit code or configuration files
- If something breaks, fix it yourself — do not ask the user to debug
- After each change, tell the user how to see the result (e.g., "open your browser")
- Prefer simple, working solutions over clever or complex ones
- When asking questions in planning mode, use non-technical language

## Project: Content Management System (CMS)

### Goal

Build a web application that reads markdown files from a local folder and displays them as a browsable portal with sidebar navigation, search, and clean formatting. This is a full-stack project with a Node.js backend and React frontend.

### Tech Stack

- **Backend:** Express.js, marked (markdown → HTML)
- **Frontend:** React (Vite is already configured)
- **Content:** Pre-written .md files in `server/content/`
- Both parts run simultaneously using `concurrently`

### UI Theme Options

Before starting, the mentee picks ONE theme. Ask which they prefer:

- **Theme A — Documentation Portal:** Clean white layout, left sidebar with blue (#2563eb) active states, technical documentation feel, monospace code blocks
- **Theme B — Internal Wiki (EPAM):** EPAM blue (#39f) header, light gray sidebar, corporate internal portal feel, breadcrumb navigation
- **Theme C — Knowledge Base:** Dark sidebar (#1e1e2e), light content area, modern knowledge base feel, search prominently placed in header

### Architecture

```
cms/
├── server/
│   ├── index.js         — Express API server (port 3001)
│   ├── package.json
│   └── content/         — Markdown files (pre-written)
│       ├── about.md
│       ├── services.md
│       ├── team.md
│       ├── faq.md
│       ├── getting-started.md
│       ├── contact.md
│       └── news.md
└── client/
    ├── src/
    │   ├── App.jsx      — Main layout (sidebar + content area)
    │   ├── components/
    │   │   ├── Sidebar.jsx    — Page list with navigation
    │   │   ├── Content.jsx    — Rendered markdown content
    │   │   └── SearchBar.jsx  — Text search input
    │   ├── App.css
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js   — Proxy API requests to backend
    └── index.html
```

### API Endpoints (server)

1. `GET /api/pages` — Returns list of all pages: `[{ slug: "about", title: "About Us" }, ...]`
   - Title is extracted from the first `# Heading` in each .md file
   - Slug is the filename without extension
2. `GET /api/pages/:slug` — Returns single page content as HTML (converted from markdown using `marked`)

### Frontend Behavior

- On load, fetch page list from `/api/pages` and display in sidebar
- Click a page in sidebar → fetch `/api/pages/:slug` and render HTML in content area
- Search input filters the page list in real-time (by title and content)
- First page is loaded by default

### Content Files

The `server/content/` folder comes with 7 pre-written markdown files about a fictional company. These serve as sample data — the CMS should work with any .md files placed in this folder.

### Constraints

- `npm run dev` at the root starts both server and client
- Backend runs on port 3001, frontend on port 5173 (with Vite proxy)
- Adding a new .md file to `server/content/` should make it appear after page refresh
- Keep code simple — no database, no authentication
