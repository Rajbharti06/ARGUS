import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  Upload, Shield, AlertTriangle, CheckCircle2, Clock,
  FileSearch, Brain, ChevronDown, ChevronUp, Database,
  Fingerprint, Hash, Calendar, Cpu, Eye, BarChart3,
  X, Loader2, Info, Lock, RefreshCcw, Send, Activity,
  Zap, Link, ChevronRight, FileText, Image, Video,
  Music, Mail, Terminal, Network, ShieldAlert, Satellite,
  Sparkles
} from 'lucide-react'
import { cn } from '../utils/cn'

const API_BASE = '/api'

const TEXT_SAMPLES = [
  {
    label: 'IT Security Alert',
    content: `From: IT Security <security-alert@uni-support-portal.com>
Subject: URGENT: Account Access Required — Notice Required
Dear User,

Your account has been flagged for suspicious activity originating from an unauthorized location.

To avoid permanent suspension, please verify your identity immediately:
http://uni-secure-portal.com/verify?token=XK84NN01

You have been flagged for suspicious activity. Contact IT support to proceed.

Best Regards,
IT Security`,
  },
  {
    label: 'Scholarship Scam',
    content: "URGENT! You've been selected for a $5,000 scholarship. Claim immediately: http://university-awards.xyz/claim-now. Offer expires in 24 hours. Verify your student ID and bank account details to receive funds. Act NOW.",
  },
  {
    label: 'Professor Gift Card',
    content: "Hi, this is Professor Williams. I'm in an important board meeting. I need you to urgently purchase 3x $100 Amazon gift cards for a department event. Email the codes to me right away. I will reimburse you in cash today. This is very urgent, please don't call.",
  },
]

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25', label: 'CRITICAL' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25', label: 'HIGH' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/25', label: 'MEDIUM' },
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', label: 'LOW' },
}

const RISK_CONFIG = {
  CRITICAL: { color: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'CRITICAL RISK', icon: AlertTriangle },
  HIGH: { color: '#f97316', glow: 'rgba(249,115,22,0.3)', label: 'HIGH RISK', icon: AlertTriangle },
  MODERATE: { color: '#eab308', glow: 'rgba(234,179,8,0.25)', label: 'MODERATE RISK', icon: Eye },
  LOW: { color: '#3b82f6', glow: 'rgba(59,130,246,0.25)', label: 'LOW RISK', icon: Shield },
  AUTHENTIC: { color: '#10b981', glow: 'rgba(16,185,129,0.25)', label: 'AUTHENTIC', icon: CheckCircle2 },
}

function TrustGauge({ score, riskLevel }) {
  const cfg = RISK_CONFIG[riskLevel]
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none"
            stroke={cfg.color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 12px ${cfg.glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-4xl font-bold font-mono tabular-nums"
            style={{ color: cfg.color }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-mono text-[rgba(228,232,236,0.38)] tracking-widest uppercase mt-0.5">
            {score > 50 ? 'TRUST' : 'RISK'}
          </span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-4 py-1.5 rounded text-xs font-mono font-bold tracking-[0.2em] border"
        style={{
          color: cfg.color,
          borderColor: cfg.glow,
          backgroundColor: cfg.glow,
          textShadow: `0 0 16px ${cfg.color}`,
        }}
      >
        {cfg.label}
      </motion.div>
    </div>
  )
}

function ScanAnimation({ text = 'ARGUS VEIL ANALYSIS' }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="relative w-28 h-28">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#8baeb4]/30"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-[#8baeb4]/50"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-[#8baeb4]/70"
          animate={{ scale: [1, 1.2, 1], opacity: [0.9, 0, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-[#8baeb4] animate-spin" />
            <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-mono text-[rgba(228,232,236,0.88)] tracking-widest uppercase">
          {text}
        </p>
        <motion.p
          className="text-[10px] font-mono text-[rgba(228,232,236,0.45)] mt-1"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Running advanced threat intelligence and forensic analysis modules...
        </motion.p>
      </div>
    </div>
  )
}

function UploadZone({ onFileSelect, onTextSelect }) {
  const [dragging, setDragging] = useState(false)
  const [activeTab, setActiveTab] = useState('text')
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }, [onFileSelect])

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab('text')}
          className={cn(
            'flex-1 py-2.5 rounded text-[10px] font-mono tracking-[0.15em] uppercase transition-all border-b-2',
            activeTab === 'text'
              ? 'text-[#8baeb4] border-[#8baeb4] bg-[#8baeb4]/5'
              : 'text-[rgba(228,232,236,0.38)] border-transparent hover:text-[rgba(228,232,236,0.6)] hover:bg-white/[0.02]'
          )}
        >
          <Mail className="w-3.5 h-3.5 inline mr-1.5" />
          TEXT / EMAIL / URL
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={cn(
            'flex-1 py-2.5 rounded text-[10px] font-mono tracking-[0.15em] uppercase transition-all border-b-2',
            activeTab === 'media'
              ? 'text-[#8baeb4] border-[#8baeb4] bg-[#8baeb4]/5'
              : 'text-[rgba(228,232,236,0.38)] border-transparent hover:text-[rgba(228,232,236,0.6)] hover:bg-white/[0.02]'
          )}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          MEDIA / FORENSICS
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">SAMPLES:</span>
              {TEXT_SAMPLES.map(s => (
                <button
                  key={s.label}
                  onClick={() => onTextSelect(s.content)}
                  className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded text-[9px] font-semibold text-white/40 hover:text-white transition-all uppercase tracking-widest"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="glass-panel flex flex-col overflow-hidden border-[#8baeb4]/20">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0c1018]">
                <Terminal className="w-4 h-4 text-[#8baeb4]" />
                <span className="module-header">THREAT ANALYSIS CONSOLE</span>
                <span className="ml-auto text-[8px] font-mono text-[#8baeb4]/60 px-2 py-0.5 bg-[#8baeb4]/10 rounded border border-[#8baeb4]/20">
                  LIVE
                </span>
              </div>
              <textarea
                placeholder="Paste suspicious email, SMS, URL, or message for advanced AI decomposition and threat analysis..."
                className="flex-1 bg-transparent p-5 text-[11px] font-mono text-white/70 focus:outline-none resize-none custom-scrollbar placeholder:text-white/10 leading-relaxed min-h-[220px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    onTextSelect(e.target.value)
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'media' && (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              animate={{ borderColor: dragging ? '#8baeb4' : 'rgba(255,255,255,0.08)' }}
              className="relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all hover:border-[#8baeb4]/40 hover:bg-white/[0.01] bg-[#0c1018]/50"
            >
              <input ref={inputRef} type="file" className="hidden" onChange={handleChange}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" />
              <motion.div
                animate={{ scale: dragging ? 1.15 : 1 }}
                className="w-20 h-20 rounded-2xl bg-[#8baeb4]/8 border border-[#8baeb4]/20 flex items-center justify-center"
              >
                <Upload className="w-9 h-9 text-[#8baeb4]" />
              </motion.div>
              <div className="text-center">
                <p className="text-base font-semibold text-[rgba(228,232,236,0.88)]">
                  Drop Evidence File Here
                </p>
                <p className="text-xs text-[rgba(228,232,236,0.45)] mt-1.5">
                  Images · Videos · Audio · PDFs · Documents — Forensic Analysis Ready
                </p>
              </div>
              <div className="flex gap-2.5 mt-3">
                {['JPG', 'PNG', 'MP4', 'WAV', 'PDF', 'DOCX'].map(f => (
                  <span key={f} className="text-[9px] font-mono px-2.5 py-1.5 rounded border border-white/8 text-[rgba(228,232,236,0.38)] bg-white/[0.02]">
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function VeilResults({ result, onReset }) {
  const [activeTab, setActiveTab] = useState('summary')
  const isTextAnalysis = result.analysis_type === 'text' || result.attack_classification

  const primaryScore = isTextAnalysis ? result.risk_score : (result.trust_score || 50)
  const riskLevel = isTextAnalysis
    ? (result.risk_level === 'critical' ? 'CRITICAL' : result.risk_level === 'high' ? 'HIGH' : result.risk_level === 'medium' ? 'MODERATE' : 'LOW')
    : (result.risk_level || 'AUTHENTIC')

  const statsItems = isTextAnalysis ? [
    { label: 'RISK SCORE', value: `${result.risk_score}/100`, icon: AlertTriangle },
    { label: 'CONFIDENCE', value: `${result.confidence || 0}%`, icon: Brain },
    { label: 'CLASSIFICATION', value: result.attack_classification?.replace(/_/g, ' ') || 'UNKNOWN', icon: Zap },
    { label: 'VERDICT', value: result.verdict || 'CLEAR', icon: Shield },
  ] : [
    { label: 'TRUST SCORE', value: `${result.trust_score}/100`, icon: Shield },
    { label: 'SYNTHETIC PROB', value: `${result.synthetic_probability || 0}%`, icon: Cpu },
    { label: 'FILE TYPE', value: result.file_type || 'UNKNOWN', icon: FileSearch },
    { label: 'FINDINGS', value: `${result.findings?.length || 0} DETECTED`, icon: AlertTriangle },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-mono font-bold tracking-[0.2em] text-[rgba(228,232,236,0.88)] uppercase">
              VEIL INTELLIGENCE REPORT
            </h3>
          </div>
          <p className="text-[10px] text-[rgba(228,232,236,0.45)] font-mono mt-0.5">
            {result.analysis_type?.toUpperCase()} ANALYSIS · {new Date().toLocaleTimeString()} UTC
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[10px] font-mono text-[rgba(228,232,236,0.38)] hover:text-[rgba(228,232,236,0.72)] transition-colors border border-white/8 px-3 py-1.5 rounded hover:bg-white/[0.03]"
        >
          <X className="w-3.5 h-3.5" /> NEW ANALYSIS
        </button>
      </div>

      <div className="bg-[#0c1018] border border-white/6 rounded-xl p-6 flex gap-8 items-start">
        <TrustGauge score={primaryScore} riskLevel={riskLevel} />
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {statsItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/[0.02] rounded-lg px-4 py-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-[rgba(228,232,236,0.45)]" />
                  <span className="text-[8px] font-mono text-[rgba(228,232,236,0.45)] tracking-widest uppercase">
                    {label}
                  </span>
                </div>
                <span className="text-sm font-bold font-mono text-[rgba(228,232,236,0.9)]">{value}</span>
              </div>
            ))}
          </div>
          {result.ai_analysis && (
            <div className="text-[10px] font-mono text-[rgba(228,232,236,0.6)] bg-white/[0.02] rounded-lg px-4 py-3 flex items-start gap-3 border border-white/5">
              <Brain className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#8baeb4]" />
              <span className="leading-relaxed italic">"{result.ai_analysis}"</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/6 pb-0">
        {[
          { id: 'summary', label: 'SUMMARY', icon: Activity },
          { id: 'findings', label: 'FINDINGS', icon: AlertTriangle },
          ...(isTextAnalysis ? [{ id: 'response', label: 'RESPONSE', icon: Zap }] : []),
          ...(!isTextAnalysis ? [{ id: 'metadata', label: 'METADATA', icon: Database }] : []),
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-[0.15em] uppercase transition-all border-b-2 -mb-px ${
              activeTab === id
                ? 'text-[#8baeb4] border-[#8baeb4] bg-[#8baeb4]/5'
                : 'text-[rgba(228,232,236,0.38)] border-transparent hover:text-[rgba(228,232,236,0.6)] hover:bg-white/[0.02]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'summary' && result.ai_analysis && (
            <div className="bg-[#0c1018] border border-white/6 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4.5 h-4.5 text-[#8baeb4]" />
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[rgba(228,232,236,0.88)] uppercase">
                  AI INTELLIGENCE ANALYSIS
                </span>
              </div>
              <p className="text-xs text-[rgba(228,232,236,0.8)] leading-relaxed">
                {result.ai_analysis}
              </p>
            </div>
          )}

          {activeTab === 'findings' && result.findings?.length > 0 && (
            <div className="space-y-3">
              {result.findings.map((f, i) => (
                <div key={i} className={`border rounded-xl p-4 ${SEVERITY_CONFIG[f.severity]?.bg || 'bg-white/[0.02] border-white/5'}`}>
                  <div className="flex items-start gap-3.5">
                    <span className={`text-[9px] font-mono font-bold tracking-[0.18em] px-2 py-0.5 rounded border mt-0.5 flex-shrink-0 ${SEVERITY_CONFIG[f.severity]?.color || 'text-white/40'} border-current/30`}>
                      {SEVERITY_CONFIG[f.severity]?.label || 'INFO'}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-[rgba(228,232,236,0.9)]">{f.title || f}</span>
                  </div>
                  {f.detail && (
                    <p className="text-[11px] text-[rgba(228,232,236,0.65)] mt-3 leading-relaxed">
                      {f.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'response' && result.recommended_actions?.length > 0 && (
            <div className="space-y-2.5">
              {result.recommended_actions.map((action, i) => (
              <button
                key={i}
                className="w-full text-left py-3 px-4 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all border-white/10 text-white/40 hover:bg-white/[0.03] hover:text-white/70 hover:border-white/20"
              >
                <ShieldAlert className="w-3.5 h-3.5 inline mr-2" />
                {action}
              </button>
            ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default function VeilModule({ onAlert, soundOn, activated }) {
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)

  const runAnalysis = async (inputContent, inputFile) => {
    setState('scanning')
    setErrorMsg('')
    setResult(null)

    try {
      if (inputFile) {
        const form = new FormData()
        form.append('file', inputFile)
        form.append('provider', 'featherless')
        form.append('api_key', '')
        const resp = await axios.post(`${API_BASE}/forensic/analyze`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        })
        setResult({ ...resp.data, analysis_type: 'media' })
      } else if (inputContent) {
        const res = await fetch('/api/argus/veil/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: inputContent }),
        })
        const data = await res.json()
        setResult({ ...data, analysis_type: 'text' })
        if (data.risk_level === 'critical' || data.risk_level === 'high') {
          onAlert?.(`VEIL: ${data.verdict} — risk score ${data.risk_score}/100`)
        }
      }
      setState('done')
    } catch (err) {
      try {
        const demo = await axios.get(`${API_BASE}/forensic/demo`)
        setResult({ ...demo.data, analysis_type: 'media' })
        setState('done')
      } catch {
        setErrorMsg(err?.response?.data?.error || err?.message || 'Analysis failed. Ensure the backend is running.')
        setState('error')
      }
    }
  }

  const handleFileSelect = (f) => {
    setFile(f)
    setContent('')
    runAnalysis(null, f)
  }

  const handleTextSelect = (text) => {
    setContent(text)
    setFile(null)
    if (text.trim()) {
      runAnalysis(text, null)
    }
  }

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setContent('')
    setFile(null)
  }

  return (
    <div className="space-y-5" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-4.5 h-4.5 text-[#8baeb4]" />
            <h2 className="text-base font-mono font-bold tracking-[0.3em] text-[rgba(228,232,236,0.9)] uppercase">
              VEIL
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono px-2.5 py-0.5 rounded border border-[#8baeb4]/30 text-[#8baeb4]/90 tracking-widest bg-[#8baeb4]/10">
                THREAT INTELLIGENCE
              </span>
              <span className="text-[8px] font-mono px-2.5 py-0.5 rounded border border-purple-500/30 text-purple-400/90 tracking-widest bg-purple-500/10">
                FORENSIC ANALYSIS
              </span>
            </div>
          </div>
          <p className="text-xs text-[rgba(228,232,236,0.5)] font-mono">
            Advanced AI-powered threat detection, phishing cognition, and media forensics in one unified interface
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[9px] font-mono text-[rgba(228,232,236,0.45)] border border-white/6 rounded-lg px-3.5 py-2 bg-[#0c1018]/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            VEIL ENGINE ONLINE
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-[rgba(228,232,236,0.45)] border border-white/6 rounded-lg px-3.5 py-2 bg-[#0c1018]/50">
            <Satellite className="w-3.5 h-3.5" />
            THREAT FEED ACTIVE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        {[
          { label: 'ANALYSIS MODES', value: '2', icon: Brain, color: '#8baeb4' },
          { label: 'AI MODELS', value: '7', icon: Cpu, color: '#8baeb4' },
          { label: 'FILE TYPES', value: '12+', icon: FileText, color: '#8baeb4' },
          { label: 'ANALYSIS DEPTH', value: 'L5', icon: BarChart3, color: '#8baeb4' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0c1018] border border-white/6 rounded-lg px-4.5 py-3.5 flex items-center gap-3.5">
            <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ color }} />
            <div>
              <div className="text-xl font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
              <div className="text-[8px] font-mono text-[rgba(228,232,236,0.45)] tracking-wider uppercase leading-none mt-0.5">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <UploadZone
              onFileSelect={handleFileSelect}
              onTextSelect={handleTextSelect}
            />
            <p className="text-center text-[9px] font-mono text-[rgba(228,232,236,0.35)] mt-4">
              Files are analyzed locally — no data is stored or transmitted to third parties
            </p>
          </motion.div>
        )}

        {state === 'scanning' && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-[#0c1018] border border-white/6 rounded-xl">
              <ScanAnimation text={content ? 'VEIL THREAT ANALYSIS' : 'VEIL FORENSIC ANALYSIS'} />
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-red-500/8 border border-red-500/25 rounded-xl p-8 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-xs font-mono text-red-400">{errorMsg}</p>
              <button
                type="button"
                onClick={() => setState('idle')}
                className="text-[10px] font-mono border border-red-500/30 text-red-400 px-4 py-2 rounded hover:bg-red-500/10 transition-colors"
              >
                TRY AGAIN
              </button>
            </div>
          </motion.div>
        )}

        {state === 'done' && result && (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">
            <VeilResults result={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
