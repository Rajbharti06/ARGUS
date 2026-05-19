/* ARGUS — main app */
const { Sidebar, StatusBar } = window.argusShell;
const { Overview } = window.argusOverview;
const { Sentinel, Veil, Identity, Oracle, Skynet, Response, ThreatIntel, Nexus, Phantom, BreachIQ } = window.argusModules;
const { Gaze } = window.argusGaze;

const SCREEN_LABELS = {
  overview:  'Overview',
  sentinel:  'Sentinel · Threat Monitoring',
  veil:      'Veil · Phishing Cognition',
  oracle:    'Oracle · Attack Correlation',
  identity:  'Identity · Trust & Behavior',
  skynet:    'Skynet · Cloud Posture',
  response:  'Response · Containment',
  intel:     'Threat Intelligence',
  gaze:      'GAZE · Omnisearch Intelligence',
  nexus:     'Nexus · Agent Orchestrator',
  phantom:   'Phantom · Deception Network',
  breach:    'Breach-IQ · Quantitative Risk',
};

const SCREEN_SUBS = {
  overview: 'Autonomous defense intelligence',
  sentinel: 'Real-time event telemetry',
  veil:     'AI-native phishing analysis',
  oracle:   'Cross-domain correlation engine',
  identity: 'Continuous trust evaluation',
  skynet:   'Multi-cloud posture management',
  response: 'Autonomous containment orchestration',
  intel:    'Global threat awareness',
  gaze:     'GitHub · Shodan · OTX · NVD · URLScan · RDAP · DNS · CISA KEV — any entity, all sources',
  nexus:    '32 autonomous agents · 8 swarms · Raft consensus',
  phantom:  'Honeypots · canary tokens · attacker DNA',
  breach:   'Monte Carlo breach probability · financial impact',
};

function App() {
  const [active, setActive] = React.useState('overview');
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="atmosphere" />
      <div className="doc-stamp" style={{ top: 56, right: 18 }}>CLASSIFICATION · TS//SCI · ARGUS-EYES-ONLY</div>
      <div className="doc-stamp" style={{ bottom: 8, left: 250 }}>NODE 04-A · INSTANCE: ARGUS-PRIME · UPLINK 0.4ms · INTEGRITY ✓</div>
      <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>
        <Sidebar active={active} setActive={setActive} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <StatusBar time={time} />
          <ScreenHeader active={active} />
          <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 18px' }} data-screen-label={SCREEN_LABELS[active]}>
            {active === 'overview' && <Overview />}
            {active === 'sentinel' && <Sentinel />}
            {active === 'veil' && <Veil />}
            {active === 'oracle' && <Oracle />}
            {active === 'identity' && <Identity />}
            {active === 'skynet' && <Skynet />}
            {active === 'response' && <Response />}
            {active === 'intel' && <ThreatIntel />}
            {active === 'gaze' && <Gaze />}
            {active === 'nexus' && <Nexus />}
            {active === 'phantom' && <Phantom />}
            {active === 'breach' && <BreachIQ />}
          </div>
        </main>
      </div>
    </>
  );
}

function ScreenHeader({ active }) {
  const tabs = [
    { id: 'overview',  label: 'OVERVIEW' },
    { id: 'sentinel',  label: 'SENTINEL' },
    { id: 'veil',      label: 'VEIL' },
    { id: 'oracle',    label: 'ORACLE' },
    { id: 'identity',  label: 'IDENTITY' },
    { id: 'skynet',    label: 'SKYNET' },
    { id: 'response',  label: 'RESPONSE' },
    { id: 'intel',     label: 'INTEL' },
    { id: 'gaze',      label: 'GAZE' },
    { id: 'nexus',     label: 'NEXUS' },
    { id: 'phantom',   label: 'PHANTOM' },
    { id: 'breach',    label: 'BREACH-IQ' },
  ];
  return (
    <div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexShrink: 0, position: 'relative' }}>
      <div>
        <div className="label" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--gold-soft)' }}>§ ARGUS / DEFENSE INTELLIGENCE</span>
          <span style={{ width: 10, height: 1, background: 'var(--line-3)' }} />
          <span>{SCREEN_LABELS[active].toUpperCase()}</span>
        </div>
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 26, fontWeight: 500, color: 'var(--ink-0)', letterSpacing: '-0.015em', lineHeight: 1.1 }}>
          {SCREEN_LABELS[active]}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 5, fontStyle: 'italic', fontFamily: "'Newsreader', serif" }}>{SCREEN_SUBS[active]}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-4)', marginRight: 8 }}>
          BRIEF · {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
        <button className="btn">EXPORT</button>
        <button className="btn">PLAYBOOKS</button>
        <button className="btn btn-primary">+ INVESTIGATE</button>
      </div>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 0, height: 1 }} className="gradient-rule" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
