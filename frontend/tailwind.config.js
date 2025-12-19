/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // GitHub Dark Mode Colors with Variations
        'gh-bg': '#0d1117',
        'gh-bg-secondary': '#161b22',
        'gh-bg-tertiary': '#21262d',
        'gh-bg-hover': '#262c36',
        'gh-border': '#30363d',
        'gh-border-muted': '#21262d',
        'gh-text': '#e6edf3',
        'gh-text-secondary': '#8b949e',
        'gh-text-tertiary': '#6e7681',
        'gh-accent': '#58a6ff',
        'gh-accent-hover': '#79c0ff',
        'gh-success': '#3fb950',
        'gh-success-light': '#26843b',
        'gh-danger': '#f85149',
        'gh-danger-light': '#da3633',
        'gh-warning': '#d29922',
        'gh-warning-light': '#9e6a03',
        'gh-info': '#79c0ff',
        'gh-info-light': '#0969da',
        'gh-purple': '#bc8ef7',
        'gh-purple-light': '#6e40aa',
        'gh-pink': '#f778ba',
        'gh-pink-light': '#ae3a7a',
        primary: {
          50: '#eff6ff',
          500: '#58a6ff',
          600: '#3b82f6',
          700: '#1f6feb',
        }
      },
      backgroundColor: {
        'dark': '#0d1117',
        'dark-secondary': '#161b22',
        'dark-tertiary': '#21262d',
      },
      textColor: {
        'dark': '#e6edf3',
        'dark-secondary': '#8b949e',
      },
      borderColor: {
        'dark': '#30363d',
      }
    },
  },
  plugins: [],
}
