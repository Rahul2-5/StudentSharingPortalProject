module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'DM Sans', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        surface: 'var(--surface)',
        page: 'var(--page)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        ai: {
          50: '#f5f3ff',
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      borderRadius: {
        control: '0.75rem',
        card: '1rem',
        surface: '1.25rem',
      },
    },
  },
  plugins: [],
};
