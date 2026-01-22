// postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {}, // 브라우저 호환성을 위해 추가하는 것이 좋습니다.
  },
};

export default config;