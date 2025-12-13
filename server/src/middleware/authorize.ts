import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.role) {
      return res.status(403).json({ error: 'User role not found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user is Super Admin
 */
export const requireSuperAdmin = requireRole('Super Admin');

/**
 * Check if user is Admin or Super Admin
 */
export const requireAdmin = requireRole('Super Admin', 'Admin');

/**
 * Check if user is Admin, Super Admin, or Operator
 */
export const requireOperator = requireRole('Super Admin', 'Admin', 'Operator');

