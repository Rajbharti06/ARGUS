/**
 * IEM — Identity Exploitation Model Module
 * Visualizes P(breach) = P(L1)·P(L2|L1)·P(L3|L2)·P(L4|L3)
 * Based on Raj Bharti, IEEE TIFS 2026
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, Activity, Brain, Layers, AlertTriangle,
  TrendingDown, Users, Lock, Zap, ChevronRight, RefreshCw,
} from 'lucide-react'

const API = 'http://localhost:8000/argus'

const SEVERITY_COLOR = {
  CRITICAL: '#DC2626',
  HIGH:     '#D97706',
  ELEVATED: '#D97706',
  MEDIUM:   '#0284C7',
  LOW:      '#16A34A',
}

const MFA_COLOR = {
  'No MFA':  '#DC2626',
  'SMS OTP': '#D97706',
  'TOTP':    '#D97706',
  'Push MFA':'#0284C7',
  'FIDO2':   '#16A34A',
}

const INST_COLOR = ['#DC2626', '#D97706', '#D97706', '#0284C7', '#16A34A']

// ── Tiny card shell ──────────────────────────────────────────────────────────

function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.09)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', ...style }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, label, sub, badge }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,64,193,0.08)', border: '1px solid rgba(0,64,193,0.14)' }}>
          <Icon className="w-4 h-4" style={{ color: '#0040C1' }} />
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>{label}</div>
          {sub && <div className="text-xs" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{sub}</div>}
        </div>
      </div>
      {badge && (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,64,193,0.08)', color: '#0040C1', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ── Institution breach probability bars ──────────────────────────────────────

function InstitutionBars({ data }) {
  const entries = data ? Object.entries(data.institutions) : []

  return (
    <Card className="p-6">
      <SectionHeader
        icon={ShieldAlert}
        label="Institution Breach Probability"
        sub="Monte Carlo N=100,000 · seed=42 · IEEE TIFS 2026"
        badge="TABLE IV"
      />

      {/* Formula pill */}
      <div className="mb-5 px-3 py-2 rounded-lg text-center"
        style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#0040C1' }}>
        P(breach) = P(L1) · P(L2|L1) · P(L3|L2) · P(L4|L3)
      </div>

      <div className="space-y-4">
        {entries.map(([key, inst], i) => {
          const pct   = ((inst.mean_breach ?? 0) * 100).toFixed(1)
          const color = INST_COLOR[i] ?? '#64748B'
          const ci    = inst.ci_95 ?? [0, 0]

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>{inst.name}</span>
                  <span className="ml-2 text-xs" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{inst.mfa_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#CBD5E1', fontFamily: 'JetBrains Mono, monospace' }}>
                    95% CI [{(ci[0]*100).toFixed(1)}%–{(ci[1]*100).toFixed(1)}%]
                  </span>
                  <span className="font-bold text-sm" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                  style={{ background: color }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-xs" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem' }}>
                  {inst.records_exposed} records · {inst.attack_vector}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Sensitivity analysis ──────────────────────────────────────────────────────

function SensitivityPanel({ data }) {
  if (!data) return null
  // API returns: { baseline_breach_probability, analysis: [{intervention, delta_pct, reduced_mean, ...}] }
  const baseline = (data.baseline_breach_probability ?? 0.6122) * 100
  const entries  = data.analysis ?? []

  return (
    <Card className="p-6">
      <SectionHeader
        icon={TrendingDown}
        label="Intervention Sensitivity Analysis"
        sub={`Baseline: ${baseline.toFixed(1)}% (Harvard) · Table VI, paper`}
        badge="ΔRISK"
      />

      <div className="space-y-3.5">
        {entries.map((item) => {
          // delta_pct is negative (reduction), e.g. -72.0
          const reduction = Math.abs(item.delta_pct ?? 0)
          const newProb   = ((item.reduced_mean ?? 0) * 100).toFixed(1)
          const isTop     = reduction >= 60

          return (
            <div key={item.intervention}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isTop && <Zap className="w-3 h-3" style={{ color: '#16A34A' }} />}
                  <span className="text-xs font-medium" style={{ color: '#0F172A' }}>{item.intervention}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                    → {newProb}%
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                    −{reduction.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${reduction}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ background: isTop ? '#16A34A' : '#0040C1' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
          <span className="text-xs font-bold" style={{ color: '#16A34A' }}>FIDO2 Hardware Keys — Primary Recommendation</span>
        </div>
        <p className="text-xs" style={{ color: '#475569', lineHeight: 1.5 }}>
          Reduces P(breach) by 72% by eliminating AiTM session token relay. The only MFA mechanism
          cryptographically bound to the legitimate origin domain, defeating EvilProxy and Evilginx2 attacks.
        </p>
      </div>
    </Card>
  )
}

// ── MFA Attack Simulator Matrix ───────────────────────────────────────────────

function SimulatorMatrix({ data }) {
  if (!data) return null
  // API: { mfa_types: [...], attack_types: [...], matrix: [{attack_type, results: {mfa: {breach_probability}}}] }
  const { mfa_types = [], matrix = [] } = data

  const cellColor = (val) => {
    if (val >= 0.7)  return { bg: 'rgba(220,38,38,0.12)',  text: '#DC2626', border: 'rgba(220,38,38,0.25)' }
    if (val >= 0.45) return { bg: 'rgba(217,119,6,0.10)',  text: '#D97706', border: 'rgba(217,119,6,0.22)' }
    if (val >= 0.2)  return { bg: 'rgba(2,132,199,0.09)',  text: '#0284C7', border: 'rgba(2,132,199,0.2)' }
    return              { bg: 'rgba(22,163,74,0.08)',   text: '#16A34A', border: 'rgba(22,163,74,0.2)' }
  }

  return (
    <Card className="p-6">
      <SectionHeader
        icon={Layers}
        label="Attack Type × MFA Scenario Matrix"
        sub="P(breach) — Table IX — Raj Bharti, IEEE TIFS 2026"
        badge="5×5"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className="text-left pb-2 pr-3 font-medium" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                ATTACK TYPE
              </th>
              {mfa_types.map(m => (
                <th key={m} className="pb-2 px-2 text-center font-medium" style={{ color: '#0040C1', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', whiteSpace: 'nowrap' }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={row.attack_type}>
                <td className="py-1.5 pr-3 font-medium text-xs" style={{ color: '#334155', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem' }}>
                  {row.attack_type}
                </td>
                {mfa_types.map((mfa, ci) => {
                  const val = row.results?.[mfa]?.breach_probability ?? 0
                  const { bg, text, border } = cellColor(val)
                  return (
                    <td key={ci} className="py-1.5 px-2 text-center">
                      <motion.div
                        className="rounded-md px-2 py-1.5 cursor-default inline-block w-full"
                        style={{ background: bg, border: `1px solid ${border}`, color: text, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.65rem' }}
                        whileHover={{ scale: 1.08 }}
                      >
                        {(val * 100).toFixed(1)}%
                      </motion.div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 flex-wrap">
        {[
          { label: '≥70% CRITICAL', color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
          { label: '45–70% HIGH',   color: '#D97706', bg: 'rgba(217,119,6,0.10)' },
          { label: '20–45% MEDIUM', color: '#0284C7', bg: 'rgba(2,132,199,0.09)' },
          { label: '<20% LOW',      color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
        ].map(({ label, color, bg }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: bg, border: `1px solid ${color}` }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#64748B' }}>{label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Campaign Prediction ───────────────────────────────────────────────────────

function CampaignPanel({ data }) {
  const [n, setN]   = useState(50)
  const [res, setRes] = useState(data)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/iem/campaign?n_targets=${n}`)
      setRes(await r.json())
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  if (!res) return null
  const expected = res.expected_breaches ?? 0
  const pct      = ((res.breach_probability ?? 0) * 100).toFixed(1)

  return (
    <Card className="p-6">
      <SectionHeader
        icon={Users}
        label="Campaign Breach Prediction"
        sub={`ShinyHunters model · E[B] = N × P(breach)`}
        badge="PREDICTIVE"
      />

      <div className="flex items-center gap-3 mb-5">
        <label className="text-xs font-medium" style={{ color: '#334155', whiteSpace: 'nowrap' }}>Target institutions:</label>
        <input
          type="range" min={5} max={200} value={n}
          onChange={e => setN(+e.target.value)}
          className="flex-1 accent-blue-600"
        />
        <span className="font-bold text-sm w-8 text-right" style={{ color: '#0040C1', fontFamily: 'JetBrains Mono, monospace' }}>{n}</span>
        <button
          onClick={run}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: '#0040C1', color: '#FFFFFF' }}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Run
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Target Institutions', value: res.n_targets ?? n, suffix: '' },
          { label: 'Avg P(breach)', value: pct, suffix: '%' },
          { label: 'Expected Breaches', value: expected.toFixed(1), suffix: '' },
        ].map(({ label, value, suffix }) => (
          <div key={label} className="rounded-lg p-4 text-center"
            style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)' }}>
            <div className="text-xl font-bold mb-1" style={{ color: '#0040C1', fontFamily: 'JetBrains Mono, monospace' }}>
              {value}{suffix}
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>{label}</div>
          </div>
        ))}
      </div>

      {res.range && (
        <div className="mt-4 text-xs text-center" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
          Probabilistic range: {res.range[0]?.toFixed(1)} – {res.range[1]?.toFixed(1)} breaches (95% CI)
        </div>
      )}
    </Card>
  )
}

// ── Real-time IEM Scorer ──────────────────────────────────────────────────────

function RealtimeIEM() {
  const [form, setForm] = useState({
    failed_logins: 0,
    impossible_travel: false,
    tor_detected: false,
    new_device: false,
    download_spike: false,
    mfa_type: 'push',
    phishing_detected: false,
    institution: 'harvard',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/iem/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setResult(await r.json())
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  const toggle = (field) => setForm(f => ({ ...f, [field]: !f[field] }))
  const riskColor = result ? (SEVERITY_COLOR[result.risk_level] ?? '#64748B') : '#0040C1'

  return (
    <Card className="p-6">
      <SectionHeader
        icon={Brain}
        label="Real-time IEM Assessment"
        sub="Live breach probability from active ARGUS signals"
        badge="LIVE"
      />

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Left: signal toggles */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold mb-3" style={{ color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
            Active Signals
          </p>
          {[
            { field: 'impossible_travel', label: 'Impossible Travel' },
            { field: 'tor_detected',      label: 'TOR Detected' },
            { field: 'new_device',        label: 'New Device' },
            { field: 'download_spike',    label: 'Data Exfil Spike' },
            { field: 'phishing_detected', label: 'Phishing Detected' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => toggle(field)}
                className="w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                style={{ background: form[field] ? '#DC2626' : '#E2E8F0', cursor: 'pointer' }}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: form[field] ? '1.25rem' : '2px' }} />
              </div>
              <span className="text-xs" style={{ color: '#334155' }}>{label}</span>
            </label>
          ))}

          <div className="mt-3">
            <label className="text-xs font-medium" style={{ color: '#334155' }}>Failed Logins</label>
            <input
              type="number" min={0} max={20} value={form.failed_logins}
              onChange={e => setForm(f => ({ ...f, failed_logins: +e.target.value }))}
              className="mt-1 w-20 text-xs px-2 py-1.5 rounded-md border outline-none"
              style={{ border: '1px solid rgba(15,23,42,0.15)', color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
        </div>

        {/* Right: config */}
        <div className="space-y-3">
          <p className="text-xs font-semibold mb-3" style={{ color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
            Configuration
          </p>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#334155' }}>MFA Type</label>
            <select
              value={form.mfa_type}
              onChange={e => setForm(f => ({ ...f, mfa_type: e.target.value }))}
              className="w-full text-xs px-2 py-2 rounded-md border outline-none"
              style={{ border: '1px solid rgba(15,23,42,0.15)', color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}
            >
              <option value="none">No MFA</option>
              <option value="sms">SMS OTP</option>
              <option value="totp">TOTP (Authenticator)</option>
              <option value="push">Push MFA (default)</option>
              <option value="fido2">FIDO2 Hardware Key ✓</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#334155' }}>Institution Profile</label>
            <select
              value={form.institution}
              onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
              className="w-full text-xs px-2 py-2 rounded-md border outline-none"
              style={{ border: '1px solid rgba(15,23,42,0.15)', color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}
            >
              <option value="harvard">Harvard University</option>
              <option value="upenn">Univ. of Pennsylvania</option>
              <option value="columbia">Columbia University</option>
              <option value="princeton">Princeton University</option>
              <option value="michigan">Univ. of Michigan</option>
            </select>
          </div>

          <button
            onClick={run}
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
            style={{ background: '#0040C1', color: '#FFFFFF', opacity: loading ? 0.7 : 1 }}
          >
            <Brain className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Computing...' : 'Run IEM Assessment'}
          </button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-5"
            style={{ background: `rgba(${riskColor === '#DC2626' ? '220,38,38' : riskColor === '#D97706' ? '217,119,6' : riskColor === '#16A34A' ? '22,163,74' : '0,64,193'},0.06)`, border: `1px solid ${riskColor}30` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold mb-0.5" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  Breach Probability
                </div>
                <div className="text-4xl font-black" style={{ color: riskColor, fontFamily: 'JetBrains Mono, monospace' }}>
                  {((result.mean_breach ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold px-3 py-1.5 rounded-full mb-2 inline-block"
                  style={{ background: riskColor + '18', color: riskColor, fontFamily: 'JetBrains Mono, monospace', border: `1px solid ${riskColor}30` }}>
                  {result.risk_level}
                </div>
                <div className="text-xs" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                  95% CI [{((result.ci_95?.[0] ?? 0)*100).toFixed(1)}% – {((result.ci_95?.[1] ?? 0)*100).toFixed(1)}%]
                </div>
              </div>
            </div>

            {/* Layer decomposition */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'L1 Human Trust', val: result.l1_mean },
                { label: 'L2 Auth Bypass',  val: result.l2_mean },
                { label: 'L3 Interception', val: result.l3_mean },
                { label: 'L4 Privilege',    val: result.l4_mean },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-lg p-2.5 text-center"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(15,23,42,0.08)' }}>
                  <div className="font-bold text-sm" style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>
                    {val != null ? (val * 100).toFixed(0) + '%' : '—'}
                  </div>
                  <div className="text-xs leading-tight mt-0.5" style={{ color: '#64748B', fontSize: '0.58rem' }}>{label}</div>
                </div>
              ))}
            </div>

            {result.recommendation && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: riskColor }} />
                <p className="text-xs" style={{ color: '#334155', lineHeight: 1.5 }}>{result.recommendation}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ── Layer Explainer ───────────────────────────────────────────────────────────

function LayerExplainer() {
  const layers = [
    {
      id: 'L1', name: 'Human Trust Layer', range: '55–90%',
      color: '#DC2626',
      desc: 'Social engineering susceptibility — phishing email click rate under urgency + authority framing.',
      ttp: 'T1566.001 · Spear-Phishing Attachment',
    },
    {
      id: 'L2', name: 'Authentication Layer', range: '18–100%',
      color: '#D97706',
      desc: 'MFA bypass probability — ranges from FIDO2 (18%) to no MFA (100%). AiTM relays Push/SMS in real time.',
      ttp: 'T1078 · Valid Accounts / T1621 · MFA Request Generation',
    },
    {
      id: 'L3', name: 'Interception Layer', range: '90–98%',
      color: '#0284C7',
      desc: 'Session token capture probability via EvilProxy or Evilginx2 reverse proxy.',
      ttp: 'T1550.001 · Pass the Cookie',
    },
    {
      id: 'L4', name: 'Privilege Layer', range: '80–95%',
      color: '#7C3AED',
      desc: 'Post-compromise privilege escalation and lateral movement via centralized IAM (Salesforce, Entra ID).',
      ttp: 'T1021 · Remote Services / T1567.002 · Exfiltration to Cloud',
    },
  ]

  return (
    <Card className="p-6">
      <SectionHeader
        icon={Activity}
        label="IEM Layer Architecture"
        sub="Sequential conditional probability — each layer gates the next"
      />
      <div className="space-y-3">
        {layers.map((layer, i) => (
          <div key={layer.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ background: layer.color + '14', color: layer.color, border: `1px solid ${layer.color}30`, fontFamily: 'JetBrains Mono, monospace' }}>
                {layer.id}
              </div>
              {i < layers.length - 1 && (
                <div className="w-px h-4 mt-1" style={{ background: 'rgba(15,23,42,0.1)' }} />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>{layer.name}</span>
                <span className="text-xs font-bold" style={{ color: layer.color, fontFamily: 'JetBrains Mono, monospace' }}>{layer.range}</span>
              </div>
              <p className="text-xs mb-1" style={{ color: '#64748B', lineHeight: 1.5 }}>{layer.desc}</p>
              <span className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,64,193,0.06)', color: '#0040C1', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem' }}>
                {layer.ttp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Main Module ───────────────────────────────────────────────────────────────

export default function IEMModule() {
  const [institutions, setInstitutions] = useState(null)
  const [sensitivity,  setSensitivity]  = useState(null)
  const [simulator,    setSimulator]    = useState(null)
  const [campaign,     setCampaign]     = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [instRes, sensRes, simRes, campRes] = await Promise.all([
          fetch(`${API}/iem/institutions`),
          fetch(`${API}/iem/sensitivity?institution=harvard`),
          fetch(`${API}/iem/simulator`),
          fetch(`${API}/iem/campaign?n_targets=50`),
        ])
        setInstitutions(await instRes.json())
        setSensitivity(await sensRes.json())
        setSimulator(await simRes.json())
        setCampaign(await campRes.json())
      } catch (e) {
        setError('IEM engine offline — check backend')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-10 h-10 mx-auto mb-3 animate-pulse" style={{ color: '#0040C1' }} />
          <div className="text-sm font-medium" style={{ color: '#334155' }}>Running Monte Carlo simulation…</div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>N=100,000 · seed=42</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC2626' }} />
          <div className="text-sm" style={{ color: '#DC2626' }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero header */}
      <div className="rounded-xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #080E1D 0%, #0F1E3D 60%, #0D2657 100%)', border: '1px solid rgba(0,209,255,0.12)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,209,255,0.3) 20px, rgba(0,209,255,0.3) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,209,255,0.3) 20px, rgba(0,209,255,0.3) 21px)' }} />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,209,255,0.12)', border: '1px solid rgba(0,209,255,0.25)' }}>
                <Brain className="w-4 h-4" style={{ color: '#00D1FF' }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#00D1FF', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>
                IEEE TIFS 2026
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.01em' }}>
              Identity Exploitation Model
            </h2>
            <p className="text-sm max-w-xl" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              A sequential probabilistic framework quantifying compound breach risk in Adversary-in-the-Middle
              phishing campaigns against higher education institutions.
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-6">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '4px' }}>
              Harvard baseline
            </div>
            <div className="text-4xl font-black" style={{ color: '#DC2626', fontFamily: 'JetBrains Mono, monospace' }}>61.2%</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)' }}>P(breach) · Push MFA</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-4 gap-4">
          {[
            { label: 'ShinyHunters targets', value: '601K+ records' },
            { label: 'FIDO2 reduction',      value: '−72%' },
            { label: 'Monte Carlo N',         value: '100,000' },
            { label: 'Layers modeled',        value: 'L1 → L4' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="font-bold text-sm" style={{ color: '#00D1FF', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1: institutions + sensitivity */}
      <div className="grid grid-cols-2 gap-6">
        <InstitutionBars data={institutions} />
        <SensitivityPanel data={sensitivity} />
      </div>

      {/* Row 2: matrix + campaign */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <SimulatorMatrix data={simulator} />
        </div>
        <CampaignPanel data={campaign} />
      </div>

      {/* Row 3: realtime scorer + layer explainer */}
      <div className="grid grid-cols-2 gap-6">
        <RealtimeIEM />
        <LayerExplainer />
      </div>
    </div>
  )
}
