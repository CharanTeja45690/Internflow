import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { Application } from '../models/Application';
import { Internship } from '../models/Internship';
import { Profile } from '../models/Profile';
import { Resume } from '../models/Resume';
import { asyncHandler } from '../utils/asyncHandler';
import { matchInternship, missingSkills } from '../services/matching';

const copilotSchema = z.object({ message: z.string().min(2).max(1200) });

function sentenceList(items: string[]) {
  return items.length ? items.join(', ') : 'none yet';
}

export const copilotRouter = Router();
copilotRouter.use(requireAuth);

copilotRouter.get('/context', asyncHandler(async (req, res) => {
  const [profile, latestResume, applications, internships] = await Promise.all([
    Profile.findOne({ userId: req.user!.id }),
    Resume.findOne({ userId: req.user!.id }).sort({ createdAt: -1 }),
    Application.find({ userId: req.user!.id }).sort({ updatedAt: -1 }).limit(10),
    Internship.find({ isActive: true }).sort({ createdAt: -1 }).limit(50),
  ]);
  const profileSkills = (profile?.skills ?? []).map((skill) => skill.name).filter((skill): skill is string => typeof skill === 'string' && skill.length > 0);
  const roles = profile?.preferences?.roles ?? [];
  const recommendations = internships
    .map((internship) => ({ ...internship.toObject(), ...matchInternship(profileSkills, internship.skills, roles, internship.title) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  res.json({ profile, latestResume, applications, recommendations });
}));

copilotRouter.post('/chat', asyncHandler(async (req, res) => {
  const { message } = copilotSchema.parse(req.body);
  const [profile, latestResume, applications, internships] = await Promise.all([
    Profile.findOne({ userId: req.user!.id }),
    Resume.findOne({ userId: req.user!.id }).sort({ createdAt: -1 }),
    Application.find({ userId: req.user!.id }).sort({ updatedAt: -1 }).limit(10),
    Internship.find({ isActive: true }).sort({ createdAt: -1 }).limit(50),
  ]);
  const profileSkills = (profile?.skills ?? []).map((skill) => skill.name).filter((skill): skill is string => typeof skill === 'string' && skill.length > 0);
  const roles = profile?.preferences?.roles ?? [];
  const ranked = internships
    .map((internship) => ({ ...internship.toObject(), ...matchInternship(profileSkills, internship.skills, roles, internship.title) }))
    .sort((a, b) => b.matchScore - a.matchScore);
  const top = ranked[0];
  const topGaps = top ? missingSkills(profileSkills, top.skills).slice(0, 4) : [];
  const resumeScore = latestResume?.analysis?.resumeScore ?? 0;
  const pipeline = applications.reduce<Record<string, number>>((acc, application) => {
    acc[application.status] = (acc[application.status] ?? 0) + 1;
    return acc;
  }, {});
  const lower = message.toLowerCase();
  const focus = lower.includes('interview')
    ? 'Practice a 60-second project story, prepare two metrics-backed achievements, and write three questions for the recruiter.'
    : lower.includes('resume')
      ? 'Start with resume keywords from your top target role, then rewrite bullets to include action, scope, and measurable result.'
      : lower.includes('skill')
        ? `Prioritize these skill gaps first: ${sentenceList(topGaps)}.`
        : 'Focus on one strong resume revision, five matched applications, and one interview-practice session this week.';
  res.json({
    reply: `Based on your profile (${sentenceList(profileSkills.slice(0, 8))}), resume score (${resumeScore}), and application pipeline (${JSON.stringify(pipeline)}), I recommend: ${focus} ${top ? `Your strongest current opportunity is ${top.title} at ${top.company} with a ${top.matchScore}% match.` : 'Add preferences or upload a resume to unlock stronger recommendations.'}`,
    suggestions: ['Improve my resume bullets', 'Find internships that match me', 'Build a skill-gap roadmap', 'Prepare for a behavioral interview'],
  });
}));
