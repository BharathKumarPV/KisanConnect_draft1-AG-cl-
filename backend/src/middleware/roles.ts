import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const VALID_ROLES = ['FARMER', 'BUYER', 'TRANSPORT', 'ADMIN'] as const;
export type UserRole = (typeof VALID_ROLES)[number];

export function isValidRole(role: string): role is UserRole {
  return (VALID_ROLES as readonly string[]).includes(role);
}

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireFarmer = requireRole('FARMER', 'ADMIN');
export const requireBuyer = requireRole('BUYER', 'ADMIN');
export const requireTransport = requireRole('TRANSPORT', 'ADMIN');
