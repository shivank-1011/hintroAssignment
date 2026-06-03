# Architecture and Design Decisions

## 1. Database: PostgreSQL (Supabase)

**Why PostgreSQL over MongoDB?**

The assignment explicitly permits PostgreSQL. PostgreSQL was chosen because:
- Relational structure naturally models meetings → participants → transcript segments → analysis → action items
- Foreign key constraints ensure data integrity
- JOIN queries for filtering action items by meeting are efficient
- Supabase provides a free managed PostgreSQL with connection pooling

**Why Supabase?**
- Managed service, no infrastructure to maintain
- Free tier sufficient for this project
- Provides both transaction pooler (for runtime) and direct URL (for migrations)
- Easy to connect with Prisma

**Why Prisma ORM?**
- Type-safe database access with generated TypeScript types
- Migration management with version history
- Cleaner than raw SQL for CRUD operations
- Supports connection pooling via pgbouncer

---

## 2. Authentication: JWT over Sessions

| JWT | Session |
|-----|---------|
| Stateless — no server-side storage needed | Requires session store (Redis or DB) |
| Works perfectly for REST APIs | Better for web apps with server-side rendering |
| Easy to deploy on Render (no session store) | Adds infrastructure complexity |
| Token contains user context | Server must look up session on every request |

**Implementation details:**
- `bcrypt` with 12 salt rounds for password hashing (industry standard)
- Token expiry: 7 days
- Error messages for login intentionally vague ("Invalid email or password") to prevent user enumeration attacks

---

## 3. AI Provider: Groq (llama-3.3-70b-versatile)

**Why Groq?**
- Free tier available
- llama-3.3-70b-versatile is excellent at structured JSON output
- Low latency compared to other free providers
- Reliable instruction following

**Why not OpenAI?**
- Cost — no free tier for production use

**Why not local LLM?**
- Deployment complexity on Render
- Resource constraints

**Hallucination Prevention:**
- `response_format: { type: 'json_object' }` forces JSON-only output
- `temperature: 0.1` reduces randomness for consistent structured output
- Prompt explicitly states: "Use ONLY information from the transcript"
- Citations are enforced — every item must reference a transcript timestamp
- AI response is validated programmatically before storage

---

## 4. External Integration: Slack Incoming Webhook

**Why not email?**
- No SMTP server needed
- No email deliverability concerns
- Instant delivery

**Why not Slack OAuth?**
- OAuth requires app approval process
- Webhook is sufficient for one-way notifications
- Simple — just POST to a URL

**Why not SMS?**
- Requires Twilio or similar paid service

**Resilience design:**
- `sendSlackMessage()` never throws — returns boolean
- Failed Slack delivery is logged and recorded in reminder_history
- Cron job continues processing remaining items even if one Slack call fails

---

## 5. Project Structure: Module-Based

```
src/modules/<feature>/
  ├── <feature>.schema.ts    — Zod validation schemas
  ├── <feature>.service.ts   — Business logic
  ├── <feature>.controller.ts — HTTP layer (req/res)
  └── <feature>.routes.ts    — Route definitions + Swagger docs
```

**Why this structure?**
- Each module is self-contained and independently testable
- Easy for reviewers to navigate
- Service layer can be reused by cron jobs and controllers
- Clear separation of concerns: validation → business logic → HTTP

---

## 6. Unified Response Format

Every response follows:
```json
{
  "traceId": "uuid",
  "success": true/false,
  "data": {} / "error": { "code": "", "message": "" }
}
```

**Why traceId?**
- Links logs to specific requests
- Enables debugging production issues without exposing internals
- Required by the assignment

---

## 7. Trade-offs

| Decision | Trade-off |
|----------|-----------|
| JWT (stateless) | Cannot revoke tokens before expiry |
| Single Slack webhook | All reminders go to one channel |
| Re-analysis overwrites | Previous analysis is lost (acceptable for this scope) |
| Hourly cron | Not real-time; overdue items may sit for up to 1 hour |
| In-process cron (node-cron) | Stops when server restarts; acceptable for Render |
