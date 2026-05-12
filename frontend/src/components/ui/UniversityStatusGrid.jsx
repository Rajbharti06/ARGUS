import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, Network, Mail, Cloud, Shield,
  Database, Lock, Wifi, Server, GraduationCap, Building2,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   UNIVERSITY CAMPUS SECURITY MATRIX
   Monitors institutional systems critical to university ops
   ═══════════════════════════════════════════════════════ */

const SYSTEMS = [
  {
    id: 'lms',
    label: 'LMS / Canvas',
    sub: 'Learning Management System',
    icon: BookOpen,
    status: 'NOMINAL',
    risk: 'LOW',
    detail: 'Continuous phishing & SSO monitoring active',
  },
  {
    id: 'student-portal',
    label: 'Student Portal',
    sub: 'Identity & Authentication',
    icon: GraduationCap,
    status: 'ELEVATED',
    risk: 'MEDIUM',
    detail: '3 credential anomalies detected this session',
  },
  {
    id: 'research-net',
    label: 'Research Network',
    sub: 'Lab & HPC Infrastructure',
    icon: Network,
    status: 'NOMINAL',
    risk: 'LOW',
    detail: 'All research nodes secured · IPsec verified',
  },
  {
    id: 'faculty-email',
    label: 'Faculty Email',
    sub: 'SMTP / IMAP Gateway',
    icon: Mail,
    status: 'ALERT',
    risk: 'HIGH',
    detail: '14 spear-phishing attempts blocked (24h)',
  },
  {
    id: 'cloud-infra',
    label: 'Cloud Infrastructure',
    sub: 'AWS · Azure · GCP',
    icon: Cloud,
    status: 'NOMINAL',
    risk: 'LOW',
    detail: 'No exposed buckets · IAM audit passed',
  },
  {
    id: 'iam',
    label: 'Identity & Access',
    sub: 'SSO / LDAP / MFA',
    icon: Lock,
    status: 'NOMINAL',
    risk: 'LOW',
    detail: 'MFA enforcement: 97.4% of accounts',
  },
  {
    id: 'library-db',
    label: 'Research Databases',
    sub: 'JSTOR · PubMed · IEEE',
    icon: Database,
    status: 'NOMINAL',
    risk: 'LOW',
    detail: 'IP-range validation · rate limiting active',
  },
  {
    id: 'admin-systems',
    label: 'Administrative',
    sub: 'ERP · Finance · HR',
    icon: Building2,
    status: 'NOMINAL',
    risk: 'LOW',
    detail: 'Zero-trust policy enforced',
  },
]

const RISK_CONFIG = {
  LOW:    { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.18)',   dot: 'bg-green-500',  label: 'SECURED' },
  MEDIUM: { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.18)',   dot: 'bg-amber-500',  label: 'MONITOR' },
  HIGH:   { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   border: 'rgba(220,38,38,0.22)',   dot: 'bg-red-500',    label: 'ALERT' },
  CRITICAL:{ color: '#FF3B5C', bg: 'rgba(255,59,92,0.08)', border: 'rgba(255,59,92,0.25)',   dot: 'bg-rose-500',   label: 'CRITICAL' },
}

function SystemCard({ sys, delay = 0 }) {
  const [hovered, setHovered] = useState(false)
  const cfg = RISK_CONFIG[sys.risk]
  const Icon = sys.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-lg p-4 transition-all duration-200 relative overflow-hidden cursor-default"
      style={{
        background: hovered ? cfg.bg : 'rgba(255,255,255,0.018)',
        border: `1px solid ${hovered ? cfg.border : 'rgba(255,255,255,0.05)'}`,
        boxShadow: hovered ? `0 0 20px ${cfg.bg}` : 'none',
      }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
        style={{ borderTop: `1.5px solid ${cfg.color}`, borderLeft: `1.5px solid ${cfg.color}`, borderRadius: '0.375rem 0 0 0', opacity: hovered ? 0.7 : 0.3 }} />

      {/* Icon + label row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md" style={{ background: cfg.bg, color: cfg.color }}>
            <Icon className="w-3 h-3" />
          </div>
          <div>
            <div className="text-[0.65rem] font-bold text-white/80 leading-tight">{sys.label}</div>
            <div className="text-[0.48rem] font-mono text-white/25 uppercase tracking-wider">{sys.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${sys.risk !== 'LOW' ? 'animate-pulse' : ''}`} />
          <span className="text-[0.48rem] font-mono font-bold uppercase tracking-wider"
            style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* Detail */}
      <div className="text-[0.5rem] font-mono leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
        {sys.detail}
      </div>
    </motion.div>
  )
}

export default function UniversityStatusGrid() {
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setLastUpdate(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const alertCount  = SYSTEMS.filter(s => s.risk === 'HIGH' || s.risk === 'CRITICAL').length
  const monitorCount = SYSTEMS.filter(s => s.risk === 'MEDIUM').length
  const nominalCount = SYSTEMS.filter(s => s.risk === 'LOW').length

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="flex items-center gap-2.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.4)',
          }}>
            Campus Security Matrix
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Summary badges */}
          {alertCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', fontWeight: 700, color: '#DC2626' }}>
                {alertCount} ALERT{alertCount > 1 ? 'S' : ''}
              </span>
            </div>
          )}
          {monitorCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', fontWeight: 700, color: '#D97706' }}>
                {monitorCount} ELEVATED
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', fontWeight: 700, color: '#16A34A' }}>
              {nominalCount} NOMINAL
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {SYSTEMS.map((sys, i) => (
          <SystemCard key={sys.id} sys={sys} delay={i * 0.05} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.1)' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.44rem',
          color: 'rgba(255,255,255,0.15)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
        }}>
          ARGUS Institutional Coverage · 8 Critical Systems Monitored
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.44rem',
          color: 'rgba(255,255,255,0.12)',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
        }}>
          Last sync: {lastUpdate.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </div>
  )
}
