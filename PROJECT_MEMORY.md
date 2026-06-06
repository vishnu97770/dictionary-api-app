# PROJECT_MEMORY.md — LexiSearch Dictionary App

> Last generated: 2026-06-07. Read this first whenever returning after a gap.

---

## Project Overview

**LexiSearch** is a full-stack English dictionary web application. Users search for words and receive:
- The definition (sourced from the free [DictionaryAPI](https://api.dictionaryapi.dev) and cached in a local DB)
- AI-generated example sentences (via Google Gemini 2.5 Flash)
- Translation of the meaning into 30+ languages (via Gemini AI)
- Read-aloud of translated text (Web Speech API, browser-native, no cost)
- Pronunciation of the English word (audio from DictionaryAPI, falls back to browser TTS)
- Autocomplete suggestions (via [Datamuse API](https://api.datamuse.com))
- Personal Recent Searches, Favorites, and Trending Words — all stored in `localStorage`
- Dark / Light mode toggle

**Auth endpoints exist on the backend** (register + login with JWT) but are **NOT wired up in the frontend UI yet** — this is the single biggest gap between backend and frontend.

**Target users:** General public / students wanting a feature-rich, multilingual dictionary.

**Current stage:** Feature-complete MVP for the dictionary core. Deployed to Render.com. Auth frontend is missing.

---

## Tech Stack

### Frontend
| Concern | Library / Tool |
|---|---|
| Framework | React 19 (JSX) |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3 |
| HTTP client | axios |
| State | React `useState` + `localStorage` (no Redux/Zustand) |
| Entry point | `frontend/src/main.jsx` → `App.jsx` |

### Backend
| Concern | Library / Tool |
|---|---|
| Framework | FastAPI |
| Python version | 3.11 (set in render.yaml) / 3.12 locally |
| ASGI server | Uvicorn |
| ORM | SQLAlchemy 2.x (async) |
| Auth | JWT via `python-jose`, passwords via `passlib[bcrypt]` |
| AI | `google-genai` (Gemini 2.5 Flash) |
| HTTP client | `httpx` (async) |
| Config | `pydantic-settings` + `.env` file |

### Database
| Environment | Database |
|---|---|
| Local dev | SQLite (`backend/app/database/dictionary.db`) — zero setup |
| Production | PostgreSQL on Render (set `DATABASE_URL` env var) |
| ORM | SQLAlchemy async engine, `aiosqlite` (SQLite) / `asyncpg` (PostgreSQL) |

### Infrastructure & Deployment
| Concern | Details |
|---|---|
| Backend hosting | Render.com Web Service (`lexisearch-backend`) |
| Frontend hosting | Render.com Static Site (`lexisearch-frontend`) |
| Config file | `render.yaml` at repo root — fully configured |
| Env vars (backend) | `SECRET_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`, `FRONTEND_URL`, `VERCEL_URL` |
| Env vars (frontend) | `VITE_API_BASE_URL` (injected from backend service URL by Render) |
| Local dev frontend | `http://localhost:5173` (already in CORS allowlist) |

---

## Architecture Summary

```
dictionary-api-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration, startup hook
│   │   ├── core/
│   │   │   ├── config.py        # pydantic-settings: SECRET_KEY, GEMINI_API_KEY, DATABASE_URL
│   │   │   └── security.py      # bcrypt helpers, JWT create_access_token
│   │   ├── database/
│   │   │   └── db.py            # SQLAlchemy engine (SQLite local / PostgreSQL prod), get_db()
│   │   ├── models/
│   │   │   ├── base.py          # Re-exports Base from db.py (single source of truth)
│   │   │   ├── user.py          # User table (id UUID string, username, email, hashed_password)
│   │   │   └── word.py          # Word table (id int, word, phonetic, definition)
│   │   ├── schemas/
│   │   │   └── auth.py          # Pydantic schemas: UserRegister, UserLogin
│   │   ├── services/
│   │   │   ├── auth_service.py  # AuthService.register_user()
│   │   │   ├── word_service.py  # WordService.search_word() — DB cache + DictionaryAPI fallback
│   │   │   └── ai_service.py    # AIService: generate_example(), translate_meaning() — Gemini
│   │   └── api/v1/routers/
│   │       ├── auth.py          # POST /auth/register, POST /auth/login
│   │       ├── words.py         # GET /words/search/{word}
│   │       └── ai.py            # GET /ai/example/{word}, GET /ai/translate/{word}
│   ├── requirements.txt
│   └── .env                     # Local secrets (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Entire frontend app (676 lines, single component)
│   │   ├── App.css              # Scrollbar styles + overflow resets
│   │   ├── main.jsx             # React root entry point
│   │   └── index.css            # Tailwind directives
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── render.yaml                  # Render.com deployment config (both services)
├── .gitignore
└── README.md
```

### Application Flow

1. User types in search box → `fetchSuggestions()` → Datamuse API for autocomplete
2. User presses Enter or clicks search → `searchWord()`:
   - Calls `GET /words/search/{word}` → WordService checks DB cache first, then DictionaryAPI
   - Simultaneously calls `GET /ai/example/{word}` → AIService → Gemini 2.5 Flash
   - Updates `localStorage` for history + trending frequency count
3. Optional: User clicks "Translate Meaning" → language picker panel → `translateMeaning()`:
   - Calls `GET /ai/translate/{word}?meaning=...&language=...` → AIService → Gemini
4. Optional: User clicks "Listen" → `speakTranslation()` → Web Speech API (browser-native, free)
5. Optional: User clicks pronunciation icon → `speakWord()` → DictionaryAPI audio or browser TTS

### Auth Flow (backend only, not integrated in frontend)

- `POST /auth/register` → `AuthService.register_user()` → bcrypt hash → DB insert
- `POST /auth/login` → password verify → `create_access_token()` → returns `{access_token, token_type}`
- **No protected routes exist yet** — JWT token is generated but never validated anywhere

---

## Completed Features

- [x] Word definition search with DB-level caching (avoids redundant external API calls)
- [x] Phonetic display
- [x] AI example sentence generation (Gemini 2.5 Flash, 2 sentences per word)
- [x] Multi-language translation of meaning (30+ languages, Gemini)
- [x] Web Speech API read-aloud for translated text (with voice availability warnings)
- [x] English word pronunciation (DictionaryAPI audio + browser TTS fallback)
- [x] Autocomplete suggestions via Datamuse API
- [x] Copy-to-clipboard for example sentences
- [x] Favorites system (localStorage, per-device)
- [x] Recent Searches history (localStorage, last 5, per-device)
- [x] Trending Words (localStorage, by frequency, top 5)
- [x] Remove individual items + Clear All for each section (Recent, Favorites, Trending)
- [x] Dark / Light mode toggle
- [x] User registration endpoint (`POST /auth/register`)
- [x] User login endpoint (`POST /auth/login`) with JWT
- [x] SQLite local dev / PostgreSQL production auto-switch
- [x] Render.com deployment configuration (`render.yaml`)
- [x] CORS configured for localhost + Vercel + Render frontend

## Features In Progress / Missing

- [ ] **Frontend auth UI** — Login/Register pages/modals, storing token in `localStorage`/cookie, protected state
- [ ] **Server-side favorites/history** — Currently all per-device localStorage; no cross-device sync
- [ ] **JWT-protected routes** — No `get_current_user` dependency defined; no route is actually protected
- [ ] **Rate limiting** — `slowapi` is installed as a dep but not wired up; AI endpoints are unprotected
- [ ] **Multiple definitions** — Only `meanings[0].definitions[0]` is stored; full data discarded
- [ ] **Word of the Day** — Not implemented
- [ ] **Mobile-responsive layout** — Partially responsive; no explicit mobile breakpoints tested
- [ ] **Synonyms / Antonyms** — Available in DictionaryAPI response but not extracted or displayed
- [ ] **Page title** — `index.html` still has `<title>frontend</title>` instead of "LexiSearch"
- [ ] **Input sanitization** — No backend validation of the `word` path param (e.g. slashes, long strings)

---

## Database Structure

### `users` table
| Column | Type | Notes |
|---|---|---|
| id | String(36) | UUID stored as string (SQLite + PostgreSQL compat) |
| username | String | UNIQUE, NOT NULL |
| email | String | UNIQUE, NOT NULL |
| hashed_password | String | bcrypt |
| is_active | Boolean | default True |
| created_at | DateTime | server default NOW() |

### `words` table
| Column | Type | Notes |
|---|---|---|
| id | Integer | PK, auto-increment |
| word | String | UNIQUE, indexed |
| phonetic | String | nullable |
| definition | String | first definition only |

**Note:** Tables are auto-created on startup via `Base.metadata.create_all`. No Alembic migrations are in use despite Alembic being installed.

---

## API Overview

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check — returns running status |
| POST | `/auth/register` | Register user: `{username, email, password}` |
| POST | `/auth/login` | Login: `{email, password}` → `{access_token, token_type}` |
| GET | `/words/search/{word}` | Get definition (DB cache or DictionaryAPI) |
| GET | `/ai/example/{word}` | Gemini-generated example sentences |
| GET | `/ai/translate/{word}?meaning=...&language=...` | Translate meaning to target language |

Swagger UI available at `/docs` when running locally.

---

## Deployment Information

**Config file:** `render.yaml` (repo root)

```yaml
Backend service: lexisearch-backend (Python web service)
  rootDir: backend
  buildCommand: pip install -r requirements.txt
  startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
  Required env vars: DATABASE_URL, SECRET_KEY, GEMINI_API_KEY (set in Render dashboard)

Frontend service: lexisearch-frontend (Static site)
  rootDir: frontend
  buildCommand: npm install && npm run build
  staticPublishPath: ./dist
  VITE_API_BASE_URL: auto-injected from backend service host
```

**Local dev:**
```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
# Runs on http://127.0.0.1:8000

# Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## Last Development Session Summary

**Date of last commits:** 2026-04-23 (multiple commits in one day)

**What was built last session:**
1. Multi-language translation feature — Gemini translates word definitions into 30+ languages
2. Read-aloud (TTS) for translated meaning using Web Speech API with BCP-47 language codes
3. Voice availability warnings when device lacks the target language voice
4. Individual remove (×) buttons and "Clear All" for Recent Searches, Favorites, and Trending
5. Fixed Render internal vs external DB URL SSL detection logic
6. Fixed CORS for Vercel preview domains

**What was worked on before that (2026-04-21 to 2026-04-22):**
- Full deployment setup to Render.com
- SQLite/PostgreSQL auto-switch logic
- UUID compatibility fix (string-typed UUID for SQLite compat)
- Added the Gemini AI example sentence feature
- Complete frontend build (dark mode, search, suggestions, favorites, history, trending)

**Last commit:** `chore: ignore local SQLite db file` — minor gitignore fix

---

## Known Issues & Technical Risks

### High Priority
1. **No duplicate email/username check on registration** (`auth_service.py:14`) — will throw a raw DB `IntegrityError` (500) instead of a clean 409. Needs a `SELECT` before `INSERT`.
2. **`SECRET_KEY` fallback is hardcoded** (`security.py:8`): `os.getenv("SECRET_KEY", "supersecretkey")` — if env var is missing in prod, JWTs are signed with a known key. Should raise an error instead.
3. **No JWT-protected routes** — any API user can call `/words/search` or `/ai/*` without authentication.
4. **No rate limiting** on AI endpoints — Gemini API calls are unprotected; a bad actor can exhaust the Gemini quota.

### Medium Priority
5. **`overflow: hidden` on `body` in `App.css`** — will clip content on smaller screens or short viewports.
6. **`datetime.utcnow()` is deprecated in Python 3.12+** (`security.py:24`) — should use `datetime.now(timezone.utc)`.
7. **`pwd_context` is defined in two places** — both `security.py` and `auth_service.py` create their own `CryptContext`. The login route (`auth.py:29`) uses `security.py`'s instance; the register service uses `auth_service.py`'s. Works, but is confusing duplication.
8. **CORS wildcard `"https://*.vercel.app"`** — FastAPI's `CORSMiddleware` does NOT support glob wildcards in origin strings. This entry is silently ineffective; only exact origins match.
9. **`word.py` imports `declarative_base` from `sqlalchemy.ext.declarative`** (deprecated path), then immediately discards it and uses `app.models.base.Base`. The unused import is harmless but misleading.

### Low Priority
10. **App.jsx is a 676-line monolith** — no component splitting. Maintainability will degrade as features are added.
11. **`<title>frontend</title>`** in `index.html` — should be "LexiSearch".
12. **Only first definition stored** — `data["meanings"][0]["definitions"][0]["definition"]` discards all other definitions.
13. **README is outdated** — doesn't mention translation, TTS, or Render deployment.
14. **No Alembic migrations** — schema changes require manual DB re-creation or raw SQL.
15. **No tests** — zero unit or integration tests in the codebase.

---

## Project Health Report

| Category | Score (/10) | Notes |
|---|---|---|
| Architecture | 7/10 | Clean router/service/model separation on backend; frontend is a monolith |
| Code Quality | 6/10 | Readable and functional; some duplication (pwd_context), deprecated calls |
| Security | 5/10 | JWT exists but no protected routes, no rate limiting, insecure SECRET_KEY fallback |
| Scalability | 6/10 | DB caching is smart; no rate limiting is a cost/abuse risk; SQLite→PG switch is clean |
| Maintainability | 6/10 | Backend is well-structured; App.jsx needs componentization |
| Documentation | 5/10 | README is stale; no API schema docs beyond Swagger; no inline comments |

---

## Next Recommended Tasks

Ordered by impact:

### Immediate (bugs / security)
1. **Fix duplicate email check on registration** — add a `SELECT` before `INSERT` in `auth_service.py`, return HTTP 409 if exists
2. **Fix `SECRET_KEY` fallback** — raise a startup error if `SECRET_KEY` is not set in env
3. **Fix CORS for Vercel** — replace `"https://*.vercel.app"` with an explicit `VERCEL_URL` env var entry (already partially done via `vercel_url` variable, just remove the broken wildcard)

### High value (missing features)
4. **Frontend auth UI** — Add Login/Register modal or page; store JWT token; show logged-in state
5. **`get_current_user` dependency** — Add a FastAPI dependency that decodes the Bearer token; add to at least the `/words` and `/ai` routes
6. **Rate limiting** — Wire up `slowapi` (already installed) on `/ai/*` routes (e.g. 10 req/min per IP)

### Polish
7. **Fix `<title>`** in `index.html` — change from "frontend" to "LexiSearch"
8. **Fix `datetime.utcnow()`** deprecation in `security.py`
9. **Add synonyms/antonyms** — parse from DictionaryAPI response already being fetched
10. **Split App.jsx into components** — `SearchBar`, `ResultCard`, `TranslationPanel`, `SidebarSections`
11. **Fix `App.css overflow: hidden`** — likely causing scroll issues on short viewports
12. **Update README** — document translation feature, Render deployment, env vars

---

## Quick Start Instructions

```bash
# 1. Clone the repo (if needed)
git clone <repo-url>
cd dictionary-api-app

# 2. Backend setup
cd backend
python -m venv venv              # only first time
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt   # only first time / after changes

# 3. Create .env (if missing)
# backend/.env must contain:
# SECRET_KEY=any-random-string
# GEMINI_API_KEY=your-google-gemini-key
# ACCESS_TOKEN_EXPIRE_MINUTES=60
# (do NOT set DATABASE_URL locally → app auto-uses SQLite)

# 4. Start backend
uvicorn app.main:app --reload
# → http://127.0.0.1:8000
# → Swagger docs: http://127.0.0.1:8000/docs

# 5. Frontend setup (new terminal)
cd frontend
npm install      # only first time
npm run dev
# → http://localhost:5173

# 6. Get a Gemini API key (free tier available)
# https://aistudio.google.com/app/apikey
```

---

## External APIs Used

| API | Purpose | Auth | Cost |
|---|---|---|---|
| `api.dictionaryapi.dev` | Word definitions + phonetics + audio | None (free, no key) | Free |
| `api.datamuse.com` | Search suggestions | None (free, no key) | Free |
| Google Gemini 2.5 Flash | Example sentences + translation | `GEMINI_API_KEY` | Free tier / pay-per-use |
| Web Speech API | TTS read-aloud | None (browser-native) | Free |
