import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Shield, AlertTriangle, Activity } from 'lucide-react'
import { cn } from '../utils/cn'

const SESSIONS = [
  {
    id: 'DJ', name: 'Dr. J. Lee', role: 'Faculty / Research Lead',
    location: 'Singapore → Beijing', device: 'Unknown MacBook Pro',
    trustScore: 14, riskLevel: 'critical', status: 'BLOCKED',
    indicators: ['Impossible travel (8h gap)', 'Unknown device fingerprint', 'Bulk file access at 03:00'],
    sessions: ['192.168.1.44 — 09:12:34 UTC', '10.0.0.17 — 08:55:12 UTC', '172.16.0.3 — 07:41:09 UTC'],
    timeline: [88, 85, 79, 72, 60, 48, 33, 22, 14],
  },
  {
    id: 'PS', name: 'Prof. Dr. Singh', role: 'Admin / IT Director',
    location: 'Mumbai → Moscow', device: 'New Windows Device',
    trustScore: 23, riskLevel: 'critical', status: 'REVOKE',
    indicators: ['5 failed MFA attempts', 'Location anomaly: Russia', 'Admin portal access 22:00'],
    sessions: ['10.22.33.41 — 22:04:15 UTC', '10.22.33.41 — 21:58:03 UTC'],
    timeline: [90, 88, 82, 74, 65, 50, 38, 28, 23],
  },
  {
    id: 'AM', name: 'Ms. McAndrews', role: 'Student / Undergrad',
    location: 'London → Amsterdam', device: 'Shared Lab PC',
    trustScore: 48, riskLevel: 'high', status: 'MONITOR',
    indicators: ['Data exfil spike: 4.2 GB', '2 failed login attempts', 'Unusual access hours (23:00)'],
    sessions: ['185.220.101.7 — 23:14:22 UTC', '185.220.101.7 — 22:59:41 UTC'],
    timeline: [91, 88, 84, 79, 72, 65, 58, 52, 48],
  },
  {
    id: 'TP', name: 'T. Patel', role: 'Staff / HR Department',
    location: 'Dubai → Toronto', device: 'Corporate Laptop',
    trustScore: 67, riskLevel: 'medium', status: 'REVIEW',
    indicators: ['VPN location mismatch', '1 failed attempt at 18:00'],
    sessions: ['198.51.100.14 — 18:32:01 UTC'],
    timeline: [91, 90, 89, 85, 82, 78, 74, 70, 67],
  },
  {
    id: 'UU', name: 'User Unknown', role: 'Guest / Unregistered',
    location: 'TOR Exit Node', device: 'Anonymous / Hidden',
    trustScore: 2, riskLevel: 'critical', status: 'BLOCKED',
    indicators: ['TOR anonymization network', '12 failed MFA attempts', 'No valid session token', 'Probing admin endpoints'],
    sessions: ['104.244.72.115 — 04:02:11 UTC', '104.244.72.115 — 03:58:44 UTC', '104.244.72.115 — 03:44:12 UTC'],
    timeline: [45, 38, 30, 22, 14, 8, 5, 3, 2],
  },
]

const STATUS_CLS = {
  BLOCKED: 'text-red-400 border-red-900/40 bg-red-950/20',
  REVOKE:  'text-orange-400 border-orange-900/40 bg-orange-950/20',
  MONITOR: 'text-yellow-400 border-yellow-900/40 bg-yellow-950/20',
  REVIEW:  'text-yellow-300 border-yellow-900/30 bg-yellow-950/10',
}

const RISK_CLS = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-nominal',
}

const RISK_BAR = {
  critical: '#FF3B5C',
  high:     '#FFB547',
  medium:   '#fbbf24',
  low:      '#6d8588',
}

function TrustRing({ score, riskLevel }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const color = RISK_BAR[riskLevel] || '#6d8588'
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
        <motion.circle
          cx="64" cy="64" r={r}
          fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: 'circOut' }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
        <span className="text-[8px] text-white/30 uppercase tracking-widest">Trust Score</span>
      </div>
    </div>
  )
}

function TrustTimeline({ data, riskLevel }) {
  const color = RISK_BAR[riskLevel] || '#4ade80'
  const w = 200, h = 56
  const max = Math.max(...data), min = Math.min(...data, 0)
  const xs = data.map((_, i) => (i / (data.length - 1)) * w)
  const ys = data.map(v => h - ((v - min) / (max - min || 1)) * h * 0.85 - h * 0.05)
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} className="w-full" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`tg-${riskLevel}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#tg-${riskLevel})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export default function IdentityModule({ onAlert }) {
  const [selected, setSelected] = useState(SESSIONS[0])
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? SESSIONS : SESSIONS.filter(s => s.riskLevel === filter)

  return (
    <div className="flex flex-col h-full gap-4 argus-fade" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Header stats + filters */}
      <div className="flex items-center gap-6 flex-shrink-0">
        {[
          { label: 'Active Sessions', value: '14,328', cls: 'text-white' },
          { label: 'Avg Trust Score', value: '87.4',   cls: 'text-nominal' },
          { label: 'Active Alerts',   value: '11',      cls: 'text-yellow-400' },
          { label: 'Critical',        value: '4',       cls: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="flex flex-col">
            <span className={cn('text-2xl font-bold font-mono', s.cls)}>{s.value}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto flex gap-2">
          {['all', 'critical', 'high', 'medium'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded border transition-all',
                filter === f
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'border-white/5 text-white/30 hover:text-white/50 hover:border-white/10'
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sessions table */}
        <div className="flex-1 flex flex-col glass-panel overflow-hidden min-h-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="module-header">Identity Sessions — Zero Trust Monitor</span>
            <span className="ml-auto text-[9px] text-white/20">{filtered.length} USERS</span>
          </div>

          {/* Table header */}
          <div className="grid gap-0 px-4 py-2 border-b border-white/[0.04] flex-shrink-0"
            style={{ gridTemplateColumns: '1.6fr 1fr 1.4fr 1fr auto' }}>
            {['USER / IDENTITY', 'LOCATION', 'BEHAVIORAL INDICATORS', 'TRUST SCORE', 'ACTION'].map(h => (
              <span key={h} className="section-label">{h}</span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.map(session => (
              <motion.div key={session.id} onClick={() => setSelected(session)}
                className={cn(
                  'grid gap-0 items-center px-4 py-3.5 border-b border-white/[0.025] cursor-pointer transition-all group',
                  selected?.id === session.id
                    ? 'bg-primary/[0.04] border-l-2 border-l-primary/50'
                    : 'hover:bg-white/[0.015]'
                )}
                style={{ gridTemplateColumns: '1.6fr 1fr 1.4fr 1fr auto' }}>

                {/* User identity */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0',
                    session.riskLevel === 'critical' ? 'bg-red-950/50 text-red-400' :
                    session.riskLevel === 'high'     ? 'bg-orange-950/50 text-orange-400' :
                    'bg-primary/20 text-primary'
                  )}>
                    {session.id}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-white/80 group-hover:text-white transition-colors">{session.name}</div>
                    <div className="text-[9px] text-white/30">{session.role}</div>
                  </div>
                </div>

                {/* Location */}
                <div className="text-[10px] font-mono text-white/40 truncate pr-2">{session.location}</div>

                {/* Indicators */}
                <div className="flex flex-col gap-0.5 pr-2">
                  {session.indicators.slice(0, 2).map((ind, i) => (
                    <div key={i} className="text-[9px] text-white/35 truncate">{ind}</div>
                  ))}
                  {session.indicators.length > 2 && (
                    <div className="text-[8px] text-white/20">+{session.indicators.length - 2} more</div>
                  )}
                </div>

                {/* Trust bar */}
                <div className="flex items-center gap-2 pr-3">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                    <motion.div className="h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${session.trustScore}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ background: RISK_BAR[session.riskLevel] }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-bold font-mono w-5 text-right', RISK_CLS[session.riskLevel])}>
                    {session.trustScore}
                  </span>
                </div>

                {/* Status badge */}
                <span className={cn('text-[8px] font-bold px-2 py-1 rounded border whitespace-nowrap', STATUS_CLS[session.status])}>
                  {session.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div key={selected.id}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="w-60 flex flex-col gap-3 flex-shrink-0">

              {/* Trust ring */}
              <div className="glass-panel p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 self-start w-full">
                  <div className={cn('w-6 h-6 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0',
                    selected.riskLevel === 'critical' ? 'bg-red-950/50 text-red-400' :
                    selected.riskLevel === 'high' ? 'bg-orange-950/50 text-orange-400' : 'bg-yellow-950/50 text-yellow-400'
                  )}>{selected.id}</div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-white/70 truncate">{selected.name}</div>
                    <div className="text-[8px] text-white/30 truncate">{selected.device}</div>
                  </div>
                </div>
                <TrustRing score={selected.trustScore} riskLevel={selected.riskLevel} />
                <span className={cn('text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded border', STATUS_CLS[selected.status])}>
                  {selected.status} — {selected.riskLevel.toUpperCase()} RISK
                </span>
              </div>

              {/* Trust timeline */}
              <div className="glass-panel p-3">
                <div className="section-label mb-2">Trust Degradation</div>
                <TrustTimeline data={selected.timeline} riskLevel={selected.riskLevel} />
              </div>

              {/* Sessions + indicators */}
              <div className="glass-panel p-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="section-label mb-2">Active Sessions</div>
                <div className="space-y-1.5 mb-4">
                  {selected.sessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" style={{ boxShadow: '0 0 4px #FF3B5C' }} />
                      <span className="text-[9px] font-mono text-white/40">{s}</span>
                    </div>
                  ))}
                </div>

                <div className="section-label mb-2">Behavioral Indicators</div>
                <div className="space-y-1.5">
                  {selected.indicators.map((ind, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-2.5 h-2.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[9px] text-white/40 leading-snug">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="glass-panel p-3 flex flex-col gap-1.5 flex-shrink-0">
                {['OVERRIDE DECISION', 'STAY AT MFA', 'FORCE LOGOUT'].map(action => (
                  <button key={action} className="btn-argus py-2 text-[9px] w-full">{action}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
