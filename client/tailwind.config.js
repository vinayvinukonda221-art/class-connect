/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C35F5',
          60: '#8B63F8',
          70: '#7A4CF6',
          90: '#4E22C8',
        },
        secondary: '#0D0D0D',
        tertiary: '#E5E7EB',
        neutral: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F8FB',
          container: '#EEEEEE',
          dark: '#121212',
        },
        'on-surface': {
          DEFAULT: '#0D0D0D',
          muted: '#4D4D4D',
        },
        border: {
          DEFAULT: '#E3E3E3',
          subtle: '#E5E7EB',
        },
        success: '#1F8A5B',
        error: '#D92D20',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        subtle: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        xs: '6px',
        sm: '16px',
        md: '24px',
        lg: '44px',
        xl: '72px',
      }
    },
  },
  plugins: [],
}
