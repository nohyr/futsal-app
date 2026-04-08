/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEF6FF",
          500: "#3182F6",
          600: "#2272EB",
        },
        warm: {
          50: "#FFF8F2",
          100: "#FDF1E6",
          400: "#F59E63",
          500: "#E8833A",
        },
        gray: {
          0: "#FFFFFF",
          50: "#F9FAFB",
          100: "#F2F4F6",
          200: "#E5E8EB",
          300: "#D1D6DB",
          500: "#8B95A1",
          700: "#4E5968",
          900: "#191F28",
        },
        success: {
          50: "#ECFDF3",
          500: "#16B364",
        },
        warning: {
          50: "#FFFAEB",
          500: "#F79009",
        },
        danger: {
          50: "#FEF3F2",
          500: "#F04452",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
      },
      fontSize: {
        "heading-xl": ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        "heading-lg": ["20px", { lineHeight: "1.3", fontWeight: "700" }],
        "heading-md": ["17px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.5", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};
