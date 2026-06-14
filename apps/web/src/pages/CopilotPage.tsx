import { FormEvent, useEffect, useState } from 'react';
import { EmptyState, LoadingState } from '../components/LoadingState';
import { NoticeBox } from '../components/NoticeBox';
import { api } from '../lib/api';
import type { Internship, Notice, Resume } from '../types';

type CopilotMessage = { id: string; role: 'assistant' | 'user'; content: string };
type CopilotContext = { latestResume?: Resume | null; recommendations: Internship[]; applications: { _id: string; title: string; company: string; status: string }[] };

const starterPrompts = ['What should I do this week?', 'How can I improve my resume?', 'Which skills should I learn first?', 'Help me prepare for an interview'];

export function CopilotPage() {
  const [context, setContext] = useState<CopilotContext | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([{ id: 'welcome', role: 'assistant', content: 'Hi, I’m your InternFlow copilot. I can use your resume, profile, applications, and recommended internships to suggest next steps.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    api.get<CopilotContext>('/copilot/context').then((response) => setContext(response.data)).catch(() => setNotice({ type: 'error', text: 'Could not load copilot context' }));
  }, []);

  async function send(message: string) {
    if (!message.trim()) return;
    const userMessage: CopilotMessage = { id: crypto.randomUUID(), role: 'user', content: message.trim() };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post<{ reply: string; suggestions: string[] }>('/copilot/chat', { message: userMessage.content });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: data.reply }]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotice({ type: 'error', text: error.response?.data?.message ?? 'Copilot could not respond' });
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return <div className="copilot-layout"><section className="copilot-chat panel"><div className="page-title"><div><p className="eyebrow">AI Career Copilot</p><h1>Resume-aware career guidance</h1><p className="muted">Ask for internship recommendations, skill roadmaps, resume feedback, or interview prep.</p></div></div><NoticeBox notice={notice} /><div className="prompt-row">{starterPrompts.map((prompt) => <button className="button secondary" type="button" key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}</div><div className="messages" aria-live="polite">{messages.map((message) => <article className={`message ${message.role}`} key={message.id}><span>{message.role === 'assistant' ? 'IF' : 'You'}</span><p>{message.content}</p></article>)}{loading && <article className="message assistant"><span>IF</span><p className="typing">Thinking through your career context…</p></article>}</div><form className="chat-input" onSubmit={submit}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask your copilot for a next step…" /><button disabled={loading}>{loading ? 'Sending' : 'Send'}</button></form></section><aside className="context-panel"><h2>Context</h2>{context ? <><div className="insight-card"><small>Latest resume score</small><strong>{context.latestResume?.analysis?.resumeScore ?? 0}</strong></div><div className="insight-card"><small>Recommended roles</small>{context.recommendations.length ? context.recommendations.slice(0, 3).map((job) => <p key={job._id}>{job.title} · {job.matchScore ?? 0}%</p>) : <EmptyState title="No matches yet" />}</div><div className="insight-card"><small>Recent pipeline</small>{context.applications.length ? context.applications.slice(0, 4).map((application) => <p key={application._id}>{application.title} · {application.status}</p>) : <p className="muted">No tracked applications yet.</p>}</div></> : <LoadingState label="Loading context…" />}</aside></div>;
}
