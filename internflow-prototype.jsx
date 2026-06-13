import { useState, useRef, useEffect } from "react";

const T = {
  bg: "#F6F6F4",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFAF8",
  ink: "#141414",
  secondary: "#525252",
  muted: "#8C8C8C",
  dim: "#B5B5B5",
  border: "#E8E8E5",
  borderSubtle: "#F0F0ED",
  indigo: "#4F46E5",
  indigoSoft: "#EEF2FF",
  indigoMid: "#C7D2FE",
  emerald: "#059669",
  emeraldSoft: "#ECFDF5",
  amber: "#D97706",
  amberSoft: "#FFFBEB",
  rose: "#E11D48",
  roseSoft: "#FFF1F2",
  violet: "#7C3AED",
  violetSoft: "#F5F3FF",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
  radius: 10,
  radiusSm: 6,
  radiusLg: 14,
};

const Label = ({ children, style }) => (
  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, ...style }}>{children}</span>
);

const Pill = ({ children, color = T.indigo, bg = T.indigoSoft }) => (
  <span style={{ display: "inline-block", fontSize: 11, fontWeight: 500, color, background: bg, padding: "3px 10px", borderRadius: 20 }}>{children}</span>
);

const Card = ({ children, style, ...props }) => (
  <div style={{ background: T.surface, borderRadius: T.radiusLg, boxShadow: T.shadow, padding: 24, ...style }} {...props}>{children}</div>
);

const Ic = ({ d, size = 18, color = "currentColor", stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const icons = {
  home: <><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z"/><path d="M9 21V12h6v9"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>,
  file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>,
  bot: <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/><path d="M12 8v3"/></>,
  chart: <><path d="M18 20V10M12 20V4M6 20v-6"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></>,
  layers: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
  zap: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
  check: <path d="M20 6L9 17l-5-5"/>,
  up: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  send: <><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  rocket: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></>,
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
};

const navItems = [
  { id: "dashboard", icon: "home", label: "Home" },
  { id: "discover", icon: "search", label: "Discover" },
  { id: "resume", icon: "file", label: "Resume" },
  { id: "tracker", icon: "briefcase", label: "Tracker" },
  { id: "copilot", icon: "bot", label: "Copilot" },
  { id: "analytics", icon: "chart", label: "Analytics" },
  { id: "profile", icon: "user", label: "Profile" },
  { id: "stack", icon: "layers", label: "Stack" },
];

function Arc({ value, size = 120, strokeW = 6, color = T.indigo }) {
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.borderSubtle} strokeWidth={strokeW} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
    </svg>
  );
}

function Bar({ value, color = T.indigo, height = 4 }) {
  return (
    <div style={{ height, background: T.borderSubtle, borderRadius: height, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: height, transition: "width 0.6s ease" }} />
    </div>
  );
}

function Dashboard({ go }) {
  const metrics = [
    { label: "Career Score", value: "82", change: "+8", color: T.indigo },
    { label: "Applications", value: "24", change: "+3 this week", color: T.emerald },
    { label: "Interviews", value: "6", change: "2 upcoming", color: T.violet },
    { label: "Offer Rate", value: "8.3%", change: "above avg", color: T.amber },
  ];
  const matches = [
    { co: "Razorpay", role: "SDE Intern", match: 91, tags: ["React","Node.js"], city: "Bangalore", time: "3d" },
    { co: "Zerodha", role: "Backend Intern", match: 85, tags: ["Python","PostgreSQL"], city: "Bangalore", time: "5d" },
    { co: "Cred", role: "Frontend Intern", match: 88, tags: ["Next.js","Tailwind"], city: "Bangalore", time: "7d" },
    { co: "Postman", role: "API Platform Intern", match: 78, tags: ["REST","JavaScript"], city: "Remote", time: "10d" },
  ];
  const timeline = [
    { t: "Resume score reached 82", sub: "Top 23% of applicants", ago: "2h", dot: T.emerald },
    { t: "New match: Cred — Frontend", sub: "88% match score", ago: "5h", dot: T.indigo },
    { t: "Razorpay viewed your application", sub: "Applied 4 days ago", ago: "1d", dot: T.violet },
    { t: "Skill gap report updated", sub: "Docker +12% recommended", ago: "2d", dot: T.amber },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 14, color: T.muted, margin: "0 0 4px" }}>Good morning</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Your career at a glance</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {metrics.map(m => (
          <Card key={m.label} style={{ padding: "20px 22px" }}>
            <Label>{m.label}</Label>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: T.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.value}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: m.color }}>{m.change}</span>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Label>Top matches</Label>
            <button onClick={() => go("discover")} style={{ background: "none", border: "none", color: T.indigo, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>See all</button>
          </div>
          {matches.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderTop: i > 0 ? `1px solid ${T.borderSubtle}` : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: T.radius, background: T.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: T.indigo, flexShrink: 0 }}>{m.co[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{m.role}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{m.co} · {m.city}</div>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {m.tags.map(t => <Pill key={t}>{t}</Pill>)}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, minWidth: 50 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.match >= 85 ? T.emerald : T.indigo }}>{m.match}%</div>
                <div style={{ fontSize: 11, color: T.dim }}>{m.time} left</div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <Label style={{ marginBottom: 20, display: "block" }}>Activity</Label>
          <div style={{ position: "relative", paddingLeft: 18 }}>
            <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: T.borderSubtle }} />
            {timeline.map((e, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < timeline.length - 1 ? 22 : 0 }}>
                <div style={{ position: "absolute", left: -14, top: 5, width: 8, height: 8, borderRadius: "50%", background: e.dot, border: `2px solid ${T.surface}` }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{e.t}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{e.sub}</div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>{e.ago}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Discover() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");
  const tags = ["All","Startup","Remote","Paid","Tech","Design"];
  const data = [
    { co: "Razorpay", role: "SDE Intern", city: "Bangalore", pay: "₹40K/mo", match: 91, skills: ["React","Node.js","TypeScript"], type: "Fintech", dead: "Jun 20", color: T.indigo },
    { co: "Zerodha", role: "Backend Intern", city: "Bangalore", pay: "₹35K/mo", match: 85, skills: ["Python","PostgreSQL","Redis"], type: "Fintech", dead: "Jun 25", color: T.emerald },
    { co: "Cred", role: "Frontend Intern", city: "Bangalore", pay: "₹45K/mo", match: 88, skills: ["React","Tailwind","Next.js"], type: "Fintech", dead: "Jul 1", color: T.violet },
    { co: "Postman", role: "API Platform Intern", city: "Remote", pay: "₹30K/mo", match: 78, skills: ["REST","Testing","JS"], type: "DevTools", dead: "Jun 28", color: T.amber },
    { co: "Slice", role: "Full Stack Intern", city: "Remote", pay: "₹25K/mo", match: 72, skills: ["Vue.js","Django","AWS"], type: "Startup", dead: "Jul 5", color: T.rose },
    { co: "Meesho", role: "Data Intern", city: "Bangalore", pay: "₹38K/mo", match: 65, skills: ["Python","SQL","Pandas"], type: "Commerce", dead: "Jul 3", color: T.emerald },
  ];
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Discover opportunities</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>AI-matched from 200+ companies</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.dim }}><Ic d={icons.search} size={16} /></div>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search roles, companies, skills..." style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 40px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, fontSize: 14, color: T.ink, outline: "none" }} />
        </div>
        {tags.map(t => (
          <button key={t} onClick={() => setActive(t)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: active === t ? T.ink : T.surface, color: active === t ? "#fff" : T.secondary, fontSize: 13, fontWeight: 500, cursor: "pointer", boxShadow: active !== t ? T.shadow : "none" }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {data.map((d, i) => (
          <Card key={i} style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ padding: "22px 24px 18px" }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: T.radius, background: `${d.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, color: d.color, flexShrink: 0 }}>{d.co[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{d.role}</div>
                  <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{d.co} · {d.type}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: d.match >= 85 ? T.emerald : d.match >= 75 ? T.indigo : T.secondary, lineHeight: 1 }}>{d.match}<span style={{ fontSize: 12, fontWeight: 500 }}>%</span></div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.muted, marginBottom: 14 }}>
                <span>{d.city}</span><span>{d.pay}</span><span>Due {d.dead}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {d.skills.map(s => <Pill key={s}>{s}</Pill>)}
              </div>
            </div>
            <div style={{ display: "flex", borderTop: `1px solid ${T.borderSubtle}` }}>
              <button style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderRight: `1px solid ${T.borderSubtle}`, color: T.indigo, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Apply</button>
              <button style={{ flex: 1, padding: "12px 0", background: "none", border: "none", color: T.muted, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>Save</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Resume() {
  const [tab, setTab] = useState("breakdown");
  const tabs = ["breakdown","skills","feedback"];
  const breakdown = [
    { label: "Skills Coverage", v: 85 },{ label: "Project Quality", v: 78 },{ label: "Experience Depth", v: 72 },
    { label: "Education", v: 90 },{ label: "ATS Compatibility", v: 88 },{ label: "Formatting", v: 80 },
  ];
  const skills = [
    { name: "React", pct: 88, cat: "Frontend" },{ name: "Node.js", pct: 82, cat: "Backend" },
    { name: "TypeScript", pct: 75, cat: "Language" },{ name: "PostgreSQL", pct: 70, cat: "Database" },
    { name: "Python", pct: 65, cat: "Language" },{ name: "Docker", pct: 45, cat: "DevOps" },
    { name: "AWS", pct: 30, cat: "Cloud" },{ name: "System Design", pct: 25, cat: "Concepts" },
  ];
  const feedback = [
    { good: false, text: "Add quantifiable metrics to project descriptions — \"reduced load time by 40%\" is stronger than \"optimized performance\"" },
    { good: false, text: "Docker and cloud skills are below industry median for backend roles. Consider a hands-on project." },
    { good: true, text: "Frontend skills profile is well above the 80th percentile for SDE interns." },
    { good: true, text: "ATS format is clean — all sections properly labeled and parseable by automated systems." },
    { good: false, text: "Add a system design or architecture project to show scalability thinking." },
  ];
  const colorFor = v => v >= 80 ? T.emerald : v >= 60 ? T.amber : T.rose;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Resume Intelligence</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>AI-powered scoring and improvement</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <Card style={{ textAlign: "center", padding: "32px 24px" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
            <Arc value={82} size={140} strokeW={7} color={T.indigo} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: T.ink, letterSpacing: "-0.04em", lineHeight: 1 }}>82</span>
              <span style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>of 100</span>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>Resume Score</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Top 23% of applicants</div>
          <div style={{ marginTop: 16 }}><Pill color={T.emerald} bg={T.emeraldSoft}>+8 from last upload</Pill></div>
          <button style={{ marginTop: 24, width: "100%", padding: "12px 0", background: T.indigo, border: "none", borderRadius: T.radius, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Upload new resume</button>
        </Card>
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 18, background: T.surfaceAlt, borderRadius: T.radius, padding: 4, width: "fit-content" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: T.radiusSm, border: "none", background: tab === t ? T.surface : "transparent", boxShadow: tab === t ? T.shadow : "none", color: tab === t ? T.ink : T.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
          {tab === "breakdown" && <Card>{breakdown.map((b, i) => (<div key={i} style={{ marginBottom: i < breakdown.length - 1 ? 20 : 0 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 14, color: T.ink, fontWeight: 500 }}>{b.label}</span><span style={{ fontSize: 14, fontWeight: 700, color: colorFor(b.v) }}>{b.v}</span></div><Bar value={b.v} color={colorFor(b.v)} height={5} /></div>))}</Card>}
          {tab === "skills" && <Card>{skills.map((s, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: i < skills.length - 1 ? 16 : 0 }}><span style={{ fontSize: 11, color: T.dim, width: 60, textAlign: "right" }}>{s.cat}</span><span style={{ fontSize: 14, color: T.ink, width: 110, fontWeight: 500 }}>{s.name}</span><div style={{ flex: 1 }}><Bar value={s.pct} color={colorFor(s.pct)} height={6} /></div><span style={{ fontSize: 13, fontWeight: 700, color: colorFor(s.pct), width: 40, textAlign: "right" }}>{s.pct}</span></div>))}</Card>}
          {tab === "feedback" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{feedback.map((f, i) => (<Card key={i} style={{ padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}><div style={{ width: 24, height: 24, borderRadius: "50%", background: f.good ? T.emeraldSoft : T.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}><Ic d={f.good ? icons.check : icons.zap} size={13} color={f.good ? T.emerald : T.amber} stroke={2.5} /></div><span style={{ fontSize: 14, color: T.secondary, lineHeight: 1.6 }}>{f.text}</span></Card>))}</div>}
        </div>
      </div>
    </div>
  );
}

function Tracker() {
  const cols = [
    { name: "Saved", dot: T.dim, items: [{ co: "Google", role: "SWE Intern" }, { co: "Flipkart", role: "Backend Intern" }] },
    { name: "Applied", dot: T.indigo, items: [{ co: "Razorpay", role: "SDE Intern" }, { co: "Cred", role: "Frontend" }, { co: "Meesho", role: "Data Intern" }] },
    { name: "Assessment", dot: T.amber, items: [{ co: "Postman", role: "API Intern" }] },
    { name: "Interview", dot: T.violet, items: [{ co: "Zerodha", role: "Backend" }] },
    { name: "Offer", dot: T.emerald, items: [] },
  ];
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Application tracker</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Kanban board for your pipeline</p>
      </div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {cols.map(c => (
          <div key={c.name} style={{ minWidth: 210, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "0 4px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name}</span>
              <span style={{ fontSize: 11, color: T.dim, marginLeft: "auto", background: T.surfaceAlt, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{c.items.length}</span>
            </div>
            <div style={{ background: T.surfaceAlt, borderRadius: T.radiusLg, padding: 8, minHeight: 160 }}>
              {c.items.map((it, i) => (
                <Card key={i} style={{ padding: "14px 16px", marginBottom: 8, cursor: "grab" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{it.role}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{it.co}</div>
                </Card>
              ))}
              {c.items.length === 0 && <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: T.dim }}>Drop here</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Copilot() {
  const [input, setInput] = useState("");
  const msgs = [
    { from: "bot", text: "Hi Arjun. I have your resume, applications, and skill data loaded. What can I help with?" },
    { from: "user", text: "What internships am I best suited for right now?" },
    { from: "bot", text: "Your strongest axis is frontend engineering — React (88%) and TypeScript (75%) put you in the top quartile.\n\nI'd prioritize frontend/SDE intern roles at product companies like Cred, Razorpay, and Swiggy where your match scores are 85–91%.\n\nFor pure backend roles requiring Docker/AWS (your scores: 45% and 30%), I'd suggest picking up Docker basics first." },
    { from: "user", text: "How do I get my resume score above 90?" },
    { from: "bot", text: "Three moves that get you there:\n\n→ Add metrics to projects — estimated +4 points\n→ Add one system design project — +3 points\n→ Get a free AWS or Docker cert — +2–3 points\n\nThat puts you at 91–92. Want me to draft improved bullet points?" },
  ];
  const prompts = ["What should I learn next?", "Draft a cover letter", "Compare me to requirements", "30-day learning plan"];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Career Copilot</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Context-aware guidance from your resume and market data</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
            {m.from === "bot" && <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 4, flexShrink: 0 }}><Ic d={icons.bot} size={15} color={T.indigo} stroke={2} /></div>}
            <div style={{ maxWidth: "75%", padding: "14px 18px", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line", borderRadius: m.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.from === "user" ? T.indigo : T.surface, color: m.from === "user" ? "#fff" : T.secondary, boxShadow: m.from === "user" ? "none" : T.shadow }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {prompts.map((p, i) => <button key={i} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{p}</button>)}
      </div>
      <div style={{ display: "flex", gap: 10, background: T.surface, borderRadius: T.radiusLg, boxShadow: T.shadowMd, padding: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your career..." style={{ flex: 1, padding: "12px 16px", background: "transparent", border: "none", fontSize: 14, color: T.ink, outline: "none" }} />
        <button style={{ width: 42, height: 42, borderRadius: T.radius, background: T.indigo, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={icons.send} size={16} /></button>
      </div>
    </div>
  );
}

function Analytics() {
  const funnel = [
    { stage: "Viewed", n: 142, w: 100 },{ stage: "Saved", n: 48, w: 34 },{ stage: "Applied", n: 24, w: 17 },
    { stage: "Assessment", n: 8, w: 6 },{ stage: "Interview", n: 6, w: 4.2 },{ stage: "Offer", n: 2, w: 1.4 },
  ];
  const scores = [{ m: "Jan", v: 58 },{ m: "Feb", v: 63 },{ m: "Mar", v: 68 },{ m: "Apr", v: 74 },{ m: "May", v: 78 },{ m: "Jun", v: 82 }];
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Career analytics</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Conversion rates, score trends, and performance</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <Label style={{ display: "block", marginBottom: 20 }}>Application funnel</Label>
          {funnel.map((f, i) => (<div key={i} style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, color: T.secondary }}>{f.stage}</span><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{f.n}</span></div><div style={{ height: 8, background: T.borderSubtle, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${f.w}%`, height: "100%", background: T.indigo, borderRadius: 4, opacity: 1 - i * 0.12, minWidth: f.w > 0 ? 6 : 0 }} /></div></div>))}
        </Card>
        <Card>
          <Label style={{ display: "block", marginBottom: 20 }}>Career score over time</Label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200, padding: "0 8px" }}>
            {scores.map((s, i) => {
              const h = ((s.v - 40) / 60) * 170;
              return (<div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: T.indigo }}>{s.v}</span><div style={{ width: "55%", height: h, background: `linear-gradient(180deg, ${T.indigo}, ${T.indigoMid})`, borderRadius: "6px 6px 2px 2px" }} /><span style={{ fontSize: 11, color: T.dim }}>{s.m}</span></div>);
            })}
          </div>
        </Card>
      </div>
      <Card style={{ marginTop: 20 }}>
        <Label style={{ display: "block", marginBottom: 20 }}>Key metrics</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[{ label: "Interview Rate", value: "25%", sub: "6 of 24 applications" },{ label: "Offer Rate", value: "8.3%", sub: "2 offers received" },{ label: "Avg Response", value: "4.2d", sub: "application to reply" },{ label: "Profile Views", value: "18", sub: "by recruiters this month" }].map((m, i) => (
            <div key={i} style={{ padding: "16px 18px", background: T.surfaceAlt, borderRadius: T.radius }}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.ink, marginTop: 6, letterSpacing: "-0.03em" }}>{m.value}</div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProfilePage() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Profile</h1></div>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <Card style={{ textAlign: "center", padding: "32px 24px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, fontWeight: 700, color: "#fff" }}>A</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>Arjun Sharma</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>B.Tech CSE · 3rd Year</div>
          <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>IIT Delhi</div>
          <div style={{ marginTop: 20, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: T.muted }}>Completeness</span><span style={{ fontSize: 12, fontWeight: 600, color: T.emerald }}>87%</span></div>
            <Bar value={87} color={T.emerald} height={4} />
          </div>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {["React","Node.js","TypeScript","Python","PostgreSQL","Git"].map(s => <Pill key={s}>{s}</Pill>)}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[{ title: "Education", icon: icons.star, items: [{ main: "B.Tech Computer Science", sub: "IIT Delhi · 2023–2027 · CGPA 8.7" }] },
            { title: "Projects", icon: icons.layers, items: [{ main: "E-Commerce Platform", sub: "React, Node.js, MongoDB — full-stack" },{ main: "Real-Time Chat App", sub: "Socket.io, Redis — 500+ concurrent" }] },
            { title: "Experience", icon: icons.briefcase, items: [{ main: "Frontend Developer (Freelance)", sub: "3 SaaS landing pages · Jan–Apr 2026" }] },
            { title: "Certifications", icon: icons.shield, items: [{ main: "AWS Cloud Practitioner", sub: "Mar 2026" },{ main: "Meta Frontend Developer", sub: "Dec 2025" }] },
          ].map(sec => (
            <Card key={sec.title} style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><Ic d={sec.icon} size={15} color={T.indigo} /><Label>{sec.title}</Label></div>
              {sec.items.map((it, i) => (<div key={i} style={{ marginBottom: i < sec.items.length - 1 ? 14 : 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{it.main}</div><div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>{it.sub}</div></div>))}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackPage() {
  const cats = [
    { title: "Frontend", items: [{ need: "Hosting + SSR", pick: "Vercel Free", limit: "100GB BW, serverless, auto-HTTPS", alt: "Netlify, Cloudflare Pages" },{ need: "UI Library", pick: "shadcn/ui + Tailwind", limit: "Open-source, unlimited", alt: "Radix, Headless UI" }] },
    { title: "Backend", items: [{ need: "Node.js API", pick: "Render Free", limit: "750 hrs/mo, auto-deploy", alt: "Railway Free, Fly.io" },{ need: "Python Workers", pick: "HuggingFace Spaces", limit: "Free CPU instances", alt: "Render workers" }] },
    { title: "Database", items: [{ need: "PostgreSQL", pick: "Neon Free", limit: "0.5GB, auto-suspend", alt: "Supabase (500MB)" },{ need: "Vector Search", pick: "pgvector on Neon", limit: "Included free", alt: "Qdrant Cloud Free" },{ need: "Cache / Queue", pick: "Upstash Redis", limit: "10K cmd/day, 256MB", alt: "Redis Cloud (30MB)" }] },
    { title: "AI & LLM", items: [{ need: "Resume Parse", pick: "Ollama + Llama 3.1", limit: "Self-hosted, unlimited", alt: "LM Studio, LocalAI" },{ need: "Copilot LLM", pick: "Groq Free API", limit: "14.4K tok/min, Llama 70B", alt: "Together.ai, OpenRouter" },{ need: "Embeddings", pick: "HF Inference API", limit: "30K chars/mo", alt: "Ollama local" },{ need: "Fallback", pick: "Gemini API Free", limit: "15 RPM, 1M tok/day", alt: "Mistral free tier" }] },
    { title: "Storage", items: [{ need: "Files", pick: "Cloudflare R2", limit: "10GB, 10M reads, $0 egress", alt: "Supabase Storage" },{ need: "Images", pick: "Cloudinary Free", limit: "25K transforms", alt: "Uploadthing" }] },
    { title: "Auth", items: [{ need: "Auth + OAuth", pick: "NextAuth.js", limit: "Self-hosted, unlimited", alt: "Supabase Auth (50K)" },{ need: "SSL", pick: "Cloudflare / LE", limit: "Unlimited, auto-renew", alt: "Vercel auto-SSL" }] },
    { title: "Scraping", items: [{ need: "Crawlers", pick: "Playwright + Cheerio", limit: "Open-source", alt: "Puppeteer, Scrapy" },{ need: "Scheduler", pick: "GitHub Actions", limit: "2K min/mo free", alt: "cron-job.org" }] },
    { title: "Notifications", items: [{ need: "Email", pick: "Resend Free", limit: "3K emails/mo", alt: "Brevo (300/day)" },{ need: "Push", pick: "Firebase FCM", limit: "Unlimited", alt: "OneSignal (10K)" }] },
    { title: "DevOps", items: [{ need: "CI/CD", pick: "GitHub Actions", limit: "Public unlimited", alt: "GitLab CI" },{ need: "Monitoring", pick: "Grafana Cloud", limit: "10K metrics, 50GB logs", alt: "Betterstack" },{ need: "Errors", pick: "Sentry Free", limit: "5K errors/mo", alt: "GlitchTip" },{ need: "Analytics", pick: "PostHog Free", limit: "1M events/mo", alt: "Umami" }] },
    { title: "CDN & DNS", items: [{ need: "CDN + DDoS", pick: "Cloudflare Free", limit: "Unlimited bandwidth", alt: "Vercel Edge" },{ need: "Domain", pick: "*.vercel.app", limit: "Free subdomain", alt: "*.pages.dev" }] },
  ];
  const verification = [
    { mod: "Authentication", plan: "Module 1", zip: "Part 2 — Module 1", s: "match" },{ mod: "Student Profile", plan: "Core Journey", zip: "Part 2 — Module 2", s: "expand" },
    { mod: "Resume Intelligence", plan: "Module 2", zip: "Part 2 — M3 + Part 5", s: "expand" },{ mod: "Internship Discovery", plan: "Module 1", zip: "Part 2 — M4+M13", s: "expand" },
    { mod: "Match Engine", plan: "Module 3", zip: "Part 2 — M6 + Part 5", s: "expand" },{ mod: "Application Tracker", plan: "Module 4", zip: "Part 2 — M5+M7", s: "expand" },
    { mod: "AI Copilot", plan: "Module 5", zip: "Part 2 — M8 + Part 5", s: "expand" },{ mod: "Skill Gap", plan: "In Module 5", zip: "Part 2 — M9", s: "expand" },
    { mod: "Career Score", plan: "Module 7", zip: "Part 2 — M10", s: "match" },{ mod: "Analytics", plan: "Module 6", zip: "Part 2 — M11", s: "expand" },
    { mod: "Success Prediction", plan: "—", zip: "Part 2 — M12", s: "new" },{ mod: "Startup Discovery", plan: "Module 8", zip: "Part 2 — M13", s: "match" },
    { mod: "Notifications", plan: "Mentioned", zip: "Part 6 — M14", s: "expand" },{ mod: "College Dashboard", plan: "Phase 9", zip: "Part 2 — M15", s: "expand" },
    { mod: "Recruiter Dashboard", plan: "Phase 8", zip: "Part 2 — M16", s: "match" },{ mod: "Database Design", plan: "Sec 9", zip: "Part 4 — DDL+RLS", s: "expand" },
    { mod: "Scraping", plan: "Sec 11", zip: "Part 6 §24", s: "expand" },{ mod: "DevOps/Security", plan: "Sec 13", zip: "Part 7", s: "expand" },
  ];
  const dotColor = s => s === "match" ? T.emerald : s === "expand" ? T.indigo : T.amber;
  const dotLabel = s => s === "match" ? "Matched" : s === "expand" ? "Expanded" : "New";

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em" }}>Zero-cost infrastructure</h1>
          <span style={{ fontSize: 22, fontWeight: 700, color: T.emerald }}>$0<span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>/mo</span></span>
        </div>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Every service mapped to a free tier — production-grade for 1,000+ users</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {cats.map(cat => (
          <Card key={cat.title} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Label>{cat.title}</Label>
              <Pill color={T.emerald} bg={T.emeraldSoft}>Free</Pill>
            </div>
            <div style={{ padding: "8px 20px 16px" }}>
              {cat.items.map((it, i) => (
                <div key={i} style={{ padding: "12px 0", borderTop: i > 0 ? `1px solid ${T.borderSubtle}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: T.secondary, fontWeight: 500 }}>{it.need}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.indigo }}>{it.pick}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.dim }}>{it.limit}</div>
                  <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>Alt: {it.alt}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <Label style={{ display: "block", marginBottom: 18 }}>Verification — Zip vs Master plan</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {verification.map((v, i) => (
            <div key={i} style={{ padding: "10px 14px", background: T.surfaceAlt, borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>{v.mod}</div>
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 2 }}>Plan: {v.plan}</div>
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>Zip: {v.zip}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor(v.s) }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: dotColor(v.s) }}>{dotLabel(v.s)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 16, borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 14 }}>
          {[["match", "Matched 1:1"], ["expand", "Expanded"], ["new", "New addition"]].map(([s, l]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor(s) }} />
              <span style={{ fontSize: 12, color: T.muted }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const render = () => {
    switch (page) {
      case "dashboard": return <Dashboard go={setPage} />;
      case "discover": return <Discover />;
      case "resume": return <Resume />;
      case "tracker": return <Tracker />;
      case "copilot": return <Copilot />;
      case "analytics": return <Analytics />;
      case "profile": return <ProfilePage />;
      case "stack": return <StackPage />;
      default: return <Dashboard go={setPage} />;
    }
  };
  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif", WebkitFontSmoothing: "antialiased", overflow: "hidden" }}>
      <div style={{ width: 220, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.indigo, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={icons.rocket} size={14} color="#fff" /></div>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: "-0.03em" }}>InternFlow</span>
        </div>
        <div style={{ flex: 1, padding: "8px 10px" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", borderRadius: T.radiusSm, border: "none", cursor: "pointer", marginBottom: 2, background: page === n.id ? T.indigoSoft : "transparent", color: page === n.id ? T.indigo : T.secondary, fontSize: 14, fontWeight: page === n.id ? 600 : 400, textAlign: "left" }}>
              <Ic d={icons[n.icon]} size={17} color={page === n.id ? T.indigo : T.muted} stroke={page === n.id ? 2 : 1.5} />
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "16px 14px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: T.radius }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly cost</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: T.emerald, marginTop: 4, letterSpacing: "-0.03em" }}>$0</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>All free-tier services</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "28px 36px" }}>{render()}</div>
    </div>
  );
}
