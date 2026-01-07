import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
        'nunito-sans': ['Nunito Sans', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.3rem', { lineHeight: '1.8rem' }],
        '2xl': ['1.6rem', { lineHeight: '2.2rem' }],
        '3xl': ['2rem', { lineHeight: '2.5rem' }],
        '4xl': ['2.5rem', { lineHeight: '3rem' }],
        '5xl': ['3.2rem', { lineHeight: '1' }],
        '6xl': ['4rem', { lineHeight: '1' }],
        '7xl': ['5rem', { lineHeight: '1' }],
        '8xl': ['6.5rem', { lineHeight: '1' }],
        '9xl': ['9rem', { lineHeight: '1' }],
      }
    },
  },
  darkMode: 'class',
  plugins: [daisyui],
  daisyui: {
    logs: false,
  },
}
