import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResumeText, matchInternship, matchScore } from './matching';

test('matchScore rewards overlapping skills and scores full overlap', () => {
  assert.equal(matchScore(['React', 'TypeScript'], ['react', 'node.js']), 55);
  assert.equal(matchScore(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'e']), 90);
});

test('analyzeResumeText extracts known skills and adds short-resume guidance', () => {
  const result = analyzeResumeText('React TypeScript Node.js MongoDB');
  assert.ok(result.resumeScore > 45);
  assert.deepEqual(result.skillMatrix.map((skill) => skill.name), ['typescript', 'react', 'node.js', 'mongodb']);
  assert.ok(result.atsIssues.length > 0);
});

test('matchInternship returns match percentage and skill gap analysis', () => {
  const result = matchInternship(['React'], ['React', 'Docker'], ['frontend'], 'Frontend Intern');
  assert.equal(result.matchScore, 63);
  assert.deepEqual(result.missingSkills, ['Docker']);
  assert.equal(result.skillGap.gapCount, 1);
});
