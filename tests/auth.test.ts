import { registerSchema, loginSchema } from '../src/modules/auth/auth.schema';
import { ZodError } from 'zod';

describe('Auth Schema Validation', () => {
  // ─── Register Schema ────────────────────────────────────────────────────────

  describe('registerSchema', () => {
    it('should pass with valid inputs', () => {
      const result = registerSchema.parse({
        body: {
          name: 'Shivank Gupta',
          email: 'shivank@example.com',
          password: 'securePass123',
        },
      });
      expect(result.body.name).toBe('Shivank Gupta');
      expect(result.body.email).toBe('shivank@example.com');
    });

    it('should fail with invalid email', () => {
      expect(() =>
        registerSchema.parse({
          body: {
            name: 'Shivank',
            email: 'not-an-email',
            password: 'securePass123',
          },
        })
      ).toThrow(ZodError);
    });

    it('should fail when password is too short', () => {
      expect(() =>
        registerSchema.parse({
          body: {
            name: 'Shivank',
            email: 'shivank@example.com',
            password: 'short',
          },
        })
      ).toThrow(ZodError);
    });

    it('should fail when name is empty', () => {
      expect(() =>
        registerSchema.parse({
          body: {
            name: '',
            email: 'shivank@example.com',
            password: 'securePass123',
          },
        })
      ).toThrow(ZodError);
    });

    it('should fail when email is missing', () => {
      expect(() =>
        registerSchema.parse({
          body: {
            name: 'Shivank',
            password: 'securePass123',
          },
        })
      ).toThrow(ZodError);
    });
  });

  // ─── Login Schema ───────────────────────────────────────────────────────────

  describe('loginSchema', () => {
    it('should pass with valid credentials', () => {
      const result = loginSchema.parse({
        body: {
          email: 'shivank@example.com',
          password: 'anypassword',
        },
      });
      expect(result.body.email).toBe('shivank@example.com');
    });

    it('should fail with invalid email format', () => {
      expect(() =>
        loginSchema.parse({
          body: { email: 'bademail', password: 'pass' },
        })
      ).toThrow(ZodError);
    });

    it('should fail when password is empty', () => {
      expect(() =>
        loginSchema.parse({
          body: { email: 'shivank@example.com', password: '' },
        })
      ).toThrow(ZodError);
    });
  });
});
