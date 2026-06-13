const KNOWN_SKILLS = [
  'javascript','typescript','react','node.js','express','mongodb','python','sql','postgresql','aws','docker','git','html','css','java','c++','go','redis','graphql','next.js','tailwind','figma','excel','machine learning','data analysis'
];

export function normalizeSkill(skill: string) {
  return skill.trim().toLowerCase();
}

export function matchScore(profileSkills: string[] = [], roleSkills: string[] = [], preferredRoles: string[] = [], title = '') {
  const required = roleSkills.map(normalizeSkill).filter(Boolean);
  if (!required.length) return 50;
  const profile = new Set(profileSkills.map(normalizeSkill));
  const matches = required.filter((skill) => profile.has(skill)).length;
  const skillScore = Math.round((matches / required.length) * 70) + 20;
  const roleBoost = preferredRoles.some((role) => title.toLowerCase().includes(role.toLowerCase())) ? 8 : 0;
  return Math.max(0, Math.min(99, skillScore + roleBoost));
}

export function missingSkills(profileSkills: string[] = [], roleSkills: string[] = []) {
  const profile = new Set(profileSkills.map(normalizeSkill));
  return roleSkills.filter((skill) => !profile.has(normalizeSkill(skill)));
}

export function analyzeResumeText(text: string) {
  const lower = text.toLowerCase();
  const skills = KNOWN_SKILLS.filter((skill) => lower.includes(skill));
  const hasContact = /@|linkedin\.com|github\.com/i.test(text);
  const hasMetrics = /\b\d+%|\b\d+x|\b\d+\+/.test(text);
  const sections = ['experience', 'education', 'projects', 'skills'].filter((section) => lower.includes(section));
  const atsIssues = [
    text.length < 800 ? 'Resume appears short; add measurable project, internship, and leadership impact.' : '',
    !hasContact ? 'Add email plus LinkedIn/GitHub or portfolio links near the top.' : '',
    sections.length < 3 ? 'Use clear sections for Education, Skills, Projects, and Experience.' : '',
    !hasMetrics ? 'Quantify outcomes with numbers such as users, latency, revenue, or accuracy improvements.' : '',
  ].filter(Boolean);
  const resumeScore = Math.min(95, 35 + skills.length * 4 + sections.length * 7 + (hasContact ? 8 : 0) + (hasMetrics ? 10 : 0) + (text.length > 1200 ? 10 : 0));
  return {
    resumeScore,
    skillMatrix: skills.map((name) => ({ name, confidence: 0.82 })),
    atsIssues,
    recommendations: [
      'Mirror the top skills from target internships in your skills and project bullets.',
      'Lead bullets with action verbs and measurable outcomes.',
      'Keep formatting simple for ATS parsing and include links to proof-of-work.',
    ],
  };
}
