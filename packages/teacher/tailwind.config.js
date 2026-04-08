/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'mq-purple': '#6C3FEB',
        'mq-gold': '#FFD700',
      },
    },
  },
  plugins: [],
};
