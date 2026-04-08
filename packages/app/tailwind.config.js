/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'mq-purple': '#6C3FEB',
        'mq-gold': '#FFD700',
        'mq-teal': '#00C9A7',
      },
    },
  },
  plugins: [],
};
