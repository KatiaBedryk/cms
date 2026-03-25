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

// Parse frontmatter block (--- ... ---) from the top of a markdown file.
// Returns { frontmatter: { category, tags }, body } where body is the
// markdown without the frontmatter block.
function parseFrontmatter(raw) {
  const fm = { category: '', tags: [] }
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!fmMatch) return { frontmatter: fm, body: raw }

  const block = fmMatch[1]
  const body = raw.slice(fmMatch[0].length)

  // category: Tutorials
  const categoryMatch = block.match(/^category:\s*(.+)$/m)
  if (categoryMatch) fm.category = categoryMatch[1].trim()

  // tags: [AI, Beginner, Getting Started]  OR  tags:\n  - AI
  const tagsInline = block.match(/^tags:\s*\[(.+)\]$/m)
  const tagsBlock = block.match(/^tags:\s*\n((?:\s*-\s*.+\n?)+)/m)
  if (tagsInline) {
    fm.tags = tagsInline[1].split(',').map(t => t.trim()).filter(Boolean)
  } else if (tagsBlock) {
    fm.tags = tagsBlock[1]
      .split('\n')
      .map(l => l.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean)
  }

  return { frontmatter: fm, body }
}

// Build a frontmatter block string from category and tags values.
// Returns an empty string if both are empty.
function buildFrontmatter(category, tags) {
  const hasCategory = category && category.trim()
  const hasTags = Array.isArray(tags) && tags.length > 0
  if (!hasCategory && !hasTags) return ''

  let block = '---\n'
  if (hasCategory) block += `category: ${category.trim()}\n`
  if (hasTags) block += `tags: [${tags.join(', ')}]\n`
  block += '---\n'
  return block
}

// GET /api/pages — list all pages
app.get('/api/pages', (req, res) => {
  try {
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
    const pages = files.map(file => {
      const slug = file.replace('.md', '')
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
      const { frontmatter, body } = parseFrontmatter(raw)
      const title = extractTitle(body)
      return { slug, title, category: frontmatter.category, tags: frontmatter.tags }
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
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { frontmatter, body } = parseFrontmatter(raw)
    const html = marked(body)
    res.json({ slug, html, markdown: body, category: frontmatter.category, tags: frontmatter.tags })
  } catch (err) {
    res.status(500).json({ error: 'Could not read page' })
  }
})

// PUT /api/pages/:slug — save (overwrite) a page with new markdown + frontmatter
app.put('/api/pages/:slug', (req, res) => {
  const { slug } = req.params
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid page name' })

  const { markdown, category = '', tags = [] } = req.body
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return res.status(400).json({ error: 'Markdown content is required' })
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Page not found' })

  try {
    const fm = buildFrontmatter(category, tags)
    fs.writeFileSync(filePath, fm + markdown, 'utf-8')
    const html = marked(markdown)
    const title = extractTitle(markdown)
    res.json({ slug, title, html, markdown, category, tags })
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
