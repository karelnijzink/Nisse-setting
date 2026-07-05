import type { Config } from "tailwindcss";

/** Read a CSS-variable color triplet with Tailwind alpha support. */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: withAlpha("--brand"),
          dark: withAlpha("--brand-dark"),
          tint: withAlpha("--brand-tint"),
          contrast: withAlpha("--brand-contrast"),
        },
        accent: withAlpha("--accent"),
        ink: withAlpha("--ink"),
        muted: withAlpha("--muted"),
        surface: withAlpha("--surface"),
        page: withAlpha("--page"),
        line: withAlpha("--line"),
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(22 27 25 / 0.04), 0 1px 3px 0 rgb(22 27 25 / 0.06)",
        lift: "0 4px 16px -4px rgb(22 27 25 / 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
