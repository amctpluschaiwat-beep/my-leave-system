module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // บอกให้ Tailwind สแกนไฟล์ React
  ],
  theme: {
    extend: {
      // เพิ่มสี "olive" จาก Template ที่คุณส่งมา
      colors: {
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