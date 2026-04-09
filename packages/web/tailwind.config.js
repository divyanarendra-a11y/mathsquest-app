/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      colors: {
        'mq-purple': '#6C3FEB',
        'mq-gold': '#FFD700',
        'mq-teal': '#00C9A7',
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(108,63,235,0.4)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(108,63,235,0.8)' },
        },
      },
      animation: {
        'bounce-in': 'bounce-in 0.4s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
