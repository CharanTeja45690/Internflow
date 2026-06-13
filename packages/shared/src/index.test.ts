import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationSchema, internshipSchema, registerSchema } from './index';

test('registerSchema accepts a valid student registration', () => {
  const parsed = registerSchema.parse({ email: 'student@example.com', password: 'password123', fullName: 'Demo Student' });
  assert.equal(parsed.role, 'student');
});

test('internshipSchema applies production-safe defaults', () => {
  const parsed = internshipSchema.parse({ company: 'InternFlow', title: 'SDE Intern', description: 'Build product', source: 'manual', sourceUrl: 'https://example.com/apply' });
  assert.equal(parsed.workMode, 'remote');
  assert.equal(parsed.currency, 'INR');
  assert.equal(parsed.isActive, true);
});

test('applicationSchema rejects unsupported statuses', () => {
  assert.throws(() => applicationSchema.parse({ company: 'InternFlow', title: 'SDE Intern', status: 'unknown' }));
});
