/**
 * Theme Management Utility for AuditPilot
 * Applies the selected theme globally and persists to localStorage for flash prevention.
 */

export function applyTheme(theme) {
  const selectedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', selectedTheme);
  try {
    localStorage.setItem('theme', selectedTheme);
  } catch (e) {
    console.warn('Failed to save theme to localStorage', e);
  }
}

export function getSavedTheme() {
  try {
    return localStorage.getItem('theme') || 'dark';
  } catch (e) {
    return 'dark';
  }
}
