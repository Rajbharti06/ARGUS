/* ARGUS — App shell: sidebar nav, top status bar, atmosphere */
const { Panel, Pill } = window.argusUtils;
const { useState: useS, useEffect: useE } = React;

function Sidebar({ active, setActive }) {
  const groups = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'overview',  name: 'Overview',   sub: 'System Intelligence' },
        { id: 'sentinel',  name: 'Sentinel',   sub: 'Threat Monitoring' },
        { id: 'veil',      name: 'Veil',       sub: 'Phishing Cognition' },
        { id: 'oracle',    name: 'Oracle',     sub: 'Attack Correlation' },
      ],
    },
    {
      label: 'INFRASTRUCTURE',
      items: [
        { id: 'identity',  name: 'Identity',   sub: 'Trust & Behavior' },
        { id: 'skynet',    name: 'Skynet',     sub: 'Cloud Posture' },
        { id: 'response',  name: 'Response',   sub: 'Containment' },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'intel',     name: 'Threat Intel', sub: 'Global Feed' },
      ],
    },
    {
      label: 'ADVANCED',
      items: [
        { id: 'nexus',   name: 'Nexus',     sub: 'Agent Orchestrator' },
        { id: 'phantom', name: 'Phantom',   sub: 'Deception Network' },
        { id: 'breach',  name: 'Breach-IQ', sub: 'Quantitative Risk' },
      ],
    },
  ];
  return (
    <aside style={{
      width: 232, flexShrink: 0,
      background: 'linear-gradient(180deg, rgba(8,11,16,0.92), rgba(5,7,10,0.95))',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* logo */}
      <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ position: 'relative', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)' }}>
          <svg viewBox="0 0 32 32" width="30" height="30" fill="none">
            <circle cx="16" cy="16" r="13" stroke="rgba(212,175,55,0.6)" strokeWidth="0.8" />
            <circle cx="16" cy="16" r="9" stroke="rgba(159,196,232,0.5)" strokeWidth="0.6" strokeDasharray="1 1.5" />
            <circle cx="16" cy="16" r="4.5" stroke="#d4af37" strokeWidth="1" />
            <circle cx="16" cy="16" r="1.6" fill="#d4af37" />
            <line x1="16" y1="1" x2="16" y2="5" stroke="#d4af37" strokeWidth="0.8" />
            <line x1="16" y1="27" x2="16" y2="31" stroke="#d4af37" strokeWidth="0.8" />
            <line x1="1" y1="16" x2="5" y2="16" stroke="#d4af37" strokeWidth="0.8" />
            <line x1="27" y1="16" x2="31" y2="16" stroke="#d4af37" strokeWidth="0.8" />
            <line x1="5.5" y1="5.5" x2="8" y2="8" stroke="rgba(212,175,55,0.5)" strokeWidth="0.6" />
            <line x1="24" y1="24" x2="26.5" y2="26.5" stroke="rgba(212,175,55,0.5)" strokeWidth="0.6" />
            <line x1="5.5" y1="26.5" x2="8" y2="24" stroke="rgba(212,175,55,0.5)" strokeWidth="0.6" />
            <line x1="24" y1="8" x2="26.5" y2="5.5" stroke="rgba(212,175,55,0.5)" strokeWidth="0.6" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '0.22em', color: '#ecf0f5' }} className="glow-text">ARGUS</div>
          <div className="label" style={{ fontSize: 8, marginTop: 2, color: 'var(--gold-soft)' }}>DEFENSE INTELLIGENCE</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 0' }}>
        {groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 16 }}>
            <div className="label" style={{ padding: '6px 16px', fontSize: 8.5, color: 'var(--ink-4)' }}>{g.label}</div>
            {g.items.map(it => (
              <div key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`} onClick={() => setActive(it.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11 }}>{it.name}</div>
                  <div style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginTop: 2, fontWeight: 400, textTransform: 'uppercase' }}>{it.sub}</div>
                </div>
                {active === it.id && <span className="dot" style={{ background: 'var(--gold)', boxShadow: '0 0 8px rgba(212,175,55,0.6)' }} />}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* operator footer */}
      <div style={{ borderTop: '1px solid var(--line)', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 2, background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(159,196,232,0.08))', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontWeight: 700, fontSize: 11, fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>RK</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-1)', fontWeight: 500 }}>R. Kapoor</div>
            <div className="label" style={{ fontSize: 8, marginTop: 2 }}>L5 · ANALYST</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="pill" style={{ background: 'rgba(93, 186, 137,0.06)', border: '1px solid rgba(93, 186, 137,0.2)', color: '#7ec99a' }}>
            <span className="dot live" /> UPLINK
          </span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>v4.2.0</span>
        </div>
      </div>
    </aside>
  );
}

function StatusBar({ time }) {
  return (
    <header style={{
      height: 44,
      borderBottom: '1px solid var(--line)',
      background: 'rgba(8,11,16,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', padding: '0 18px', gap: 18, flexShrink: 0,
      position: 'relative', zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
          <span className="dot live" style={{ background: 'var(--gold)', boxShadow: '0 0 10px rgba(212,175,55,0.7)' }} />
          <span style={{ position: 'absolute', inset: -4, border: '1px solid rgba(212,175,55,0.3)', borderRadius: '50%', animation: 'signal-pulse 2.4s ease-out infinite' }} />
        </span>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.32em', fontWeight: 700, color: '#ecf0f5' }}>ARGUS CORE</span>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', fontWeight: 600, color: 'var(--gold)' }}>ACTIVE</span>
      </div>
      <div style={{ width: 1, height: 16, background: 'var(--line-2)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 10 }} className="mono">
        <Metric label="POSTURE" value="ELEVATED" tone="warn" />
        <Metric label="COGNITION" value="98.5%" tone="good" />
        <Metric label="ACTIVE THREATS" value="18" tone="crit" />
        <Metric label="INCIDENTS OPEN" value="3" tone="warn" />
        <Metric label="ASSETS" value="14,328" tone="info" />
      </div>

      <div style={{ flex: 1 }} />

      {/* right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[3, 6, 4, 8, 5, 7, 4, 6].map((h, i) => (
            <div key={i} style={{ width: 2, height: h, background: 'var(--gold)', opacity: 0.4 + (i % 3) * 0.2, animation: `breathe ${1.5 + i * 0.2}s ease-in-out infinite` }} />
          ))}
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-3)', marginLeft: 8 }}>TELEMETRY SYNC</span>
        </div>
        <div style={{ width: 1, height: 16, background: 'var(--line-2)' }} />
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'var(--ink-2)' }}>
          {window.argusUtils.fmtTime(time)} <span style={{ color: 'var(--ink-4)' }}>UTC</span>
        </div>
      </div>
    </header>
  );
}

function Metric({ label, value, tone }) {
  const color = tone === 'crit' ? '#e15c6b' : tone === 'warn' ? '#e89a4a' : tone === 'good' ? '#5dba89' : '#9fc4e8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--ink-4)', letterSpacing: '0.18em', fontSize: 9 }}>{label}</span>
      <span style={{ color, fontWeight: 600, letterSpacing: '0.04em' }}>{value}</span>
    </div>
  );
}

window.argusShell = { Sidebar, StatusBar };
