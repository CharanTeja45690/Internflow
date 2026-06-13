import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResumeText, matchScore } from './matching';

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
