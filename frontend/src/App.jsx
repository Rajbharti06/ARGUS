import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Activity,
  Globe,
  Lock,
  Zap,
  AlertTriangle,
  Terminal,
  Cpu,
  Eye,
  Settings,
  Clock,
  Wifi,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { OverviewModule } from './components/OverviewModule'
import { DisplayTitle, CommandBar } from './components/ui/CyberComponents'
import { ArgusAtmosphere } from './components/ui/ArgusAtmosphere'
import SentinelModule from './components/SentinelModule'
import VeilModule from './components/VeilModule'
import IdentityModule from './components/IdentityModule'
import OracleModule from './components/OracleModule'
import SkynetModule from './components/SkynetModule'
import ResponseModule from './components/ResponseModule'
import ThreatIntelModule from './components/ThreatIntelModule'
import { sound } from './utils/sound'
import { cn } from './utils/cn'

const MODULES = [
  { id: 'overview', label: 'OVERVIEW', desc: 'System Intelligence', icon: Activity },
  { id: 'veil', label: 'VEIL', desc: 'THREAT + FORENSICS', icon: Shield },
  { id: 'sentinel', label: 'SENTINEL', desc: 'Threat Monitoring', icon: Shield },
  { id: 'identity', label: 'IDENTITY', desc: 'Trust Analytics', icon: Eye },
  { id: 'oracle', label: 'ORACLE', desc: 'CORRELATION + INVESTIGATION', icon: Terminal },
  { id: 'skynet', label: 'SKYNET', desc: 'Cloud Security', icon: Cpu },
  { id: 'response', label: 'RESPONSE', desc: 'Containment', icon: Zap },
  { id: 'threat-intel', label: 'THREAT INTEL', desc: 'Intelligence Fusion', icon: Globe },
]

const SECONDARY_ITEMS = [
  { id: 'incidents', label: 'INCIDENTS', icon: AlertTriangle },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
]

function useTelemetryPulse() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 400)
    return () => clearInterval(id)
  }, [])
  return tick
}

export default function App() {
  const [active, setActive] = useState('veritas')
  const [time, setTime] = useState(new Date())
  const [toasts, setToasts] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [securityScore] = useState(87)
  const telTick = useTelemetryPulse()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const bars = [0, 1, 2, 3].map(i => {
    const v = Math.sin(telTick * 0.08 + i * 1.1) * 0.5 + 0.5
    return Math.round(5 + v * 9)
  })

  const addToast = msg => {
    const id = Date.now()
    setToasts(prev => [{ id, msg }, ...prev].slice(0, 3))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }

  const toggleSound = () => {
    sound.activate()
    setSoundEnabled(prev => !prev)
  }

  const formatTime = d =>
    d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  return (
    <div className="flex h-screen w-full bg-background text-text font-sans overflow-hidden">
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-3 px-4 py-3 rounded-lg text-xs font-mono max-w-xs bg-[rgba(14,18,26,0.96)] border border-critical/25 text-critical/95 shadow-diffuse backdrop-blur-md"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-critical flex-shrink-0 mt-0.5" />
              <span>{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ArgusAtmosphere />

      <motion.aside
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-panel/95 border-r border-border flex flex-col z-50 backdrop-blur-2xl relative overflow-hidden flex-shrink-0"
      >
        <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-5'} py-5 mb-2`}>
          <div className="p-1.5 bg-white/[0.04] border border-border flex-shrink-0">
            <Shield className="w-5 h-5 text-accent-cyan" />
            <span className="sr-only">ARGUS</span>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <DisplayTitle className="text-lg block leading-none">ARGUS</DisplayTitle>
              <span className="text-[7px] font-mono text-text-muted tracking-[0.28em] uppercase">
                Operational intelligence
              </span>
            </motion.div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 right-0 translate-x-1/2 z-50 w-5 h-5 rounded-full bg-panel border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-accent-cyan/20 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar px-2 mt-2">
          {!collapsed && (
            <div className="section-label px-3 mb-2" style={{ fontSize: '8px', letterSpacing: '0.28em' }}>
              MODULES
            </div>
          )}
          {MODULES.map(mod => (
            <NavItem
              key={mod.id}
              icon={<mod.icon className="w-4 h-4" />}
              label={mod.label}
              active={active === mod.id}
              onClick={() => setActive(mod.id)}
              collapsed={collapsed}
            />
          ))}

          <div className={`pt-4 mt-4 border-t border-border ${collapsed ? '' : 'px-1'}`}>
            {!collapsed && (
              <div className="section-label px-3 mb-2" style={{ fontSize: '8px', letterSpacing: '0.28em' }}>
                OPS
              </div>
            )}
            {SECONDARY_ITEMS.map(item => (
              <NavItem
                key={item.id}
                icon={<item.icon className="w-4 h-4" />}
                label={item.label}
                collapsed={collapsed}
                dimmed
              />
            ))}
          </div>
        </nav>

        {!collapsed && (
          <div className="mt-auto px-3 pb-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-accent-cyan/55" />
                <span className="text-[8px] font-mono text-text-muted uppercase tracking-[0.2em]">
                  Uplink stable
                </span>
              </div>
              <span className="text-[8px] font-mono text-text-muted">v4.2.0</span>
            </div>
            <div className="glass-panel p-2.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-[9px] font-semibold text-accent-cyan flex-shrink-0">
                OP
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate uppercase tracking-[0.18em] text-text-secondary">
                  Operator_01
                </div>
                <div className="text-[7px] font-mono text-text-muted truncate uppercase tracking-wider">
                  L5 clearance · Active
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-12 border-b border-border px-6 flex items-center justify-between bg-panel/75 backdrop-blur-xl z-40 flex-shrink-0">
          <div className="flex items-center gap-6 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-nominal argus-breathe flex-shrink-0" />
              <span className="text-[10px] font-mono font-semibold tracking-[0.22em] text-text-secondary truncate">
                Operational picture · Correlation nominal
              </span>
            </div>

            <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />

            <div className="hidden md:flex items-center gap-5 text-[9px] font-mono text-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="tracking-wider opacity-65">Alerts:</span>
                <span className="text-critical font-semibold tabular-nums">18</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="tracking-wider opacity-65">Trust index:</span>
                <span className="text-accent-cyan font-semibold tabular-nums">98.2%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="tracking-wider opacity-65">Posture:</span>
                <span className="text-nominal font-semibold tabular-nums">{securityScore}/100</span>
              </div>
            </div>

            <div className="h-4 w-px bg-border hidden lg:block flex-shrink-0" />

            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-end gap-0.5 h-4">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-sm bg-accent-cyan/55"
                    style={{ height: h, opacity: 0.35 + (i % 3) * 0.15 }}
                  />
                ))}
              </div>
              <span className="text-[8px] font-mono text-text-muted uppercase tracking-wider whitespace-nowrap">
                Fusion ingest
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-[9px] text-text-muted flex-shrink-0">
            <Link
              to="/briefing"
              className="uppercase tracking-[0.2em] hover:text-accent-cyan transition-colors hidden sm:inline"
            >
              Briefing
            </Link>
            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-1.5 transition-colors hover:text-text-secondary"
              style={{ color: soundEnabled ? 'var(--accent-cyan)' : 'rgba(228,232,236,0.28)' }}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              <span className="tracking-[0.18em] uppercase hidden sm:inline">
                {soundEnabled ? 'Audio' : 'Mute'}
              </span>
            </button>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 opacity-35" />
              <span className="tracking-[0.12em] tabular-nums opacity-65">{formatTime(time)} UTC</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          <div className="scanline-overlay absolute inset-0 pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="relative z-10"
            >
              {active === 'overview' && <OverviewModule />}
              {active === 'sentinel' && (
                <SentinelModule onAlert={addToast} soundOn={soundEnabled} activated={soundEnabled} />
              )}
              {active === 'veil' && <VeilModule onAlert={addToast} soundOn={soundEnabled} activated={soundEnabled} />}
              {active === 'identity' && <IdentityModule onAlert={addToast} />}
              {active === 'oracle' && <OracleModule soundOn={soundEnabled} activated={soundEnabled} />}
              {active === 'skynet' && <SkynetModule onAlert={addToast} />}
              {active === 'response' && <ResponseModule />}
              {active === 'threat-intel' && <ThreatIntelModule />}
            </motion.div>
          </AnimatePresence>
        </div>

        <CommandBar />
      </main>
    </div>
  )
}

function NavItem({ icon, label, active = false, onClick, collapsed = false, dimmed = false }) {
  return (
    <motion.div
      whileHover={{ x: collapsed ? 0 : 2 }}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'flex items-center rounded-lg mx-1 cursor-pointer transition-colors border-l-2',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3.5 px-3 py-2.5',
        active
          ? 'bg-white/[0.04] text-accent-cyan border-l-accent-cyan'
          : dimmed
            ? 'border-l-transparent text-text-muted hover:text-text-secondary hover:bg-white/[0.02]'
            : 'border-l-transparent text-text-muted hover:text-text-secondary hover:bg-white/[0.02]'
      )}
    >
      <div className={cn('flex-shrink-0', active && 'text-accent-cyan')}>{icon}</div>
      {!collapsed && (
        <>
          <span className="text-[10px] font-mono tracking-[0.2em] font-semibold">{label}</span>
          {active && <div className="ml-auto w-1 h-1 rounded-full bg-accent-cyan opacity-80" />}
        </>
      )}
    </motion.div>
  )
}
