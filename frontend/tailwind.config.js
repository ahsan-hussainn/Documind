/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        surface: { DEFAULT: "#0d0d0d", 1: "#141414", 2: "#1c1c1c", 3: "#242424", 4: "#2e2e2e" },
        amber: { DEFAULT: "#f59e0b", dim: "#d97706" },
        ink: { DEFAULT: "#f5f0e8", muted: "#a89f94", faint: "#544f4a" },
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        "pulse-dot": "pulseDot 1.2s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease forwards",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseDot: { "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" }, "50%": { opacity: "1", transform: "scale(1)" } },
        slideIn: { "0%": { opacity: "0", transform: "translateX(16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
