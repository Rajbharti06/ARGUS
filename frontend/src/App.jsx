import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Activity, Globe, Lock, Zap, Terminal,
  Cpu, Eye, Search, Bell, User, Menu, ChevronRight, Brain,
  Network, Target,
} from 'lucide-react'
import { OverviewModule } from './components/OverviewModule'
import { CommandBar } from './components/ui/CyberComponents'
import SentinelModule from './components/SentinelModule'
import VeilModule from './components/VeilModule'
import IdentityModule from './components/IdentityModule'
import OracleModule from './components/OracleModule'
import SkynetModule from './components/SkynetModule'
import ResponseModule from './components/ResponseModule'
import ThreatIntelModule from './components/ThreatIntelModule'
import IEMModule from './components/IEMModule'
import UniversityShieldModule from './components/UniversityShieldModule'
import NexusModule from './components/NexusModule'
import PhantomModule from './components/PhantomModule'
import BreachIQModule from './components/BreachIQModule'
import HuntModule from './components/HuntModule'
import MITREModule from './components/MITREModule'
import { cn } from './utils/cn'

/* ─── Constants ─── */

const MODULES = [
  { id: 'overview',     label: 'Dashboard',   desc: 'System Intelligence' },
  { id: 'sentinel',     label: 'Sentinel',    desc: 'Real-time Monitoring' },
  { id: 'veil',         label: 'Veil',        desc: 'Email Protection' },
  { id: 'identity',     label: 'Identity',    desc: 'Access Control' },
  { id: 'oracle',       label: 'Oracle',      desc: 'Attack Correlation' },
  { id: 'skynet',       label: 'Skynet',      desc: 'Cloud Infrastructure' },
  { id: 'response',     label: 'Response',    desc: 'Incident Response' },
  { id: 'threat-intel', label: 'Intel',       desc: 'Threat Intelligence' },
  { id: 'iem',          label: 'IEM',         desc: 'Identity Exploitation Model' },
  { id: 'university',   label: 'Uni Shield',  desc: 'University Threat Intelligence' },
  { id: 'nexus',        label: 'NEXUS',       desc: 'Entity Graph & Agent Swarm' },
  { id: 'phantom',      label: 'PHANTOM',     desc: 'Deception Network & Honeypots' },
  { id: 'breach-iq',    label: 'BREACH-IQ',   desc: 'Breach Probability Intelligence' },
  { id: 'hunt',         label: 'HUNT',        desc: 'Autonomous Threat Hunting' },
  { id: 'mitre',        label: 'ATT&CK',      desc: 'MITRE ATT&CK Matrix' },
]

const NAV_GROUPS = [
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'overview',     label: 'Dashboard',  icon: Activity },
      { id: 'threat-intel', label: 'Intel',       icon: Globe },
      { id: 'iem',          label: 'IEM',          icon: Brain },
      { id: 'university',   label: 'Uni Shield',   icon: Shield },
    ],
  },
  {
    label: 'SURVEILLANCE',
    items: [
      { id: 'sentinel', label: 'Sentinel', icon: Shield },
      { id: 'identity', label: 'Identity', icon: Eye },
    ],
  },
  {
    label: 'DEFENSE',
    items: [
      { id: 'veil',     label: 'Veil',     icon: Lock },
      { id: 'response', label: 'Response', icon: Zap },
    ],
  },
  {
    label: 'INFRASTRUCTURE',
    items: [
      { id: 'oracle', label: 'Oracle', icon: Terminal },
      { id: 'skynet', label: 'Skynet', icon: Cpu },
    ],
  },
  {
    label: 'ADVANCED',
    items: [
      { id: 'nexus',     label: 'NEXUS',     icon: Network },
      { id: 'phantom',   label: 'PHANTOM',   icon: Eye },
      { id: 'breach-iq', label: 'BREACH-IQ', icon: Brain },
      { id: 'hunt',      label: 'HUNT',      icon: Search },
      { id: 'mitre',     label: 'ATT&CK',    icon: Target },
    ],
  },
]

/* Static ticker fallback (used before API data loads) */
const STATIC_TICKER = [
  { label: 'THREAT STREAMS', value: '18,421', color: 'rgba(200,205,214,0.55)' },
  { label: 'EVENTS/SEC',     value: '4,892',  color: 'rgba(200,205,214,0.55)' },
  { label: 'BLOCKED TODAY',  value: '312',    color: 'rgba(255,107,107,0.65)' },
  { label: 'AI DETECTIONS',  value: '2.40M',  color: 'rgba(200,205,214,0.55)' },
  { label: 'TRUST INDEX',    value: '98.2%',  color: 'rgba(107,158,122,0.75)' },
  { label: 'CISA ALERTS',    value: '7 ACTIVE', color: 'rgba(255,173,92,0.7)' },
  { label: 'PHISH ATTEMPTS', value: '891',    color: 'rgba(255,173,92,0.7)' },
  { label: 'CVEs MONITORED', value: '1,247',  color: 'rgba(200,205,214,0.55)' },
  { label: 'AI ENGINE',      value: 'OPERATIONAL', color: 'rgba(107,158,122,0.75)' },
  { label: 'NETWORK',        value: 'SECURE-TLS',  color: 'rgba(107,158,122,0.75)' },
  { label: 'NODE',           value: 'ALPHA-7 ONLINE', color: 'rgba(107,158,122,0.75)' },
  { label: 'ENCRYPTION',     value: 'AES-256 ACTIVE', color: 'rgba(107,158,122,0.75)' },
]

/* ─── Classification Banner ─── */
function ClassificationBanner({ aiTier }) {
  return (
    <div
      className="classification-banner h-7 flex items-center justify-between px-6 z-[60] flex-shrink-0"
      style={{ background: '#020204', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="scan-beam" />

      <div className="flex items-center gap-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.43rem',
            fontWeight: 800,
            color: '#6b9e7a',
            textTransform: 'uppercase',
            letterSpacing: '0.24em',
            border: '1px solid rgba(107,158,122,0.25)',
            background: 'rgba(107,158,122,0.05)',
            padding: '1px 8px',
            borderRadius: '2px',
          }}>
            UNCLASSIFIED
          </span>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.43rem',
          color: 'rgba(255,255,255,0.15)',
          textTransform: 'uppercase',
          letterSpacing: '0.26em',
        }}>
          ARGUS v6.0 — PALANTIR-CLASS AUTONOMOUS CYBER DEFENSE PLATFORM · 15 MODULES · 32 AGENTS
        </span>
      </div>

      <div className="flex items-center gap-5 relative z-10" style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.43rem',
        color: 'rgba(255,255,255,0.18)',
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
      }}>
        {aiTier && (
          <span style={{
            color: aiTier === 'ELITE' ? '#c8a96e' : aiTier === 'ENTERPRISE' ? 'rgba(200,205,214,0.6)' : 'rgba(123,163,196,0.6)',
            border: `1px solid ${aiTier === 'ELITE' ? 'rgba(200,169,110,0.25)' : 'rgba(255,255,255,0.1)'}`,
            background: aiTier === 'ELITE' ? 'rgba(200,169,110,0.05)' : 'transparent',
            padding: '1px 7px',
            borderRadius: '2px',
          }}>
            AI: {aiTier}
          </span>
        )}
        <span>SESSION: ARG-26-Δ-5821</span>
        <span style={{ opacity: 0.25 }}>·</span>
        <span>NODE: ALPHA-7/EDU</span>
        <span style={{ opacity: 0.25 }}>·</span>
        <span>CHANNEL: AES-256</span>
      </div>
    </div>
  )
}

/* ─── Live Telemetry Ticker — connected to real backend stats ─── */
function TelemetryTicker() {
  const [tickerItems, setTickerItems] = useState(STATIC_TICKER)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch('/api/argus/sentinel/stats')
        if (!r.ok) return
        const s = await r.json()
        setTickerItems([
          { label: 'THREATS BLOCKED',   value: s.threats_blocked?.toLocaleString() || '—', color: 'rgba(255,107,107,0.65)' },
          { label: 'ACTIVE SESSIONS',   value: s.active_sessions?.toLocaleString() || '—', color: 'rgba(200,205,214,0.55)' },
          { label: 'ENDPOINTS',         value: s.endpoints_monitored?.toLocaleString() || '—', color: 'rgba(200,205,214,0.55)' },
          { label: 'PHISH BLOCKED',     value: s.phishing_blocked?.toLocaleString() || '—', color: 'rgba(255,173,92,0.7)' },
          { label: 'ANOMALIES',         value: s.anomalies_detected?.toLocaleString() || '—', color: 'rgba(255,173,92,0.7)' },
          { label: 'GLOBAL RISK',       value: `${s.global_risk_score || 0}%`, color: s.global_risk_score > 60 ? 'rgba(255,107,107,0.65)' : 'rgba(255,173,92,0.7)' },
          { label: 'AI ENGINE',         value: 'OPERATIONAL',    color: 'rgba(107,158,122,0.75)' },
          { label: 'NETWORK',           value: 'SECURE-TLS',     color: 'rgba(107,158,122,0.75)' },
          { label: 'ENCRYPTION',        value: 'AES-256 ACTIVE', color: 'rgba(107,158,122,0.75)' },
          { label: 'NODE',              value: 'ALPHA-7 ONLINE', color: 'rgba(107,158,122,0.75)' },
          { label: 'CVEs MONITORED',    value: '1,247+',         color: 'rgba(200,205,214,0.55)' },
          { label: 'CISA ALERTS',       value: '7 ACTIVE',       color: 'rgba(255,173,92,0.7)' },
        ])
      } catch { /* use static fallback */ }
    }
    fetchStats()
    const t = setInterval(fetchStats, 30000)
    return () => clearInterval(t)
  }, [])

  const items = [...tickerItems, ...tickerItems]

  return (
    <div
      className="flex-shrink-0 overflow-hidden relative"
      style={{ background: '#030406', borderBottom: '1px solid rgba(255,255,255,0.04)', height: '24px' }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #030406, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #030406, transparent)' }} />

      <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 z-20 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.42rem',
            fontWeight: 800,
            color: 'rgba(200,205,214,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.24em',
          }}>LIVE</span>
        </div>
      </div>

      <div className="flex items-center h-full" style={{ paddingLeft: '60px', overflow: 'hidden' }}>
        <div className="ticker-track">
          {items.map((item, i) => (
            <div key={i} className="flex items-center flex-shrink-0"
              style={{ borderRight: '1px solid rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 px-4">
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.42rem',
                  color: 'rgba(255,255,255,0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.48rem',
                  fontWeight: 700,
                  color: item.color,
                  letterSpacing: '0.06em',
                }}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Nav Item ─── */
function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: collapsed ? 0 : 2 }}
      className="group relative flex items-center gap-3 mx-2 mb-0.5 cursor-pointer rounded-md transition-all duration-150"
      style={{
        padding: '8px 11px',
        paddingLeft: active ? '10px' : '11px',
        borderLeft: active ? '2px solid rgba(255,255,255,0.55)' : '2px solid transparent',
        background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.35)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.62)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
        }
      }}
    >
      <div className="flex-shrink-0 transition-colors"
        style={{ color: active ? 'rgba(255,255,255,0.85)' : 'inherit' }}>
        {icon}
      </div>

      {!collapsed && (
        <span className="text-sm font-medium truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
          {label}
        </span>
      )}

      {active && !collapsed && (
        <div className="ml-auto w-0.5 h-3.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.45)' }} />
      )}

      {collapsed && (
        <div
          className="absolute left-full ml-2.5 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-[60] whitespace-nowrap pointer-events-none"
          style={{
            background: '#0a0b0f',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.75)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
          }}
        >
          {label}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Main App ─── */
export default function App() {
  const [active, setActive] = useState('overview')
  const [time, setTime] = useState(new Date())
  const [toasts, setToasts] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiTier, setAiTier] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch AI provider status for classification banner
  useEffect(() => {
    fetch('/api/argus/ai-status')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAiTier(d.intelligence_tier) })
      .catch(() => {})
  }, [])

  const addToast = (msg) => {
    const id = Date.now()
    setToasts(prev => [{ id, msg }, ...prev].slice(0, 3))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }

  const activeModule = MODULES.find(m => m.id === active)

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: '#050507' }}>

      {/* ─── CLASSIFICATION BANNER ─── */}
      <ClassificationBanner aiTier={aiTier} />

      {/* ─── TOAST NOTIFICATIONS ─── */}
      <div className="fixed top-8 right-6 z-[100] space-y-2.5 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
              className="flex items-start gap-3 px-4 py-3 rounded-lg max-w-xs"
              style={{
                background: '#0a0b0f',
                border: '1px solid rgba(255,68,68,0.2)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.8)',
              }}
            >
              <div className="p-1.5 rounded-md flex-shrink-0"
                style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.15)' }}>
                <Zap className="w-3.5 h-3.5" style={{ color: '#ff6b6b' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', fontWeight: 800, color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '4px' }}>
                  SYSTEM ALERT
                </div>
                <div className="text-xs leading-snug" style={{ color: 'rgba(200,205,214,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem' }}>{t.msg}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══════════ SIDEBAR ══════════ */}
        <aside
          className={cn('flex flex-col flex-shrink-0 z-50 transition-all duration-300 relative', sidebarOpen ? 'w-64' : 'w-16')}
          style={{ background: '#07080c', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Threat level strip */}
          <div className="absolute left-0 top-0 bottom-0 w-px z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(107,158,122,0.6) 0%, rgba(200,169,110,0.4) 55%, rgba(255,68,68,0.5) 100%)' }} />

          {/* Logo / Brand */}
          <div
            className={cn('flex items-center flex-shrink-0', sidebarOpen ? 'h-14 px-5 gap-3' : 'h-14 justify-center')}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center relative"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Shield className="w-4 h-4" style={{ color: 'rgba(200,205,214,0.8)' }} />
                <div className="absolute inset-0 rounded-lg animate-gotham-breathe"
                  style={{ background: 'rgba(255,255,255,0.02)' }} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#07080c] animate-pulse" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="font-bold tracking-tight text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.08em' }}>ARGUS</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.4rem',
                  color: 'rgba(255,255,255,0.22)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                }}>
                  Defense Intelligence v6.0
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-3">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label} className={cn(gi > 0 && 'mt-2 pt-2')}
                style={gi > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}>
                {sidebarOpen && (
                  <div className="px-5 mb-1" style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.38rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.28em',
                    color: 'rgba(255,255,255,0.14)',
                    paddingTop: gi > 0 ? '8px' : '0',
                  }}>
                    {group.label}
                  </div>
                )}
                {group.items.map(mod => (
                  <NavItem
                    key={mod.id}
                    icon={<mod.icon className="w-4 h-4" />}
                    label={mod.label}
                    active={active === mod.id}
                    onClick={() => setActive(mod.id)}
                    collapsed={!sidebarOpen}
                  />
                ))}
              </div>
            ))}
          </nav>

          {/* System Status */}
          <div className="flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {sidebarOpen ? (
              <div className="px-4 py-3">
                <div className="mb-2" style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.38rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.28em',
                  color: 'rgba(255,255,255,0.14)',
                }}>
                  SYSTEM STATUS
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'AI Core',     status: aiTier || 'INIT',  color: aiTier ? '#6b9e7a' : 'rgba(200,205,214,0.4)' },
                    { label: 'Threat Feed', status: 'LIVE',     color: '#6b9e7a' },
                    { label: 'Encryption',  status: 'AES-256',  color: 'rgba(200,205,214,0.6)' },
                    { label: 'Network',     status: 'SECURE',   color: '#6b9e7a' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: 'rgba(255,255,255,0.25)' }}>
                        {s.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', fontWeight: 700, color: s.color }}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* User card */}
          <div
            className="flex-shrink-0 p-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}
          >
            <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <User className="w-3.5 h-3.5" style={{ color: 'rgba(200,205,214,0.6)' }} />
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <div className="font-bold text-xs tracking-wide truncate" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif' }}>Operator_01</div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.4rem',
                    color: 'rgba(255,255,255,0.22)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                  }}>
                    Level 5 Clearance
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ══════════ MAIN CONTENT ══════════ */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ─── APP HEADER ─── */}
          <header
            className="h-12 flex-shrink-0 flex items-center justify-between px-5 z-40 relative"
            style={{
              background: '#08090d',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-3 z-10 relative">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-md transition-all"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.2)' }} />
                <input
                  type="text"
                  placeholder="Search intelligence..."
                  className="pl-8 pr-3 py-1.5 text-xs w-52 rounded-md transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(200,205,214,0.7)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.65rem',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(200,205,214,0.25)'
                    e.target.style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.target.style.background = 'rgba(255,255,255,0.04)'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 z-10 relative">
              {/* Active threats pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md"
                style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.56rem',
                    fontWeight: 700,
                    color: '#ff6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    18 Active Threats
                  </span>
                </div>
                <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6b9e7a' }} />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.56rem',
                    fontWeight: 700,
                    color: '#6b9e7a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    98.2% Trust
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  className="p-1.5 rounded-md relative transition-all"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"
                    style={{ border: '1.5px solid #08090d' }} />
                </button>
                <button
                  className="p-1.5 rounded-md transition-all"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                >
                  <User className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </header>

          {/* ─── LIVE TELEMETRY TICKER ─── */}
          <TelemetryTicker />

          {/* ─── CONTENT AREA ─── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar" style={{ background: '#050507' }}>
            <div className="max-w-7xl mx-auto">

              {/* Breadcrumb + clock */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.24em',
                    }}>ARGUS</span>
                    <ChevronRight className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.12)' }} />
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      color: 'rgba(200,205,214,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.24em',
                    }}>
                      {activeModule?.label}
                    </span>
                  </div>
                  <h1 className="text-xl font-semibold" style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em', fontFamily: 'Outfit, sans-serif' }}>
                    {activeModule?.desc}
                  </h1>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Activity className="w-3.5 h-3.5" style={{ color: 'rgba(200,205,214,0.4)' }} />
                  <div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.56rem',
                      fontWeight: 700,
                      color: 'rgba(200,205,214,0.55)',
                      letterSpacing: '0.1em',
                    }}>
                      {time.toLocaleTimeString('en-US', { hour12: false })} UTC
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.38rem',
                      color: 'rgba(255,255,255,0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                    }}>
                      {time.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Module panels */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {active === 'overview'     && <OverviewModule />}
                  {active === 'sentinel'     && <SentinelModule    onAlert={addToast} />}
                  {active === 'veil'         && <VeilModule        onAlert={addToast} />}
                  {active === 'identity'     && <IdentityModule    onAlert={addToast} />}
                  {active === 'oracle'       && <OracleModule />}
                  {active === 'skynet'       && <SkynetModule      onAlert={addToast} />}
                  {active === 'response'     && <ResponseModule />}
                  {active === 'threat-intel' && <ThreatIntelModule />}
                  {active === 'iem'          && <IEMModule />}
                  {active === 'university'   && <UniversityShieldModule />}
                  {active === 'nexus'        && <NexusModule />}
                  {active === 'phantom'      && <PhantomModule />}
                  {active === 'breach-iq'    && <BreachIQModule />}
                  {active === 'hunt'         && <HuntModule />}
                  {active === 'mitre'        && <MITREModule />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ─── STATUS BAR ─── */}
          <CommandBar />
        </main>
      </div>
    </div>
  )
}
