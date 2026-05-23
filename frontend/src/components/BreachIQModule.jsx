import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Shield, AlertTriangle, DollarSign, RefreshCcw, ExternalLink, ChevronRight } from 'lucide-react'

/* ── Gauge ───────────────────────────────────────────────────────────────── */
function GaugeRing({ pct, color, label, sublabel, size = 110 }) {
  const r   = size / 2 - 10
  const circ = 2 * Math.PI * r
  const arc  = circ * 0.75
  const off  = arc * (1 - pct / 100)
  const start= 225 * (Math.PI / 180)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={7}
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${size/2} ${size/2})`}
        />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${arc - off} ${circ - (arc - off)}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
          opacity={0.85}
        />
        <text x={size/2} y={size/2 - 6} textAnchor="middle"
          style={{ fontFamily: 'JetBrains Mono', fontSize: size >= 110 ? '18px' : '14px', fontWeight: 800, fill: color }}>
          {pct}%
        </text>
        <text x={size/2} y={size/2 + 12} textAnchor="middle"
          style={{ fontFamily: 'JetBrains Mono', fontSize: '7px', fill: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
          {sublabel}
        </text>
      </svg>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

/* ── Framework Bar ───────────────────────────────────────────────────────── */
function FrameworkBar({ fw, onClick, active }) {
  const grade = fw.grade
  const gradeColor = { A: '#6b9e7a', B: '#7ba3c4', C: '#eab308', D: '#f97316', F: '#FF3B5C' }[grade]
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(fw)}
      style={{
        background: active ? `${fw.color}08` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? fw.color + '35' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8, padding: '10px 12px', cursor: 'pointer', marginBottom: 6,
        transition: 'all 0.15s',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${fw.color}15`, border: `1px solid ${fw.color}30` }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 900, color: gradeColor }}>{grade}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.48rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{fw.name}</div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fw.score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: fw.color, borderRadius: 999 }}
            />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 800, color: fw.color }}>{fw.score}%</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>{fw.passing}/{fw.controls} controls</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── CVE Row ─────────────────────────────────────────────────────────────── */
function CVERow({ cve }) {
  return (
    <div className="py-2 px-3 mb-1.5 rounded-md" style={{ background: `${cve.color}06`, border: `1px solid ${cve.color}20` }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.52rem', fontWeight: 700, color: cve.color }}>{cve.id}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color: cve.color, marginTop: 2 }}>
            CVSS {cve.score} · {cve.severity}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.45rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            {cve.description}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {cve.weaknesses?.map(w => (
              <span key={w} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: cve.color,
                background: `${cve.color}10`, border: `1px solid ${cve.color}25`, padding: '1px 5px', borderRadius: 2 }}>
                {w}
              </span>
            ))}
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
              Published: {cve.published}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Remediation Row ─────────────────────────────────────────────────────── */
function RemRow({ item }) {
  return (
    <div className="py-2.5 px-3 mb-2 rounded-md" style={{ background: `${item.color}06`, border: `1px solid ${item.color}20` }}>
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', fontWeight: 800, color: item.color }}>#{item.rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{item.action}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.35)', marginBottom: 4, lineHeight: 1.5 }}>{item.rationale}</div>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: '#6b9e7a', background: '#6b9e7a15', border: '1px solid #6b9e7a25', padding: '1px 5px', borderRadius: 2 }}>
              -{item.cost_reduction_pct}% cost
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.25)' }}>
              Effort: {item.effort}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: item.color, marginLeft: 'auto' }}>
              {item.framework}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 800, color: item.color }}>{item.impact}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.35rem', color: 'rgba(255,255,255,0.2)' }}>impact</div>
        </div>
      </div>
    </div>
  )
}

export default function BreachIQModule() {
  const [data,      setData]      = useState(null)
  const [cves,      setCVEs]      = useState({ cves: [] })
  const [kev,       setKEV]       = useState({ vulnerabilities: [] })
  const [selFW,     setSelFW]     = useState(null)
  const [activeTab, setActiveTab] = useState('risk')
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    try {
      const [oRes, cRes, kRes] = await Promise.all([
        fetch('/api/breach-iq/overview'),
        fetch('/api/breach-iq/cves?severity=CRITICAL&days=7&limit=10'),
        fetch('/api/breach-iq/kev'),
      ])
      const [o, c, k] = await Promise.all([oRes.json(), cRes.json(), kRes.json()])
      setData(o)
      setCVEs(c)
      setKEV(k)
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t) }, [load])

  const TABS = [
    { id: 'risk',       label: 'Breach Probability' },
    { id: 'compliance', label: 'Compliance Matrix' },
    { id: 'cve',        label: 'Live CVEs'         },
    { id: 'remediation',label: 'Remediation Queue' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.55rem' }}>
      COMPUTING BREACH PROBABILITY…
    </div>
  )

  const prob = data?.breach_probability
  const exposure = data?.exposure

  return (
    <div className="space-y-4">

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['1-Year P(Breach)',   prob ? `${prob['1yr']?.probability_pct}%` : '—', '#FF3B5C'],
          ['Total Exposure',     exposure?.total_exposure_str || '—', '#f97316'],
          ['Overall Risk Score', data ? `${data.overall_risk_score}%` : '—', '#eab308'],
          ['Overall Grade',      data?.overall_grade || '—', { A:'#6b9e7a',B:'#7ba3c4',C:'#eab308',D:'#f97316',F:'#FF3B5C' }[data?.overall_grade] || '#6d8588'],
        ].map(([l,v,c]) => (
          <div key={l} className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 3 }}>{l}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1.5 rounded-md transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: activeTab === tab.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              fontFamily: 'JetBrains Mono', fontSize: '0.5rem',
              fontWeight: activeTab === tab.id ? 700 : 400,
              textTransform: 'uppercase', letterSpacing: '0.14em', border: 'none', cursor: 'pointer',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {activeTab === 'risk' && prob && (
            <div className="grid grid-cols-2 gap-4">

              {/* Monte Carlo gauges */}
              <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 16 }}>
                  Monte Carlo Breach Probability · N=10,000
                </div>
                <div className="flex items-center justify-around">
                  {[
                    { key: '1yr', label: '1-Year Horizon',  color: '#f97316' },
                    { key: '2yr', label: '2-Year Horizon',  color: '#FF3B5C' },
                    { key: '3yr', label: '3-Year Horizon',  color: '#FF3B5C' },
                  ].map(({ key, label, color }) => (
                    <GaugeRing
                      key={key}
                      pct={prob[key]?.probability_pct || 0}
                      color={color}
                      label={label}
                      sublabel={`CI: [${prob[key]?.ci_95_pct?.[0]}–${prob[key]?.ci_95_pct?.[1]}]%`}
                      size={key === '2yr' ? 130 : 110}
                    />
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-md" style={{ background: 'rgba(255,59,92,0.04)', border: '1px solid rgba(255,59,92,0.15)' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>Model Formula</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.52rem', color: '#FF3B5C', fontWeight: 700 }}>
                    P(breach) = P(L1) · P(L2|L1) · P(L3|L2) · P(L4|L3)
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                    IEM Sequential Probabilistic Framework · IEEE TIFS 2026 · Raj Bharti
                  </div>
                </div>
              </div>

              {/* Exposure breakdown */}
              {exposure && (
                <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
                    Financial Exposure Model
                  </div>
                  <div className="text-center mb-4">
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '2rem', fontWeight: 900, color: '#FF3B5C' }}>
                      {exposure.total_exposure_str}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                      Total Quantified Exposure · {exposure.records_at_risk?.toLocaleString()} records at risk
                    </div>
                  </div>
                  {exposure.breakdown?.map(item => (
                    <div key={item.label} className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 700, color: item.color }}>
                          ${(item.value / 1_000_000).toFixed(1)}M ({item.pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ height: '100%', background: item.color, borderRadius: 999 }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>
                      Source: {exposure.source} · ${exposure.cost_per_record_usd}/record
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
                  6-Framework Score
                </div>
                {data?.compliance?.map(fw => (
                  <FrameworkBar key={fw.id} fw={fw} onClick={setSelFW} active={selFW?.id === fw.id} />
                ))}
              </div>
              <div className="col-span-2 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {selFW ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ background: `${selFW.color}15`, border: `1px solid ${selFW.color}30` }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 900,
                          color: { A:'#6b9e7a',B:'#7ba3c4',C:'#eab308',D:'#f97316',F:'#FF3B5C' }[selFW.grade] }}>{selFW.grade}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{selFW.name}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.4rem', color: 'rgba(255,255,255,0.3)' }}>
                          {selFW.passing}/{selFW.controls} controls passing · {selFW.score}% compliance
                        </div>
                      </div>
                    </div>
                    <GaugeRing pct={selFW.score} color={selFW.color} label={selFW.name} sublabel={`${selFW.passing}/${selFW.controls} controls`} size={120} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.5rem' }}>
                    <Shield className="w-8 h-8 mb-3 opacity-30" />
                    Select a framework to view detailed breakdown
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cve' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
                    Critical CVEs — Last 7 Days (NVD)
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>
                    {cves.total?.toLocaleString()} total results
                  </div>
                </div>
                <div className="space-y-1">
                  {cves.cves?.length > 0 ? cves.cves.map(c => <CVERow key={c.id} cve={c} />) : (
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.5rem', textAlign: 'center', paddingTop: 32 }}>
                      No CVEs loaded (check backend connectivity)
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
                  CISA KEV — Recent Exploited ({kev.total_kev} total)
                </div>
                {kev.vulnerabilities?.map(v => (
                  <div key={v.id} className="py-2 px-3 mb-1.5 rounded-md" style={{ background: 'rgba(255,59,92,0.04)', border: '1px solid rgba(255,59,92,0.15)' }}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.48rem', fontWeight: 700, color: '#FF3B5C' }}>{v.id}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{v.name}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{v.vendor} · {v.product}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>Added: {v.date_added}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: '#f97316' }}>Due: {v.due_date}</div>
                        {v.known_ransomware && v.known_ransomware !== 'Unknown' && (
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.38rem', color: '#FF3B5C', marginTop: 2 }}>⚠ Ransomware: {v.known_ransomware}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'remediation' && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
                AI-Ranked Remediation Queue · Sorted by Risk Reduction Impact
              </div>
              {data?.remediation_queue?.map(item => <RemRow key={item.rank} item={item} />)}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
