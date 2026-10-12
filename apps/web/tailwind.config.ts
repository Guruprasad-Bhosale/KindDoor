import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amazon: {
          orange: '#FF9900',
          dark: '#131921',
          light: '#232F3E',
          blue: '#007185'
        },
        door: {
          locked: '#DC2626',
          unlocked: '#16A34A',
          jammed: '#EA580C'
        }
      }
    },
  },
  plugins: [],
};

export default config;
