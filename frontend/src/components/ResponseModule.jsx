import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RefreshCcw, Terminal, CheckCircle, Clock, AlertTriangle, Play, Pause } from 'lucide-react'
import { cn } from '../utils/cn'

const STAGES = ['DETECT', 'TRIAGE', 'ISOLATE', 'ERADICATE', 'RECOVER', 'REVIEW']

const ACTIONS = [
  { time: '09:41', component: 'Identity Compromise', finding: 'Org Quarantine',          status: 'COMPLETE',   priority: 'CRITICAL', eta: '—'    },
  { time: '09:38', component: 'Phishing Mass — Org Quarantine', finding: 'Email Block',    status: 'COMPLETE',   priority: 'HIGH',     eta: '—'    },
  { time: '09:35', component: 'Egress Block',         finding: 'BLOCK/AI Lockdown',        status: 'ANALYZING',  priority: 'CRITICAL', eta: '4 min' },
  { time: '09:32', component: 'Exfil API Lockdown',  finding: 'External API takedown',    status: 'COMPLETE',   priority: 'HIGH',     eta: '—'    },
]

const PLAYBOOK_LINES = [
  { t: '09:41:03', type: 'info',    msg: 'Playbook: Credential Compromise Response v2.3' },
  { t: '09:41:04', type: 'exec',    msg: 'Executing: identity.block(user="prof.johnson", scope="all_sessions")' },
  { t: '09:41:05', type: 'success', msg: '✓ Session revoked — 3 active sessions terminated' },
  { t: '09:41:06', type: 'exec',    msg: 'Executing: mail.quarantine(domain="uni.edu", filter="phish_campaign_X441")' },
  { t: '09:41:08', type: 'success', msg: '✓ Mail quarantine active — 847 messages held' },
  { t: '09:41:09', type: 'exec',    msg: 'Executing: network.isolate(subnet="10.22.33.0/24", reason="lateral_movement")' },
  { t: '09:41:12', type: 'warn',    msg: '⚠ Subnet isolation partial — 2 hosts require manual confirmation' },
  { t: '09:41:13', type: 'exec',    msg: 'Executing: api.revoke(key_prefix="rc_1bd5", scope="external")' },
  { t: '09:41:15', type: 'success', msg: '✓ API tokens revoked — external exfil endpoint blocked' },
  { t: '09:41:16', type: 'info',    msg: 'ARGUS Response: awaiting operator confirmation for ERADICATE stage' },
]

const STATUS_CLS = {
  COMPLETE:  'text-nominal border-nominal/30 bg-nominal/10',
  ANALYZING: 'text-yellow-400 border-yellow-900/40 bg-yellow-950/20',
  EXECUTING: 'text-primary border-primary/30 bg-primary/5',
  PENDING:   'text-white/30 border-white/10 bg-white/[0.02]',
}

const PRIORITY_CLS = {
  CRITICAL: 'text-red-400',
  HIGH:     'text-orange-400',
  MEDIUM:   'text-yellow-400',
}

const LOG_CLS = {
  info:    'text-primary/60',
  exec:    'text-white/50',
  success: 'text-nominal',
  warn:    'text-yellow-400',
  error:   'text-red-400',
}

export default function ResponseModule() {
  const [activeStage, setActiveStage] = useState(1)
  const [running, setRunning] = useState(false)
  const [visibleLog, setVisibleLog] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const logRef = useRef(null)

  useEffect(() => {
    if (!running) return
    if (visibleLog >= PLAYBOOK_LINES.length) { setRunning(false); return }
    const t = setTimeout(() => {
      setVisibleLog(v => v + 1)
      logRef.current?.scrollTo({ top: 9999, behavior: 'smooth' })
    }, 600)
    return () => clearTimeout(t)
  }, [running, visibleLog])

  const runPlaybook = async () => {
    setLoading(true)
    setResult(null)
    setVisibleLog(0)
    setRunning(false)
    await new Promise(r => setTimeout(r, 800))
    try {
      const res = await fetch('/api/argus/response/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity: 'critical', event_type: 'credential_compromise', user: 'prof.johnson' }),
      })
      setResult(await res.json())
    } catch {}
    finally {
      setLoading(false)
      setRunning(true)
    }
  }

  return (
    <div className="flex flex-col gap-4 argus-fade" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Stage pipeline */}
      <div className="glass-panel p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="module-header">Containment Response Pipeline</span>
          <div className="flex items-center gap-2 text-[9px] font-mono text-white/30">
            <span>INCIDENT:</span>
            <span className="text-critical font-bold">INC-2024-0441</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'flex-1 flex flex-col items-center gap-1.5 py-2 px-1 rounded cursor-pointer transition-all',
                i < activeStage  ? 'bg-nominal/10 border border-nominal/30' :
                i === activeStage ? 'bg-primary/10 border border-primary/30' :
                'bg-white/[0.02] border border-white/[0.04]'
              )} onClick={() => setActiveStage(i)}>
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center',
                  i < activeStage  ? 'bg-nominal/30' :
                  i === activeStage ? 'bg-primary/20' : 'bg-white/5'
                )}>
                  {i < activeStage
                    ? <CheckCircle className="w-3 h-3 text-nominal" />
                    : i === activeStage
                      ? <div className="w-2 h-2 rounded-full bg-primary" />
                      : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  }
                </div>
                <span className={cn('text-[8px] font-bold uppercase tracking-widest',
                  i < activeStage  ? 'text-nominal' :
                  i === activeStage ? 'text-primary' : 'text-white/20'
                )}>{stage}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={cn('w-4 h-px flex-shrink-0',
                  i < activeStage ? 'bg-nominal/40' : 'bg-white/[0.06]'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left: actions table + terminal */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">

          {/* Active response table */}
          <div className="glass-panel overflow-hidden flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="module-header">Active Response Actions</span>
              </div>
              <button onClick={runPlaybook} disabled={loading}
                className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 hover:bg-primary/15 text-primary px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40">
                {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {loading ? 'Generating...' : 'Run Playbook'}
              </button>
            </div>

            <div className="grid px-4 py-2 border-b border-white/[0.04]"
              style={{ gridTemplateColumns: '70px 1fr 1fr 90px 70px 60px' }}>
              {['TIME', 'COMPONENT', 'FINDING / ACTION', 'STATUS', 'PRIORITY', 'ETA'].map(h => (
                <span key={h} className="section-label">{h}</span>
              ))}
            </div>

            {ACTIONS.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="grid items-center px-4 py-3 border-b border-white/[0.025] hover:bg-white/[0.015] transition-all"
                style={{ gridTemplateColumns: '70px 1fr 1fr 90px 70px 60px' }}>
                <span className="text-[9px] font-mono text-white/35">{a.time}</span>
                <span className="text-[10px] font-semibold text-white/60 truncate pr-2">{a.component}</span>
                <span className="text-[9px] font-mono text-white/40 truncate pr-2">{a.finding}</span>
                <span className={cn('text-[8px] font-bold px-2 py-0.5 rounded border w-fit', STATUS_CLS[a.status])}>{a.status}</span>
                <span className={cn('text-[9px] font-bold', PRIORITY_CLS[a.priority] || 'text-white/30')}>{a.priority}</span>
                <span className="text-[9px] font-mono text-white/30">{a.eta}</span>
              </motion.div>
            ))}
          </div>

          {/* Terminal playbook log */}
          <div className="glass-panel flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 flex-shrink-0">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="module-header">Playbook Execution Log</span>
              <div className="ml-auto flex items-center gap-2">
                {running && <div className="w-1.5 h-1.5 rounded-full bg-nominal animate-pulse" />}
                <span className="text-[8px] font-mono text-white/20">{running ? 'EXECUTING' : 'IDLE'}</span>
              </div>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-black/20 font-mono">
              {PLAYBOOK_LINES.slice(0, visibleLog).map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={cn('text-[9px] mb-1 leading-relaxed', LOG_CLS[line.type])}>
                  <span className="text-white/15 mr-2">[{line.t}]</span>
                  {line.msg}
                </motion.div>
              ))}
              {running && <div className="text-[9px] text-primary/60 animate-pulse">█</div>}
              {visibleLog === 0 && !running && (
                <div className="text-[9px] text-white/20 italic">Run playbook to see execution log...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: stats + quick actions */}
        <div className="w-52 flex flex-col gap-3 flex-shrink-0">
          {/* Live metrics */}
          <div className="glass-panel p-4 flex-shrink-0">
            <div className="section-label mb-3">Live Metrics</div>
            <div className="space-y-4">
              <div>
                <div className="text-[8px] text-white/25 uppercase tracking-widest mb-1">Live Last Hour</div>
                <div className="text-3xl font-bold font-mono text-primary">4.2</div>
              </div>
              <div className="h-px bg-white/5" />
              <div>
                <div className="text-[8px] text-white/25 uppercase tracking-widest mb-1">Mean Time to Detect</div>
                <div className="text-xl font-bold font-mono text-white/70">09:13</div>
              </div>
              <div className="h-px bg-white/5" />
              <div>
                <div className="text-[8px] text-white/25 uppercase tracking-widest mb-1">Mean Time to Recover</div>
                <div className="text-xl font-bold font-mono text-white/70">4.6</div>
                <div className="text-[8px] font-mono text-white/25">minutes avg</div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass-panel p-4 flex flex-col gap-2 flex-shrink-0">
            <div className="section-label mb-1">Operator Actions</div>
            {[
              { label: 'PAUSE ALL ACTIONS', cls: 'text-yellow-400 border-yellow-900/40 hover:bg-yellow-950/20' },
              { label: 'REGENERATE PLAN',   cls: 'text-primary border-primary/30 hover:bg-primary/10' },
              { label: 'INVESTIGATE THREAT', cls: 'text-white/40 border-white/10 hover:bg-white/[0.03]' },
            ].map(a => (
              <button key={a.label} className={cn('text-[9px] font-bold uppercase tracking-widest py-2 px-3 rounded border transition-all', a.cls)}>
                {a.label}
              </button>
            ))}
          </div>

          {/* AI playbook result */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="section-label mb-2">AI Recommended Steps</div>
                <div className="space-y-1.5">
                  {result.immediate_actions?.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[8px] font-bold text-primary/50 flex-shrink-0 mt-0.5">{String(i+1).padStart(2,'0')}</span>
                      <span className="text-[9px] font-mono text-white/45 leading-snug">{a}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
