import { createContext, useContext, useMemo, useState } from 'react';
import { clearAuth, storeAuth } from '../lib/api';
import type { AuthPayload, AuthUser, Role } from '../types';

type AuthContextValue = { token: string | null; user: AuthUser | null; role: Role; isAuthenticated: boolean; login: (payload: AuthPayload) => void; logout: () => void };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState<AuthUser | null>(() => JSON.parse(localStorage.getItem('currentUser') || 'null'));
  const role: Role = user?.roles?.includes('recruiter') ? 'recruiter' : 'student';
  const value = useMemo(() => ({ token, user, role, isAuthenticated: Boolean(token), login(payload: AuthPayload) { storeAuth(payload); setToken(payload.accessToken); setUser(payload.user ?? null); }, logout() { clearAuth(); setToken(null); setUser(null); } }), [token, user, role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used inside AuthProvider'); return ctx; }
