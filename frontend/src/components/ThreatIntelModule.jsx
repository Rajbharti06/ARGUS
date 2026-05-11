import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, AlertTriangle, ExternalLink, RefreshCcw, Shield, Crosshair } from 'lucide-react'
import { cn } from '../utils/cn'

const FEED_FILTERS = ['ALL', 'THREATS', 'INTELLIGENCE', 'NATION-STATE', 'CRIME', 'CVE']

const SOURCE_BADGE = {
  'bleepingcomputer': { cls: 'text-orange-400 border-orange-900/30 bg-orange-950/10', label: 'BLEEPINGCOMPUTER' },
  'krebs':            { cls: 'text-red-400 border-red-900/30 bg-red-950/10',          label: 'KREBS ON SEC' },
  'securityweek':     { cls: 'text-primary border-primary/30 bg-primary/5',       label: 'SECURITYWEEK' },
  'hackernews':       { cls: 'text-yellow-400 border-yellow-900/30 bg-yellow-950/10', label: 'HACKER NEWS' },
  'cisa':             { cls: 'text-primary border-primary/30 bg-primary/5',            label: 'CISA' },
  'nvd':              { cls: 'text-purple-400 border-purple-900/30 bg-purple-950/10', label: 'NVD' },
}

const THREAT_ACTORS = [
  {
    name: 'ShinyHunters',
    type: 'CRIME',
    origin: 'France / Unknown',
    active: '2020 — Present',
    daysSinceCampaign: 47,
    ttps: ['T1190 — Exploit Public-Facing Application', 'T1078 — Valid Accounts', 'T1567 — Exfiltration over Web Service'],
    targets: ['University Systems', 'Cloud Storage', 'SaaS Platforms', 'Financial Institutions'],
    description: 'ShinyHunters is a prolific cybercriminal group known for large-scale data breaches affecting universities and cloud services. Active since 2020, they have compromised 500M+ records globally.',
    campaigns: 23,
    recordsStolen: '500M+',
    severity: 'critical',
  },
  {
    name: 'APT29 / Cozy Bear',
    type: 'NATION-STATE',
    origin: 'Russia (SVR)',
    active: '2008 — Present',
    daysSinceCampaign: 12,
    ttps: ['T1566.001 — Spearphishing', 'T1078 — Valid Accounts', 'T1021 — Remote Services'],
    targets: ['Government', 'Think Tanks', 'Healthcare Research'],
    description: 'Russian SVR-attributed APT group responsible for SolarWinds supply chain attack. Known for long-dwell persistence and highly targeted intrusions.',
    campaigns: 89,
    recordsStolen: '—',
    severity: 'critical',
  },
  {
    name: 'Lazarus Group',
    type: 'NATION-STATE',
    origin: 'North Korea (RGB)',
    active: '2009 — Present',
    daysSinceCampaign: 8,
    ttps: ['T1059 — Command Scripting', 'T1486 — Data Encrypted for Impact', 'T1041 — Exfil over C2'],
    targets: ['Financial Institutions', 'Crypto Exchanges', 'Defense Contractors'],
    description: 'DPRK state-sponsored actor responsible for WannaCry, Bangladesh Bank heist, and Sony Pictures hack. Estimated $3B+ stolen from crypto markets.',
    campaigns: 156,
    recordsStolen: '$3B+',
    severity: 'critical',
  },
]

const SEV_CLS = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-nominal',
}

function useNewsFeed() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/intelligence/news')
        const data = await res.json()
        setItems(data.items || [])
      } catch {
        setItems(FALLBACK_NEWS)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
    const t = setInterval(fetchNews, 60000)
    return () => clearInterval(t)
  }, [])

  return { items, loading }
}

const FALLBACK_NEWS = [
  { title: 'Canvas LMS breach widens — 8,800+ institutions confirm exposure of student records', source: 'bleepingcomputer', severity: 'critical', time: '2h ago', category: 'THREATS' },
  { title: 'CVE-2024-38112 — Emergency Directive 24-02 issued for MSHTML zero-day in MHTML Transfer within .url', source: 'cisa', severity: 'critical', time: '4h ago', category: 'CVE' },
  { title: 'Adversarial prompt injection bypasses 87% of enterprise email LLM filters (paper)', source: 'hackernews', severity: 'high', time: '6h ago', category: 'INTELLIGENCE' },
  { title: 'Akira ransomware affiliate targets 12 regional medical networks via SonicWall flow', source: 'bleepingcomputer', severity: 'critical', time: '8h ago', category: 'CRIME' },
  { title: 'Voice-cloning fraud campaign impersonates CFOs across mid-market banks', source: 'krebs', severity: 'high', time: '10h ago', category: 'CRIME' },
  { title: 'New TTP cluster GTR93 — supply-chain compromise via signed driver poisoning', source: 'securityweek', severity: 'high', time: '12h ago', category: 'THREATS' },
  { title: 'Post-quantum migration framework draft 3 published for public review', source: 'hackernews', severity: 'low', time: '14h ago', category: 'INTELLIGENCE' },
  { title: 'Coordinated phishing wave targets >800 university SSO portals across EMEA', source: 'securityweek', severity: 'critical', time: '16h ago', category: 'THREATS' },
]

export default function ThreatIntelModule() {
  const [filter, setFilter] = useState('ALL')
  const [selectedActor, setSelectedActor] = useState(THREAT_ACTORS[0])
  const { items, loading } = useNewsFeed()

  const news = (items.length > 0 ? items : FALLBACK_NEWS).filter(item =>
    filter === 'ALL' || item.category === filter || (filter === 'CVE' && item.title?.includes('CVE'))
  )

  return (
    <div className="flex gap-4 argus-fade" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Left: News feed */}
      <div className="flex-1 flex flex-col glass-panel overflow-hidden min-h-0">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5 flex-shrink-0">
          {FEED_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded transition-all',
                filter === f ? 'bg-primary/10 text-primary' : 'text-white/25 hover:text-white/40'
              )}>
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {loading && <RefreshCcw className="w-3 h-3 text-primary animate-spin" />}
            <span className="text-[8px] font-mono text-white/20">{news.length} ITEMS</span>
          </div>
        </div>

        {/* News list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {news.map((item, i) => {
            const src = item.source?.toLowerCase() || 'hackernews'
            const badge = Object.entries(SOURCE_BADGE).find(([k]) => src.includes(k))
            const badgeStyle = badge?.[1] || SOURCE_BADGE.hackernews
            const sev = item.severity || 'medium'

            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.015] transition-all cursor-pointer group">

                {/* Time */}
                <span className="text-[8px] font-mono text-white/20 whitespace-nowrap mt-0.5 w-12 flex-shrink-0">
                  {item.time || item.published || `${i + 2}h ago`}
                </span>

                {/* Source badge */}
                <span className={cn('text-[7px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap flex-shrink-0 uppercase', badgeStyle.cls)}>
                  {badgeStyle.label}
                </span>

                {/* Title */}
                <span className="flex-1 text-[10px] font-mono text-white/60 group-hover:text-white/80 transition-colors leading-snug">
                  {item.title}
                </span>

                {/* Severity */}
                <span className={cn('text-[8px] font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0', SEV_CLS[sev] || 'text-white/30')}>
                  {sev.toUpperCase()}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Right: Threat actor panel */}
      <div className="w-64 flex flex-col gap-3 flex-shrink-0">

        {/* Actor selector */}
        <div className="glass-panel p-3 flex-shrink-0">
          <div className="section-label mb-2">Featured Threat Actors</div>
          <div className="flex flex-col gap-1">
            {THREAT_ACTORS.map(actor => (
              <button key={actor.name} onClick={() => setSelectedActor(actor)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all',
                  selectedActor.name === actor.name
                    ? 'bg-critical/10 border border-critical/25'
                    : 'hover:bg-white/[0.02] border border-transparent'
                )}>
                <Crosshair className={cn('w-3 h-3 flex-shrink-0',
                  actor.severity === 'critical' ? 'text-critical' : 'text-warning'
                )} />
                <div>
                  <div className="text-[10px] font-bold text-white/70">{actor.name}</div>
                  <div className="text-[8px] text-white/30">{actor.type} · {actor.origin}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actor detail */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedActor.name}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">

            {/* Actor header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-critical" />
                <span className="text-[8px] font-bold text-critical/70 uppercase tracking-widest">{selectedActor.type}</span>
              </div>
              <div className="text-lg font-bold text-critical font-mono">
                {selectedActor.name}
              </div>
              <div className="text-[8px] text-white/30 mt-0.5">{selectedActor.origin} · {selectedActor.active}</div>
            </div>

            {/* Days since campaign */}
            <div className="p-3 rounded bg-critical/10 border border-critical/25">
              <div className="text-[8px] text-white/25 uppercase tracking-widest mb-1">Days Since Last Campaign</div>
              <div className="text-2xl font-bold font-mono text-critical">{selectedActor.daysSinceCampaign}</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[7px] text-white/20 uppercase tracking-widest mb-0.5">Campaigns</div>
                <div className="text-sm font-bold font-mono text-white/60">{selectedActor.campaigns}</div>
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[7px] text-white/20 uppercase tracking-widest mb-0.5">Records / Impact</div>
                <div className="text-sm font-bold font-mono text-critical">{selectedActor.recordsStolen}</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[9px] font-mono text-white/40 leading-relaxed">{selectedActor.description}</p>

            {/* TTPs */}
            <div>
              <div className="section-label mb-2">Known TTPs</div>
              <div className="space-y-1.5">
                {selectedActor.ttps.map((ttp, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-critical/70 flex-shrink-0 mt-1" />
                    <span className="text-[8px] font-mono text-white/40">{ttp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Targets */}
            <div>
              <div className="section-label mb-2">Known Targets</div>
              <div className="flex flex-wrap gap-1">
                {selectedActor.targets.map((t, i) => (
                  <span key={i} className="text-[7px] font-bold px-1.5 py-0.5 rounded border border-white/10 text-white/35 uppercase">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
