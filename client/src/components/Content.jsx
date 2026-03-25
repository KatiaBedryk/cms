function Content({ page, title, onEdit, onDelete, onTagClick, activeTag }) {
  const hasCategory = page.category && page.category.trim()
  const hasTags = Array.isArray(page.tags) && page.tags.length > 0

  return (
    <>
      {/* Edit / Delete action buttons */}
      <div className="page-actions">
        <button className="btn btn-primary" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>

      {/* Category badge + clickable tag pills */}
      {(hasCategory || hasTags) && (
        <div className="page-meta">
          {hasCategory && (
            <span className="meta-category">{page.category}</span>
          )}
          {hasTags && page.tags.map(tag => (
            <button
              key={tag}
              className={`meta-tag meta-tag-btn${activeTag === tag ? ' meta-tag-active' : ''}`}
              onClick={() => onTagClick(activeTag === tag ? null : tag)}
              title={activeTag === tag ? 'Clear filter' : `Filter by "${tag}"`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Rendered markdown as HTML */}
      <div
        className="content-body"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </>
  )
}

export default Content
