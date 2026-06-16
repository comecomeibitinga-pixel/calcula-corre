import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // We can force dark mode easily or default to it
  theme: {
    extend: {
      colors: {
        background: "#0b0f19", // Very dark blue/slate for premium look
        card: "#151d30",       // Secondary dark color for panels
        border: "#202e4c",     // Subtle border line
        accent: {
          success: "#22c55e",  // IFood green / Gains
          danger: "#ef4444",   // Expenses red
          warning: "#f97316",  // Oil warning orange
          info: "#06b6d4",     // Petrol blue
          primary: "#facc15",  // Courier yellow (touch-friendly highlight)
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
