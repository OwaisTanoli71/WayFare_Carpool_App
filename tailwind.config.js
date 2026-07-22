/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14181C',
          50: '#F1EDE5',
          100: '#8B9298',
          300: '#5C646B',
          400: '#8B9298',
          700: '#2A3138',
          800: '#20262C',
          900: '#14181C'
        },
        surface: {
          DEFAULT: '#1B2025',
          2: '#20262C'
        },
        line: {
          DEFAULT: '#2A3138',
          soft: '#252B31'
        },
        marigold: {
          DEFAULT: '#E8A33D',
          dim: '#4A3A1E'
        },
        teal: {
          DEFAULT: '#4FBDBA',
          dim: '#1E3A39'
        },
        coral: {
          DEFAULT: '#E8654F',
          dim: '#3E2420'
        },
        beacon: {
          DEFAULT: '#FFB238',
          dark: '#E0932A',
          light: '#FFD08A'
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626'
        },
        verified: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669'
        }
      },
      fontFamily: {
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      backgroundImage: {
        'route-gradient': 'linear-gradient(90deg, #E8A33D 0%, #4FBDBA 100%)',
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(232,163,61,0.15), transparent 60%)'
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(255,178,56,0.35)',
        card: '0 8px 30px -12px rgba(0,0,0,0.6)',
        'card-hover': '0 20px 40px -16px rgba(0,0,0,0.8), 0 0 40px -8px rgba(255,178,56,0.15)',
        inner: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'inner-beacon': 'inset 0 1px 0 0 rgba(255, 178, 56, 0.2)'
      },
      keyframes: {
        dash: {
          to: { strokeDashoffset: -24 }
        },
        drift: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        pulseSoft: {
          '0%,100%': { opacity: 1 },
          '50%': { opacity: 0.55 }
        },
        rise: {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        dash: 'dash 1.2s linear infinite',
        drift: 'drift 4s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        rise: 'rise 0.6s cubic-bezier(0.16,1,0.3,1) both'
      }
    }
  },
  plugins: []
}
