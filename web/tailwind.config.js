/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        goty: {
          bg: "#080c14",
          card: "#0f172a",
          cardHover: "#172033",
          border: "#1e293b",
          gold: "#f59e0b",
          goldLight: "#fbbf24",
          goldDark: "#b45309"
        }
      }
    },
  },
  plugins: [],
}
