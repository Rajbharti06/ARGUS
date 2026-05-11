import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

/* ARGUS — institutional operational UI primitives */

export function DisplayTitle({ children, className = '', as: Component = 'span' }) {
  return (
    <Component
      className={cn(
        'font-display font-semibold tracking-tight text-text',
        className
      )}
    >
      {children}
    </Component>
  )
}

export function Heading({ children, className = '', size = 'md' }) {
  const sizes = {
    xs: 'text-xs font-semibold uppercase tracking-wider text-text-muted font-sans',
    sm: 'text-sm font-semibold text-text font-sans',
    md: 'text-base font-semibold text-text font-sans',
    lg: 'text-lg font-semibold text-text font-sans tracking-tight',
    xl: 'text-xl font-semibold text-text font-display tracking-tight',
  }
  return <h2 className={cn(sizes[size] || sizes.md, className)}>{children}</h2>
}

export function Text({ children, className = '', variant = 'body' }) {
  const variants = {
    body: 'text-sm text-text-dim font-sans',
    muted: 'text-xs text-text-muted font-sans',
    code: 'text-xs font-mono text-accent-cyan bg-primary/10 px-1 rounded border border-border-subtle',
  }
  return (
    <p className={cn(variants[variant] || variants.body, className)}>{children}</p>
  )
}

export function Card({ children, className = '', hover = true }) {
  return (
    <div
      className={cn(
        'bg-panel border border-border rounded-xl overflow-hidden font-sans',
        hover && 'hover:border-border-strong transition-[border-color] duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

export function Section({ children, title, icon, action, className = '' }) {
  return (
    <Card className={className}>
      {(title || icon) && (
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            {icon && <span className="text-accent-cyan">{icon}</span>}
            <Heading size="xs">{title}</Heading>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </Card>
  )
}

export function Badge({ children, variant = 'info', className = '' }) {
  const variants = {
    info: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-nominal-muted/40 text-nominal border-nominal/25',
    warning: 'bg-warning/10 text-warning border-warning/25',
    critical: 'bg-critical/10 text-critical border-critical/30',
    primary: 'bg-primary/10 text-primary border-primary/20',
  }
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[10px] font-semibold uppercase border tracking-wider font-sans',
        variants[variant] || variants.info,
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusDot({ status = 'info', size = 'sm', pulse = false }) {
  const colors = {
    info: 'bg-accent-cyan',
    success: 'bg-nominal',
    warning: 'bg-warning',
    critical: 'bg-critical',
  }
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }
  return (
    <div className="relative flex items-center justify-center">
      {pulse && (
        <div
          className={cn('absolute rounded-full animate-pulse-slow opacity-25', sizes[size], colors[status])}
        />
      )}
      <div className={cn('rounded-full relative z-10', sizes[size], colors[status])} />
    </div>
  )
}

export function Stat({ label, value, sub, icon, trend }) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-border font-sans">
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl font-semibold tracking-tight text-text tabular-nums">{value}</div>
        {icon && <div className="text-text-muted opacity-45">{icon}</div>}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</div>
        {trend !== undefined && trend !== null && (
          <div
            className={cn(
              'text-[10px] font-semibold',
              trend > 0 ? 'text-nominal' : trend < 0 ? 'text-critical' : 'text-text-muted'
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend}%
          </div>
        )}
      </div>
      {sub && <div className="text-[9px] text-text-muted/70 mt-1 uppercase tracking-wide">{sub}</div>}
    </div>
  )
}

export function CommandBar() {
  const [time, setTime] = useState(new Date())
  const [backendOk, setBackendOk] = useState(null)

  useEffect(() => {
    const check = () =>
      fetch('/api/health')
        .then(r => setBackendOk(r.ok))
        .catch(() => setBackendOk(false))

    check()
    const t = setInterval(() => setTime(new Date()), 1000)
    const hc = setInterval(check, 30000)
    return () => {
      clearInterval(t)
      clearInterval(hc)
    }
  }, [])

  return (
    <div className="h-10 border-t border-border flex items-center px-6 gap-6 text-[10px] font-medium bg-panel/90 backdrop-blur-md flex-shrink-0 font-sans">
      <div className="flex items-center gap-2">
        <StatusDot status={backendOk === false ? 'critical' : 'success'} pulse={backendOk !== false} />
        <span className="text-text-muted uppercase tracking-widest">ARGUS CORE v4.2.0</span>
      </div>

      <div className="flex items-center gap-4 text-text-muted/50">
        {['MONITOR', 'ANALYZE', 'DETECT', 'RESPOND'].map(c => (
          <span key={c} className="hover:text-text-muted cursor-default transition-colors tracking-widest">
            {c}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      <Link
        to="/briefing"
        className="text-[9px] uppercase tracking-[0.2em] text-text-muted hover:text-accent-cyan transition-colors mr-4"
      >
        Briefing
      </Link>

      <div className="flex items-center gap-6 text-text-muted">
        <div className="flex items-center gap-2">
          <span className="text-[9px] opacity-45 uppercase tracking-wider">System:</span>
          <span
            className={cn(
              'font-semibold uppercase tracking-wider text-[9px]',
              backendOk === false ? 'text-critical' : 'text-nominal'
            )}
          >
            {backendOk === null ? 'INIT' : backendOk ? 'NOMINAL' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] opacity-45 uppercase tracking-wider">Link:</span>
          <span className="text-nominal font-semibold uppercase tracking-wider text-[9px]">STABLE</span>
        </div>
        <div className="font-mono text-[9px] opacity-45">{time.toISOString().slice(0, 19).replace('T', ' ')} UTC</div>
      </div>
    </div>
  )
}

/** @deprecated Use DisplayTitle */
export function GlowText({ children, className = '' }) {
  return <DisplayTitle className={cn('text-lg', className)}>{children}</DisplayTitle>
}

export function GlassPanel({ children, className = '', glow = false, critical = false, style = {} }) {
  return (
    <div
      className={cn(glow ? 'glass-panel-glow' : 'glass-panel', className)}
      style={{
        ...(critical
          ? { borderColor: 'rgba(168, 92, 92, 0.22)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SeverityBadge({ severity = 'low' }) {
  return (
    <span
      className={cn(
        'text-[9px] font-semibold font-mono uppercase tracking-[0.18em] px-2 py-0.5 rounded border',
        `severity-${severity}`
      )}
    >
      {severity}
    </span>
  )
}

const THREAT_DOT = {
  critical: '#a85c5c',
  high: '#b8825c',
  medium: '#a68b4b',
  low: '#6d8588',
  info: '#8baeb4',
}

export function ThreatDot({ severity = 'low', size = 5, pulse = false }) {
  const color = THREAT_DOT[severity] || THREAT_DOT.info
  const px = `${size * 4}px`
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: px, height: px }}>
      {pulse && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-slow opacity-30"
          style={{ backgroundColor: color }}
        />
      )}
      <div
        className="rounded-full relative z-10"
        style={{ width: px, height: px, backgroundColor: color }}
      />
    </div>
  )
}

export function CircularProgress({
  value = 0,
  size = 64,
  strokeWidth = 4,
  color = 'var(--accent-cyan)',
  label = '',
  sublabel = '',
}) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold font-mono tabular-nums" style={{ color }}>
          {label}
        </span>
        {sublabel && (
          <span className="text-[7px] font-mono text-text-muted uppercase tracking-widest mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
