/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#080b11",
        darkCard: "#0d131f",
        darkCardElevated: "#131b2c",
        darkBorder: "rgba(255, 255, 255, 0.08)",
        darkBorderHover: "rgba(255, 255, 255, 0.16)",
        slateTextMuted: "#64748b",
        slateTextSecondary: "#94a3b8",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
}
