import { z } from 'zod';

export const applicationStatuses = ['saved','applied','assessment','interview','offer','rejected','joined'] as const;
export const workModes = ['remote','hybrid','onsite'] as const;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const profileSchema = z.object({
  fullName: z.string().min(2).optional(), phone: z.string().optional(), location: z.string().optional(), bio: z.string().max(500).optional(),
  education: z.array(z.object({ institution: z.string(), degree: z.string().optional(), fieldOfStudy: z.string().optional(), graduationYear: z.number().optional() })).optional(),
  skills: z.array(z.object({ name: z.string(), proficiencyLevel: z.number().min(1).max(5).default(3), source: z.enum(['manual','resume_extracted']).default('manual') })).optional(),
  preferences: z.object({ roles: z.array(z.string()).default([]), locations: z.array(z.string()).default([]), workModes: z.array(z.enum(workModes)).default([]), minStipend: z.number().optional() }).optional(),
});

export const internshipSchema = z.object({
  company: z.string(), title: z.string(), description: z.string(), requirements: z.array(z.string()).default([]), skills: z.array(z.string()).default([]),
  location: z.string().optional(), workMode: z.enum(workModes).default('remote'), stipendMin: z.number().optional(), stipendMax: z.number().optional(), currency: z.string().default('INR'),
  deadline: z.string().datetime().optional(), source: z.string(), sourceUrl: z.string().url(), difficultyScore: z.number().min(0).max(100).default(50), isActive: z.boolean().default(true),
});

export const applicationSchema = z.object({ internshipId: z.string().optional(), company: z.string(), title: z.string(), sourceUrl: z.string().url().optional(), status: z.enum(applicationStatuses).default('saved'), notes: z.string().optional() });

export type ApplicationStatus = typeof applicationStatuses[number];
