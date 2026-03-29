/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate',
        scan: 'scan 2s linear infinite',
        gradient: 'gradient 3s ease infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px #3b82f6' },
          '100%': { boxShadow: '0 0 30px #60a5fa, 0 0 40px #3b82f6' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
