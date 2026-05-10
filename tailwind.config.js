/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       colors: {
        primary: {
          DEFAULT: '#2a5a3a',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#e8f5e9',
          foreground: '#2a5a3a',
        },
        background: '#f8faf9',
        surface: '#ffffff',
      }
    },
  },
  plugins: [],
}
