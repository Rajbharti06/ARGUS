/* ARGUS — Overview module */
const { Panel: P, Pill: Pl, Kpi, Spark, ArgusCore, NEWS_FEED, ago, SEV_COLOR } = window.argusUtils;

function Overview() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, height: '100%' }}>
      {/* LEFT col */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <ActiveOperationCard />
        <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 14 }}>
          <CoreCard />
          <GeoCard />
        </div>
        <IncidentChain />
      </div>

      {/* RIGHT col */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <GlobalIntelFeed />
        <CognitionTelemetry />
      </div>
    </div>
  );
}

/* ── Active Operation (narrative continuity) ── */
function ActiveOperationCard() {
  const [pct, setPct] = React.useState(34);
  React.useEffect(() => {
    const id = setInterval(() => setPct(p => Math.min(100, p + (Math.random() * 0.4 - 0.05))), 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <P
      title="ACTIVE OPERATION · INC-2026-0418"
      sub="FACULTY IDENTITY COMPROMISE"
      right={<>
        <Pl tone="crit" dotPulse>CRITICAL</Pl>
        <Pl tone="ghost">CONTAINMENT IN PROGRESS</Pl>
      </>}
      dense
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 200px', gap: 0 }}>
        <Kpi label="ATTACK CHAIN CONFIDENCE" value="94%" sub="HIGH CERTAINTY" tone="crit" />
        <Kpi label="AFFECTED SYSTEMS" value="12" sub="3 SERVERS · 9 ENDPOINTS" tone="warn" />
        <Kpi label="INDICATORS OF COMPROMISE" value="47" sub="CORRELATED" />
        <Kpi label="THREAT ACTOR" value="ShinyHunters" sub="MED CONFIDENCE · TTP MATCH" tone="warn" />
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="label" style={{ marginBottom: 8 }}>CONTAINMENT</div>
          <div style={{ height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #e89a4a, #e15c6b)', transition: 'width 1s ease' }} />
          </div>
          <div className="num" style={{ fontSize: 10, marginTop: 6, color: 'var(--ink-2)' }}>
            {pct.toFixed(0)}% · ETA <span style={{ color: '#f0c896' }}>~14 min</span>
          </div>
        </div>
      </div>
    </P>
  );
}

/* ── ARGUS Core panel ── */
function CoreCard() {
  return (
    <P
      title="ARGUS CORE · NEURAL VISUALIZATION"
      sub="AUTONOMOUS COGNITION ENGINE"
      right={<><span className="dot info" /><span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'var(--ink-2)' }}>ONLINE</span></>}
    >
      <div style={{ paddingTop: 8, paddingBottom: 4 }}>
        <ArgusCore size={300} cognition={98.5} />
      </div>
      <div className="hairline" style={{ margin: '12px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <CoreStat label="ANALYSIS" value="REAL-TIME" tone="info" />
        <CoreStat label="ANOMALY DETECTION" value="12 EVENTS" tone="warn" />
        <CoreStat label="PREDICTIVE MODEL" value="ACTIVE" tone="good" />
      </div>
    </P>
  );
}

function CoreStat({ label, value, tone }) {
  const c = tone === 'warn' ? '#f0c896' : tone === 'good' ? '#7ec99a' : '#bcd2e8';
  const s = tone === 'warn' ? 'linear-gradient(90deg, transparent, #e89a4a, transparent)' :
            tone === 'good' ? 'linear-gradient(90deg, transparent, #5dba89, transparent)' :
                              'linear-gradient(90deg, transparent, #9fc4e8, transparent)';
  return (
    <div>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 11, color: c, letterSpacing: '0.05em', fontWeight: 500, marginBottom: 6 }}>{value}</div>
      <div style={{ height: 1.5, background: s, opacity: 0.5 }} />
    </div>
  );
}

/* ── Geographic threat map ── */
function GeoCard() {
  const points = [
    { x: 18, y: 38, sev: 'CRIT', label: 'EAST EU', color: '#e15c6b' },
    { x: 78, y: 32, sev: 'CRIT', label: 'EAST ASIA', color: '#e15c6b' },
    { x: 48, y: 26, sev: 'HIGH', label: 'CENTRAL EU', color: '#e89a4a' },
    { x: 22, y: 62, sev: 'MED',  label: 'SOUTH AM',  color: '#e89a4a' },
    { x: 62, y: 58, sev: 'MED',  label: 'INDIAN OCEAN', color: '#9fc4e8' },
    { x: 84, y: 70, sev: 'LOW',  label: 'OCEANIA',   color: '#9fc4e8' },
    { x: 14, y: 24, sev: 'HIGH', label: 'NORTH AM',  color: '#e89a4a' },
  ];
  // home location for ARGUS-protected institution
  const home = { x: 50, y: 42 };

  return (
    <P
      title="TACTICAL GEOSPATIAL THREAT MAP"
      sub="GLOBAL ATTACK ORIGIN · LIVE"
      right={<><Pl tone="crit" dotPulse>7 ACTIVE</Pl></>}
    >
      <div style={{ position: 'relative', aspectRatio: '2 / 1', background: 'radial-gradient(ellipse at center, rgba(159, 196, 232,0.04), transparent 70%)', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
        {/* world dots */}
        <WorldMapSVG />

        {/* attack arcs */}
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {points.slice(0, 5).map((p, i) => {
            const dx = home.x - p.x;
            const dy = home.y / 2 - p.y / 2;
            const mx = (home.x + p.x) / 2;
            const my = (home.y + p.y) / 4 - 8;
            return (
              <g key={i}>
                <path d={`M ${p.x} ${p.y/2} Q ${mx} ${my} ${home.x} ${home.y/2}`} stroke={p.color} strokeWidth="0.25" fill="none" opacity="0.55" strokeDasharray="1 1.5" style={{ animation: `drift ${4 + i}s linear infinite` }} />
              </g>
            );
          })}
          {/* radar rings around home */}
          {[3, 6, 9, 12].map((r, i) => (
            <circle key={i} cx={home.x} cy={home.y/2} r={r} stroke="rgba(159, 196, 232,0.18)" strokeWidth="0.15" fill="none" style={{ animation: `breathe ${3 + i}s ease-in-out infinite` }} />
          ))}
        </svg>

        {/* threat origin pulses */}
        {points.map((p, i) => (
          <div key={i} className="geo-pulse" style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.color, transform: 'translate(-50%, -50%)' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 5, height: 5, borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
          </div>
        ))}

        {/* home base */}
        <div style={{ position: 'absolute', left: `${home.x}%`, top: `${home.y}%`, transform: 'translate(-50%, -50%)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 1, border: '1px solid #9fc4e8', background: 'rgba(159, 196, 232,0.4)', boxShadow: '0 0 14px #9fc4e8', animation: 'breathe 2s ease-in-out infinite' }} />
        </div>

        {/* readout overlay */}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(8,11,16,0.85)', border: '1px solid var(--line-2)', padding: '10px 12px', borderRadius: 3, minWidth: 170 }}>
          <div className="label" style={{ marginBottom: 6 }}>THREAT ORIGIN</div>
          <div className="mono" style={{ fontSize: 11, color: '#f0b3ba', fontWeight: 600, marginBottom: 8 }}>EASTERN EUROPE</div>
          <div className="label" style={{ marginBottom: 4 }}>TARGET</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)', marginBottom: 8 }}>FACULTY SSO</div>
          <div className="label" style={{ marginBottom: 4 }}>SEVERITY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="dot crit" /><span className="mono" style={{ fontSize: 11, color: '#e15c6b', fontWeight: 600 }}>CRITICAL</span>
          </div>
        </div>

        {/* lat/long readout */}
        <div className="mono" style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 9, letterSpacing: '0.15em', color: 'var(--ink-4)' }}>
          LAT 40.71 N · LON -74.00 W · REF MERCATOR · SAT-LINK 0.4ms
        </div>
      </div>
    </P>
  );
}

function WorldMapSVG() {
  // simplified continent dot pattern
  const dots = [];
  // continent regions roughly
  const continents = [
    { x0: 8, y0: 18, x1: 28, y1: 35, density: 0.5 },     // N America
    { x0: 20, y0: 50, x1: 32, y1: 78, density: 0.4 },    // S America
    { x0: 42, y0: 18, x1: 58, y1: 38, density: 0.55 },   // Europe
    { x0: 44, y0: 38, x1: 62, y1: 70, density: 0.5 },    // Africa
    { x0: 58, y0: 18, x1: 88, y1: 50, density: 0.55 },   // Asia
    { x0: 78, y0: 60, x1: 92, y1: 78, density: 0.45 },   // Oceania
  ];
  let id = 0;
  for (const c of continents) {
    for (let x = c.x0; x < c.x1; x += 1.6) {
      for (let y = c.y0; y < c.y1; y += 1.6) {
        if (Math.random() < c.density) dots.push({ x, y, id: id++ });
      }
    }
  }
  return (
    <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {dots.map(d => <circle key={d.id} cx={d.x} cy={d.y} r="0.35" fill="#9fc4e8" opacity="0.28" />)}
    </svg>
  );
}

/* ── Global Threat Intelligence Feed ── */
function GlobalIntelFeed() {
  const [feed, setFeed] = React.useState(NEWS_FEED);
  const [filter, setFilter] = React.useState('ALL');
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  // Re-shuffle "now" mark every tick — simulates live feed
  React.useEffect(() => {
    if (tick === 0) return;
    setFeed(prev => {
      const fresh = {
        sev: ['CRIT', 'HIGH', 'MED', 'INFO'][Math.floor(Math.random() * 4)],
        source: ['Reuters', 'CISA', 'CERT-EU', 'arXiv', 'TheHackerNews', 'MITRE'][Math.floor(Math.random() * 6)],
        sector: ['Education', 'Healthcare', 'Finance', 'Industrial', 'Federal'][Math.floor(Math.random() * 5)],
        title: [
          'New zero-day in widely-used identity provider — exploitation observed in EU education sector',
          'AI-generated deepfake call attempts to wire $4.2M from university bursar — blocked',
          'Researcher publishes PoC for SSO token replay across multiple SAML libraries',
          'CL0P resurfaces with new file-transfer-appliance campaign targeting research labs',
          'Browser extension supply-chain compromise affects 2.3M users worldwide',
        ][Math.floor(Math.random() * 5)],
        time: 0.3,
        tags: ['Zero-day', 'Live'],
      };
      return [fresh, ...prev.map(p => ({ ...p, time: p.time + 8/60 }))].slice(0, 14);
    });
  }, [tick]);

  const filtered = filter === 'ALL' ? feed : feed.filter(f => f.sev === filter);

  return (
    <P
      title="GLOBAL THREAT INTELLIGENCE"
      sub="LIVE FEED · MULTI-SOURCE"
      right={<>
        <FilterTabs value={filter} onChange={setFilter} />
        <Pl tone="live" dotPulse>STREAMING</Pl>
      </>}
      style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', margin: '-14px', padding: 0, position: 'relative' }}>
        {filtered.map((item, i) => (
          <div key={`${item.source}-${i}`} className="feed-row" style={i === 0 && tick > 0 ? { background: 'rgba(159, 196, 232,0.05)' } : {}}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', paddingTop: 2 }}>
              {ago(item.time)} ago
            </div>
            <div style={{ width: 4, height: '100%', minHeight: 28, background: SEV_COLOR[item.sev], borderRadius: 1, marginTop: 2, opacity: 0.7 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: SEV_COLOR[item.sev] }}>{item.sev}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{item.source.toUpperCase()}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>·</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{item.sector.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--ink-1)', marginBottom: 6 }}>{item.title}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(item.tags || []).map(t => (
                  <span key={t} className="mono" style={{ fontSize: 8.5, padding: '1.5px 6px', border: '1px solid var(--line-2)', borderRadius: 1, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: 2 }}>
              <button className="btn" style={{ fontSize: 9, padding: '4px 8px' }}>RELEVANCE</button>
            </div>
          </div>
        ))}
      </div>
    </P>
  );
}

function FilterTabs({ value, onChange }) {
  const opts = ['ALL', 'CRIT', 'HIGH', 'MED'];
  return (
    <div style={{ display: 'flex', gap: 0, border: '1px solid var(--line-2)', borderRadius: 2, overflow: 'hidden' }}>
      {opts.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className="mono"
          style={{
            border: 'none', padding: '4px 8px', fontSize: 9, letterSpacing: '0.15em', cursor: 'pointer',
            background: value === o ? 'rgba(159, 196, 232,0.12)' : 'transparent',
            color: value === o ? '#bcd2e8' : 'var(--ink-3)',
            borderRight: '1px solid var(--line)',
          }}>{o}</button>
      ))}
    </div>
  );
}

/* ── Cognition telemetry strip ── */
function CognitionTelemetry() {
  const [data, setData] = React.useState(() => Array.from({ length: 40 }, () => 30 + Math.random() * 50));
  React.useEffect(() => {
    const id = setInterval(() => setData(d => [...d.slice(1), 20 + Math.random() * 70]), 800);
    return () => clearInterval(id);
  }, []);
  return (
    <P title="COGNITION TELEMETRY" sub="MODEL INTROSPECTION" dense>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <TelemetryRow label="Embedding Throughput" value="14.2k/s" data={data} color="#9fc4e8" />
        <TelemetryRow label="Anomaly Inference" value="2.4ms" data={data.map(x => 100 - x)} color="#9b9ad8" />
        <TelemetryRow label="LLM Token Stream" value="892t/s" data={data.map(x => x * 0.8 + 10)} color="#e89a4a" />
        <TelemetryRow label="Correlation Engine" value="ACTIVE" data={data.map(x => x * 0.9)} color="#7ec99a" />
      </div>
    </P>
  );
}

function TelemetryRow({ label, value, data, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="label" style={{ fontSize: 9 }}>{label}</span>
        <span className="mono" style={{ fontSize: 10, color, letterSpacing: '0.05em' }}>{value}</span>
      </div>
      <Spark data={data} color={color} height={22} />
    </div>
  );
}

/* ── Cinematic incident chain ── */
function IncidentChain() {
  const phases = [
    { time: '08:30', code: 'T1566.001', name: 'PHISHING DELIVERED', desc: 'Spoofed IT-services email · 34 recipients', sev: 'HIGH', icon: '✉' },
    { time: '09:15', code: 'T1078.004', name: 'CREDENTIAL COMPROMISE', desc: 'SSO token captured · faculty account', sev: 'CRIT', icon: '🔑' },
    { time: '10:05', code: 'T1021', name: 'LATERAL MOVEMENT', desc: 'WMI · 4 endpoints · finance subnet', sev: 'CRIT', icon: '⇆' },
    { time: '10:50', code: 'T1530', name: 'CLOUD DATA ACCESS', desc: 'S3 enumeration · research bucket', sev: 'CRIT', icon: '☁' },
    { time: '11:32', code: 'T1567', name: 'EXFILTRATION ATTEMPT', desc: '12.4GB queued · 45.142.213.190', sev: 'CRIT', icon: '↗' },
  ];
  return (
    <P
      title="ATTACK CHAIN RECONSTRUCTION · INC-2026-0418"
      sub="ORACLE CORRELATION ENGINE"
      right={<><Pl tone="ghost">MITRE ATT&CK</Pl><Pl tone="crit" dotPulse>UNFOLDING</Pl></>}
      style={{ minHeight: 0 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', position: 'relative', gap: 0 }}>
        {/* connecting line */}
        <svg viewBox="0 0 100 4" preserveAspectRatio="none" style={{ position: 'absolute', top: 28, left: '10%', right: '10%', width: '80%', height: 4 }}>
          <line x1="0" y1="2" x2="100" y2="2" stroke="rgba(225, 92, 107,0.4)" strokeWidth="0.5" strokeDasharray="2 1" />
        </svg>

        {phases.map((p, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px', position: 'relative', zIndex: 1 }}>
            {/* dot */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(225, 92, 107,0.18), rgba(225, 92, 107,0.04))',
              border: `1.5px solid ${SEV_COLOR[p.sev]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: SEV_COLOR[p.sev],
              boxShadow: `0 0 14px ${SEV_COLOR[p.sev]}40`,
              marginBottom: 12,
              position: 'relative',
            }}>
              {p.icon}
              {i === phases.length - 1 && (
                <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `1px solid ${SEV_COLOR[p.sev]}`, animation: 'signal-pulse 2s ease-out infinite' }} />
              )}
            </div>
            <div className="mono" style={{ fontSize: 10, color: SEV_COLOR[p.sev], letterSpacing: '0.15em', marginBottom: 4 }}>{p.time}</div>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--ink-4)', letterSpacing: '0.12em', marginBottom: 6 }}>{p.code}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-0)', textAlign: 'center', marginBottom: 6, letterSpacing: '0.04em' }}>{p.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.45 }}>{p.desc}</div>
          </div>
        ))}
      </div>
      <div className="hairline" style={{ margin: '14px 0 12px' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: '0.06em' }}>
          <span style={{ color: 'var(--ink-4)' }}>ORACLE INSIGHT · </span>
          Pattern matches <span style={{ color: '#f0c896' }}>ShinyHunters TTP cluster</span> with 87% similarity. Recommend immediate isolation of <span style={{ color: '#f0b3ba' }}>j.doe@argus-uni.edu</span> session and S3 bucket lockdown.
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn">VIEW GRAPH</button>
          <button className="btn btn-primary">ESCALATE TO RESPONSE</button>
        </div>
      </div>
    </P>
  );
}

window.argusOverview = { Overview };
