import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        soft: 'var(--soft)',
        card: 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-emerald': 'var(--accent-emerald)',
        peri: {
          50: '#f4f5fd',
          100: '#ebebfe',
          200: '#dcdcfc',
          300: '#c1c1f9',
          400: '#737bea',
          500: '#5a61e2',
          600: '#484ec4',
          700: '#3c40a5',
          800: '#323684',
          900: '#2b2e6c',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 25px rgba(0, 0, 0, 0.08)',
        glow: '0 0 25px rgba(116, 88, 233, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
