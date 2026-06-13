import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = role === 'recruiter' ? [{ to: '/recruiter', label: 'Dashboard' }, { to: '/internships/new', label: 'Post internship' }, { to: '/applications', label: 'Applications' }, { to: '/profile', label: 'Profile' }] : [{ to: '/student', label: 'Dashboard' }, { to: '/internships', label: 'Discover' }, { to: '/resume', label: 'Resume analysis' }, { to: '/applications', label: 'Tracker' }, { to: '/profile', label: 'Profile' }];
  return <div className="shell"><aside><div className="brand"><h2>InternFlow</h2><p className="muted">{role} portal</p></div><nav>{nav.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/internships'}>{item.label}</NavLink>)}</nav><div className="sidebar-footer"><small>{user?.email}</small><button onClick={() => { logout(); navigate('/login'); }}>Logout</button></div></aside><main><header className="topbar"><h1>InternFlow</h1><span className="pill">{role}</span></header><Outlet /></main></div>;
}
