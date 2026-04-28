// SwiftChat AI backend — Express server.
// POST /interpret   { text, role } → strict JSON intent
// GET  /healthz     → { ok, model }

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { interpretViaGroq } from './interpret.js'

const app = express()
const PORT = Number(process.env.PORT || 8787)

const origins = (process.env.CORS_ORIGIN || '*')
  .split(',').map(s => s.trim()).filter(Boolean)

app.use(cors({
  origin: origins.length === 1 && origins[0] === '*' ? true : origins,
  methods: ['POST', 'GET', 'OPTIONS'],
}))
app.use(express.json({ limit: '32kb' }))

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' })
})

app.post('/interpret', async (req, res) => {
  const { text, role } = req.body || {}
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' })
  }
  if (typeof role !== 'string' || !role.trim()) {
    return res.status(400).json({ error: 'role is required' })
  }
  try {
    const out = await interpretViaGroq({ text: text.trim(), role: role.trim() })
    if (!out) return res.status(502).json({ error: 'interpreter returned no parseable JSON' })
    res.json(out)
  } catch (err) {
    console.error('[/interpret]', err?.message || err)
    res.status(500).json({ error: err?.message || 'interpret failed' })
  }
})

app.listen(PORT, () => {
  console.log(`SwiftChat AI listening on :${PORT}`)
})
