import { FormEvent, useEffect, useState } from 'react';
import { EmptyState } from '../components/LoadingState';
import { NoticeBox } from '../components/NoticeBox';
import { api } from '../lib/api';
import type { Application, ApplicationStatus, Notice } from '../types';
import { statuses } from '../utils/format';

const emptyForm = { title: '', company: '', sourceUrl: '', notes: '', status: 'saved' as ApplicationStatus };

export function ApplicationTrackingPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState<Notice>(null);
  useEffect(() => { api.get('/applications').then((r) => setApps(r.data)); }, []);
  async function update(id: string, status: ApplicationStatus) {
    const { data } = await api.patch(`/applications/${id}/status`, { status });
    setApps(apps.map((a) => a._id === id ? data : a));
  }
  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, sourceUrl: form.sourceUrl || undefined, notes: form.notes || undefined };
      const { data } = await api.post('/applications', payload);
      setApps([data, ...apps]);
      setForm(emptyForm);
      setNotice({ type: 'success', text: 'Application added to tracker' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.response?.data?.message ?? 'Could not add application' });
    }
  }
  return <><div className="page-title"><div><h1>Application Tracker</h1><p className="muted">Move opportunities through each step of your internship pipeline.</p></div></div><form className="panel compact-form" onSubmit={create}><NoticeBox notice={notice} /><h2>Add manual application</h2><div className="form-grid"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Role title" /><input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" /><input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="Apply URL" /><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></div><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes, contacts, or next steps" /><button>Add application</button></form>{apps.length ? <div className="kanban">{statuses.map((s) => <section key={s}><h3>{s}</h3>{apps.filter((a) => a.status === s).map((a) => <div className="mini" key={a._id}><b>{a.title}</b><p>{a.company}</p>{a.notes && <p>{a.notes}</p>}{a.sourceUrl && <a href={a.sourceUrl} target="_blank" rel="noreferrer">Apply link</a>}<select value={a.status} onChange={(e) => update(a._id, e.target.value as ApplicationStatus)}>{statuses.map((x) => <option key={x}>{x}</option>)}</select></div>)}</section>)}</div> : <EmptyState title="No tracked applications"><p>Save, track, or manually add an internship to start your pipeline.</p></EmptyState>}</>;
}
