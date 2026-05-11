import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Activity, Lock, RefreshCcw } from 'lucide-react'
import { cn } from '../../utils/cn'

/* ═══════════════════════════════════════════════
   ACTIVE INCIDENT CARD — Emotional Anchor
   The most important single panel on the dashboard
   ═══════════════════════════════════════════════ */

export default function ActiveIncidentCard() {
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchIncident = async () => {
    try {
      const response = await fetch('/api/argus/oracle/timeline')
      const data = await response.json()
      setIncident(data)
      setLoading(false)
    } catch (error) {
      console.error("Active incident link failure:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncident()
    const t = setInterval(fetchIncident, 10000)
    return () => clearInterval(t)
  }, [])

  if (loading && !incident) {
    return (
      <div className="glass-panel-critical h-full flex flex-col items-center justify-center gap-4 py-20 opacity-20">
        <RefreshCcw className="w-8 h-8 animate-spin" />
        <span className="text-[10px] font-mono uppercase tracking-widest">Awaiting Signal Data...</span>
      </div>
    )
  }

  const data = incident || {
    incident_id: "N/A",
    risk_score: 0,
    summary: "No active critical threats detected.",
    affected_records: 0,
    timeline: []
  }

  return (
    <div className="glass-panel-critical relative overflow-hidden h-full">
      {/* Ambient pulse */}
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10 blur-[60px]"
        style={{ background: 'radial-gradient(circle, #FF3B5C 0%, transparent 70%)' }} />

      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,59,92,0.12)', background: 'rgba(255,59,92,0.04)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#FF3B5C]"
            style={{ boxShadow: '0 0 8px #FF3B5C', animation: 'breathe 1.5s ease-in-out infinite' }} />
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#FF3B5C]">ACTIVE INCIDENT</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#FF3B5C]/60">#{data.incident_id}</span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Status */}
        <div>
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Status</div>
          <div className="text-sm font-mono font-bold text-white/80 leading-snug">
            {data.summary}
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.1)' }}>
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Threat Level</div>
            <div className="text-lg font-bold font-mono text-[#FF3B5C]"
              style={{ textShadow: '0 0 12px rgba(255,59,92,0.4)' }}>
              CRITICAL
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,209,255,0.04)', border: '1px solid rgba(0,209,255,0.08)' }}>
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">AI Confidence</div>
            <div className="text-lg font-bold font-mono text-[#00D1FF]"
              style={{ textShadow: '0 0 12px rgba(0,209,255,0.4)' }}>
              96%
            </div>
          </div>
        </div>

        {/* Affected Systems - Extract from timeline if available */}
        <div>
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Primary Vectors</div>
          <div className="space-y-1.5">
            {(data.timeline.length > 0 ? data.timeline.slice(-3) : [
              { module: 'SENTINEL', event: 'Scan initiated', actor: 'System' },
              { module: 'VEIL', event: 'Phishing monitor', actor: 'System' },
              { module: 'IDENTITY', event: 'Auth monitor', actor: 'System' }
            ]).map((sys, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40 truncate pr-4">{sys.actor.split('→')[0].trim()}</span>
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#FF3B5C]/80">
                  {sys.module}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Response actions */}
        <div className="flex gap-2 pt-2">
          {['ISOLATE', 'TERMINATE', 'INVESTIGATE'].map(action => (
            <button key={action} className="flex-1 py-2 rounded-lg text-[9px] font-mono font-bold tracking-wider transition-all"
              style={{
                backgroundColor: action === 'ISOLATE' ? 'rgba(255,59,92,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${action === 'ISOLATE' ? 'rgba(255,59,92,0.25)' : 'rgba(255,255,255,0.06)'}`,
                color: action === 'ISOLATE' ? '#FF3B5C' : 'rgba(255,255,255,0.4)',
              }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
