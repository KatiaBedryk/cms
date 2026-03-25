import express from 'express'
import fs from 'fs'
import path from 'path'
import { marked } from 'marked'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001
const CONTENT_DIR = path.join(__dirname, 'content')

app.use(express.json())

// Validate slug: only letters, numbers, and hyphens allowed
// This prevents anyone from writing outside the content folder
function isValidSlug(slug) {
  return /^[a-zA-Z0-9-]+$/.test(slug)
}

// Extract the title from the first # heading in a markdown file
function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)/m)
  return match ? match[1].trim() : 'Untitled'
}

// GET /api/pages — list all pages
app.get('/api/pages', (req, res) => {
  try {
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
    const pages = files.map(file => {
      const slug = file.replace('.md', '')
      const markdown = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
      const title = extractTitle(markdown)
      return { slug, title }
    })
    res.json(pages)
  } catch (err) {
    res.status(500).json({ error: 'Could not read pages' })
  }
})

// GET /api/pages/:slug — get a single page as HTML
app.get('/api/pages/:slug', (req, res) => {
  const { slug } = req.params
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid page name' })

  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Page not found' })

  try {
    const markdown = fs.readFileSync(filePath, 'utf-8')
    const html = marked(markdown)
    res.json({ slug, html, markdown })
  } catch (err) {
    res.status(500).json({ error: 'Could not read page' })
  }
})

// PUT /api/pages/:slug — save (overwrite) a page with new markdown
app.put('/api/pages/:slug', (req, res) => {
  const { slug } = req.params
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid page name' })

  const { markdown } = req.body
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return res.status(400).json({ error: 'Markdown content is required' })
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Page not found' })

  try {
    fs.writeFileSync(filePath, markdown, 'utf-8')
    const html = marked(markdown)
    const title = extractTitle(markdown)
    res.json({ slug, title, html, markdown })
  } catch (err) {
    res.status(500).json({ error: 'Could not save page' })
  }
})

// DELETE /api/pages/:slug — delete a page
app.delete('/api/pages/:slug', (req, res) => {
  const { slug } = req.params
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid page name' })

  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Page not found' })

  try {
    fs.unlinkSync(filePath)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Could not delete page' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
