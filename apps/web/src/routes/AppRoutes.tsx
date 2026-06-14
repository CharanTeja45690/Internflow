import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ApplicationTrackingPage } from '../pages/Applications';
import { LoginPage, RegisterPage } from '../pages/AuthPages';
import { AdminDashboard, RecruiterDashboard, StudentDashboard } from '../pages/Dashboards';
import { InternshipDetailsPage, InternshipFormPage, InternshipListPage } from '../pages/Internships';
import { ProfilePage } from '../pages/ProfilePage';
import { CopilotPage } from '../pages/CopilotPage';
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from '../pages/PasswordPages';
import { ResumePage } from '../pages/ResumePage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/verify-email" element={<VerifyEmailPage />} /><Route element={<ProtectedRoute />}><Route element={<Layout />}><Route index element={<Navigate to="/student" replace />} /><Route element={<ProtectedRoute roles={['student']} />}><Route path="/student" element={<StudentDashboard />} /><Route path="/resume" element={<ResumePage />} /><Route path="/copilot" element={<CopilotPage />} /></Route><Route element={<ProtectedRoute roles={['recruiter']} />}><Route path="/recruiter" element={<RecruiterDashboard />} /><Route path="/internships/new" element={<InternshipFormPage />} /></Route><Route path="/internships" element={<InternshipListPage />} /><Route path="/internships/:id" element={<InternshipDetailsPage />} /><Route path="/internships/:id/edit" element={<ProtectedRoute roles={['recruiter']} />}><Route index element={<InternshipFormPage />} /></Route><Route path="/applications" element={<ApplicationTrackingPage />} /><Route element={<ProtectedRoute roles={['admin']} />}><Route path="/admin" element={<AdminDashboard />} /></Route><Route path="/profile" element={<ProfilePage />} /></Route></Route><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
}
