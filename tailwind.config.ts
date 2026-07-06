import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        "surface-muted": "var(--surface-muted)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-soft": "var(--primary-soft)",
        secondary: "var(--secondary)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: [
          "var(--font-studyflow)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        xs: "0.375rem",
        sm: "0.625rem",
        md: "0.875rem",
        lg: "1.125rem",
        xl: "1.375rem",
        "2xl": "1.625rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 18px 55px -28px rgba(15, 23, 42, 0.24)",
        "soft-sm": "0 10px 30px -22px rgba(15, 23, 42, 0.22)",
        "soft-lg": "0 26px 80px -34px rgba(15, 23, 42, 0.30)",
        glow: "0 0 0 1px rgba(99, 102, 241, 0.08), 0 20px 60px -30px rgba(99, 102, 241, 0.45)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-18px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(18px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.72", transform: "scale(1.025)" },
        },
        "soft-shimmer": {
          "0%": { backgroundPosition: "-220% 0" },
          "100%": { backgroundPosition: "220% 0" },
        },
        "border-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-up": "fade-in-up 520ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-up": "slide-up 560ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-left":
          "slide-in-left 460ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right":
          "slide-in-right 460ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-slow": "pulse-slow 3.2s ease-in-out infinite",
        shimmer: "soft-shimmer 2.4s linear infinite",
        float: "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
