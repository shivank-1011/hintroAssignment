# AI Approach — Meeting Intelligence Analysis

## Model

**Provider:** Groq  
**Model:** llama-3.3-70b-versatile  
**API:** Groq OpenAI-compatible endpoint (`/v1/chat/completions`)

---

## Prompt Design

The prompt uses a structured instruction approach with explicit constraints:

```
You are a meeting intelligence assistant.

CRITICAL RULES:
1. Use ONLY information explicitly stated in the transcript.
2. DO NOT invent, assume, or add any information not present.
3. Every item MUST include a "citations" array with at least one timestamp.
4. Return ONLY valid JSON — no markdown, no explanation.
```

The transcript is formatted as:
```
[00:00] Alice: Welcome everyone.
[00:05] Bob: Thanks for joining.
```

This format preserves speaker attribution and timestamp anchors that the model uses for citations.

---

## Output Format

The model is instructed to return exactly:

```json
{
  "summary": [
    {
      "text": "A key point discussed",
      "citations": [{"timestamp": "00:00"}]
    }
  ],
  "decisions": [...],
  "followUps": [...],
  "actionItems": [
    {
      "task": "Specific task",
      "assignee": "Person name",
      "dueDate": "ISO 8601 or empty string",
      "citations": [{"timestamp": "00:05"}]
    }
  ]
}
```

---

## Hallucination Prevention

Three-layer approach:

### Layer 1: Prompt Constraints
- Explicit instruction: "Use ONLY information from the transcript"
- Explicit prohibition: "DO NOT invent attendees, decisions, or tasks"
- `temperature: 0.1` — minimizes creative deviation

### Layer 2: Forced JSON Mode
- `response_format: { type: 'json_object' }` forces the model to produce only JSON
- Eliminates markdown wrappers, explanations, or prose

### Layer 3: Programmatic Validation
- Every required field (`summary`, `decisions`, `followUps`, `actionItems`) is checked
- Every item must have a non-empty `citations` array
- Items without citations are rejected with error code `AI_MISSING_CITATIONS`
- Malformed JSON triggers error code `AI_INVALID_JSON`
- Non-object responses trigger `AI_INVALID_RESPONSE`

---

## Citation Strategy

Citations link every extracted item back to a specific transcript segment by timestamp. This allows:
- Verification that the AI is not hallucinating
- Navigation to the exact moment in the recording
- Auditability of AI outputs

If the model returns an item without a citation, the entire analysis is rejected and an error is returned to the client.

---

## Storage

Analysis results are stored in the `meeting_analysis` table as JSON:
- `summary` — array of summary items with citations
- `decisions` — array of decision items with citations  
- `followUps` — array of follow-up items with citations

Action items from AI output are stored separately in `action_items` with:
- Status defaulting to `PENDING`
- Due date parsed from ISO string (defaults to +7 days if not specified)
- Citations stored as JSON

Re-analyzing a meeting upserts the analysis record (updates existing).

---

## Known Limitations

1. **Long transcripts:** Very long transcripts may approach the model's context limit. For production, consider chunking.
2. **Timestamp accuracy:** The model cites timestamps it sees in the text. If timestamps are irregular or missing, citations may be imprecise.
3. **Assignee detection:** If a name is ambiguous (e.g., "the PM"), the model uses "Unassigned".
4. **Due date inference:** The model attempts to parse dates from natural language (e.g., "next Friday"). This may be inaccurate for relative dates.
5. **Language:** Optimized for English transcripts. Other languages may produce lower-quality output.
