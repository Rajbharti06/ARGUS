import { useState, useEffect } from 'react'

/* ═══════════════════════════════════════════════
   THREAT SEVERITY PANEL — Animated Breakdown
   ═══════════════════════════════════════════════ */

const SEVERITIES = [
  { key: 'critical', label: 'CRITICAL', color: '#FF3B5C', base: 3 },
  { key: 'high',     label: 'HIGH',     color: '#f97316', base: 8 },
  { key: 'medium',   label: 'MEDIUM',   color: '#eab308', base: 14 },
  { key: 'low',      label: 'LOW',      color: '#22c55e', base: 31 },
]

export default function ThreatSeverityPanel() {
  const [counts, setCounts] = useState(SEVERITIES.map(s => s.base))

  useEffect(() => {
    const t = setInterval(() => {
      setCounts(prev => prev.map((v, i) => {
        const variance = SEVERITIES[i].key === 'critical' ? 1 : SEVERITIES[i].key === 'high' ? 2 : 3
        return Math.max(0, v + Math.floor((Math.random() - 0.4) * variance))
      }))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <div className="glass-panel-glow overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <span className="section-label">Threat Classification</span>
        <span className="text-[9px] font-mono text-white/20">{total} TOTAL</span>
      </div>

      <div className="p-5 space-y-4">
        {SEVERITIES.map((sev, i) => {
          const pct = total > 0 ? (counts[i] / total) * 100 : 0
          return (
            <div key={sev.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full" style={{
                      backgroundColor: sev.color,
                      boxShadow: sev.key === 'critical' ? `0 0 8px ${sev.color}` : `0 0 4px ${sev.color}60`,
                    }} />
                    {sev.key === 'critical' && (
                      <div className="absolute inset-0 w-2 h-2 rounded-full" style={{
                        backgroundColor: sev.color,
                        animation: 'threat-pulse 2s ease-in-out infinite',
                      }} />
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: sev.color }}>
                    {sev.label}
                  </span>
                </div>
                <span className="text-sm font-bold font-mono tabular-nums" style={{ color: sev.color, textShadow: `0 0 8px ${sev.color}30` }}>
                  {counts[i]}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${pct}%`,
                  backgroundColor: sev.color,
                  boxShadow: `0 0 8px ${sev.color}40`,
                  opacity: 0.7,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
