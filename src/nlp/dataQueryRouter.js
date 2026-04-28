// Top-level entry for the global data-query layer.
//
// Layer 1.5 in the NLP pipeline:
//   1. routeIntentSync (action)        ← src/nlp/globalIntentRouter.js
//   2. routeDataQuery   (analytics)   ← THIS FILE
//   3. POST /message    (LLM action OR RAG answer)
//   4. smart fallback chips
//
// This layer is fully synchronous and runs entirely against frontend mock
// data — no LLM, no backend roundtrip — so analytics answers feel instant.
//
// Returns either an analytics payload (see dataAnswerBuilder.js for shape)
// or null when the query doesn't match any data pattern.

import { matchDataQuery, detectLanguage, isQuestionShape } from './dataQueryPatterns.js'
import { extractEntities } from './localPatterns.js'
import { buildAnswer } from './dataAnswerBuilder.js'

export function routeDataQuery({ text, role } = {}) {
  if (!text || !role) return null
  const hit = matchDataQuery(text)
  if (!hit) return null
  const entities = extractEntities(text)
  const language = detectLanguage(text)
  return buildAnswer({ queryType: hit.queryType, role, entities, language })
}

// Re-export so handleSend / qaRunner can detect question-shape without
// importing patterns directly.
export { isQuestionShape } from './dataQueryPatterns.js'
