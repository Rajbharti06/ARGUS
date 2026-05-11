import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, X, RefreshCcw, ChevronRight } from 'lucide-react'
import { sound } from '../utils/sound'

const SEV = {
  critical: { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    bar: '#FF3B5C', dot: '#ef4444' },
  high:     { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', bar: '#f97316', dot: '#f97316' },
  medium:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', bar: '#eab308', dot: '#eab308' },
  low:      { bg: 'bg-nominal/10',  border: 'border-nominal/30',  text: 'text-nominal',  bar: '#6d8588', dot: '#6d8588' },
}

function SparkLine({ color = 'var(--accent-cyan)', severity = 'low' }) {
  const base = severity === 'critical' ? 60 : severity === 'high' ? 40 : severity === 'medium' ? 25 : 10
  const data = Array.from({ length: 24 }, (_, i) =>
    Math.max(0, base + Math.sin(i * 0.8) * 15 + Math.random() * 20)
  )
  const max = Math.max(...data, 1)
  const w = 180, h = 52
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id={`sg-${severity}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${severity})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function Row({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{label}</span>
      <span className={`text-[9px] font-mono truncate max-w-[140px] ${warn ? 'text-[#FF3B5C]' : 'text-white/55'}`}>{value || '—'}</span>
    </div>
  )
}

export default function SentinelModule({ onAlert, soundOn }) {
  const [events, setEvents]       = useState([])
  const [stats, setStats]         = useState(null)
  const [sysData, setSysData]     = useState(null)
  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = async (isInit = false) => {
    try {
      const [evRes, stRes, sysRes] = await Promise.all([
        fetch('/api/argus/sentinel/events'),
        fetch('/api/argus/sentinel/stats'),
        fetch('/api/intelligence/system'),
      ])
      const evData  = await evRes.json()
      const stData  = await stRes.json()
      const sysD    = await sysRes.json()
      const incoming = evData.events || []
      setEvents(incoming)
      setStats(stData)
      setSysData(sysD)
      setLastRefresh(new Date().toLocaleTimeString('en-US', { hour12: false }))
      setLoading(false)
      if (!isInit) {
        const crit = incoming.find(e => e.severity === 'critical')
        if (crit) onAlert?.(crit.description?.slice(0, 65))
      }
      if (!selected && incoming.length) setSelected(incoming[0])
    } catch { setLoading(false) }
  }

  useEffect(() => {
    fetchData(true)
    const t = setInterval(() => fetchData(false), 10000)
    return () => clearInterval(t)
  }, [])

  const filtered = filter === 'all' ? events : events.filter(e => e.severity === filter)
  const critical = events.filter(e => e.severity === 'critical').length
  const high     = events.filter(e => e.severity === 'high').length
  const medium   = events.filter(e => e.severity === 'medium').length

  return (
    <div className="flex flex-col gap-4 argus-fade" style={{ height: 'calc(100vh - 110px)' }}>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="module-header">Sentinel · Threat Monitoring</h2>
          <p className="text-white/20 text-[10px] mt-0.5 font-mono uppercase tracking-widest">
            Live SIEM · Autonomous correlation {lastRefresh && `· ${lastRefresh}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-nominal animate-pulse-slow" />
          <span className="text-[9px] font-mono text-nominal/70 uppercase tracking-widest">Live feed</span>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        {[
          { label: 'CRITICAL ALARMS', val: critical,                            color: '#FF3B5C' },
          { label: 'HIGH',            val: high,                                color: '#f97316' },
          { label: 'MEDIUM',          val: medium,                              color: '#eab308' },
          { label: 'ACTIVE SESSIONS', val: stats?.active_sessions?.toLocaleString() || '—', color: 'var(--accent-cyan)' },
          { label: 'ENDPOINTS',       val: stats?.endpoints_monitored?.toLocaleString() || '—', color: 'var(--semantic-nominal)' },
        ].map(s => (
          <div key={s.label} className="glass-panel px-4 py-3">
            <div className="text-2xl font-bold font-mono tabular-nums leading-none"
              style={{ color: s.color, textShadow: `0 0 16px ${s.color}50` }}>{s.val}</div>
            <div className="text-[7px] font-mono text-white/20 uppercase tracking-[0.2em] mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Main: Table + Detail ─── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Event Table */}
        <div className="flex-1 glass-panel flex flex-col min-w-0 overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {['all', 'critical', 'high', 'medium', 'low'].map(f => {
                const c = f === 'all' ? null : SEV[f]
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase tracking-widest transition-all border ${
                      filter === f
                        ? (c ? `${c.bg} ${c.border} ${c.text}` : 'bg-primary/10 border-primary/30 text-primary')
                        : 'border-transparent text-white/20 hover:text-white/40'
                    }`}>
                    {f === 'all' ? 'All Sources' : f}
                  </button>
                )
              })}
            </div>
            <span className="text-[8px] font-mono text-white/15">{filtered.length} events · Auto-refresh 10s</span>
          </div>

          {/* Column headers */}
          <div className="px-4 py-2 border-b border-white/[0.03] grid grid-cols-[90px_1fr_110px_90px] gap-3 flex-shrink-0">
            {['TIMESTAMP', 'EVENT / SOURCE IP', 'SEVERITY', 'RISK SCORE'].map(h => (
              <div key={h} className="text-[7px] font-mono font-bold text-white/15 uppercase tracking-[0.2em]">{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-white/15 text-xs font-mono">
                <RefreshCcw className="w-4 h-4 animate-spin" /> Connecting to telemetry stream...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/10 text-xs font-mono uppercase tracking-widest">
                No events match filter
              </div>
            ) : (
              filtered.map(ev => {
                const s = SEV[ev.severity] || SEV.low
                const risk = ev.geo?.risk_score ?? (ev.severity === 'critical' ? 87 : ev.severity === 'high' ? 65 : ev.severity === 'medium' ? 38 : 15)
                const isSel = selected?.id === ev.id
                return (
                  <motion.div key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={() => setSelected(isSel ? null : ev)}
                    className={`px-4 py-2.5 grid grid-cols-[90px_1fr_110px_90px] gap-3 border-b cursor-pointer transition-all group ${
                      isSel
                        ? 'bg-primary/[0.04] border-primary/[0.08]'
                        : 'border-white/[0.025] hover:bg-white/[0.015]'
                    }`}
                  >
                    <div className="text-[9px] font-mono text-white/25 tabular-nums pt-0.5">{ev.timestamp}</div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot, boxShadow: ev.severity === 'critical' ? `0 0 4px ${s.dot}` : 'none' }} />
                        <div className="text-[10px] font-bold text-white/70 truncate font-mono">
                          {ev.event?.replace(/_/g, ' ').toUpperCase()}
                        </div>
                      </div>
                      <div className="text-[9px] text-white/25 font-mono mt-0.5 truncate pl-3.5">
                        {ev.ip}
                        {ev.geo?.country && ` · ${ev.geo.country}`}
                        {ev.geo?.proxy && <span className="ml-2 text-[#FF3B5C]/70">VPN</span>}
                      </div>
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest ${s.bg} ${s.border} ${s.text}`}>
                        {ev.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${risk}%`, backgroundColor: s.bar }} />
                      </div>
                      <span className={`text-[9px] font-bold font-mono tabular-nums w-5 text-right ${s.text}`}>{risk}</span>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        {/* ─── Detail Panel ─── */}
        <div className="w-72 flex-shrink-0">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                className="glass-panel flex flex-col h-full overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/[0.04] flex-shrink-0"
                  style={{ background: `${SEV[selected.severity]?.dot || '#00D1FF'}08` }}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Threat Detail</span>
                    <button onClick={() => setSelected(null)} className="text-white/15 hover:text-white/50 transition-colors -mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className={`text-[11px] font-bold uppercase tracking-wide font-mono leading-snug ${SEV[selected.severity]?.text}`}>
                    {selected.event?.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                  {/* Activity chart */}
                  <div>
                    <div className="text-[7px] font-mono text-white/15 uppercase tracking-[0.3em] mb-2">Activity Signature</div>
                    <div className="rounded-lg bg-black/40 border border-white/[0.04] p-2 overflow-hidden">
                      <SparkLine color={SEV[selected.severity]?.bar || '#00D1FF'} severity={selected.severity} />
                    </div>
                  </div>

                  {/* Source intel */}
                  <div>
                    <div className="text-[7px] font-mono text-white/15 uppercase tracking-[0.3em] mb-2">Source Intelligence</div>
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 space-y-0.5">
                      <Row label="IP" value={selected.ip} />
                      <Row label="Event ID" value={selected.id} />
                      <Row label="Country" value={selected.geo?.country || selected.country} />
                      {selected.geo?.city && <Row label="City" value={selected.geo.city} />}
                      {selected.geo?.isp && <Row label="ISP" value={selected.geo.isp?.slice(0, 26)} />}
                      {selected.geo?.asn && <Row label="ASN" value={selected.geo.asn?.slice(0, 18)} />}
                      {selected.geo?.proxy && <Row label="Anonymizer" value="VPN/Proxy Detected" warn />}
                      {selected.geo?.hosting && <Row label="Infrastructure" value="Cloud/VPS Hosting" warn />}
                    </div>
                  </div>

                  {/* Behavioral indicators */}
                  <div>
                    <div className="text-[7px] font-mono text-white/15 uppercase tracking-[0.3em] mb-2">
                      Identified Behavioral Indicators
                    </div>
                    <div className="space-y-1.5">
                      {[
                        selected.description,
                        selected.geo?.proxy ? 'Traffic anonymized via VPN/Proxy infrastructure' : null,
                        selected.geo?.hosting ? 'Origin: Cloud/VPS (common C2 infrastructure)' : null,
                        selected.severity === 'critical' ? 'Immediate containment recommended' : null,
                        selected.severity === 'high' ? 'Enhanced monitoring activated' : null,
                      ].filter(Boolean).slice(0, 4).map((ind, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2 rounded bg-white/[0.02] border border-white/[0.03]">
                          <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: SEV[selected.severity]?.bar || 'var(--accent-cyan)' }} />
                          <span className="text-[9px] font-mono text-white/40 leading-relaxed">{ind}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-white/[0.04] space-y-2 flex-shrink-0">
                  <button className="w-full py-2 rounded-lg text-[9px] font-bold font-mono uppercase tracking-widest transition-all
                    bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15">
                    Analyze Threat
                  </button>
                  <button className="w-full py-2 rounded-lg text-[9px] font-bold font-mono uppercase tracking-widest transition-all
                    bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 text-[#FF3B5C] hover:bg-[#FF3B5C]/15">
                    Investigate
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.25 }}
                className="glass-panel h-full flex flex-col items-center justify-center gap-3">
                <Eye className="w-8 h-8 text-white/10" />
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest text-center leading-relaxed">
                  Select an event<br />to view details
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
