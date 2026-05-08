export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void:    '#07070c',
        base:    '#0e0e15',
        raised:  '#15151e',
        overlay: '#1c1c28',
        v: {
          DEFAULT: '#7c3aed',
          hover:   '#6d28d9',
          dim:     'rgba(124,58,237,0.14)',
          glow:    'rgba(124,58,237,0.28)',
          light:   'rgba(124,58,237,0.06)',
        },
        rose: {
          DEFAULT: '#f43f5e',
          dim:     'rgba(244,63,94,0.12)',
        },
        emerald: {
          DEFAULT: '#10b981',
          dim:     'rgba(16,185,129,0.12)',
        },
        t1: 'rgba(255,255,255,0.92)',
        t2: 'rgba(255,255,255,0.55)',
        t3: 'rgba(255,255,255,0.25)',
        t4: 'rgba(255,255,255,0.07)',
        t5: 'rgba(255,255,255,0.04)',
      },
      boxShadow: {
        violet: '0 0 20px rgba(124,58,237,0.2)',
        card:   '0 0 0 1px rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
};
