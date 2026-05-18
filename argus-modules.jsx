/* ARGUS — secondary modules */
const { Panel: PP, Pill: PPl, Spark: SP, THREATS_LIVE, SEV_COLOR: SC, ago: A } = window.argusUtils;

/* ════════════════════════════════════════════════════
   SENTINEL — live threat monitoring
══════════════════════════════════════════════════════ */
function Sentinel() {
  const [threats, setThreats] = React.useState(THREATS_LIVE);
  const [selected, setSelected] = React.useState(THREATS_LIVE[0]);
  const [filter, setFilter] = React.useState('ALL');

  React.useEffect(() => {
    const id = setInterval(() => {
      setThreats(prev => {
        const idNum = parseInt(prev[0].id.split('-')[1]) + 1;
        const kinds = ['Anomalous Login', 'PowerShell Execution', 'Suspicious DNS', 'Outbound Beacon', 'Failed MFA', 'New Process Tree', 'Token Replay'];
        const sevs = ['CRIT', 'HIGH', 'HIGH', 'MED', 'MED', 'LOW'];
        const next = {
          id: `T-${idNum}`,
          sev: sevs[Math.floor(Math.random() * sevs.length)],
          kind: kinds[Math.floor(Math.random() * kinds.length)],
          src: `WS-${['FAC', 'LIB', 'FIN', 'ADM'][Math.floor(Math.random() * 4)]}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
          target: ['mail.argus-uni.edu', 'sso.argus-uni.edu', 'finance.argus-uni.edu', 'lab-srv-' + Math.floor(Math.random() * 99)][Math.floor(Math.random() * 4)],
          country: ['CN', 'RU', 'NL', 'BR', 'IN', 'US'][Math.floor(Math.random() * 6)],
          conf: 60 + Math.floor(Math.random() * 38),
          time: 0.1,
        };
        return [next, ...prev.map(p => ({ ...p, time: p.time + 0.06 }))].slice(0, 14);
      });
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const filtered = filter === 'ALL' ? threats : threats.filter(t => t.sev === filter);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <SentinelStats threats={threats} />
        <PP
          title="LIVE THREAT TELEMETRY"
          sub="STREAMING · ALL SOURCES"
          right={<><FilterTabsM value={filter} onChange={setFilter} /><PPl tone="live" dotPulse>STREAMING</PPl></>}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, overflowY: 'auto', margin: '-14px' }}>
            <div className="t-head" style={{ gridTemplateColumns: '70px 60px 180px 1fr 1fr 50px 70px 60px' }}>
              <span>ID</span><span>SEV</span><span>EVENT</span><span>SOURCE</span><span>TARGET</span><span>GEO</span><span>CONF</span><span>AGE</span>
            </div>
            {filtered.map((t, i) => (
              <div key={t.id} className="t-row"
                onClick={() => setSelected(t)}
                style={{
                  gridTemplateColumns: '70px 60px 180px 1fr 1fr 50px 70px 60px',
                  cursor: 'pointer',
                  background: selected?.id === t.id ? 'rgba(159, 196, 232,0.06)' : i === 0 ? 'rgba(159, 196, 232,0.03)' : 'transparent',
                  fontSize: 11.5,
                }}
              >
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{t.id}</span>
                <span className="mono" style={{ color: SC[t.sev], fontWeight: 700, letterSpacing: '0.1em' }}>{t.sev}</span>
                <span style={{ color: 'var(--ink-1)' }}>{t.kind}</span>
                <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 10.5 }}>{t.src}</span>
                <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.target}</span>
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{t.country}</span>
                <span className="mono" style={{ color: t.conf > 90 ? '#f0b3ba' : t.conf > 75 ? '#f0c896' : 'var(--ink-2)' }}>{t.conf}%</span>
                <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10 }}>{A(t.time)}</span>
              </div>
            ))}
          </div>
        </PP>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <ThreatDetail threat={selected} />
        <BehaviorChart />
      </div>
    </div>
  );
}

function SentinelStats({ threats }) {
  const counts = { CRIT: 0, HIGH: 0, MED: 0, LOW: 0 };
  threats.forEach(t => counts[t.sev] !== undefined && counts[t.sev]++);
  const stats = [
    { label: 'CRITICAL', value: counts.CRIT, tone: '#e15c6b', delta: '+2' },
    { label: 'HIGH', value: counts.HIGH, tone: '#f0738b', delta: '+5' },
    { label: 'MEDIUM', value: counts.MED, tone: '#e89a4a', delta: '+3' },
    { label: 'LOW', value: counts.LOW, tone: '#9fc4e8', delta: '+1' },
    { label: 'BLOCKED 24H', value: '1,847', tone: '#7ec99a', delta: '+12%' },
    { label: 'MTTR', value: '4.2m', tone: '#9b9ad8', delta: '-18%' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }} className="panel">
      <span className="corner-tick tl" /><span className="corner-tick tr" /><span className="corner-tick bl" /><span className="corner-tick br" />
      {stats.map((s, i) => (
        <div key={s.label} style={{ padding: '14px 16px', borderRight: i < stats.length - 1 ? '1px solid var(--line)' : 'none' }}>
          <div className="label" style={{ marginBottom: 8 }}>{s.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="num" style={{ fontSize: 24, color: s.tone, fontWeight: 600, letterSpacing: '-0.02em' }}>{s.value}</span>
            <span className="num" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.delta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterTabsM({ value, onChange }) {
  const opts = ['ALL', 'CRIT', 'HIGH', 'MED', 'LOW'];
  return (
    <div style={{ display: 'flex', border: '1px solid var(--line-2)', borderRadius: 2, overflow: 'hidden' }}>
      {opts.map(o => (
        <button key={o} onClick={() => onChange(o)} className="mono"
          style={{ border: 'none', padding: '4px 8px', fontSize: 9, letterSpacing: '0.15em', cursor: 'pointer',
            background: value === o ? 'rgba(159, 196, 232,0.12)' : 'transparent',
            color: value === o ? '#bcd2e8' : 'var(--ink-3)',
            borderRight: '1px solid var(--line)' }}>{o}</button>
      ))}
    </div>
  );
}

function ThreatDetail({ threat }) {
  if (!threat) return null;
  return (
    <PP title="EVENT DETAIL" sub={threat.id} right={<PPl tone={threat.sev === 'CRIT' || threat.sev === 'HIGH' ? 'crit' : 'warn'} dotPulse>{threat.sev}</PPl>}>
      <div style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>EVENT TYPE</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-0)' }}>{threat.kind}</div>
      </div>
      <DetailRow k="SOURCE" v={threat.src} />
      <DetailRow k="TARGET" v={threat.target} />
      <DetailRow k="GEO" v={threat.country} />
      <DetailRow k="CONFIDENCE" v={`${threat.conf}%`} valColor={threat.conf > 90 ? '#f0b3ba' : threat.conf > 75 ? '#f0c896' : null} />
      <DetailRow k="DETECTION ENGINE" v="ARGUS BEHAVIORAL ML v2.4" />
      <DetailRow k="MITRE TECHNIQUE" v="T1078.004 · Cloud Accounts" />

      <div className="hairline" style={{ margin: '14px 0' }} />
      <div className="label" style={{ marginBottom: 8 }}>BEHAVIORAL INDICATORS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { t: 'Login from new ASN (AS9009 · M247)', s: 'CRIT' },
          { t: 'Velocity exceeds baseline (×4.2)', s: 'HIGH' },
          { t: 'TLS fingerprint mismatch', s: 'HIGH' },
          { t: 'No previous sessions in this geo', s: 'MED' },
        ].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: SC[b.s] }} />
            <span style={{ color: 'var(--ink-2)', flex: 1 }}>{b.t}</span>
          </div>
        ))}
      </div>

      <div className="hairline" style={{ margin: '14px 0' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-danger" style={{ flex: 1 }}>ISOLATE</button>
        <button className="btn btn-amber" style={{ flex: 1 }}>INVESTIGATE</button>
        <button className="btn">DISMISS</button>
      </div>
    </PP>
  );
}

function DetailRow({ k, v, valColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
      <span className="label" style={{ fontSize: 9 }}>{k}</span>
      <span className="mono" style={{ color: valColor || 'var(--ink-1)', fontSize: 10.5 }}>{v}</span>
    </div>
  );
}

function BehaviorChart() {
  const [data] = React.useState(() => Array.from({ length: 60 }, (_, i) => 30 + Math.sin(i / 4) * 15 + Math.random() * 20));
  return (
    <PP title="EVENT VELOCITY · 60 MIN" sub="EVENTS / MIN" dense>
      <div style={{ height: 110, position: 'relative' }}>
        <SP data={data} color="#9fc4e8" height={110} />
        <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-4)' }}>−60m</span>
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-4)' }}>−30m</span>
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-4)' }}>NOW</span>
        </div>
      </div>
    </PP>
  );
}

/* ════════════════════════════════════════════════════
   VEIL — phishing cognition engine
══════════════════════════════════════════════════════ */
const PHISH_SAMPLE = `From: IT Security <admin@int-support-portal.com>
Subject: URGENT: Account Compromise Alert — Action Required
Date: May 09, 2026 14:05:32 UTC
To: john.doe@argus-uni.edu

Dear User,

Your account has been flagged for suspicious activity originating from an unauthorized location.

To prevent permanent suspension, click the secure link below to verify your credentials immediately:

  → https://int-support-portal.com/verify?u=jdoe&t=Xy79Bn

This is an automated message. Failure to act within 30 minutes will result in account lockout.

Thank you,
IT Security`;

function Veil() {
  const [text, setText] = React.useState(PHISH_SAMPLE);
  const [phase, setPhase] = React.useState(-1);
  const [done, setDone] = React.useState(false);

  const phases = [
    'Parsing message structure',
    'Resolving sender authenticity (SPF / DKIM / DMARC)',
    'Detecting spoofed institutional domain',
    'Identifying urgency manipulation patterns',
    'Behavioral deception analysis',
    'Credential harvesting indicator extraction',
    'Cross-referencing threat intelligence',
    'Generating executive assessment',
  ];

  const run = () => {
    setPhase(0); setDone(false);
    let i = 0;
    const tick = () => {
      i++;
      if (i >= phases.length) {
        setPhase(phases.length); setDone(true); return;
      }
      setPhase(i);
      setTimeout(tick, 380 + Math.random() * 280);
    };
    setTimeout(tick, 380);
  };

  React.useEffect(() => { run(); }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 14, height: '100%', minHeight: 0 }}>
      <PP
        title="VEIL · ARTIFACT"
        sub="EMAIL · SMS · URL"
        right={<PPl tone="ghost">SUBMITTED</PPl>}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <textarea value={text} onChange={e => setText(e.target.value)}
          style={{
            width: '100%', flex: 1, minHeight: 280,
            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', borderRadius: 3,
            color: 'var(--ink-1)', fontSize: 11, padding: 12, lineHeight: 1.6, resize: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={run}>RE-ANALYZE</button>
          <button className="btn">LOAD SAMPLE</button>
        </div>
        <div className="hairline" style={{ margin: '14px 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 10.5 }}>
          <DetailRow k="SPF" v="FAIL" valColor="#e15c6b" />
          <DetailRow k="DKIM" v="NONE" valColor="#e15c6b" />
          <DetailRow k="DMARC" v="FAIL" valColor="#e15c6b" />
          <DetailRow k="DOMAIN AGE" v="11 DAYS" valColor="#e89a4a" />
        </div>
      </PP>

      <PP
        title="COGNITION · LIVE REASONING"
        sub="Qwen3.5 · ARGUS-FT-04"
        right={done ? <PPl tone="crit" dotPulse>CRITICAL</PPl> : <PPl tone="info" dotPulse>ANALYZING</PPl>}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* Phases */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {phases.map((ph, i) => {
              const active = i === phase;
              const complete = i < phase || done;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i > phase && !done ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${complete ? '#7ec99a' : active ? '#9fc4e8' : 'var(--line-3)'}`,
                    background: complete ? '#5dba89' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: active ? '0 0 8px #9fc4e8' : 'none',
                    animation: active ? 'breathe 1s ease-in-out infinite' : 'none' }}>
                    {complete && <span style={{ color: '#0a0d12', fontSize: 9, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, color: complete ? 'var(--ink-1)' : active ? '#bcd2e8' : 'var(--ink-3)', letterSpacing: '0.04em' }}>
                    {ph}
                    {active && <span style={{ marginLeft: 8, color: 'var(--ink-3)' }}>...</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {done && (
            <>
              <div className="hairline" style={{ margin: '8px 0 14px' }} />
              <div className="label" style={{ marginBottom: 8 }}>ASSESSMENT (JSON)</div>
              <div className="code" style={{ fontSize: 10.5, color: 'var(--ink-1)' }}>{`{
  "threat_level": "CRITICAL",
  "risk_score": 92,
  "confidence": 96,
  "classification": "credential_phishing",
  "indicators": [
    "spoofed_domain: int-support-portal.com",
    "urgency_manipulation: 30min_deadline",
    "credential_harvest_url",
    "no_dmarc_alignment",
    "domain_age: 11d"
  ],
  "actor_attribution": "ShinyHunters (87%)",
  "recommendation": "isolate_session"
}`}</div>
              <div className="hairline" style={{ margin: '14px 0' }} />
              <div className="label" style={{ marginBottom: 6 }}>QWEN INSIGHT</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--ink-1)' }}>
                High-confidence credential-phishing attempt targeting institutional SSO. The display address spoofs <span style={{ color: '#f0b3ba' }}>"IT Security"</span> while the routing domain <span className="mono" style={{ color: '#f0c896' }}>int-support-portal.com</span> is an unauthorized lookalike registered <span className="mono">11 days ago</span>. Urgency framing ("30 minutes") and an immediate credential-harvest URL match the <span style={{ color: '#f0c896' }}>ShinyHunters</span> TTP cluster. Recommend immediate session isolation and notification of the affected user.
              </div>
            </>
          )}
        </div>
      </PP>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ThreatScoreCard />
        <PP title="RESPONSE" sub="ANALYST ACTION" dense>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="btn btn-danger" style={{ justifyContent: 'space-between' }}>ISOLATE SESSION <span>↗</span></button>
            <button className="btn btn-danger" style={{ justifyContent: 'space-between' }}>FORCE PASSWORD RESET <span>↗</span></button>
            <button className="btn btn-amber" style={{ justifyContent: 'space-between' }}>QUARANTINE EMAIL ORG-WIDE <span>↗</span></button>
            <button className="btn btn-amber" style={{ justifyContent: 'space-between' }}>BLOCK SENDER DOMAIN <span>↗</span></button>
            <button className="btn btn-primary" style={{ justifyContent: 'space-between' }}>ADD TO THREAT INTEL <span>↗</span></button>
            <button className="btn" style={{ justifyContent: 'space-between' }}>NOTIFY AFFECTED USER <span>↗</span></button>
          </div>
        </PP>
        <PP title="ATTACK VECTOR" dense>
          <AttackVectorMini />
        </PP>
      </div>
    </div>
  );
}

function ThreatScoreCard() {
  const score = 92;
  return (
    <PP title="THREAT SCORE" dense>
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div className="num" style={{ fontSize: 56, fontWeight: 700, color: '#e15c6b', letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</div>
        <div className="label" style={{ marginTop: 4, color: '#e15c6b' }}>CRITICAL · 96% CONF</div>
      </div>
      <div className="hairline" style={{ margin: '10px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ScoreBar label="Spoofing"     v={94} c="#e15c6b" />
        <ScoreBar label="Urgency"      v={88} c="#f0738b" />
        <ScoreBar label="Harvest URL"  v={97} c="#e15c6b" />
        <ScoreBar label="Auth Failure" v={100} c="#e15c6b" />
        <ScoreBar label="Linguistic"   v={62} c="#e89a4a" />
      </div>
    </PP>
  );
}

function ScoreBar({ label, v, c }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{label.toUpperCase()}</span>
        <span className="num" style={{ fontSize: 10, color: c }}>{v}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(0,0,0,0.3)', borderRadius: 1.5, overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', background: c }} />
      </div>
    </div>
  );
}

function AttackVectorMini() {
  const nodes = [
    { name: 'EMAIL', sev: 'HIGH' },
    { name: 'REDIRECT', sev: 'CRIT' },
    { name: 'FAKE LOGIN', sev: 'CRIT' },
    { name: 'PAYLOAD', sev: 'CRIT' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {nodes.map((n, i) => (
        <React.Fragment key={n.name}>
          <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${SC[n.sev]}25`, border: `1.2px solid ${SC[n.sev]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: `0 0 8px ${SC[n.sev]}40` }}>
              <span className="mono" style={{ fontSize: 9, color: SC[n.sev], fontWeight: 700 }}>{i + 1}</span>
            </div>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--ink-2)', marginTop: 6, letterSpacing: '0.1em' }}>{n.name}</div>
          </div>
          {i < nodes.length - 1 && (
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${SC[n.sev]}40, ${SC[nodes[i+1].sev]}40)`, margin: '0 6px', position: 'relative', top: -10 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   IDENTITY — trust scoring & behavioral
══════════════════════════════════════════════════════ */
const USERS = [
  { name: 'Dr. J. Doe', role: 'FACULTY · CS DEPT', trust: 14, prev: 89, status: 'CRIT', drift: '-75', sub: 'Compromised — token replay detected' },
  { name: 'Prof. M. Singh', role: 'FACULTY · BIO',  trust: 41, prev: 78, status: 'WARN', drift: '-37', sub: 'Anomalous travel · login from BR' },
  { name: 'A. Patel',     role: 'STUDENT · GRAD',   trust: 62, prev: 72, status: 'WARN', drift: '-10', sub: 'New device unverified · 3 sessions' },
  { name: 'svc-backup',   role: 'SERVICE ACCOUNT',  trust: 28, prev: 84, status: 'CRIT', drift: '-56', sub: 'IAM privilege escalation observed' },
  { name: 'L. Tanaka',    role: 'STAFF · BURSAR',   trust: 78, prev: 80, status: 'INFO', drift: '-2',  sub: 'Standard activity baseline' },
  { name: 'R. Kapoor',    role: 'L5 ANALYST',       trust: 99, prev: 99, status: 'INFO', drift: '+0',  sub: 'Normal · this session' },
  { name: 'svc-canvas',   role: 'SERVICE ACCOUNT',  trust: 88, prev: 90, status: 'INFO', drift: '-2',  sub: 'Normal API usage pattern' },
];

function Identity() {
  const [sel, setSel] = React.useState(USERS[0]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 14, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <IdentityStats />
        <PP title="TRUST DRIFT · IDENTITY POPULATION" sub="14,328 ACTIVE PRINCIPALS" right={<PPl tone="crit" dotPulse>2 COMPROMISED</PPl>} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', margin: '-14px' }}>
            <div className="t-head" style={{ gridTemplateColumns: '180px 200px 1fr 80px 70px 80px' }}>
              <span>PRINCIPAL</span><span>ROLE</span><span>BEHAVIOR</span><span>TRUST</span><span>DRIFT</span><span>STATUS</span>
            </div>
            {USERS.map(u => (
              <div key={u.name} className="t-row" style={{ gridTemplateColumns: '180px 200px 1fr 80px 70px 80px', cursor: 'pointer', background: sel.name === u.name ? 'rgba(159, 196, 232,0.06)' : 'transparent' }} onClick={() => setSel(u)}>
                <span style={{ color: 'var(--ink-1)', fontSize: 11.5, fontWeight: 500 }}>{u.name}</span>
                <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{u.role}</span>
                <span style={{ color: 'var(--ink-2)', fontSize: 11 }}>{u.sub}</span>
                <TrustBar v={u.trust} prev={u.prev} />
                <span className="num" style={{ fontSize: 11, color: u.drift.startsWith('-') ? '#e15c6b' : 'var(--ink-3)' }}>{u.drift}</span>
                <PPl tone={u.status === 'CRIT' ? 'crit' : u.status === 'WARN' ? 'warn' : 'ghost'}>{u.status}</PPl>
              </div>
            ))}
          </div>
        </PP>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <IdentityDetail user={sel} />
      </div>
    </div>
  );
}

function IdentityStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }} className="panel">
      <span className="corner-tick tl" /><span className="corner-tick tr" /><span className="corner-tick bl" /><span className="corner-tick br" />
      {[
        { label: 'PRINCIPALS', value: '14,328', tone: '#bcd2e8' },
        { label: 'AVG TRUST', value: '87.4', tone: '#7ec99a' },
        { label: 'COMPROMISED', value: '2', tone: '#e15c6b' },
        { label: 'AT-RISK', value: '11', tone: '#e89a4a' },
        { label: 'IMPOSSIBLE TRAVEL', value: '4', tone: '#e89a4a' },
      ].map((s, i, arr) => (
        <div key={s.label} style={{ padding: '14px 16px', borderRight: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
          <div className="label" style={{ marginBottom: 8 }}>{s.label}</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600, color: s.tone, letterSpacing: '-0.02em' }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function TrustBar({ v, prev }) {
  const c = v < 30 ? '#e15c6b' : v < 60 ? '#e89a4a' : v < 85 ? '#bcd2e8' : '#7ec99a';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="num" style={{ fontSize: 11, color: c, fontWeight: 600, width: 24 }}>{v}</span>
        <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.4)', borderRadius: 1.5, position: 'relative' }}>
          <div style={{ width: `${prev}%`, height: '100%', background: 'rgba(148,163,184,0.2)', position: 'absolute', borderRadius: 1.5 }} />
          <div style={{ width: `${v}%`, height: '100%', background: c, borderRadius: 1.5, position: 'absolute' }} />
        </div>
      </div>
    </div>
  );
}

function IdentityDetail({ user }) {
  const sessions = [
    { ip: '185.220.101.42', loc: 'Amsterdam, NL', device: 'Linux/Firefox-Headless', age: '2m', sev: 'CRIT' },
    { ip: '203.0.113.77',   loc: 'Beijing, CN',  device: 'Win10/Chrome',          age: '14m', sev: 'CRIT' },
    { ip: '74.125.224.72',  loc: 'New York, US (campus)', device: 'macOS/Safari',          age: '2h',  sev: 'INFO' },
    { ip: '74.125.224.72',  loc: 'New York, US (campus)', device: 'macOS/Safari',          age: '5h',  sev: 'INFO' },
  ];
  const drift = Array.from({ length: 30 }, (_, i) => i < 22 ? 80 + Math.random() * 12 : 80 - (i - 22) * 9);
  return (
    <PP title={user.name} sub={user.role} right={<PPl tone={user.status === 'CRIT' ? 'crit' : user.status === 'WARN' ? 'warn' : 'live'} dotPulse>{user.status}</PPl>} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 4, background: 'rgba(159, 196, 232,0.08)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fc4e8', fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', flexShrink: 0 }}>
            {user.name.split(' ').map(s => s[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="label" style={{ marginBottom: 4 }}>TRUST SCORE</div>
            <div className="num" style={{ fontSize: 32, fontWeight: 700, color: user.trust < 30 ? '#e15c6b' : user.trust < 60 ? '#e89a4a' : '#7ec99a', lineHeight: 1, letterSpacing: '-0.03em' }}>{user.trust}</div>
            <div className="num" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{user.drift} from baseline ({user.prev})</div>
          </div>
        </div>

        <div className="label" style={{ marginBottom: 6 }}>30-DAY TRUST DRIFT</div>
        <div style={{ marginBottom: 14 }}><SP data={drift} color={user.trust < 30 ? '#e15c6b' : '#9fc4e8'} height={48} /></div>

        <div className="label" style={{ marginBottom: 8 }}>RECENT SESSIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sessions.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ width: 4, height: 24, background: SC[s.sev], borderRadius: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}>{s.ip}</div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', marginTop: 2 }}>{s.loc} · {s.device}</div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.age}</span>
            </div>
          ))}
        </div>

        <div className="hairline" style={{ margin: '14px 0' }} />
        <div className="label" style={{ marginBottom: 8 }}>BEHAVIORAL DEVIATION</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { l: 'Login Frequency', v: '+340%' },
            { l: 'Geographic Variance', v: '4 countries / 24h' },
            { l: 'Device Fingerprints', v: '5 new (baseline 1)' },
            { l: 'Off-hours Activity', v: '02:00 — 04:00 UTC' },
            { l: 'API Call Pattern', v: 'Atypical · S3 enum' },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--ink-2)' }}>{d.l}</span>
              <span className="mono" style={{ color: '#f0c896' }}>{d.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <button className="btn btn-danger" style={{ flex: 1 }}>SUSPEND SESSION</button>
        <button className="btn btn-amber" style={{ flex: 1 }}>STEP-UP MFA</button>
      </div>
    </PP>
  );
}

/* ════════════════════════════════════════════════════
   ORACLE — correlation engine
══════════════════════════════════════════════════════ */
function Oracle() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14, height: '100%', minHeight: 0 }}>
      <PP
        title="ORACLE · ATTACK CHAIN GRAPH"
        sub="INC-2026-0418 · FACULTY IDENTITY COMPROMISE"
        right={<><PPl tone="ghost">87% TTP MATCH · ShinyHunters</PPl><PPl tone="crit" dotPulse>RECONSTRUCTING</PPl></>}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <CorrelationGraph />
      </PP>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP title="HYPOTHESIS" sub="GENERATED BY ARGUS" dense>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--ink-1)' }}>
            ARGUS correlates a credential-phishing artifact (T1566) at <span className="mono" style={{ color: '#f0c896' }}>08:30</span> with an anomalous SSO authentication (T1078.004) at <span className="mono" style={{ color: '#f0c896' }}>09:15</span>, lateral movement (T1021) at <span className="mono" style={{ color: '#f0c896' }}>10:05</span>, S3 enumeration (T1530) at <span className="mono" style={{ color: '#f0c896' }}>10:50</span>, and a queued exfiltration to <span className="mono" style={{ color: '#f0b3ba' }}>45.142.213.190</span> at <span className="mono" style={{ color: '#f0c896' }}>11:32</span>.
            <div style={{ marginTop: 10, padding: 10, border: '1px solid rgba(225, 92, 107,0.2)', background: 'rgba(225, 92, 107,0.04)', borderRadius: 3 }}>
              <span className="label" style={{ color: '#f0b3ba' }}>VERDICT</span>
              <div style={{ fontSize: 12, color: 'var(--ink-0)', marginTop: 4 }}>Confirmed campaign · faculty SSO compromised · exfil interrupted at queue stage.</div>
            </div>
          </div>
        </PP>

        <PP title="CORRELATED ARTIFACTS" sub="47 INDICATORS" dense>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { t: 'EMAIL', v: 'admin@int-support-portal.com', sev: 'CRIT' },
              { t: 'IP', v: '185.220.101.42', sev: 'CRIT' },
              { t: 'DOMAIN', v: 'int-support-portal.com', sev: 'CRIT' },
              { t: 'IP', v: '45.142.213.190', sev: 'CRIT' },
              { t: 'USER', v: 'j.doe@argus-uni.edu', sev: 'CRIT' },
              { t: 'HOST', v: 'WS-FAC-014', sev: 'HIGH' },
              { t: 'HOST', v: 'lab-srv-03', sev: 'HIGH' },
              { t: 'BUCKET', v: 's3://argus-research/raw', sev: 'HIGH' },
              { t: 'PROCESS', v: 'powershell.exe -enc <b64>', sev: 'CRIT' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 8px', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>{a.t}</span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.v}</span>
                <span className="dot" style={{ background: SC[a.sev] }} />
              </div>
            ))}
          </div>
        </PP>
      </div>
    </div>
  );
}

function CorrelationGraph() {
  // graph nodes positioned on a 100x60 viewbox
  const nodes = [
    { id: 'email',   x: 8,  y: 12, label: 'PHISH EMAIL',   sub: 'admin@int-support-portal.com', sev: 'CRIT' },
    { id: 'user',    x: 30, y: 18, label: 'j.doe@',        sub: 'FACULTY · CS',                  sev: 'CRIT' },
    { id: 'sso',     x: 30, y: 38, label: 'SSO TOKEN',     sub: 'CAPTURED 09:15',                sev: 'CRIT' },
    { id: 'ws',      x: 56, y: 12, label: 'WS-FAC-014',    sub: 'PWSH-ENC EXEC',                 sev: 'CRIT' },
    { id: 'srv',     x: 56, y: 30, label: 'lab-srv-03',    sub: 'LATERAL · WMI',                 sev: 'HIGH' },
    { id: 'iam',     x: 56, y: 48, label: 'svc-backup',    sub: 'IAM ESCALATE',                  sev: 'HIGH' },
    { id: 's3',      x: 80, y: 30, label: 's3://research', sub: 'ENUMERATION',                   sev: 'CRIT' },
    { id: 'exfil',   x: 92, y: 50, label: '45.142.213.190', sub: 'EXFIL DEST · RU',              sev: 'CRIT' },
  ];
  const edges = [
    ['email', 'user'], ['user', 'sso'], ['sso', 'ws'], ['sso', 'srv'],
    ['ws', 'srv'], ['srv', 'iam'], ['iam', 's3'], ['s3', 'exfil'], ['srv', 's3'],
  ];
  const findN = (id) => nodes.find(n => n.id === id);

  return (
    <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 480, background: 'radial-gradient(ellipse at center, rgba(159, 196, 232,0.04), transparent 70%)', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
      {/* grid overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {edges.map(([a, b], i) => {
          const A = findN(a), B = findN(b);
          return (
            <g key={i}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={SC[A.sev]} strokeWidth="0.18" strokeDasharray="0.8 0.6" opacity="0.7"
                style={{ animation: `drift ${3 + i * 0.4}s linear infinite` }} />
            </g>
          );
        })}
      </svg>

      {nodes.map((n, i) => (
        <div key={n.id} style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y * 100/60}%`, transform: 'translate(-50%, -50%)', textAlign: 'center', minWidth: 100 }}>
          <div className="chain-node" style={{
            width: 16, height: 16, borderRadius: '50%',
            background: `${SC[n.sev]}25`,
            border: `1.5px solid ${SC[n.sev]}`,
            margin: '0 auto 6px',
            position: 'relative',
            boxShadow: `0 0 12px ${SC[n.sev]}55`,
          }}>
            <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `1px solid ${SC[n.sev]}`, opacity: 0.5, animation: `signal-pulse ${2 + i * 0.3}s ease-out infinite` }} />
          </div>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-0)', letterSpacing: '0.08em', fontWeight: 600 }}>{n.label}</div>
          <div className="mono" style={{ fontSize: 8.5, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '0.05em' }}>{n.sub}</div>
        </div>
      ))}

      {/* compass */}
      <div className="mono" style={{ position: 'absolute', top: 10, left: 12, fontSize: 8.5, letterSpacing: '0.18em', color: 'var(--ink-4)' }}>
        ATTACK GRAPH · 9 NODES · 9 EDGES · KILL CHAIN [PHISH → ACCESS → MOVE → COLLECT → EXFIL]
      </div>

      {/* legend */}
      <div style={{ position: 'absolute', bottom: 10, right: 12, padding: '8px 10px', background: 'rgba(8,11,16,0.85)', border: '1px solid var(--line-2)', borderRadius: 3, fontSize: 9.5, lineHeight: 1.7 }}>
        <div className="label" style={{ marginBottom: 4 }}>SEVERITY</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="dot crit" /><span className="mono" style={{ color: 'var(--ink-2)' }}>CRITICAL</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="dot warn" /><span className="mono" style={{ color: 'var(--ink-2)' }}>HIGH</span></div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   SKYNET — cloud posture
══════════════════════════════════════════════════════ */
function Skynet() {
  const findings = [
    { sev: 'CRIT', svc: 'AWS S3',     resource: 'argus-research-raw',         issue: 'Public READ ACL · contains PII research data',          age: '2h' },
    { sev: 'CRIT', svc: 'AWS IAM',    resource: 'svc-backup',                 issue: 'Privilege escalation path → AdministratorAccess',         age: '1h' },
    { sev: 'HIGH', svc: 'GCP GKE',    resource: 'cluster-prod-east',          issue: 'Pods running as root · 7 workloads',                       age: '6h' },
    { sev: 'HIGH', svc: 'AWS RDS',    resource: 'finance-db-replica',         issue: 'Encryption-at-rest disabled',                              age: '12h' },
    { sev: 'MED',  svc: 'AWS Lambda', resource: 'fn-grade-export',            issue: 'Outdated runtime (nodejs14.x · EOL)',                      age: '3d' },
    { sev: 'MED',  svc: 'AWS S3',     resource: 'argus-public-www',           issue: 'No server-side encryption configured',                     age: '4d' },
    { sev: 'MED',  svc: 'Azure AD',   resource: 'GuestUsers (108)',           issue: 'Stale guest accounts · last login >180d',                  age: '1w' },
    { sev: 'LOW',  svc: 'AWS CloudTrail', resource: 'us-east-1',              issue: 'Log file validation not enabled',                          age: '2w' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 14, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP title="POSTURE SCORE" sub="ALL CLOUDS · 30D ROLLING" dense>
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <div className="num" style={{ fontSize: 56, fontWeight: 700, color: '#e89a4a', letterSpacing: '-0.04em', lineHeight: 1 }}>62<span style={{ fontSize: 18, color: 'var(--ink-3)' }}>/100</span></div>
            <div className="label" style={{ marginTop: 4, color: '#f0c896' }}>ELEVATED RISK · -8 (7d)</div>
          </div>
          <div className="hairline" style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ScoreBar label="Identity & Access" v={48} c="#e15c6b" />
            <ScoreBar label="Data Protection" v={61} c="#e89a4a" />
            <ScoreBar label="Network" v={78} c="#bcd2e8" />
            <ScoreBar label="Logging" v={86} c="#7ec99a" />
            <ScoreBar label="Compliance (SOC2)" v={71} c="#bcd2e8" />
          </div>
        </PP>

        <PP title="CLOUD INVENTORY" dense>
          {[
            { p: 'AWS · 3 regions',    n: '6,420 resources', tone: '#bcd2e8' },
            { p: 'GCP · 2 projects',   n: '1,184 resources', tone: '#bcd2e8' },
            { p: 'Azure · 1 tenant',   n: '   702 resources', tone: '#bcd2e8' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}>{p.p}</span>
              <span className="num" style={{ fontSize: 10.5, color: p.tone }}>{p.n}</span>
            </div>
          ))}
        </PP>

        <PP title="EXPOSURE BREAKDOWN" dense>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { l: 'PUBLIC BUCKETS', v: 3, c: '#e15c6b' },
              { l: 'WIDE IAM POLICIES', v: 11, c: '#e89a4a' },
              { l: 'EXPOSED API KEYS', v: 1, c: '#e15c6b' },
              { l: 'UNENCRYPTED VOLS', v: 7, c: '#e89a4a' },
            ].map((e, i) => (
              <div key={i} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 3 }}>
                <div className="num" style={{ fontSize: 22, color: e.c, fontWeight: 700 }}>{e.v}</div>
                <div className="label" style={{ fontSize: 8.5, marginTop: 2 }}>{e.l}</div>
              </div>
            ))}
          </div>
        </PP>
      </div>

      <PP title="POSTURE FINDINGS" sub="MISCONFIGURATIONS · COMPLIANCE DRIFT" right={<PPl tone="warn" dotPulse>{findings.length} OPEN</PPl>} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', margin: '-14px' }}>
          <div className="t-head" style={{ gridTemplateColumns: '70px 110px 220px 1fr 70px 80px' }}>
            <span>SEV</span><span>SERVICE</span><span>RESOURCE</span><span>ISSUE</span><span>AGE</span><span>ACTION</span>
          </div>
          {findings.map((f, i) => (
            <div key={i} className="t-row" style={{ gridTemplateColumns: '70px 110px 220px 1fr 70px 80px', fontSize: 11.5 }}>
              <span className="mono" style={{ color: SC[f.sev], fontWeight: 700, letterSpacing: '0.1em' }}>{f.sev}</span>
              <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 10.5 }}>{f.svc}</span>
              <span className="mono" style={{ color: 'var(--ink-1)', fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.resource}</span>
              <span style={{ color: 'var(--ink-2)' }}>{f.issue}</span>
              <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{f.age}</span>
              <button className="btn" style={{ fontSize: 9, padding: '3px 8px' }}>FIX</button>
            </div>
          ))}
        </div>
      </PP>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   RESPONSE — autonomous containment
══════════════════════════════════════════════════════ */
function Response() {
  const [stage, setStage] = React.useState(2);
  React.useEffect(() => {
    const id = setInterval(() => setStage(s => Math.min(5, s + 1)), 4500);
    return () => clearInterval(id);
  }, []);

  const stages = [
    { name: 'DETECT',     desc: 'Anomalies surfaced from telemetry',     dur: '03s' },
    { name: 'TRIAGE',     desc: 'Severity & TTP attribution scored',     dur: '12s' },
    { name: 'ISOLATE',    desc: 'Session terminated · host quarantined', dur: '00:48' },
    { name: 'ERADICATE',  desc: 'Persistence & creds rotated',           dur: '02:14' },
    { name: 'RECOVER',    desc: 'Access restored to verified principals', dur: '04:30' },
    { name: 'LEARN',      desc: 'Attribution & playbook update',         dur: '—' },
  ];

  const playbooks = [
    { id: 'PB-IDC-001', name: 'Identity Compromise · SSO',     state: 'EXECUTING', steps: '4 / 7', conf: 96 },
    { id: 'PB-PHI-014', name: 'Phishing Wave · Org Quarantine', state: 'STAGED',    steps: '0 / 5', conf: 88 },
    { id: 'PB-EXF-009', name: 'Egress Block · 45.142.213.190',  state: 'COMPLETE',  steps: '3 / 3', conf: 100 },
    { id: 'PB-CLD-003', name: 'S3 Public ACL Lockdown',         state: 'EXECUTING', steps: '2 / 4', conf: 92 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP title="CONTAINMENT ORCHESTRATION" sub="INC-2026-0418" right={<><PPl tone="warn" dotPulse>STAGE {stage + 1}/{stages.length}</PPl></>}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 0 }}>
            {stages.map((s, i) => {
              const done = i < stage;
              const active = i === stage;
              return (
                <div key={s.name} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 4,
                      border: `1.2px solid ${done ? '#7ec99a' : active ? '#9fc4e8' : 'var(--line-2)'}`,
                      background: done ? 'rgba(93, 186, 137,0.10)' : active ? 'rgba(159, 196, 232,0.10)' : 'rgba(0,0,0,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10,
                      boxShadow: active ? '0 0 14px rgba(159, 196, 232,0.4)' : 'none',
                      animation: active ? 'breathe 1.5s ease-in-out infinite' : 'none',
                    }}>
                      <span className="mono" style={{ fontSize: 11, color: done ? '#7ec99a' : active ? '#9fc4e8' : 'var(--ink-3)', fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: done ? '#7ec99a' : active ? 'var(--ink-0)' : 'var(--ink-3)', letterSpacing: '0.18em', marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.4 }}>{s.desc}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 4, letterSpacing: '0.12em' }}>{s.dur}</div>
                  </div>
                  {i < stages.length - 1 && (
                    <div style={{ position: 'absolute', top: 22, left: '60%', right: '-40%', height: 1, background: done ? 'linear-gradient(90deg, #7ec99a, transparent)' : 'var(--line)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </PP>

        <PP title="ACTIVE PLAYBOOKS" sub="AUTONOMOUS RESPONSE" right={<PPl tone="info" dotPulse>4 RUNNING</PPl>}>
          <div className="t-head" style={{ gridTemplateColumns: '110px 1fr 110px 80px 80px 80px', borderBottom: '1px solid var(--line)' }}>
            <span>ID</span><span>PLAYBOOK</span><span>STATE</span><span>STEPS</span><span>CONF</span><span>ACTION</span>
          </div>
          {playbooks.map(p => (
            <div key={p.id} className="t-row" style={{ gridTemplateColumns: '110px 1fr 110px 80px 80px 80px', fontSize: 11.5 }}>
              <span className="mono" style={{ color: 'var(--ink-3)' }}>{p.id}</span>
              <span style={{ color: 'var(--ink-1)' }}>{p.name}</span>
              <PPl tone={p.state === 'COMPLETE' ? 'live' : p.state === 'EXECUTING' ? 'info' : 'ghost'} dotPulse={p.state === 'EXECUTING'}>{p.state}</PPl>
              <span className="mono" style={{ color: 'var(--ink-2)' }}>{p.steps}</span>
              <span className="num" style={{ color: '#7ec99a' }}>{p.conf}%</span>
              <button className="btn" style={{ fontSize: 9, padding: '3px 8px' }}>VIEW</button>
            </div>
          ))}
        </PP>

        <PP title="DECISION LOG" sub="AUTONOMOUS ACTIONS · LAST 60M" dense>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 1.7, color: 'var(--ink-2)' }}>
            {[
              { t: '11:48:02', tag: 'EGRESS', txt: 'Blocked 45.142.213.190 at edge firewall · ALL VPCS', sev: 'good' },
              { t: '11:47:51', tag: 'IAM',    txt: 'Suspended svc-backup · revoked 4 active sessions', sev: 'good' },
              { t: '11:47:32', tag: 'AUTH',   txt: 'Forced step-up MFA on j.doe@argus-uni.edu', sev: 'good' },
              { t: '11:46:18', tag: 'EMAIL',  txt: 'Quarantined 34 messages from int-support-portal.com', sev: 'good' },
              { t: '11:45:09', tag: 'HOST',   txt: 'Network-isolated WS-FAC-014 (powershell -enc detected)', sev: 'good' },
              { t: '11:44:01', tag: 'DETECT', txt: 'Correlation engine raised INC-2026-0418', sev: 'warn' },
            ].map((d, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 60px 1fr', gap: 10, padding: '4px 0', borderBottom: i < 5 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ color: 'var(--ink-4)' }}>{d.t}</span>
                <span style={{ color: d.sev === 'good' ? '#7ec99a' : d.sev === 'warn' ? '#f0c896' : 'var(--ink-3)', letterSpacing: '0.1em' }}>{d.tag}</span>
                <span>{d.txt}</span>
              </div>
            ))}
          </div>
        </PP>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP title="MTTR" sub="MEAN TIME TO RESPOND" dense>
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <div className="num" style={{ fontSize: 44, fontWeight: 700, color: '#7ec99a', letterSpacing: '-0.03em', lineHeight: 1 }}>4.2<span style={{ fontSize: 14, color: 'var(--ink-3)' }}>m</span></div>
            <div className="label" style={{ marginTop: 4, color: '#7ec99a' }}>−18% vs LAST WEEK</div>
          </div>
          <div className="hairline" style={{ margin: '10px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><div className="label">DETECT</div><div className="num" style={{ fontSize: 16, color: 'var(--ink-1)' }}>00:03</div></div>
            <div><div className="label">TRIAGE</div><div className="num" style={{ fontSize: 16, color: 'var(--ink-1)' }}>00:12</div></div>
            <div><div className="label">ISOLATE</div><div className="num" style={{ fontSize: 16, color: 'var(--ink-1)' }}>00:48</div></div>
            <div><div className="label">ERADICATE</div><div className="num" style={{ fontSize: 16, color: 'var(--ink-1)' }}>02:14</div></div>
          </div>
        </PP>

        <PP title="MANUAL OVERRIDE" sub="HUMAN-IN-LOOP" dense>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="btn btn-danger">PAUSE ALL AUTONOMY</button>
            <button className="btn btn-amber">REQUEST APPROVAL</button>
            <button className="btn btn-primary">ESCALATE TO IR-LEAD</button>
            <button className="btn">EXPORT TO SIEM</button>
          </div>
          <div className="hairline" style={{ margin: '12px 0' }} />
          <div className="label" style={{ marginBottom: 6 }}>POLICY</div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            ARGUS may auto-isolate hosts and revoke credentials at <span style={{ color: '#7ec99a' }}>≥85% confidence</span>. All actions are logged and reversible within <span className="mono">15min</span>.
          </div>
        </PP>

        <PP title="AGENT TELEMETRY" sub="14,328 ENDPOINTS" dense>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: 'var(--ink-2)' }}>Reporting</span><span className="num" style={{ color: '#7ec99a' }}>14,201 (99.1%)</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: 'var(--ink-2)' }}>Stale ({'>'}1h)</span><span className="num" style={{ color: '#f0c896' }}>118</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: 'var(--ink-2)' }}>Offline</span><span className="num" style={{ color: 'var(--ink-3)' }}>9</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: 'var(--ink-2)' }}>Tampered</span><span className="num" style={{ color: '#e15c6b' }}>0</span></div>
          </div>
        </PP>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   THREAT INTEL — full-screen feed
══════════════════════════════════════════════════════ */
function ThreatIntel() {
  const items = window.argusUtils.NEWS_FEED;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, height: '100%', minHeight: 0 }}>
      <PP title="GLOBAL CYBER THREAT INTELLIGENCE" sub="MULTI-SOURCE · LIVE" right={<PPl tone="live" dotPulse>STREAMING</PPl>} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', margin: '-14px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '80px 6px 1fr 100px', gap: 14 }}>
              <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.1em', paddingTop: 2 }}>{window.argusUtils.ago(item.time)} ago</div>
              <div style={{ width: 4, background: window.argusUtils.SEV_COLOR[item.sev], borderRadius: 1 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: window.argusUtils.SEV_COLOR[item.sev] }}>{item.sev}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{item.source.toUpperCase()} · {item.sector.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-0)', marginBottom: 8, lineHeight: 1.45 }}>{item.title}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(item.tags || []).map(t => <span key={t} className="mono" style={{ fontSize: 9, padding: '2px 7px', border: '1px solid var(--line-2)', borderRadius: 1, color: 'var(--ink-3)' }}>{t}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <button className="btn" style={{ fontSize: 9 }}>OPEN SOURCE</button>
                <button className="btn" style={{ fontSize: 9 }}>CORRELATE</button>
              </div>
            </div>
          ))}
        </div>
      </PP>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP title="ACTIVE THREAT ACTORS" dense>
          {[
            { name: 'ShinyHunters',  ttp: 'CREDENTIAL HARVEST · LMS', sev: 'CRIT' },
            { name: 'CL0P',          ttp: 'FILE-TRANSFER EXPLOIT',    sev: 'CRIT' },
            { name: 'Akira',         ttp: 'RANSOMWARE · SONICWALL',   sev: 'HIGH' },
            { name: 'APT29 · Cozy',  ttp: 'SUPPLY-CHAIN',             sev: 'HIGH' },
            { name: 'Scattered Spider', ttp: 'SOCIAL ENG · HELP-DESK', sev: 'HIGH' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--line)' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-1)', fontWeight: 600 }}>{a.name}</div>
                <div className="mono" style={{ fontSize: 8.5, color: 'var(--ink-3)', letterSpacing: '0.1em', marginTop: 2 }}>{a.ttp}</div>
              </div>
              <span className="dot" style={{ background: window.argusUtils.SEV_COLOR[a.sev], boxShadow: `0 0 6px ${window.argusUtils.SEV_COLOR[a.sev]}` }} />
            </div>
          ))}
        </PP>

        <PP title="CVE WATCHLIST" sub="UNPATCHED · HIGH RELEVANCE" dense>
          {[
            { id: 'CVE-2026-3142', cvss: '9.8', svc: 'MOVEit Transfer' },
            { id: 'CVE-2026-2891', cvss: '8.8', svc: 'Canvas LMS API' },
            { id: 'CVE-2026-2774', cvss: '7.5', svc: 'OpenSSL 3.x' },
            { id: 'CVE-2026-2509', cvss: '9.1', svc: 'Atlassian Crowd' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 50px', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <span className="mono" style={{ fontSize: 10, color: '#bcd2e8' }}>{c.id}</span>
              <span style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>{c.svc}</span>
              <span className="num" style={{ fontSize: 11, color: parseFloat(c.cvss) >= 9 ? '#e15c6b' : '#e89a4a', textAlign: 'right' }}>{c.cvss}</span>
            </div>
          ))}
        </PP>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   NEXUS — The Orchestrator · Autonomous Agent Brain
══════════════════════════════════════════════════════ */

const AGENT_SWARMS = [
  {
    id: 'threat-hunt', name: 'THREAT HUNT', color: '#e15c6b',
    agents: [
      { name: 'Hunter-Alpha',  task: 'Scanning SSO anomaly cluster T-9842',  status: 'ACTIVE' },
      { name: 'Hunter-Beta',   task: 'OSINT correlation on AS9009 · M247',   status: 'ACTIVE' },
      { name: 'Hunter-Gamma',  task: 'Analyzing PowerShell telemetry WS-FAC', status: 'ACTIVE' },
      { name: 'Correlator',    task: 'Cross-domain IOC mapping · 47 signals', status: 'ACTIVE' },
    ],
  },
  {
    id: 'forensics', name: 'FORENSICS', color: '#e89a4a',
    agents: [
      { name: 'Evidence-1',   task: 'Parsing WS-FAC-014 disk artifacts',    status: 'ACTIVE' },
      { name: 'ChainFX',      task: 'Reconstructing kill chain INC-0418',   status: 'ACTIVE' },
      { name: 'TimelineAI',   task: 'Temporal event correlation (±3s)',      status: 'ACTIVE' },
      { name: 'Report-Gen',   task: 'Drafting INC-2026-0418 executive rpt', status: 'QUEUED' },
    ],
  },
  {
    id: 'response', name: 'RESPONSE', color: '#7ec99a',
    agents: [
      { name: 'Isolator',    task: 'WS-FAC-014 quarantine enforced',        status: 'DONE' },
      { name: 'Rotator',     task: 'Rotating svc-backup credentials now',   status: 'ACTIVE' },
      { name: 'Patcher',     task: 'Awaiting CVE-2026-3142 patch window',   status: 'STANDBY' },
      { name: 'Verifier',    task: 'Confirming egress block · 45.142.213', status: 'ACTIVE' },
    ],
  },
  {
    id: 'intelligence', name: 'INTELLIGENCE', color: '#9fc4e8',
    agents: [
      { name: 'OSINT-1',     task: 'Enriching 45.142.213.190 via VirusTotal', status: 'ACTIVE' },
      { name: 'MITRE-Map',   task: 'Mapping TTPs to ATT&CK v15 framework',  status: 'ACTIVE' },
      { name: 'Attribution', task: 'ShinyHunters cluster confidence: 87%',  status: 'ACTIVE' },
      { name: 'IOC-Feed',    task: '7 IOCs pushed to global threat feed',   status: 'DONE' },
    ],
  },
  {
    id: 'deception', name: 'DECEPTION', color: '#bcd2e8',
    agents: [
      { name: 'HoneyDeploy',  task: 'Spinning fake S3 research lure bucket', status: 'ACTIVE' },
      { name: 'LureFactory',  task: 'Generating faculty credential decoys',  status: 'ACTIVE' },
      { name: 'AttackCapture',task: 'Logging attacker TTPs via HP-001',      status: 'ACTIVE' },
      { name: 'DNA-Encode',   task: 'Encoding V7F3-KP attacker signature',   status: 'ACTIVE' },
    ],
  },
  {
    id: 'compliance', name: 'COMPLIANCE', color: '#d4af37',
    agents: [
      { name: 'NIST-Audit',  task: 'CSF 2.0 control gap assessment (67/100)', status: 'RUNNING' },
      { name: 'GDPR-Scan',   task: 'Data residency mapping EU/US transfers',  status: 'RUNNING' },
      { name: 'FERPA-Guard', task: 'Student record access audit pending',      status: 'STANDBY' },
      { name: 'ISO-Bench',   task: 'ISO 27001:2022 annex A control review',   status: 'IDLE' },
    ],
  },
  {
    id: 'learning', name: 'LEARNING', color: '#9b9ad8',
    agents: [
      { name: 'Dream-Cycle',  task: 'Memory consolidation scheduled 02:00',   status: 'STANDBY' },
      { name: 'PatternEx',    task: 'Extracting ShinyHunters TTP patterns',    status: 'ACTIVE' },
      { name: 'InstinctUp',   task: 'Updated anomaly thresholds (MTTR -18%)',  status: 'DONE' },
      { name: 'MemoryOp',     task: 'Pruning stale IOC embeddings (>90d)',     status: 'IDLE' },
    ],
  },
  {
    id: 'consensus', name: 'CONSENSUS', color: '#f0c896',
    agents: [
      { name: 'Raft-Leader',  task: 'Orchestrating 3-agent ISOLATE vote',     status: 'ACTIVE' },
      { name: 'Reviewer-A',   task: 'Blind review: ISOLATE · confidence 96%', status: 'DONE' },
      { name: 'Reviewer-B',   task: 'Blind review: ISOLATE · confidence 94%', status: 'DONE' },
      { name: 'Gate-Guard',   task: 'Anti-sycophancy enforcement · pass',     status: 'ACTIVE' },
    ],
  },
];

const NEXUS_LOG_INITIAL = [
  { t: '11:48:14', agent: 'Isolator',     action: 'Quarantine WS-FAC-014 — EXECUTED',               status: 'DONE' },
  { t: '11:48:01', agent: 'DNA-Encode',   action: 'Attacker behavioral signature V7F3-KP encoded',  status: 'INFO' },
  { t: '11:47:52', agent: 'IOC-Feed',     action: '7 IOCs pushed to global threat intelligence',    status: 'DONE' },
  { t: '11:47:44', agent: 'MITRE-Map',    action: 'Mapped T1566→T1078.004→T1021→T1530→T1567',      status: 'INFO' },
  { t: '11:47:31', agent: 'Raft-Leader',  action: 'Consensus reached (3/3) — ISOLATE approved',    status: 'DONE' },
  { t: '11:47:19', agent: 'Hunter-Alpha', action: 'Anomaly cluster elevated to CRITICAL',           status: 'WARN' },
  { t: '11:47:02', agent: 'PatternEx',    action: 'ShinyHunters pattern extracted from session',    status: 'INFO' },
  { t: '11:46:44', agent: 'Gate-Guard',   action: 'Anti-sycophancy gate cleared — unique verdicts', status: 'DONE' },
];

/* ════════════════════════════════════════════════════
   THINK ENGINE — Palantir-Grade Intelligence Panel
══════════════════════════════════════════════════════ */

const THINK_API = 'http://localhost:8000/think';
const CONF_COLOR = (c) => c >= 0.8 ? '#7ec99a' : c >= 0.55 ? '#e89a4a' : '#e15c6b';
const CONF_LABEL = (c) => c >= 0.8 ? 'HIGH' : c >= 0.55 ? 'MEDIUM' : 'LOW';

function ThinkPanel() {
  const [question, setQuestion] = React.useState('');
  const [running, setRunning]   = React.useState(false);
  const [phase, setPhase]       = React.useState('');
  const [result, setResult]     = React.useState(null);
  const [error, setError]       = React.useState('');
  const [tab, setTab]           = React.useState('report'); // report | hypotheses | actions | tree

  async function runAnalysis() {
    if (!question.trim()) return;
    setRunning(true); setError(''); setResult(null);
    const phases = ['THINK', 'RELATE', 'SUGGEST', 'EXECUTE', 'PRESENT'];
    let pi = 0;
    const tick = setInterval(() => { setPhase(phases[pi % phases.length]); pi++; }, 900);
    try {
      const res = await fetch(`${THINK_API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context: '', skip_execute: false }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setTab('report');
    } catch (e) {
      setError(e.message || 'Pipeline failed');
    } finally {
      clearInterval(tick);
      setPhase('');
      setRunning(false);
    }
  }

  const conf = result?.confidence ?? 0;
  const hyps = result?.suggest?.hypotheses ?? [];
  const actions = result?.execute?.actions ?? [];
  const keyJudgments = result?.present?.keyJudgments ?? [];
  const bluf = result?.bluf ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !running && runAnalysis()}
          placeholder="Intelligence query — e.g. 'Is our SSO under credential stuffing?'"
          style={{
            flex: 1, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--line)',
            color: 'var(--ink-0)', padding: '9px 12px', fontSize: 12, fontFamily: 'inherit',
            borderRadius: 3, outline: 'none',
          }}
        />
        <button
          onClick={runAnalysis}
          disabled={running || !question.trim()}
          style={{
            padding: '9px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            fontFamily: 'inherit', cursor: running ? 'not-allowed' : 'pointer', borderRadius: 3,
            border: '1px solid #9fc4e8', background: running ? 'rgba(159,196,232,0.08)' : 'rgba(159,196,232,0.18)',
            color: running ? 'var(--ink-3)' : '#bcd2e8', transition: 'all 0.15s',
          }}
        >
          {running ? `▶ ${phase}…` : '▶ ANALYZE'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: 'rgba(225,92,107,0.12)', border: '1px solid rgba(225,92,107,0.3)', borderRadius: 3, fontSize: 11, color: '#e15c6b' }}>
          ✗ {error}
        </div>
      )}

      {result && (
        <>
          {/* BLUF bar */}
          <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${CONF_COLOR(conf)}33`, borderLeft: `3px solid ${CONF_COLOR(conf)}`, borderRadius: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)' }}>BOTTOM LINE UP FRONT</span>
              <span className="mono" style={{ fontSize: 8, color: CONF_COLOR(conf), letterSpacing: '0.1em' }}>
                {CONF_LABEL(conf)} CONFIDENCE · {(conf * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-0)', lineHeight: 1.5 }}>{bluf}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {result.schema && (
                <span className="mono" style={{ fontSize: 9, padding: '2px 8px', border: '1px solid rgba(159,196,232,0.3)', borderRadius: 2, color: '#9fc4e8', letterSpacing: '0.1em' }}>
                  SCHEMA: {result.schema.toUpperCase()}
                </span>
              )}
              {result.think?.nodes && (
                <span className="mono" style={{ fontSize: 9, padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                  {result.think.nodes} REASONING NODES
                </span>
              )}
              {(result.relate?.entities?.length > 0) && (
                <span className="mono" style={{ fontSize: 9, padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                  {result.relate.entities.length} ENTITIES MAPPED
                </span>
              )}
            </div>
          </div>

          {/* Tab strip */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)' }}>
            {[
              { id: 'report',      label: 'IC REPORT' },
              { id: 'hypotheses',  label: `HYPOTHESES (${hyps.length})` },
              { id: 'actions',     label: `RESPONSE PLAN (${actions.length})` },
              { id: 'entities',    label: `ENTITIES (${result.relate?.entities?.length ?? 0})` },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '6px 14px', fontSize: 9, fontWeight: 700, fontFamily: 'inherit',
                letterSpacing: '0.12em', cursor: 'pointer', border: 'none',
                borderBottom: tab === t.id ? '2px solid #9fc4e8' : '2px solid transparent',
                background: 'transparent',
                color: tab === t.id ? '#bcd2e8' : 'var(--ink-4)',
                transition: 'color 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

            {tab === 'report' && (
              <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                {keyJudgments.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="label" style={{ marginBottom: 8, letterSpacing: '0.14em' }}>KEY JUDGMENTS</div>
                    {keyJudgments.map((j, i) => (
                      <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span className="mono" style={{ fontSize: 8, padding: '2px 6px', border: `1px solid ${CONF_COLOR(j.confidence === 'HIGH' ? 0.9 : j.confidence === 'MEDIUM' ? 0.6 : 0.3)}44`, borderRadius: 2, color: CONF_COLOR(j.confidence === 'HIGH' ? 0.9 : j.confidence === 'MEDIUM' ? 0.6 : 0.3), flexShrink: 0, letterSpacing: '0.08em' }}>
                          {j.confidence}
                        </span>
                        <div>
                          <div style={{ color: 'var(--ink-1)', marginBottom: 2 }}>{j.judgment}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink-4)', fontStyle: 'italic' }}>{j.rationale}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(result.present?.intelligenceGaps?.length > 0) && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="label" style={{ marginBottom: 8, letterSpacing: '0.14em' }}>INTELLIGENCE GAPS</div>
                    {result.present.intelligenceGaps.map((g, i) => (
                      <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 10.5, color: '#e89a4a' }}>⚠ {g}</div>
                    ))}
                  </div>
                )}
                {(result.present?.immediateRecommendations?.length > 0) && (
                  <div>
                    <div className="label" style={{ marginBottom: 8, letterSpacing: '0.14em' }}>IMMEDIATE RECOMMENDATIONS</div>
                    {result.present.immediateRecommendations.map((r, i) => (
                      <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 10.5, color: '#7ec99a' }}>→ {r}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'hypotheses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hyps.length === 0 && <div style={{ color: 'var(--ink-4)', fontSize: 11, padding: 12 }}>No hypotheses generated.</div>}
                {hyps.map((h, i) => (
                  <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.25)', border: `1px solid ${CONF_COLOR(h.confidence)}22`, borderLeft: `3px solid ${CONF_COLOR(h.confidence)}`, borderRadius: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>HYPOTHESIS #{h.rank ?? i + 1}</span>
                      <span className="mono" style={{ fontSize: 9, color: CONF_COLOR(h.confidence), letterSpacing: '0.1em' }}>{(h.confidence * 100).toFixed(0)}% CONF</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-0)', marginBottom: 10, lineHeight: 1.5 }}>{h.hypothesis}</div>
                    {h.evidence?.length > 0 && (
                      <div style={{ fontSize: 10, color: '#7ec99a', marginBottom: 4 }}>
                        <span style={{ opacity: 0.6, letterSpacing: '0.1em', fontSize: 8 }}>EVIDENCE · </span>
                        {h.evidence.join(' · ')}
                      </div>
                    )}
                    {h.predictedIndicators?.length > 0 && (
                      <div style={{ fontSize: 10, color: '#9fc4e8' }}>
                        <span style={{ opacity: 0.6, letterSpacing: '0.1em', fontSize: 8 }}>PREDICTED · </span>
                        {h.predictedIndicators.join(' · ')}
                      </div>
                    )}
                    {h.actionToVerify && (
                      <div style={{ marginTop: 8, padding: '5px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 2, fontSize: 10, color: '#e89a4a' }}>
                        ▶ VERIFY: {h.actionToVerify}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {actions.length === 0 && <div style={{ color: 'var(--ink-4)', fontSize: 11, padding: 12 }}>No response plan generated.</div>}
                {result.execute?.strategy && (
                  <div style={{ padding: '8px 12px', background: 'rgba(159,196,232,0.08)', border: '1px solid rgba(159,196,232,0.2)', borderRadius: 3, fontSize: 11, color: '#9fc4e8', marginBottom: 4 }}>
                    <span style={{ opacity: 0.6, fontSize: 9, letterSpacing: '0.12em' }}>STRATEGY · </span>{result.execute.strategy}
                  </div>
                )}
                {actions.map((a, i) => (
                  <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)', borderRadius: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className="mono" style={{ fontSize: 10, color: '#7ec99a', fontWeight: 700 }}>#{i + 1} — {a.effort?.toUpperCase() ?? 'ACT'}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>PRIORITY {a.priority ?? i + 1}/10</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-0)', marginBottom: 6, lineHeight: 1.4 }}>{a.action}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>
                      <span style={{ opacity: 0.6 }}>TARGETS · </span>{a.targetsCause}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                      <span style={{ opacity: 0.6 }}>MECHANISM · </span>{a.mechanism}
                    </div>
                  </div>
                ))}
                {result.execute?.prediction?.goalAchievement != null && (
                  <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', borderRadius: 3 }}>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>PREDICTED GOAL ACHIEVEMENT · </span>
                    <span style={{ color: CONF_COLOR(result.execute.prediction.goalAchievement), fontWeight: 700 }}>
                      {(result.execute.prediction.goalAchievement * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {tab === 'entities' && (
              <div>
                {(result.relate?.entities ?? []).length === 0 && <div style={{ color: 'var(--ink-4)', fontSize: 11, padding: 12 }}>No entities extracted.</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {(result.relate?.entities ?? []).map((e, i) => (
                    <div key={i} style={{ padding: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)', borderRadius: 3 }}>
                      <div className="mono" style={{ fontSize: 8, color: '#9fc4e8', letterSpacing: '0.12em', marginBottom: 4 }}>{e.type?.toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-0)', fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--ink-4)' }}>conf: {((e.confidence ?? 0.7) * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}

      {!result && !running && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--ink-4)' }}>THINK ENGINE READY</div>
          <div style={{ fontSize: 10, color: 'var(--ink-5)', textAlign: 'center', maxWidth: 340 }}>
            THINK → RELATE → SUGGEST → EXECUTE → PRESENT<br />
            Palantir-grade intelligence · AGoT reasoning · KAIROS schemas · A2P causal planning
          </div>
        </div>
      )}
    </div>
  );
}

function Nexus() {
  const [selectedSwarm, setSelectedSwarm] = React.useState(AGENT_SWARMS[0]);
  const [log, setLog] = React.useState(NEXUS_LOG_INITIAL);
  const [tick, setTick] = React.useState(0);
  const [nexusTab, setNexusTab] = React.useState('swarms'); // swarms | think

  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4800);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (tick === 0) return;
    const entries = [
      { agent: 'Hunter-Beta',  action: 'Cross-domain correlation updated — 3 new lateral paths', status: 'INFO' },
      { agent: 'HoneyDeploy',  action: 'Honeypot interaction logged from 185.220.101.42',        status: 'WARN' },
      { agent: 'ChainFX',      action: 'Kill chain extended: S3 exfil node confirmed',           status: 'WARN' },
      { agent: 'OSINT-1',      action: 'AS9009 · M247 — known exit-node ASN, high risk',        status: 'INFO' },
      { agent: 'AttackCapture',action: 'Attacker tried credential spray on HP-001',              status: 'WARN' },
      { agent: 'PatternEx',    action: 'Instinct updated: block Tor exit nodes at perimeter',    status: 'DONE' },
    ];
    const e = entries[tick % entries.length];
    const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLog(prev => [{ t: now, ...e }, ...prev].slice(0, 24));
  }, [tick]);

  const totalAgents = AGENT_SWARMS.reduce((s, sw) => s + sw.agents.length, 0);
  const activeAgents = AGENT_SWARMS.reduce((s, sw) => s + sw.agents.filter(a => a.status === 'ACTIVE' || a.status === 'RUNNING').length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', minHeight: 0 }}>

      {/* Stats bar + tab strip */}
      <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 1fr', gap: 0 }}>
        <span className="corner-tick tl" /><span className="corner-tick tr" /><span className="corner-tick bl" /><span className="corner-tick br" />
        {[
          { label: 'TOTAL AGENTS',   value: totalAgents, tone: '#bcd2e8' },
          { label: 'ACTIVE NOW',     value: activeAgents, tone: '#7ec99a' },
          { label: 'SWARMS',         value: AGENT_SWARMS.length, tone: '#9fc4e8' },
          { label: 'DECISIONS / HR', value: '142', tone: '#e89a4a' },
          { label: 'CONSENSUS RATE', value: '99.3%', tone: '#7ec99a' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '14px 16px', borderRight: '1px solid var(--line)' }}>
            <div className="label" style={{ marginBottom: 8 }}>{s.label}</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 600, color: s.tone, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
        {/* Tab switch */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 12px', gap: 6 }}>
          {[{ id: 'swarms', label: 'SWARMS' }, { id: 'think', label: '⬡ THINK' }].map(t => (
            <button key={t.id} onClick={() => setNexusTab(t.id)} style={{
              padding: '5px 10px', fontSize: 9, fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.12em',
              cursor: 'pointer', borderRadius: 2, border: '1px solid',
              borderColor: nexusTab === t.id ? '#9fc4e8' : 'var(--line)',
              background: nexusTab === t.id ? 'rgba(159,196,232,0.15)' : 'transparent',
              color: nexusTab === t.id ? '#bcd2e8' : 'var(--ink-4)',
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {nexusTab === 'think' ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <PP
            title="THINK ENGINE"
            sub="THINK → RELATE → SUGGEST → EXECUTE → PRESENT"
            right={<PPl tone="live" dotPulse>PALANTIR-GRADE</PPl>}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <ThinkPanel />
          </PP>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14, flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP
          title="AGENT SWARM GRID"
          sub={`${totalAgents} AGENTS · ${AGENT_SWARMS.length} SWARMS · RAFT CONSENSUS`}
          right={<PPl tone="live" dotPulse>ORCHESTRATING</PPl>}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, overflowY: 'auto' }}>
            {AGENT_SWARMS.map(swarm => (
              <div
                key={swarm.id}
                onClick={() => setSelectedSwarm(swarm)}
                style={{
                  border: `1px solid ${selectedSwarm.id === swarm.id ? swarm.color : 'var(--line)'}`,
                  borderRadius: 4, padding: 10, cursor: 'pointer',
                  background: selectedSwarm.id === swarm.id ? `${swarm.color}0d` : 'rgba(0,0,0,0.15)',
                  transition: 'all 0.18s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="mono" style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.18em', color: swarm.color }}>{swarm.name}</span>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: swarm.color, boxShadow: `0 0 5px ${swarm.color}`, animation: 'pulse-dot 2s infinite' }} />
                </div>
                {swarm.agents.map((agent, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: i < swarm.agents.length - 1 ? 5 : 0 }}>
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
                      background: agent.status === 'ACTIVE' || agent.status === 'RUNNING' ? '#7ec99a' :
                                  agent.status === 'DONE'    ? '#5dba89' :
                                  agent.status === 'STANDBY' ? '#9fc4e8' :
                                  agent.status === 'QUEUED'  ? '#e89a4a' : 'var(--ink-4)',
                      boxShadow: (agent.status === 'ACTIVE' || agent.status === 'RUNNING') ? '0 0 4px #7ec99a' : 'none',
                    }} />
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </PP>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP
          title={selectedSwarm.name}
          sub={`${selectedSwarm.agents.length} AGENTS · CLICK TO SELECT`}
          right={<PPl tone="live" dotPulse>ACTIVE</PPl>}
        >
          {selectedSwarm.agents.map((agent, i) => (
            <div key={i} style={{ padding: '9px 0', borderBottom: i < selectedSwarm.agents.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-0)', fontWeight: 600 }}>{agent.name}</span>
                <span className="mono" style={{
                  fontSize: 8, letterSpacing: '0.14em',
                  color: agent.status === 'ACTIVE' || agent.status === 'RUNNING' ? '#7ec99a' :
                         agent.status === 'DONE'    ? '#5dba89' :
                         agent.status === 'QUEUED'  ? '#e89a4a' : 'var(--ink-3)',
                }}>{agent.status}</span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>{agent.task}</div>
            </div>
          ))}
        </PP>

        <PP
          title="AUTONOMOUS DECISION LOG"
          sub="LIVE AGENT ACTIONS"
          right={<PPl tone="info" dotPulse>STREAMING</PPl>}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, overflowY: 'auto', margin: '-10px' }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 90px 1fr', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--line)', fontSize: 10.5 }}>
                <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 9 }}>{entry.t}</span>
                <span className="mono" style={{ color: selectedSwarm.color, fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.agent}</span>
                <span style={{
                  color: entry.status === 'WARN' ? '#f0c896' : entry.status === 'DONE' ? '#7ec99a' : 'var(--ink-2)',
                  fontSize: 10, lineHeight: 1.4,
                }}>{entry.action}</span>
              </div>
            ))}
          </div>
        </PP>
      </div>
      </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   PHANTOM — Deception Intelligence Network
══════════════════════════════════════════════════════ */

const HONEYPOTS = [
  { id: 'HP-001', name: 'Fake Faculty SSO Portal',    subnet: '10.0.1.0/24',   type: 'SSH+HTTPS',   hits: 47, active: true,  sev: 'CRIT' },
  { id: 'HP-002', name: 'Decoy Research S3 Bucket',   subnet: 'AWS us-east-1', type: 'Cloud Object', hits: 23, active: true,  sev: 'HIGH' },
  { id: 'HP-003', name: 'Shadow Database Server',     subnet: '10.0.2.0/24',   type: 'PostgreSQL',   hits: 12, active: true,  sev: 'HIGH' },
  { id: 'HP-004', name: 'Canary LDAP Credentials',    subnet: 'Directory',     type: 'Token',        hits: 8,  active: true,  sev: 'MED' },
  { id: 'HP-005', name: 'Phantom Finance Portal',     subnet: '10.0.5.0/24',   type: 'HTTPS',        hits: 3,  active: true,  sev: 'MED' },
  { id: 'HP-006', name: 'Decoy Research VPN Gateway', subnet: '10.0.8.0/24',   type: 'OpenVPN',      hits: 1,  active: false, sev: 'LOW' },
];

const PHANTOM_CAPTURES = [
  { id: 'CAP-0041', src: '185.220.101.42', country: 'NL', hp: 'HP-001', ttps: ['T1078.004', 'T1110'], duration: '4m 22s', dna: 'V7F3-KP-88A', active: true },
  { id: 'CAP-0040', src: '203.0.113.77',   country: 'CN', hp: 'HP-003', ttps: ['T1190', 'T1505.003'], duration: '1m 07s', dna: 'A2Q9-ZX-11C', active: true },
  { id: 'CAP-0039', src: '45.142.213.190', country: 'RU', hp: 'HP-002', ttps: ['T1530', 'T1537'],    duration: '8m 55s', dna: 'K8R1-MN-44D', active: true },
];

function Phantom() {
  const [selectedCapture, setSelectedCapture] = React.useState(PHANTOM_CAPTURES[0]);
  const [hitCount, setHitCount] = React.useState(83);

  React.useEffect(() => {
    const id = setInterval(() => setHitCount(c => c + (Math.random() < 0.4 ? 1 : 0)), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
          <span className="corner-tick tl" /><span className="corner-tick tr" /><span className="corner-tick bl" /><span className="corner-tick br" />
          {[
            { label: 'ACTIVE LURES',     value: HONEYPOTS.filter(h => h.active).length, tone: '#7ec99a' },
            { label: 'CAPTURES TODAY',   value: hitCount,    tone: '#e15c6b' },
            { label: 'LIVE SESSIONS',    value: PHANTOM_CAPTURES.length, tone: '#e89a4a' },
            { label: 'UNIQUE IPs',       value: '31',        tone: '#9fc4e8' },
            { label: 'DNA PROFILES',     value: '19',        tone: '#9b9ad8' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: '14px 16px', borderRight: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div className="label" style={{ marginBottom: 8 }}>{s.label}</div>
              <div className="num" style={{ fontSize: 24, fontWeight: 600, color: s.tone, letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <PP
          title="DECEPTION ASSET REGISTRY"
          sub={`${HONEYPOTS.length} LURES DEPLOYED · ${HONEYPOTS.filter(h => h.active).length} ARMED`}
          right={<PPl tone="live" dotPulse>ARMED</PPl>}
        >
          <div className="t-head" style={{ gridTemplateColumns: '80px 220px 1fr 110px 60px 70px 60px' }}>
            <span>ID</span><span>ASSET NAME</span><span>SUBNET</span><span>TYPE</span><span>HITS</span><span>STATUS</span><span>SEV</span>
          </div>
          {HONEYPOTS.map((hp, i) => (
            <div key={hp.id} className="t-row" style={{ gridTemplateColumns: '80px 220px 1fr 110px 60px 70px 60px', fontSize: 11.5 }}>
              <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{hp.id}</span>
              <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{hp.name}</span>
              <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 10 }}>{hp.subnet}</span>
              <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{hp.type}</span>
              <span className="num" style={{ color: hp.hits > 20 ? '#e15c6b' : hp.hits > 5 ? '#e89a4a' : 'var(--ink-2)' }}>{hp.hits}</span>
              <span className="mono" style={{ color: hp.active ? '#7ec99a' : 'var(--ink-4)', fontSize: 9, letterSpacing: '0.1em' }}>{hp.active ? 'ARMED' : 'OFFLINE'}</span>
              <span className="mono" style={{ color: SC[hp.sev], fontWeight: 700, fontSize: 10 }}>{hp.sev}</span>
            </div>
          ))}
        </PP>

        <PP
          title="ACTIVE ATTACKER CAPTURES"
          sub="HONEYPOT SESSIONS · TTP COLLECTION IN PROGRESS"
          right={<PPl tone="crit" dotPulse>3 LIVE SESSIONS</PPl>}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, overflowY: 'auto', margin: '-14px' }}>
            <div className="t-head" style={{ gridTemplateColumns: '90px 130px 40px 80px 200px 1fr 90px' }}>
              <span>ID</span><span>SOURCE IP</span><span>GEO</span><span>LURE</span><span>TTPs OBSERVED</span><span>DNA SIGNATURE</span><span>DURATION</span>
            </div>
            {PHANTOM_CAPTURES.map((c, i) => (
              <div key={c.id} className="t-row"
                onClick={() => setSelectedCapture(c)}
                style={{
                  gridTemplateColumns: '90px 130px 40px 80px 200px 1fr 90px',
                  fontSize: 11, cursor: 'pointer',
                  background: selectedCapture?.id === c.id ? 'rgba(159,196,232,0.05)' : 'transparent',
                }}>
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{c.id}</span>
                <span className="mono" style={{ color: '#f0b3ba' }}>{c.src}</span>
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{c.country}</span>
                <span className="mono" style={{ color: '#bcd2e8' }}>{c.hp}</span>
                <span style={{ color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ttps.join(' · ')}</span>
                <span className="mono" style={{ color: '#9b9ad8', fontWeight: 600 }}>{c.dna}</span>
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{c.duration}</span>
              </div>
            ))}
          </div>
        </PP>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {selectedCapture && (
          <PP title="CAPTURE DETAIL" sub={selectedCapture.id} right={<PPl tone="crit" dotPulse>LIVE SESSION</PPl>}>
            <DetailRow k="SOURCE IP"  v={selectedCapture.src}     valColor="#f0b3ba" />
            <DetailRow k="GEO ORIGIN" v={selectedCapture.country} />
            <DetailRow k="HONEYPOT"   v={selectedCapture.hp} />
            <DetailRow k="DURATION"   v={selectedCapture.duration} />
            <div className="hairline" style={{ margin: '12px 0' }} />
            <div className="label" style={{ marginBottom: 8 }}>MITRE TTPs OBSERVED</div>
            {selectedCapture.ttps.map((ttp, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span className="mono" style={{ color: '#9fc4e8' }}>{ttp}</span>
                <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>CONFIRMED</span>
              </div>
            ))}
            <div className="hairline" style={{ margin: '12px 0' }} />
            <div className="label" style={{ marginBottom: 6 }}>BEHAVIORAL DNA SIGNATURE</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', borderRadius: 3, padding: '12px', marginBottom: 12, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 18, letterSpacing: '0.3em', color: '#9b9ad8', marginBottom: 4 }}>{selectedCapture.dna}</div>
              <div style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>ATTACKER BEHAVIORAL FINGERPRINT</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>ADD TO INTEL</button>
              <button className="btn btn-danger" style={{ flex: 1 }}>TERMINATE</button>
            </div>
          </PP>
        )}

        <PP title="DECEPTION EFFECTIVENESS" sub="30-DAY ROLLING METRICS" dense>
          <div style={{ textAlign: 'center', padding: '6px 0 2px' }}>
            <div className="num" style={{ fontSize: 44, fontWeight: 700, color: '#7ec99a', letterSpacing: '-0.03em', lineHeight: 1 }}>91<span style={{ fontSize: 14, color: 'var(--ink-3)' }}>%</span></div>
            <div className="label" style={{ marginTop: 4, color: '#7ec99a' }}>+6% vs LAST MONTH</div>
          </div>
          <div className="hairline" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ScoreBar label="Attacker Engagement"  v={91} c="#7ec99a" />
            <ScoreBar label="TTP Capture Rate"     v={84} c="#9fc4e8" />
            <ScoreBar label="Early Warning Lift"   v={78} c="#bcd2e8" />
            <ScoreBar label="Attribution Accuracy" v={69} c="#9b9ad8" />
          </div>
        </PP>

        <PP title="CANARY TOKENS" sub="DEPLOYED CREDENTIAL LURES" dense>
          {[
            { type: 'AWS API Key',     location: 'decoy-dev/.env',          triggered: false },
            { type: 'SSH Private Key', location: 'fake-backup/keys/id_rsa', triggered: false },
            { type: 'DB Password',     location: 'legacy-config dump',      triggered: true  },
            { type: 'OAuth Token',     location: 'research-portal cache',   triggered: false },
          ].map((ct, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-1)', fontWeight: 500 }}>{ct.type}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 2 }}>{ct.location}</div>
              </div>
              <PPl tone={ct.triggered ? 'crit' : 'ghost'} dotPulse={ct.triggered}>{ct.triggered ? 'TRIGGERED' : 'ARMED'}</PPl>
            </div>
          ))}
        </PP>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   BREACH-IQ — Quantitative Risk Intelligence
══════════════════════════════════════════════════════ */

const RISK_ASSETS = [
  { name: 'Student PII (247K records)',      weight: 28, risk: 82, exposure: '$46.2M', category: 'DATA' },
  { name: 'Research IP & Unpublished Data', weight: 25, risk: 74, exposure: '$38.5M', category: 'IP' },
  { name: 'Financial Systems & Payments',   weight: 22, risk: 68, exposure: '$31.0M', category: 'FINANCE' },
  { name: 'Health Records (HIPAA PHI)',      weight: 12, risk: 71, exposure: '$22.1M', category: 'HEALTH' },
  { name: 'IT Infrastructure',              weight: 8,  risk: 55, exposure: '$9.4M',  category: 'INFRA' },
  { name: 'Faculty & Staff Credentials',    weight: 5,  risk: 89, exposure: '$4.8M',  category: 'AUTH' },
];

const COMPLIANCE_FRAMEWORKS = [
  { name: 'NIST CSF 2.0',   score: 67, color: '#e89a4a' },
  { name: 'ISO 27001:2022', score: 72, color: '#e89a4a' },
  { name: 'GDPR Art.32',    score: 81, color: '#7ec99a' },
  { name: 'FERPA',          score: 88, color: '#7ec99a' },
  { name: 'HIPAA Security', score: 74, color: '#bcd2e8' },
  { name: 'PCI DSS 4.0',    score: 58, color: '#e15c6b' },
];

function BreachIQ() {
  const [prob, setProb] = React.useState({ y1: 31.2, y2: 57.8, y3: 79.4 });
  const [simRunning, setSimRunning] = React.useState(true);
  const [iterations, setIterations] = React.useState(48320);

  React.useEffect(() => {
    if (!simRunning) return;
    const id = setInterval(() => {
      setProb(p => ({
        y1: Math.max(20, Math.min(45, p.y1 + (Math.random() * 0.5 - 0.25))),
        y2: Math.max(45, Math.min(70, p.y2 + (Math.random() * 0.4 - 0.2))),
        y3: Math.max(65, Math.min(90, p.y3 + (Math.random() * 0.3 - 0.15))),
      }));
      setIterations(n => n + Math.floor(Math.random() * 480 + 320));
    }, 1100);
    return () => clearInterval(id);
  }, [simRunning]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 14, height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP
          title="BREACH PROBABILITY · MONTE CARLO"
          sub={`${iterations.toLocaleString()} ITERATIONS`}
          right={<PPl tone={simRunning ? 'live' : 'ghost'} dotPulse={simRunning}>{simRunning ? 'RUNNING' : 'PAUSED'}</PPl>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              { horizon: '1 YEAR',  prob: prob.y1, color: '#e89a4a' },
              { horizon: '2 YEARS', prob: prob.y2, color: '#f0738b' },
              { horizon: '3 YEARS', prob: prob.y3, color: '#e15c6b' },
            ].map((h, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRight: i < 2 ? '1px solid var(--line)' : 'none', textAlign: 'center' }}>
                <div className="label" style={{ marginBottom: 8, fontSize: 9 }}>{h.horizon}</div>
                <div className="num" style={{ fontSize: 30, fontWeight: 700, color: h.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {h.prob.toFixed(1)}<span style={{ fontSize: 13, color: 'var(--ink-4)' }}>%</span>
                </div>
                <div style={{ marginTop: 8, height: 3, background: 'rgba(0,0,0,0.3)', borderRadius: 1.5, overflow: 'hidden' }}>
                  <div style={{ width: `${h.prob}%`, height: '100%', background: h.color, transition: 'width 0.9s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="hairline" style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSimRunning(r => !r)}>
              {simRunning ? 'PAUSE SIMULATION' : 'RUN SIMULATION'}
            </button>
            <button className="btn">EXPORT PDF</button>
          </div>
        </PP>

        <PP title="FINANCIAL IMPACT MODEL" sub="EXPECTED LOSS · ANNUALIZED" dense>
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <div className="label" style={{ marginBottom: 2 }}>TOTAL EXPOSURE AT RISK</div>
            <div className="num" style={{ fontSize: 36, fontWeight: 700, color: '#e15c6b', letterSpacing: '-0.03em', lineHeight: 1 }}>$152M</div>
            <div className="label" style={{ color: 'var(--ink-3)', marginTop: 4 }}>ANNUALIZED LOSS EXPECTANCY · $4.8M</div>
          </div>
          <div className="hairline" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { label: 'Regulatory fines (GDPR/FERPA)', v: '$18.4M', pct: 12 },
              { label: 'Breach response & forensics',   v: '$4.1M',  pct: 3  },
              { label: 'Ransomware worst-case',          v: '$22.0M', pct: 14 },
              { label: 'Reputation & enrollment loss',  v: '$64.0M', pct: 42 },
              { label: 'Legal liability & settlements', v: '$43.5M', pct: 29 },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 10.5 }}>
                  <span style={{ color: 'var(--ink-2)' }}>{item.label}</span>
                  <span className="num" style={{ color: '#f0b3ba' }}>{item.v}</span>
                </div>
                <div style={{ height: 2.5, background: 'rgba(0,0,0,0.3)', borderRadius: 1.5, overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct * 2}%`, height: '100%', background: '#e15c6b', opacity: 0.55 }} />
                </div>
              </div>
            ))}
          </div>
        </PP>

        <PP title="COMPLIANCE SCORES" sub="CURRENT FRAMEWORK POSTURE" dense>
          {COMPLIANCE_FRAMEWORKS.map((f, i) => (
            <div key={i} style={{ marginBottom: i < COMPLIANCE_FRAMEWORKS.length - 1 ? 9 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, color: 'var(--ink-1)', fontWeight: 500 }}>{f.name}</span>
                <span className="num" style={{ fontSize: 11, color: f.color }}>{f.score}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(0,0,0,0.3)', borderRadius: 1.5, overflow: 'hidden' }}>
                <div style={{ width: `${f.score}%`, height: '100%', background: f.color, borderRadius: 1.5 }} />
              </div>
            </div>
          ))}
        </PP>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <PP
          title="RISK ASSET INVENTORY"
          sub="WEIGHTED EXPOSURE BY CATEGORY"
          right={<PPl tone="crit" dotPulse>HIGH RISK</PPl>}
          style={{ minHeight: 0 }}
        >
          <div className="t-head" style={{ gridTemplateColumns: '1fr 70px 70px 110px 120px' }}>
            <span>ASSET</span><span>CATEGORY</span><span>WEIGHT</span><span>EXPOSURE</span><span>RISK SCORE</span>
          </div>
          {RISK_ASSETS.map((asset, i) => (
            <div key={i} className="t-row" style={{ gridTemplateColumns: '1fr 70px 70px 110px 120px', fontSize: 11.5 }}>
              <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{asset.name}</span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{asset.category}</span>
              <span className="mono" style={{ color: 'var(--ink-2)' }}>{asset.weight}%</span>
              <span className="num" style={{ color: '#f0b3ba' }}>{asset.exposure}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="num" style={{ fontSize: 13, color: asset.risk >= 80 ? '#e15c6b' : asset.risk >= 65 ? '#e89a4a' : '#9fc4e8', fontWeight: 700 }}>{asset.risk}</span>
                <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.3)', borderRadius: 1.5, overflow: 'hidden' }}>
                  <div style={{ width: `${asset.risk}%`, height: '100%', background: asset.risk >= 80 ? '#e15c6b' : asset.risk >= 65 ? '#e89a4a' : '#9fc4e8' }} />
                </div>
              </div>
            </div>
          ))}
        </PP>

        <PP
          title="AI-RANKED REMEDIATION QUEUE"
          sub="SORTED BY IMPACT × EFFORT · CLICK TO ASSIGN"
          right={<PPl tone="warn">12 OPEN</PPl>}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, overflowY: 'auto', margin: '-14px' }}>
            <div className="t-head" style={{ gridTemplateColumns: '32px 1fr 80px 60px 80px 70px' }}>
              <span>PRI</span><span>ACTION REQUIRED</span><span>IMPACT</span><span>EFFORT</span><span>RISK SAVED</span><span>ACTION</span>
            </div>
            {[
              { pri: 1,  action: 'Patch CVE-2026-3142 in MOVEit Transfer',          impact: 'CRIT', effort: 'LOW', saved: '−18%' },
              { pri: 2,  action: 'Enforce MFA on all 14,328 principals',            impact: 'HIGH', effort: 'LOW', saved: '−12%' },
              { pri: 3,  action: 'Remove public ACL from argus-research-raw S3',    impact: 'CRIT', effort: 'LOW', saved: '−9%'  },
              { pri: 4,  action: 'Revoke 108 stale Azure AD guest accounts',        impact: 'HIGH', effort: 'LOW', saved: '−6%'  },
              { pri: 5,  action: 'Encrypt all RDS finance-db-replica volumes',      impact: 'HIGH', effort: 'MED', saved: '−5%'  },
              { pri: 6,  action: 'Segment research lab VLAN from faculty network',  impact: 'MED',  effort: 'HIGH', saved: '−4%' },
              { pri: 7,  action: 'Enable CloudTrail log file validation us-east-1', impact: 'LOW',  effort: 'LOW', saved: '−2%'  },
              { pri: 8,  action: 'Upgrade nodejs14.x Lambda functions (EOL)',       impact: 'MED',  effort: 'MED', saved: '−3%'  },
            ].map((item, i) => (
              <div key={i} className="t-row" style={{ gridTemplateColumns: '32px 1fr 80px 60px 80px 70px', fontSize: 11 }}>
                <span className="num" style={{ fontSize: 13, color: item.pri <= 2 ? '#e15c6b' : item.pri <= 4 ? '#e89a4a' : '#9fc4e8', fontWeight: 700 }}>#{item.pri}</span>
                <span style={{ color: 'var(--ink-1)' }}>{item.action}</span>
                <span className="mono" style={{ fontSize: 9, color: SC[item.impact] || 'var(--ink-3)', letterSpacing: '0.08em' }}>{item.impact}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{item.effort}</span>
                <span className="num" style={{ fontSize: 11, color: '#7ec99a', fontWeight: 600 }}>{item.saved}</span>
                <button className="btn" style={{ fontSize: 9, padding: '3px 8px' }}>ASSIGN</button>
              </div>
            ))}
          </div>
        </PP>
      </div>
    </div>
  );
}

window.argusModules = { Sentinel, Veil, Identity, Oracle, Skynet, Response, ThreatIntel, Nexus, Phantom, BreachIQ };
