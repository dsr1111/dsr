// build.mjs 가 쓰는 Tailwind 설정 (예전 페이지 안 tailwind.config 와 같음)
module.exports = {
  content: [], // build.mjs 가 페이지마다 채워 넣음
  theme: {
    extend: {
      colors: {
        header: 'hsl(220, 24%, 18%)',
      },
    },
  },
};
