import { useEffect, useState } from 'react';
import { EmptyState } from '../components/LoadingState';
import { api } from '../lib/api';
import type { Application, ApplicationStatus } from '../types';
import { statuses } from '../utils/format';

export function ApplicationTrackingPage() { const [apps, setApps] = useState<Application[]>([]); useEffect(() => { api.get('/applications').then((r) => setApps(r.data)); }, []); async function update(id: string, status: ApplicationStatus) { const { data } = await api.patch(`/applications/${id}/status`, { status }); setApps(apps.map((a) => a._id === id ? data : a)); } return <><div className="page-title"><div><h1>Application Tracker</h1><p className="muted">Move opportunities through each step of your internship pipeline.</p></div></div>{apps.length ? <div className="kanban">{statuses.map((s) => <section key={s}><h3>{s}</h3>{apps.filter((a) => a.status === s).map((a) => <div className="mini" key={a._id}><b>{a.title}</b><p>{a.company}</p>{a.notes && <p>{a.notes}</p>}<select value={a.status} onChange={(e) => update(a._id, e.target.value as ApplicationStatus)}>{statuses.map((x) => <option key={x}>{x}</option>)}</select></div>)}</section>)}</div> : <EmptyState title="No tracked applications"><p>Save or track an internship to start your pipeline.</p></EmptyState>}</>; }
