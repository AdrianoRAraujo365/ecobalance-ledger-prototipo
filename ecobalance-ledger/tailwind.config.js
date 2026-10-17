module.exports = {
  content: ["./clients/react/src/**/*.{js,jsx}", "./clients/vue/src/**/*.{vue,js}"],
  prefix: "tw-",
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        "eco-green": "#135c3b",
        "eco-blue": "#145fbe"
      }
    }
  },
  plugins: []
};
