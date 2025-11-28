const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // บอกให้ Tailwind สแกนไฟล์ React
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'tplus-bg': '#f4f6f8',
        'tplus-text': '#333333',
        'tplus-orange': '#ff6600',
        'tplus-border': '#dddddd',
        olive: {
          50: '#f9faf5',
          100: '#f1f4e8',
          200: '#e2e9d0',
          300: '#ccd8ae',
          400: '#b3c285',
          500: '#96ab5f',
          600: '#768a48',
          700: '#5a6a38',
          800: '#45522d',
          900: '#384427',
          950: '#1d2414',
        },
      },
    },
  },
  plugins: [],
}