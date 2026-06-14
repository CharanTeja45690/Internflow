import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Notification = { _id: string; title: string; message?: string; readAt?: string };

export function Layout() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => { api.get('/notifications').then((r) => setNotifications(r.data)).catch(() => undefined); }, []);
  const nav = role === 'admin' ? [{ to: '/admin', label: 'Admin' }, { to: '/profile', label: 'Profile' }] : role === 'recruiter' ? [{ to: '/recruiter', label: 'Dashboard' }, { to: '/internships/new', label: 'Post internship' }, { to: '/applications', label: 'Applications' }, { to: '/profile', label: 'Profile' }] : [{ to: '/student', label: 'Dashboard' }, { to: '/internships', label: 'Discover' }, { to: '/resume', label: 'Resume analysis' }, { to: '/copilot', label: 'AI Copilot' }, { to: '/applications', label: 'Tracker' }, { to: '/profile', label: 'Profile' }];
  return <div className="shell"><aside><div className="brand"><h2>InternFlow</h2><p className="muted">{role} portal</p></div><nav>{nav.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/internships'}>{item.label}</NavLink>)}</nav><div className="sidebar-footer"><small>{user?.email}</small><button onClick={() => { logout(); navigate('/login'); }}>Logout</button></div></aside><main><header className="topbar"><h1>InternFlow</h1><span className="pill">{notifications.filter((n) => !n.readAt).length} alerts</span><span className="pill">{role}</span></header>{notifications[0] && <div className="info"><b>{notifications[0].title}</b> {notifications[0].message}</div>}<Outlet /></main></div>;
}
