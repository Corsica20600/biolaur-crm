import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211c",
        leaf: "#1f7a52",
        mint: "#dff3e8",
        line: "#dde5df",
        paper: "#fbfcfa"
      },
      boxShadow: {
        soft: "0 14px 38px rgba(23, 33, 28, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
