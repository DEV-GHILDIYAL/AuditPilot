/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Use data-theme attribute on <html> to switch themes at runtime via CSS vars
  darkMode: ['attribute', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // All colors reference CSS variables so they update instantly when data-theme changes.
        // Values are defined in index.css under :root (dark) and [data-theme="light"] (light).
        apBackground:   'var(--ap-background)',
        apSurface:      'var(--ap-surface)',
        apBorder:       'var(--ap-border)',
        apAccent:       'var(--ap-accent)',
        apSuccess:      'var(--ap-success)',
        apFailure:      'var(--ap-failure)',
        apWarning:      'var(--ap-warning)',
        apTextPrimary:  'var(--ap-text-primary)',
        apTextMuted:    'var(--ap-text-muted)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
