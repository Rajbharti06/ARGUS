import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ZoomIn, ZoomOut, Move, Maximize2, Search, Filter, Clock,
  MapPin, Users, ShieldAlert, Download, Plus, Minus, Eye,
  Link2, MoreHorizontal, X, Terminal, Activity, AlertTriangle,
  RefreshCcw, GitMerge, Zap, Brain, Database, Network,
  Shield, Cpu, Globe, Satellite, Sparkles, Target
} from 'lucide-react'
import { cn } from '../utils/cn'

const KNOWLEDGE_GRAPH = {
  entities: [
    { id: 'e1', type: 'person', label: 'Prof. Johnson', x: 200, y: 150, status: 'compromised', metadata: { role: 'Faculty', department: 'Computer Science' } },
    { id: 'e2', type: 'ip', label: '203.45.12.88', x: 400, y: 100, status: 'malicious', metadata: { country: 'China', city: 'Beijing', isp: 'China Telecom' } },
    { id: 'e3', type: 'system', label: 'Student DB', x: 350, y: 300, status: 'breached', metadata: { records: 89241, sensitivity: 'High' } },
    { id: 'e4', type: 'domain', label: 'univ-hr-update.net', x: 150, y: 280, status: 'suspicious', metadata: { age: '2 days', registrar: 'Namecheap' } },
    { id: 'e5', type: 'ip', label: '185.220.101.14', x: 500, y: 250, status: 'malicious', metadata: { country: 'Romania', city: 'Bucharest' } },
    { id: 'e6', type: 'file', label: 'research-data.zip', x: 280, y: 400, status: 'exfiltrated', metadata: { size: '2.4 GB', hash: 'sha256:abc123...' } },
    { id: 'e7', type: 'system', label: 'Admin Dashboard', x: 550, y: 150, status: 'accessed', metadata: { privileges: 'Root' } },
  ],
  relationships: [
    { from: 'e4', to: 'e1', type: 'phished', label: 'Phishing Email', confidence: 95 },
    { from: 'e1', to: 'e2', type: 'authenticated', label: 'Login', confidence: 98 },
    { from: 'e2', to: 'e7', type: 'accessed', label: 'Admin Access', confidence: 92 },
    { from: 'e7', to: 'e3', type: 'queried', label: 'Data Access', confidence: 89 },
    { from: 'e3', to: 'e6', type: 'exported', label: 'Data Export', confidence: 94 },
    { from: 'e6', to: 'e5', type: 'sent', label: 'Exfiltration', confidence: 96 },
  ],
  timeline: [
    { time: '08:30', entity: 'e4', event: 'Phishing email delivered', severity: 'high' },
    { time: '09:15', entity: 'e1', event: 'Credentials entered', severity: 'critical' },
    { time: '09:45', entity: 'e2', event: 'Login from Beijing', severity: 'critical' },
    { time: '10:00', entity: 'e7', event: 'Admin dashboard accessed', severity: 'critical' },
    { time: '10:05', entity: 'e3', event: 'Database accessed', severity: 'critical' },
    { time: '10:30', entity: 'e6', event: 'Data staged for exfil', severity: 'high' },
    { time: '11:00', entity: 'e5', event: 'Exfiltration attempt', severity: 'critical' },
    { time: '11:32', entity: 'e6', event: 'Containment triggered', severity: 'medium' },
  ]
}

const ENTITY_STYLES = {
  person: { color: '#00D1FF', icon: Users },
  ip: { color: '#FF3B5C', icon: MapPin },
  system: { color: '#FFA500', icon: ShieldAlert },
  domain: { color: '#FF6B9D', icon: Link2 },
  file: { color: '#4ADE80', icon: Download },
}

function getEntityById(id) {
  return KNOWLEDGE_GRAPH.entities.find(e => e.id === id)
}

function LinkChart({ selectedEntity, onSelectEntity, zoom, pan }) {
  const svgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [localPan, setLocalPan] = useState(pan)

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'rect') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - localPan.x, y: e.clientY - localPan.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setLocalPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      viewBox="0 0 700 500"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </pattern>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.2)" />
        </marker>
      </defs>

      <g transform={`translate(${350 + localPan.x}, ${250 + localPan.y}) scale(${zoom})`}>
        <rect x="-1000" y="-1000" width="2000" height="2000" fill="url(#grid)" />

        {KNOWLEDGE_GRAPH.relationships.map((rel, i) => {
          const from = getEntityById(rel.from)
          const to = getEntityById(rel.to)
          if (!from || !to) return null

          const dx = to.x - from.x
          const dy = to.y - from.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const nx = dx / dist
          const ny = dy / dist

          return (
            <g key={i}>
              <line
                x1={from.x + nx * 28}
                y1={from.y + ny * 28}
                x2={to.x - nx * 28}
                y2={to.y - ny * 28}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                fontFamily="monospace"
              >
                {rel.label}
              </text>
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 + 18}
                textAnchor="middle"
                fill="rgba(139,174,180,0.5)"
                fontSize="8"
                fontFamily="monospace"
              >
                {rel.confidence}%
              </text>
            </g>
          )
        })}

        {KNOWLEDGE_GRAPH.entities.map((entity) => {
          const style = ENTITY_STYLES[entity.type]
          const isSelected = selectedEntity?.id === entity.id
          const Icon = style.icon

          return (
            <g
              key={entity.id}
              transform={`translate(${entity.x}, ${entity.y})`}
              onClick={(e) => { e.stopPropagation(); onSelectEntity(entity); }}
              style={{ cursor: 'pointer' }}
            >
              <motion.circle
                r={isSelected ? 34 : 28}
                fill={isSelected ? `${style.color}25` : 'rgba(255,255,255,0.03)'}
                stroke={style.color}
                strokeWidth={isSelected ? 3 : 1.5}
                animate={{ r: isSelected ? [34, 37, 34] : 28 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <circle r="24" fill="rgba(0,0,0,0.6)" stroke={style.color} strokeWidth="1" />
              <Icon className="w-6 h-6" style={{ color: style.color }} transform="translate(-12, -12)" />
              <text
                y="48"
                textAnchor="middle"
                fill="rgba(255,255,255,0.8)"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {entity.label}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function TimelineView({ selectedEntity, onSelectEntity }) {
  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {KNOWLEDGE_GRAPH.timeline.map((event, i) => {
          const entity = getEntityById(event.entity)
          const entityStyle = entity ? ENTITY_STYLES[entity.type] : null

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-5 mb-5"
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2',
                    event.severity === 'critical' ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                    event.severity === 'high' ? 'bg-orange-500 border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                    'bg-yellow-500 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                  )}
                />
                {i < KNOWLEDGE_GRAPH.timeline.length - 1 && (
                  <div className="w-px flex-1 bg-white/10 mt-1.5" />
                )}
              </div>
              <div
                className="flex-1 pb-5 cursor-pointer hover:bg-white/[0.03] -ml-3 pl-3 -mr-3 pr-3 rounded-lg"
                onClick={() => entity && onSelectEntity(entity)}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-mono text-cyan-400 font-bold">{event.time}</span>
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold',
                    event.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    event.severity === 'high' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                    'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  )}>
                    {event.severity}
                  </span>
                </div>
                <p className="text-sm text-white/80 font-semibold">{event.event}</p>
                {entity && (
                  <div className="flex items-center gap-2.5 mt-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entityStyle.color, boxShadow: `0 0 6px ${entityStyle.color}` }}
                    />
                    <span className="text-xs text-white/50 font-mono">{entity.label}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function TableView({ selectedEntity, onSelectEntity }) {
  return (
    <div className="w-full h-full p-5 overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-white/40 border-b border-white/10 bg-[#0c1018]">
          <tr>
            <th className="pb-3.5 pr-4 font-normal">Entity</th>
            <th className="pb-3.5 pr-4 font-normal">Type</th>
            <th className="pb-3.5 pr-4 font-normal">Status</th>
            <th className="pb-3.5 pr-4 font-normal">Metadata</th>
            <th className="pb-3.5 font-normal">First Seen</th>
          </tr>
        </thead>
        <tbody className="text-white/60">
          {KNOWLEDGE_GRAPH.entities.map((entity) => (
            <tr
              key={entity.id}
              className="border-b border-white/5 hover:bg-white/[0.05] cursor-pointer"
              onClick={() => onSelectEntity(entity)}
            >
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ENTITY_STYLES[entity.type].color, boxShadow: `0 0 6px ${ENTITY_STYLES[entity.type].color}` }}
                  />
                  <span className="text-white/85 font-semibold">{entity.label}</span>
                </div>
              </td>
              <td className="py-3.5 pr-4 capitalize font-semibold">{entity.type}</td>
              <td className="py-3.5 pr-4">
                <span className={cn(
                  'px-2.5 py-1 rounded text-[10px] uppercase font-bold',
                  entity.status === 'compromised' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  entity.status === 'malicious' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  entity.status === 'breached' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                  entity.status === 'suspicious' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                )}>
                  {entity.status}
                </span>
              </td>
              <td className="py-3.5 pr-4 text-[10px] text-white/45">
                {entity.metadata && Object.entries(entity.metadata).slice(0, 2).map(([k, v]) => (
                  <span key={k} className="mr-3 font-semibold">{k}: {v}</span>
                ))}
              </td>
              <td className="py-3.5 font-mono text-white/40 text-[10px]">08:30 UTC</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EntityPanel({ entity, onClose }) {
  if (!entity) return null

  const style = ENTITY_STYLES[entity.type]
  const Icon = style.icon

  const relatedRelationships = KNOWLEDGE_GRAPH.relationships.filter(
    r => r.from === entity.id || r.to === entity.id
  )

  const relatedTimeline = KNOWLEDGE_GRAPH.timeline.filter(
    t => t.entity === entity.id
  )

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l border-white/10 bg-[#0c121a] overflow-hidden flex-shrink-0"
    >
      <div className="w-90 h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0d1520]">
          <h2 className="text-xs font-mono font-bold tracking-[0.15em] text-white/75 uppercase">
            ENTITY DETAILS
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-7">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${style.color}25`,
                border: `2px solid ${style.color}`,
                boxShadow: `0 0 20px ${style.color}40`
              }}
            >
              <Icon className="w-8 h-8" style={{ color: style.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white/90">{entity.label}</h3>
              <p className="text-xs text-white/50 capitalize font-semibold">{entity.type}</p>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-mono font-bold tracking-[0.15em] text-white/55 uppercase mb-2.5">
              STATUS
            </h4>
            <span className={cn(
              'px-3 py-1.5 rounded text-xs uppercase border font-bold',
              entity.status === 'compromised' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
              entity.status === 'malicious' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
              entity.status === 'breached' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
              entity.status === 'suspicious' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            )}>
              {entity.status}
            </span>
          </div>

          {entity.metadata && (
            <div>
              <h4 className="text-[10px] font-mono font-bold tracking-[0.15em] text-white/55 uppercase mb-2.5">
                METADATA
              </h4>
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 space-y-2.5">
                {Object.entries(entity.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-[10px] text-white/45 uppercase font-bold">{key}</span>
                    <span className="text-[10px] text-white/80 font-mono font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relatedRelationships.length > 0 && (
            <div>
              <h4 className="text-[10px] font-mono font-bold tracking-[0.15em] text-white/55 uppercase mb-2.5">
                RELATIONSHIPS ({relatedRelationships.length})
              </h4>
              <div className="space-y-2.5">
                {relatedRelationships.map((rel, i) => {
                  const otherId = rel.from === entity.id ? rel.to : rel.from
                  const other = getEntityById(otherId)
                  const direction = rel.from === entity.id ? '→' : '←'

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] border border-white/5 rounded-lg cursor-pointer hover:bg-white/[0.06] transition-colors"
                      onClick={() => onClose()}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ENTITY_STYLES[other.type].color, boxShadow: `0 0 6px ${ENTITY_STYLES[other.type].color}` }}
                      />
                      <span className="text-xs text-white/45">{direction}</span>
                      <span className="text-xs text-white/75 font-semibold">{other.label}</span>
                      <span className="text-xs text-white/45 ml-auto font-mono">{rel.type}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {relatedTimeline.length > 0 && (
            <div>
              <h4 className="text-[10px] font-mono font-bold tracking-[0.15em] text-white/55 uppercase mb-2.5">
                TIMELINE EVENTS
              </h4>
              <div className="space-y-2.5">
                {relatedTimeline.map((event, i) => (
                  <div key={i} className="p-2.5 bg-white/[0.03] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{event.time}</span>
                      <span className={cn(
                        'text-[8px] px-1.5 py-0.5 rounded uppercase font-bold',
                        event.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                        event.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      )}>
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-xs text-white/70">{event.event}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 space-y-2.5 bg-[#0d1520]">
          <button className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2">
            <Target className="w-3.5 h-3.5" />
            ADD TO INVESTIGATION
          </button>
          <button className="w-full py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            VIEW FULL HISTORY
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function OracleModule({ soundOn, activated }) {
  const [view, setView] = useState('graph')
  const [zoom, setZoom] = useState(1)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [loading, setLoading] = useState(false)
  const [timelineData, setTimelineData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const runCorrelation = async () => {
    setLoading(true)
    setTimelineData(null)

    try {
      const res = await fetch('/api/argus/oracle/timeline')
      const data = await res.json()
      setTimelineData(data)
    } catch {
      setTimelineData({ error: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runCorrelation()
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#0a0e14]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f1520]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <GitMerge className="w-5 h-5 text-[#8baeb4]" />
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-base font-bold tracking-[0.3em] text-white/90 uppercase">
              ORACLE
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono px-2.5 py-0.5 rounded border border-[#8baeb4]/30 text-[#8baeb4]/90 tracking-widest bg-[#8baeb4]/10">
                CORRELATION
              </span>
              <span className="text-[8px] font-mono px-2.5 py-0.5 rounded border border-purple-500/30 text-purple-400/90 tracking-widest bg-purple-500/10">
                INVESTIGATION
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[9px] font-mono text-[rgba(228,232,236,0.45)] border border-white/6 rounded-lg px-3.5 py-2 bg-[#0c1018]/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ORACLE ENGINE ONLINE
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search entities, events, IOCs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 focus:outline-none focus:border-cyan-500/50 w-72"
            />
          </div>
          <button onClick={runCorrelation} disabled={loading}
            className="flex items-center gap-2.5 bg-[#8baeb4]/10 border border-[#8baeb4]/30 hover:bg-[#8baeb4]/15 text-[#8baeb4] px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40">
            {loading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {loading ? 'CORRELATING...' : 'RUN CORRELATION'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-white/10 bg-[#0c121a] flex flex-col">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-xs font-bold tracking-[0.15em] text-white/60 uppercase mb-3.5">
              VIEW MODES
            </h2>
            <div className="space-y-1.5">
              {[
                { id: 'graph', label: 'LINK CHART', icon: Network },
                { id: 'timeline', label: 'TIMELINE', icon: Clock },
                { id: 'table', label: 'ENTITIES', icon: Database },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setView(mode.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs transition-colors',
                    view === mode.id
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                  )}
                >
                  <mode.icon className="w-4 h-4" />
                  <span className="tracking-wide font-semibold">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 border-b border-white/10 flex-1 overflow-y-auto">
            <h2 className="text-xs font-bold tracking-[0.15em] text-white/60 uppercase mb-3.5">
              ENTITY TYPES
            </h2>
            <div className="space-y-1.5">
              {Object.entries(ENTITY_STYLES).map(([type, style]) => (
                <div key={type} className="flex items-center gap-2.5 px-3.5 py-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: style.color, boxShadow: `0 0 6px ${style.color}` }}
                  />
                  <span className="text-white/45 capitalize text-xs font-semibold">{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <h2 className="text-xs font-bold tracking-[0.15em] text-white/60 uppercase mb-3.5">
              ENTITIES ({KNOWLEDGE_GRAPH.entities.length})
            </h2>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {KNOWLEDGE_GRAPH.entities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => setSelectedEntity(entity)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors',
                    selectedEntity?.id === entity.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  )}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ENTITY_STYLES[entity.type].color, boxShadow: `0 0 6px ${ENTITY_STYLES[entity.type].color}` }}
                  />
                  <span className="truncate font-semibold">{entity.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d141c]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-white/50" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <ZoomOut className="w-4 h-4 text-white/50" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-white/50" />
              </button>
              <span className="text-xs text-white/45 ml-2 font-mono font-bold">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white/45">
              <Move className="w-3.5 h-3.5" />
              <span>DRAG TO PAN</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-[#0a0e14]">
            <AnimatePresence mode="wait">
              {view === 'graph' && (
                <motion.div
                  key="graph"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <LinkChart
                    selectedEntity={selectedEntity}
                    onSelectEntity={setSelectedEntity}
                    zoom={zoom}
                    pan={{ x: 0, y: 0 }}
                  />
                </motion.div>
              )}

              {view === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <TimelineView
                    selectedEntity={selectedEntity}
                    onSelectEntity={setSelectedEntity}
                  />
                </motion.div>
              )}

              {view === 'table' && (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <TableView
                    selectedEntity={selectedEntity}
                    onSelectEntity={setSelectedEntity}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selectedEntity && (
            <EntityPanel
              entity={selectedEntity}
              onClose={() => setSelectedEntity(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
