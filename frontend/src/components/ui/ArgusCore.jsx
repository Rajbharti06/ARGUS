import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Activity, Database, Zap } from 'lucide-react'

/* ═══════════════════════════════════════════════
   ARGUS AI CORE — Signature Neural Visualization
   The heart of the intelligence operating system
   ═══════════════════════════════════════════════ */

export default function ArgusCore() {
  const [telemetry, setTelemetry] = useState({
    cpu_usage: 0,
    memory_usage: 0,
    active_processes: 0,
    suspicious_processes: []
  })
  const [cognition, setCognition] = useState(94.7)

  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/intelligence/system')
      const data = await response.json()
      setTelemetry(data)
      
      // Dynamic cognition score based on "load" and "suspicious" counts
      const loadFactor = (data.cpu_usage + data.memory_usage) / 200
      const suspFactor = data.suspicious_processes.length * 2
      const newCognition = Math.min(99.9, Math.max(85, 99 - (loadFactor * 10) - suspFactor))
      setCognition(+newCognition.toFixed(1))
    } catch (error) {
      console.error("Telemetry link failure:", error)
    }
  }

  useEffect(() => {
    fetchTelemetry()
    const t = setInterval(fetchTelemetry, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="glass-panel-accent p-6 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -left-20 -top-20 w-60 h-60 rounded-full opacity-20 blur-[80px]"
        style={{ background: 'radial-gradient(circle, rgba(139,174,180,0.45) 0%, transparent 70%)' }} />

      {/* Neural Ring Visualization */}
      <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="absolute inset-0">
          <g style={{ transformOrigin: '70px 70px', animation: 'ring-rotate 20s linear infinite' }}>
            <circle cx="70" cy="70" r="65" fill="none" stroke="rgba(139,174,180,0.12)" strokeWidth="1" />
            <circle cx="70" cy="70" r="65" fill="none" stroke="rgba(139,174,180,0.9)" strokeWidth="1.5"
              strokeDasharray="8 12 4 16 20 8" opacity="0.4" />
          </g>
          <g style={{ transformOrigin: '70px 70px', animation: 'ring-rotate-reverse 15s linear infinite' }}>
            <circle cx="70" cy="70" r="50" fill="none" stroke="rgba(139,174,180,0.08)" strokeWidth="1" />
          </g>
          <circle cx="70" cy="70" r="18" fill="url(#coreGradient)" opacity="0.8" />
          <circle cx="70" cy="70" r="3" fill="rgba(139,174,180,1)" />
          <defs>
            <radialGradient id="coreGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(139,174,180,0.5)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgba(139,174,180,0.4)" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Status Text & Real Telemetry */}
      <div className="flex-1 min-w-0 relative z-10 w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-nominal animate-pulse-slow" />
              <span className="text-primary text-xs font-mono font-bold tracking-[0.32em]">
                CORRELATION CORE NOMINAL
              </span>
            </div>
            <div className="text-white/20 text-[10px] font-mono tracking-wider">
              Autonomous Intelligence Engine — Local Telemetry Synchronized
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[9px] text-white/20 font-mono uppercase tracking-widest mb-1">Cognition State</div>
            <div className="text-xl font-bold font-mono text-primary tabular-nums">
              {cognition}%
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TelemetryItem 
            icon={<Cpu className="w-3.5 h-3.5" />} 
            label="CPU Compute" 
            value={`${telemetry.cpu_usage}%`} 
            color={telemetry.cpu_usage > 70 ? 'var(--accent-critical)' : 'var(--accent-cyan)'}
          />
          <TelemetryItem 
            icon={<Database className="w-3.5 h-3.5" />} 
            label="Memory Load" 
            value={`${telemetry.memory_usage}%`} 
            color={telemetry.memory_usage > 80 ? 'var(--accent-critical)' : 'var(--accent-cyan)'}
          />
          <TelemetryItem 
            icon={<Activity className="w-3.5 h-3.5" />} 
            label="Active Procs" 
            value={telemetry.active_processes} 
            color="var(--accent-cyan)"
          />
          <TelemetryItem 
            icon={<Zap className="w-3.5 h-3.5" />} 
            label="Anomalies" 
            value={telemetry.suspicious_processes.length} 
            color={telemetry.suspicious_processes.length > 0 ? 'var(--accent-critical)' : 'var(--semantic-nominal)'}
          />
        </div>
        
        {/* Suspicious Process Alert */}
        {telemetry.suspicious_processes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-2 bg-[#FF3B5C]/5 border border-[#FF3B5C]/20 rounded flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B5C] animate-pulse" />
            <span className="text-[9px] font-mono text-[#FF3B5C] uppercase tracking-widest font-bold">
              Warning: Suspicious process detected — {telemetry.suspicious_processes[0].name} (PID: {telemetry.suspicious_processes[0].pid})
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function TelemetryItem({ icon, label, value, color }) {
  return (
    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
      <div className="flex items-center gap-2 mb-1.5 opacity-40" style={{ color }}>
        {icon}
        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white/40">{label}</span>
      </div>
      <div className="text-sm font-bold font-mono tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  )
}
