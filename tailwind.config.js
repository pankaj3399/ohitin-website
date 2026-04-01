/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#050709',
          900: '#0B0F14',
          850: '#0F1419',
          800: '#141A22',
          700: '#1C2432',
          600: '#243040',
          500: '#2E3D52',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.04)',
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          medium: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.12)',
        },
        accent: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
