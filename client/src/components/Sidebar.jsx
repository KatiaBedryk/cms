import SearchBar from './SearchBar'

function Sidebar({ pages, activePage, search, onSearch, onSelectPage, activeTag, onClearTag }) {
  // 1. Filter by search text (title match)
  const afterSearch = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  // 2. Filter by active tag (if one is selected)
  const filtered = activeTag
    ? afterSearch.filter(p => Array.isArray(p.tags) && p.tags.includes(activeTag))
    : afterSearch

  // 3. Group filtered pages by category.
  //    Pages with no category go into 'General'.
  //    General comes first; all other groups are sorted alphabetically.
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
          <p className="sidebar-empty">No pages match your search.</p>
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
