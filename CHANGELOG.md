# Changelog

All notable changes to the Hintro Meeting Intelligence Service.

---

## [1.0.0] — 2026-06-03

### Added — Phase 1: Project Setup
- Initialized Node.js + TypeScript project
- Configured tsconfig.json with strict mode
- Installed all dependencies (Express, Prisma, JWT, bcrypt, Groq, Zod, Swagger, node-cron)
- Created .env.example template

### Added — Phase 2: Database Schema
- Prisma schema with 7 models: User, Meeting, MeetingParticipant, TranscriptSegment, MeetingAnalysis, ActionItem, ReminderHistory
- ActionItemStatus enum (PENDING, IN_PROGRESS, COMPLETED)
- Supabase PostgreSQL connection with transaction pooler + direct URL

### Added — Phase 3: Authentication
- POST /api/auth/register — bcrypt hashed passwords
- POST /api/auth/login — JWT token generation
- JWT middleware protecting all sensitive routes

### Added — Phase 4: Core Infrastructure
- Trace ID middleware (UUID per request)
- Unified response format: { traceId, success, data/error }
- Structured JSON logger
- Global error middleware (handles Zod, Prisma, AppError, unknown errors)

### Added — Phase 5: Meeting Management
- POST /api/meetings — create with nested participants and transcript
- GET /api/meetings — paginated list with title filter
- GET /api/meetings/:id — get with transcript and analysis

### Added — Phase 6: Action Items
- POST /api/action-items — create action item
- GET /api/action-items — list with status/assignee/meetingId filters
- PATCH /api/action-items/:id/status — update status
- GET /api/action-items/overdue — detect past-due items

### Added — Phase 7: AI Analysis
- POST /api/meetings/:id/analyze — Groq LLM analysis
- Citation enforcement for all AI outputs
- Three-layer hallucination prevention (prompt + JSON mode + validation)
- Transaction-safe storage of analysis + auto-created action items

### Added — Phase 8: Slack Reminders
- Slack Incoming Webhook integration
- Hourly cron job (node-cron) for overdue reminders
- ReminderHistory tracking in database

### Added — Phase 9: Swagger Documentation
- Interactive Swagger UI at /swagger
- Full JSDoc annotations on all routes

### Added — Phase 10: System Endpoints
- GET /health → { status: "UP" }
- GET /api/evaluation → candidate metadata

### Added — Phase 11: Unit Tests
- 35 unit tests across 4 test files
- Auth, Meeting, Action Item schema tests
- AI response validation tests

### Added — Phase 12: Documentation
- README.md — setup, API examples, deployment
- DECISIONS.md — architectural rationale
- AI_APPROACH.md — prompt design and citation strategy
- TESTING.md — test scenarios and edge cases
- CHANGELOG.md — this file
- CHECKLIST.md — requirement completion tracking

### Added — Phase 13: Deployment
- render.yaml configuration
- Production build pipeline
