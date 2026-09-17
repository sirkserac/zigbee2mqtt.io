/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        arei: {
          50: '#fff7e6',
          100: '#ffe9b3',
          200: '#ffd980',
          300: '#ffc94d',
          400: '#ffba26',
          500: '#f5a300',
          600: '#cc8600',
          700: '#a36a00',
          800: '#7a4f00',
          900: '#523500',
        },
      },
    },
  },
  plugins: [],
};
