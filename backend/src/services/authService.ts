import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-jwt-key';
const JWT_EXPIRES_IN = '24h';

// We sign the user's ID, Email, and Role in the token payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const authService = {
  generateToken: (user: User): string => {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  verifyToken: (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }
};
