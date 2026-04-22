/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--text)',
        card: 'var(--card)',
        card2: 'var(--card2)',
        primary: 'var(--text)',
        primaryForeground: 'var(--bg)',
        muted: 'var(--muted)',
        t2: 'var(--t2)',
        b1: 'var(--b)',
        b2: 'var(--b2)',
        blue: {
          DEFAULT: '#38BDF8',
          dim: 'rgba(56, 189, 248, 0.12)',
          mid: 'rgba(56, 189, 248, 0.25)',
        },
        ok: {
          DEFAULT: '#10B981',
          dim: 'rgba(16,185,129,.12)',
        },
        warn: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245,158,11,.12)',
        },
        danger: {
          DEFAULT: '#EF4444',
          dim: 'rgba(239,68,68,.12)',
        },
        cat: {
          se: '#EF4444',
          dos: '#FFFFFF',
          int: '#F59E0B',
          con: '#8B5CF6',
          mec: '#F97316',
          gen: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
