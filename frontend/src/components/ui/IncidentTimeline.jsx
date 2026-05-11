import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, Zap, Activity, Clock, RefreshCcw } from 'lucide-react'
import { Badge, Text, Heading } from './CyberComponents'
import { cn } from '../../utils/cn'

/* ═══════════════════════════════════════════════
   CINEMATIC INCIDENT TIMELINE — Attack Chain
   The "holy shit" feature — phased attack visualization
   ═══════════════════════════════════════════════ */

export default function IncidentTimeline() {
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTimeline = async () => {
    try {
      const response = await fetch('/api/argus/oracle/timeline')
      const data = await response.json()
      setIncident(data)
      setLoading(false)
    } catch (error) {
      console.error("Timeline correlation failure:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimeline()
  }, [])

  return (
    <div className="glass-panel flex flex-col h-[340px]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          <Activity className="w-3.5 h-3.5 text-[#FF3B5C]" />
          <span className="section-label">Incident Reconstruction</span>
        </div>
        <div className="flex items-center gap-3">
          {incident?.ai_powered && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-2.5 h-2.5 text-primary" />
              <span className="text-[8px] font-bold text-primary uppercase tracking-widest">AI Correlated</span>
            </div>
          )}
          <button 
            onClick={() => { setLoading(true); fetchTimeline(); }}
            className="p-1 hover:bg-white/5 rounded transition-colors"
          >
            <RefreshCcw className={cn("w-3 h-3 text-white/20", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20">
            <RefreshCcw className="w-6 h-6 animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Reconstructing Attack Chain...</span>
          </div>
        ) : incident ? (
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-6">
              {incident.timeline.map((step, i) => (
                <div key={i} className="relative pl-8">
                  {/* Dot */}
                  <div className={cn(
                    "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-background flex items-center justify-center z-10",
                    step.severity === 'critical' ? 'bg-critical' : 
                    step.severity === 'high' ? 'bg-warning' : 'bg-primary'
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={step.severity === 'critical' ? 'critical' : 'warning'} className="text-[7px]">
                          {step.module}
                        </Badge>
                        <span className="text-[10px] font-bold text-white/80">{step.event}</span>
                      </div>
                      <span className="text-[9px] font-mono text-white/20">{step.time}</span>
                    </div>
                    <p className="text-[9px] text-white/40 italic leading-relaxed">
                      {step.actor}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Card */}
            <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-primary" />
                <Heading size="xs">Executive Briefing</Heading>
              </div>
              <p className="text-[10px] text-white/60 leading-relaxed">
                {incident.summary}
              </p>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <div className="text-[7px] font-mono text-white/20 uppercase">Records</div>
                    <div className="text-[10px] font-bold text-white/70">{incident.affected_records.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-mono text-white/20 uppercase">Dwell Time</div>
                    <div className="text-[10px] font-bold text-white/70">{incident.dwell_time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7px] font-mono text-white/20 uppercase">Incident ID</div>
                  <div className="text-[10px] font-bold text-critical">{incident.incident_id}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-white/10 text-xs font-mono uppercase tracking-widest">
            No active incident correlations detected.
          </div>
        )}
      </div>
    </div>
  )
}
