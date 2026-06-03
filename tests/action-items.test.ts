import {
  createActionItemSchema,
  updateStatusSchema,
  listActionItemsSchema,
} from '../src/modules/action-items/action-items.schema';
import { ZodError } from 'zod';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Action Items Schema Validation', () => {
  // ─── Create Action Item ─────────────────────────────────────────────────────

  describe('createActionItemSchema', () => {
    const validInput = {
      body: {
        meetingId: VALID_UUID,
        task: 'Prepare release notes',
        assignee: 'Alice',
        dueDate: '2026-06-15T00:00:00.000Z',
        citations: [{ timestamp: '00:20' }],
      },
    };

    it('should pass with valid full input', () => {
      const result = createActionItemSchema.parse(validInput);
      expect(result.body.task).toBe('Prepare release notes');
      expect(result.body.assignee).toBe('Alice');
    });

    it('should default citations to empty array when not provided', () => {
      const input = {
        body: {
          meetingId: VALID_UUID,
          task: 'Test task',
          assignee: 'Bob',
          dueDate: '2026-06-15T00:00:00.000Z',
        },
      };
      const result = createActionItemSchema.parse(input);
      expect(result.body.citations).toEqual([]);
    });

    it('should fail with invalid meetingId (not UUID)', () => {
      const input = { body: { ...validInput.body, meetingId: 'not-a-uuid' } };
      expect(() => createActionItemSchema.parse(input)).toThrow(ZodError);
    });

    it('should fail with empty task', () => {
      const input = { body: { ...validInput.body, task: '' } };
      expect(() => createActionItemSchema.parse(input)).toThrow(ZodError);
    });

    it('should fail with empty assignee', () => {
      const input = { body: { ...validInput.body, assignee: '' } };
      expect(() => createActionItemSchema.parse(input)).toThrow(ZodError);
    });

    it('should fail with invalid dueDate format', () => {
      const input = { body: { ...validInput.body, dueDate: '15-06-2026' } };
      expect(() => createActionItemSchema.parse(input)).toThrow(ZodError);
    });
  });

  // ─── Update Status Schema ───────────────────────────────────────────────────

  describe('updateStatusSchema', () => {
    it('should pass with PENDING status', () => {
      const result = updateStatusSchema.parse({
        body: { status: 'PENDING' },
        params: { id: VALID_UUID },
      });
      expect(result.body.status).toBe('PENDING');
    });

    it('should pass with IN_PROGRESS status', () => {
      const result = updateStatusSchema.parse({
        body: { status: 'IN_PROGRESS' },
        params: { id: VALID_UUID },
      });
      expect(result.body.status).toBe('IN_PROGRESS');
    });

    it('should pass with COMPLETED status', () => {
      const result = updateStatusSchema.parse({
        body: { status: 'COMPLETED' },
        params: { id: VALID_UUID },
      });
      expect(result.body.status).toBe('COMPLETED');
    });

    it('should fail with invalid status value', () => {
      expect(() =>
        updateStatusSchema.parse({
          body: { status: 'DONE' },
          params: { id: VALID_UUID },
        })
      ).toThrow(ZodError);
    });

    it('should fail with invalid id format (not UUID)', () => {
      expect(() =>
        updateStatusSchema.parse({
          body: { status: 'PENDING' },
          params: { id: 'not-a-valid-uuid' },
        })
      ).toThrow(ZodError);
    });
  });

  // ─── List Action Items Schema ───────────────────────────────────────────────

  describe('listActionItemsSchema', () => {
    it('should pass with no filters (defaults applied)', () => {
      const result = listActionItemsSchema.parse({ query: {} });
      expect(result.query.page).toBe(1);
      expect(result.query.limit).toBe(10);
      expect(result.query.status).toBeUndefined();
      expect(result.query.assignee).toBeUndefined();
      expect(result.query.meetingId).toBeUndefined();
    });

    it('should pass with all three required filters', () => {
      const result = listActionItemsSchema.parse({
        query: {
          status: 'PENDING',
          assignee: 'Alice',
          meetingId: VALID_UUID,
        },
      });
      expect(result.query.status).toBe('PENDING');
      expect(result.query.assignee).toBe('Alice');
      expect(result.query.meetingId).toBe(VALID_UUID);
    });

    it('should fail with invalid status filter', () => {
      expect(() =>
        listActionItemsSchema.parse({
          query: { status: 'INVALID_STATUS' },
        })
      ).toThrow(ZodError);
    });

    it('should fail when meetingId filter is not a valid UUID', () => {
      expect(() =>
        listActionItemsSchema.parse({
          query: { meetingId: 'not-a-uuid' },
        })
      ).toThrow(ZodError);
    });
    it('should parse page and limit when provided as strings', () => {
      const result = listActionItemsSchema.parse({
        query: {
          page: '3',
          limit: '25',
        },
      });
      expect(result.query.page).toBe(3);
      expect(result.query.limit).toBe(25);
    });
  });
});
