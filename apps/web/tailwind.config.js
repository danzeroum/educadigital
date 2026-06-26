/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7EF",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#15241C",
          soft: "#5B6B62",
          muted: "#9AA89F",
          faint: "#B0B8B0",
        },
        line: {
          DEFAULT: "#ECE5D6",
          2: "#E1DAC9",
          track: "#EFE9DC",
          soft: "#F0EBDF",
        },
        green: {
          DEFAULT: "#16A34A",
          500: "#22C55E",
          700: "#15803D",
          900: "#0B5132",
          spring: "#5BE39A",
          bright: "#9BFFC4",
          tint: "#EAF8EF",
          "tint-2": "#E4F8EC",
        },
        amber: {
          DEFAULT: "#F59E0B",
          bright: "#FFB938",
          deep: "#B45309",
          "deep-2": "#A16207",
          tint: "#FEF1D6",
          border: "#FADFA8",
        },
        coral: {
          DEFAULT: "#FF6B5E",
          light: "#FF8A5B",
        },
        sky: {
          DEFAULT: "#2D7FF9",
          deep: "#1D5FBF",
          tint: "#E8F1FF",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          deep: "#7C3AED",
          tint: "#F3E8FF",
        },
        teal: "#0EA5A5",
        bezel: "#0B1410",
        "sidebar-inactive": "#AEBAB2",
        "sidebar-active": "#5BE39A",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        phone: "44px",
        card: "24px",
        "card-sm": "18px",
        inner: "16px",
        btn: "16px",
        squircle: "21px",
      },
      boxShadow: {
        soft: "0 6px 16px rgba(18,38,28,.05)",
        card: "0 6px 18px rgba(18,38,28,.05)",
        "card-md": "0 10px 30px rgba(18,38,28,.07)",
        elevated: "0 20px 50px rgba(18,38,28,.12)",
        "green-cta": "0 14px 30px rgba(22,163,74,.32)",
        "amber-cta": "0 14px 30px rgba(245,158,11,.3)",
        "coral-cta": "0 10px 24px rgba(255,107,94,.32)",
      },
      keyframes: {
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wave: {
          "0%,100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        ring: {
          "0%,100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.3)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "slide-up": {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "xp-bar": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "80%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-streak": {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
        },
        confetti: {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        dots: {
          "0%,80%,100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
      },
      animation: {
        bob: "bob 2s ease-in-out infinite",
        wave: "wave 0.8s ease-in-out infinite",
        ring: "ring 1.5s ease-in-out infinite",
        shimmer: "shimmer 1.5s linear infinite",
        "slide-up": "slide-up 300ms ease-out both",
        "slide-down": "slide-down 200ms ease-out both",
        "xp-bar": "xp-bar 600ms ease-out both",
        "scale-in": "scale-in 500ms ease-out both",
        "pulse-streak": "pulse-streak 300ms ease-in-out",
        confetti: "confetti 3s ease-in forwards",
        dots: "dots 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
