import { CircularProgress } from './CyberComponents'

/* ═══════════════════════════════════════════════
   TRUST SCORE PANEL — Behavioral Intelligence
   Circular progress visualizations with glow
   ═══════════════════════════════════════════════ */

const TRUST_METRICS = [
  { label: 'User Trust',    value: 87, color: '#00D1FF', sub: 'behavioral baseline' },
  { label: 'Device Trust',  value: 94, color: '#4ade80', sub: 'endpoint posture' },
  { label: 'Network Trust', value: 72, color: '#FFB547', sub: 'traffic analysis' },
]

export default function TrustScorePanel() {
  return (
    <div className="glass-panel-glow overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <span className="section-label">Trust Intelligence</span>
        <span className="text-[9px] font-mono text-white/20">ZERO TRUST</span>
      </div>

      <div className="p-5">
        {/* Primary Trust Score */}
        <div className="flex justify-center mb-5">
          <CircularProgress
            value={87}
            size={120}
            strokeWidth={4}
            color="#00D1FF"
            label="87"
            sublabel="GLOBAL TRUST"
          />
        </div>

        {/* Sub-scores */}
        <div className="flex items-center justify-around">
          {TRUST_METRICS.map(m => (
            <div key={m.label} className="flex flex-col items-center gap-2">
              <CircularProgress
                value={m.value}
                size={56}
                strokeWidth={2.5}
                color={m.color}
                label={String(m.value)}
                sublabel=""
              />
              <div className="text-center">
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{m.label}</div>
                <div className="text-[8px] font-mono text-white/15 mt-0.5">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Anomaly indicators */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Behavioral Anomalies</div>
          <div className="space-y-1.5">
            {[
              { label: 'Geo-velocity violations', count: 2, severity: 'high' },
              { label: 'Off-hours access patterns', count: 5, severity: 'medium' },
              { label: 'Privilege escalation attempts', count: 1, severity: 'critical' },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{
                    backgroundColor: a.severity === 'critical' ? '#FF3B5C' : a.severity === 'high' ? '#f97316' : '#eab308',
                  }} />
                  <span className="text-[10px] font-mono text-white/35">{a.label}</span>
                </div>
                <span className="text-[10px] font-mono font-bold tabular-nums" style={{
                  color: a.severity === 'critical' ? '#FF3B5C' : a.severity === 'high' ? '#f97316' : '#eab308',
                }}>{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
