import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Internship, Notice } from '../types';
import { money } from '../utils/format';
import { NoticeBox } from './NoticeBox';
import { useState } from 'react';

export function InternshipCard({ job, recruiter = false }: { job: Internship; recruiter?: boolean }) {
  const [notice, setNotice] = useState<Notice>(null);
  async function track(status: 'saved' | 'applied') {
    try {
      await api.post('/applications', { internshipId: job._id, company: job.company, title: job.title, sourceUrl: job.sourceUrl, status });
      setNotice({ type: 'success', text: status === 'saved' ? 'Saved to tracker' : 'Application tracked' });
    } catch (err: any) { setNotice({ type: 'error', text: err.response?.data?.message ?? 'Could not update application' }); }
  }
  return <section className="card internship-card"><div className="card-head"><div><b>{job.title}</b><p>{job.company} · {job.location || 'Remote'} · {job.workMode || 'remote'}</p></div>{job.matchScore !== undefined && <span className="pill">{job.matchScore}% match</span>}</div><p>{job.description}</p><p className="muted">{money(job.stipendMin, job.stipendMax, job.currency)}</p><div className="chips">{job.skills?.slice(0, 6).map((skill) => <span key={skill}>{skill}</span>)}</div><NoticeBox notice={notice} /><div className="actions"><Link className="button secondary" to={`/internships/${job._id}`}>View details</Link>{recruiter ? <Link className="button secondary" to={`/internships/${job._id}/edit`}>Edit</Link> : <><button onClick={() => track('saved')}>Save</button><button onClick={() => track('applied')}>Track applied</button>{job.sourceUrl && <a href={job.sourceUrl} target="_blank" rel="noreferrer">External apply</a>}</>}</div></section>;
}
