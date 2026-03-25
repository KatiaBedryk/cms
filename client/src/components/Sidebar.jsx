import SearchBar from './SearchBar'

function Sidebar({ pages, activePage, search, onSearch, onSelectPage }) {
  // Filter pages by search query (matches title, case-insensitive)
  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-search">
        <SearchBar value={search} onChange={onSearch} />
      </div>
      <nav className="sidebar-nav">
        {filtered.length === 0 && (
          <p className="sidebar-empty">No pages match your search.</p>
        )}
        {filtered.map(page => (
          <span
            key={page.slug}
            className={`sidebar-item${activePage?.slug === page.slug ? ' active' : ''}`}
            onClick={() => onSelectPage(page.slug)}
          >
            {page.title}
          </span>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
