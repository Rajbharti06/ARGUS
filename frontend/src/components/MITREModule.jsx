import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Shield, ChevronRight, ExternalLink, Activity } from 'lucide-react'

const TACTIC_COLORS = {
  'Reconnaissance':        '#6d8588',
  'Resource Development':  '#6d8588',
  'Initial Access':        '#FF3B5C',
  'Execution':             '#f97316',
  'Persistence':           '#a855f7',
  'Privilege Escalation':  '#a855f7',
  'Defense Evasion':       '#eab308',
  'Credential Access':     '#FF3B5C',
  'Discovery':             '#7ba3c4',
  'Lateral Movement':      '#FF3B5C',
  'Collection':            '#c8a96e',
  'Command and Control':   '#a855f7',
  'Exfiltration':          '#f97316',
  'Impact':                '#FF3B5C',
}

function TechCell({ tech, onClick, selected }) {
  const isSelected = selected?.id === tech.id
  const color = tech.detected
    ? (tech.severity === 'critical' ? '#FF3B5C' : tech.severity === 'high' ? '#f97316' : '#eab308')
    : 'rgba(255,255,255,0.04)'
  const textColor = tech.detected
    ? (tech.severity === 'critical' ? '#FF3B5C' : tech.severity === 'high' ? '#f97316' : '#eab308')
    : 'rgba(255,255,255,0.2)'

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      onClick={() => onClick(tech)}
      style={{
        background: tech.detected ? `${color}12` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? color : (tech.detected ? `${color}30` : 'rgba(255,255,255,0.04)')}`,
        borderRadius: 4,
        padding: '4px 5px',
        cursor: 'pointer',
        minHeight: 44,
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {tech.detected && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.8 }} />
      )}
      <div style={{
        fontFamily: 'JetBrains Mono', fontSize: '0.37rem', fontWeight: 700,
        color: textColor, marginBottom: 2,
      }}>
        {tech.id}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono', fontSize: '0.36rem', color: textColor,
        lineHeight: 1.3, opacity: tech.detected ? 1 : 0.7,
      }}>
        {tech.name}
      </div>
    </motion.div>
  )
}

function CoverageBar({ tactic }) {
  const pct = Math.round(tactic.detected / tactic.total * 100)
  const color = TACTIC_COLORS[tactic.tactic] || '#6d8588'
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.5)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tactic.tactic}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color }}>
          {tactic.detected}/{tactic.total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 999 }}
        />
      </div>
    </div>
  )
}

export default function MITREModule() {
  const [matrix,   setMatrix]   = useState({ matrix: [], coverage_pct: 0, detected_count: 0, total_techniques: 0 })
  const [coverage, setCoverage] = useState([])
  const [selected, setSelected] = useState(null)
  const [selTactic,setSelTactic]= useState(null)
  const [activeTab,setActiveTab]= useState('matrix')
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch('/api/mitre/matrix'),
        fetch('/api/mitre/coverage'),
      ])
      const [m, c] = await Promise.all([mRes.json(), cRes.json()])
      setMatrix(m)
      setCoverage(c.coverage || [])
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load(); }, [load])

  const detectedTechs = matrix.matrix?.flatMap(t => t.techniques.filter(tc => tc.detected)) || []

  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['Tactics Covered',    matrix.tactics_count || 14, '#7ba3c4'],
          ['Total Techniques',   matrix.total_techniques || '—', 'rgba(200,205,214,0.6)'],
          ['Detected Techniques',matrix.detected_count || '—', '#f97316'],
          ['Detection Coverage', matrix.coverage_pct ? `${matrix.coverage_pct}%` : '—', matrix.coverage_pct >= 60 ? '#6b9e7a' : '#f97316'],
        ].map(([l,v,c]) => (
          <div key={l} className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 3 }}>{l}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Coverage grade */}
      <div className="p-3 rounded-xl flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.1rem', fontWeight: 900, color: '#f97316' }}>{matrix.coverage_grade || 'C'}</span>
        </div>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
            Detection Coverage Grade: {matrix.coverage_grade || 'C'} — {matrix.coverage_pct || 0}% of MITRE ATT&CK techniques monitored
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {matrix.detected_count} of {matrix.total_techniques} techniques detected · {(matrix.total_techniques || 0) - (matrix.detected_count || 0)} blind spots remaining
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {[
          { id: 'matrix',   label: 'ATT&CK Matrix'  },
          { id: 'coverage', label: 'Coverage by Tactic' },
          { id: 'detected', label: `Detected (${detectedTechs.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1.5 rounded-md transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: activeTab === tab.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              fontFamily: 'JetBrains Mono', fontSize: '0.5rem', fontWeight: activeTab === tab.id ? 700 : 400,
              textTransform: 'uppercase', letterSpacing: '0.14em', border: 'none', cursor: 'pointer',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {activeTab === 'matrix' && (
            <div>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Legend:</span>
                {[['Detected Critical','#FF3B5C'],['Detected High','#f97316'],['Detected Medium','#eab308'],['Not Detected','rgba(255,255,255,0.1)']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: c, border: `1px solid ${c}` }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.3)' }}>{l}</span>
                  </div>
                ))}
              </div>

              {/* Matrix grid */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${matrix.matrix?.length || 14}, minmax(110px, 1fr))`, gap: 4, minWidth: 1400 }}>
                  {matrix.matrix?.map(tactic => {
                    const color = TACTIC_COLORS[tactic.tactic] || '#6d8588'
                    const detectedCount = tactic.techniques.filter(t => t.detected).length
                    return (
                      <div key={tactic.id}>
                        {/* Tactic header */}
                        <div
                          className="text-center py-2 px-1 rounded-t-md mb-1 cursor-pointer"
                          style={{
                            background: selTactic === tactic.id ? `${color}20` : `${color}10`,
                            border: `1px solid ${color}35`,
                          }}
                          onClick={() => setSelTactic(selTactic === tactic.id ? null : tactic.id)}
                        >
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1.3 }}>
                            {tactic.tactic}
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.35rem', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                            {detectedCount}/{tactic.techniques.length}
                          </div>
                        </div>
                        {/* Techniques */}
                        <div className="space-y-0.5">
                          {tactic.techniques.map(tech => (
                            <TechCell key={tech.id} tech={tech} onClick={setSelected} selected={selected} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Selected technique detail */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: selected.detected ? `rgba(255,59,92,0.06)` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selected.detected ? 'rgba(255,59,92,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', fontWeight: 800, color: selected.detected ? '#FF3B5C' : '#7ba3c4' }}>{selected.id}</span>
                          {selected.detected && (
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', fontWeight: 700, color: '#FF3B5C', background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.25)', padding: '1px 6px', borderRadius: 2 }}>
                              ▲ DETECTED
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{selected.name}</div>
                      </div>
                      <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
                    </div>
                    <div className="mt-2">
                      <a
                        href={`https://attack.mitre.org/techniques/${selected.id.replace('.', '/')}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: '#7ba3c4', textDecoration: 'none' }}
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        View on MITRE ATT&CK
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'coverage' && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 16 }}>
                Detection Coverage by Tactic
              </div>
              {coverage.map(t => <CoverageBar key={t.tactic} tactic={t} />)}
            </div>
          )}

          {activeTab === 'detected' && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
                Detected Techniques ({detectedTechs.length}) — Active in Environment
              </div>
              <div className="grid grid-cols-2 gap-2">
                {detectedTechs.map(tech => {
                  const color = tech.severity === 'critical' ? '#FF3B5C' : tech.severity === 'high' ? '#f97316' : '#eab308'
                  return (
                    <div key={tech.id} className="flex items-center gap-3 py-2 px-3 rounded-md"
                      style={{ background: `${color}06`, border: `1px solid ${color}20` }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: color }} />
                      <div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color }}>{tech.id}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.5)' }}>{tech.name}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color, background: `${color}10`, border: `1px solid ${color}20`, padding: '1px 5px', borderRadius: 2 }}>
                        {tech.severity}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
