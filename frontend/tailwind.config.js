/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#0f0f1a',
          1: '#141428',
          2: '#1a1a35',
          3: '#21213f',
          4: '#2a2a50',
        },
        accent: {
          cyan:   '#22d3ee',
          violet: '#a78bfa',
          emerald:'#34d399',
          amber:  '#fbbf24',
          rose:   '#f43f5e',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(240,100%,74%,0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(268,100%,72%,0.08) 0px, transparent 50%)',
        'card-glow': 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'glow-pulse':  'glowPulse 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':     'fadeIn 0.3s ease-out',
        'spin-slow':   'spin 8s linear infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(99,102,241,0.6)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(99,102,241,0.3)',
        'glow':     '0 0 20px rgba(99,102,241,0.4)',
        'glow-lg':  '0 0 40px rgba(99,102,241,0.5)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':'0 8px 40px rgba(0,0,0,0.5)',
        'glass':    'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
