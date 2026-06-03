# Hintro Meeting Intelligence Service

An AI-powered meeting analysis backend that processes transcripts using Groq LLM to extract summaries, decisions, action items, and follow-ups — all with citation tracking.

## Features

- **JWT Authentication** — Secure register/login flow
- **Meeting Management** — Create meetings with participants and transcript segments
- **AI Analysis** — Groq-powered extraction of summaries, decisions, action items with citations
- **Action Item Tracking** — Status management (PENDING → IN_PROGRESS → COMPLETED)
- **Overdue Detection** — Identify past-due, incomplete action items
- **Slack Reminders** — Hourly cron job sends Slack notifications for overdue items
- **Swagger Documentation** — Interactive API docs at `/swagger`
- **Unified Response Format** — Every response includes a trace ID

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | Supabase PostgreSQL (via Prisma ORM) |
| AI | Groq — llama-3.3-70b-versatile |
| Auth | JWT + bcrypt |
| Scheduler | node-cron |
| External | Slack Incoming Webhook |
| Docs | Swagger UI (swagger-jsdoc) |
| Deployment | Render |

---

## Prerequisites

- Node.js 18+
- npm 9+
- A Supabase PostgreSQL database
- A Groq API key
- A Slack Incoming Webhook URL

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/shivank-1011/hintro.git
cd hintro
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://postgres.xxxx:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"

JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

GROQ_API_KEY="gsk_xxxx"
GROQ_MODEL="llama-3.3-70b-versatile"

SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/yyy/zzz"
```

### 4. Run database migrations

```bash
npm run db:generate
npm run db:migrate:deploy
```

### 5. Start the development server

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

---

## API Documentation

Visit `http://localhost:3000/swagger` for the interactive Swagger UI.

---

## Key Endpoints

### Auth
```
POST /api/auth/register    — Register a new user
POST /api/auth/login       — Get a JWT token
```

### Meetings (requires Bearer token)
```
POST /api/meetings         — Create a meeting with transcript
GET  /api/meetings         — List meetings (?page=1&limit=10&title=)
GET  /api/meetings/:id     — Get meeting details
```

### Analysis (requires Bearer token)
```
POST /api/meetings/:id/analyze   — Run AI analysis on a meeting
```

### Action Items (requires Bearer token)
```
POST  /api/action-items            — Create an action item
GET   /api/action-items            — List (?status=&assignee=&meetingId=)
PATCH /api/action-items/:id/status — Update status
GET   /api/action-items/overdue    — Get overdue items
```

### System
```
GET /health           — Health check
GET /api/evaluation   — Candidate info
GET /swagger          — API documentation
```

---

## Example Usage

### 1. Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Shivank","email":"shivank@example.com","password":"password123"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shivank@example.com","password":"password123"}'
```

Copy the `token` from the response.

### 3. Create a meeting

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q2 Planning",
    "meetingDate": "2026-06-01T10:00:00.000Z",
    "participants": ["alice@example.com"],
    "transcript": [
      {"timestamp":"00:00","speaker":"Alice","text":"Lets discuss the Q2 roadmap."},
      {"timestamp":"00:05","speaker":"Bob","text":"I think we should focus on feature X."},
      {"timestamp":"00:10","speaker":"Alice","text":"Agreed. Bob, can you prepare release notes by June 15?"},
      {"timestamp":"00:15","speaker":"Bob","text":"Sure, Ill have it done."}
    ]
  }'
```

### 4. Analyze the meeting

```bash
curl -X POST http://localhost:3000/api/meetings/<meetingId>/analyze \
  -H "Authorization: Bearer <token>"
```

---

## Running Tests

```bash
npm test
```

---

## Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on Render
3. Set **Build Command**: `npm install && npm run db:generate && npm run build`
4. Set **Start Command**: `npm run db:migrate:deploy && npm start`
5. Add all environment variables from `.env.example`

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `DATABASE_URL` | Yes | Supabase transaction pooler URL |
| `DIRECT_URL` | Yes | Supabase direct connection URL (for migrations) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `GROQ_API_KEY` | Yes | Groq API key |
| `GROQ_MODEL` | No | Model name (default: llama-3.3-70b-versatile) |
| `SLACK_WEBHOOK_URL` | Yes | Slack incoming webhook URL |
| `DEPLOYED_URL` | No | Public URL shown in /api/evaluation |
