/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#0F3460',
        teal: '#0D9488',
        light: '#F0F9FF',
        danger: '#DC2626',
        warning: '#D97706',
        success: '#059669'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}