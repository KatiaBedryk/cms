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

// Strip markdown syntax to get clean plain text for searching.
// Removes headings (#), bold/italic (*_), links, code blocks, and horizontal rules.
function stripMarkdown(md) {
  return md
    .replace(/^#{1,6}\s+/gm, '')        // headings
    .replace(/!\[.*?\]\(.*?\)/g, '')     // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links → keep link text
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // inline and fenced code
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2') // bold / italic
    .replace(/^[-*]{3,}\s*$/gm, '')      // horizontal rules
    .replace(/^>\s+/gm, '')              // blockquotes
    .replace(/^[-*+]\s+/gm, '')         // unordered list markers
    .replace(/^\d+\.\s+/gm, '')         // ordered list markers
    .replace(/\n{2,}/g, '\n')            // collapse blank lines
    .trim()
}

// Extract up to maxSnippets text snippets (each ~120 chars) around matches
// of `query` in `plainText`. Wraps each match in <mark> tags.
function extractSnippets(plainText, query, maxSnippets = 3) {
  const CONTEXT = 60  // chars of context before and after the match
  const snippets = []
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  let match

  while ((match = regex.exec(plainText)) !== null && snippets.length < maxSnippets) {
    const start = Math.max(0, match.index - CONTEXT)
    const end = Math.min(plainText.length, match.index + match[0].length + CONTEXT)
    let snippet = plainText.slice(start, end).replace(/\n/g, ' ')

    // Add ellipsis if we're not at the start/end of the text
    if (start > 0) snippet = '…' + snippet
    if (end < plainText.length) snippet = snippet + '…'

    // Highlight all matches within this snippet
    const highlighted = snippet.replace(
      new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      m => `<mark>${m}</mark>`
    )
    snippets.push(highlighted)
  }

  return snippets
}

// GET /api/search?q=... — full-text search across all pages
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').trim()
  if (query.length < 2) return res.json([])

  try {
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
    const results = []

    for (const file of files) {
      const slug = file.replace('.md', '')
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
      const { body } = parseFrontmatter(raw)
      const title = extractTitle(body)
      const plainText = stripMarkdown(body)
      const lowerQuery = query.toLowerCase()

      const titleMatches = title.toLowerCase().includes(lowerQuery)
      const snippets = extractSnippets(plainText, query, 3)

      // Include this page if the title or content matches
      if (titleMatches || snippets.length > 0) {
        // If title matches but no content snippets, show the opening sentence as context
        if (snippets.length === 0) {
          const opening = plainText.slice(0, 120).replace(/\n/g, ' ')
          snippets.push(opening + (plainText.length > 120 ? '…' : ''))
        }
        results.push({ slug, title, snippets })
      }
    }

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: 'Search failed' })
  }
})
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
