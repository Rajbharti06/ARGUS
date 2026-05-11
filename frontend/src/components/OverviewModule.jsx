import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Activity, Lock, Eye, Terminal, Cpu, Zap, Globe, AlertTriangle, Wifi } from 'lucide-react'
import { Heading, Text, Card, Section, Stat, Badge, StatusDot } from './ui/CyberComponents'
import ArgusCore from './ui/ArgusCore'
import GlobalThreatIntelligence from './ui/LiveSecurityFeed'
import ThreatIntelligencePanel from './ui/ThreatIntelligencePanel'
import ActiveIncidentCard from './ui/ActiveIncidentCard'
import IncidentTimeline from './ui/IncidentTimeline'

/* ═══════════════════════════════════════════════
   ARGUS INTELLIGENCE OVERVIEW — Command Center
   The operating system protecting critical infrastructure
   ═══════════════════════════════════════════════ */

const MODULE_LINKS = [
  { id: 'sentinel', label: 'SENTINEL', desc: 'Real-time telemetry intelligence',    icon: Shield,   color: '#f87171' },
  { id: 'veil',     label: 'VEIL',     desc: 'AI phishing cognition engine',       icon: Lock,     color: '#c084fc' },
  { id: 'identity', label: 'IDENTITY', desc: 'Behavioral trust analysis',          icon: Eye,      color: '#60a5fa' },
  { id: 'oracle',   label: 'ORACLE',   desc: 'Threat correlation intelligence',     icon: Terminal, color: '#fbbf24' },
  { id: 'skynet',   label: 'SKYNET',   desc: 'Cloud infrastructure visibility',     icon: Cpu,      color: '#4ade80' },
  { id: 'response', label: 'RESPONSE', desc: 'Autonomous containment orchestration',icon: Zap,      color: '#fb923c' },
]

function useLive(base, variance = 3, ms = 3800) {
  const [v, setV] = useState(base)
  useEffect(() => {
    const t = setInterval(() => setV(x => Math.max(0, x + Math.floor((Math.random() - 0.3) * variance))), ms)
    return () => clearInterval(t)
  }, [])
  return v
}

const fmt = n => n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + 'M' : n >= 1_000 ? n.toLocaleString() : String(n)

function useSystemTelemetry() {
  const [sys, setSys] = useState(null)
  const [net, setNet] = useState(null)
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const [sr, nr] = await Promise.all([
          fetch('/api/intelligence/system'),
          fetch('/api/intelligence/network'),
        ])
        setSys(await sr.json())
        setNet(await nr.json())
      } catch {}
    }
    fetch_()
    const t = setInterval(fetch_, 8000)
    return () => clearInterval(t)
  }, [])
  return { sys, net }
}

const KILL_CHAIN = [
  { label: 'PHISHING DELIVERY',        icon: 'T1566', color: '#a85c5c' },
  { label: 'CREDENTIAL COMPROMISE',    icon: 'T1078', color: '#b8825c' },
  { label: 'LATERAL MOVEMENT',         icon: 'T1021', color: '#a68b4b' },
  { label: 'CLOUD DATA ACCESS',        icon: 'T1530', color: '#b0a080' },
  { label: 'DATA EXFILTRATION ATTACK', icon: 'T1041', color: '#a85c5c' },
]

export function OverviewModule() {
  const streams   = useLive(18421, 8, 3200)
  const signals   = useLive(2400847, 200, 2700)
  const blocked   = useLive(312, 2, 5500)
  const corrs     = useLive(4892, 15, 2100)
  const { sys, net } = useSystemTelemetry()

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ─── FEATURED THREAT ACTOR + CORE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Featured threat actor */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(255,59,92,0.06), transparent 70%)' }} />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[8px] font-bold text-red-400/60 uppercase tracking-widest">Featured Threat Actor</span>
          </div>
          <div>
            <div className="text-4xl font-extrabold font-mono text-red-400 leading-none mb-1"
              style={{ textShadow: '0 0 30px rgba(255,59,92,0.4)' }}>
              ShinyHunters
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-900/40 bg-red-950/20 text-red-400 uppercase">CRIME</span>
              <span className="text-[8px] text-white/30">France / Unknown</span>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold font-mono text-red-400/80">47</div>
              <div className="text-[8px] text-white/25 uppercase tracking-widest">Days Since Campaign</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[8px] text-white/20 mb-1 uppercase tracking-widest">Targets</div>
              <div className="text-[9px] font-mono text-white/40">Universities · Cloud · SaaS</div>
            </div>
          </div>
          <p className="mt-3 text-[9px] font-mono text-white/30 leading-relaxed border-t border-white/5 pt-3">
            Prolific group known for large-scale data breaches. 500M+ records compromised across education and cloud sectors.
          </p>
        </div>

        {/* ARGUS AI CORE */}
        <div className="lg:col-span-2">
          <ArgusCore />
        </div>
      </div>

      {/* ─── LIVE INTELLIGENCE COUNTERS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Threat Streams" value={fmt(streams)} sub="monitored endpoints" icon={<Activity className="w-4 h-4" />} trend={12} />
        <Stat label="Identity Signals" value={fmt(signals)} sub="behavioral events" icon={<Eye className="w-4 h-4" />} trend={8} />
        <Stat label="Threats Blocked" value={fmt(blocked)} sub="last 24 hours" icon={<Shield className="w-4 h-4" />} trend={-4} />
        <Stat label="AI Detections" value={fmt(corrs)} sub="active correlations" icon={<Zap className="w-4 h-4" />} trend={15} />
      </div>

      {/* ─── PRIMARY GRID: Global Intel + Incident ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlobalThreatIntelligence />
        </div>
        <div className="lg:col-span-1">
          <ActiveIncidentCard />
        </div>
      </div>

      {/* ─── SECONDARY GRID: Knowledge Base + System Health ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatIntelligencePanel />
        <IncidentTimeline />
      </div>

      {/* ─── REAL SYSTEM STATUS ─── */}
      {sys && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span className="section-label">Local System Telemetry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-nominal animate-pulse-slow" />
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Live · {sys.os}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* CPU */}
            <div className="col-span-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">CPU</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${sys.cpu_usage > 80 ? 'text-red-400' : sys.cpu_usage > 50 ? 'text-yellow-400' : 'text-nominal'}`}>
                {sys.cpu_usage}%
              </div>
            </div>
            {/* Memory */}
            <div className="col-span-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">RAM</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${sys.memory_usage > 85 ? 'text-red-400' : sys.memory_usage > 70 ? 'text-yellow-400' : 'text-primary'}`}>
                {sys.memory_usage}%
              </div>
            </div>
            {/* Processes */}
            <div className="col-span-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Processes</div>
              <div className="text-lg font-bold font-mono tabular-nums text-white/60">{sys.active_processes}</div>
            </div>
            {/* Network */}
            {net && (
              <div className="col-span-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Connections</div>
                <div className="text-lg font-bold font-mono tabular-nums text-primary">{net.total_established}</div>
              </div>
            )}
            {/* Network I/O */}
            <div className="col-span-1 md:col-span-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Network I/O</div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-nominal">↑ {sys.bytes_sent_mb?.toFixed(1)} MB</span>
                <span className="text-primary">↓ {sys.bytes_recv_mb?.toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          {/* Suspicious processes alert */}
          {sys.suspicious_processes?.length > 0 && (
            <div className="mt-3 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-[10px] font-mono text-red-400/80">
                {sys.suspicious_processes.length} flagged process{sys.suspicious_processes.length > 1 ? 'es' : ''} detected — {sys.suspicious_processes.map(p => p.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── ATTACK KILL CHAIN STRIP ─── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="section-label">Active Attack Vector — INC-2024-0441</span>
          <span className="ml-auto text-[8px] font-bold text-red-400/60 uppercase tracking-widest px-2 py-0.5 rounded border border-red-900/30 bg-red-950/15">CRITICAL</span>
        </div>
        <div className="flex items-center gap-2">
          {KILL_CHAIN.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 flex-1">
              <div className="flex-1 flex flex-col items-center gap-1.5 py-2 px-2 rounded border transition-all"
                style={{
                  borderColor: i <= 2 ? `${step.color}30` : 'rgba(255,255,255,0.04)',
                  background: i <= 2 ? `${step.color}08` : 'transparent',
                }}>
                <span className="text-base">{step.icon}</span>
                <span className="text-[7px] font-bold uppercase tracking-widest text-center leading-tight"
                  style={{ color: i <= 2 ? step.color : 'rgba(255,255,255,0.2)' }}>
                  {step.label}
                </span>
                {i <= 2 && <div className="w-1.5 h-1.5 rounded-full" style={{ background: step.color, boxShadow: `0 0 6px ${step.color}` }} />}
              </div>
              {i < KILL_CHAIN.length - 1 && (
                <div className="w-4 h-px flex-shrink-0" style={{ background: i < 2 ? 'rgba(255,59,92,0.3)' : 'rgba(255,255,255,0.04)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODULE QUICK-ACCESS ─── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <Heading size="xs">Defense Modules</Heading>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {MODULE_LINKS.map(mod => {
            const Icon = mod.icon
            return (
              <Card key={mod.id} className="p-4 group cursor-pointer hover:bg-primary/[0.02]">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl mb-3 transition-transform group-hover:scale-110 bg-white/[0.03]" style={{ color: mod.color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Heading size="sm" className="mb-1">{mod.label}</Heading>
                  <Text variant="muted" className="text-[10px] leading-tight">{mod.desc}</Text>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

