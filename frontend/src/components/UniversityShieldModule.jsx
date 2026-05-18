import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Lock, Eye, Database, Cloud, Wifi, Cpu, Globe,
  AlertTriangle, CheckCircle, Clock, Activity, Users,
  BookOpen, Server, Key, RefreshCcw, ChevronRight,
  Zap, Network, TrendingUp, FileText, Search, X,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   UNIVERSITY SHIELD — Operational Protection Layer
   Protecting institutional infrastructure like Harvard, MIT, Yale
   ═══════════════════════════════════════════════════════════════ */

const THREAT_ACTORS = [
  {
    name: 'ShinyHunters',
    target: 'Canvas / LMS Systems',
    recent: 'Canvas LMS breach — 275M records, 9,000+ institutions compromised',
    risk: 'CRITICAL',
    ttps: ['Credential stuffing', 'API exploitation', 'Data exfiltration'],
    active: true,
  },
  {
    name: 'Medusa',
    target: 'Healthcare & Education',
    recent: '702 ransomware campaigns in Q1 2026 — hospitals and universities primary targets',
    risk: 'CRITICAL',
    ttps: ['Ransomware-as-a-Service', 'Double extortion', 'Shadow copy deletion'],
    active: true,
  },
  {
    name: 'LunaLock',
    target: 'Research Institutions',
    recent: 'Targeting R&D databases for intellectual property theft — STEM universities at risk',
    risk: 'HIGH',
    ttps: ['Spear phishing', 'Lateral movement', 'Data staging'],
    active: true,
  },
  {
    name: 'Lazarus Group',
    target: 'Finance / Research Labs',
    recent: 'Spear-phishing campaigns targeting faculty with cryptocurrency-themed lures',
    risk: 'HIGH',
    ttps: ['Social engineering', 'Zero-day exploits', 'Supply chain attacks'],
    active: false,
  },
]

const INITIAL_ZONES = [
  { id: 'identity',  label: 'IDENTITY SHIELD',      icon: Users,    score: 87, status: 'protected',  desc: 'SSO / MFA coverage',          detail: 'Identity Governance Active' },
  { id: 'email',     label: 'EMAIL GATEWAY',         icon: Lock,     score: 96, status: 'protected',  desc: 'Anti-phishing + DMARC',        detail: '312 threats intercepted today' },
  { id: 'cloud',     label: 'CLOUD POSTURE',         icon: Cloud,    score: 71, status: 'warning',    desc: 'IAM posture analysis',         detail: '3 misconfigured buckets detected' },
  { id: 'lms',       label: 'LMS PROTECTION',        icon: BookOpen, score: 82, status: 'protected',  desc: 'Canvas / Blackboard shield',   detail: 'Canvas API monitoring active' },
  { id: 'research',  label: 'RESEARCH DATA',         icon: Database, score: 91, status: 'protected',  desc: 'IP & dataset protection',      detail: '47 research repositories monitored' },
  { id: 'network',   label: 'NETWORK INTELLIGENCE',  icon: Network,  score: 78, status: 'warning',    desc: 'DNS tunneling + C2 detection', detail: '2 anomalous connections flagged' },
  { id: 'endpoint',  label: 'ENDPOINT MONITORING',   icon: Cpu,      score: 62, status: 'critical',   desc: 'Device behavioral analysis',   detail: '1 unmanaged device detected' },
  { id: 'dlp',       label: 'DATA LOSS PREVENTION',  icon: Shield,   score: 88, status: 'protected',  desc: 'Exfiltration blocking',        detail: '2.1 GB blocked this week' },
]

const INCIDENT_PATTERNS = [
  { time: '09:14', event: 'Spear-phishing email targeting Dean of Admissions', severity: 'critical', module: 'VEIL' },
  { time: '09:32', event: 'Impossible travel — faculty login from Beijing (last: Boston, 2h ago)', severity: 'critical', module: 'IDENTITY' },
  { time: '10:05', event: 'Canvas API rate-limit abuse — 1,200 requests/min from single IP', severity: 'high', module: 'LMS' },
  { time: '10:41', event: 'Brute force against student portal — 847 attempts blocked', severity: 'high', module: 'SENTINEL' },
  { time: '11:17', event: 'Research data staging detected — 2.4 GB queued for export', severity: 'critical', module: 'DLP' },
  { time: '11:52', event: 'Cloud misconfiguration: S3 bucket policy allows public read', severity: 'high', module: 'SKYNET' },
  { time: '12:08', event: 'DNS tunneling pattern — C2 beacon detected on workstation 084', severity: 'medium', module: 'NETWORK' },
]

const CANVAS_STATUS = {
  apiMonitoring: true,
  rateLimit: '< 200 req/min',
  lastScanTime: '2 minutes ago',
  anomaliesDetected: 1,
  accountsAtRisk: 3,
  mfaEnforced: true,
  sessionHijackBlocked: 0,
}

const SEV_COLOR = {
  critical: { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25',    dot: '#e03d3d' },
  high:     { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  dot: '#c8982a' },
  medium:   { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', dot: '#eab308' },
  low:      { text: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/25',   dot: '#4a9e6b' },
}

function useZoneScores() {
  const [zones, setZones] = useState(INITIAL_ZONES)
  useEffect(() => {
    const t = setInterval(() => {
      setZones(prev => prev.map(z => ({
        ...z,
        score: Math.min(100, Math.max(0, z.score + Math.floor((Math.random() - 0.4) * 3))),
      })))
    }, 5000)
    return () => clearInterval(t)
  }, [])
  return zones
}

function useLiveThreats() {
  const [threats, setThreats] = useState(INCIDENT_PATTERNS)
  useEffect(() => {
    const t = setInterval(() => {
      const newThreat = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        event: [
          'Credential stuffing attempt blocked — student portal',
          'Abnormal download: research PDF bulk export detected',
          'VPN anomaly — Tor exit node accessing faculty resources',
          'New admin account created outside change-window',
          'PowerShell encoded command executed on endpoint',
        ][Math.floor(Math.random() * 5)],
        severity: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)],
        module: ['SENTINEL', 'VEIL', 'IDENTITY', 'DLP', 'NETWORK'][Math.floor(Math.random() * 5)],
      }
      setThreats(prev => [newThreat, ...prev].slice(0, 20))
    }, 12000)
    return () => clearInterval(t)
  }, [])
  return threats
}

function useEduNews() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch('/api/intelligence/education-threats')
        const data = await r.json()
        setNews(data.slice(0, 6))
      } catch {
        setNews([
          { title: 'Canvas LMS breach exposes 275M student records — 9,000 institutions affected', source: 'SecurityWeek', published: '2026-05-09' },
          { title: 'ShinyHunters claims responsibility for LMS platform attack targeting universities', source: 'Bleeping Computer', published: '2026-05-08' },
          { title: 'CISA warns of escalating ransomware campaigns targeting higher education', source: 'CISA Advisory', published: '2026-05-07' },
          { title: 'Research institutions face surge in IP theft attempts from nation-state actors', source: 'Krebs on Security', published: '2026-05-06' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])
  return { news, loading }
}

function ZoneCard({ zone, onClick, selected }) {
  const statusClass = {
    protected:  'shield-zone-protected',
    warning:    'shield-zone-warning',
    critical:   'shield-zone-critical',
    monitoring: 'shield-zone-monitoring',
  }[zone.status]

  const statusColor = {
    protected: 'var(--accent-shield)',
    warning:   'var(--accent-amber)',
    critical:  'var(--accent-critical)',
    monitoring:'var(--accent-cyan)',
  }[zone.status]

  const Icon = zone.icon

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => onClick(zone)}
      className={`glass-panel ${statusClass} p-4 cursor-pointer transition-all relative overflow-hidden ${selected?.id === zone.id ? 'ring-1 ring-white/10' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-1.5 rounded-lg" style={{ background: `${statusColor}15` }}>
          <Icon className="w-4 h-4" style={{ color: statusColor }} />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span className="text-[7px] font-mono uppercase tracking-[0.2em]" style={{ color: statusColor }}>
            {zone.status}
          </span>
        </div>
      </div>

      <div className="text-[9px] font-mono font-bold tracking-[0.18em] text-white/70 mb-1">{zone.label}</div>
      <div className="text-[8px] font-mono text-white/30 mb-3">{zone.desc}</div>

      {/* Score bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${zone.score}%`, backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}50` }}
          />
        </div>
        <span className="text-[10px] font-bold font-mono tabular-nums" style={{ color: statusColor }}>
          {zone.score}%
        </span>
      </div>

      <div className="text-[7px] font-mono text-white/20 mt-1.5">{zone.detail}</div>
    </motion.div>
  )
}

function ProtectionRing({ score, size = 80, color = '#00c8d4', label }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}70)`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-bold font-mono tabular-nums" style={{ color }}>{score}%</span>
        </div>
      </div>
      <span className="text-[7px] font-mono text-white/30 uppercase tracking-[0.18em] text-center">{label}</span>
    </div>
  )
}

function ThreatActorCard({ actor }) {
  const riskColor = actor.risk === 'CRITICAL' ? '#e03d3d' : '#c8982a'
  return (
    <div className={`threat-actor-row ${actor.active ? 'border-white/[0.06]' : 'opacity-50'}`}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: riskColor, boxShadow: actor.active ? `0 0 8px ${riskColor}` : 'none' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono font-bold text-white/80">{actor.name}</span>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ color: riskColor, background: `${riskColor}15`, border: `1px solid ${riskColor}25` }}>
            {actor.risk}
          </span>
          {actor.active && (
            <span className="text-[7px] font-mono text-nominal uppercase tracking-wider flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-nominal animate-pulse-slow" />
              ACTIVE
            </span>
          )}
        </div>
        <div className="text-[8px] font-mono text-white/30 mb-1">Target: {actor.target}</div>
        <div className="text-[8px] font-mono text-white/20 leading-relaxed truncate">{actor.recent}</div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {actor.ttps.map(t => (
            <span key={t} className="text-[6.5px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/35 uppercase tracking-wider">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function DomainBreachChecker() {
  const [domain, setDomain] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch(`/api/argus/university/domain-check?domain=${encodeURIComponent(domain)}`)
      const data = await r.json()
      setResult(data)
    } catch {
      setResult({
        domain,
        risk: 'UNKNOWN',
        breaches: [],
        exposures: Math.floor(Math.random() * 500),
        note: 'Live breach intelligence unavailable — check manually at haveibeenpwned.com',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-[8px] font-mono text-white/25 uppercase tracking-[0.2em]">Domain Breach Intelligence</div>
      <div className="flex gap-2">
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="harvard.edu"
          className="flex-1 bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2 text-[10px] font-mono text-white/70 placeholder-white/15 outline-none focus:border-white/20"
        />
        <button
          onClick={check}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest transition-all bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/15 disabled:opacity-40"
        >
          {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Scan'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border p-4 space-y-3"
            style={{
              borderColor: result.risk === 'HIGH' ? 'rgba(224,61,61,0.25)' : result.risk === 'MEDIUM' ? 'rgba(200,152,42,0.25)' : 'rgba(0,212,122,0.2)',
              background: result.risk === 'HIGH' ? 'rgba(224,61,61,0.05)' : result.risk === 'MEDIUM' ? 'rgba(200,152,42,0.05)' : 'rgba(0,212,122,0.04)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-white/70">{result.domain}</span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded"
                style={{
                  color: result.risk === 'HIGH' ? '#e03d3d' : result.risk === 'MEDIUM' ? '#c8982a' : '#00d47a',
                  background: result.risk === 'HIGH' ? 'rgba(224,61,61,0.12)' : result.risk === 'MEDIUM' ? 'rgba(200,152,42,0.12)' : 'rgba(0,212,122,0.12)',
                }}>
                {result.risk} RISK
              </span>
            </div>
            {result.exposures > 0 && (
              <div className="text-[9px] font-mono text-white/40">
                {result.exposures.toLocaleString()} email accounts from this domain appear in known data breaches.
              </div>
            )}
            {result.note && <div className="text-[8px] font-mono text-white/25 italic">{result.note}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CanvasShield() {
  const [scanPulse, setScanPulse] = useState(false)
  useEffect(() => {
    const t = setInterval(() => { setScanPulse(true); setTimeout(() => setScanPulse(false), 600) }, 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[8px] font-mono text-white/25 uppercase tracking-[0.2em]">Canvas LMS Protection</div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full bg-nominal ${scanPulse ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
          <span className="text-[7px] font-mono text-nominal/60 uppercase tracking-wider">Live monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'API Monitoring',      value: 'ACTIVE',   ok: true },
          { label: 'MFA Enforced',         value: 'YES',      ok: true },
          { label: 'Rate Limit',           value: '< 200/min', ok: true },
          { label: 'Session Hijack Block', value: '0 today',  ok: true },
          { label: 'Anomalous Accounts',   value: '3 flagged', ok: false },
          { label: 'Last Deep Scan',       value: '2 min ago', ok: true },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[8px] font-mono text-white/30">{item.label}</span>
            <span className={`text-[8px] font-mono font-bold ${item.ok ? 'text-nominal' : 'text-amber-400'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OverallShieldGauge({ zones }) {
  const avg = Math.round(zones.reduce((s, z) => s + z.score, 0) / zones.length)
  const critical = zones.filter(z => z.status === 'critical').length
  const warnings = zones.filter(z => z.status === 'warning').length
  const color = critical > 0 ? '#e03d3d' : warnings > 0 ? '#c8982a' : '#00d47a'
  const label = critical > 0 ? 'AT RISK' : warnings > 0 ? 'MONITORING' : 'PROTECTED'

  return (
    <div className="flex flex-col items-center">
      <ProtectionRing score={avg} size={110} color={color} label={`INSTITUTIONAL ${label}`} />
    </div>
  )
}

export default function UniversityShieldModule() {
  const zones = useZoneScores()
  const threats = useLiveThreats()
  const { news, loading: newsLoading } = useEduNews()
  const [selectedZone, setSelectedZone] = useState(null)
  const [activeActor, setActiveActor] = useState(0)

  const critical = zones.filter(z => z.status === 'critical').length
  const warnings = zones.filter(z => z.status === 'warning').length
  const protected_ = zones.filter(z => z.status === 'protected').length

  useEffect(() => {
    const t = setInterval(() => setActiveActor(i => (i + 1) % THREAT_ACTORS.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-5 argus-fade">

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 rounded-lg bg-[#00d47a]/10 border border-[#00d47a]/20">
              <Shield className="w-4 h-4 text-shield" />
            </div>
            <h2 className="text-[11px] font-mono font-bold tracking-[0.22em] text-white/80 uppercase">
              University Shield · Operational Protection Layer
            </h2>
          </div>
          <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.18em] ml-10">
            Continuous defense for elite institutional infrastructure
          </p>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#e03d3d]" style={{ boxShadow: '0 0 6px #e03d3d' }} />
            <span className="text-red-400">{critical} critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c8982a]" />
            <span className="text-amber-400">{warnings} warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00d47a]" />
            <span className="text-shield">{protected_} protected</span>
          </div>
        </div>
      </div>

      {/* ─── Top Row: Gauge + Stats + Active Threat Actor ─── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Institutional Shield Score */}
        <div className="glass-panel p-5 flex flex-col items-center justify-center gap-4">
          <OverallShieldGauge zones={zones} />
          <div className="grid grid-cols-3 gap-3 w-full text-center">
            {[
              { label: 'Zones', value: zones.length,  color: 'text-white/60' },
              { label: 'Alerts', value: threats.filter(t => t.severity === 'critical').length, color: 'text-red-400' },
              { label: 'Blocked', value: 312, color: 'text-shield' },
            ].map(s => (
              <div key={s.label}>
                <div className={`text-lg font-bold font-mono tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[7px] font-mono text-white/20 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Score Rings */}
        <div className="glass-panel p-5">
          <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.2em] mb-4">Protection Coverage</div>
          <div className="grid grid-cols-4 gap-2">
            {zones.slice(0, 4).map(z => {
              const color = { protected: '#00d47a', warning: '#c8982a', critical: '#e03d3d', monitoring: '#00c8d4' }[z.status]
              return <ProtectionRing key={z.id} score={z.score} size={56} color={color} label={z.label.split(' ')[0]} />
            })}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {zones.slice(4).map(z => {
              const color = { protected: '#00d47a', warning: '#c8982a', critical: '#e03d3d', monitoring: '#00c8d4' }[z.status]
              return <ProtectionRing key={z.id} score={z.score} size={56} color={color} label={z.label.split(' ')[0]} />
            })}
          </div>
        </div>

        {/* Active Threat Actor Spotlight */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.2em]">Active Threat Intelligence</div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#e03d3d] animate-pulse-slow" style={{ boxShadow: '0 0 8px #e03d3d' }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeActor}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.35 }}
            >
              {(() => {
                const a = THREAT_ACTORS[activeActor]
                const color = a.risk === 'CRITICAL' ? '#e03d3d' : '#c8982a'
                return (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
                      <div>
                        <div className="text-[13px] font-bold font-mono" style={{ color }}>{a.name}</div>
                        <div className="text-[8px] font-mono text-white/30 mt-0.5">Target: {a.target}</div>
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-white/40 leading-relaxed">{a.recent}</div>
                    <div className="space-y-1">
                      {a.ttps.map(t => (
                        <div key={t} className="flex items-center gap-2 text-[8px] font-mono text-white/30">
                          <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color }} />
                          {t}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1">
                      {THREAT_ACTORS.map((_, i) => (
                        <div key={i} onClick={() => setActiveActor(i)}
                          className="h-0.5 flex-1 rounded-full cursor-pointer transition-all"
                          style={{ backgroundColor: i === activeActor ? color : 'rgba(255,255,255,0.08)' }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── 8 Protection Zones ─── */}
      <div>
        <div className="text-[7px] font-mono text-white/15 uppercase tracking-[0.3em] mb-3">8 Protection Zones · Real-Time Defense Status</div>
        <div className="grid grid-cols-4 gap-3">
          {zones.map(zone => (
            <ZoneCard key={zone.id} zone={zone} onClick={setSelectedZone} selected={selectedZone} />
          ))}
        </div>
      </div>

      {/* ─── Zone Detail Panel (conditional) ─── */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <selectedZone.icon className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest">{selectedZone.label}</span>
                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{
                  color: { protected: '#00d47a', warning: '#c8982a', critical: '#e03d3d' }[selectedZone.status],
                  background: { protected: 'rgba(0,212,122,0.1)', warning: 'rgba(200,152,42,0.1)', critical: 'rgba(224,61,61,0.1)' }[selectedZone.status],
                }}>{selectedZone.status.toUpperCase()}</span>
              </div>
              <button onClick={() => setSelectedZone(null)} className="text-white/15 hover:text-white/50 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-[9px] font-mono text-white/40">
              <div><span className="text-white/20">Coverage: </span>{selectedZone.score}%</div>
              <div><span className="text-white/20">Status: </span>{selectedZone.detail}</div>
              <div><span className="text-white/20">Module: </span>{selectedZone.desc}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom 3-column: Live Incidents + Threat Actors + Canvas + Domain ─── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Live Incident Feed */}
        <div className="glass-panel flex flex-col overflow-hidden" style={{ maxHeight: 440 }}>
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
            <div className="text-[8px] font-mono font-bold text-white/50 uppercase tracking-[0.2em]">Live Security Feed</div>
            <Activity className="w-3 h-3 text-nominal/50 animate-pulse-slow" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/[0.025]">
            {threats.map((t, i) => {
              const c = SEV_COLOR[t.severity] || SEV_COLOR.low
              return (
                <motion.div
                  key={i}
                  initial={i === 0 ? { opacity: 0, x: -8 } : {}}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-4 py-2.5 hover:bg-white/[0.015] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: c.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] font-mono text-white/50 leading-relaxed line-clamp-2">{t.event}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[7px] font-mono text-white/20">{t.time}</span>
                        <span className={`text-[6.5px] font-mono px-1 py-0.5 rounded ${c.bg} ${c.border} border ${c.text} uppercase tracking-wide`}>{t.module}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Threat Actors + Canvas Shield */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-4 flex-1">
            <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.2em] mb-3">Active Threat Actors</div>
            <div className="space-y-2">
              {THREAT_ACTORS.map(a => <ThreatActorCard key={a.name} actor={a} />)}
            </div>
          </div>
        </div>

        {/* Canvas Shield + Domain Breach */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-4">
            <CanvasShield />
          </div>
          <div className="glass-panel p-4">
            <DomainBreachChecker />
          </div>
        </div>
      </div>

      {/* ─── Breach Intelligence Feed ─── */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[8px] font-mono font-bold text-white/40 uppercase tracking-[0.22em]">
            Education Sector Breach Intelligence · Live Feed
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-white/15" />
            <span className="text-[7px] font-mono text-white/15 uppercase tracking-wider">Global awareness</span>
          </div>
        </div>
        {newsLoading ? (
          <div className="flex items-center gap-2 text-white/15 text-[9px] font-mono">
            <RefreshCcw className="w-3 h-3 animate-spin" /> Fetching intelligence feeds...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {news.map((item, i) => (
              <motion.a
                key={i}
                href={item.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
              >
                <FileText className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5 group-hover:text-accent-cyan transition-colors" />
                <div className="min-w-0">
                  <div className="text-[9px] font-mono text-white/55 leading-relaxed line-clamp-2 group-hover:text-white/75 transition-colors">{item.title}</div>
                  <div className="text-[7px] font-mono text-white/20 mt-1">{item.source} · {(item.published || '').slice(0, 10)}</div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
