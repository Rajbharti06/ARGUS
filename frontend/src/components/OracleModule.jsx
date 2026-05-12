import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Activity, AlertTriangle, RefreshCcw, GitMerge, Zap } from 'lucide-react'
import { cn } from '../utils/cn'
import { Badge, Heading } from './ui/CyberComponents'

const SEV = {
  critical: { border: '#a85c5c', glow: 'rgba(168,92,92,0.2)', text: '#d6b2b2', bg: 'rgba(168,92,92,0.08)' },
  high:     { border: '#a68b4b', glow: 'rgba(166,139,75,0.18)',  text: '#d0bc8d', bg: 'rgba(166,139,75,0.07)' },
  medium:   { border: '#6d8588', glow: 'rgba(109,133,136,0.16)', text: '#b7c4c6', bg: 'rgba(109,133,136,0.06)' },
  low:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.1)', text: '#93c5fd', bg: 'rgba(59,130,246,0.05)' },
}

const LOG_LINES = [
  '> argus-core: scanning event stream [14,328 sessions]',
  '> veil.engine: phishing artifact correlated — T1566.001',
  '> sentinel.feed: lateral movement detected — 10.22.33.41',
  '> identity.scorer: session hijack flagged — trust:0',
  '> oracle.ml: attack chain reconstructed — links established',
  '> response.auto: containment recommendations generated',
]

function edgePath(a, b) {
  const dx = (b.x - a.x) * 0.42
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`
}

function NodeGraph({ nodes, edges, selected, onSelect, phaseIndex = 0 }) {
  const W = 520, H = 420
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.12)" />
        </marker>
      </defs>

      {[75, 185, 300].map((y, i) => (
        <g key={i}>
          <line x1="24" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 5" />
          <text x="26" y={y - 5} fill="rgba(255,255,255,0.22)" fontSize="7" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.4">
            {i === 0 ? 'INITIAL ACCESS / DISCOVERY' : i === 1 ? 'CREDENTIAL ACCESS / PERSISTENCE' : 'LATERAL MOVEMENT / IMPACT'}
          </text>
        </g>
      ))}

      {/* Edges */}
      {edges.map((e, i) => {
        const a = nodeMap[e.from], b = nodeMap[e.to]
        if (!a || !b) return null
        const active = i <= phaseIndex
        return (
          <g key={i}>
            <path d={edgePath(a, b)}
              stroke={active ? 'rgba(0,209,255,0.38)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={active ? 1.4 : 1}
              fill="none"
              markerEnd="url(#arrow)" />
            {active && (
              <motion.circle cx={a.x} cy={a.y} r="2" fill="#00D1FF" opacity={0.45}
                animate={{ cx: [a.x, b.x], cy: [a.y, b.y], opacity: [0.65, 0.1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'linear' }} />
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const s = SEV[node.severity] || SEV.low
        const isSelected = selected?.id === node.id
        const NW = 110, NH = 38
        const active = i <= phaseIndex + 1
        return (
          <g key={node.id} onClick={() => onSelect(node)} style={{ cursor: 'pointer', opacity: active ? 1 : 0.2 }}
            transform={`translate(${node.x - NW / 2},${node.y - NH / 2})`}>
            <motion.rect width={NW} height={NH} rx="5"
              fill={isSelected ? s.glow : s.bg}
              stroke={s.border}
              strokeWidth={isSelected ? 1.5 : 0.8}
              strokeOpacity={isSelected ? 1 : 0.5}
              animate={active ? { opacity: [0.82, 1, 0.82] } : {}}
              transition={{ duration: 3, repeat: Infinity, delay: node.x * 0.005 }}
            />
            <text x={NW / 2} y={NH / 2 - 5} textAnchor="middle"
              fill={s.text} fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700"
              letterSpacing="1.5">
              {node.label}
            </text>
            {node.ttp_id && (
              <text x={NW / 2} y={NH / 2 + 4} textAnchor="middle"
                fill="rgba(255,183,71,0.65)" fontSize="6.5" fontFamily="monospace" fontWeight="600">
                {node.ttp_id}
              </text>
            )}
            <text x={NW / 2} y={NH / 2 + (node.ttp_id ? 13 : 8)} textAnchor="middle"
              fill="rgba(255,255,255,0.25)" fontSize="6.5" fontFamily="monospace">
              {node.time}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function OracleModule() {
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState(0)
  const [selectedNode, setSelectedNode] = useState(null)
  const [logLines, setLogLines] = useState([])
  const [cursor, setCursor] = useState(0)

  // Dynamic Nodes & Edges
  const { nodes, edges } = useMemo(() => {
    if (!timeline?.timeline) return { nodes: [], edges: [] }
    
    const MODULE_X = { VEIL: 120, IDENTITY: 280, SENTINEL: 340, ORACLE: 430, RESPONSE: 380, SKYNET: 220 }
    const MODULE_Y_BASE = { VEIL: 60, IDENTITY: 40, SENTINEL: 160, ORACLE: 230, RESPONSE: 350, SKYNET: 280 }
    
    const dNodes = timeline.timeline.map((e, i) => ({
      id: `n-${i}`,
      label: e.module,
      time: e.time,
      x: MODULE_X[e.module] || 250,
      y: (MODULE_Y_BASE[e.module] || 200) + (i * 15),
      severity: e.severity,
      detail: e.event,
      actor: e.actor,
      ttp_id: e.ttp_id,
      ttp_name: e.ttp_name,
      tactic: e.tactic,
    }))

    const dEdges = dNodes.slice(0, -1).map((n, i) => ({
      from: n.id,
      to: dNodes[i+1].id
    }))

    return { nodes: dNodes, edges: dEdges }
  }, [timeline])

  const PHASES = [
    'Scanning event stream...', 'Cross-referencing detections...', 'Analyzing behavioral anomalies...',
    'Correlating attack chain...', 'Querying AI Core...', 'Generating incident narrative...',
  ]

  const generate = async () => {
    setLoading(true)
    setTimeline(null)
    setLogLines([])
    setPhase(0)

    for (let i = 0; i < PHASES.length; i++) {
      setPhase(i)
      setLogLines(prev => [...prev, LOG_LINES[i]])
      await new Promise(r => setTimeout(r, 400))
    }

    try {
      const res = await fetch('/api/argus/oracle/timeline')
      const data = await res.json()
      setTimeline(data)
      setCursor(data.timeline.length - 1)
      if (data.timeline.length > 0) {
        setSelectedNode({
            id: `n-${data.timeline.length - 1}`,
            label: data.timeline[data.timeline.length - 1].module,
            detail: data.timeline[data.timeline.length - 1].event,
            severity: data.timeline[data.timeline.length - 1].severity,
            actor: data.timeline[data.timeline.length - 1].actor
        })
      }
    } catch {
      setTimeline({ error: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 argus-fade" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Breadcrumb tabs */}
      <div className="flex items-center gap-1 text-[9px] font-mono text-white/25 flex-shrink-0">
          <span className="flex items-center gap-1 text-primary">
            <span className="uppercase tracking-widest">ORACLE</span>
          </span>
          <span className="text-white/15">›</span>
          <span className="uppercase tracking-widest text-white/60">ATTACK GRAPH RECONSTRUCTION</span>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Node graph */}
        <div className="flex-1 flex flex-col glass-panel overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <GitMerge className="w-3.5 h-3.5 text-primary" />
              <span className="module-header">Autonomous Correlation Engine</span>
            </div>
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-[9px] font-mono text-primary animate-pulse">{PHASES[phase]}</span>
              )}
              <button onClick={generate} disabled={loading}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 hover:bg-primary/15 text-primary px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40">
                {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {loading ? 'Correlating...' : 'Execute Correlation'}
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 relative overflow-hidden">
            <NodeGraph nodes={nodes} edges={edges} selected={selectedNode} onSelect={setSelectedNode} phaseIndex={cursor} />

            <div className="absolute top-4 right-4 w-36 p-2 rounded bg-black/30 border border-white/[0.07]">
              <div className="text-[7px] font-mono text-white/25 uppercase tracking-[0.22em] mb-1">Incident Progress</div>
              <div className="h-1 rounded border border-white/[0.06] bg-white/[0.01] relative overflow-hidden">
                <div className="absolute inset-y-0 bg-primary/40 border-r border-primary/60" style={{ width: `${((cursor + 1) / nodes.length) * 100}%` }} />
              </div>
            </div>

            {/* Selected node detail overlay */}
            {selectedNode && (
              <motion.div key={selectedNode.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 glass-panel p-3 max-w-xs border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: SEV[selectedNode.severity]?.border || '#fff' }} />
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{selectedNode.label}</span>
                  <span className={cn('ml-auto text-[8px] font-bold uppercase',
                    selectedNode.severity === 'critical' ? 'text-critical' : selectedNode.severity === 'high' ? 'text-warning' : 'text-nominal'
                  )}>{selectedNode.severity}</span>
                </div>
                <p className="text-[10px] font-mono text-white/80 mb-2 leading-relaxed">{selectedNode.detail}</p>
                {selectedNode.actor && (
                    <div className="flex items-center gap-1 text-[8px] font-mono text-white/30">
                        <Terminal className="w-2.5 h-2.5" />
                        <span>Source: {selectedNode.actor}</span>
                    </div>
                )}
                {selectedNode.ttp_id && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[7px] font-mono">
                      <span className="px-1.5 py-0.5 rounded border border-warning/30 bg-warning/5 text-warning/70 font-bold">{selectedNode.ttp_id}</span>
                      <span className="text-white/25">{selectedNode.ttp_name}</span>
                    </div>
                )}
                {selectedNode.tactic && (
                    <div className="text-[7px] font-mono text-white/20 mt-0.5">Tactic: {selectedNode.tactic}</div>
                )}
              </motion.div>
            )}
          </div>

          {/* Terminal log */}
          {logLines.length > 0 && (
            <div className="border-t border-white/5 bg-black/20 p-3 flex-shrink-0">
              <div className="section-label mb-1.5">Correlation Log</div>
              <div className="space-y-0.5 max-h-16 overflow-y-auto custom-scrollbar">
                {logLines.map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    className="text-[9px] font-mono text-white/30">
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {nodes.length > 1 && (
            <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-mono text-white/25 uppercase tracking-[0.2em]">Correlation Cursor</span>
                <span className="text-[8px] font-mono text-white/35">{cursor + 1}/{nodes.length}</span>
                </div>
                <input
                type="range"
                min={0}
                max={nodes.length - 1}
                value={cursor}
                onChange={e => setCursor(Number(e.target.value))}
                className="w-full accent-[var(--accent-cyan)] h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                />
            </div>
          )}
        </div>

        {/* AI narrative panel */}
        <div className="w-72 flex flex-col gap-3 flex-shrink-0">
          <div className="glass-panel p-4 flex-1 flex flex-col border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="module-header">Intelligence Summary</span>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border border-primary/20 animate-ring-slow" />
                    <div className="absolute inset-0 rounded-full border-t border-primary animate-ring-fast" />
                  </div>
                  <span className="text-[9px] font-mono text-primary/60 uppercase tracking-widest text-center">{PHASES[phase]}</span>
                </motion.div>
              ) : timeline && !timeline.error ? (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn('w-3 h-3', timeline.severity === 'critical' ? 'text-critical' : 'text-warning')} />
                    <span className={cn('text-[9px] font-bold uppercase tracking-widest', timeline.severity === 'critical' ? 'text-critical' : 'text-warning')}>
                        {timeline.incident_id}
                    </span>
                    {timeline.ai_powered && <Badge variant="primary" className="text-[7px]">AI SYNTHESIZED</Badge>}
                  </div>

                  <Heading size="xs" className="text-[11px] leading-tight mb-1">{timeline.title}</Heading>

                  {timeline.summary && (
                    <div className="p-3 rounded bg-white/[0.02] border border-white/[0.05] flex-1">
                      <div className="text-[8px] text-white/20 uppercase tracking-widest mb-2 font-mono">Executive Narrative</div>
                      <p className="text-[10px] font-mono text-white/70 leading-relaxed">
                        {timeline.summary}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.05]">
                        <div className="text-[7px] text-white/20 uppercase tracking-widest mb-1">Dwell Time</div>
                        <div className="text-[10px] font-bold font-mono text-primary">{timeline.dwell_time}</div>
                    </div>
                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.05]">
                        <div className="text-[7px] text-white/20 uppercase tracking-widest mb-1">Links Correlated</div>
                        <div className="text-[10px] font-bold font-mono text-primary">{nodes.length}</div>
                    </div>
                  </div>

                  {/* Kill Chain Phases */}
                  {timeline.kill_chain_phases?.length > 0 && (
                    <div className="p-3 rounded bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[8px] text-white/20 uppercase tracking-widest mb-2">Kill Chain Progression</div>
                      <div className="flex flex-wrap gap-1">
                        {timeline.kill_chain_phases.map((phase, i) => (
                          <span key={i} className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary/70">
                            {phase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MITRE ATT&CK TTPs */}
                  {timeline.ttps?.length > 0 && (
                    <div className="p-3 rounded bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[8px] text-white/20 uppercase tracking-widest mb-2">MITRE ATT&CK TTPs</div>
                      <div className="space-y-1">
                        {timeline.ttps.map((ttp, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-[7px] font-mono font-bold text-warning/80 w-16 flex-shrink-0">{ttp.id}</span>
                            <span className="text-[7px] font-mono text-white/50 truncate">{ttp.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {timeline.attack_vector && (
                    <div className="p-3 rounded bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Primary Vector</div>
                      <div className="text-[9px] font-mono text-primary/80 leading-tight">{timeline.attack_vector}</div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }}
                  className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                  <GitMerge className="w-10 h-10 text-white/10" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Awaiting Correlation</div>
                    <div className="text-[9px] font-mono text-white/20 mt-1">Execute ARGUS Oracle to reconstruct chain</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
