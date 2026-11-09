import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../services/authService';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);

    let user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name || 'User',
            role: decoded.role || 'BUYER',
            passwordHash: '$2a$12$dummyHashForJwtVerifiedUser',
            isActive: true,
          },
          select: { id: true, email: true, role: true, name: true, isActive: true },
        });

        if (decoded.role === 'BUYER') {
          await prisma.buyerProfile.create({
            data: { userId: decoded.id, district: 'National', state: 'India', buyerType: 'RETAIL' },
          }).catch(() => {});
        } else if (decoded.role === 'FARMER') {
          await prisma.farmerProfile.create({
            data: { userId: decoded.id, district: 'National', state: 'India' },
          }).catch(() => {});
        } else if (decoded.role === 'TRANSPORT') {
          await prisma.transportProfile.create({
            data: { userId: decoded.id, licenseNumber: 'VERIFIED', district: 'National', state: 'India' },
          }).catch(() => {});
        }
      } catch {
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, role: true, name: true, isActive: true },
        });
      }
    }

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });
    if (user && user.isActive) {
      req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    }
  } catch {
    // ignore invalid token in optional auth
  }
  next();
};
