import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Activity, Globe, Lock, Zap, Terminal,
  Cpu, Eye, Search, Bell, User, Menu, ChevronRight, Brain,
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
import { cn } from './utils/cn'

/* ─────────────────────────────── Constants ─── */

const MODULES = [
  { id: 'overview',     label: 'Dashboard', desc: 'System Intelligence' },
  { id: 'sentinel',     label: 'Sentinel',  desc: 'Real-time Monitoring' },
  { id: 'veil',         label: 'Veil',      desc: 'Email Protection' },
  { id: 'identity',     label: 'Identity',  desc: 'Access Control' },
  { id: 'oracle',       label: 'Oracle',    desc: 'Attack Correlation' },
  { id: 'skynet',       label: 'Skynet',    desc: 'Cloud Infrastructure' },
  { id: 'response',     label: 'Response',  desc: 'Incident Response' },
  { id: 'threat-intel', label: 'Intel',     desc: 'Threat Intelligence' },
  { id: 'iem',          label: 'IEM',       desc: 'Identity Exploitation Model' },
]

const NAV_GROUPS = [
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'overview',     label: 'Dashboard', icon: Activity },
      { id: 'threat-intel', label: 'Intel',      icon: Globe },
      { id: 'iem',          label: 'IEM',         icon: Brain },
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
]

const TICKER_ITEMS = [
  { label: 'THREAT STREAMS', value: '18,421', color: '#00D1FF' },
  { label: 'EVENTS/SEC',     value: '4,892',  color: '#00D1FF' },
  { label: 'BLOCKED TODAY',  value: '312',    color: '#DC2626' },
  { label: 'AI DETECTIONS',  value: '2.40M',  color: '#00D1FF' },
  { label: 'TRUST INDEX',    value: '98.2%',  color: '#16A34A' },
  { label: 'CISA ALERTS',    value: '7 ACTIVE',color: '#D97706' },
  { label: 'PHISH ATTEMPTS', value: '891',    color: '#D97706' },
  { label: 'CVEs MONITORED', value: '1,247',  color: '#00D1FF' },
  { label: 'AI ENGINE',      value: 'OPERATIONAL', color: '#16A34A' },
  { label: 'NETWORK',        value: 'SECURE-TLS', color: '#16A34A' },
  { label: 'NODE',           value: 'ALPHA-7 ONLINE', color: '#16A34A' },
  { label: 'ENCRYPTION',     value: 'AES-256 ACTIVE', color: '#16A34A' },
]

/* ─────────────────────────────── Sub-components ─── */

function ClassificationBanner() {
  return (
    <div
      className="classification-banner h-7 flex items-center justify-between px-6 z-[60]"
      style={{ background: '#040A14', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="scan-beam" />

      <div className="flex items-center gap-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.44rem',
            fontWeight: 800,
            color: '#4ade80',
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            border: '1px solid rgba(74,222,128,0.3)',
            background: 'rgba(74,222,128,0.06)',
            padding: '1px 7px',
            borderRadius: '2px',
          }}>
            UNCLASSIFIED
          </span>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.44rem',
          color: '#334155',
          textTransform: 'uppercase',
          letterSpacing: '0.24em',
        }}>
          ARGUS DEFENSE INTELLIGENCE PLATFORM — EDUCATIONAL RESTRICTED USE
        </span>
      </div>

      <div className="flex items-center gap-5 relative z-10" style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.44rem',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
      }}>
        <span>SESSION: ARG-26-Δ-5821</span>
        <span style={{ color: '#0F172A', opacity: 0.25 }}>·</span>
        <span>NODE: ALPHA-7/EDU</span>
        <span style={{ color: '#0F172A', opacity: 0.25 }}>·</span>
        <span>CHANNEL: SECURE-AES256</span>
      </div>
    </div>
  )
}

function TelemetryTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div
      className="flex-shrink-0 overflow-hidden relative"
      style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(15,23,42,0.08)', height: '28px' }}
    >
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #FFFFFF, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #FFFFFF, transparent)' }} />

      {/* LIVE label */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 z-20 flex-shrink-0"
        style={{ background: '#F0F4F9', borderRight: '1px solid rgba(15,23,42,0.08)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.475rem',
            fontWeight: 800,
            color: '#334155',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}>LIVE</span>
        </div>
      </div>

      {/* Scrolling data */}
      <div className="flex items-center h-full" style={{ paddingLeft: '60px', overflow: 'hidden' }}>
        <div className="ticker-track">
          {items.map((item, i) => (
            <div key={i} className="flex items-center flex-shrink-0"
              style={{ borderRight: '1px solid rgba(15,23,42,0.06)' }}>
              <div className="flex items-center gap-2 px-4">
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.47rem',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.52rem',
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

function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: collapsed ? 0 : 2 }}
      className="group relative flex items-center gap-3 mx-2 mb-0.5 cursor-pointer rounded-md transition-all duration-200"
      style={{
        padding: '9px 12px',
        paddingLeft: active ? '10px' : '12px',
        borderLeft: active ? '2px solid #00D1FF' : '2px solid transparent',
        background: active ? 'rgba(0, 209, 255, 0.07)' : 'transparent',
        color: active ? '#FFFFFF' : 'rgba(255,255,255,0.42)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.72)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'rgba(255,255,255,0.42)'
        }
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 transition-colors"
        style={{ color: active ? '#00D1FF' : 'inherit' }}>
        {icon}
      </div>

      {/* Label */}
      {!collapsed && (
        <span className="text-sm font-medium truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
          {label}
        </span>
      )}

      {/* Active indicator */}
      {active && !collapsed && (
        <div className="ml-auto w-1 h-4 rounded-full flex-shrink-0"
          style={{ background: '#00D1FF', boxShadow: '0 0 8px rgba(0,209,255,0.6)' }} />
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <div
          className="absolute left-full ml-2.5 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-[60] whitespace-nowrap pointer-events-none"
          style={{
            background: '#0D1829',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          {label}
        </div>
      )}
    </motion.div>
  )
}

/* ─────────────────────────────── Main App ─── */

export default function App() {
  const [active, setActive] = useState('overview')
  const [time, setTime] = useState(new Date())
  const [toasts, setToasts] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const addToast = (msg) => {
    const id = Date.now()
    setToasts(prev => [{ id, msg }, ...prev].slice(0, 3))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }

  const activeModule = MODULES.find(m => m.id === active)

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: '#F6F8FC' }}>

      {/* ─── CLASSIFICATION BANNER ─── */}
      <ClassificationBanner />

      {/* ─── TOAST NOTIFICATIONS ─── */}
      <div className="fixed top-8 right-6 z-[100] space-y-2.5 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
              className="flex items-start gap-3 px-4 py-3 rounded-lg max-w-xs"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(220,38,38,0.2)',
                boxShadow: '0 4px 20px rgba(220,38,38,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div className="p-1.5 rounded-md flex-shrink-0"
                style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <Zap className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '4px' }}>
                  SYSTEM ALERT
                </div>
                <div className="text-xs leading-snug" style={{ color: '#334155' }}>{t.msg}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ═══════════════ SIDEBAR ═══════════════ */}
        <aside
          className={cn('flex flex-col flex-shrink-0 z-50 transition-all duration-300 relative', sidebarOpen ? 'w-64' : 'w-16')}
          style={{ background: '#080E1D', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Threat level strip — left edge colored gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, #16A34A 0%, #D97706 60%, #DC2626 100%)', opacity: 0.55 }} />

          {/* Logo / Brand */}
          <div
            className={cn('flex items-center flex-shrink-0', sidebarOpen ? 'h-14 px-5 gap-3' : 'h-14 justify-center')}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center relative"
                style={{ background: 'rgba(0,64,193,0.14)', border: '1px solid rgba(0,209,255,0.2)' }}>
                <Shield className="w-4 h-4" style={{ color: '#00D1FF' }} />
                {/* Pulse ring on icon */}
                <div className="absolute inset-0 rounded-lg animate-gotham-breathe"
                  style={{ background: 'rgba(0,209,255,0.05)' }} />
              </div>
              {/* Active glow dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#080E1D] animate-pulse" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="font-bold text-white tracking-tight text-sm leading-tight">ARGUS</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.425rem',
                  color: 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                }}>
                  Defense Intelligence v4.2
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
                    fontSize: '0.42rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.24em',
                    color: 'rgba(255,255,255,0.18)',
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
          <div className="flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {sidebarOpen ? (
              <div className="px-4 py-3">
                <div className="mb-2" style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.42rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.24em',
                  color: 'rgba(255,255,255,0.18)',
                }}>
                  SYSTEM STATUS
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'AI Core',       status: 'ACTIVE',   color: '#16A34A' },
                    { label: 'Threat Feed',   status: 'LIVE',     color: '#16A34A' },
                    { label: 'Encryption',    status: 'AES-256',  color: '#00D1FF' },
                    { label: 'Network',       status: 'SECURE',   color: '#16A34A' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                        {s.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', fontWeight: 700, color: s.color }}>
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
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}
          >
            <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,64,193,0.15)', border: '1px solid rgba(0,64,193,0.25)' }}>
                <User className="w-3.5 h-3.5" style={{ color: '#7AA2E3' }} />
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <div className="text-white font-bold text-xs tracking-wide truncate">Operator_01</div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.44rem',
                    color: 'rgba(255,255,255,0.28)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                  }}>
                    Level 5 Clearance
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ─── APP HEADER (white) ─── */}
          <header
            className="header-scan h-14 flex-shrink-0 flex items-center justify-between px-6 z-40 relative"
            style={{
              background: '#FFFFFF',
              borderBottom: '1px solid rgba(15,23,42,0.09)',
              boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
            }}
          >
            {/* Scan beam overlay */}
            <div className="header-scan-line" />

            {/* Left controls */}
            <div className="flex items-center gap-4 z-10 relative">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md transition-all"
                style={{ color: '#64748B' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B' }}
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search intelligence..."
                  className="pl-9 pr-4 py-2 text-xs w-64 rounded-md transition-all outline-none"
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid rgba(15,23,42,0.1)',
                    color: '#0F172A',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(0,64,193,0.4)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,64,193,0.08)'
                    e.target.style.background = '#FFFFFF'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(15,23,42,0.1)'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = '#F8FAFC'
                  }}
                />
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 z-10 relative">
              {/* Threat / Trust pill */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-full"
                style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-critical-blink" />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: '#DC2626',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}>
                    18 Threats
                  </span>
                </div>
                <div className="w-px h-3.5" style={{ background: 'rgba(15,23,42,0.12)' }} />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: '#16A34A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}>
                    98.2% Trust
                  </span>
                </div>
              </div>

              {/* Icon buttons */}
              <div className="flex items-center gap-1">
                <button
                  className="p-2 rounded-md relative transition-all"
                  style={{ color: '#64748B' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Bell className="w-4 h-4" />
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"
                    style={{ border: '1.5px solid #FFFFFF' }} />
                </button>
                <button
                  className="p-2 rounded-md transition-all"
                  style={{ color: '#64748B' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* ─── LIVE TELEMETRY TICKER ─── */}
          <TelemetryTicker />

          {/* ─── CONTENT AREA ─── */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" style={{ background: '#F6F8FC' }}>
            <div className="max-w-7xl mx-auto">

              {/* Breadcrumb + mission clock */}
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.22em',
                    }}>ARGUS</span>
                    <ChevronRight className="w-3 h-3" style={{ color: '#CBD5E1' }} />
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      color: '#0040C1',
                      textTransform: 'uppercase',
                      letterSpacing: '0.22em',
                    }}>
                      {activeModule?.label}
                    </span>
                  </div>
                  <h1 className="text-2xl font-semibold" style={{ color: '#0F172A', letterSpacing: '-0.01em' }}>
                    {activeModule?.desc}
                  </h1>
                </div>

                {/* Mission clock */}
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-md"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.09)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <Activity className="w-3.5 h-3.5" style={{ color: '#0040C1' }} />
                  <div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      color: '#0040C1',
                      letterSpacing: '0.1em',
                    }}>
                      {time.toLocaleTimeString('en-US', { hour12: false })} UTC
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.42rem',
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
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
                  transition={{ duration: 0.22 }}
                >
                  {active === 'overview'     && <OverviewModule />}
                  {active === 'sentinel'     && <SentinelModule    onAlert={addToast} />}
                  {active === 'veil'         && <VeilModule        onAlert={addToast} />}
                  {active === 'identity'     && <IdentityModule    onAlert={addToast} />}
                  {active === 'oracle'       && <OracleModule />}
                  {active === 'skynet'       && <SkynetModule      onAlert={addToast} />}
                  {active === 'response'     && <ResponseModule />}
                  {active === 'threat-intel' && <ThreatIntelModule />}
                  {active === 'iem'         && <IEMModule />}
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
