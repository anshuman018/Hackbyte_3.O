/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#0b3030',
          light: '#379e7e',
          // Add more shades if needed
          DEFAULT: '#379e7e',
          50: '#f0f9f6',
          100: '#d5f0e6',
          200: '#bbe7d6',
          300: '#92d4bc',
          400: '#69c1a2',
          500: '#379e7e',
          600: '#2c7f65',
          700: '#21604c',
          800: '#164032',
          900: '#0b2019'
        }
      }
    }
  },
  plugins: [],
  safelist: [
    'bg-primary-light',
    'hover:bg-primary-light',
    'text-primary-light',
    'hover:text-primary-light',
    'border-primary-light',
    'shadow-primary-light',
    {
      pattern: /(bg|text|border|shadow)-primary-(light|dark)\/[0-9]+/,
    }
  ]
}