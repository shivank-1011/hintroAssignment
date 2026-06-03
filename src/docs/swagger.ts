import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hintro Meeting Intelligence API',
      version: '1.0.0',
      description:
        'AI-powered meeting analysis backend. Processes meeting transcripts using Groq LLM to extract summaries, decisions, action items, and follow-ups with citation tracking.',
      contact: {
        name: 'Shivank Gupta',
        email: 'guptashivu544@gmail.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://hintro.onrender.com'
          : `http://localhost:${process.env.PORT || 3000}`,
        description:
          process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            traceId: { type: 'string', format: 'uuid' },
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            traceId: { type: 'string', format: 'uuid' },
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Meetings', description: 'Meeting management' },
      { name: 'Analysis', description: 'AI-powered meeting analysis' },
      { name: 'Action Items', description: 'Action item management and overdue detection' },
      { name: 'System', description: 'Health check and evaluation endpoints' },
    ],
  },
  apis: process.env.NODE_ENV === 'production'
    ? ['./dist/modules/**/*.routes.js', './dist/modules/**/*.controller.js', './dist/app.js']
    : ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
