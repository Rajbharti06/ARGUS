/* ARGUS — utility components, atoms, mock data */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDate = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
const ago = (mins) => mins < 1 ? 'now' : mins < 60 ? `${Math.floor(mins)}m` : mins < 1440 ? `${Math.floor(mins/60)}h` : `${Math.floor(mins/1440)}d`;

/* ── Panel ── */
function Panel({ title, sub, right, children, className = '', style = {}, dense = false }) {
  return (
    <div className={`panel ${className}`} style={style}>
      <span className="corner-tick tl" /><span className="corner-tick tr" />
      <span className="corner-tick bl" /><span className="corner-tick br" />
      {(title || right) && (
        <div className="panel-header" style={{ minHeight: dense ? 32 : 38, padding: dense ? '6px 12px' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="label-bright">{title}</span>
            {sub && <span className="label" style={{ fontSize: 9 }}>{sub}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{right}</div>
        </div>
      )}
      <div className="panel-body" style={{ padding: dense ? 10 : 14 }}>{children}</div>
    </div>
  );
}

/* ── Pill ── */
function Pill({ tone = 'info', children, dotPulse = false }) {
  const tones = {
    info:  { bg: 'rgba(159, 196, 232, 0.08)', bd: 'rgba(159, 196, 232, 0.25)', fg: '#bcd2e8' },
    live:  { bg: 'rgba(93, 186, 137, 0.08)',  bd: 'rgba(93, 186, 137, 0.25)',  fg: '#7ec99a' },
    warn:  { bg: 'rgba(232, 154, 74, 0.08)',  bd: 'rgba(232, 154, 74, 0.28)',  fg: '#f0c896' },
    crit:  { bg: 'rgba(225, 92, 107, 0.10)',  bd: 'rgba(225, 92, 107, 0.30)',  fg: '#f0b3ba' },
    ghost: { bg: 'transparent',               bd: 'rgba(148, 163, 184, 0.18)', fg: '#7d8794' },
  };
  const t = tones[tone] || tones.info;
  return (
    <span className="pill" style={{ background: t.bg, border: `1px solid ${t.bd}`, color: t.fg }}>
      {dotPulse && <span className="dot" style={{ background: t.fg, boxShadow: `0 0 6px ${t.fg}`, animation: 'pulse-dot 2s infinite' }} />}
      {children}
    </span>
  );
}

/* ── KPI ── */
function Kpi({ label, value, delta, tone = 'info', sub }) {
  const fg = tone === 'crit' ? '#f0b3ba' : tone === 'warn' ? '#f0c896' : tone === 'good' ? '#7ec99a' : '#dde5ee';
  return (
    <div style={{ padding: '12px 14px', borderRight: '1px solid var(--line)', minWidth: 140 }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="num" style={{ fontSize: 26, fontWeight: 600, color: fg, letterSpacing: '-0.02em' }}>{value}</span>
        {delta && <span className="num" style={{ fontSize: 11, color: tone === 'crit' ? '#e15c6b' : '#7d8794' }}>{delta}</span>}
      </div>
      {sub && <div className="label" style={{ fontSize: 9, marginTop: 6, color: 'var(--ink-3)' }}>{sub}</div>}
    </div>
  );
}

/* ── Sparkline ── */
function Spark({ data, color = '#9fc4e8', height = 28, fill = true }) {
  const w = 120;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`).join(' ');
  const area = `0,${height} ${pts} ${w},${height}`;
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%' }}>
      {fill && <polygon points={area} fill={color} fillOpacity="0.10" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/* ── ARGUS Core (centerpiece) ── */
function ArgusCore({ size = 280, cognition = 98.5 }) {
  const c = size / 2;
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), 60);
    return () => clearInterval(id);
  }, []);
  const nodes = useMemo(() => {
    const arr = [];
    for (let r = 0; r < 3; r++) {
      const radius = 38 + r * 36;
      const count = 6 + r * 3;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + r * 0.3;
        arr.push({ id: `${r}-${i}`, ring: r, angle, radius });
      }
    }
    return arr;
  }, []);
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      {/* rings */}
      <div className="core-ring" style={{ inset: 0, borderColor: 'rgba(159, 196, 232,0.08)', animation: 'ring-rotate 60s linear infinite' }}>
        <div style={{ position: 'absolute', top: -3, left: '50%', width: 6, height: 6, borderRadius: '50%', background: '#9fc4e8', transform: 'translateX(-50%)', boxShadow: '0 0 8px #9fc4e8' }} />
      </div>
      <div className="core-ring" style={{ inset: 24, borderColor: 'rgba(159, 196, 232,0.12)', borderStyle: 'dashed', animation: 'ring-rotate-rev 40s linear infinite' }} />
      <div className="core-ring" style={{ inset: 56, borderColor: 'rgba(159, 196, 232,0.18)', animation: 'ring-rotate 25s linear infinite' }}>
        <div style={{ position: 'absolute', top: -2, left: '50%', width: 4, height: 4, borderRadius: '50%', background: '#e89a4a', transform: 'translateX(-50%)', boxShadow: '0 0 6px #e89a4a' }} />
      </div>
      {/* mesh */}
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
        {nodes.map((n, i) => {
          const x = c + Math.cos(n.angle + t * 0.002 * (n.ring + 1)) * n.radius;
          const y = c + Math.sin(n.angle + t * 0.002 * (n.ring + 1)) * n.radius;
          return <line key={'l'+i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(159, 196, 232,0.08)" strokeWidth="0.5" />;
        })}
        {nodes.map((n, i) => {
          const x = c + Math.cos(n.angle + t * 0.002 * (n.ring + 1)) * n.radius;
          const y = c + Math.sin(n.angle + t * 0.002 * (n.ring + 1)) * n.radius;
          const r = n.ring === 0 ? 2.5 : n.ring === 1 ? 1.8 : 1.4;
          const opacity = n.ring === 0 ? 1 : n.ring === 1 ? 0.7 : 0.45;
          return <circle key={'n'+i} cx={x} cy={y} r={r} fill="#9fc4e8" opacity={opacity} />;
        })}
      </svg>
      {/* center */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: 80, height: 80, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(159, 196, 232,0.25), rgba(93, 146, 196,0.05) 70%)',
        border: '1px solid rgba(159, 196, 232,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'breathe 3s ease-in-out infinite',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--ink-3)' }}>CORE</div>
          <div className="num" style={{ fontSize: 18, fontWeight: 600, color: '#dde5ee', letterSpacing: '-0.02em' }}>{cognition}<span style={{ fontSize: 11, color: 'var(--ink-3)' }}>%</span></div>
          <div className="mono" style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--ink-3)' }}>COGNITION</div>
        </div>
      </div>
      {/* outer signal pulse */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(159, 196, 232,0.4)', animation: 'signal-pulse 4s ease-out infinite', color: '#9fc4e8' }} />
    </div>
  );
}

/* ── Mock data ── */
const NEWS_FEED = [
  { sev: 'CRIT', source: 'Reuters', sector: 'Education', title: 'Canvas LMS breach widens — 8,800+ institutions confirm exposure of student records', time: 7, tags: ['ShinyHunters', 'LMS', 'PII'] },
  { sev: 'HIGH', source: 'CISA',    sector: 'Federal',   title: 'Emergency Directive 26-04: patch CVE-2026-3142 in MOVEit Transfer within 48h', time: 22, tags: ['CVE', 'Patch'] },
  { sev: 'HIGH', source: 'arXiv',   sector: 'Research',  title: 'Adversarial prompt injection bypasses 91% of enterprise email LLM filters (paper)', time: 41, tags: ['AI', 'Phishing'] },
  { sev: 'MED',  source: 'TheHackerNews', sector: 'Healthcare', title: 'Akira ransomware affiliate targets 14 regional medical networks via SonicWall flaw', time: 73, tags: ['Ransomware'] },
  { sev: 'MED',  source: 'SecurityWeek', sector: 'Finance', title: 'Voice-cloning fraud campaign impersonates CFOs across mid-market banks', time: 96, tags: ['Voice', 'BEC'] },
  { sev: 'CRIT', source: 'MITRE',   sector: 'Industrial', title: 'New TTP cluster G1109 — supply-chain compromise via signed driver poisoning', time: 134, tags: ['Supply chain'] },
  { sev: 'INFO', source: 'NIST',    sector: 'Standards', title: 'Post-quantum migration framework draft 2 published for public review', time: 198, tags: ['PQC'] },
  { sev: 'HIGH', source: 'CERT-EU', sector: 'Education', title: 'Coordinated phishing wave targets ~600 university SSO portals across EMEA', time: 245, tags: ['Phishing', 'SSO'] },
];

const THREATS_LIVE = [
  { id: 'T-9842', sev: 'CRIT', kind: 'Credential Harvest', src: '185.220.101.42', target: 'sso.argus-uni.edu', country: 'NL', conf: 96, time: 0.3 },
  { id: 'T-9841', sev: 'HIGH', kind: 'Anomalous Login', src: '203.0.113.77', target: 'finance.argus-uni.edu', country: 'CN', conf: 88, time: 0.8 },
  { id: 'T-9840', sev: 'CRIT', kind: 'PowerShell Execution', src: 'WS-FAC-014', target: 'lab-srv-03', country: 'US', conf: 94, time: 1.4 },
  { id: 'T-9839', sev: 'HIGH', kind: 'Data Exfil Pattern', src: 'WS-FIN-088', target: '45.142.213.190', country: 'RU', conf: 91, time: 2.7 },
  { id: 'T-9838', sev: 'MED',  kind: 'Impossible Travel', src: 'r.kapoor@', target: 'mail.argus-uni.edu', country: 'BR', conf: 76, time: 3.1 },
  { id: 'T-9837', sev: 'MED',  kind: 'Suspicious DNS', src: 'WS-LIB-203', target: 'cdn-update.xyz', country: 'TR', conf: 71, time: 4.5 },
  { id: 'T-9836', sev: 'HIGH', kind: 'Cloud IAM Escalation', src: 'svc-backup', target: 'AWS:s3:argus-research', country: '—', conf: 87, time: 6.2 },
  { id: 'T-9835', sev: 'LOW',  kind: 'Outdated TLS', src: 'legacy-portal-01', target: 'public.argus-uni.edu', country: '—', conf: 99, time: 8.0 },
  { id: 'T-9834', sev: 'MED',  kind: 'Brute Force', src: 'multiple', target: 'vpn.argus-uni.edu', country: 'KP', conf: 82, time: 11.5 },
];

const SEV_TONE = { CRIT: 'crit', HIGH: 'crit', MED: 'warn', LOW: 'info', INFO: 'info' };
const SEV_COLOR = { CRIT: '#e15c6b', HIGH: '#f0738b', MED: '#e89a4a', LOW: '#9fc4e8', INFO: '#9fc4e8' };

window.argusUtils = {
  fmtTime, fmtDate, ago, Panel, Pill, Kpi, Spark, ArgusCore,
  NEWS_FEED, THREATS_LIVE, SEV_TONE, SEV_COLOR,
};
