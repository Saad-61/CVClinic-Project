/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        purple: {
          50: '#f6f2fb',
          100: '#ebdffd',
          200: '#dac5fa',
          300: '#bfa0f4',
          400: '#a073ec',
          500: '#844be2',
          600: '#6b3fa0', // True Eminence Purple
          700: '#5a3387',
          800: '#4b2b70',
          900: '#3f245c',
        },
        slate: {
          50: '#0c0c0e',
          100: '#141416',
          200: '#1e1e22',
          300: '#2c2c32',
          400: '#4a4a54',
          500: '#787885',
          600: '#a3a3b0',
          700: '#c0c0cb',
          800: '#e2e2e9',
          900: '#f4f4f7',
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      boxShadow: {
        soft: "0 1px 1px rgba(15, 23, 42, 0.05), 0 8px 20px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

