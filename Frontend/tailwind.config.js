/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        BlueDark: "#15274b",
        WhiteDark: "#F5F7F8",
        MainSucess: "#198754",
      },
      fontFamily: {
        KohSantepheap: ["Koh Santepheap", "serif"],
        // Applied automatically to whichever textarea is currently showing
        // Braille (Unicode Braille Patterns block), so dots render clearly.
        braille: ['"Noto Sans Symbols 2"', "sans-serif"],
      },
      fontSize: {
        // NOTE: `sm` previously overrode Tailwind's built-in text-sm (14px) down
        // to 10px, which made description/helper text and button labels across
        // the whole site too small, especially for low-vision users. Bumped up
        // here; ascending order (pi < sm < mid < big) is preserved.
        big: "18px",
        mid: "15px",
        sm: "13px",
        pi: "10px",
      },
    },
  },
  plugins: [],
};
