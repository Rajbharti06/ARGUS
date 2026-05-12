/**
 * IEM — Identity Exploitation Model Module
 * P(breach) = P(L1)·P(L2|L1)·P(L3|L2)·P(L4|L3)
 * Raj Bharti, IEEE TIFS 2026
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, Activity, Brain, Layers, AlertTriangle,
  TrendingDown, Users, Lock, Zap, RefreshCw,
} from 'lucide-react'

const API = '/api/argus'

// ── Design tokens (dark glass) ────────────────────────────────────────────────
const C = {
  surface:   '#0c1018',
  elevated:  '#111827',
  border:    'rgba(255,255,255,0.06)',
  borderMd:  'rgba(255,255,255,0.1)',
  text:      '#e4e8ec',
  textDim:   'rgba(228,232,236,0.55)',
  textMuted: 'rgba(228,232,236,0.28)',
  cyan:      '#8baeb4',
  amber:     '#a68b4b',
  red:       '#a85c5c',
  green:     '#6d8588',
  blue:      '#5c7ab4',
}

const RISK_COLOR = {
  CRITICAL: '#a85c5c',
  HIGH:     '#a68b4b',
  ELEVATED: '#a68b4b',
  MODERATE: '#5c7ab4',
}

// ── Glass card ────────────────────────────────────────────────────────────────

function GlassCard({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, label, sub, badge }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(139,174,180,0.08)`, border: `1px solid rgba(139,174,180,0.14)` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: C.cyan }} />
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: C.text }}>{label}</div>
          {sub && <div className="text-xs mt-0.5" style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem' }}>{sub}</div>}
        </div>
      </div>
      {badge && (
        <span className="text-xs font-bold px-2 py-1 rounded"
          style={{ background: 'rgba(139,174,180,0.07)', color: C.cyan, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', border: `1px solid rgba(139,174,180,0.14)`, fontSize: '0.58rem' }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ── Institution bars ──────────────────────────────────────────────────────────

const INST_COLORS = ['#a85c5c', '#b8825c', '#a68b4b', '#5c7ab4', '#6d8588']

function InstitutionBars({ data }) {
  const entries = data ? Object.entries(data.institutions) : []

  return (
    <GlassCard className="p-5">
      <CardHeader
        icon={ShieldAlert}
        label="Institution Breach Probability"
        sub="Monte Carlo N=100,000 · seed=42 · IEEE TIFS 2026"
        badge="TABLE IV"
      />

      {/* Formula */}
      <div className="mb-5 px-3 py-2 rounded-lg text-center"
        style={{ background: 'rgba(139,174,180,0.05)', border: `1px solid rgba(139,174,180,0.1)`, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: C.cyan, letterSpacing: '0.04em' }}>
        P(breach) = P(L1) · P(L2|L1) · P(L3|L2) · P(L4|L3)
      </div>

      <div className="space-y-4">
        {entries.map(([key, inst], i) => {
          const pct   = ((inst.mean_breach ?? 0) * 100).toFixed(1)
          const color = INST_COLORS[i] ?? C.textDim
          const ci    = inst.ci_95 ?? [0, 0]

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-semibold" style={{ color: C.text }}>{inst.name}</span>
                  <span className="ml-2 text-xs" style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem' }}>{inst.mfa_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem' }}>
                    [{(ci[0]*100).toFixed(1)}–{(ci[1]*100).toFixed(1)}%]
                  </span>
                  <span className="font-bold text-sm" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
                  style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
                />
              </div>
              <div className="mt-0.5" style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem' }}>
                {inst.records_exposed} · {inst.attack_vector}
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

// ── Sensitivity analysis ──────────────────────────────────────────────────────

function SensitivityPanel({ data }) {
  if (!data) return null
  const baseline = (data.baseline_breach_probability ?? 0.6122) * 100
  const entries  = data.analysis ?? []

  return (
    <GlassCard className="p-5">
      <CardHeader
        icon={TrendingDown}
        label="Intervention Sensitivity"
        sub={`Baseline: ${baseline.toFixed(1)}% (Harvard) · Table VI`}
        badge="ΔRISK"
      />

      <div className="space-y-3.5">
        {entries.map((item) => {
          const reduction = Math.abs(item.delta_pct ?? 0)
          const newProb   = ((item.reduced_mean ?? 0) * 100).toFixed(1)
          const isTop     = reduction >= 60
          const color     = isTop ? '#6d8588' : C.cyan

          return (
            <div key={item.intervention}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isTop && <Zap className="w-3 h-3" style={{ color }} />}
                  <span className="text-xs font-medium" style={{ color: C.text }}>{item.intervention}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem' }}>→ {newProb}%</span>
                  <span className="text-xs font-bold" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>−{reduction.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${reduction}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ background: color, boxShadow: `0 0 6px ${color}44` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(109,133,136,0.06)', border: '1px solid rgba(109,133,136,0.18)' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Lock className="w-3.5 h-3.5" style={{ color: C.green }} />
          <span className="text-xs font-bold" style={{ color: C.green }}>FIDO2 Hardware Keys — Primary Recommendation</span>
        </div>
        <p className="text-xs" style={{ color: C.textDim, lineHeight: 1.55, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem' }}>
          Cryptographic origin binding defeats AiTM relay (EvilProxy / Evilginx2). Only mechanism
          that survives adversary-in-the-middle attacks — 72% P(breach) reduction confirmed.
        </p>
      </div>
    </GlassCard>
  )
}

// ── Simulator matrix ──────────────────────────────────────────────────────────

function SimulatorMatrix({ data }) {
  if (!data) return null
  const { mfa_types = [], matrix = [] } = data

  const cellStyle = (val) => {
    if (val >= 0.7)  return { bg: 'rgba(168,92,92,0.14)',  text: '#a85c5c', border: 'rgba(168,92,92,0.25)' }
    if (val >= 0.45) return { bg: 'rgba(166,139,75,0.12)', text: '#a68b4b', border: 'rgba(166,139,75,0.25)' }
    if (val >= 0.2)  return { bg: 'rgba(92,122,180,0.10)', text: '#5c7ab4', border: 'rgba(92,122,180,0.22)' }
    return               { bg: 'rgba(109,133,136,0.09)',  text: '#6d8588', border: 'rgba(109,133,136,0.22)' }
  }

  return (
    <GlassCard className="p-5">
      <CardHeader
        icon={Layers}
        label="MFA Attack Scenario Matrix"
        sub="P(breach) by attack type × MFA method — Table IX"
        badge="5×5"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
          <thead>
            <tr>
              <th className="text-left pb-2 pr-3 font-medium" style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Attack Type
              </th>
              {mfa_types.map(m => (
                <th key={m} className="pb-2 px-2 text-center font-bold" style={{ color: C.cyan, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.attack_type}>
                <td className="py-1 pr-3 font-medium" style={{ color: C.textDim, whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem' }}>
                  {row.attack_type}
                </td>
                {mfa_types.map((mfa, ci) => {
                  const val = row.results?.[mfa]?.breach_probability ?? 0
                  const { bg, text, border } = cellStyle(val)
                  return (
                    <td key={ci} className="py-1 px-1.5 text-center">
                      <motion.div
                        className="rounded-md px-2 py-1.5 cursor-default inline-block w-full"
                        style={{ background: bg, border: `1px solid ${border}`, color: text, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.62rem' }}
                        whileHover={{ scale: 1.08, zIndex: 10 }}
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
          { label: '≥70% CRITICAL', color: '#a85c5c', bg: 'rgba(168,92,92,0.1)' },
          { label: '45–70% HIGH',   color: '#a68b4b', bg: 'rgba(166,139,75,0.1)' },
          { label: '20–45% MEDIUM', color: '#5c7ab4', bg: 'rgba(92,122,180,0.1)' },
          { label: '<20% LOW',      color: '#6d8588', bg: 'rgba(109,133,136,0.1)' },
        ].map(({ label, color, bg }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: bg, border: `1px solid ${color}` }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', color: C.textMuted }}>{label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// ── Campaign prediction ───────────────────────────────────────────────────────

function CampaignPanel({ data }) {
  const [n,   setN]   = useState(50)
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
    <GlassCard className="p-5">
      <CardHeader
        icon={Users}
        label="Campaign Prediction"
        sub="ShinyHunters model · E[B] = N × P(breach)"
        badge="PREDICTIVE"
      />

      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-xs flex-shrink-0" style={{ color: C.textDim, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem' }}>Targets:</span>
        <input type="range" min={5} max={200} value={n}
          onChange={e => setN(+e.target.value)} className="flex-1" style={{ accentColor: C.cyan }} />
        <span className="font-bold w-7 text-right flex-shrink-0" style={{ color: C.cyan, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{n}</span>
        <button onClick={run}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex-shrink-0"
          style={{ background: 'rgba(139,174,180,0.1)', color: C.cyan, border: `1px solid rgba(139,174,180,0.2)` }}>
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Run
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Targets',         value: res.n_targets ?? n, color: C.cyan },
          { label: 'P(breach)',       value: `${pct}%`,          color: '#a85c5c' },
          { label: 'E[B] Breaches',   value: expected.toFixed(1),color: '#a68b4b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
            <div className="font-bold text-lg mb-0.5" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
            <div style={{ color: C.textMuted, fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {res.fido2_scenario && (
        <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(109,133,136,0.06)', border: '1px solid rgba(109,133,136,0.18)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: C.green }} />
              <span style={{ color: C.green, fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>With FIDO2</span>
            </div>
            <span style={{ color: C.green, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700 }}>
              {res.fido2_scenario.breaches_prevented?.toFixed(1)} prevented
            </span>
          </div>
        </div>
      )}

      {res.real_world_alignment && (
        <p style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.57rem', lineHeight: 1.6 }}>
          {res.real_world_alignment}
        </p>
      )}
    </GlassCard>
  )
}

// ── Real-time IEM scorer ──────────────────────────────────────────────────────

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

  const toggle = (f) => setForm(prev => ({ ...prev, [f]: !prev[f] }))
  const riskColor = result ? (RISK_COLOR[result.risk_level] ?? C.cyan) : C.cyan

  const SIGNALS = [
    { field: 'impossible_travel', label: 'Impossible Travel' },
    { field: 'tor_detected',      label: 'TOR Exit Node' },
    { field: 'new_device',        label: 'New Device' },
    { field: 'download_spike',    label: 'Data Exfil Spike' },
    { field: 'phishing_detected', label: 'Phishing Detected' },
  ]

  return (
    <GlassCard className="p-5">
      <CardHeader
        icon={Brain}
        label="Real-time IEM Assessment"
        sub="Live breach probability from active ARGUS signals"
        badge="LIVE"
      />

      <div className="grid grid-cols-2 gap-5 mb-4">
        {/* Signals */}
        <div>
          <div className="mb-3" style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Active Signals</div>
          <div className="space-y-2">
            {SIGNALS.map(({ field, label }) => (
              <label key={field} className="flex items-center gap-2.5 cursor-pointer">
                <div onClick={() => toggle(field)}
                  className="w-8 h-4 rounded-full relative transition-all flex-shrink-0"
                  style={{ background: form[field] ? '#a85c5c' : 'rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                  <div className="absolute top-0.5 w-3 h-3 rounded-full shadow transition-all"
                    style={{ background: '#e4e8ec', left: form[field] ? '18px' : '2px' }} />
                </div>
                <span style={{ color: form[field] ? C.text : C.textDim, fontSize: '0.7rem' }}>{label}</span>
              </label>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <span style={{ color: C.textMuted, fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace' }}>Failed logins:</span>
              <input type="number" min={0} max={20} value={form.failed_logins}
                onChange={e => setForm(f => ({ ...f, failed_logins: +e.target.value }))}
                className="w-14 text-xs px-2 py-1 rounded-md outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'JetBrains Mono, monospace' }} />
            </div>
          </div>
        </div>

        {/* Config */}
        <div>
          <div className="mb-3" style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Configuration</div>
          <div className="space-y-2.5">
            <div>
              <div className="mb-1" style={{ color: C.textDim, fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>MFA Type</div>
              <select value={form.mfa_type} onChange={e => setForm(f => ({ ...f, mfa_type: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                <option value="none">No MFA</option>
                <option value="sms">SMS OTP</option>
                <option value="totp">TOTP (Authenticator)</option>
                <option value="push">Push MFA (default)</option>
                <option value="fido2">FIDO2 Hardware Key ✓</option>
              </select>
            </div>
            <div>
              <div className="mb-1" style={{ color: C.textDim, fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>Institution</div>
              <select value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                <option value="harvard">Harvard University</option>
                <option value="upenn">Univ. of Pennsylvania</option>
                <option value="columbia">Columbia University</option>
                <option value="princeton">Princeton University</option>
                <option value="michigan">Univ. of Michigan</option>
              </select>
            </div>
            <button onClick={run} disabled={loading}
              className="w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 mt-1"
              style={{ background: 'rgba(139,174,180,0.1)', color: C.cyan, border: `1px solid rgba(139,174,180,0.2)`, opacity: loading ? 0.6 : 1 }}>
              <Brain className={`w-3 h-3 ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Computing...' : 'Run Assessment'}
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4"
            style={{ background: `rgba(${riskColor === '#a85c5c' ? '168,92,92' : riskColor === '#a68b4b' ? '166,139,75' : '92,122,180'},0.06)`, border: `1px solid ${riskColor}28` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '4px' }}>
                  Breach Probability
                </div>
                <div className="text-4xl font-black" style={{ color: riskColor, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
                  {((result.mean_breach ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold mb-2"
                  style={{ background: `${riskColor}18`, color: riskColor, fontFamily: 'JetBrains Mono, monospace', border: `1px solid ${riskColor}28` }}>
                  {result.risk_level}
                </span>
                <div style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem' }}>
                  95% CI [{((result.ci_95?.[0] ?? 0)*100).toFixed(1)}%–{((result.ci_95?.[1] ?? 0)*100).toFixed(1)}%]
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'L1 Human',   val: result.l1_mean },
                { label: 'L2 Auth',    val: result.l2_mean },
                { label: 'L3 Intercept',val: result.l3_mean },
                { label: 'L4 Privilege',val: result.l4_mean },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-lg p-2 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
                  <div className="font-bold text-sm" style={{ color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                    {val != null ? (val * 100).toFixed(0) + '%' : '—'}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: '0.54rem', fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
                </div>
              ))}
            </div>

            {result.active_signals?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {result.active_signals.map(sig => (
                  <span key={sig} className="px-2 py-0.5 rounded"
                    style={{ background: 'rgba(168,92,92,0.1)', color: '#a85c5c', border: '1px solid rgba(168,92,92,0.22)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem' }}>
                    {sig}
                  </span>
                ))}
              </div>
            )}

            {result.recommendation && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: riskColor }} />
                <p style={{ color: C.textDim, fontSize: '0.65rem', lineHeight: 1.5 }}>{result.recommendation}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}

// ── Layer architecture ────────────────────────────────────────────────────────

function LayerExplainer() {
  const layers = [
    { id: 'L1', name: 'Human Trust', range: '55–90%', color: '#a85c5c', desc: 'Social engineering susceptibility under urgency + authority framing.', ttp: 'T1566.001 · Spear-Phishing' },
    { id: 'L2', name: 'Authentication', range: '18–100%', color: '#a68b4b', desc: 'MFA bypass — FIDO2 (18%) to no MFA (100%). AiTM relays Push/SMS.', ttp: 'T1078 · Valid Accounts / T1621 · MFA Generation' },
    { id: 'L3', name: 'Interception', range: '90–98%', color: '#5c7ab4', desc: 'Session token capture via EvilProxy or Evilginx2 reverse proxy.', ttp: 'T1550.001 · Pass the Cookie' },
    { id: 'L4', name: 'Privilege', range: '80–95%', color: '#7c5c8b', desc: 'Post-compromise IAM escalation via centralized Salesforce / Entra ID.', ttp: 'T1021 · Remote Services / T1567.002 · Cloud Exfil' },
  ]

  return (
    <GlassCard className="p-5">
      <CardHeader icon={Activity} label="IEM Layer Architecture" sub="Sequential conditional probability · each layer gates the next" />
      <div className="space-y-3">
        {layers.map((layer, i) => (
          <div key={layer.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
                style={{ background: `${layer.color}14`, color: layer.color, border: `1px solid ${layer.color}28`, fontFamily: 'JetBrains Mono, monospace' }}>
                {layer.id}
              </div>
              {i < layers.length - 1 && <div className="w-px h-3 mt-1" style={{ background: C.border }} />}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold" style={{ color: C.text }}>{layer.name}</span>
                <span className="text-xs font-bold" style={{ color: layer.color, fontFamily: 'JetBrains Mono, monospace' }}>{layer.range}</span>
              </div>
              <p className="text-xs mb-1" style={{ color: C.textDim, lineHeight: 1.5, fontSize: '0.65rem' }}>{layer.desc}</p>
              <span className="px-2 py-0.5 rounded"
                style={{ background: 'rgba(139,174,180,0.06)', color: C.cyan, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', border: `1px solid rgba(139,174,180,0.12)` }}>
                {layer.ttp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// ── Main module ───────────────────────────────────────────────────────────────

export default function IEMModule() {
  const [institutions, setInstitutions] = useState(null)
  const [sensitivity,  setSensitivity]  = useState(null)
  const [simulator,    setSimulator]    = useState(null)
  const [campaign,     setCampaign]     = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [a, b, c, d] = await Promise.all([
          fetch(`${API}/iem/institutions`),
          fetch(`${API}/iem/sensitivity?institution=harvard`),
          fetch(`${API}/iem/simulator`),
          fetch(`${API}/iem/campaign?n_targets=50`),
        ])
        setInstitutions(await a.json())
        setSensitivity(await b.json())
        setSimulator(await c.json())
        setCampaign(await d.json())
      } catch (e) {
        setError('IEM engine offline — check backend connection')
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
          <Brain className="w-10 h-10 mx-auto mb-3 animate-pulse" style={{ color: C.cyan }} />
          <div className="text-sm font-medium" style={{ color: C.textDim }}>Running Monte Carlo simulation…</div>
          <div style={{ color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', marginTop: '4px' }}>N=100,000 · seed=42</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: C.red }} />
          <div className="text-sm" style={{ color: C.red }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Hero */}
      <div className="rounded-xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1018 0%, #0a1020 60%, #0c1628 100%)', border: `1px solid rgba(139,174,180,0.1)`, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(139,174,180,0.1)', border: '1px solid rgba(139,174,180,0.2)' }}>
                <Brain className="w-3.5 h-3.5" style={{ color: C.cyan }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700 }}>
                IEEE TIFS 2026 · Raj Bharti
              </span>
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: C.text, letterSpacing: '-0.01em' }}>
              Identity Exploitation Model
            </h2>
            <p className="text-sm max-w-lg" style={{ color: C.textDim, lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem' }}>
              Sequential probabilistic framework quantifying compound breach risk in
              Adversary-in-the-Middle campaigns against higher education institutions.
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-8">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '4px' }}>
              Harvard baseline
            </div>
            <div className="text-5xl font-black" style={{ color: '#a85c5c', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>61.2%</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: C.textMuted }}>P(breach) · Push MFA</div>
          </div>
        </div>

        <div className="mt-4 pt-4 grid grid-cols-4 gap-4" style={{ borderTop: `1px solid ${C.border}` }}>
          {[
            { label: 'ShinyHunters', value: '601K+ records' },
            { label: 'FIDO2 reduction', value: '−72%' },
            { label: 'Monte Carlo N',   value: '100,000' },
            { label: 'Layers',          value: 'L1 → L4' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="font-bold text-sm" style={{ color: C.cyan, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
              <div style={{ fontSize: '0.54rem', color: C.textMuted, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-5">
        <InstitutionBars data={institutions} />
        <SensitivityPanel data={sensitivity} />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <SimulatorMatrix data={simulator} />
        </div>
        <CampaignPanel data={campaign} />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-5">
        <RealtimeIEM />
        <LayerExplainer />
      </div>
    </div>
  )
}
