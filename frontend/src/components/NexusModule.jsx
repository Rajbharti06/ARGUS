import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, Users, Globe, Bug, Target, Server, RefreshCcw, AlertTriangle, ChevronRight, Cpu, Activity } from 'lucide-react'

const TYPE_ICONS = {
  ip:      Globe,
  domain:  Globe,
  user:    Users,
  malware: Bug,
  ttp:     Target,
  asset:   Server,
  incident:AlertTriangle,
}

const SEV_COLOR = { critical: '#FF3B5C', high: '#f97316', medium: '#eab308', low: '#6b9e7a' }

/* ── Force-directed layout (simple spring simulation) ─────────────────────── */
function useForceLayout(nodes, edges, width, height) {
  const [positions, setPositions] = useState({})

  useEffect(() => {
    if (!nodes.length) return

    // Initialize positions in a radial layout
    const pos = {}
    const centerX = width / 2
    const centerY = height / 2
    const radius  = Math.min(width, height) * 0.35

    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      pos[n.id] = {
        x: centerX + radius * Math.cos(angle) * (0.5 + Math.random() * 0.5),
        y: centerY + radius * Math.sin(angle) * (0.5 + Math.random() * 0.5),
        vx: 0,
        vy: 0,
      }
    })

    // Run spring simulation
    const K_REPEL  = 8000
    const K_SPRING = 0.06
    const DAMPING  = 0.82
    const REST_LEN = 130

    let current = { ...pos }

    for (let iter = 0; iter < 180; iter++) {
      const force = {}
      nodes.forEach(n => { force[n.id] = { x: 0, y: 0 } })

      // Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i].id, b = nodes[j].id
          const dx = current[a].x - current[b].x
          const dy = current[a].y - current[b].y
          const dist2 = dx * dx + dy * dy + 1
          const dist  = Math.sqrt(dist2)
          const f     = K_REPEL / dist2
          force[a].x += (dx / dist) * f
          force[a].y += (dy / dist) * f
          force[b].x -= (dx / dist) * f
          force[b].y -= (dy / dist) * f
        }
      }

      // Spring attraction for edges
      edges.forEach(e => {
        const a = e.source, b = e.target
        if (!current[a] || !current[b]) return
        const dx   = current[b].x - current[a].x
        const dy   = current[b].y - current[a].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const f    = K_SPRING * (dist - REST_LEN)
        force[a].x += (dx / dist) * f
        force[a].y += (dy / dist) * f
        force[b].x -= (dx / dist) * f
        force[b].y -= (dy / dist) * f
      })

      // Center gravity
      nodes.forEach(n => {
        force[n.id].x += (centerX - current[n.id].x) * 0.01
        force[n.id].y += (centerY - current[n.id].y) * 0.01
      })

      // Integrate
      nodes.forEach(n => {
        const id = n.id
        current[id].vx = (current[id].vx + force[id].x) * DAMPING
        current[id].vy = (current[id].vy + force[id].y) * DAMPING
        current[id].x  = Math.max(40, Math.min(width  - 40, current[id].x + current[id].vx))
        current[id].y  = Math.max(40, Math.min(height - 40, current[id].y + current[id].vy))
      })
    }

    setPositions(current)
  }, [nodes.length, edges.length, width, height])

  return positions
}

/* ── Entity Graph SVG ─────────────────────────────────────────────────────── */
function EntityGraph({ graph, onSelect, selected }) {
  const svgRef = useRef(null)
  const [dims, setDims]   = useState({ w: 800, h: 520 })
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    if (svgRef.current) obs.observe(svgRef.current.parentElement)
    return () => obs.disconnect()
  }, [])

  const positions = useForceLayout(graph.nodes || [], graph.edges || [], dims.w, dims.h)

  if (!graph.nodes?.length) return null

  return (
    <svg
      ref={svgRef}
      width={dims.w}
      height={dims.h}
      style={{ background: 'transparent', cursor: 'default' }}
    >
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(255,255,255,0.2)" />
        </marker>
        {graph.nodes.map(n => (
          <radialGradient key={n.id} id={`grd-${n.id}`}>
            <stop offset="0%"   stopColor={n.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={n.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Edges */}
      {graph.edges.map((e, i) => {
        const a = positions[e.source], b = positions[e.target]
        if (!a || !b) return null
        const isHigh = e.source === selected?.id || e.target === selected?.id ||
                       e.source === hovered?.id  || e.target === hovered?.id
        return (
          <g key={i}>
            <line
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={isHigh ? e.color : 'rgba(255,255,255,0.07)'}
              strokeWidth={isHigh ? 1.5 : 0.8}
              strokeDasharray={e.dashed ? '4 3' : undefined}
              markerEnd="url(#arr)"
              opacity={isHigh ? 0.9 : 0.4}
              style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
            />
            {isHigh && (
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 5}
                textAnchor="middle"
                style={{ fontSize: '7px', fill: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {e.relation.replace(/_/g, ' ')}
              </text>
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {graph.nodes.map(n => {
        const p = positions[n.id]
        if (!p) return null
        const r     = n.size || 12
        const isSel = selected?.id === n.id
        const isHov = hovered?.id  === n.id
        const active = isSel || isHov
        return (
          <g
            key={n.id}
            transform={`translate(${p.x},${p.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
          >
            {active && (
              <circle r={r + 10} fill={`url(#grd-${n.id})`} />
            )}
            <circle
              r={r}
              fill={active ? n.color : 'rgba(20,22,30,0.9)'}
              stroke={n.color}
              strokeWidth={isSel ? 2.5 : active ? 1.5 : 0.8}
              opacity={active ? 1 : 0.75}
              style={{ transition: 'all 0.2s' }}
            />
            {n.risk === 'critical' && (
              <circle r={3} cx={r - 3} cy={-(r - 3)} fill="#FF3B5C" />
            )}
            <text
              y={r + 12}
              textAnchor="middle"
              style={{
                fontSize:   active ? '9px' : '7.5px',
                fill:       active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: active ? 700 : 400,
                pointerEvents: 'none',
                transition: 'all 0.2s',
              }}
            >
              {n.label.length > 18 ? n.label.slice(0, 16) + '…' : n.label}
            </text>
            <text
              y={r + 21}
              textAnchor="middle"
              style={{ fontSize: '6.5px', fill: n.color, fontFamily: 'JetBrains Mono, monospace', opacity: 0.7 }}
            >
              {n.type.toUpperCase()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Entity Detail Panel ──────────────────────────────────────────────────── */
function EntityDetail({ node, onClose }) {
  if (!node) return null
  const Icon = TYPE_ICONS[node.type] || Globe
  const fields = Object.entries(node).filter(([k]) =>
    !['id','color','icon','type','size','degree'].includes(k)
  )
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0,  opacity: 1 }}
      exit={{    x: 40, opacity: 0 }}
      style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 280,
        background: 'rgba(8,9,13,0.97)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        padding: '16px 14px',
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: `${node.color}18`, border: `1px solid ${node.color}40` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: node.color }} />
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.52rem', color: node.color,
                          textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              {node.type}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
              {node.label}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono' }}>✕</button>
      </div>

      <div className="space-y-1.5">
        {fields.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-2 py-1"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.25)',
                           textTransform: 'uppercase', letterSpacing: '0.18em', flexShrink: 0 }}>
              {k.replace(/_/g, ' ')}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem',
                           color: k === 'risk' ? SEV_COLOR[v] || 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.55)',
                           wordBreak: 'break-all', textAlign: 'right', maxWidth: '160px' }}>
              {String(v)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.25)',
                      textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>
          Graph Degree
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', fontWeight: 700, color: node.color }}>
          {node.degree ?? 0} connections
        </div>
      </div>
    </motion.div>
  )
}

/* ── Stats Card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, color }) {
  return (
    <div className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)',
                    textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: color || 'rgba(200,205,214,0.8)' }}>
        {value}
      </div>
    </div>
  )
}

/* ── Agent Pulse Row ──────────────────────────────────────────────────────── */
function AgentRow({ agent }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-md"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 2 }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: agent.status === 'ACTIVE' ? agent.color : '#6d8588' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', fontWeight: 700, color: agent.color }}>
            {agent.name}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)',
                         border: `1px solid ${agent.color}30`, padding: '0 4px', borderRadius: 2 }}>
            {agent.status}
          </span>
        </div>
        <div className="truncate" style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)' }}>
          {agent.task}
        </div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
        {agent.cpu}%
      </span>
    </div>
  )
}

/* ── Main Module ──────────────────────────────────────────────────────────── */
export default function NexusModule() {
  const [graph, setGraph]     = useState({ nodes: [], edges: [] })
  const [agents, setAgents]   = useState({ agents: [], swarms: [], total_agents: 0 })
  const [consensus, setCons]  = useState({ log: [] })
  const [stats, setStats]     = useState(null)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('graph')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [gRes, aRes, cRes, sRes] = await Promise.all([
        fetch('/api/nexus/graph'),
        fetch('/api/nexus/agents'),
        fetch('/api/nexus/consensus'),
        fetch('/api/nexus/graph/stats'),
      ])
      const [g, a, c, s] = await Promise.all([gRes.json(), aRes.json(), cRes.json(), sRes.json()])
      setGraph(g)
      setAgents(a)
      setCons(c)
      setStats(s)
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [load])

  const TABS = [
    { id: 'graph',    label: 'Entity Graph',    icon: Network },
    { id: 'agents',   label: 'Agent Swarm',     icon: Cpu },
    { id: 'consensus',label: 'Raft Consensus',  icon: Activity },
  ]

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Entities Tracked"   value={stats?.total_entities  || graph.node_count || '—'} color="#7ba3c4" />
        <StatCard label="Relationships"       value={stats?.total_relations || graph.edge_count || '—'} color="#eab308" />
        <StatCard label="Critical Nodes"      value={stats?.critical_nodes  || '—'} color="#FF3B5C" />
        <StatCard label="Active Agents"       value={agents.total_agents    || '—'} color="#6b9e7a" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: activeTab === tab.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.5rem',
              fontWeight: activeTab === tab.id ? 700 : 400,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {activeTab === 'graph' && (
            <div className="rounded-xl relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', height: 540 }}>

              {/* Legend */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                {[['IP / Host','#FF3B5C'],['Domain','#f97316'],['User','#7ba3c4'],['Malware','#a855f7'],['TTP','#eab308'],['Asset','#6b9e7a'],['Incident','#ef4444']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>{l}</span>
                  </div>
                ))}
              </div>

              {/* Title */}
              <div className="absolute top-3 right-3 z-10" style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.24em' }}>
                LIVE ENTITY GRAPH · {graph.node_count || 0} NODES · {graph.edge_count || 0} EDGES
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-full" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.55rem' }}>
                  COMPUTING GRAPH LAYOUT…
                </div>
              ) : (
                <EntityGraph graph={graph} onSelect={setSelected} selected={selected} />
              )}

              <AnimatePresence>
                {selected && <EntityDetail node={selected} onClose={() => setSelected(null)} />}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="grid grid-cols-2 gap-4">
              {agents.swarms?.map(swarm => {
                const swarmAgents = agents.agents?.filter(a => a.swarm === swarm.id) || []
                return (
                  <div key={swarm.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: swarm.status === 'active' ? swarm.color : '#6d8588' }} />
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: swarm.color }}>{swarm.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto', textTransform: 'uppercase' }}>{swarm.agents} agents</span>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                      {swarm.mission}
                    </div>
                    <div className="space-y-0.5">
                      {swarmAgents.map(a => <AgentRow key={a.id} agent={a} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'consensus' && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 4 }}>
                    Raft Consensus Engine
                  </div>
                  <div className="flex items-center gap-4">
                    {[
                      ['Leader', consensus.leader || '—', '#6b9e7a'],
                      ['Term',   String(consensus.term || '—'), '#eab308'],
                      ['Quorum', consensus.quorum || '—', '#7ba3c4'],
                      ['Heartbeat', `${consensus.heartbeat_ms || '—'}ms`, '#a855f7'],
                    ].map(([l,v,c]) => (
                      <div key={l}>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{l}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', fontWeight: 700, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {consensus.log?.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 py-2 px-3 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${entry.color}15` }}
                  >
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.45rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{entry.ts}</span>
                    <div className="flex-1">
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color: entry.color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                        {entry.event}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                        {entry.decision}
                      </div>
                    </div>
                    <div className="flex-shrink-0 px-2 py-0.5 rounded" style={{ background: `${entry.color}15`, border: `1px solid ${entry.color}30` }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color: entry.color }}>{entry.confidence}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
