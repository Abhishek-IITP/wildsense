# WildSense (Next.js)

WildSense is an offline-first nature companion with guided outdoor missions, a local field journal, and optional local AI reflections powered by Ollama and Gemma.

## Features
- **Offline-First Architecture**: Interactive missions, wall-clock field timer, and field journal remain available without cellular connection.
- **Local AI Nature Reflections**: Safe, contemplative outdoor reflections generated on-device via Ollama (`gemma3:4b`), with automatic deterministic fallback if offline.
- **Safety Guardrails**: Dedicated safety validator blocking unsafe foraging/ingestion, wildlife interaction, cliff or deep water hazards, and trespass instructions.
- **Full Backend API (v1)**: High-performance Next.js Route Handlers backed by MongoDB for missions, field notes, and bidirectional mutation sync.
- **Unit & Integration Test Suite**: Tested with Vitest for safety rules, rate-limiting, schemas, and deterministic fallbacks.

## Requirements
- Node.js 20.9+ (or Bun)
- Bun (recommended) or npm
- Ollama running with `gemma3:4b` pulled (for local AI generation)
- MongoDB (optional, for cloud sync and persistence)

## Quick Start
```bash
bun install
ollama pull gemma3:4b
ollama serve
bun run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Environment Variables
Create `.env.local` if needed:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/
MONGODB_DB=wildsense
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3:4b
```

## Available Scripts
- `bun run dev` – Launch local Next.js development server
- `bun run build` – Run production build and static page generation
- `bun run lint` – Run ESLint across project files
- `bun x vitest run` – Run test suites (safety, fallbacks, schemas, rate limiter)

## Routes & API Endpoints

### Pages
- `/` – Home, hero showcase, and interactive mission creator
- `/mission/[id]` – Mission briefing, active countdown timer, and reflection prompts
- `/journal` – Personal field journal with export and backup restore

### API (v1 REST)
- `GET /api/v1/missions` – Filter missions by category and difficulty
- `POST /api/v1/missions/generate` – Generate a tailored mission using local AI or safe fallback
- `GET /api/v1/missions/[id]` – Retrieve mission by unique identifier
- `GET /api/v1/journal` – Paginated list of field journal notes
- `POST /api/v1/journal` – Create a new field journal entry
- `PATCH /api/v1/journal/[id]` – Update a journal entry
- `DELETE /api/v1/journal/[id]` – Soft or hard delete a journal entry
- `POST /api/v1/reflections` – Generate safe naturalist reflection for a completed mission
- `POST /api/v1/sync` – Process offline client mutation batch and fetch cloud updates
- `GET /api/v1/health/live` & `GET /api/v1/health/ready` – Liveness and database/AI readiness probes
