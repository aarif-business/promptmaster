/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fog: {
          DEFAULT: '#e6e5e4',
          muted:   '#dddcdb',
          border:  '#c8c6c4',
        },
        steel: {
          DEFAULT: '#516b84',
          dark:    '#3a4f62',
          light:   '#7a96ad',
          muted:   '#a8bfcf',
          faint:   '#d4e0e9',
        },
        slate: {
          DEFAULT: '#516b84',
          dark:    '#2c3e4f',
        },
      },
      fontFamily: {
        serif: ['"Yuji Syuku"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'Inter', 'sans-serif'],
      },
      keyframes: {
        'score-fill': {
          from: { width: '0%' },
          to:   { width: 'var(--score-width)' },
        },
      },
      animation: {
        'score-fill': 'score-fill 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
