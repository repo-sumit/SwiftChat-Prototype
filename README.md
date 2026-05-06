# SwiftChat — VSK Gujarat Prototype

A multi-role chat-first prototype of **SwiftChat** for the Vidya Samiksha Kendra (VSK) Gujarat education platform.
The app is a single-page React application that puts a unified conversational
interface on top of attendance, assessment (XAMTA), scholarship workflows
(DigiVritti / Namo Lakshmi / Namo Saraswati), classroom analytics, parent
outreach, and a notifications inbox. A small Node/Express backend (`server/swiftchat-ai`)
adds optional Groq-LLM intent classification and Supabase pgvector RAG for
policy/help questions.

The frontend version field is `swiftchat-v3` (`package.json#name = "swiftchat-v3"`, `version: 3.0.0`).

---

## Overview

SwiftChat is a role-aware conversational shell that replaces a stack of
disconnected admin dashboards with one chat composer. Six government
education personas — **teacher, principal, DEO, state secretary, CRC, PFMS,
parent** — log in and see a home-screen tailored to their scope. They can
either (a) tap chips and bots like a normal messaging app, or (b) speak/type
a free-form natural-language request ("Class 7 ni hajri mark karvi chhe",
"failed payments dikhao", "Namo Saraswati eligibility kya hai?") and the NLP
layer routes it to the correct workspace canvas, analytics card, RAG answer,
or clarification prompt.

### Core user flows

1. **Auth** — `Splash → Login → (State-ID SSO | Phone-OTP) → Home`. Sessions
   persist in `localStorage` so a returning user lands directly on Home.
2. **Home** — `SuperHomePage` shows greeting, role-aware bot list, suggested
   prompts, the Ask AI panel, the notification bell, and a chat composer.
3. **Chat** — typing or chip-tapping flows through the layered NLP pipeline
   (local pattern → data analytics → remote LLM → RAG → fallback).
4. **Canvas** — actions open right-side workspace panels (attendance grid,
   class report, lesson plan, worksheet editor, intervention planner,
   scholarship application, payment queue, knowledge document, etc.).
5. **Notifications** — a localStorage-backed scheduler emits reminders,
   broadcasts, and system pings; the bell badge, toast, and chime fire only
   when targeted at the active role/user.
6. **Sign-out** — clears the persisted session and returns to the splash
   screen.

### Product purpose

The prototype is intended to demonstrate, on real-feeling Gujarat mock data,
that all the role-specific workflows (mark attendance, scan an OMR sheet,
review a scholarship application, retry a failed PFMS payment, draft a class
report, ask a policy question) can be reached through a single multilingual
chat surface — without ever leaving the conversation.

---

## Key Features

### Conversational shell
- **Layered NLP pipeline** (see [src/nlp/](src/nlp/)):
  1. `routeIntentSync` — deterministic local regex matcher
     ([localPatterns.js](src/nlp/localPatterns.js), [actionRegistry.js](src/nlp/actionRegistry.js)).
  2. `routeDataQuery` — pure-frontend analytics/data layer
     ([dataQueryRouter.js](src/nlp/dataQueryRouter.js), [dataQueryPatterns.js](src/nlp/dataQueryPatterns.js), [dataAnswerBuilder.js](src/nlp/dataAnswerBuilder.js)).
  3. `routeIntent` (async) — remote Groq classifier via `aiClient` →
     `groqInterpreter` ([groqInterpreter.js](src/nlp/groqInterpreter.js)).
  4. RAG answer fallback through `/message` orchestrator (backend).
  5. Smart-suggestion fallback chips when nothing else fits.
- **Multilingual coverage** — patterns match English, Hindi, Hinglish,
  Gujarati, and Gujarati-transliterated phrasings.
- **Module + action registry** with explicit `allowedRoles`, `requiredEntities`,
  `fallbackClarification`, `requiresConfirmation` flags.
- **Permission guard** ([permissionGuard.js](src/nlp/permissionGuard.js))
  re-validates every action even when a remote LLM proposed it.
- **Clarification + confirmation flows** — the router emits
  `{ kind: 'clarify' | 'confirm' | 'execute' | 'denied' | ... }`
  directives the UI dispatches.
- **Inline analytics card** rendered via [aiAnalyticsCardHtml](src/nlp/aiAnalyticsCard.js)
  for Layer-1.5 data answers.
- **Knowledge / RAG card** rendered via [aiAnswerCardHtml](src/nlp/aiAnswerCard.js)
  with citation chips that open a [KnowledgeCanvas](src/canvas/modules/KnowledgeCanvas.jsx).

### Authentication
- **State-ID SSO flow** — `Splash → Login → SelectState → SSORedirect →
  SSOVerifying → (SSOSuccess | SSOFail)`.
- **Phone OTP flow** — `Login → PhoneEntry → PhoneOTP`.
- **Demo credentials** are baked into [src/data/mockData.js](src/data/mockData.js)
  (`DEMO_SSO_USERS`, `DEMO_PHONE_USER`).
- **Session persistence** — `swiftchat.session.v1` in `localStorage`; only
  hydrates when a recognised `role` is present.
- **Sign-out** clears the session and stops the notification scheduler.

### Role-aware home
- Per-role bot list + suggested prompts ([roleConfig.js](src/roles/roleConfig.js),
  [chatData.js](src/utils/chatData.js)).
- Per-role NotificationBell with shake animations and urgent-priority pulse.
- Per-role greeting, language switcher, and Ask AI prompt panel.

### Ask AI
- Chip-driven smart prompts (`Initial 6 chips → More Prompts → reveal
  next 6`). See [features/askAi/](src/features/askAi/) and
  [data/askAi/](src/data/askAi/).
- Each prompt resolves into either a chat trigger, a canvas open, or an
  inline result card.
- Free-form Ask AI queries route through `processAskAiQuery` →
  `askAiMatcher` → `getResponse`.

### Canvas workspaces
The right-side `CanvasPanel` ([src/canvas/CanvasPanel.jsx](src/canvas/CanvasPanel.jsx))
loads one of these modules based on `canvasContext.type`:

| Type | Module | Purpose |
|---|---|---|
| `attendance` | AttendanceCanvas | Mark / view attendance for a class |
| `dashboard` | DashboardCanvas | Class / school / district / state dashboards |
| `data-entry` | DataEntryCanvas | Student bio-data entry |
| `intervention` | InterventionCanvas | Plan an intervention group |
| `lesson-plan` | LessonPlanCanvas | AI-drafted lesson plan |
| `worksheet-template` | WorksheetTemplateCanvas | Pick a worksheet template |
| `worksheet-editor` | WorksheetEditorCanvas | Edit a generated worksheet |
| `student-roster` | StudentRosterCanvas | Per-class roster |
| `at-risk-students` | AtRiskStudentsCanvas | At-risk students with reasons |
| `class-report` | ClassReportCanvas | Class report card |
| `pdf` | PDFCanvas | PDF export preview |
| `report` | ReportCanvas | Class / district report |
| `digivritti` | DigiVrittiCanvas | DigiVritti scholarship application views |
| `knowledge` | KnowledgeCanvas | RAG citation viewer |
| `notifications` | NotificationCanvas | Inbox / Reminder form / Broadcast form |

Legacy non-module canvas falls back to four tabs: `editor` (RichTextEditor),
`form` (DataForm), `log` (ActivityLog), `export` (ExportOptions).

### DigiVritti (scholarships)
- Role-segregated data flows under [src/data/digivritti/](src/data/digivritti/) —
  `teacherFlows`, `approverFlows`, `districtFlows`, `stateFlows`,
  `systemStates`, `applications`, `aiQueries`.
- 759-line free-form query bank in [aiQueries.js](src/data/digivritti/aiQueries.js)
  for analytical questions ("monsoon impact", "block-wise success rate"…).
- DigiVritti chat trigger handler in [utils/digivrittiChat.js](src/utils/digivrittiChat.js)
  + backend in [utils/digivrittiBackend.js](src/utils/digivrittiBackend.js).
- Schemes covered: **Namo Lakshmi** (Class 9–12 girls) and **Namo Saraswati**
  (Class 11–12 Science).

### Notifications
- Local scheduler ([notificationScheduler.js](src/notifications/notificationScheduler.js))
  arms a precise `setTimeout` for the next due `scheduledAt`, plus a
  15-second safety-net poll. Reminders fire at the wall-clock minute.
- localStorage store ([notificationStore.js](src/notifications/notificationStore.js))
  with a `swiftchat:notifications:changed` event so consumers re-derive on mutation.
- Targeting ([notificationTargeting.js](src/notifications/notificationTargeting.js))
  — `targetRoles` + `targetUserIds`; `'all'` matches everyone.
- Three notification types: `broadcast`, `reminder`, `system` (see
  [notificationTypes.js](src/notifications/notificationTypes.js)).
- Bell shakes once on normal priority, three times on urgent / reminder.
- Reminders ring continuously until the user opens the toast or bell.
- Action dispatch table ([notificationActions.js](src/notifications/notificationActions.js))
  routes notification CTAs into either an `openCanvas(...)` call or a chat
  trigger string.
- Audio chime ([notificationSound.js](src/notifications/notificationSound.js)) —
  unlocked on first user gesture.

### Analytics layer (frontend-only, instant)
Pure frontend analytics derived from mock data; consulted *before* the LLM
when the message looks like a question.

| File | Provides |
|---|---|
| [data/analytics/attendanceAnalytics.js](src/data/analytics/attendanceAnalytics.js) | Today's absent count, history |
| [data/analytics/classAnalytics.js](src/data/analytics/classAnalytics.js) | Class totals, weak students, average score |
| [data/analytics/digivrittiAnalytics.js](src/data/analytics/digivrittiAnalytics.js) | Approved / rejected / pending counts, rejection reasons |
| [data/analytics/paymentAnalytics.js](src/data/analytics/paymentAnalytics.js) | PFMS pending amount, success rate, batch status |
| [data/analytics/xamtaAnalytics.js](src/data/analytics/xamtaAnalytics.js) | XAMTA scores, Learning-Outcome reports |

### Internationalisation
- Strings in [src/utils/i18n.js](src/utils/i18n.js) with `en`, `hi`, `gu`.
- NLP patterns recognise mixed scripts and transliteration.

---

## Tech Stack

### Frontend (root)
- **React 18** + **Vite 5** (`vite.config.js`).
- **Tailwind CSS 3.4** with a bespoke design-system in `tailwind.config.js`
  (`primary` blue family, `surface`, `txt`, `bdr`, `ok/warn/danger`, `pill`
  radius, `bubble-in`, `canvas-slide`, `ntf-bell-buzz` keyframes).
- **lucide-react** icons.
- **PostCSS + autoprefixer**.
- No state-management library — global state lives in
  [`AppContext`](src/context/AppContext.jsx) (React Context).
- All persistence is `localStorage`-backed (no real auth, no backend writes).

### Backend (`server/swiftchat-ai/`)
- **Node ≥ 18** ESM (`"type": "module"`).
- **Express 4** + **CORS** + **dotenv**.
- **Groq SDK** (`groq-sdk`) — default model `llama-3.3-70b-versatile`.
- **@supabase/supabase-js** — service-role client (bypasses RLS).
- **Gemini embeddings** (`gemini-embedding-001`, 768-dim, REST).

### Build & test tooling
- `vite build` for production bundle.
- Hand-rolled QA runner: [`src/nlp/__tests__/qaRunner.test.mjs`](src/nlp/__tests__/qaRunner.test.mjs)
  reads cases from [`qaCases.json`](src/nlp/__tests__/qaCases.json).
- Diagnostic mjs scripts: [`diagnose.mjs`](src/nlp/__tests__/diagnose.mjs),
  [`probeGemini.mjs`](src/nlp/__tests__/probeGemini.mjs).
- No CI/CD config in the repo (Inferred — not found in `.github/`,
  `.gitlab-ci.yml`, etc.).

### Third-party services (optional)
- **Groq Cloud** — LLM intent classifier + RAG answer synthesiser.
- **Google Gemini** — embedding model.
- **Supabase Postgres + pgvector** — RAG vector store + retrieval RPC.

---

## Architecture

### High-level

```
┌────────────────────────────────────────────────────────────────────────────┐
│                               Browser (SPA)                                │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────────────────────┐   │
│  │ Auth pages │ →  │ SuperHomePage│ ←→ │  CanvasPanel + Notifications │   │
│  │  Splash …  │    │  + ChatInput │    │     (right-slide-in panels)  │   │
│  └────────────┘    └──────┬───────┘    └──────────────────────────────┘   │
│                           │ message                                        │
│                ┌──────────▼─────────────────────────────────────────┐      │
│                │  NLP pipeline                                       │      │
│                │   1. routeIntentSync (local regex)                  │      │
│                │   2. routeDataQuery   (frontend analytics)          │      │
│                │   3. aiClient.interpret → groqInterpreter           │      │
│                │   4. permissionGuard → actionRegistry.run()         │      │
│                │   5. canvas dispatch / chat trigger                 │      │
│                └──────────┬─────────────────────────────────────────┘      │
└───────────────────────────┼────────────────────────────────────────────────┘
                            │ HTTPS  (only when VITE_SWIFTCHAT_AI_API_URL set)
              ┌─────────────▼─────────────┐
              │  server/swiftchat-ai      │
              │   POST /message  (orch.)  │
              │   POST /interpret (Groq)  │
              │   POST /rag/query  (RAG)  │
              │   GET  /rag/knowledge/:f  │
              │   GET  /healthz           │
              └──────┬─────────┬──────────┘
                     │         │
            ┌────────▼──┐  ┌───▼─────────────────────────┐
            │  Groq LLM │  │ Supabase pgvector + match_…  │
            └───────────┘  └─────────────┬───────────────┘
                                         │
                                ┌────────▼────────┐
                                │ Gemini embeddings │
                                └──────────────────┘
```

### Top-level repo structure

```
SwiftChat-Prototype/
├── README.md                       ← this file
├── MIGRATION.md                    ← notes from the no-login → prototype merge
├── index.html                      ← Vite entry HTML
├── package.json                    ← frontend deps + dev / build / preview scripts
├── vite.config.js                  ← Vite + @vitejs/plugin-react
├── tailwind.config.js              ← design tokens & keyframes
├── postcss.config.js               ← tailwind + autoprefixer
├── public/
│   └── favicon.png
├── dist/                           ← production build output (gitignored)
└── server/
    └── swiftchat-ai/               ← Node/Express backend (LLM + RAG)
```

### `src/` layout

```
src/
├── main.jsx                        Vite entry; mounts <App/>; runs aiBootstrap.
├── App.jsx                         Route table (auth screens + chat IDs).
├── index.css                       Tailwind layers + custom keyframes.
│
├── context/AppContext.jsx          Global state (auth, role, canvas, chats,
│                                   notifications, scheduler bridge, signOut).
│
├── pages/                          Each top-level screen
│   ├── SplashPage.jsx              Cold-start splash → routes to /login.
│   ├── LoginPage.jsx               Carousel + State-ID / Phone CTAs.
│   ├── SelectStatePage.jsx         State picker before SSO.
│   ├── SSORedirectPage.jsx         Mock state portal.
│   ├── SSOVerifyingPage.jsx        Animated progress bar.
│   ├── SSOSuccessPage.jsx          Successful SSO → setRole() → home.
│   ├── SSOFailPage.jsx             Failure path with retry.
│   ├── PhoneEntryPage.jsx          10-digit input.
│   ├── PhoneOTPPage.jsx            4-digit OTP.
│   ├── SuperHomePage.jsx (3273 lines) The main authenticated home + chat.
│   ├── HomePage.jsx                Alternate (not currently routed; see MIGRATION.md).
│   ├── ChatPage.jsx                Per-bot chat (uses useChat hook).
│   ├── NamoLaxmiPage.jsx           Namo Lakshmi sub-app.
│   ├── ProfilePage.jsx             Profile + sign-out.
│   └── UpdatesPage.jsx             Updates / news tab.
│
├── components/                     Shared UI pieces
│   ├── BottomNav, TopBar, StatusBar, Logo, Toast, ChatBubble, ChatInput,
│   │   QuickReplies, TypingIndicator, AttendanceGrid, CallOverlay,
│   │   OTPInput, ShieldIcon …
│   ├── askAi/                      Ask AI prompt panel + result/insight cards.
│   ├── digivritti/                 DocumentUpload + visual tokens.
│   └── notifications/              NotificationBell, NotificationCanvas,
│                                   List, Item, Filters, Toast, Badge,
│                                   CreateBroadcastForm, CreateReminderForm.
│
├── canvas/                         Right-side workspace shell
│   ├── CanvasPanel.jsx             Dispatcher (ctx.type → module).
│   ├── ActivityLog, DataForm, ExportOptions, RichTextEditor (legacy tabs).
│   └── modules/                    All workspace canvases (15 of them).
│
├── nlp/                            NLP pipeline (see Business Logic below)
│   ├── globalIntentRouter.js       routeIntent / routeIntentSync.
│   ├── localPatterns.js            Layer-1 regex table + entity extractor.
│   ├── moduleRegistry.js           Module aliases + allowed roles.
│   ├── actionRegistry.js           ACTIONS map + run().
│   ├── permissionGuard.js          canRoleUseAction / canRoleUseModule.
│   ├── dataQueryPatterns.js        Layer-1.5 analytics regex table.
│   ├── dataQueryRouter.js          Layer-1.5 entry.
│   ├── dataAnswerBuilder.js        Builds analytics card payloads.
│   ├── aiAnalyticsCard.js          HTML for analytics responses.
│   ├── aiAnswerCard.js             HTML for RAG answer + citations.
│   ├── aiClient.js                 interpret() abstraction.
│   ├── aiBootstrap.js              Side-effect: register Groq if env set.
│   ├── groqInterpreter.js          Frontend wrapper for backend `/message`.
│   ├── useSwiftChatNlp.js          React hook gluing router → addBot.
│   └── __tests__/                  qaRunner + qaCases.json + diagnostic mjs.
│
├── notifications/                  Reminder + broadcast subsystem
│   ├── notificationStore.js        localStorage CRUD + change events.
│   ├── notificationScheduler.js    Precise wake-up + 15s safety poll.
│   ├── notificationTargeting.js    User descriptor + match predicate.
│   ├── notificationTypes.js        type / priority / category enums.
│   ├── notificationSeed.js         First-boot demo notifications.
│   ├── notificationSound.js        Audio chime (gesture-unlocked).
│   ├── notificationActions.js      action.type → openCanvas / runChatTrigger.
│   └── systemNotifications.js      Templates for system-level pings.
│
├── data/
│   ├── mockData.js                 SCHOOL_INFO, USER_PROFILES, STUDENTS,
│   │                                PERF_DATA, ATTENDANCE_*, AT_RISK_*,
│   │                                DEMO_SSO_USERS, DEMO_PHONE_USER, …
│   ├── analytics/                  attendance / class / xamta / digivritti / payment.
│   ├── askAi/                      mockData / prompts / responses.
│   └── digivritti/                 teacher / approver / district / state flows,
│                                    aiQueries (759 lines), applications,
│                                    systemStates, ROLE_TO_DIGIVRITTI map.
│
├── features/askAi/                 Engine, matcher, action resolver, card HTML.
│
├── hooks/                          useChat (per-bot chat), useNavigation, useToast.
│
├── roles/roleConfig.js             ROLE_LABELS / SCOPES / BOTS / SUGGESTIONS /
│                                    CANVASES / NOTIFICATION_PERMISSIONS / ROLE_PERMISSIONS.
│
├── utils/
│   ├── chatData.js                 Per-role bot list + chat configs + replies.
│   ├── chatHistory.js              Per-user chat persistence in localStorage.
│   ├── helpers.js                  now() etc.
│   ├── namoFlow.js                 Namo Lakshmi sub-flow logic.
│   ├── digivrittiBackend.js        Mock backend for DigiVritti.
│   ├── digivrittiChat.js           Chat-side dispatcher.
│   ├── dashboardCharts.js          Sparkline / heatmap / gauge primitives.
│   └── i18n.js                     en / hi / gu strings.
│
└── assets/                         Icons (Shield3D, Ellipse, PeopleIllustration)
                                    + SVG/PNG images.
```

### `server/swiftchat-ai/` layout

```
server/swiftchat-ai/
├── README.md                       ← endpoint docs (preserved as-is)
├── package.json                    Express + Groq + Supabase deps
├── .env.example                    Env template (committed)
├── .env                            Local secrets (gitignored)
├── index.js                        Express server: /message /interpret /rag/* /healthz
├── interpret.js                    Groq classifier + JSON parser + role-validator
├── catalog.js                      Mirror of frontend MODULES + ACTIONS for prompt grounding
├── data/
│   └── knowledge/                  10 markdown files (attendance, xamta,
│                                    namo_lakshmi, namo_saraswati, pfms,
│                                    digivritti, role_action_matrix, faq …)
└── rag/
    ├── schema.sql                  Postgres + pgvector table & match_… RPC
    ├── ingest.js                   Read knowledge → chunk → embed → upsert
    ├── chunker.js                  Markdown chunker (~450-token sections)
    ├── embeddings.js               Gemini embed / batchEmbed (768-dim)
    └── retriever.js                Embed query → ANN match → Groq synthesise
```

---

## Business Logic / Application Logic

### Auth state machine (frontend)

| Screen | Trigger | Next |
|---|---|---|
| `splash` | first paint or `signOut` | `login` |
| `login` | "Login with State ID" | `select_state` |
| `login` | "Continue with Phone Number" | `phone_entry` |
| `select_state` | state chosen | `sso_redirect` |
| `sso_redirect` | mock SSO submit | `sso_verifying` |
| `sso_verifying` | progress hits 100% | `sso_ok` (or `sso_fail` on error) |
| `sso_ok` | auto after delay | `home` (sets role from `DEMO_SSO_USERS`) |
| `phone_entry` | 10-digit submitted | `phone_otp` |
| `phone_otp` | OTP `1234` (or non-`0000`) | `home` (role: `parent`) |
| any post-login | `signOut()` | `splash` |

`AppContext` persists `{ screen, stack, role, userProfile, lang, ssoState }`
under `swiftchat.session.v1`. Sessions without a `role` are rejected to
defend against half-state corruption.

### NLP pipeline (per message)

```
text + role → routeIntentSync                   (local regex, sync)
            ↓ if pendingAction:
            ↓   stage='confirm' →  yes → execute action.run() | no → denied
            ↓   stage='clarify' →  resolve missing entity → finalize
            ↓ else:
            ↓   matchLocalIntent(text) hit?  → permissionGuard → finalizeAction
            ↓   no hit → findModuleByAlias?  → kind='module-fallback'
            ↓   none → kind='unknown'
            ↓
isQuestionShape(text) ─yes─► routeDataQuery → analytics card if hit
            ↓ else / unknown
            ↓
remote enabled (VITE_SWIFTCHAT_AI_API_URL)?
   yes → POST /message
            ├ responseType='action'  → actionId → permissionGuard → run()
            └ responseType='answer'  → render aiAnswerCard + citation chips
   no  → smart-suggestion fallback chips
```

`finalizeAction(action, entities, role)` enforces the order:
1. **Missing required entity** → emit `kind: 'clarify'` with `fallbackClarification`.
2. **`requiresConfirmation`** → emit `kind: 'confirm'`, chips
   `["✅ Yes, proceed", "❌ Cancel"]`.
3. **Ready** → call `action.run({ entities, role })`, return
   `{ kind: 'execute', directive }` where directive is one of
   `{ trigger }`, `{ canvas }`, or `{ reply }`.

### Action directives

`actionRegistry.run()` deliberately re-uses existing chat triggers
(`Task: attendance`, `Task: class_dashboard`, `XAMTA scan`, `dv:open-...`)
so the canvas/chat flows remain the single source of truth — NLP only
**translates**.

### Notification scheduling

- One-shot `setTimeout` armed at the soonest `scheduledAt` (clamped to
  ≤ 24 h to defeat the platform's 32-bit-int timer cap).
- 15 s safety interval re-scans the store on clock skew or storage edit.
- Mutators emit `swiftchat:notifications:changed` → scheduler re-arms.
- Reminders (`type === 'reminder'`) ring continuously until acknowledged
  by clicking the toast or the bell.
- Audio chime is gesture-unlocked (mobile autoplay policy).

### Data-query layer (Layer 1.5)

- Runs **before** action routing when `isQuestionShape(text)` — so
  "how many students in Class 6?" yields a count card instead of
  opening the class dashboard.
- Falls back to running **after** action routing when local was `unknown`
  but the message is a non-question (catches typed analytics commands).

### RAG (backend, Phase 3)

- `/rag/query` receives `{ question, role, language, module? }`.
- Embed via Gemini → `match_knowledge_chunks` RPC (cosine similarity ≥
  `MIN_SIMILARITY = 0.55`) → top-5 hits.
- Below floor → "I don't have enough information yet" (no hallucination).
- Above floor → Groq synthesises a 1–4-sentence answer constrained to
  context + role-aware language match → returns
  `{ assistantText, citations[], language, contextHits, averageSimilarity }`.

### `/message` orchestrator decision tree

1. Question-shaped (`?`, `kya/kyun/kaise/explain/...`)? → RAG first.
2. Otherwise → `/interpret` first; if `confidence ≥ 0.6` → action.
3. Else → RAG.
4. Below RAG floor → fall back to `/interpret` once more (gives the
   frontend chips).
5. Else → `{ intent: null, assistantText: "I'm not sure I can help…" }`.

---

## API Documentation

### Backend (`http://localhost:8787` by default)

#### `POST /message` — orchestrator (preferred)
```jsonc
// request
{ "text": "Namo Saraswati eligibility kya hai?", "role": "teacher", "language": "auto" }

// response — action shape
{
  "responseType": "action",
  "intent": "OPEN_REJECTED_APPLICATIONS",
  "module": "digivritti",
  "entities": { "question": "..." },
  "confidence": 0.92,
  "assistantText": "Aapke rejected applications dikhata hoon.",
  "requiresConfirmation": false,
  "chips": [],
  "language": "hi-en"
}

// response — answer shape (RAG)
{
  "responseType": "answer",
  "assistantText": "Namo Saraswati requires Class 10 ≥ 50% with Science stream…",
  "language": "hi-en",
  "citations": [
    { "source": "namo_saraswati_policy.md", "section": "Eligibility" },
    { "source": "digivritti_overview.md",   "section": "Application lifecycle" }
  ],
  "contextHits": 4,
  "averageSimilarity": 0.71
}
```

#### `POST /interpret` — action intent only
Strict-JSON Groq classifier grounded in
[`server/swiftchat-ai/catalog.js`](server/swiftchat-ai/catalog.js).
Returns the action shape from above.

#### `POST /rag/query` — RAG only
```jsonc
// request
{ "question": "PFMS retry process explain karo", "role": "pfms", "language": "auto", "module": null }
// response: same `answer` shape as /message
```

#### `GET /rag/knowledge/:source`
Returns the raw markdown source for a citation chip, used by `KnowledgeCanvas`.
Strict whitelist: `^[A-Za-z0-9_-]+\.md$`, with explicit path-traversal guard.

#### `GET /healthz`
```json
{ "ok": true, "model": "llama-3.3-70b-versatile" }
```

#### Auth / errors
- No auth on these endpoints — they are intended for the frontend on the
  same origin or a CORS-allow-listed origin (see `CORS_ORIGIN`).
- `400` for missing/invalid `text` / `role` / `question`.
- `502` when the LLM returns no parseable JSON.
- `500` on unexpected Groq / Supabase / Gemini failures.

### Frontend "API"
There is **no REST API on the frontend**. All inter-component
communication goes through `AppContext` and a small set of `window`
events (`swiftchat:notifications:changed`, `swiftchat:notifications:due`,
`swiftchat:chat:trigger`).

---

## Data Model / Database

### Frontend (in-memory + localStorage)

Mock-data shapes ([src/data/mockData.js](src/data/mockData.js)):

| Export | Shape (abridged) |
|---|---|
| `SCHOOL_INFO` | `{ name, udise, block, district, state, type, medium, principal, totalStudents, totalTeachers, classes }` |
| `DEMO_SSO_USERS` | `[{ stateId, password, name, role, badge, org, school, district, initials, color, emoji, … }]` |
| `DEMO_PHONE_USER` | `{ phone, otp, name, role: 'parent', childName, childGrade, … }` |
| `USER_PROFILES[role]` | `{ name, stateId, role, employeeId, dpdpaTier, sessionTTL, lastLogin, tokenOrigin, … }` |
| `STUDENTS[grade]` | `[{ id, name, gender, dob, guardian, phone, attendance%, risk, math, sci, guj, level, namoLaxmi }]` |
| `PERF_DATA[grade]` | `{ math, sci, guj, students[] }` |
| `AT_RISK_STUDENTS` | `[{ name, grade, attendance, score, risk, reason, days }]` |

Persistence keys (all `localStorage`):

| Key | Owner | Shape |
|---|---|---|
| `swiftchat.session.v1` | AppContext | `{ screen, stack, role, userProfile, lang, ssoState }` |
| `swiftchat.chats.v1` | chatHistory | `{ [chatId]: ChatSession }` |
| `swiftchat.activeChat.v1` | chatHistory | `{ [userId]: chatId }` |
| `swiftchat.notifications.v1` | notificationStore | `Notification[]` |
| `swiftchat.notificationPrefs.v1` | notificationStore | `{}` (reserved) |
| `swiftchat.notifications.seeded.v1` | notificationSeed | `boolean` flag |

`Notification` shape (see [notificationTypes.js](src/notifications/notificationTypes.js)):

```ts
{
  id, type: 'broadcast' | 'reminder' | 'system',
  title, message, category, priority: 'low' | 'normal' | 'high' | 'urgent',
  module?, createdBy, createdByRole,
  targetRoles: string[], targetUserIds?: string[],
  scheduledAt?, deliveredAt?, expiresAt?,
  action?: { label, type, payload? },
  readBy: string[], dismissedBy: string[],
  createdAt, updatedAt,
}
```

### Backend (Supabase Postgres)

Schema in [server/swiftchat-ai/rag/schema.sql](server/swiftchat-ai/rag/schema.sql):

```sql
create extension if not exists vector;

create table knowledge_chunks (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  source      text not null,            -- e.g. "namo_saraswati_policy.md"
  section     text,                     -- e.g. "Eligibility"
  module      text,                     -- attendance | xamta | … | null
  role_scope  text[] default '{}',      -- empty = all roles
  embedding   vector(768),              -- gemini-embedding-001 truncated to 768
  created_at  timestamptz default now()
);

-- indexes
ivfflat (embedding vector_cosine_ops, lists = 100)
btree   (source), btree (module)

-- RPC: match_knowledge_chunks(query_embedding, match_count, role_filter, module_filter)
-- returns top-N rows with `1 - (embedding <=> query_embedding) as similarity`.
```

The knowledge corpus lives as 10 markdown files under
[`server/swiftchat-ai/data/knowledge/`](server/swiftchat-ai/data/knowledge/) —
edit a file → `npm run ingest` → answers refresh.

---

## Environment Variables

| Variable | Where | Purpose | Required | Default |
|---|---|---|---|---|
| `VITE_SWIFTCHAT_AI_API_URL` | `.env` at repo root (frontend) | Base URL of the SwiftChat AI backend. If unset, the app stays fully offline. | Optional | _none_ |
| `GROQ_API_KEY` | `server/swiftchat-ai/.env` | Groq API key for `/interpret` + RAG synthesis. | **Required** for the backend | _none_ |
| `GROQ_MODEL` | `server/swiftchat-ai/.env` | Groq chat model. | Optional | `llama-3.3-70b-versatile` |
| `PORT` | `server/swiftchat-ai/.env` | Express port. | Optional | `8787` |
| `CORS_ORIGIN` | `server/swiftchat-ai/.env` | Comma-separated origins. `*` allows all. | Optional | `*` |
| `SUPABASE_URL` | `server/swiftchat-ai/.env` | Supabase project URL. | **Required** for RAG | _none_ |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/swiftchat-ai/.env` | **Service-role** secret (bypasses RLS). Anon/publishable keys will fail. | **Required** for RAG | _none_ |
| `GEMINI_API_KEY` | `server/swiftchat-ai/.env` | Google Gemini key for embeddings. | **Required** for RAG | _none_ |
| `GEMINI_EMBEDDING_MODEL` | `server/swiftchat-ai/.env` | Embedding model id. | Optional | `gemini-embedding-001` |
| `GEMINI_EMBEDDING_DIM` | `server/swiftchat-ai/.env` | Output dim — must match `vector(N)` column. | Optional | `768` |

**Never commit secrets.** `.env` is gitignored; `.env.example` is the
template.

---

## Installation

### Prerequisites
- **Node.js ≥ 18** (ESM `import`/`export` and global `fetch`).
- **npm** (or pnpm/yarn — only `npm` lockfiles are committed).
- (Optional) **Supabase project** + **Groq API key** + **Gemini API key**
  for the LLM/RAG stack. The frontend fully degrades to offline NLP when
  these are not configured.

### Frontend setup
```bash
git clone <repo-url> SwiftChat-Prototype
cd SwiftChat-Prototype
npm install
npm run dev          # http://localhost:5173
```

### Backend setup (optional but recommended)
```bash
cd server/swiftchat-ai
cp .env.example .env
# Edit .env — add GROQ_API_KEY (required for /interpret).
# For RAG, also add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.
npm install
```

### One-time RAG bootstrap
1. Open the Supabase SQL editor for your project.
2. Paste the contents of [`server/swiftchat-ai/rag/schema.sql`](server/swiftchat-ai/rag/schema.sql)
   and run it. This:
   - enables `pgvector`,
   - creates `knowledge_chunks` (768-dim embeddings),
   - creates the `match_knowledge_chunks(...)` retrieval RPC.
3. Ingest the markdown corpus:
   ```bash
   cd server/swiftchat-ai
   npm run ingest                # full re-ingest (truncates first)
   # or:
   node rag/ingest.js --append   # append without truncating
   ```

### Wire frontend to backend
Create `.env` at the repo root:
```
VITE_SWIFTCHAT_AI_API_URL=http://localhost:8787
```
Restart `npm run dev`. `aiBootstrap.js` registers the remote interpreter
on boot; if the variable is absent, the frontend silently stays offline.

---

## Running the Project

### Frontend (root)
| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (HMR) on `http://localhost:5173`. |
| `npm run build` | Production bundle into `dist/`. |
| `npm run preview` | Serve `dist/` locally for a smoke test. |

### Backend (`server/swiftchat-ai/`)
| Command | Purpose |
|---|---|
| `npm run dev` / `npm start` | Run Express on `$PORT` (default 8787). |
| `npm run ingest` | Truncate + re-ingest the knowledge base. |
| `node rag/ingest.js --append` | Append-only ingest. |

### Common dev recipe
```bash
# Terminal 1 — backend
cd server/swiftchat-ai && npm run dev

# Terminal 2 — frontend
echo 'VITE_SWIFTCHAT_AI_API_URL=http://localhost:8787' > .env
npm run dev
```

---

## Testing

### Frontend NLP test runner (offline, no backend needed)
```bash
node src/nlp/__tests__/qaRunner.test.mjs
```
Reads cases from [`qaCases.json`](src/nlp/__tests__/qaCases.json) and
exercises `routeIntentSync`. Cases marked `needsRemote: true` are skipped
unless `VITE_SWIFTCHAT_AI_API_URL` is set.

### End-to-end (frontend + backend + Supabase)
```bash
VITE_SWIFTCHAT_AI_API_URL=http://localhost:8787 \
  node src/nlp/__tests__/qaRunner.test.mjs
```

### Manual smoke tests for RAG
With the backend running and the corpus ingested, type into the chat:
- "Namo Saraswati eligibility kya hai?" → answer + `namo_saraswati_policy.md` chip.
- "PFMS retry process explain karo" → `pfms_payment_process.md`.
- "Attendance kaise mark karu?" → `attendance_workflows.md`.
- "Mother Aadhaar kyun required hai?" → `faq.md` + `namo_lakshmi_policy.md`.

### Direct `curl`
```bash
# action intent
curl -s http://localhost:8787/interpret \
  -H 'content-type: application/json' \
  -d '{"text":"Mere rejected students dikhao","role":"teacher"}' | jq

# RAG only
curl -s http://localhost:8787/rag/query \
  -H 'content-type: application/json' \
  -d '{"question":"Namo Saraswati eligibility kya hai?","role":"teacher","language":"auto"}' | jq

# orchestrator (recommended)
curl -s http://localhost:8787/message \
  -H 'content-type: application/json' \
  -d '{"text":"PFMS retry process explain karo","role":"pfms","language":"auto"}' | jq

# health
curl -s http://localhost:8787/healthz | jq
```

### Diagnostic helpers
- [`src/nlp/__tests__/diagnose.mjs`](src/nlp/__tests__/diagnose.mjs) — local NLP probe.
- [`src/nlp/__tests__/probeGemini.mjs`](src/nlp/__tests__/probeGemini.mjs) — Gemini embedding sanity check.

There is **no** unit-test framework configured (no `jest`, `vitest`, etc.)
— Inferred from the absence of test scripts in either `package.json`.

---

## Deployment

The repo does not include CI/CD configuration (Inferred — no
`.github/workflows`, `.gitlab-ci.yml`, `azure-pipelines.yml`, or
`Dockerfile` was found). Suggested deployment shape:

### Frontend
- **Static hosting** of `dist/` (Netlify / Vercel / GitHub Pages /
  Cloudflare Pages / S3+CloudFront). Build command: `npm run build`,
  publish dir: `dist/`.
- Set `VITE_SWIFTCHAT_AI_API_URL` at build time so the bundle bakes the
  backend URL.
- The `.gitignore` lists `.vercel/`, suggesting Vercel was used for at
  least one deploy.

### Backend
- Any Node ≥ 18 host (Render / Railway / Fly.io / a VM / a container).
- Required env: `GROQ_API_KEY`, plus `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` for RAG.
- Set `CORS_ORIGIN` to the frontend's origin in production.
- Run `npm run ingest` (one-time) against the production Supabase project.
- Healthcheck endpoint: `GET /healthz`.

### Supabase
- Run [`schema.sql`](server/swiftchat-ai/rag/schema.sql) in the SQL
  editor. Re-run `analyze knowledge_chunks;` after large ingests so the
  ivfflat index keeps balanced lists.

---

## Security / Permissions

### Authentication (frontend)
- **Mock-only.** State-ID SSO and phone OTP are simulated in
  [`mockData.js`](src/data/mockData.js). The accepted demo OTP is `1234`,
  but any 4-digit code other than `0000` is also accepted. **Do not ship
  this prototype to production without replacing the auth pages.**
- Sessions live in `localStorage` (`swiftchat.session.v1`). They include
  the `role` + `userProfile` and are not signed.

### Authorisation
- Two-layer role gating:
  1. Module level — `MODULE_BY_ID[mod].allowedRoles.includes(role)`
     ([`moduleRegistry.js`](src/nlp/moduleRegistry.js)).
  2. Action level — `ACTIONS[id].allowedRoles.includes(role)`
     ([`actionRegistry.js`](src/nlp/actionRegistry.js)).
- The remote LLM is forced to choose only from a role-filtered action
  catalog, **and** the frontend re-validates via `permissionGuard` before
  executing — defence-in-depth.
- Notification permissions are role-driven (`canCreateBroadcast`,
  `canCreateReminder`, `canViewNotifications` — see
  [`roleConfig.js`](src/roles/roleConfig.js)).

### Backend hardening
- `express.json({ limit: '32kb' })` to bound payload size.
- `/rag/knowledge/:source` is whitelisted to `^[A-Za-z0-9_-]+\.md$` and
  performs an explicit path-traversal check (`fullPath.startsWith(KNOWLEDGE_DIR + sep)`).
- The Supabase client uses `auth: { persistSession: false }` and the
  **service-role** key — strictly server-side; never ship this key to a
  browser bundle.
- Input is type-checked at every endpoint (`typeof text === 'string'`).
- The LLM **never** executes anything; it only proposes an `intent` (validated)
  or an `assistantText` (rendered).

### Rate limiting / abuse
- Not implemented. (Inferred — no rate-limit middleware found.)

### DPDPA / data tier metadata
- `USER_PROFILES[role].dpdpaTier` and `sessionTTL` fields are stubbed for
  UI display only — they are not enforced.

---

## Error Handling & Logging

### Frontend
- Storage helpers (`safeLocalStorage`, `readJson`/`writeJson`) silently
  degrade on quota/disabled storage.
- Remote interpreter errors collapse to `null` so the pipeline falls back
  to local NLP (see [`groqInterpreter.callRemote`](src/nlp/groqInterpreter.js)).
- Persisted sessions without a recognised role are dropped on boot.
- Notifications scheduler clamps `setTimeout` to 24 h and re-arms on the
  15 s safety tick — clock skew can't strand a reminder.
- The audio chime is wrapped in a try/catch so a missing AudioContext
  never crashes the app.

### Backend
- Console-only logging on the form `[/route] error.message`.
- All endpoints `try/catch` and return `5xx` JSON `{ error }`.
- `safeJson()` strips markdown fences and slices to the first `{...}`
  block so a chatty model can't break parsing.
- LLM responses are **validated** in `interpret.validate()`:
  unknown intents are dropped to `null` with `confidence ≤ 0.3`; intents
  the role can't run are denied politely.

### Observability
- No structured logging, metrics, or tracing. (Inferred — no
  pino/winston/OpenTelemetry deps.)
- No Sentry / error reporter wired up.

---

## Known Constraints

- **Prototype-grade auth.** No real SSO, no signed sessions, demo
  credentials baked into [`mockData.js`](src/data/mockData.js).
- **Mock data only.** All "students", "applications", and "payments" are
  generated deterministically in `mockData.js` /
  `data/digivritti/applications.js`. No persistence beyond `localStorage`.
- **No service worker / PWA shell.** Reload behaves like a normal SPA —
  state survives only because of `localStorage`.
- **Single-bundle build.** `dist/assets/index-*.js` is ~903 kB
  (gzip ~237 kB). Vite emits a "chunk > 500 kB" warning. Code-splitting
  via dynamic `import()` would be a clear next step (see _Future
  Improvements_).
- **No automated tests beyond the QA runner.** The runner is a single
  `node` script, not a typical test framework.
- **CSS scrollbar hidden globally** (`::-webkit-scrollbar { display: none; }`
  in `index.html`). Intentional for the chat UI but unconventional.
- **`pages/HomePage.jsx` is in the tree but unused.** It is the
  no-login-build's home page kept for reference. Routing still uses
  `SuperHomePage`. See [MIGRATION.md](MIGRATION.md).
- **`'Not a State'` audience option** still exists in
  [`notificationTypes.js`](src/notifications/notificationTypes.js) despite
  the recent commit titled "remove 'Not a State'". The post-merge file
  came from the no-login source — verify whether removal should be
  re-applied.
- **`server/swiftchat-ai/rag/chunker.js`** wasn't read in detail for
  this README beyond its docstring; section-level chunking + tag prefix
  are inferred from `retriever.stripTag()`.

---

## Future Improvements

- **Real authentication.** Replace `DEMO_SSO_USERS` with an actual OIDC
  flow against state IAM; sign session cookies; switch persistence away
  from raw `localStorage`.
- **Code-splitting.** `React.lazy()` per page + per canvas module to
  shrink the main bundle below 500 kB.
- **Test framework.** Adopt Vitest (already aligned with Vite) for both
  unit tests on the NLP pipeline and component tests on the canvases.
- **Type safety.** The codebase is plain JS / JSX — TypeScript would
  catch many of the entity-shape drifts between
  `actionRegistry` (frontend) and `catalog.js` (backend).
- **Backend rate limiting + auth.** A simple shared-secret header (or
  Supabase JWT verify) would prevent open public access to `/interpret`
  and `/rag/query`.
- **Structured logging + tracing** (pino + OpenTelemetry).
- **CI/CD.** GitHub Actions for `npm run build` + the QA runner on every
  PR.
- **Reconcile catalog drift.** A small script that diffs
  `src/nlp/actionRegistry.js` ↔ `server/swiftchat-ai/catalog.js` and
  fails CI when they fall out of sync.
- **Service worker.** Offline shell + IndexedDB-backed chat history would
  remove the dependence on `localStorage` quota and enable a true PWA.
- **Accessibility audit.** No ARIA / focus-trap inspection has been done
  on the canvas/notification panels.

---

## Contribution Guidelines

(There are no `CONTRIBUTING.md` or PR templates in the repo today —
Inferred. The following is a reasonable starting set.)

### Branching
- `main` — release-ready prototype.
- Feature branches: `feat/<short-topic>` off `main`.
- Bugfix: `fix/<short-topic>`.

### Commits
Follow Conventional Commits, mirroring the existing history:
```
feat: add knowledge canvas for citation chips
fix: stop scheduler on sign-out
docs: document RAG ingest flow
```

### Pull requests
- Keep PRs focused — one feature or fix per PR.
- Update `MIGRATION.md` when changing auth / context / canvas wiring in
  ways that affect the no-login parity.
- Verify both `npm run build` (root) **and** `npm run dev` (backend, if
  touched) pass locally.
- Run `node src/nlp/__tests__/qaRunner.test.mjs` if you touched
  anything in `src/nlp/` or `server/swiftchat-ai/`.

### Style
- 2-space indent, single-quote strings, no trailing semicolons in JSX
  attribute text — match what you see around the change.
- No project-wide formatter is configured (Inferred — no `.prettierrc`
  or `.editorconfig`). Reasonable Prettier defaults are fine.
- Keep comments on the `why`, not the `what` — most files already follow
  this rule.

### Adding a new action / module
1. Add the action to [`src/nlp/actionRegistry.js`](src/nlp/actionRegistry.js)
   with `allowedRoles`, `requiredEntities`, `requiresConfirmation`, `run()`.
2. Add it to the owning module in
   [`src/nlp/moduleRegistry.js`](src/nlp/moduleRegistry.js).
3. Mirror the action in
   [`server/swiftchat-ai/catalog.js`](server/swiftchat-ai/catalog.js)
   so the LLM can choose it.
4. Add at least one local pattern in
   [`src/nlp/localPatterns.js`](src/nlp/localPatterns.js) and a QA case
   in [`qaCases.json`](src/nlp/__tests__/qaCases.json).
5. If the action opens a canvas, register a new canvas type in
   [`src/canvas/CanvasPanel.jsx`](src/canvas/CanvasPanel.jsx).

### Adding RAG knowledge
1. Drop a new `.md` file under
   [`server/swiftchat-ai/data/knowledge/`](server/swiftchat-ai/data/knowledge/).
2. Run `npm run ingest` from `server/swiftchat-ai/`.
3. Add at least one QA case so future ingests don't silently regress
   coverage.

---

## Reference: per-role permission matrix (excerpt)

Source of truth: [`src/roles/roleConfig.js`](src/roles/roleConfig.js).

| Role | Mark Att. | All students | Approve scholar. | View district | View state | Create broadcast |
|---|---|---|---|---|---|---|
| teacher | ✅ (own class) | own class | ❌ | ❌ | ❌ | ❌ |
| principal | ❌ | whole school | ✅ | ❌ | ❌ | ❌ |
| deo | ❌ | district | ✅ | ✅ | ❌ | ❌ |
| state_secretary | ❌ | state | ✅ | ✅ | ✅ | ✅ |
| parent | ❌ | own child | ❌ | ❌ | ❌ | ❌ |
| crc | ❌ | cluster | ✅ | ❌ | ❌ | ❌ |
| pfms | ❌ | payments only | ❌ | ✅ (payments) | ✅ (payments) | ❌ |

---

## License

Not declared in the repository (Inferred — no `LICENSE` file). Treat as
**proprietary** until the owner specifies otherwise.
