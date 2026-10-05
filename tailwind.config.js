/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans Thai", "sans-serif"],
      },
      colors: {
        ink: "#132238",
        navy: "#14253d",
        teal: "#16a394",
        canvas: "#f4f7fa",
      },
    },
  },
  plugins: [],
};
