import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { User } from '../models/User';
import { Internship } from '../models/Internship';
import { Application } from '../models/Application';
import { Resume } from '../models/Resume';
import { asyncHandler } from '../utils/asyncHandler';

export const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use((req, res, next) => (req.user!.role === 'admin' ? next() : res.status(403).json({ message: 'Admin role required' })));

adminRouter.get('/overview', asyncHandler(async (_req, res) => {
  const [users, students, recruiters, internships, activeInternships, applications, resumes] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ roles: 'student' }),
    User.countDocuments({ roles: 'recruiter' }),
    Internship.countDocuments(),
    Internship.countDocuments({ isActive: true }),
    Application.countDocuments(),
    Resume.countDocuments(),
  ]);
  res.json({ users, students, recruiters, internships, activeInternships, applications, resumes });
}));

adminRouter.get('/users', asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const users = await User.find().select('-passwordHash -sessions -passwordResetTokenHash -emailVerificationTokenHash').sort({ createdAt: -1 }).skip((page - 1) * 25).limit(25);
  res.json(users);
}));

adminRouter.patch('/users/:id/status', asyncHandler(async (req, res) => {
  const status = ['active', 'suspended', 'deleted'].includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ message: 'Invalid status' });
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-passwordHash -sessions');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}));

adminRouter.get('/internships', asyncHandler(async (_req, res) => {
  res.json(await Internship.find().sort({ createdAt: -1 }).limit(100));
}));

adminRouter.patch('/internships/:id/moderation', asyncHandler(async (req, res) => {
  const isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : null;
  if (isActive === null) return res.status(400).json({ message: 'isActive boolean is required' });
  const internship = await Internship.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!internship) return res.status(404).json({ message: 'Internship not found' });
  res.json(internship);
}));
