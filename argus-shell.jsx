/* ARGUS — App shell: sidebar nav, top status bar, atmosphere */
const { Panel, Pill } = window.argusUtils;
const { useState: useS, useEffect: useE, useRef: useR } = React;

/* ── Module icon glyphs ─────────────────────────────────────────────── */
const MODULE_ICONS = {
  overview:  '◈',
  sentinel:  '◉',
  veil:      '◬',
  oracle:    '⬡',
  identity:  '⊚',
  skynet:    '⬢',
  response:  '⚡',
  intel:     '⊛',
  gaze:      '◎',
  nexus:     '⬡',
  phantom:   '◫',
  breach:    '⚠',
};

/* ── Live alert counts per module ───────────────────────────────────── */
const MODULE_ALERTS = {
  sentinel:  18,
  oracle:    3,
  response:  2,
  veil:      1,
};

/* ── Threat level config ─────────────────────────────────────────────── */
const THREAT_LEVELS = {
  CRITICAL: { color: '#e15c6b', bg: 'rgba(225,92,107,0.08)', label: 'CRITICAL' },
  ELEVATED: { color: '#e89a4a', bg: 'rgba(232,154,74,0.08)', label: 'ELEVATED' },
  GUARDED:  { color: '#d4af37', bg: 'rgba(212,175,55,0.08)', label: 'GUARDED'  },
  LOW:      { color: '#5dba89', bg: 'rgba(93,186,137,0.08)', label: 'LOW'       },
};

/* ── Alert ticker messages ───────────────────────────────────────────── */
const TICKER_MSGS = [
  'APT-41 lateral movement detected — East cluster node 144.12.0.33',
  'VEIL flagged spear-phish campaign targeting Finance — 4 recipients',
  'Anomalous login: user jsmith from TOR exit node 185.220.101.47',
  'Oracle correlated 3 low-severity events → HIGH composite threat',
  'Cloud misconfiguration detected: S3 bucket argus-prod publicly readable',
  'Response playbook ISOLATE executed on host WIN-SRV-04',
  'Identity: privilege escalation attempt blocked — user contractor_22',
];

function Sidebar({ active, setActive }) {
  const groups = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'overview',  name: 'Overview',     sub: 'System Intelligence' },
        { id: 'sentinel',  name: 'Sentinel',     sub: 'Threat Monitoring'   },
        { id: 'veil',      name: 'Veil',         sub: 'Phishing Cognition'  },
        { id: 'oracle',    name: 'Oracle',       sub: 'Attack Correlation'  },
      ],
    },
    {
      label: 'INFRASTRUCTURE',
      items: [
        { id: 'identity',  name: 'Identity',     sub: 'Trust & Behavior'    },
        { id: 'skynet',    name: 'Skynet',       sub: 'Cloud Posture'       },
        { id: 'response',  name: 'Response',     sub: 'Containment'         },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'intel',     name: 'Threat Intel', sub: 'Global Feed'         },
        { id: 'gaze',      name: 'GAZE',         sub: 'Omnisearch · OSINT'  },
      ],
    },
    {
      label: 'ADVANCED',
      items: [
        { id: 'nexus',    name: 'Nexus',     sub: 'Agent Orchestrator' },
        { id: 'phantom',  name: 'Phantom',   sub: 'Deception Network'  },
        { id: 'breach',   name: 'Breach-IQ', sub: 'Quantitative Risk'  },
      ],
    },
  ];

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'linear-gradient(180deg, rgba(8,11,16,0.95), rgba(5,7,10,0.98))',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* logo */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(212,175,55,0.15), transparent 70%)' }}>
          <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="rgba(212,175,55,0.5)" strokeWidth="0.8" />
            <circle cx="16" cy="16" r="9"  stroke="rgba(159,196,232,0.4)" strokeWidth="0.6" strokeDasharray="1 1.5" />
            <circle cx="16" cy="16" r="4.5" stroke="#d4af37" strokeWidth="1.1" />
            <circle cx="16" cy="16" r="1.6" fill="#d4af37" />
            <line x1="16" y1="1"  x2="16" y2="5"  stroke="#d4af37" strokeWidth="0.9" />
            <line x1="16" y1="27" x2="16" y2="31" stroke="#d4af37" strokeWidth="0.9" />
            <line x1="1"  y1="16" x2="5"  y2="16" stroke="#d4af37" strokeWidth="0.9" />
            <line x1="27" y1="16" x2="31" y2="16" stroke="#d4af37" strokeWidth="0.9" />
            <line x1="5.5" y1="5.5"   x2="8"   y2="8"   stroke="rgba(212,175,55,0.45)" strokeWidth="0.6" />
            <line x1="24"  y1="24"    x2="26.5" y2="26.5" stroke="rgba(212,175,55,0.45)" strokeWidth="0.6" />
            <line x1="5.5" y1="26.5"  x2="8"   y2="24"  stroke="rgba(212,175,55,0.45)" strokeWidth="0.6" />
            <line x1="24"  y1="8"     x2="26.5" y2="5.5" stroke="rgba(212,175,55,0.45)" strokeWidth="0.6" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '0.22em', color: '#ecf0f5' }} className="glow-text">ARGUS</div>
          <div className="label" style={{ fontSize: 8, marginTop: 2, color: 'var(--gold-soft)' }}>DEFENSE INTELLIGENCE</div>
        </div>

        {/* global alert badge */}
        <div style={{ marginLeft: 'auto', background: 'rgba(225,92,107,0.15)', border: '1px solid rgba(225,92,107,0.35)', borderRadius: 3, padding: '2px 7px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e15c6b', fontFamily: 'JetBrains Mono', lineHeight: 1 }}>24</span>
          <span style={{ fontSize: 7, color: 'rgba(225,92,107,0.7)', letterSpacing: '0.12em', marginTop: 1 }}>ALERTS</span>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 14 }}>
            <div className="label" style={{ padding: '5px 16px 5px', fontSize: 8, color: 'var(--ink-4)', letterSpacing: '0.22em' }}>{g.label}</div>
            {g.items.map(it => {
              const alertCount = MODULE_ALERTS[it.id];
              const icon = MODULE_ICONS[it.id] || '◆';
              return (
                <div key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`} onClick={() => setActive(it.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', position: 'relative' }}>
                  {/* icon */}
                  <div className="nav-icon" style={{
                    width: 28, height: 28, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                    color: active === it.id ? 'var(--gold)' : 'var(--ink-3)',
                    background: active === it.id ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active === it.id ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 4,
                    transition: 'all 0.2s',
                  }}>{icon}</div>

                  {/* label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: active === it.id ? 600 : 400, color: active === it.id ? 'var(--ink-1)' : 'var(--ink-2)' }}>{it.name}</div>
                    <div style={{ fontSize: 8, letterSpacing: '0.14em', color: 'var(--ink-4)', marginTop: 2, textTransform: 'uppercase' }}>{it.sub}</div>
                  </div>

                  {/* alert badge */}
                  {alertCount && (
                    <span style={{
                      minWidth: 18, height: 16, borderRadius: 3,
                      background: alertCount >= 10 ? 'rgba(225,92,107,0.18)' : 'rgba(232,154,74,0.18)',
                      border: `1px solid ${alertCount >= 10 ? 'rgba(225,92,107,0.4)' : 'rgba(232,154,74,0.4)'}`,
                      color: alertCount >= 10 ? '#e15c6b' : '#e89a4a',
                      fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px',
                    }}>{alertCount}</span>
                  )}

                  {/* active dot */}
                  {active === it.id && <span className="dot" style={{ background: 'var(--gold)', boxShadow: '0 0 8px rgba(212,175,55,0.6)', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* system health mini-bar */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span className="label" style={{ fontSize: 8, color: 'var(--ink-4)' }}>SYSTEM HEALTH</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#5dba89', fontFamily: 'JetBrains Mono' }}>98.5%</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '98.5%', background: 'linear-gradient(90deg, #5dba89, #9fc4e8)', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {[['ML', '99%', '#5dba89'], ['NET', '97%', '#9fc4e8'], ['DB', '100%', '#5dba89']].map(([l, v, c]) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, padding: '3px 0' }}>
              <div style={{ fontSize: 7, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>{l}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* operator footer */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 3, background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(159,196,232,0.08))', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontWeight: 700, fontSize: 11, fontFamily: 'JetBrains Mono' }}>RK</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-1)', fontWeight: 600 }}>R. Kapoor</div>
            <div className="label" style={{ fontSize: 8, marginTop: 2 }}>L5 · SENIOR ANALYST</div>
          </div>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5dba89', boxShadow: '0 0 6px rgba(93,186,137,0.8)', display: 'block', animation: 'breathe 2s ease-in-out infinite' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="pill" style={{ background: 'rgba(93,186,137,0.06)', border: '1px solid rgba(93,186,137,0.2)', color: '#7ec99a', fontSize: 9 }}>
            <span className="dot live" /> SECURE UPLINK
          </span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>v4.2.0</span>
        </div>
      </div>
    </aside>
  );
}

function StatusBar({ time }) {
  const [tickIdx, setTickIdx] = useS(0);
  const [tickVisible, setTickVisible] = useS(true);

  useE(() => {
    const iv = setInterval(() => {
      setTickVisible(false);
      setTimeout(() => {
        setTickIdx(i => (i + 1) % TICKER_MSGS.length);
        setTickVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const threat = THREAT_LEVELS.ELEVATED;

  return (
    <div style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}>
      {/* threat band strip */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${threat.color} 20%, ${threat.color} 80%, transparent 100%)`,
        animation: 'sweep-line 3s ease-in-out infinite',
        boxShadow: `0 0 8px ${threat.color}`,
      }} />

      {/* main status bar */}
      <header style={{
        height: 46,
        borderBottom: '1px solid var(--line)',
        background: `linear-gradient(180deg, ${threat.bg} 0%, rgba(8,11,16,0.85) 100%)`,
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', padding: '0 18px', gap: 16,
      }}>
        {/* ARGUS status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
            <span className="dot live" style={{ background: 'var(--gold)', boxShadow: '0 0 10px rgba(212,175,55,0.7)' }} />
            <span style={{ position: 'absolute', inset: -4, border: '1px solid rgba(212,175,55,0.3)', borderRadius: '50%', animation: 'signal-pulse 2.4s ease-out infinite' }} />
          </span>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.3em', fontWeight: 700, color: '#ecf0f5' }}>ARGUS</span>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.22em', fontWeight: 600, color: 'var(--gold)' }}>ACTIVE</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--line-2)', flexShrink: 0 }} />

        {/* threat level badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(232,154,74,0.1)', border: '1px solid rgba(232,154,74,0.3)', borderRadius: 4, padding: '3px 10px', flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e89a4a', boxShadow: '0 0 6px rgba(232,154,74,0.8)', display: 'block', animation: 'breathe 1.8s ease-in-out infinite' }} />
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: '#e89a4a', fontWeight: 700 }}>ELEVATED</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--line-2)', flexShrink: 0 }} />

        {/* metrics row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10 }} className="mono">
          <Metric label="COGNITION" value="98.5%" tone="good" />
          <Metric label="THREATS" value="18" tone="crit" />
          <Metric label="INCIDENTS" value="3" tone="warn" />
          <Metric label="ASSETS" value="14,328" tone="info" />
          <Metric label="COVERAGE" value="99.2%" tone="good" />
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--line-2)', flexShrink: 0 }} />

        {/* alert ticker */}
        <div style={{
          flex: 1, minWidth: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 8, letterSpacing: '0.18em', color: '#e89a4a', fontWeight: 700, fontFamily: 'JetBrains Mono', flexShrink: 0 }}>◈ INTEL</span>
          <div style={{
            flex: 1, minWidth: 0,
            fontSize: 9.5, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            opacity: tickVisible ? 1 : 0,
            transition: 'opacity 0.4s',
            letterSpacing: '0.04em',
          }}>
            {TICKER_MSGS[tickIdx]}
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--line-2)', flexShrink: 0 }} />

        {/* telemetry bars + clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[3, 6, 4, 8, 5, 7, 4, 6, 5].map((h, i) => (
              <div key={i} style={{ width: 2, height: h, background: 'var(--gold)', opacity: 0.35 + (i % 3) * 0.22, borderRadius: 1, animation: `breathe ${1.5 + i * 0.18}s ease-in-out infinite` }} />
            ))}
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: '0.18em', color: 'var(--ink-4)', marginLeft: 7 }}>TELEMETRY</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--line-2)' }} />
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', color: 'var(--ink-2)' }}>
            {window.argusUtils.fmtTime(time)} <span style={{ color: 'var(--ink-4)' }}>UTC</span>
          </div>
        </div>
      </header>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const color = tone === 'crit' ? '#e15c6b' : tone === 'warn' ? '#e89a4a' : tone === 'good' ? '#5dba89' : '#9fc4e8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ color: 'var(--ink-4)', letterSpacing: '0.15em', fontSize: 8.5 }}>{label}</span>
      <span style={{ color, fontWeight: 700, letterSpacing: '0.04em', textShadow: `0 0 8px ${color}40` }}>{value}</span>
    </div>
  );
}

window.argusShell = { Sidebar, StatusBar };
