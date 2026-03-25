import { useState } from 'react'

function Editor({ page, onSave, onCancel }) {
  const [markdown, setMarkdown] = useState(page.markdown)
  const [category, setCategory] = useState(page.category || '')
  // Tags are stored internally as an array, shown to the user as a comma-separated string
  const [tagsInput, setTagsInput] = useState((page.tags || []).join(', '))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    // Convert the comma-separated tags string back into an array
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    await onSave(markdown, category, tags)
    setSaving(false)
  }

  return (
    <div className="editor-wrapper">
      <div className="editor-toolbar">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <span className="editor-label">Editing in Markdown</span>
      </div>

      {/* Frontmatter fields */}
      <div className="editor-meta">
        <div className="editor-meta-field">
          <label className="editor-meta-label" htmlFor="editor-category">Category</label>
          <input
            id="editor-category"
            className="editor-meta-input"
            type="text"
            placeholder="e.g. Tutorials"
            value={category}
            onChange={e => setCategory(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="editor-meta-field">
          <label className="editor-meta-label" htmlFor="editor-tags">Tags</label>
          <input
            id="editor-tags"
            className="editor-meta-input"
            type="text"
            placeholder="e.g. AI, Beginner, Getting Started"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            disabled={saving}
          />
          <span className="editor-meta-hint">Separate tags with commas</span>
        </div>
      </div>

      <textarea
        className="editor-textarea"
        value={markdown}
        onChange={e => setMarkdown(e.target.value)}
        spellCheck={false}
        autoFocus
      />
    </div>
  )
}

export default Editor
