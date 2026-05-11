/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--surface-base)',
        panel: 'var(--surface-panel)',
        'panel-hover': 'var(--surface-elevated)',
        primary: {
          DEFAULT: 'var(--accent-cyan)',
          muted: 'var(--accent-teal)',
          light: 'var(--accent-cyan-dim)',
          dark: 'var(--accent-teal-deep)',
        },
        /** Nominal / healthy — desaturated graphite-teal, not “success green” */
        nominal: 'var(--semantic-nominal)',
        'nominal-muted': 'var(--semantic-nominal-muted)',
        accent: {
          teal: 'var(--accent-teal)',
          cyan: 'var(--accent-cyan)',
          amber: 'var(--accent-amber)',
          red: 'var(--accent-critical)',
        },
        warning: 'var(--accent-amber)',
        critical: 'var(--accent-critical)',
        info: 'var(--accent-cyan)',
        /** Legacy token; maps to nominal */
        success: 'var(--semantic-nominal)',
        text: {
          DEFAULT: 'var(--text-primary)',
          dim: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          DEFAULT: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        navy: 'var(--surface-navy)',
        graphite: 'var(--graphite)',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'argus-breathe': 'argus-breathe-opacity 5s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'argus-breathe-opacity': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        card: '0 0 0 1px rgba(255,255,255,0.04), 0 12px 24px -8px rgba(0, 0, 0, 0.55)',
        diffuse: '0 24px 48px -16px rgba(0, 0, 0, 0.65)',
      },
      backdropBlur: {
        xl: '20px',
        '2xl': '40px',
      },
    },
  },
  plugins: [],
}
