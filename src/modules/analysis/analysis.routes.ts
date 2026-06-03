import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { analyzeMeetingHandler } from './analysis.controller';

/**
 * @swagger
 * /api/meetings/{id}/analyze:
 *   post:
 *     summary: Analyze a meeting transcript using Groq AI
 *     description: |
 *       Sends the meeting transcript to Groq (llama-3.3-70b-versatile) for analysis.
 *       Returns summary points, decisions, follow-ups, and action items — all with transcript citations.
 *       The model is instructed to ONLY use information from the transcript and never hallucinate.
 *       Re-analyzing a meeting will update the existing analysis.
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Meeting ID to analyze
 *     responses:
 *       200:
 *         description: Analysis complete
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         meetingId:
 *                           type: string
 *                         analysis:
 *                           type: object
 *                           properties:
 *                             summary:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   text: { type: string }
 *                                   citations:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         timestamp: { type: string }
 *                             decisions:
 *                               type: array
 *                             followUps:
 *                               type: array
 *                         actionItems:
 *                           type: array
 *                         stats:
 *                           type: object
 *                           properties:
 *                             summaryPoints: { type: integer }
 *                             decisions: { type: integer }
 *                             followUps: { type: integer }
 *                             actionItems: { type: integer }
 *       400:
 *         description: Meeting has no transcript
 *       404:
 *         description: Meeting not found
 *       502:
 *         description: AI response error
 */

export const analysisRouter = Router();

analysisRouter.post('/meetings/:id/analyze', authMiddleware, analyzeMeetingHandler);
