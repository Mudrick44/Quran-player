/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "apple-red": {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#FA233B",
          600: "#dc2626",
          700: "#b91c1c",
        },
        "apple-bg": {
          primary: "#000000",
          secondary: "#1C1C1E",
          tertiary: "#2C2C2E",
        },
        "apple-text": {
          primary: "#FFFFFF",
          secondary: "#8E8E93",
          tertiary: "#636366",
        },
        "apple-accent": {
          blue: "#007AFF",
          green: "#34C759",
          orange: "#FF9500",
          purple: "#AF52DE",
        },
        "design-bg": {
          primary: "#000000",
          secondary: "#1C1C1E",
          tertiary: "#2C2C2E",
        },
        navSidebarBg: "#800080",
        "design-text": {
          primary: "#FFFFFF",
          secondary: "#8E8E93",
          tertiary: "#636366",
        },
        "design-primary": {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#FA233B",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
      fontFamily: {
        "sf-pro": ["SF Pro Display", "system-ui", "sans-serif"],
        "sf-mono": ["SF Mono", "Monaco", "monospace"],
      },
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        20: "80px",
        24: "96px",
        32: "128px",
      },
    },
  },
  plugins: [],
};
