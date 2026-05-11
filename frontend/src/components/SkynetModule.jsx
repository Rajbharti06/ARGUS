import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Shield, AlertTriangle, RefreshCcw, Search, Database, Globe } from 'lucide-react'
import { cn } from '../utils/cn'

const FINDINGS_STATIC = [
  { priority: 'critical', service: 'IAM',        finding: 'Root account no MFA',      description: 'AWS root account lacks multi-factor authentication',  status: 'NEW',        cis: 'CIS 1.1' },
  { priority: 'critical', service: 'S3',         finding: 'Public bucket exposed',    description: 'uni-research-data bucket has public read access',      status: 'NEW',        cis: 'CIS 2.3' },
  { priority: 'high',     service: 'EC2',        finding: 'Unpatched instances',      description: '12 instances running EOL AMI with CVE-2024-1234',       status: 'MONITORING', cis: 'CIS 6.2' },
  { priority: 'high',     service: 'RDS',        finding: 'Encryption disabled',      description: 'Database snapshot not encrypted at rest',               status: 'NEW',        cis: 'CIS 7.1' },
  { priority: 'medium',   service: 'VPC',        finding: 'Overly permissive SG',    description: 'Security group allows 0.0.0.0/0 ingress on port 22',    status: 'MONITORING', cis: 'CIS 5.2' },
  { priority: 'medium',   service: 'CloudTrail', finding: 'Log validation off',       description: 'CloudTrail file integrity validation not enabled',       status: 'MONITORING', cis: 'CIS 3.2' },
  { priority: 'low',      service: 'CloudWatch', finding: 'No anomaly detection',    description: 'Missing CloudWatch anomaly detection on billing alerts',  status: 'REVIEW',     cis: 'CIS 4.1' },
  { priority: 'medium',   service: 'Lambda',     finding: 'Excessive IAM permissions', description: 'Function role grants s3:* on all resources',            status: 'NEW',        cis: 'CIS 1.7' },
]

const SEV_BAR = { critical: '#a85c5c', high: '#a68b4b', medium: '#b0a080', low: '#6d8588' }
const SEV_CLS = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-nominal',
}
const STATUS_CLS = {
  NEW:        'text-red-400 border-red-900/40 bg-red-950/20',
  MONITORING: 'text-yellow-400 border-yellow-900/40 bg-yellow-950/20',
  REVIEW:     'text-primary border-primary/30 bg-primary/5',
  FIXED:      'text-nominal border-nominal/30 bg-nominal/10',
}

function ComplianceGauge({ score }) {
  const r = 70
  const circ = 2 * Math.PI * r
  const pct = score / 100
  const color = score > 75 ? '#6d8588' : score > 50 ? '#a68b4b' : '#a85c5c'
  const label = score > 75 ? 'COMPLIANT' : score > 50 ? 'SLIGHTLY RISKY' : 'AT RISK'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg className="-rotate-90" width="160" height="160" viewBox="0 0 160 160">
          {/* Track */}
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          {/* Background arc */}
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10"
            strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={circ * 0.125}
            strokeLinecap="round" />
          {/* Score arc */}
          <motion.circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct * 0.75) }}
            transition={{ duration: 1.5, ease: 'circOut' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold font-mono" style={{ color }}>{score}</span>
          <span className="text-[8px] text-white/30 uppercase tracking-widest">/100</span>
        </div>
      </div>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-center" style={{ color }}>{label}</div>
        <div className="text-[8px] text-white/20 uppercase tracking-widest text-center mt-0.5">Compliance Score</div>
      </div>
    </div>
  )
}

export default function SkynetModule({ onAlert }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState(0)
  const [activeTab, setActiveTab] = useState('findings')

  const PHASES = [
    'Enumerating resources...', 'Scanning IAM roles...', 'Auditing storage buckets...',
    'Analyzing network exposure...', 'Reviewing encryption...', 'Generating report...',
  ]

  const scan = async () => {
    setLoading(true)
    setResult(null)
    setPhase(0)
    for (let i = 0; i < PHASES.length; i++) {
      setPhase(i)
      await new Promise(r => setTimeout(r, 400))
    }
    try {
      const res = await fetch('/api/argus/skynet/scan')
      const data = await res.json()
      setResult(data)
      if (data.critical > 0) {
        onAlert?.(`SKYNET: ${data.critical} critical findings — compliance score ${data.compliance_score}/100`)
      }
    } catch {
      setResult({
        compliance_score: 62, critical: 2, high: 3, medium: 4, low: 1,
        findings: FINDINGS_STATIC,
      })
    } finally {
      setLoading(false)
    }
  }

  const findings = result?.findings || FINDINGS_STATIC
  const score = result?.compliance_score || 62
  const tabs = ['findings', 'timeline', 'misconfigurations', 'compliance']

  return (
    <div className="flex gap-4 argus-fade" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Left: compliance gauge + inventory */}
      <div className="w-56 flex flex-col gap-3 flex-shrink-0">
        <div className="glass-panel p-5 flex-shrink-0">
          <ComplianceGauge score={score} />
        </div>

        {/* Stats */}
        <div className="glass-panel p-4 flex-shrink-0">
          <div className="section-label mb-3">Severity Breakdown</div>
          <div className="space-y-2">
            {[
              { label: 'Critical', val: result?.critical ?? 2, cls: 'text-red-400', bar: '#FF3B5C' },
              { label: 'High',     val: result?.high    ?? 3, cls: 'text-orange-400', bar: '#FFB547' },
              { label: 'Medium',   val: result?.medium  ?? 4, cls: 'text-yellow-400', bar: '#fbbf24' },
              { label: 'Low',      val: result?.low     ?? 1, cls: 'text-nominal', bar: '#6d8588' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.bar }} />
                  <span className="text-[9px] text-white/40">{s.label}</span>
                </div>
                <span className={cn('text-sm font-bold font-mono', s.cls)}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cloud inventory */}
        <div className="glass-panel p-4 flex-1">
          <div className="section-label mb-3">Cloud Inventory</div>
          <div className="space-y-3">
            {[
              { name: 'AWS',   regions: 2, resources: '4,491' },
              { name: 'GCP',   regions: 2, resources: '7' },
              { name: 'Azure', regions: 1, resources: '142' },
            ].map(c => (
              <div key={c.name} className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white/60">{c.name}</span>
                  <Globe className="w-2.5 h-2.5 text-white/20" />
                </div>
                <div className="text-[8px] text-white/25">{c.regions} regions · {c.resources} resources</div>
              </div>
            ))}
          </div>
          <button onClick={scan} disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 hover:bg-primary/15 text-primary py-2 rounded text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40">
            {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            {loading ? PHASES[phase].split('...')[0] : 'Scan Now'}
          </button>
        </div>
      </div>

      {/* Right: findings table */}
      <div className="flex-1 glass-panel flex flex-col overflow-hidden min-h-0">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5 flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded transition-all',
                activeTab === tab
                  ? 'bg-primary/10 text-primary'
                  : 'text-white/25 hover:text-white/40'
              )}>
              {tab}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[8px] font-mono text-white/20">{findings.length} FINDINGS</span>
          </div>
        </div>

        {/* Table header */}
        <div className="grid px-4 py-2 border-b border-white/[0.04] flex-shrink-0"
          style={{ gridTemplateColumns: '8px 60px 80px 1fr 1.5fr 90px 60px' }}>
          <span />
          {['PRIORITY', 'SERVICE', 'FINDING', 'DESCRIPTION', 'STATUS', 'CIS'].map(h => (
            <span key={h} className="section-label">{h}</span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {findings.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid items-center px-4 py-3 border-b border-white/[0.025] hover:bg-white/[0.015] transition-all group"
              style={{ gridTemplateColumns: '8px 60px 80px 1fr 1.5fr 90px 60px' }}>

              {/* Priority indicator */}
              <div className="h-8 w-1 rounded-full" style={{ background: SEV_BAR[f.priority] || '#6d8588' }} />

              {/* Priority label */}
              <span className={cn('text-[9px] font-bold uppercase', SEV_CLS[f.priority] || 'text-white/30')}>{f.priority}</span>

              {/* Service */}
              <span className="text-[9px] font-mono text-white/45">{f.service}</span>

              {/* Finding */}
              <span className="text-[10px] font-semibold text-white/70 group-hover:text-white transition-colors truncate pr-2">{f.finding}</span>

              {/* Description */}
              <span className="text-[9px] font-mono text-white/35 truncate pr-2">{f.description}</span>

              {/* Status */}
              <span className={cn('text-[8px] font-bold px-2 py-0.5 rounded border w-fit', STATUS_CLS[f.status] || STATUS_CLS.REVIEW)}>
                {f.status}
              </span>

              {/* CIS */}
              <span className="text-[8px] font-mono text-primary/50">{f.cis}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
