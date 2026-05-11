/**
 * Layered ambient depth: grid, crosshair ticks, radar arc, grain — 2–8% perceived opacity.
 */
export function ArgusAtmosphere({ className = '' }) {
  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 ${className}`} aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(10, 22, 40, 0.9), transparent 55%), radial-gradient(ellipse 80% 50% at 100% 100%, rgba(17, 28, 42, 0.5), transparent 50%)',
        }}
      />
      <div className="absolute inset-0 argus-grid-bg opacity-[0.35]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="radarFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139,174,180,0.5)" />
            <stop offset="100%" stopColor="rgba(139,174,180,0)" />
          </linearGradient>
        </defs>
        <g stroke="rgba(139,174,180,0.15)" strokeWidth="0.12" vectorEffect="non-scaling-stroke" fill="none">
          <line x1="12" y1="0" x2="12" y2="100" />
          <line x1="88" y1="0" x2="88" y2="100" />
          <line x1="0" y1="22" x2="100" y2="22" />
          <line x1="0" y1="78" x2="100" y2="78" />
        </g>
        <path
          d="M 50 88 A 38 38 0 0 1 88 50"
          stroke="url(#radarFade)"
          strokeWidth="0.15"
          fill="none"
          opacity="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'256\' height=\'256\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}
