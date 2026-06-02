import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 12;

export interface AuthTokenResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Register a new user.
 * Hashes the password with bcrypt before storing.
 */
export const registerUser = async (input: RegisterInput): Promise<AuthTokenResponse> => {
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('A user with this email already exists', 409, 'EMAIL_TAKEN');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
  });

  // Generate JWT
  const token = generateToken(user.id, user.email);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

/**
 * Authenticate a user and return a JWT.
 */
export const loginUser = async (input: LoginInput): Promise<AuthTokenResponse> => {
  // Find user
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Compare password
  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Generate JWT
  const token = generateToken(user.id, user.email);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

/**
 * Generate a signed JWT token.
 */
const generateToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d' }
  );
};
