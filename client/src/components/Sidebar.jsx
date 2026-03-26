import SearchBar from './SearchBar'

function Sidebar({ pages, activePage, search, onSearch, onSelectPage, activeTag, onClearTag, searchResults }) {

  // ── Search results mode ───────────────────────────────
  if (searchResults !== null) {
    return (
      <aside className="sidebar">
        <div className="sidebar-search">
          <SearchBar value={search} onChange={onSearch} />
        </div>
        <div className="sidebar-results-header">
          {searchResults.length === 0
            ? 'No results found'
            : `${searchResults.length} page${searchResults.length !== 1 ? 's' : ''} found`}
        </div>
        <nav className="sidebar-nav">
          {searchResults.map(result => (
            <div key={result.slug} className="search-result-item">
              <span
                className={`search-result-title${activePage?.slug === result.slug ? ' active' : ''}`}
                onClick={() => onSelectPage(result.slug)}
              >
                {result.title}
              </span>
              {result.snippets.map((snippet, i) => (
                <p
                  key={i}
                  className="search-result-snippet"
                  dangerouslySetInnerHTML={{ __html: snippet }}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>
    )
  }

  // ── Normal grouped mode ───────────────────────────────

  // Filter by tag
  const filtered = activeTag
    ? pages.filter(p => Array.isArray(p.tags) && p.tags.includes(activeTag))
    : pages

  // Group by category; pages with no category go into 'General'
  const groupMap = {}
  filtered.forEach(page => {
    const key = page.category && page.category.trim() ? page.category.trim() : 'General'
    if (!groupMap[key]) groupMap[key] = []
    groupMap[key].push(page)
  })

  const groupNames = Object.keys(groupMap).sort((a, b) => {
    if (a === 'General') return -1
    if (b === 'General') return 1
    return a.localeCompare(b)
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-search">
        <SearchBar value={search} onChange={onSearch} />
      </div>

      {/* Active tag filter label */}
      {activeTag && (
        <div className="sidebar-tag-filter">
          <span>Tag: <strong>{activeTag}</strong></span>
          <button className="tag-filter-clear" onClick={onClearTag} title="Clear filter">×</button>
        </div>
      )}

      <nav className="sidebar-nav">
        {filtered.length === 0 && (
          <p className="sidebar-empty">No pages match this tag.</p>
        )}
        {groupNames.map(group => (
          <div key={group} className="sidebar-group">
            <p className="sidebar-group-heading">{group}</p>
            {groupMap[group].map(page => (
              <span
                key={page.slug}
                className={`sidebar-item${activePage?.slug === page.slug ? ' active' : ''}`}
                onClick={() => onSelectPage(page.slug)}
              >
                {page.title}
              </span>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
