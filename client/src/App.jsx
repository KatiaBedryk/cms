import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Content from './components/Content'
import Editor from './components/Editor'
import './App.css'

function App() {
  const [pages, setPages] = useState([])          // list of { slug, title }
  const [activePage, setActivePage] = useState(null) // { slug, title, html, markdown }
  const [search, setSearch] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

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

  async function savePage(slug, markdown) {
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      })
      const data = await res.json()
      if (res.ok) {
        // Update the page content and the title in the sidebar list
        setActivePage(data)
        setPages(prev =>
          prev.map(p => p.slug === slug ? { slug, title: data.title } : p)
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
            />
          )}

          {!loading && activePage && isEditing && (
            <Editor
              page={activePage}
              onSave={(markdown) => savePage(activePage.slug, markdown)}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </main>
      </div>
    </>
  )
}

export default App
