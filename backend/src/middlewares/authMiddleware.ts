import { Request, Response, NextFunction } from 'express';
import { authService, JwtPayload } from '../services/authService';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required. No token provided.' } });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired token.' } });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden. You do not have the required role.' } });
    }

    next();
  };
};
