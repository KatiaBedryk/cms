function SearchBar({ value, onChange }) {
  return (
    <input
      className="search-input"
      type="text"
      placeholder="Search pages…"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Search pages"
    />
  )
}

export default SearchBar
