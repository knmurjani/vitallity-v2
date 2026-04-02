import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "1.25rem",
        md: "0.875rem",
        sm: "0.5rem",
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          light: "hsl(var(--primary-light) / <alpha-value>)",
          faded: "hsl(var(--primary-faded) / <alpha-value>)",
          deep: "hsl(var(--primary-deep) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          faded: "hsl(var(--accent-faded) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        slate: {
          DEFAULT: "hsl(var(--slate) / <alpha-value>)",
          foreground: "hsl(var(--slate-foreground) / <alpha-value>)",
          faded: "hsl(var(--slate-faded) / <alpha-value>)",
        },
        rose: {
          DEFAULT: "hsl(var(--rose) / <alpha-value>)",
          foreground: "hsl(var(--rose-foreground) / <alpha-value>)",
          faded: "hsl(var(--rose-faded) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "hsl(var(--gold) / <alpha-value>)",
          foreground: "hsl(var(--gold-foreground) / <alpha-value>)",
          faded: "hsl(var(--gold-faded) / <alpha-value>)",
        },
        violet: {
          DEFAULT: "hsl(var(--violet) / <alpha-value>)",
          foreground: "hsl(var(--violet-foreground) / <alpha-value>)",
          faded: "hsl(var(--violet-faded) / <alpha-value>)",
        },
        forest: {
          DEFAULT: "hsl(var(--forest) / <alpha-value>)",
          light: "hsl(var(--forest-light) / <alpha-value>)",
        },
        terracotta: "hsl(var(--terracotta) / <alpha-value>)",
        cream: {
          DEFAULT: "hsl(var(--cream) / <alpha-value>)",
          dark: "hsl(var(--cream-dark) / <alpha-value>)",
        },
        "text-ink": "hsl(var(--text-ink) / <alpha-value>)",
        "text-mid": "hsl(var(--text-mid) / <alpha-value>)",
        "text-light": "hsl(var(--text-light) / <alpha-value>)",
        "text-faint": "hsl(var(--text-faint) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        display: ["Playfair Display", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.04)",
        glass: "0 8px 32px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
