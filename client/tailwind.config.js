/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core default workspace colors
        editor: {
          bg: '#1E1E1E',
          sidebar: '#252526',
          navbar: '#3C3C3C',
          activeTab: '#1E1E1E',
          inactiveTab: '#2D2D2D',
          border: '#333333',
          accent: '#569CD6',
          text: '#D4D4D4',
          muted: '#858585'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
