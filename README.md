# CMS (Content Management System) — Vibe-Coding Bootcamp

A web portal that displays markdown files with sidebar navigation and search. Full-stack project with Express backend and React frontend. This is a skeleton project for the Vibe-Coding Bootcamp.

## Getting Started

1. Open this folder in VS Code
2. Open the terminal in VS Code (Terminal → New Terminal)
3. Install all dependencies:

```bash
npm install
```

4. Start the dev server (runs both backend and frontend):

```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

You should see a placeholder page — the app is ready for development.

---

## Choose Your Start Mode

### Option A — Quick Start (copy-paste this prompt into Claude Code)

Copy the entire prompt below and paste it into Claude Code:

```
Read the AGENTS.md file in this project. Build the complete CMS application as described:

1. Backend (server/index.js): Create an Express API with two endpoints — GET /api/pages returns a list of all markdown files (slug + title extracted from first heading), and GET /api/pages/:slug returns the content of one file converted from markdown to HTML using the "marked" package.

2. Frontend (client/src/): Create a React app with a sidebar showing all pages, a main content area that renders the selected page's HTML, and a search bar that filters pages in real-time.

3. Wire them together: the frontend fetches data from the backend API. Clicking a page in the sidebar loads its content. The first page loads by default.

4. The server/content/ folder already has 7 markdown files — use them as the data source.

Before you start, ask me which UI theme I want (A, B, or C — see AGENTS.md). Then build everything in one go. Make sure the app runs with npm run dev from the root folder.
```

### Option B — Interactive Start (planning mode)

Copy this short prompt into Claude Code:

```
I want to build a web portal that shows documents from a folder — with a sidebar menu, page viewer, and search. It has a backend that reads files and a frontend that displays them. Read the AGENTS.md for details. Before writing any code, ask me questions about what I want — use simple, non-technical language. Then propose a plan and build it step by step.
```

---

Both options produce a working CMS portal. Try whichever feels more comfortable — or try both!
