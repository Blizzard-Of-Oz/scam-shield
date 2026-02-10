import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#daeefe',
          500: '#1d75f4',
          700: '#1556ba',
        },
      },
    },
  },
  plugins: [],
};

export default config;
