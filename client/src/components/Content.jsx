function Content({ page, title, onEdit, onDelete }) {
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

      {/* Rendered markdown as HTML */}
      <div
        className="content-body"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </>
  )
}

export default Content
