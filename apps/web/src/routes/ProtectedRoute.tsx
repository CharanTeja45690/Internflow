import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to={role === 'recruiter' ? '/recruiter' : '/student'} replace />;
  return <Outlet />;
}
