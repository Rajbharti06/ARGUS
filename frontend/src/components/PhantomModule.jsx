import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Database, Terminal, Globe, Server, Mail, Cpu, AlertTriangle, RefreshCcw, ChevronRight } from 'lucide-react'

const HP_ICONS = {
  'Database Honeypot':        Database,
  'SSH Honeypot':             Terminal,
  'File Share Honeypot':      Server,
  'Web Application Honeypot': Globe,
  'Email Honeypot':           Mail,
  'API Honeypot':             Cpu,
}

const SEV = { critical: '#FF3B5C', high: '#f97316', medium: '#eab308', low: '#6b9e7a' }

function Badge({ label, color, bg }) {
  return (
    <span style={{
      fontFamily: 'JetBrains Mono', fontSize: '0.4rem', fontWeight: 700,
      color: color, background: bg || `${color}15`,
      border: `1px solid ${color}30`, padding: '1px 6px',
      borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.14em',
    }}>{label}</span>
  )
}

function HoneypotCard({ hp, active, onClick }) {
  const Icon = HP_ICONS[hp.type] || Eye
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(hp)}
      style={{
        background: active ? `${hp.color}08` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? hp.color + '40' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10,
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: `linear-gradient(to right, transparent, ${hp.color}, transparent)`,
        }} />
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${hp.color}15`, border: `1px solid ${hp.color}30` }}>
          <Icon className="w-4 h-4" style={{ color: hp.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: hp.color }}>{hp.name}</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: hp.status === 'active' ? '#6b9e7a' : '#6d8588' }} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>{hp.type}</div>
        </div>
        <Badge label={hp.tier} color={hp.color} />
      </div>

      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', marginBottom: 10, lineHeight: 1.5 }}>
        {hp.lure}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ['IP',  hp.ip,   'rgba(255,255,255,0.55)'],
          ['Port',hp.port, 'rgba(255,255,255,0.55)'],
          ['Engagements', hp.engagements, hp.color],
        ].map(([l,v,c]) => (
          <div key={l}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>{l}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {hp.last_hit && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>
            LAST HIT: <span style={{ color: hp.color }}>{hp.last_hit}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function SessionCard({ session }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: `${session.color}06`, border: `1px solid ${session.color}25` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: session.color }}>
            {session.session_id}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            {session.honeypot}
          </div>
        </div>
        <Badge label={session.classification} color={session.color} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          ['Attacker IP',  session.attacker_ip, '#FF3B5C'],
          ['Country / ASN',`${session.country} | ${session.asn}`, 'rgba(255,255,255,0.55)'],
          ['Duration',     session.duration, session.color],
          ['Queries',      session.queries.toLocaleString(), 'rgba(255,255,255,0.55)'],
          ['Data Read',    `${session.data_read_mb} MB`, 'rgba(255,255,255,0.55)'],
          ['Confidence',   `${session.confidence}%`, session.color],
        ].map(([l,v,c]) => (
          <div key={l}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.52rem', fontWeight: 600, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Behavioral DNA */}
      <div className="p-2 rounded-md" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>
          Behavioral DNA
        </div>
        <div className="flex items-center gap-0.5">
          {session.dna_display?.map((seg, i) => (
            <span key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700, color: seg.color }}>{seg.char}</span>
          ))}
        </div>
      </div>

      {/* Tactics */}
      <div className="flex gap-1.5 mt-2">
        {session.tactics_observed?.map(t => <Badge key={t} label={t} color={session.color} />)}
      </div>
    </div>
  )
}

function CanaryRow({ token }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md mb-1.5"
      style={{ background: token.triggered ? 'rgba(255,59,92,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${token.triggered ? 'rgba(255,59,92,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: token.triggered ? '#FF3B5C' : '#6d8588' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.48rem', fontWeight: 700, color: token.triggered ? '#FF3B5C' : 'rgba(255,255,255,0.5)' }}>
            {token.name}
          </span>
          <Badge label={token.type} color={token.triggered ? '#FF3B5C' : '#6d8588'} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.3)' }}>{token.location}</div>
        {token.triggered && (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: '#FF3B5C', marginTop: 2 }}>
            ▲ TRIGGERED {token.triggered_at} by {token.trigger_ip}
          </div>
        )}
      </div>
      {!token.triggered && (
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: '#6b9e7a' }}>ARMED</span>
      )}
    </div>
  )
}

export default function PhantomModule() {
  const [honeypots,  setHoneypots]  = useState([])
  const [sessions,   setSessions]   = useState({ sessions: [] })
  const [canary,     setCanary]     = useState({ tokens: [] })
  const [intel,      setIntel]      = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [activeTab,  setActiveTab]  = useState('honeypots')
  const [loading,    setLoading]    = useState(true)

  const load = useCallback(async () => {
    try {
      const [hRes, sRes, cRes, iRes] = await Promise.all([
        fetch('/api/phantom/honeypots'),
        fetch('/api/phantom/sessions'),
        fetch('/api/phantom/canary'),
        fetch('/api/phantom/intelligence'),
      ])
      const [h, s, c, i] = await Promise.all([hRes.json(), sRes.json(), cRes.json(), iRes.json()])
      setHoneypots(h.honeypots || [])
      setSessions(s)
      setCanary(c)
      setIntel(i)
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t) }, [load])

  const TABS = [
    { id: 'honeypots', label: 'Honeypots',       count: honeypots.length },
    { id: 'sessions',  label: 'Live Sessions',   count: sessions.total_active },
    { id: 'canary',    label: 'Canary Tokens',   count: canary.triggered },
    { id: 'intel',     label: 'Threat Intel',    count: intel?.new_iocs_24h },
  ]

  const totalEngagements = honeypots.reduce((s, h) => s + (h.engagements || 0), 0)

  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['Active Honeypots',    honeypots.filter(h => h.status === 'active').length, '#6b9e7a'],
          ['Total Engagements',  totalEngagements.toLocaleString(), '#f97316'],
          ['Active Sessions',    sessions.total_active ?? '—', '#FF3B5C'],
          ['Canary Triggered',   canary.triggered ?? '—', '#FF3B5C'],
        ].map(([l,v,c]) => (
          <div key={l} className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 3 }}>{l}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: activeTab === tab.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              fontFamily: 'JetBrains Mono', fontSize: '0.5rem', fontWeight: activeTab === tab.id ? 700 : 400,
              textTransform: 'uppercase', letterSpacing: '0.14em', border: 'none', cursor: 'pointer',
            }}>
            {tab.label}
            {tab.count != null && (
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 10, fontSize: '0.4rem' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {activeTab === 'honeypots' && (
            <div className="grid grid-cols-3 gap-3">
              {honeypots.map(hp => (
                <HoneypotCard key={hp.id} hp={hp} active={selected?.id === hp.id} onClick={setSelected} />
              ))}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              {sessions.sessions?.map(s => <SessionCard key={s.session_id} session={s} />)}
              {!sessions.sessions?.length && (
                <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.55rem' }}>
                  No active attacker sessions
                </div>
              )}
            </div>
          )}

          {activeTab === 'canary' && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
                    Canary Token Network
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    {canary.triggered}/{canary.total} tokens triggered · Alert rate: {canary.alert_rate}
                  </div>
                </div>
              </div>
              {canary.tokens?.map(t => <CanaryRow key={t.id} token={t} />)}
            </div>
          )}

          {activeTab === 'intel' && intel && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
                  Top Attacker IPs
                </div>
                {intel.top_attacker_ips?.map((ip, i) => (
                  <div key={ip.ip} className="flex items-center gap-3 py-2 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', width: 14 }}>{i+1}</span>
                    <div className="flex-1">
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.52rem', fontWeight: 700, color: ip.color }}>{ip.ip}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.3)' }}>{ip.country} · {ip.classification}</div>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.48rem', fontWeight: 700, color: ip.color }}>{ip.sessions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
                  Attack Patterns
                </div>
                {intel.attack_patterns?.map(p => (
                  <div key={p.pattern} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.45rem', color: 'rgba(255,255,255,0.55)' }}>{p.pattern}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.45rem', fontWeight: 700, color: p.color }}>{p.count}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(p.count / 10, 100)}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between">
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.25)' }}>Total Blocked (All Time)</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: '#6b9e7a' }}>{intel.total_blocked?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.25)' }}>New IOCs (24h)</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: '#f97316' }}>{intel.new_iocs_24h}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
