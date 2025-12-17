import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!authReq.user.role) {
      res.status(403).json({ error: 'User role not found' });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: authReq.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is Super Admin
 */
export const requireSuperAdmin: RequestHandler = requireRole('Super Admin');

/**
 * Check if user is Admin or Super Admin
 */
export const requireAdmin: RequestHandler = requireRole('Super Admin', 'Admin');

/**
 * Check if user is Admin, Super Admin, or Operator
 */
export const requireOperator: RequestHandler = requireRole('Super Admin', 'Admin', 'Operator');

