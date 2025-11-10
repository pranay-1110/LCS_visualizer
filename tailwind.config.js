/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        active: {
          DEFAULT: '#f59e0b', // amber-500
        },
        memo: {
          DEFAULT: '#3b82f6', // blue-500
        },
        done: {
          DEFAULT: '#10b981', // emerald-500
        },
        grid: {
          DEFAULT: '#e5e7eb', // gray-200
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      }
    },
  },
}
