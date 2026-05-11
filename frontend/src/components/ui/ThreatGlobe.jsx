import { useEffect, useState, useRef } from 'react'

/* ═══════════════════════════════════════════════
   TACTICAL THREAT GLOBE — SVG Attack Visualization
   Minimal. Elegant. Fast. No 3D libraries.
   ═══════════════════════════════════════════════ */

const ATTACK_ORIGINS = [
  { id: 1, x: 280, y: 120, label: 'Moscow', country: 'RU' },
  { id: 2, x: 340, y: 165, label: 'Beijing', country: 'CN' },
  { id: 3, x: 200, y: 145, label: 'Tehran', country: 'IR' },
  { id: 4, x: 310, y: 195, label: 'Pyongyang', country: 'KP' },
  { id: 5, x: 120, y: 160, label: 'Lagos', country: 'NG' },
  { id: 6, x: 75, y: 100, label: 'São Paulo', country: 'BR' },
  { id: 7, x: 255, y: 180, label: 'Mumbai', country: 'IN' },
]

const TARGET = { x: 130, y: 95 } // USA east coast

function AttackArc({ from, to, delay, color = '#a85c5c' }) {
  const midX = (from.x + to.x) / 2
  const midY = Math.min(from.y, to.y) - 30 - Math.random() * 20
  const path = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`

  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" opacity="0.6"
        strokeDasharray="4 200"
        style={{
          animation: `arc-draw 3s ease-in-out ${delay}s infinite`,
        }}
      />
    </g>
  )
}

function PulseMarker({ x, y, color = '#a85c5c', delay = 0 }) {
  return (
    <g>
      <circle cx={x} cy={y} r="8" fill="none" stroke={color} strokeWidth="0.5" opacity="0">
        <animate attributeName="r" values="3;12" dur="2.5s" begin={`${delay}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="2.5s" begin={`${delay}s`} repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r="2" fill={color} opacity="0.8">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
      </circle>
    </g>
  )
}

export default function ThreatGlobe() {
  const [activeAttacks, setActiveAttacks] = useState(3)

  useEffect(() => {
    const t = setInterval(() => {
      setActiveAttacks(prev => Math.max(1, Math.min(7, prev + Math.floor((Math.random() - 0.4) * 3))))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="glass-panel-accent relative overflow-hidden" style={{ minHeight: 280 }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse-slow" />
          <span className="section-label">Global Threat Map</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-white/20">
          <span>{activeAttacks} LIVE VECTORS</span>
        </div>
      </div>

      {/* Globe SVG */}
      <div className="relative p-4">
        <svg viewBox="0 0 400 240" className="w-full">
          {/* World map simplified outlines */}
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(139,174,180,0.3)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="rgba(139,174,180,0.2)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid */}
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <line key={`h${i}`} x1="0" y1={i*30} x2="400" y2={i*30}
              stroke="rgba(139,174,180,0.05)" strokeWidth="0.5" />
          ))}
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => (
            <line key={`v${i}`} x1={i*30} y1="0" x2={i*30} y2="240"
              stroke="rgba(139,174,180,0.05)" strokeWidth="0.5" />
          ))}

          {/* Simplified continent outlines */}
          {/* North America */}
          <path d="M60,55 L80,50 L110,45 L135,50 L145,65 L140,80 L145,95 L140,105 L130,110 L115,105 L100,100 L90,90 L80,95 L65,85 L60,70 Z"
            fill="rgba(139,174,180,0.04)" stroke="rgba(139,174,180,0.14)" strokeWidth="0.5" />
          {/* South America */}
          <path d="M90,120 L105,115 L115,120 L120,140 L115,165 L105,185 L95,190 L85,180 L80,155 L82,135 Z"
            fill="rgba(139,174,180,0.04)" stroke="rgba(139,174,180,0.14)" strokeWidth="0.5" />
          {/* Europe */}
          <path d="M170,50 L185,45 L200,48 L210,55 L205,65 L195,72 L185,68 L175,70 L168,60 Z"
            fill="rgba(139,174,180,0.04)" stroke="rgba(139,174,180,0.14)" strokeWidth="0.5" />
          {/* Africa */}
          <path d="M170,80 L195,78 L205,85 L210,105 L205,135 L195,155 L180,160 L168,145 L165,120 L162,95 Z"
            fill="rgba(139,174,180,0.04)" stroke="rgba(139,174,180,0.14)" strokeWidth="0.5" />
          {/* Asia */}
          <path d="M215,40 L260,35 L300,42 L340,55 L355,70 L345,90 L330,100 L300,95 L275,100 L250,105 L230,95 L220,80 L210,65 Z"
            fill="rgba(139,174,180,0.04)" stroke="rgba(139,174,180,0.14)" strokeWidth="0.5" />
          {/* Australia */}
          <path d="M320,155 L350,150 L365,160 L360,175 L345,182 L325,178 L318,168 Z"
            fill="rgba(0,209,255,0.04)" stroke="rgba(0,209,255,0.12)" strokeWidth="0.5" />

          {/* Target — US Institution */}
          <circle cx={TARGET.x} cy={TARGET.y} r="20" fill="url(#radarGrad)" />
          <circle cx={TARGET.x} cy={TARGET.y} r="12" fill="none" stroke="var(--accent-cyan)" strokeWidth="0.5" opacity="0.3"
            strokeDasharray="2 4" style={{ transformOrigin: `${TARGET.x}px ${TARGET.y}px`, animation: 'ring-rotate 6s linear infinite' }} />
          <PulseMarker x={TARGET.x} y={TARGET.y} color="var(--accent-cyan)" delay={0} />

          {/* Attack arcs */}
          {ATTACK_ORIGINS.slice(0, activeAttacks).map((origin, i) => (
            <AttackArc key={origin.id} from={origin} to={TARGET} delay={i * 0.8} />
          ))}

          {/* Attack origins */}
          {ATTACK_ORIGINS.slice(0, activeAttacks).map((origin, i) => (
            <PulseMarker key={origin.id} x={origin.x} y={origin.y} color="var(--accent-critical)" delay={i * 0.5} />
          ))}

          {/* Origin labels */}
          {ATTACK_ORIGINS.slice(0, Math.min(activeAttacks, 4)).map(origin => (
            <text key={`l-${origin.id}`} x={origin.x + 6} y={origin.y - 6}
              fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="Space Grotesk, monospace">
              {origin.label}
            </text>
          ))}

          {/* Radar sweep at target */}
          <g style={{ transformOrigin: `${TARGET.x}px ${TARGET.y}px`, animation: 'ring-rotate 4s linear infinite' }}>
            <line x1={TARGET.x} y1={TARGET.y} x2={TARGET.x + 25} y2={TARGET.y - 5}
              stroke="var(--accent-cyan)" strokeWidth="0.5" opacity="0.3" />
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 right-5 flex items-center gap-4 text-[8px] font-mono text-white/20">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-critical" />
            <span>ATTACK ORIGIN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>PROTECTED ASSET</span>
          </div>
        </div>
      </div>
    </div>
  )
}
