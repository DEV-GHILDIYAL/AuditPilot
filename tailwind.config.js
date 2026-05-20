/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apBackground: '#0E0E10',
        apSurface: '#1A1A1F',
        apBorder: '#2E2E38',
        apAccent: '#5B8DEF',
        apSuccess: '#34D399',
        apFailure: '#F87171',
        apWarning: '#FBBF24',
        apTextPrimary: '#F4F4F5',
        apTextMuted: '#71717A',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
