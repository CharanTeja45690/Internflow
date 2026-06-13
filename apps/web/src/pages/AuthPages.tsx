import { Link, Navigate, useLocation } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { AuthPayload, Notice, Role } from '../types';
import { NoticeBox } from '../components/NoticeBox';

function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, isAuthenticated, role: currentRole } = useAuth();
  const location = useLocation();
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState(mode === 'login' ? 'student@example.com' : '');
  const [password, setPassword] = useState(mode === 'login' ? 'password123' : '');
  const [fullName, setFullName] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  if (isAuthenticated) return <Navigate to={currentRole === 'recruiter' ? '/recruiter' : '/student'} replace />;
  async function submit(e: FormEvent) { e.preventDefault(); setNotice(null); try { const body = mode === 'register' ? { email, password, fullName, role } : { email, password }; const { data } = await api.post<AuthPayload>(`/auth/${mode}`, body); login(data); } catch (err: any) { setNotice({ type: 'error', text: err.response?.data?.message ?? 'Authentication failed' }); } }
  return <div className="auth"><form onSubmit={submit}><h1>{mode === 'login' ? 'Welcome back' : 'Create your InternFlow account'}</h1><p className="muted">{location.pathname === '/register' ? 'Start matching students and internships.' : 'Sign in to continue.'}</p><NoticeBox notice={notice} />{mode === 'register' && <><input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" /><label>Account type<select value={role} onChange={(e) => setRole(e.target.value as Role)}><option value="student">Student</option><option value="recruiter">Recruiter</option></select></label></>}<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /><button>Continue</button>{mode === 'login' && <Link to="/forgot-password">Forgot password?</Link>}<Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Need an account?' : 'Have an account?'}</Link></form></div>;
}
export function LoginPage() { return <AuthForm mode="login" />; }
export function RegisterPage() { return <AuthForm mode="register" />; }
