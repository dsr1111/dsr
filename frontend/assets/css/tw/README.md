# Tailwind CSS (미리 만들어 둔 파일)

탐지기 · EXP · 가챠 · 코스튬 슬롯 페이지는 예전에 `cdn.tailwindcss.com` 스크립트(약 400KB, 브라우저에서 CSS를 만드느라 화면 표시를 막음)를 썼습니다.
지금은 그 페이지에서 실제로 쓰는 클래스만 담은 CSS 파일(`detector.css` 등, 각 5~8KB)을 불러옵니다.

## 언제 다시 만들어야 하나요?

이 네 페이지의 HTML 이나 JS 에 **처음 쓰는 Tailwind 클래스**를 넣었을 때만 필요합니다.
(그대로 두면 새 클래스에는 스타일이 적용되지 않습니다.)

```bash
node assets/css/tw/build.mjs
```

`frontend` 폴더에서 실행하세요. Node.js 가 필요하고, 처음에는 tailwindcss 3.4.17 을 자동으로 받습니다.
