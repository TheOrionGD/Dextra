/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', 'Outfit', 'sans-serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
