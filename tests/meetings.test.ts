import { createMeetingSchema, listMeetingsSchema } from '../src/modules/meetings/meetings.schema';
import { ZodError } from 'zod';

describe('Meetings Schema Validation', () => {
  // ─── Create Meeting Schema ──────────────────────────────────────────────────

  describe('createMeetingSchema', () => {
    const validInput = {
      body: {
        title: 'Q2 Planning',
        meetingDate: '2026-06-01T10:00:00.000Z',
        participants: ['alice@example.com', 'bob@example.com'],
        transcript: [
          { timestamp: '00:00', speaker: 'Alice', text: 'Welcome everyone.' },
          { timestamp: '00:05', speaker: 'Bob', text: 'Thanks for joining.' },
        ],
      },
    };

    it('should pass with valid full input', () => {
      const result = createMeetingSchema.parse(validInput);
      expect(result.body.title).toBe('Q2 Planning');
      expect(result.body.transcript).toHaveLength(2);
    });

    it('should default participants to empty array when not provided', () => {
      const input = {
        body: {
          title: 'Solo Meeting',
          meetingDate: '2026-06-01T10:00:00.000Z',
          transcript: [{ timestamp: '00:00', speaker: 'Alice', text: 'Hello.' }],
        },
      };
      const result = createMeetingSchema.parse(input);
      expect(result.body.participants).toEqual([]);
    });

    it('should fail when title is missing', () => {
      const input = { body: { ...validInput.body, title: '' } };
      expect(() => createMeetingSchema.parse(input)).toThrow(ZodError);
    });

    it('should fail with invalid meetingDate format', () => {
      const input = { body: { ...validInput.body, meetingDate: '06-01-2026' } };
      expect(() => createMeetingSchema.parse(input)).toThrow(ZodError);
    });

    it('should fail with invalid participant email', () => {
      const input = {
        body: { ...validInput.body, participants: ['not-an-email'] },
      };
      expect(() => createMeetingSchema.parse(input)).toThrow(ZodError);
    });

    it('should fail with empty transcript', () => {
      const input = { body: { ...validInput.body, transcript: [] } };
      expect(() => createMeetingSchema.parse(input)).toThrow(ZodError);
    });

    it('should fail when transcript segment is missing text', () => {
      const input = {
        body: {
          ...validInput.body,
          transcript: [{ timestamp: '00:00', speaker: 'Alice', text: '' }],
        },
      };
      expect(() => createMeetingSchema.parse(input)).toThrow(ZodError);
    });
  });

  // ─── List Meetings Schema ───────────────────────────────────────────────────

  describe('listMeetingsSchema', () => {
    it('should default page=1 and limit=10 when not provided', () => {
      const result = listMeetingsSchema.parse({ query: {} });
      expect(result.query.page).toBe(1);
      expect(result.query.limit).toBe(10);
    });

    it('should parse string page/limit to numbers', () => {
      const result = listMeetingsSchema.parse({ query: { page: '2', limit: '20' } });
      expect(result.query.page).toBe(2);
      expect(result.query.limit).toBe(20);
    });

    it('should fail when page is 0', () => {
      expect(() =>
        listMeetingsSchema.parse({ query: { page: '0' } })
      ).toThrow(ZodError);
    });

    it('should fail when limit exceeds 100', () => {
      expect(() =>
        listMeetingsSchema.parse({ query: { limit: '101' } })
      ).toThrow(ZodError);
    });

    it('should pass with title filter', () => {
      const result = listMeetingsSchema.parse({ query: { title: 'Q2' } });
      expect(result.query.title).toBe('Q2');
    });
  });
});
