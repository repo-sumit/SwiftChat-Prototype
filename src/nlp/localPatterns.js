// Pattern table — drives the deterministic intent matcher.
//
// Each row maps a regex (or list of keywords) to an action id. Order matters:
// the first matching row wins, so put the more-specific patterns first.
//
// Multilingual coverage:
//  - English keywords
//  - Hindi/Hinglish romanizations ("kholo", "dikhao", "kaha hai")
//  - A few native-script hits for hi/gu Devanagari & Gujarati
//
// We also extract entities here (currently `class`, `scheme`, `paymentFilter`,
// `question`). Add more extractors in `extractEntities()` as new modules need.

const kw = (...words) => new RegExp(`\\b(${words.join('|')})\\b`, 'i')

// Each rule: { match: RegExp | (text)=>boolean, action: string }
//
// Order matters — patterns that should win must appear first. State-changing
// actions (e.g. parent alerts) are placed above the more generic intents
// (e.g. SHOW_ABSENT_STUDENTS) so a phrase like "send parent alert to absent
// students" routes to the parent-alert action.
export const PATTERNS = [
  // ── Notifications / reminders ───────────────────────────────────────────
  // Broadcast creation (state-only) — must precede the generic "notification"
  // rule so phrases like "send notification to teachers" route here.
  { match: /\b(broadcast|send|bhejo|भेजो|create|banao)\b.*\b(notification|announcement|alert|message)\b/i, action: 'CREATE_BROADCAST_NOTIFICATION' },
  { match: /\b(notification|announcement|alert)\b.*\b(send|bhejo|भेजो|create|banao|broadcast)\b/i, action: 'CREATE_BROADCAST_NOTIFICATION' },
  // "Mark all read"
  { match: /\b(mark\s*all\s*read|all\s*notifications?\s*read|sab\s*read|mark\s*as\s*read\s*all)\b/i, action: 'MARK_ALL_NOTIFICATIONS_READ' },
  // Reminder creation — "remind me", "reminder lagao", "kal 10 baje reminder", etc.
  { match: /\b(remind\s*me|set\s*(a\s*)?reminder|create\s*(a\s*)?reminder|add\s*(a\s*)?reminder)\b/i, action: 'CREATE_REMINDER' },
  { match: /\breminder\b.*\b(lagao|laga\s*do|set\s*karo|add\s*karo|banao|create)\b/i, action: 'CREATE_REMINDER' },
  { match: /\b(lagao|laga\s*do|set\s*karo|add\s*karo|banao|create)\b.*\breminder\b/i, action: 'CREATE_REMINDER' },
  { match: /\b(kal|aaj|tomorrow|today)\b.*\bbaje\b.*\b(reminder|yaad)\b/i, action: 'CREATE_REMINDER' },
  // Open notifications (broad — must come last in this block)
  { match: /\b(notification|notifications|notif|alerts|announcements?)\b\s*(kholo|kholna|kholiye|dikhao|dekhao|open|show|view)?/i, action: 'OPEN_NOTIFICATIONS' },
  { match: /(open|show|view)\s+(my\s+)?(notification|notifications|notif|alerts|announcements?)/i, action: 'OPEN_NOTIFICATIONS' },

  // ── Parent alerts (must precede `absent` so combined phrasings route here) ─
  { match: /parent\s*alert|notify\s*parent|whatsapp\s*alert|sms\s*alert|parent\s*ko\s*bhejo/i, action: 'SEND_PARENT_ALERT' },

  // ── DigiVritti — most specific intents first ─────────────────────────────
  { match: /reject(ed)?|fix\s+rejected|correct\s+rejected/i,                 action: 'OPEN_REJECTED_APPLICATIONS' },
  // Payment queue — handle plural ("payments queue") + filter words.
  { match: /payments?\s*queue|failed\s*payments?|pending\s*payments?|success\s*payments?|payments?\s*retry|utr/i, action: 'OPEN_PAYMENT_QUEUE' },
  { match: /(application|app)\s*list|track(\s+applications?)?/i,             action: 'OPEN_APPLICATION_LIST' },
  { match: /\b(namo\s*saraswati|namo_saraswati|saraswati)\b/i,               action: 'OPEN_NAMO_SARASWATI' },
  { match: /\b(namo\s*lakshmi|namo\s*laxmi|namo_lakshmi|namo_laxmi|nly|namo)\b/i, action: 'OPEN_NAMO_LAKSHMI' },
  { match: /\b(ask|run|query)\b.*\b(digivritti|scholarship|state|district|payment|review|school)\b.*\b(ai|sql|insight|analytics|query)\b/i, action: 'OPEN_DIGIVRITTI_AI' },
  { match: /\b(digivritti|digi\s*vritti|scholarship)\b/i,                    action: 'OPEN_DIGIVRITTI_HOME' },

  // ── XAMTA ─────────────────────────────────────────────────────────────────
  { match: /\bxamta\b|answer\s*sheet|omr|worksheet\s*scan|learning\s*scan/i, action: 'OPEN_XAMTA_SCAN' },
  { match: /\b(learning\s*outcomes?|lo\s*report|outcomes?)\b/i,              action: 'OPEN_XAMTA_RESULTS' },

  // ── Attendance ───────────────────────────────────────────────────────────
  { match: /\b(absent|absentee|missing\s+student)/i,                         action: 'SHOW_ABSENT_STUDENTS' },
  { match: /\b(attendance|haajri|hajri|hazri|hajiri|roll\s*call|present)\b|હાજરી|अटेंडेंस|उपस्थिति/i, action: 'OPEN_MARK_ATTENDANCE' },

  // ── Dashboards / reports / performance ───────────────────────────────────
  { match: /\b(state\s*dashboard|state\s*kpi|state\s*command|state\s*intelligence)\b/i, action: 'OPEN_STATE_DASHBOARD' },
  { match: /\b(district\s*dashboard|district\s*drilldown|block\s*analysis)\b/i,        action: 'OPEN_DISTRICT_DASHBOARD' },
  { match: /\b(report\s*card|generate\s*report|student\s*report\s*card)\b/i, action: 'OPEN_REPORT_CARD' },
  // Class N + any of (report|performance|dashboard|progress|summary) → class dashboard.
  // This row catches "Class 8 ka performance report dikhao" before the
  // generic "performance report" rule below. The .* is bounded by the report
  // keywords so it won't gobble unrelated text.
  { match: /\bclass\s*\d.{0,30}?\b(report|performance|dashboard|progress|summary)\b/i, action: 'OPEN_CLASS_DASHBOARD' },
  // Plain student-level reports — only when no class number was given.
  { match: /\b(student\s*report|performance\s*report|student\s*performance\s*report)\b/i, action: 'OPEN_STUDENT_REPORT' },
  // Class N or "class dashboard / class progress" without report-words.
  { match: /\b(class\s*\d|class\s*(report|performance|dashboard|progress|summary))\b|student\s*performance/i, action: 'OPEN_CLASS_DASHBOARD' },
  { match: /\b(school\s*dashboard|school\s*kpi|attendance\s*summary|school\s*overview)\b/i, action: 'OPEN_SCHOOL_DASHBOARD' },
  { match: /\breport\b/i,                                                    action: 'OPEN_STUDENT_REPORT' },
  { match: /\bdashboard\b|दिखाओ\s*dashboard/i,                               action: 'OPEN_SCHOOL_DASHBOARD' },
]

// ─── Entity extraction ───────────────────────────────────────────────────────
const CLASS_RE = /\bclass\s*(\d{1,2})\b|\bgrade\s*(\d{1,2})\b|\bstd\s*(\d{1,2})\b|\b(\d{1,2})\s*(?:th|st|nd|rd)?\s*(?:class|grade|std)\b/i
const PAYMENT_FILTER_RE = /\b(failed|success|pending|all)\s*payment/i
const SCHEME_RE = /\b(namo\s*saraswati|saraswati|ns)\b|\b(namo\s*lakshmi|namo\s*laxmi|lakshmi|nl)\b/i

export function extractEntities(text) {
  const entities = {}
  if (!text) return entities

  // class / grade
  const cm = text.match(CLASS_RE)
  if (cm) {
    entities.class = String(cm[1] || cm[2] || cm[3] || cm[4] || '').replace(/^0+/, '') || undefined
  }

  // scheme
  const sm = text.match(SCHEME_RE)
  if (sm) {
    entities.scheme = sm[1] ? 'ns' : 'nl'
  }

  // payment filter
  const pm = text.match(PAYMENT_FILTER_RE)
  if (pm) {
    entities.paymentFilter = pm[1].toLowerCase()
  }

  // free-form question (used by DigiVritti AI ask) — store the original text
  // so the engine can keyword-match further.
  entities.question = text.trim()

  return entities
}

// Returns { actionId, score } for the best local match, or null.
export function matchLocalIntent(text) {
  if (!text) return null
  for (const rule of PATTERNS) {
    if (typeof rule.match === 'function' ? rule.match(text) : rule.match.test(text)) {
      return { actionId: rule.action, source: 'local-pattern' }
    }
  }
  return null
}
