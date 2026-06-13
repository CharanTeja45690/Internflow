import { Router } from 'express';
import { applicationSchema, applicationStatuses } from '@internflow/shared';
import { requireAuth } from '../middleware/auth';
import { Application } from '../models/Application';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { emitUserNotification } from '../services/notifications';
import { sendEmail } from '../services/email';

export const applicationRouter = Router();
applicationRouter.use(requireAuth);

async function notify(userId: string, title: string, message: string, data?: unknown) {
  const notification = await Notification.create({ userId, type: 'application', title, message, data });
  emitUserNotification(userId, notification);
  const user = await User.findById(userId).select('email notificationPreferences');
  if (user?.email && (user as any).notificationPreferences?.email !== false) {
    await sendEmail(user.email, title, `${message}\n\nOpen InternFlow: ${process.env.APP_URL ?? 'http://localhost:5173'}`);
  }
}

applicationRouter.get('/', asyncHandler(async (req, res) => res.json(await Application.find({ userId: req.user!.id }).sort({ updatedAt: -1 }))));
applicationRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = applicationSchema.parse(req.body);
    const existing = input.internshipId ? await Application.findOne({ userId: req.user!.id, internshipId: input.internshipId }) : null;
    if (existing) {
      const from = existing.status;
      existing.set({ ...input, status: input.status });
      if (from !== input.status) {
        existing.statusHistory.push({ from, to: input.status, changedAt: new Date() } as any);
        await notify(req.user!.id, 'Application status updated', `${existing.company} ${existing.title} moved to ${input.status}`, { applicationId: existing._id, status: input.status });
      }
      await existing.save();
      return res.status(200).json(existing);
    }
    const doc = await Application.create({ ...input, userId: req.user!.id, statusHistory: [{ to: input.status, changedAt: new Date() }] });
    await notify(req.user!.id, 'Application tracked', `${doc.company} ${doc.title} was added to your tracker`, { applicationId: doc._id, status: doc.status });
    res.status(201).json(doc);
  }),
);
applicationRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const status = applicationStatuses.includes(req.body.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ message: 'Invalid application status' });
    const app = await Application.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const from = app.status;
    app.status = status;
    if (from !== status) {
      app.statusHistory.push({ from, to: status, changedAt: new Date() } as any);
      await notify(req.user!.id, 'Application status updated', `${app.company} ${app.title} moved to ${status}`, { applicationId: app._id, status });
    }
    await app.save();
    res.json(app);
  }),
);
applicationRouter.patch('/:id', asyncHandler(async (req, res) => { const input = applicationSchema.partial().parse(req.body); const doc = await Application.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, input, { new: true }); if (!doc) return res.status(404).json({ message: 'Application not found' }); res.json(doc); }));
