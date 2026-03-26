import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Content from './components/Content'
import Editor from './components/Editor'
import './App.css'

function App() {
  const [pages, setPages] = useState([])             // list of { slug, title, category, tags }
  const [activePage, setActivePage] = useState(null) // { slug, html, markdown, category, tags }
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null) // null = not searching
  const [activeTag, setActiveTag] = useState(null)   // currently selected tag filter
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  // Debounced full-text search — fires 300ms after the user stops typing
  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search.trim())}`)
        const data = await res.json()
        setSearchResults(data)
      } catch (err) {
        console.error('Search failed', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Load the page list on startup
  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      const res = await fetch('/api/pages')
      const data = await res.json()
      setPages(data)
      // Auto-load the first page
      if (data.length > 0) {
        loadPage(data[0].slug)
      }
    } catch (err) {
      console.error('Failed to load pages', err)
    }
  }

  async function loadPage(slug) {
    setIsEditing(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/pages/${slug}`)
      const data = await res.json()
      setActivePage(data)
    } catch (err) {
      console.error('Failed to load page', err)
    } finally {
      setLoading(false)
    }
  }

  async function savePage(slug, markdown, category = '', tags = []) {
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, category, tags }),
      })
      const data = await res.json()
      if (res.ok) {
        // Update the page content and the title/category/tags in the sidebar list
        setActivePage(data)
        setPages(prev =>
          prev.map(p => p.slug === slug
            ? { slug, title: data.title, category: data.category, tags: data.tags }
            : p
          )
        )
        setIsEditing(false)
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Save failed. Please try again.')
    }
  }

  async function deletePage(slug) {
    if (!window.confirm('Are you sure you want to delete this page? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/pages/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        const remaining = pages.filter(p => p.slug !== slug)
        setPages(remaining)
        if (remaining.length > 0) {
          loadPage(remaining[0].slug)
        } else {
          setActivePage(null)
        }
        setIsEditing(false)
      } else {
        const data = await res.json()
        alert('Delete failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Delete failed. Please try again.')
    }
  }

  const activeTitle = activePage
    ? (pages.find(p => p.slug === activePage.slug)?.title || activePage.slug)
    : null

  return (
    <>
      {/* EPAM Blue Header */}
      <header className="header">
        <span className="header-logo">EPAM</span>
        <span className="header-subtitle">Internal Wiki</span>
      </header>

      <div className="layout">
        {/* Sidebar */}
        <Sidebar
          pages={pages}
          activePage={activePage}
          search={search}
          onSearch={setSearch}
          onSelectPage={loadPage}
          activeTag={activeTag}
          onClearTag={() => setActiveTag(null)}
          searchResults={searchResults}
        />

        {/* Main content area */}
        <main className="main">
          {/* Breadcrumb */}
          {activeTitle && (
            <nav className="breadcrumb">
              <span>Wiki</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{activeTitle}</span>
            </nav>
          )}

          {loading && (
            <div className="state-message">Loading…</div>
          )}

          {!loading && !activePage && (
            <div className="state-message">Select a page from the sidebar to get started.</div>
          )}

          {!loading && activePage && !isEditing && (
            <Content
              page={activePage}
              title={activeTitle}
              onEdit={() => setIsEditing(true)}
              onDelete={() => deletePage(activePage.slug)}
              onTagClick={(tag) => setActiveTag(tag)}
              activeTag={activeTag}
            />
          )}

          {!loading && activePage && isEditing && (
            <Editor
              page={activePage}
              onSave={(markdown, category, tags) => savePage(activePage.slug, markdown, category, tags)}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </main>
      </div>
    </>
  )
}

export default App
