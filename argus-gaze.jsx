/* ARGUS — GAZE: Global Awareness & Zero-trust Engine
   Palantir Gotham-style omnisearch across GitHub, Shodan, NVD, OTX, URLScan,
   RDAP, DNS, ip-api, CISA KEV — any entity, all sources, one search.
*/
const { useState: uS, useEffect: uE, useRef: uR, useCallback: uC } = React;
const { Panel: GP, Pill: GH } = window.argusUtils;

const GAZE_API = 'http://localhost:8000/gaze';

/* ── Entity metadata ─────────────────────────────────────────────────────── */
const ENTITY_META = {
  ip:              { icon: '⬡', label: 'IPv4 ADDRESS',     color: '#9fc4e8', sources: ['github','shodan','ipapi','otx'] },
  domain:          { icon: '◈', label: 'DOMAIN',           color: '#8b8cd6', sources: ['github','rdap','dns','urlscan','otx'] },
  url:             { icon: '⊛', label: 'URL',              color: '#8b8cd6', sources: ['github','rdap','dns','urlscan','otx'] },
  cve:             { icon: '⚠', label: 'CVE IDENTIFIER',   color: '#e15c6b', sources: ['github','nvd','cisa'] },
  hash:            { icon: '⟨⟩', label: 'FILE HASH',       color: '#e89a4a', sources: ['github','otx'] },
  github_repo:     { icon: '◫', label: 'GITHUB REPO',      color: '#5dba89', sources: ['github','github_profile'] },
  username_or_org: { icon: '⊚', label: 'GITHUB USER / ORG',color: '#5dba89', sources: ['github','github_profile'] },
  keyword:         { icon: '◆', label: 'KEYWORD SEARCH',   color: '#d4af37', sources: ['github','nvd','urlscan'] },
};

const SOURCE_META = {
  github:         { label: 'GitHub',         icon: '◫', color: '#7ec99a' },
  github_profile: { label: 'GitHub Profile', icon: '⊚', color: '#7ec99a' },
  shodan:         { label: 'Shodan IDB',      icon: '⬡', color: '#9fc4e8' },
  ipapi:          { label: 'ip-api.com',      icon: '⊛', color: '#9fc4e8' },
  otx:            { label: 'AlienVault OTX',  icon: '◉', color: '#e89a4a' },
  urlscan:        { label: 'URLScan.io',      icon: '⬢', color: '#8b8cd6' },
  nvd:            { label: 'NIST NVD',        icon: '⚠', color: '#e15c6b' },
  cisa:           { label: 'CISA KEV',        icon: '⊛', color: '#e15c6b' },
  rdap:           { label: 'RDAP / WHOIS',    icon: '◈', color: '#d4af37' },
  dns:            { label: 'DNS (Google DoH)',icon: '◬',  color: '#4eb8d4' },
};

const EXAMPLE_QUERIES = [
  { q: '185.220.101.47',    label: 'TOR exit node IP' },
  { q: 'CVE-2024-6387',     label: 'regreSSHion CVE' },
  { q: 'log4shell exploit', label: 'Keyword hunt' },
  { q: 'Rajbharti06',       label: 'GitHub user' },
  { q: 'microsoft.com',     label: 'Domain intel' },
];

/* ── Risk gauge ──────────────────────────────────────────────────────────── */
function RiskGauge({ score }) {
  const color = score >= 70 ? '#e15c6b' : score >= 40 ? '#e89a4a' : '#5dba89';
  const label = score >= 70 ? 'CRITICAL' : score >= 40 ? 'ELEVATED' : score >= 10 ? 'MODERATE' : 'CLEAN';
  const pct   = score;
  const r = 42, cx = 52, cy = 52;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={104} height={104} viewBox="0 0 104 104">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 700 }}>{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)"
          style={{ fontFamily: 'JetBrains Mono', fontSize: 8, letterSpacing: '0.1em' }}>/ 100</text>
      </svg>
      <span className="mono" style={{ fontSize: 8.5, letterSpacing: '0.22em', color, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

/* ── Scanning animation ──────────────────────────────────────────────────── */
function GazeScanning({ query }) {
  const [dots, setDots] = uS(0);
  uE(() => {
    const id = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);

  const sources = ['GitHub API', 'Shodan IDB', 'AlienVault OTX', 'NIST NVD', 'URLScan.io', 'RDAP/WHOIS', 'DNS DoH', 'CISA KEV'];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      {/* Radar ring */}
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <svg width={160} height={160} viewBox="0 0 160 160" style={{ position: 'absolute', inset: 0 }}>
          {[72, 54, 36, 18].map((r, i) => (
            <circle key={r} cx={80} cy={80} r={r} fill="none"
              stroke="rgba(159,196,232,0.08)" strokeWidth={1} strokeDasharray={i % 2 === 0 ? '4 4' : '2 6'} />
          ))}
          {/* sweep line */}
          <line x1={80} y1={80} x2={80} y2={8}
            stroke="rgba(212,175,55,0.5)" strokeWidth={1.5}
            style={{ transformOrigin: '80px 80px', animation: 'spin 2s linear infinite' }}
          />
          {/* glowing center */}
          <circle cx={80} cy={80} r={4} fill="#d4af37" style={{ filter: 'drop-shadow(0 0 6px #d4af37)' }} />
        </svg>
        {/* orbiting dots representing sources */}
        {sources.map((s, i) => {
          const angle = (i / sources.length) * Math.PI * 2 - Math.PI / 2;
          const dist  = 58 + (i % 2) * 12;
          const x = 80 + Math.cos(angle) * dist - 3;
          const y = 80 + Math.sin(angle) * dist - 3;
          return (
            <div key={s} style={{
              position: 'absolute', left: x, top: y,
              width: 6, height: 6, borderRadius: '50%',
              background: '#9fc4e8',
              boxShadow: '0 0 8px rgba(159,196,232,0.6)',
              animation: `breathe ${1.2 + i * 0.3}s ease-in-out infinite`,
            }} />
          );
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', color: '#d4af37', marginBottom: 8 }}>
          SCANNING{'.'.repeat(dots + 1)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 4 }}>
          Fanning out across {sources.length} intelligence sources
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
          TARGET: {query}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 480 }}>
        {sources.map((s, i) => (
          <span key={s} className="mono" style={{
            fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.12em',
            padding: '3px 8px', border: '1px solid var(--line)',
            borderRadius: 2, background: 'rgba(0,0,0,0.2)',
            animation: `breathe ${1.5 + i * 0.2}s ease-in-out infinite`,
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Empty state with examples ───────────────────────────────────────────── */
function GazeEmpty({ onExample }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, paddingTop: 20 }}>
      {/* Big GAZE graphic */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          {/* outer rings */}
          {[90, 72, 56, 40, 24].map((r, i) => (
            <circle key={r} cx={100} cy={100} r={r} fill="none"
              stroke={`rgba(212,175,55,${0.04 + i * 0.03})`}
              strokeWidth={1}
              strokeDasharray={i % 2 === 0 ? '3 5' : '6 4'}
            />
          ))}
          {/* cross hairs */}
          {[[100, 6, 100, 26], [100, 174, 100, 194], [6, 100, 26, 100], [174, 100, 194, 100]].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(212,175,55,0.3)" strokeWidth={1} />
          ))}
          {/* center eye */}
          <circle cx={100} cy={100} r={14} fill="none" stroke="#d4af37" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px #d4af37)' }} />
          <circle cx={100} cy={100} r={5}  fill="#d4af37"  style={{ filter: 'drop-shadow(0 0 12px #d4af37)' }} />
          {/* data nodes */}
          {[
            { a: 0,   r: 70, color: '#9fc4e8', label: 'GH'  },
            { a: 45,  r: 65, color: '#7ec99a', label: 'OTX' },
            { a: 90,  r: 72, color: '#8b8cd6', label: 'CVE' },
            { a: 135, r: 68, color: '#e89a4a', label: 'IOC' },
            { a: 180, r: 70, color: '#4eb8d4', label: 'DNS' },
            { a: 225, r: 65, color: '#d4af37', label: 'WHS' },
            { a: 270, r: 72, color: '#e15c6b', label: 'KEV' },
            { a: 315, r: 68, color: '#9fc4e8', label: 'NET' },
          ].map(({ a, r, color, label }) => {
            const rad = a * Math.PI / 180;
            const x = 100 + Math.cos(rad) * r;
            const y = 100 + Math.sin(rad) * r;
            return (
              <g key={a}>
                <line x1={100} y1={100} x2={x} y2={y} stroke={`${color}22`} strokeWidth={1} />
                <circle cx={x} cy={y} r={8} fill={`${color}18`} stroke={color} strokeWidth={1}
                  style={{ animation: `breathe ${1.5 + a/90}s ease-in-out infinite` }} />
                <text x={x} y={y + 3} textAnchor="middle"
                  style={{ fontFamily: 'JetBrains Mono', fontSize: 5.5, fill: color }}>{label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, color: 'var(--ink-0)', marginBottom: 6 }}>
          Hunt Anything
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', maxWidth: 420, lineHeight: 1.6 }}>
          Paste any indicator — IP, domain, URL, CVE, file hash, GitHub user, or keyword.
          GAZE fans out across 8 intelligence sources simultaneously.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="label" style={{ textAlign: 'center', marginBottom: 4 }}>EXAMPLE QUERIES</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {EXAMPLE_QUERIES.map(({ q, label }) => (
            <button key={q} onClick={() => onExample(q)}
              className="btn"
              style={{ fontSize: 10, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="mono" style={{ color: '#d4af37' }}>{q}</span>
              <span style={{ color: 'var(--ink-4)', fontSize: 9 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Search bar ──────────────────────────────────────────────────────────── */
function GazeSearchBar({ query, setQuery, running, onHunt, detectedType }) {
  const inputRef = uR(null);
  uE(() => { inputRef.current?.focus(); }, []);
  const meta = detectedType ? ENTITY_META[detectedType] : null;

  return (
    <div style={{ position: 'relative' }}>
      {/* glow behind bar when active */}
      {query && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 5,
          background: 'transparent',
          boxShadow: `0 0 0 1px ${meta?.color || '#d4af37'}33, 0 0 30px -8px ${meta?.color || '#d4af37'}40`,
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', gap: 0,
        background: 'rgba(0,0,0,0.5)', border: '1px solid var(--line-2)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        {/* Entity type badge */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 48, flexShrink: 0,
          borderRight: '1px solid var(--line)',
          color: meta ? meta.color : 'var(--ink-4)',
          fontSize: 18,
          transition: 'color 0.2s',
        }}>
          {meta ? meta.icon : '◎'}
        </div>

        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !running && query.trim() && onHunt()}
          placeholder="Search any entity — IP, domain, CVE, hash, GitHub user, keyword…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--ink-0)', padding: '13px 14px',
            fontSize: 13, fontFamily: 'inherit',
          }}
        />

        {/* Entity type label */}
        {meta && (
          <div style={{
            display: 'flex', alignItems: 'center', padding: '0 12px',
            borderLeft: '1px solid var(--line)',
            flexShrink: 0,
          }}>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: '0.2em', color: meta.color }}>
              {meta.label}
            </span>
          </div>
        )}

        <button
          onClick={onHunt}
          disabled={running || !query.trim()}
          style={{
            padding: '0 22px', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            fontFamily: 'JetBrains Mono', cursor: running || !query.trim() ? 'not-allowed' : 'pointer',
            borderLeft: '1px solid var(--line)',
            background: running ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.14)',
            color: running ? 'var(--ink-4)' : '#d4af37',
            border: 'none', transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {running ? '◎ HUNTING…' : '◎ HUNT'}
        </button>
      </div>

      {/* Sources row */}
      <div style={{ display: 'flex', gap: 6, marginTop: 7, paddingLeft: 2 }}>
        {Object.entries(SOURCE_META).map(([key, sm]) => (
          <span key={key} className="mono" style={{
            fontSize: 8.5, letterSpacing: '0.12em',
            color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ color: sm.color, fontSize: 9 }}>{sm.icon}</span>{sm.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Entity header card ──────────────────────────────────────────────────── */
function GazeEntityHeader({ result }) {
  const meta  = ENTITY_META[result.entity_type] || ENTITY_META.keyword;
  const score = result.risk_score;
  const riskLabel = score >= 70 ? 'CRITICAL RISK' : score >= 40 ? 'ELEVATED RISK' : score >= 10 ? 'MODERATE' : 'CLEAN';
  const riskColor = score >= 70 ? '#e15c6b' : score >= 40 ? '#e89a4a' : score >= 10 ? '#d4af37' : '#5dba89';

  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 18px', flexShrink: 0 }}>
      <span className="corner-tick tl" /><span className="corner-tick tr" />
      <span className="corner-tick bl" /><span className="corner-tick br" />

      {/* entity icon */}
      <div style={{
        width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${meta.color}12`, border: `1px solid ${meta.color}40`,
        borderRadius: 4, fontSize: 24, color: meta.color, flexShrink: 0,
        boxShadow: `0 0 20px ${meta.color}20`,
      }}>{meta.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span className="mono" style={{ fontSize: 8, letterSpacing: '0.22em', color: meta.color }}>{meta.label}</span>
          <span style={{ width: 1, height: 12, background: 'var(--line)' }} />
          <span className="mono" style={{ fontSize: 8, letterSpacing: '0.16em', color: 'var(--ink-4)' }}>
            {Object.keys(result.sources).length} SOURCES QUERIED
          </span>
        </div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: 'var(--ink-0)', fontWeight: 500, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {result.query}
        </div>
      </div>

      {/* risk score */}
      <div style={{ flexShrink: 0, textAlign: 'center' }}>
        <RiskGauge score={score} />
      </div>

      {/* summary stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, minWidth: 120 }}>
        {result.sources.shodan?.ports?.length > 0 && (
          <StatRow label="OPEN PORTS" value={result.sources.shodan.ports.length} color="#9fc4e8" />
        )}
        {result.sources.shodan?.vulns?.length > 0 && (
          <StatRow label="KNOWN VULNS" value={result.sources.shodan.vulns.length} color="#e15c6b" />
        )}
        {result.sources.otx?.pulse_count > 0 && (
          <StatRow label="OTX PULSES" value={result.sources.otx.pulse_count} color="#e89a4a" />
        )}
        {result.sources.github?.code_hits > 0 && (
          <StatRow label="CODE HITS" value={result.sources.github.code_hits.toLocaleString()} color="#7ec99a" />
        )}
        {result.sources.nvd?.base_score && (
          <StatRow label="CVSS SCORE" value={result.sources.nvd.base_score} color="#e15c6b" />
        )}
        {result.sources.cisa?.in_kev && (
          <StatRow label="CISA KEV" value="YES" color="#e15c6b" />
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span className="mono" style={{ fontSize: 8, letterSpacing: '0.16em', color: 'var(--ink-4)' }}>{label}</span>
      <span className="num" style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

/* ── Source results ──────────────────────────────────────────────────────── */
function GazeSourceResults({ result }) {
  const [expanded, setExpanded] = uS(null);

  const sources = Object.entries(result.sources).filter(([, v]) => !v.error);
  const errors  = Object.entries(result.sources).filter(([, v]) =>  v.error);

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sources.map(([key, data]) => (
        <SourceCard
          key={key}
          sourceKey={key}
          data={data}
          entityType={result.entity_type}
          expanded={expanded === key}
          onToggle={() => setExpanded(expanded === key ? null : key)}
        />
      ))}
      {errors.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {errors.map(([key]) => (
            <span key={key} className="mono" style={{
              fontSize: 9, color: 'var(--ink-4)', padding: '3px 8px',
              border: '1px solid var(--line)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ color: '#e15c6b' }}>✗</span>
              {SOURCE_META[key]?.label || key} offline
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceCard({ sourceKey, data, entityType, expanded, onToggle }) {
  const sm = SOURCE_META[sourceKey] || { label: sourceKey, icon: '◆', color: '#9fc4e8' };
  const hasAlert = _sourceHasAlert(sourceKey, data);
  const summary  = _sourceSummary(sourceKey, data, entityType);

  return (
    <div
      className="panel"
      style={{
        cursor: 'pointer', transition: 'background 0.15s',
        borderLeft: `2px solid ${hasAlert ? sm.color : 'var(--line)'}`,
      }}
      onClick={onToggle}
    >
      <span className="corner-tick tl" /><span className="corner-tick tr" />
      <span className="corner-tick bl" /><span className="corner-tick br" />

      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <span style={{ fontSize: 14, color: sm.color, width: 20, textAlign: 'center', flexShrink: 0 }}>{sm.icon}</span>
        <span className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: sm.color, fontWeight: 700 }}>
          {sm.label}
        </span>
        <span style={{ flex: 1, fontSize: 11, color: 'var(--ink-2)', paddingLeft: 4 }}>{summary}</span>
        {hasAlert && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: sm.color, boxShadow: `0 0 8px ${sm.color}`, flexShrink: 0, animation: 'breathe 1.8s ease-in-out infinite' }} />
        )}
        <span style={{ color: 'var(--ink-4)', fontSize: 11, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
          <SourceDetail sourceKey={sourceKey} data={data} entityType={entityType} color={sm.color} />
        </div>
      )}
    </div>
  );
}

function _sourceHasAlert(key, data) {
  if (key === 'shodan')  return (data.vulns?.length > 0) || (data.tags?.some(t => ['tor','malware','botnet','scanner'].includes(t)));
  if (key === 'otx')     return data.pulse_count > 0;
  if (key === 'ipapi')   return data.tor || data.proxy;
  if (key === 'urlscan') return data.hits?.some(h => h.malicious);
  if (key === 'cisa')    return data.in_kev;
  if (key === 'nvd')     return data.base_score >= 7;
  return false;
}

function _sourceSummary(key, data, entityType) {
  if (key === 'github') {
    const r = data.repo_total || 0;
    const c = data.code_hits  || 0;
    if (!r && !c) return 'No matches found';
    const parts = [];
    if (r) parts.push(`${r.toLocaleString()} repos`);
    if (c) parts.push(`${c.toLocaleString()} code hits`);
    return parts.join(' · ');
  }
  if (key === 'github_profile') {
    const p = data.profile;
    if (!p?.login) return 'Profile not found';
    return `${p.login} (${p.type}) · ${p.public_repos} repos · ${p.followers} followers`;
  }
  if (key === 'shodan') {
    const ports = data.ports?.length || 0;
    const vulns = data.vulns?.length || 0;
    if (!ports) return 'No exposure data';
    return `${ports} open ports${vulns ? ` · ${vulns} CVEs` : ''}${data.tags?.length ? ` · [${data.tags.join(', ')}]` : ''}`;
  }
  if (key === 'ipapi') {
    if (!data.country) return 'Geolocation unavailable';
    const flags = [data.tor && 'TOR', data.proxy && 'PROXY', data.hosting && 'HOSTING'].filter(Boolean);
    return `${data.city || ''} ${data.country} · ${data.isp || ''}${flags.length ? ` · ${flags.join(' · ')}` : ''}`;
  }
  if (key === 'otx') {
    if (!data.pulse_count) return 'No threat pulses';
    return `${data.pulse_count} threat pulses${data.tags?.length ? ` · ${data.tags.slice(0,3).join(', ')}` : ''}`;
  }
  if (key === 'urlscan') {
    if (!data.total) return 'No scan history';
    const mal = data.hits?.filter(h => h.malicious).length || 0;
    return `${data.total.toLocaleString()} scans${mal ? ` · ${mal} MALICIOUS` : ' · no malicious verdicts'}`;
  }
  if (key === 'nvd') {
    if (entityType === 'cve') {
      if (!data.id) return 'CVE not found in NVD';
      return `${data.severity || '?'} · CVSS ${data.base_score || '?'} · ${data.published || '?'}`;
    }
    return `${data.total || 0} CVEs found`;
  }
  if (key === 'cisa') return data.in_kev ? `IN KEV · added ${data.date_added} · ransomware: ${data.ransomware_use}` : 'Not in CISA KEV catalog';
  if (key === 'rdap') {
    if (!data.name) return 'Registration data unavailable';
    const created = data.events?.find(e => e.action === 'registration')?.date || '';
    return `${data.name}${created ? ` · registered ${created}` : ''}`;
  }
  if (key === 'dns') {
    const a = data.A?.length || 0;
    if (!a) return 'No DNS records found';
    return `A: ${data.A?.join(', ') || '—'} · NS: ${data.NS?.length || 0} records`;
  }
  return JSON.stringify(data).slice(0, 80);
}

/* ── Per-source detail views ─────────────────────────────────────────────── */
function SourceDetail({ sourceKey, data, entityType, color }) {
  if (sourceKey === 'github')         return <GitHubDetail data={data} color={color} />;
  if (sourceKey === 'github_profile') return <GitHubProfileDetail data={data} color={color} />;
  if (sourceKey === 'shodan')         return <ShodanDetail data={data} color={color} />;
  if (sourceKey === 'ipapi')          return <IpApiDetail data={data} color={color} />;
  if (sourceKey === 'otx')            return <OtxDetail data={data} color={color} />;
  if (sourceKey === 'urlscan')        return <UrlscanDetail data={data} color={color} />;
  if (sourceKey === 'nvd')            return <NvdDetail data={data} entityType={entityType} color={color} />;
  if (sourceKey === 'cisa')           return <CisaDetail data={data} color={color} />;
  if (sourceKey === 'rdap')           return <RdapDetail data={data} color={color} />;
  if (sourceKey === 'dns')            return <DnsDetail data={data} color={color} />;
  return <pre style={{ fontSize: 10, color: 'var(--ink-3)', margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>;
}

function GitHubDetail({ data, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>REPO MATCHES</span>
          <div className="num" style={{ fontSize: 22, color, fontWeight: 700 }}>{(data.repo_total || 0).toLocaleString()}</div></div>
        <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>CODE OCCURRENCES</span>
          <div className="num" style={{ fontSize: 22, color: data.code_hits ? '#e89a4a' : 'var(--ink-3)', fontWeight: 700 }}>{(data.code_hits || 0).toLocaleString()}</div></div>
        <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>API RATE REMAINING</span>
          <div className="num" style={{ fontSize: 22, color: 'var(--ink-2)', fontWeight: 700 }}>{data.rate_remaining ?? '—'}</div></div>
      </div>

      {data.repos?.length > 0 && (
        <>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.18em', color: 'var(--ink-4)', marginTop: 4 }}>TOP REPOSITORIES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.repos.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
                <div>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ color, textDecoration: 'none', fontWeight: 600 }}>{r.full_name}</a>
                  {r.description && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{r.description}</div>}
                </div>
                <span className="num" style={{ color: '#d4af37', fontSize: 10 }}>★ {r.stars}</span>
                <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 9 }}>{r.language || '—'}</span>
                <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 9 }}>{r.updated}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {data.code_matches?.length > 0 && (
        <>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.18em', color: '#e89a4a', marginTop: 4 }}>
            ◈ CODE MATCHES — POTENTIAL EXPOSURE
          </div>
          {data.code_matches.map((m, i) => (
            <div key={i} style={{ padding: '5px 10px', background: 'rgba(232,154,74,0.06)', border: '1px solid rgba(232,154,74,0.2)', borderRadius: 3, fontSize: 10 }}>
              <a href={m.url} target="_blank" rel="noreferrer" style={{ color: '#e89a4a', textDecoration: 'none' }}>{m.repo}/{m.path}</a>
              <span style={{ color: 'var(--ink-4)', marginLeft: 8 }}>{m.name}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function GitHubProfileDetail({ data, color }) {
  const p = data.profile || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {p.avatar && <img src={p.avatar} alt="avatar" style={{ width: 52, height: 52, borderRadius: 4, border: `1px solid ${color}40` }} />}
        <div>
          <div style={{ fontSize: 14, color: 'var(--ink-0)', fontWeight: 600 }}>{p.name || p.login}</div>
          <div className="mono" style={{ fontSize: 9, color, letterSpacing: '0.12em' }}>{p.login} · {p.type}</div>
          {p.bio && <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 4, fontStyle: 'italic' }}>{p.bio}</div>}
          <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
            {[['REPOS', p.public_repos], ['FOLLOWERS', p.followers], ['JOINED', p.created]].map(([l, v]) => (
              <div key={l}><span className="mono" style={{ fontSize: 8, color: 'var(--ink-4)' }}>{l}</span>
                <div className="num" style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 600 }}>{v}</div></div>
            ))}
          </div>
        </div>
      </div>
      {data.repos?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.18em', color: 'var(--ink-4)', marginBottom: 4 }}>RECENT REPOSITORIES</div>
          {data.repos.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 80px', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
              <a href={r.url} target="_blank" rel="noreferrer" style={{ color, textDecoration: 'none' }}>{r.name}
                {r.description && <span style={{ color: 'var(--ink-4)', marginLeft: 8, fontSize: 10 }}>{r.description}</span>}
              </a>
              <span className="num" style={{ color: '#d4af37', fontSize: 10 }}>★ {r.stars}</span>
              <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 9 }}>{r.language || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShodanDetail({ data, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>OPEN PORTS</span>
          <div className="num" style={{ fontSize: 22, color, fontWeight: 700 }}>{data.ports?.length || 0}</div></div>
        <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>KNOWN VULNS</span>
          <div className="num" style={{ fontSize: 22, color: data.vulns?.length ? '#e15c6b' : 'var(--ink-3)', fontWeight: 700 }}>{data.vulns?.length || 0}</div></div>
      </div>
      {data.ports?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 6 }}>PORTS</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {data.ports.map(p => (
              <span key={p} className="mono" style={{ fontSize: 10, padding: '2px 7px', background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 2, color }}>{p}</span>
            ))}
          </div>
        </div>
      )}
      {data.vulns?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: '#e15c6b', marginBottom: 6 }}>KNOWN VULNERABILITIES</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {data.vulns.map(v => (
              <span key={v} className="mono" style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(225,92,107,0.1)', border: '1px solid rgba(225,92,107,0.3)', borderRadius: 2, color: '#e15c6b' }}>{v}</span>
            ))}
          </div>
        </div>
      )}
      {data.tags?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 6 }}>TAGS</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {data.tags.map(t => {
              const danger = ['tor','malware','botnet','scanner'].includes(t);
              return (
                <span key={t} className="mono" style={{ fontSize: 10, padding: '2px 7px', background: danger ? 'rgba(225,92,107,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${danger ? 'rgba(225,92,107,0.35)' : 'var(--line)'}`, borderRadius: 2, color: danger ? '#e15c6b' : 'var(--ink-2)' }}>{t}</span>
              );
            })}
          </div>
        </div>
      )}
      {data.hostnames?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 4 }}>HOSTNAMES</div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.hostnames.map(h => <span key={h} className="mono">{h}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function IpApiDetail({ data, color }) {
  const rows = [
    ['COUNTRY',  `${data.country || '—'} (${data.country_code || '—'})`],
    ['CITY',     `${data.city || '—'}, ${data.region || '—'}`],
    ['ISP',      data.isp || '—'],
    ['ORG',      data.org || '—'],
    ['AS',       data.as || '—'],
    ['COORDS',   data.lat ? `${data.lat}, ${data.lon}` : '—'],
    ['TOR',      data.tor    ? '⚠ YES' : 'No'],
    ['PROXY',    data.proxy  ? '⚠ YES' : 'No'],
    ['HOSTING',  data.hosting ? 'Yes' : 'No'],
    ['MOBILE',   data.mobile  ? 'Yes' : 'No'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px' }}>
      {rows.map(([l, v]) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>{l}</span>
          <span className="mono" style={{ fontSize: 10.5, color: v.startsWith('⚠') ? '#e15c6b' : 'var(--ink-1)' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function OtxDetail({ data, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 20 }}>
        <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>THREAT PULSES</span>
          <div className="num" style={{ fontSize: 28, color: data.pulse_count ? '#e89a4a' : 'var(--ink-3)', fontWeight: 700 }}>{data.pulse_count}</div></div>
        <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>REPUTATION</span>
          <div className="num" style={{ fontSize: 28, color: data.reputation < 0 ? '#e15c6b' : '#5dba89', fontWeight: 700 }}>{data.reputation}</div></div>
      </div>
      {data.tags?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 6 }}>TAGS</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {data.tags.map(t => <span key={t} className="mono" style={{ fontSize: 10, padding: '2px 7px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 2, color }}>{t}</span>)}
          </div>
        </div>
      )}
      {data.malware_families?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: '#e15c6b', marginBottom: 6 }}>MALWARE FAMILIES</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {data.malware_families.map(f => <span key={f} className="mono" style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(225,92,107,0.1)', border: '1px solid rgba(225,92,107,0.3)', borderRadius: 2, color: '#e15c6b' }}>{f}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function UrlscanDetail({ data, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>TOTAL SCANS IN DB</span>
        <div className="num" style={{ fontSize: 22, color, fontWeight: 700 }}>{(data.total || 0).toLocaleString()}</div></div>
      {data.hits?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 6 }}>RECENT SCANS</div>
          {data.hits.map((h, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px 80px', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
              <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url}</span>
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{h.country || '—'}</span>
              <span className="num" style={{ fontSize: 10, color: h.score > 0 ? '#e89a4a' : 'var(--ink-4)' }}>{h.score}</span>
              <span className="mono" style={{ fontSize: 9, color: h.malicious ? '#e15c6b' : '#5dba89', fontWeight: 700 }}>
                {h.malicious ? '⚠ MALICIOUS' : '✓ CLEAN'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NvdDetail({ data, entityType, color }) {
  if (entityType === 'cve') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[['CVE ID', data.id], ['SEVERITY', data.severity], ['CVSS', data.base_score], ['PUBLISHED', data.published]].map(([l, v]) => (
            <div key={l}><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{l}</span>
              <div className="num" style={{ fontSize: 16, color: l === 'SEVERITY' || l === 'CVSS' ? (data.base_score >= 9 ? '#e15c6b' : data.base_score >= 7 ? '#e89a4a' : '#d4af37') : 'var(--ink-1)', fontWeight: 700 }}>{v || '—'}</div></div>
          ))}
        </div>
        {data.vector && <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-2)', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 3 }}>{data.vector}</div>}
        {data.description && <div style={{ fontSize: 11.5, color: 'var(--ink-1)', lineHeight: 1.6, borderLeft: '2px solid var(--line-3)', paddingLeft: 10 }}>{data.description}</div>}
        {data.weaknesses?.filter(Boolean).length > 0 && (
          <div>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 4 }}>WEAKNESSES (CWE)</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {data.weaknesses.filter(Boolean).map(w => <span key={w} className="mono" style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(225,92,107,0.08)', border: '1px solid rgba(225,92,107,0.25)', borderRadius: 2, color: '#e15c6b' }}>{w}</span>)}
            </div>
          </div>
        )}
        {data.references?.length > 0 && (
          <div>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 4 }}>REFERENCES</div>
            {data.references.map((r, i) => <div key={i}><a href={r} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#9fc4e8', textDecoration: 'none' }}>{r}</a></div>)}
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <div><span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>TOTAL CVEs FOUND</span>
        <div className="num" style={{ fontSize: 22, color, fontWeight: 700 }}>{data.total || 0}</div></div>
      {data.cves?.map((c, i) => (
        <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 3 }}>
            <span className="mono" style={{ fontSize: 10, color }}>{c.id}</span>
            {c.severity && <span className="mono" style={{ fontSize: 9, color: c.base_score >= 9 ? '#e15c6b' : '#e89a4a' }}>{c.severity} {c.base_score}</span>}
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginLeft: 'auto' }}>{c.published}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{c.description}</div>
        </div>
      ))}
    </div>
  );
}

function CisaDetail({ data, color }) {
  if (!data.in_kev) return <div style={{ color: '#5dba89', fontSize: 12 }}>✓ Not in CISA Known Exploited Vulnerabilities catalog</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ padding: '8px 12px', background: 'rgba(225,92,107,0.1)', border: '1px solid rgba(225,92,107,0.3)', borderRadius: 3 }}>
        <span className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#e15c6b', fontWeight: 700 }}>⚠ IN CISA KNOWN EXPLOITED VULNERABILITIES</span>
      </div>
      {[['DATE ADDED', data.date_added], ['DUE DATE', data.due_date], ['RANSOMWARE USE', data.ransomware_use]].map(([l, v]) => v && (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--ink-4)', letterSpacing: '0.12em' }}>{l}</span>
          <span className="mono" style={{ color: 'var(--ink-1)' }}>{v}</span>
        </div>
      ))}
      {data.required_action && (
        <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 3, borderLeft: '2px solid rgba(225,92,107,0.5)', fontSize: 11, color: 'var(--ink-1)', lineHeight: 1.6 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 4 }}>REQUIRED ACTION</div>
          {data.required_action}
        </div>
      )}
    </div>
  );
}

function RdapDetail({ data, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.status?.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {data.status.map(s => <span key={s} className="mono" style={{ fontSize: 9.5, padding: '2px 8px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 2, color }}>{s}</span>)}
        </div>
      )}
      {data.events?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 3 }}>DOMAIN EVENTS</div>
          {data.events.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ color: 'var(--ink-2)' }}>{e.action}</span>
              <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>{e.date}</span>
            </div>
          ))}
        </div>
      )}
      {data.nameservers?.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.16em', color: 'var(--ink-4)', marginBottom: 4 }}>NAMESERVERS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.nameservers.map(ns => <span key={ns} className="mono" style={{ fontSize: 10, color: 'var(--ink-2)' }}>{ns}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function DnsDetail({ data, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(data).map(([type, records]) => records?.length > 0 && (
        <div key={type}>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: '0.18em', color: color, marginBottom: 4 }}>{type} RECORDS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {records.map((r, i) => <div key={i} className="mono" style={{ fontSize: 10.5, color: 'var(--ink-1)', padding: '3px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>{r}</div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Entity relationship graph ───────────────────────────────────────────── */
function GazeEntityGraph({ result }) {
  const nodes = _buildGraphNodes(result);
  const W = 320, H = 240, cx = 160, cy = 120;

  return (
    <GP title="ENTITY GRAPH" sub="RELATIONSHIP MAP" dense style={{ flexShrink: 0 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {/* edges */}
        {nodes.slice(1).map((n, i) => (
          <line key={i} x1={cx} y1={cy} x2={n.x} y2={n.y}
            stroke={`${n.color}30`} strokeWidth={1} strokeDasharray="3 4" />
        ))}
        {/* center node */}
        <circle cx={cx} cy={cy} r={18} fill={`${ENTITY_META[result.entity_type]?.color || '#d4af37'}18`}
          stroke={ENTITY_META[result.entity_type]?.color || '#d4af37'} strokeWidth={1.5}
          style={{ filter: `drop-shadow(0 0 10px ${ENTITY_META[result.entity_type]?.color || '#d4af37'}50)` }} />
        <text x={cx} y={cy + 4} textAnchor="middle"
          style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fill: ENTITY_META[result.entity_type]?.color || '#d4af37' }}>
          {ENTITY_META[result.entity_type]?.icon || '◆'}
        </text>
        {/* outer nodes */}
        {nodes.slice(1).map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={`${n.color}12`} stroke={n.color} strokeWidth={1} />
            <text x={n.x} y={n.y - n.r - 4} textAnchor="middle"
              style={{ fontFamily: 'JetBrains Mono', fontSize: 6.5, letterSpacing: '0.1em', fill: 'rgba(255,255,255,0.4)' }}>
              {n.label}
            </text>
            <text x={n.x} y={n.y + 4} textAnchor="middle"
              style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, fill: n.color }}>
              {n.value}
            </text>
          </g>
        ))}
      </svg>
    </GP>
  );
}

function _buildGraphNodes(result) {
  const s = result.sources;
  const nodes = [{ center: true }];
  const ring = (i, total, dist = 88) => {
    const a = (i / total) * Math.PI * 2 - Math.PI / 2;
    return { x: 160 + Math.cos(a) * dist, y: 120 + Math.sin(a) * dist };
  };
  const candidates = [];

  if (s.ipapi?.country)           candidates.push({ label: 'GEO', value: s.ipapi.country_code || s.ipapi.country, color: '#9fc4e8', r: 11 });
  if (s.ipapi?.org)               candidates.push({ label: 'ORG', value: s.ipapi.org?.slice(0, 8), color: '#8b8cd6', r: 10 });
  if (s.shodan?.ports?.length)    candidates.push({ label: 'PORTS', value: s.shodan.ports.length, color: '#4eb8d4', r: 10 });
  if (s.shodan?.vulns?.length)    candidates.push({ label: 'VULNS', value: s.shodan.vulns.length, color: '#e15c6b', r: 11 });
  if (s.otx?.pulse_count)         candidates.push({ label: 'OTX', value: s.otx.pulse_count, color: '#e89a4a', r: 11 });
  if (s.github?.repo_total)       candidates.push({ label: 'REPOS', value: s.github.repo_total, color: '#7ec99a', r: 10 });
  if (s.github?.code_hits)        candidates.push({ label: 'CODE', value: s.github.code_hits, color: '#7ec99a', r: 10 });
  if (s.cisa?.in_kev)             candidates.push({ label: 'KEV', value: '⚠', color: '#e15c6b', r: 13 });
  if (s.nvd?.base_score)          candidates.push({ label: 'CVSS', value: s.nvd.base_score, color: '#e89a4a', r: 11 });
  if (s.urlscan?.total)           candidates.push({ label: 'SCANS', value: s.urlscan.total, color: '#8b8cd6', r: 10 });
  if (s.dns?.A?.length)           candidates.push({ label: 'DNS-A', value: s.dns.A.length, color: '#4eb8d4', r: 9 });
  if (s.rdap?.status?.length)     candidates.push({ label: 'RDAP', value: s.rdap.status[0]?.slice(0,6), color: '#d4af37', r: 9 });

  const total = Math.min(candidates.length, 8);
  return [nodes[0], ...candidates.slice(0, total).map((n, i) => ({ ...n, ...ring(i, total) }))];
}

/* ── Hunt history ────────────────────────────────────────────────────────── */
function GazeHistory({ history, onSelect }) {
  if (!history.length) return null;
  return (
    <GP title="HUNT HISTORY" sub={`${history.length} QUERIES`} dense style={{ flexShrink: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {history.map((h, i) => {
          const meta = ENTITY_META[h.type] || ENTITY_META.keyword;
          const riskColor = h.risk >= 70 ? '#e15c6b' : h.risk >= 40 ? '#e89a4a' : h.risk >= 10 ? '#d4af37' : '#5dba89';
          return (
            <div key={i}
              onClick={() => onSelect(h.query)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 11, color: meta.color, width: 14, textAlign: 'center' }}>{meta.icon}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.query}</span>
              <span className="num" style={{ fontSize: 10, fontWeight: 700, color: riskColor, flexShrink: 0 }}>{h.risk}</span>
            </div>
          );
        })}
      </div>
    </GP>
  );
}

/* ── Main GAZE module ────────────────────────────────────────────────────── */
function Gaze() {
  const [query,    setQuery]    = uS('');
  const [running,  setRunning]  = uS(false);
  const [result,   setResult]   = uS(null);
  const [error,    setError]    = uS('');
  const [history,  setHistory]  = uS([]);
  const [detected, setDetected] = uS(null);

  uE(() => {
    if (!query.trim()) { setDetected(null); return; }
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`${GAZE_API}/detect?q=${encodeURIComponent(query.trim())}`);
        if (r.ok) setDetected((await r.json()).entity_type);
      } catch (_) {}
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  async function hunt() {
    if (!query.trim()) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${GAZE_API}/hunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setHistory(h => [{ query: query.trim(), type: data.entity_type, risk: data.risk_score, time: new Date() }, ...h].slice(0, 10));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <GazeSearchBar
        query={query} setQuery={setQuery}
        running={running} onHunt={hunt}
        detectedType={detected}
      />

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(225,92,107,0.1)', border: '1px solid rgba(225,92,107,0.3)', borderRadius: 3, fontSize: 11, color: '#e15c6b', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>✗</span>
          <span>{error}</span>
          <span style={{ color: 'var(--ink-4)', fontSize: 10 }}>— Is the ARGUS backend running on :8000?</span>
        </div>
      )}

      {running && <GazeScanning query={query} />}

      {result && !running && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'hidden' }}>
            <GazeEntityHeader result={result} />
            <GazeSourceResults result={result} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <GazeEntityGraph result={result} />
            <GazeHistory history={history} onSelect={q => { setQuery(q); setResult(null); }} />
          </div>
        </div>
      )}

      {!result && !running && !error && (
        <GazeEmpty onExample={q => setQuery(q)} />
      )}
    </div>
  );
}

window.argusGaze = { Gaze };
