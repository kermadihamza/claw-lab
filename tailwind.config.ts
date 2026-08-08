import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          DEFAULT: "#7f9dc7",
          50: "#f2f5fa",
          100: "#e2e9f3",
          200: "#c7d5e9",
          300: "#a3bbdb",
          400: "#7f9dc7",
          500: "#6183b3",
          600: "#4c6a97",
          700: "#3e567b",
          800: "#354866",
          900: "#2f3d55",
          950: "#1e2738",
        },
        cream: {
          DEFAULT: "#f1ede1",
          50: "#fdfcfa",
          100: "#f7f4ec",
          200: "#f1ede1",
          300: "#e6dfcc",
          400: "#d5c9a9",
        },
        ink: {
          DEFAULT: "#20242c",
          light: "#454c5a",
        },
        silver: {
          100: "#f4f5f6",
          200: "#e2e5e8",
          300: "#c9ced4",
          400: "#a9b0b9",
          500: "#8a929c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        zoika: ["var(--font-zoika)"],
      },
      backgroundImage: {
        chrome:
          "linear-gradient(135deg, #f4f5f6 0%, #c9ced4 22%, #8a929c 45%, #eef0f1 60%, #a9b0b9 78%, #f4f5f6 100%)",
        "chrome-dark":
          "linear-gradient(135deg, #dfe3e6 0%, #9aa2ab 25%, #5c636c 50%, #c4c9ce 65%, #7d8590 82%, #dfe3e6 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
