# SwiftChat AI Backend

Tiny Express server that wraps a Groq LLM call for the SwiftChat NLP layer.

## What it does

- Exposes `POST /interpret { text, role }` → strict JSON intent classification.
- Grounds the LLM in the same action catalog the frontend dispatches against.
- Frontend's local pattern matcher always runs first; the server is hit only when local NLP is unsure.

## Run locally

```bash
cd server/swiftchat-ai
cp .env.example .env       # then add your GROQ_API_KEY
npm install
npm run dev
```

Server listens on `http://localhost:8787` by default.

## Wire the frontend

Add to the project root `.env` (alongside `package.json`):

```
VITE_SWIFTCHAT_AI_API_URL=http://localhost:8787
```

Then `npm run dev` from the project root. The frontend's `aiBootstrap` registers this URL with `registerRemoteInterpreter()` in `src/nlp/aiClient.js`.

If the env var is absent or the server is unreachable, the frontend silently falls back to local-only NLP — nothing breaks.

## Response shape

```json
{
  "intent": "OPEN_REJECTED_APPLICATIONS",
  "module": "digivritti",
  "entities": { "question": "Mere rejected students dikhao" },
  "confidence": 0.92,
  "assistantText": "Aapke rejected applications dikhata hoon.",
  "requiresConfirmation": false,
  "chips": [],
  "language": "hi-en"
}
```

The frontend re-validates `intent` against `actionRegistry` and runs it through `permissionGuard` before executing — the LLM never executes anything itself.
