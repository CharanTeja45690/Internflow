import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { Internship } from '../models/Internship';
import { Profile } from '../models/Profile';
import { asyncHandler } from '../utils/asyncHandler';
import { matchInternship } from '../services/matching';

export const skillGapRouter = Router();
skillGapRouter.use(requireAuth);

skillGapRouter.get('/', asyncHandler(async (req, res) => {
  const [profile, internships] = await Promise.all([
    Profile.findOne({ userId: req.user!.id }),
    Internship.find({ isActive: true }).limit(100),
  ]);
  const profileSkills = (profile?.skills ?? []).map((skill) => skill.name).filter((skill): skill is string => typeof skill === 'string' && skill.length > 0);
  const roles = profile?.preferences?.roles ?? [];
  const matched = internships.map((internship) => ({ internship, result: matchInternship(profileSkills, internship.skills, roles, internship.title) }));
  const missingFrequency = new Map<string, number>();
  matched.forEach(({ result }) => result.missingSkills.forEach((skill) => missingFrequency.set(skill, (missingFrequency.get(skill) ?? 0) + 1)));
  const priorities = [...missingFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, demandCount], index) => ({
      skill,
      demandCount,
      priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
      roadmap: [`Learn ${skill} fundamentals`, `Build a small ${skill} project`, `Add ${skill} proof-of-work to your resume`],
    }));
  res.json({ profileSkills, priorities, comparedInternships: matched.length });
}));
