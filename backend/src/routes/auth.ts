import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../services/authService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['FARMER', 'BUYER', 'TRANSPORT']).default('FARMER'),
  district: z.string().optional(),
  state: z.string().optional(),
  village: z.string().optional(),
  companyName: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  mobile: z.string().optional(),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { name, email, mobile, password, role, district, state, village, companyName, licenseNumber } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name, email, mobile, passwordHash, role,
      ...(role === 'FARMER' && district && state
        ? { farmerProfile: { create: { district, state, village } } }
        : {}),
      ...(role === 'BUYER' && district && state
        ? { buyerProfile: { create: { district, state, companyName } } }
        : {}),
      ...(role === 'TRANSPORT' && district && state
        ? { transportProfile: { create: { district, state, licenseNumber } } }
        : {}),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.status(201).json({ user, token });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, name: true, email: true, mobile: true, role: true, createdAt: true,
      farmerProfile: true,
      buyerProfile: true,
      transportProfile: { include: { vehicles: { where: { isActive: true } } } },
    },
  });

  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = ProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, mobile: true, role: true },
  });

  res.json({ user });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = PasswordChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash: newHash } });

  res.json({ message: 'Password changed successfully' });
});

export default router;
