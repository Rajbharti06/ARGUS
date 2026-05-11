import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ExternalLink, ShieldAlert } from 'lucide-react'

/* ═══════════════════════════════════════════════
   GLOBAL THREAT INTELLIGENCE — Real-time News Feed
   Live cybersecurity bulletins from global sources
   ═══════════════════════════════════════════════ */

export default function GlobalThreatIntelligence() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const containerRef = useRef(null)

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/intelligence/news')
      const data = await response.json()
      setNews(data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch cyber news:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(() => {
      if (!paused) fetchNews()
    }, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [paused])

  return (
    <div className="glass-panel-accent flex flex-col overflow-hidden" style={{ maxHeight: 400 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span className="section-label">Global Threat Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-nominal animate-pulse-slow" />
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
            Live Feed
          </span>
        </div>
      </div>

      {/* Feed */}
      <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-white/10 text-xs font-mono uppercase tracking-widest">
            Synchronizing with global intel...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {news.map((item, idx) => (
              <motion.div
                key={item.link + idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-4 py-3 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group relative"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-critical" />
                    <span className="text-[9px] font-bold font-mono text-critical uppercase tracking-widest">
                      Bulletin
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-white/20 uppercase">
                    {item.source}
                  </span>
                </div>
                
                <h3 className="text-xs font-bold text-white/80 leading-snug group-hover:text-primary transition-colors mb-2">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-white/30 italic">
                    {item.published}
                  </span>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest"
                  >
                    Analysis <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2 bg-white/[0.01] border-t border-white/[0.03] text-[8px] font-mono text-white/10 uppercase tracking-[0.2em] text-center">
        Sourced from institutional threat databases & global research feeds
      </div>
    </div>
  )
}
