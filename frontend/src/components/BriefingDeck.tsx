import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArgusAtmosphere } from './ui/ArgusAtmosphere'

const SLIDES = [
  {
    kicker: 'ARGUS / PHILOSOPHY',
    title: 'Cyber awareness as infrastructure.',
    line: 'Operational trust is engineered — not assumed.',
  },
  {
    kicker: 'CONTEXT',
    title: 'The modern security crisis.',
    line: 'Volumes rise. Mean time to understanding does not.',
  },
  {
    kicker: 'DIAGNOSIS',
    title: 'Fragmented visibility.',
    line: 'Alerts without correlation are noise. Noise is risk.',
  },
  {
    kicker: 'SYSTEM',
    title: 'Introducing ARGUS.',
    line: 'An operational intelligence fabric for detection, identity, and response.',
  },
  {
    kicker: 'SENTINEL',
    title: 'Live attack reconstruction.',
    line: 'Telemetry, MITRE alignment, and velocity — in one operational stream.',
  },
  {
    kicker: 'ORACLE',
    title: 'Threat correlation intelligence.',
    line: 'Incident fusion: attack chains, lateral movement, timelines.',
  },
  {
    kicker: 'IDENTITY',
    title: 'Behavioral trust systems.',
    line: 'Trust analytics, drift, impossible travel, session integrity.',
  },
  {
    kicker: 'RESPONSE',
    title: 'Autonomous containment.',
    line: 'Playbooks, orchestration, quarantine — command-grade execution.',
  },
  {
    kicker: 'FUSION',
    title: 'Operational threat intelligence.',
    line: 'Actor context, CVE velocity, bulletin discipline.',
  },
  {
    kicker: 'OUTCOME',
    title: 'From alerts to understanding.',
    line: '(ARGUS closes the cognition gap.)',
  },
]

export default function BriefingDeck() {
  const [i, setI] = useState(0)
  const pct = Math.round(((i + 1) / SLIDES.length) * 100)

  const next = useCallback(() => setI(x => Math.min(x + 1, SLIDES.length - 1)), [])
  const prev = useCallback(() => setI(x => Math.max(x - 1, 0)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const slide = SLIDES[i]

  return (
    <div className="fixed inset-0 z-[200] bg-background text-text overflow-hidden flex flex-col font-sans">
      <ArgusAtmosphere />

      <header className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-border/80 backdrop-blur-sm bg-panel/40">
        <div className="font-mono text-[9px] tracking-[0.35em] text-text-muted uppercase">ARGUS · CLASSIFIED SYSTEM BRIEF</div>
        <div className="flex items-center gap-8 font-mono text-[9px] text-text-muted">
          <span>
            FRAME {String(i + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
          <span className="opacity-55">CAT OPS-ISR / REL 4</span>
          <Link
            to="/"
            className="uppercase tracking-[0.25em] text-accent-cyan hover:text-text transition-colors"
          >
            Exit briefing
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-12 md:px-24 lg:px-32">
        <div
          className="pointer-events-none absolute inset-6 border opacity-[0.06] rounded-sm"
          style={{ borderColor: 'var(--accent-cyan)' }}
          aria-hidden
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl w-full space-y-10"
          >
            <p className="font-mono text-[10px] tracking-[0.42em] text-text-muted uppercase">{slide.kicker}</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] font-semibold leading-[1.12] tracking-tight text-text">
              {slide.title}
            </h1>
            <p className="text-lg md:text-xl text-text-dim font-light max-w-2xl leading-relaxed">{slide.line}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="relative z-10 px-10 py-6 border-t border-border/80 bg-panel/30 backdrop-blur-sm">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex-1 h-px bg-border overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-accent-cyan/50"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <span className="font-mono text-[9px] text-text-muted tabular-nums w-10 text-right">{pct}%</span>
        </div>
        <div className="flex justify-between items-center font-mono text-[9px] text-text-muted">
          <button
            type="button"
            onClick={prev}
            disabled={i === 0}
            className="uppercase tracking-[0.2em] hover:text-accent-cyan disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="opacity-55 hidden sm:inline">← → Navigate · Space advance</span>
          <button
            type="button"
            onClick={next}
            disabled={i === SLIDES.length - 1}
            className="uppercase tracking-[0.2em] hover:text-accent-cyan disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  )
}
