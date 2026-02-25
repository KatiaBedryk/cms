import express from 'express'

const app = express()
const PORT = 3001

app.get('/', (req, res) => {
  res.json({ message: 'CMS API server is running. Build the API endpoints with Claude Code.' })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
