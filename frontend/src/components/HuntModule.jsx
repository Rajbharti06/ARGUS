import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Target, Zap, Shield, AlertTriangle, RefreshCcw, ChevronRight, Activity } from 'lucide-react'

const SEV = {
  critical: { bg: 'rgba(255,59,92,0.06)',  border: 'rgba(255,59,92,0.25)',  text: '#FF3B5C' },
  high:     { bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.25)', text: '#f97316' },
  medium:   { bg: 'rgba(234,179,8,0.06)',  border: 'rgba(234,179,8,0.25)',  text: '#eab308' },
  low:      { bg: 'rgba(107,158,122,0.06)','border':'rgba(107,158,122,0.25)',text: '#6b9e7a' },
}

function SevBadge({ level }) {
  const s = SEV[level] || SEV.low
  return (
    <span style={{
      fontFamily: 'JetBrains Mono', fontSize: '0.4rem', fontWeight: 700,
      color: s.text, background: s.bg, border: `1px solid ${s.border}`,
      padding: '1px 6px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.14em',
    }}>{level}</span>
  )
}

function FindingCard({ finding, index }) {
  const [expanded, setExpanded] = useState(false)
  const s = SEV[finding.severity] || SEV.low

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}
    >
      <div
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-1 h-full flex-shrink-0 self-stretch rounded-full" style={{ background: s.text, minHeight: 32 }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SevBadge level={finding.severity} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)' }}>{finding.rule_id}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: s.text, background: `${s.text}10`, border: `1px solid ${s.text}20`, padding: '1px 5px', borderRadius: 2 }}>
              {finding.ttp}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>{finding.tactic}</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
            {finding.rule_name}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: s.text, fontWeight: 600 }}>
            {finding.evidence}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>{finding.timestamp}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: 2 }}>
            {finding.source}
          </span>
          {finding.confidence && (
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color: s.text }}>{finding.confidence}%</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: `1px solid ${s.border}` }}
          >
            <div className="p-3 pt-2">
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>
                Description
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.45rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {finding.description}
              </div>
              {finding.pid && (
                <div className="mt-2 flex items-center gap-3">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>PID: <span style={{ color: s.text }}>{finding.pid}</span></span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>PROCESS: <span style={{ color: s.text }}>{finding.process}</span></span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RuleRow({ rule }) {
  const s = SEV[rule.severity] || SEV.low
  return (
    <div className="flex items-center gap-3 py-2 px-3 mb-1 rounded-md"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color: s.text, width: 60, flexShrink: 0 }}>{rule.id}</span>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.48rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{rule.name}</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.25)' }}>{rule.tactic}</div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: s.text, background: `${s.text}10`, border: `1px solid ${s.text}20`, padding: '1px 5px', borderRadius: 2, flexShrink: 0 }}>
        {rule.ttp}
      </span>
      <SevBadge level={rule.severity} />
    </div>
  )
}

export default function HuntModule() {
  const [result,    setResult]    = useState(null)
  const [rules,     setRules]     = useState([])
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState('findings')
  const [filter,    setFilter]    = useState('all')
  const [scanning,  setScanning]  = useState(false)
  const [lastScan,  setLastScan]  = useState(null)

  const runScan = useCallback(async () => {
    setScanning(true)
    try {
      const [rRes, rulesRes] = await Promise.all([
        fetch('/api/hunt/scan'),
        fetch('/api/hunt/rules'),
      ])
      const [r, ru] = await Promise.all([rRes.json(), rulesRes.json()])
      setResult(r)
      setRules(ru.rules || [])
      setLastScan(new Date().toLocaleTimeString('en-US', { hour12: false }))
    } catch {}
    setScanning(false)
    setLoading(false)
  }, [])

  useEffect(() => { setLoading(true); runScan(); const t = setInterval(runScan, 30000); return () => clearInterval(t) }, [runScan])

  const findings = result?.findings || []
  const filtered = filter === 'all' ? findings : findings.filter(f => f.severity === filter)

  const TABS = [
    { id: 'findings', label: 'Hunt Findings', count: findings.length },
    { id: 'rules',    label: 'Hunt Rules',    count: rules.length },
    { id: 'coverage', label: 'Tactic Coverage' },
  ]

  return (
    <div className="space-y-4">

      {/* Header stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          ['Rules Active',    result?.rules_evaluated || '—', '#6b9e7a'],
          ['Total Findings',  result?.total_findings  || '—', '#eab308'],
          ['Critical',        result?.critical_count  || '—', '#FF3B5C'],
          ['High',            result?.high_count      || '—', '#f97316'],
          ['Live Detections', result?.live_detections || '—', '#a855f7'],
        ].map(([l,v,c]) => (
          <div key={l} className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 3 }}>{l}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: activeTab === tab.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                fontFamily: 'JetBrains Mono', fontSize: '0.5rem',
                fontWeight: activeTab === tab.id ? 700 : 400,
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

        <div className="flex items-center gap-2">
          {lastScan && (
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)' }}>
              Last scan: {lastScan}
            </span>
          )}
          <button
            onClick={() => runScan()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono', fontSize: '0.5rem', cursor: 'pointer' }}
          >
            <RefreshCcw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning…' : 'Run Hunt'}
          </button>
        </div>
      </div>

      {/* Severity filter */}
      {activeTab === 'findings' && (
        <div className="flex items-center gap-1.5">
          {['all','critical','high','medium','low'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: filter === f ? 700 : 400,
                color: filter === f ? (SEV[f]?.text || 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.3)',
                background: filter === f ? ((SEV[f]?.bg) || 'rgba(255,255,255,0.06)') : 'transparent',
                border: `1px solid ${filter === f ? (SEV[f]?.border || 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.06)'}`,
                padding: '3px 10px', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.14em',
                transition: 'all 0.15s',
              }}>
              {f} {f !== 'all' && `(${findings.filter(fn => fn.severity === f).length})`}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {activeTab === 'findings' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center h-48" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.55rem' }}>
                  HUNTING FOR THREATS…
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.55rem' }}>
                  No findings at severity: {filter}
                </div>
              ) : (
                filtered.map((f, i) => <FindingCard key={f.rule_id + i} finding={f} index={i} />)
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div>
              {rules.map(r => <RuleRow key={r.id} rule={r} />)}
            </div>
          )}

          {activeTab === 'coverage' && result?.tactics_covered && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 16 }}>
                MITRE ATT&CK Tactic Coverage
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(result.tactics_covered).map(([tactic, count]) => (
                  <div key={tactic} className="flex items-center gap-3 py-2 px-3 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.48rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{tactic}</div>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: '#f97316' }}>{count} findings</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
