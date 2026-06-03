import 'dotenv/config';

// Set test environment variables if not already set
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.PORT = '3001';
