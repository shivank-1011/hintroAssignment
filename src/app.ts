import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { traceMiddleware } from './middleware/trace.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { swaggerSpec } from './docs/swagger';
import { logger } from './utils/logger';
import { authRouter } from './modules/auth/auth.routes';
import { meetingsRouter } from './modules/meetings/meetings.routes';
import { analysisRouter } from './modules/analysis/analysis.routes';
import { actionItemsRouter } from './modules/action-items/action-items.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(traceMiddleware);
app.use(morgan('combined', {
  stream: { write: (msg: string) => logger.info({ type: 'http' }, msg.trim()) },
}));

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Hintro API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: { persistAuthorization: true },
}));

app.get('/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

/**
 * @swagger
 * /api/evaluation:
 *   get:
 *     summary: Candidate evaluation info
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Evaluation metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidateName: { type: string }
 *                 email: { type: string }
 *                 repositoryUrl: { type: string }
 *                 deployedUrl: { type: string }
 *                 externalIntegration: { type: string }
 *                 features:
 *                   type: array
 *                   items: { type: string }
 */
app.get('/api/evaluation', (_req: Request, res: Response) => {
  res.status(200).json({
    candidateName: 'Shivank Gupta',
    email: 'guptashivu544@gmail.com',
    repositoryUrl: 'https://github.com/shivank-1011/hintroAssignment.git',
    deployedUrl: process.env.DEPLOYED_URL || 'https://hintroassignment.onrender.com',
    externalIntegration: 'Slack Incoming Webhook',
    features: [
      'JWT Authentication (register + login)',
      'Meeting management with transcript storage',
      'AI-powered analysis via Groq llama-3.3-70b-versatile',
      'Citation tracking for all AI outputs',
      'Action item management with status tracking',
      'Overdue item detection',
      'Slack reminder notifications via cron job (every hour)',
      'Swagger UI documentation at /swagger',
      'Unified response format with trace IDs',
      'Structured logging',
      'Global error handling',
    ],
  });
});

app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api', analysisRouter);
app.use('/api/action-items', actionItemsRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    traceId: req.traceId,
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});

export default app;
