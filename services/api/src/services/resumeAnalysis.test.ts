import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResumeText } from './matching';

test('analyzeResumeText extracts skills and ATS issues', () => {
  const text = 'Jane Dev jane@example.com Skills: TypeScript React Node.js MongoDB Projects improved latency by 30% Experience Education';
  const analysis = analyzeResumeText(text);
  assert.ok(analysis.resumeScore > 50);
  assert.ok(analysis.skillMatrix.some((skill) => skill.name === 'typescript'));
  assert.ok(Array.isArray(analysis.atsIssues));
});
