// Pattern table — drives the data/analytics intent matcher.
//
// Each rule maps a regex to a `queryType` consumed by dataAnswerBuilder.
// Order matters: most-specific rules first. Rules are designed to cover
// English / Hinglish / Hindi-script / Gujarati-translit phrasings of the
// same question.

export const DATA_QUERY_PATTERNS = [
  // ── PFMS (most specific — matches before generic "kitne") ──────────────
  { match: /\b(failed|fail).{0,15}\b(payments?|disbursement)\b.{0,20}\b(kitne|count|how\s*many|kitna)\b/i, queryType: 'PFMS_FAILED_COUNT' },
  { match: /\b(payment|disbursement).{0,15}\b(failed|fail|fail\s*hue)/i, queryType: 'PFMS_FAILED_COUNT' },
  { match: /\b(pending\s*disbursement|pending\s*amount|pending\s*paise|pending\s*₹|kitna\s*pending|amount.{0,5}pending)/i, queryType: 'PFMS_PENDING_AMOUNT' },
  { match: /\b(payment\s*success|success\s*rate.{0,10}payment|success.{0,5}rate.{0,10}\bpayment)/i, queryType: 'PFMS_SUCCESS_RATE' },
  { match: /\bbatch\s*status\b|\bbatch\s*kitne\b/i, queryType: 'PFMS_BATCH_STATUS' },

  // ── DigiVritti scholarship counts ──────────────────────────────────────
  { match: /\b(approved).{0,20}\b(students?|scholarships?|applications?|kitne|count)/i, queryType: 'DV_APPROVED_COUNT' },
  { match: /\b(scholarship|application).{0,15}\b(approved)/i, queryType: 'DV_APPROVED_COUNT' },
  { match: /\b(rejected).{0,20}\b(applications?|count|kitne|students?)/i, queryType: 'DV_REJECTED_COUNT' },
  { match: /\b(draft).{0,20}\b(applications?|kitne|count|students?)/i, queryType: 'DV_DRAFT_COUNT' },
  { match: /\b(pending).{0,20}\b(applications?|reviews?|kitne|count)/i, queryType: 'DV_PENDING_COUNT' },
  { match: /\b(submitted|submit\s*hu|filed).{0,15}\b(applications?|scholarships?)/i, queryType: 'DV_SUBMITTED_COUNT' },
  { match: /\b(applications?|scholarships?).{0,15}\b(submitted|filed|kitne)/i, queryType: 'DV_SUBMITTED_COUNT' },
  { match: /\b(rejection\s*reasons?|why\s*rejected|kyun\s*reject)/i, queryType: 'DV_REJECTION_REASONS' },

  // ── Attendance: absent today (must precede generic absent rule) ────────
  { match: /\baaj\s+kitne\s+absent|kitne\s+absent\s+aaj|absent\s+today.{0,20}\bkitne\b/i, queryType: 'ABSENT_TODAY' },
  { match: /\b(absent|absentee).{0,15}\b(today|aaj|aaja)\b/i, queryType: 'ABSENT_TODAY' },
  { match: /\bwho\s+(was|were|is).{0,5}\babsent\b/i, queryType: 'ABSENT_TODAY' },

  // Class N absent students
  { match: /\bclass\s*\d+.{0,30}\b(absent|gair.?hazir|nahi.aaye)/i, queryType: 'ABSENT_BY_CLASS' },

  // At-risk count
  { match: /\b(at.?risk|risk\s*students?|dropout|chronic).{0,30}\b(kitne|count|how\s*many|kitna)\b/i, queryType: 'AT_RISK_COUNT' },
  { match: /\bhow\s*many.{0,20}\b(at.?risk|risk\s*students?)/i, queryType: 'AT_RISK_COUNT' },
  { match: /\b(at.?risk|risk\s*students?)\b/i, queryType: 'AT_RISK_COUNT' },

  // Average / class score
  { match: /\b(average|avg).{0,20}\b(score|marks|performance)\b/i, queryType: 'AVG_SCORE' },
  { match: /\bclass\s*\d+.{0,15}\b(ka\s*score|score|average|avg)\b/i, queryType: 'AVG_SCORE' },
  { match: /\bclass.{0,5}\bscore\s*kya\b/i, queryType: 'AVG_SCORE' },

  // XAMTA
  { match: /\bxamta\b.{0,30}\b(score|report|marks|class)/i, queryType: 'XAMTA_SCORE' },
  { match: /\b(weak|struggling|kamzor|behind).{0,15}\bstudents?\b/i, queryType: 'WEAK_STUDENTS' },
  { match: /\bkaunse?\s+students?\s+weak/i, queryType: 'WEAK_STUDENTS' },
  { match: /\b(learning.outcomes?|lo).{0,15}\b(report|score|mastery|kya)/i, queryType: 'LO_REPORT' },

  // ── Class total (most generic — last so it doesn't eat specific rules) ─
  { match: /\b(class\s*\d+).{0,30}\b(students?|bache|baccho)\b.{0,20}\b(kitne|kitna|how\s*many|count|total)\b/i, queryType: 'CLASS_TOTAL' },
  { match: /\b(total|count|kitne|kitna|how\s*many).{0,30}\b(students?|bache|baccho|ladk|बच्चे)/i, queryType: 'CLASS_TOTAL' },
  { match: /\bmere\s+class.{0,30}\b(kitne|total|bache|students?)/i, queryType: 'CLASS_TOTAL' },
  { match: /\bmy\s+class.{0,30}\b(total|count|how\s*many|students?)/i, queryType: 'CLASS_TOTAL' },
  { match: /^\s*class\s*\d+\s*\??\s*$/i, queryType: 'CLASS_TOTAL' },
]

// Heuristic: does the user's input look like a question rather than a command?
// Used by the router to decide whether to consult the data layer BEFORE the
// action layer ("how many students?" should yield an analytics card, not
// route to OPEN_CLASS_DASHBOARD).
export function isQuestionShape(text) {
  if (!text) return false
  if (/\?\s*$/.test(text)) return true
  // Starts with a question word (English / Hinglish / Gujarati-translit).
  if (/^\s*(kitne|kitna|kaha|kahaan|kya|kyun|kaise|kab|how\s*many|how|what|why|where|when|tell\s*me|explain|describe|batao|samjhao|bata|samjha|kitla|kety)\b/i.test(text)) return true
  // Contains a count-asking phrase.
  if (/\b(kitne|kitna|how\s*many|kitla|how\s*much)\b/i.test(text)) return true
  return false
}

// Detect approximate language for response shaping.
export function detectLanguage(text) {
  if (!text) return 'en'
  if (/[઀-૿]/.test(text)) return 'gu'                   // Gujarati script
  if (/[ऀ-ॿ]/.test(text)) return 'hi'                   // Devanagari (Hindi)
  // Hinglish / Gu-Eng — common transliterated markers.
  if (/\b(kitne|kitna|hain|hai|aaj|kya|dikhao|batao|kahaan|kaha|mera|mere|meri|mujhe|aapki|aapka|aapki|chhe|chho|karu|karvi|hu|nahi|nu|ne|chhe)\b/i.test(text)) return 'hi-en'
  return 'en'
}

// Returns matched { queryType } or null. Pure — no entity extraction here;
// the router merges entities from localPatterns separately.
export function matchDataQuery(text) {
  if (!text) return null
  for (const rule of DATA_QUERY_PATTERNS) {
    if (rule.match.test(text)) return { queryType: rule.queryType }
  }
  return null
}
