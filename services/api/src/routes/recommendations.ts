import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { Internship } from '../models/Internship';
import { Profile } from '../models/Profile';
import { asyncHandler } from '../utils/asyncHandler';
import { matchInternship } from '../services/matching';

export const recommendationRouter = Router();
recommendationRouter.use(requireAuth);
recommendationRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ userId: req.user!.id });
    const profileSkills = (profile?.skills ?? []).map((skill: any) => skill.name);
    const roles = profile?.preferences?.roles ?? [];
    const items = await Internship.find({ isActive: true }).limit(100);
    const ranked = items
      .map((internship) => ({
        ...internship.toObject(),
        ...matchInternship(profileSkills, internship.skills, roles, internship.title),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);
    res.json(ranked);
  }),
);
