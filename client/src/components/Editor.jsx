import { useState } from 'react'

function Editor({ page, onSave, onCancel }) {
  const [markdown, setMarkdown] = useState(page.markdown)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(markdown)
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
