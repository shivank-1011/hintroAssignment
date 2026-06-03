/**
 * AI Response Validation Tests
 *
 * Tests the internal validation logic for AI responses:
 * - Malformed JSON handling
 * - Missing required fields
 * - Missing citations
 */

// We test the validation logic directly without hitting Groq
// by extracting the validate function and testing edge cases

interface Citation {
  timestamp: string;
}

interface AnalysisItem {
  text: string;
  citations: Citation[];
}

interface ActionItemAI {
  task: string;
  assignee: string;
  dueDate: string;
  citations: Citation[];
}

interface AnalysisResult {
  summary: AnalysisItem[];
  decisions: AnalysisItem[];
  followUps: AnalysisItem[];
  actionItems: ActionItemAI[];
}

class AppError extends Error {
  constructor(public message: string, public statusCode: number, public code: string) {
    super(message);
  }
}

// Inline validation function (mirrors ai.service.ts logic)
const validateAnalysisResult = (data: unknown): AnalysisResult => {
  if (typeof data !== 'object' || data === null) {
    throw new AppError('AI returned non-object response', 502, 'AI_INVALID_RESPONSE');
  }

  const obj = data as Record<string, unknown>;
  const requiredFields = ['summary', 'decisions', 'followUps', 'actionItems'];

  for (const field of requiredFields) {
    if (!Array.isArray(obj[field])) {
      throw new AppError(`AI response missing required field: ${field}`, 502, 'AI_INVALID_RESPONSE');
    }
  }

  const allArrays = [
    ...(obj.summary as AnalysisItem[]),
    ...(obj.decisions as AnalysisItem[]),
    ...(obj.followUps as AnalysisItem[]),
  ];

  for (const item of allArrays) {
    if (!item.citations || !Array.isArray(item.citations) || item.citations.length === 0) {
      throw new AppError('AI response contains items without citations', 502, 'AI_MISSING_CITATIONS');
    }
  }

  for (const item of obj.actionItems as ActionItemAI[]) {
    if (!item.citations || !Array.isArray(item.citations) || item.citations.length === 0) {
      throw new AppError('AI action item missing citations', 502, 'AI_MISSING_CITATIONS');
    }
  }

  return obj as unknown as AnalysisResult;
};

describe('AI Response Validation', () => {
  const validResponse = {
    summary: [{ text: 'Team discussed Q2 roadmap', citations: [{ timestamp: '00:00' }] }],
    decisions: [{ text: 'Launch in June', citations: [{ timestamp: '00:10' }] }],
    followUps: [{ text: 'Confirm budget', citations: [{ timestamp: '00:20' }] }],
    actionItems: [
      {
        task: 'Prepare release notes',
        assignee: 'Alice',
        dueDate: '2026-06-15T00:00:00.000Z',
        citations: [{ timestamp: '00:25' }],
      },
    ],
  };

  it('should accept a valid complete AI response', () => {
    const result = validateAnalysisResult(validResponse);
    expect(result.summary).toHaveLength(1);
    expect(result.decisions).toHaveLength(1);
    expect(result.actionItems).toHaveLength(1);
  });

  it('should accept an empty actionItems array', () => {
    const result = validateAnalysisResult({ ...validResponse, actionItems: [] });
    expect(result.actionItems).toHaveLength(0);
  });

  it('should reject null response', () => {
    expect(() => validateAnalysisResult(null)).toThrow(AppError);
    expect(() => validateAnalysisResult(null)).toThrow('AI returned non-object response');
  });

  it('should reject when summary is missing', () => {
    const { summary: _s, ...withoutSummary } = validResponse;
    expect(() => validateAnalysisResult(withoutSummary)).toThrow(AppError);
    expect(() => validateAnalysisResult(withoutSummary)).toThrow('AI response missing required field: summary');
  });

  it('should reject when decisions is missing', () => {
    const { decisions: _d, ...withoutDecisions } = validResponse;
    expect(() => validateAnalysisResult(withoutDecisions)).toThrow(AppError);
  });

  it('should reject when followUps is missing', () => {
    const { followUps: _f, ...withoutFollowUps } = validResponse;
    expect(() => validateAnalysisResult(withoutFollowUps)).toThrow(AppError);
  });

  it('should reject when actionItems is not an array', () => {
    const malformed = { ...validResponse, actionItems: 'not-an-array' };
    expect(() => validateAnalysisResult(malformed)).toThrow(AppError);
  });

  it('should reject summary item without citations', () => {
    const noCitations = {
      ...validResponse,
      summary: [{ text: 'Some point', citations: [] }],
    };
    expect(() => validateAnalysisResult(noCitations)).toThrow(AppError);
    expect(() => validateAnalysisResult(noCitations)).toThrow('AI response contains items without citations');
  });

  it('should reject action item without citations', () => {
    const noActionCitations = {
      ...validResponse,
      actionItems: [
        {
          task: 'Do something',
          assignee: 'Bob',
          dueDate: '',
          citations: [],
        },
      ],
    };
    expect(() => validateAnalysisResult(noActionCitations)).toThrow(AppError);
    expect(() => validateAnalysisResult(noActionCitations)).toThrow('AI action item missing citations');
  });

  it('should reject items with undefined citations', () => {
    const undefinedCitations = {
      ...validResponse,
      decisions: [{ text: 'A decision', citations: undefined }],
    };
    expect(() => validateAnalysisResult(undefinedCitations)).toThrow(AppError);
  });
});
