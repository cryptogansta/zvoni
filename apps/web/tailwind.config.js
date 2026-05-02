/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08080C',
        surface: '#12121A',
        'surface-elevated': '#1B1B27',
        'surface-hover': '#22223A',
        accent: '#B6FF3B',
        'accent-dim': '#8FCC2D',
        secondary: '#7C3BFF',
        'secondary-dim': '#5E2ECC',
        cyan: '#00D1FF',
        danger: '#FF3366',
        'danger-dim': '#CC2950',
        text: '#F4F4F7',
        muted: '#9A9AAF',
        border: '#2A2A3F',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(182, 255, 59, 0.3)',
        'glow-danger': '0 0 20px rgba(255, 51, 102, 0.4)',
        'glow-secondary': '0 0 20px rgba(124, 59, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
