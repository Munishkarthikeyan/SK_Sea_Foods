/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tide: {
          900: '#0F2A3D',
          800: '#163C52',
          600: '#2F5D74',
          400: '#6A8FA0',
        },
        paper: '#F6F3EC',
        catch: {
          DEFAULT: '#E2A33D',
          dark: '#C7862A',
        },
        sea: {
          light: '#E3F5F6',
          DEFAULT: '#3FB6C2',
          deep: '#1E7C88',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}