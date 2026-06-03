# Testing Guide

## Framework

**Jest** with **ts-jest** for TypeScript support.

---

## Running Tests

```bash
npm test
npm test -- --coverage
npm run test:watch
```

---

## Test Files

| File | What It Tests |
|------|--------------|
| `tests/auth.test.ts` | Auth schema validation (register + login) |
| `tests/meetings.test.ts` | Meeting schema validation (create + list) |
| `tests/action-items.test.ts` | Action item schemas (create, status, list) |
| `tests/ai-validation.test.ts` | AI response validation logic |

---

## Test Scenarios

### Authentication
- Valid register inputs pass schema
- Invalid email format rejected
- Password too short rejected
- Empty name rejected
- Missing email field rejected
- Valid login inputs pass
- Invalid email in login rejected
- Empty password rejected

### Meetings
- Valid full meeting input passes
- Participants default to empty array
- Empty title rejected
- Invalid date format rejected
- Invalid participant email rejected
- Empty transcript rejected
- Empty transcript segment text rejected
- Page defaults to 1, limit defaults to 10
- page=0 rejected
- limit>100 rejected

### Action Items
- Valid create input passes
- Citations default to empty array
- Non-UUID meetingId rejected
- Empty task rejected
- Invalid dueDate format rejected
- All three status values (PENDING, IN_PROGRESS, COMPLETED) accepted
- Invalid status value rejected
- Non-UUID action item ID rejected
- All three filters work together
- Invalid status filter rejected
- Non-UUID meetingId filter rejected

### AI Validation
- Valid complete AI response accepted
- Empty actionItems array accepted
- null response rejected
- Missing summary field rejected
- Missing decisions field rejected
- Missing followUps field rejected
- Non-array actionItems rejected
- Summary item without citations rejected
- Action item without citations rejected
- Undefined citations rejected

---

## Edge Cases Covered

- Items with `citations: []` are correctly rejected
- `citations: undefined` triggers proper error
- Pagination `?page=2` (string) is parsed to number 2
- Status must be exactly `PENDING`, `IN_PROGRESS`, or `COMPLETED`
- meetingId and action item ID must be valid UUIDs

---

## Test Limitations

1. No integration tests — database and Groq API are not called
2. No HTTP tests — controller tests are schema-only
3. Cron job is not unit tested directly
4. Slack webhook is not tested to avoid noise

Run `npm test -- --coverage` to see the full HTML coverage report in `/coverage/`.
