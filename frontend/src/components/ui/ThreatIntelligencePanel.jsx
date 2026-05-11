import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, ExternalLink, Zap, Target, Activity } from 'lucide-react'

/* ═══════════════════════════════════════════════
   THREAT INTELLIGENCE PANEL
   CVEs · CISA KEV (live exploited) · Threat Actors
   ═══════════════════════════════════════════════ */

export default function ThreatIntelligencePanel() {
  const [intel, setIntel] = useState({ latest_cves: [], active_threat_actors: [] })
  const [kev, setKev]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [kevLoading, setKevLoading] = useState(true)
  const [tab, setTab] = useState('exploited') // 'exploited' | 'cve' | 'actors'

  const fetchIntel = async () => {
    try {
      const response = await fetch('/api/intelligence/threats')
      const data = await response.json()
      setIntel(data)
      setLoading(false)
    } catch { setLoading(false) }
  }

  const fetchKev = async () => {
    try {
      const response = await fetch('/api/intelligence/cisa-kev')
      const data = await response.json()
      setKev(data)
      setKevLoading(false)
    } catch { setKevLoading(false) }
  }

  useEffect(() => {
    fetchIntel()
    fetchKev()
    const t1 = setInterval(fetchIntel, 300000)
    const t2 = setInterval(fetchKev,   3600000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const TABS = [
    { id: 'exploited', label: 'LIVE EXPLOITED', color: '#FF3B5C' },
    { id: 'cve',       label: 'CVEs',           color: '#FFB547' },
    { id: 'actors',    label: 'THREAT ACTORS',  color: '#f87171' },
  ]

  return (
    <div className="glass-panel flex flex-col overflow-hidden h-[360px]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="w-3.5 h-3.5 text-[#FFB547]" />
          <span className="section-label">Threat Knowledge Base</span>
          {tab === 'exploited' && kev?.total && (
            <span className="text-[8px] font-mono text-[#FF3B5C] uppercase tracking-widest">
              · {kev.total} active KEVs
            </span>
          )}
        </div>
        <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-2.5 py-1 text-[7px] font-bold rounded-md transition-all uppercase tracking-widest"
              style={tab === t.id
                ? { backgroundColor: `${t.color}20`, color: t.color }
                : { color: 'rgba(255,255,255,0.25)' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1 min-h-0">
        <AnimatePresence mode="wait">

          {/* ─── CISA KEV Tab (Live Exploited Vulnerabilities) ─── */}
          {tab === 'exploited' && (
            <motion.div key="exploited" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              {kevLoading ? (
                <div className="h-40 flex items-center justify-center text-[10px] font-mono text-white/10 uppercase tracking-widest">
                  Synchronizing with CISA KEV catalog...
                </div>
              ) : !kev?.vulnerabilities?.length ? (
                <div className="h-40 flex items-center justify-center text-[10px] font-mono text-white/10 uppercase tracking-widest">
                  CISA KEV data unavailable
                </div>
              ) : (
                kev.vulnerabilities.map((vuln) => (
                  <div key={vuln.cveID} className="px-4 py-3 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold font-mono text-[#FF3B5C] flex-shrink-0">{vuln.cveID}</span>
                        {vuln.knownRansomwareCampaignUse === 'Known' && (
                          <span className="px-1.5 py-0.5 bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 rounded text-[7px] font-bold text-[#FF3B5C] uppercase flex-shrink-0">
                            RANSOMWARE
                          </span>
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-white/20 flex-shrink-0">{vuln.dateAdded}</span>
                    </div>
                    <div className="text-[9px] font-bold text-white/70 mb-1 group-hover:text-white/90 transition-colors">
                      {vuln.vendorProject} — {vuln.product}
                    </div>
                    <p className="text-[9px] text-white/40 leading-relaxed line-clamp-2 group-hover:text-white/60 transition-colors">
                      {vuln.shortDescription}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[7px] font-mono text-white/30 uppercase">Due: {vuln.dueDate}</span>
                      <a href={`https://nvd.nist.gov/vuln/detail/${vuln.cveID}`} target="_blank" rel="noreferrer"
                        className="text-[7px] text-[#00D1FF] flex items-center gap-1 uppercase font-bold">
                        NVD <ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                  </div>
                ))
              )}
              {kev && !kevLoading && (
                <div className="px-4 py-2 text-[7px] font-mono text-white/10 uppercase tracking-widest text-center">
                  Source: CISA Known Exploited Vulnerabilities Catalog · {kev.catalog_version}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── CVE Tab ─── */}
          {tab === 'cve' && (
            <motion.div key="cve" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              {loading ? (
                <div className="h-40 flex items-center justify-center text-[10px] font-mono text-white/10 uppercase tracking-widest">
                  Querying vulnerability databases...
                </div>
              ) : intel.latest_cves.map((cve) => (
                <div key={cve.id} className="px-4 py-3 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold font-mono text-[#00D1FF]">{cve.id}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                      cve.cvss >= 9 ? 'bg-[#FF3B5C]/10 border-[#FF3B5C]/30 text-[#FF3B5C]' :
                      cve.cvss >= 7 ? 'bg-[#FFB547]/10 border-[#FFB547]/30 text-[#FFB547]' :
                      'bg-white/5 border-white/10 text-white/40'
                    }`}>
                      CVSS {cve.cvss || 'N/A'}
                    </span>
                  </div>
                  <p className="text-[9px] text-white/60 leading-relaxed line-clamp-2 mb-1">{cve.summary}</p>
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[7px] font-mono text-white/30">{cve.published}</span>
                    <a href={`https://nvd.nist.gov/vuln/detail/${cve.id}`} target="_blank" rel="noreferrer"
                      className="text-[7px] text-[#00D1FF] flex items-center gap-1 font-bold">
                      Details <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ─── Threat Actors Tab ─── */}
          {tab === 'actors' && (
            <motion.div key="actors" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="p-3 space-y-3">
              {intel.active_threat_actors.map((actor) => (
                <div key={actor.name}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group hover:border-[#FF3B5C]/30 transition-colors">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="w-16 h-16 text-[#FF3B5C]" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FF3B5C]/10 flex items-center justify-center border border-[#FF3B5C]/20">
                      <Zap className="w-4 h-4 text-[#FF3B5C]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white/90">{actor.name}</div>
                      <div className="text-[8px] font-mono text-[#FF3B5C] uppercase tracking-widest">{actor.risk} Risk</div>
                    </div>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div>
                      <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest mb-0.5">Primary Target</div>
                      <div className="text-[9px] font-bold text-white/60">{actor.target}</div>
                    </div>
                    <div>
                      <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest mb-0.5">Recent Activity</div>
                      <div className="text-[9px] text-white/40 italic leading-snug">{actor.recent_activity}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="px-5 py-2 bg-white/[0.01] border-t border-white/[0.03] text-[7px] font-mono text-white/10 uppercase tracking-[0.3em] text-center flex-shrink-0">
        {tab === 'exploited'
          ? 'CISA Known Exploited Vulnerabilities · Updated daily · Active threat actor exploitation confirmed'
          : 'Synchronized with MITRE ATT&CK · NVD · CISA advisories'
        }
      </div>
    </div>
  )
}
