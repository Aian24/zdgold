import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          50: "#FCF9EE",
          100: "#F8F1D6",
          200: "#F0E1AB",
          300: "#E6CD7D",
          400: "#DBB952",
          500: "#D4AF37", // Classic Royal Gold
          600: "#B89228",
          700: "#92711C",
          800: "#6F5316",
          900: "#4D3811",
          950: "#2A1D06",
        },
        obsidian: {
          50: "#252B3B",
          100: "#1E2330",
          200: "#181C26",
          300: "#141720",
          400: "#10121A",
          500: "#0C0E14",
          600: "#090A0E",
          700: "#06070A",
          800: "#040507",
          900: "#020304",
          950: "#010102",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F5E296 0%, #D4AF37 50%, #8C6D1F 100%)",
        "gold-shimmer": "linear-gradient(90deg, #D4AF37 0%, #FFF5C0 50%, #D4AF37 100%)",
        "dark-card": "linear-gradient(180deg, rgba(26, 31, 44, 0.8) 0%, rgba(15, 18, 26, 0.95) 100%)",
        "radial-gold": "radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "gold-glow": "0 0 25px -5px rgba(212, 175, 55, 0.3)",
        "gold-glow-lg": "0 0 45px -5px rgba(212, 175, 55, 0.45)",
        "dark-glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
