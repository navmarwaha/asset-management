import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role?: string;
    };

    authReq.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user: { id: string; email: string; role?: string }): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  const expiresInValue = process.env.JWT_EXPIRES_IN || '7d';
  const options: jwt.SignOptions = {
    expiresIn: expiresInValue,
  } as jwt.SignOptions;
  
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role?: string;
      };
      authReq.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

