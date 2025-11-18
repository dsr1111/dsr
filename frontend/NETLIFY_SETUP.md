# Netlify Functions로 시간 API 추가하기

## ✅ 기존 Netlify 프로젝트에 추가만 하면 됩니다!

Vercel로 이동할 필요 없이, 기존 Netlify 프로젝트에 Functions만 추가하면 됩니다.

---

## 📁 파일 구조

프로젝트에 다음 파일들을 추가하세요:

```
frontend/
├── netlify/
│   └── functions/
│       └── time.js          ← 새로 추가
├── netlify.toml             ← 새로 추가 (또는 기존 파일에 내용 추가)
└── ... (기존 파일들)
```

---

## 🚀 설정 방법

### 1단계: Functions 파일 추가

`netlify/functions/time.js` 파일을 생성합니다.
(이미 생성되어 있습니다)

### 2단계: netlify.toml 설정

**기존 `netlify.toml`이 없는 경우:**
- `netlify.toml` 파일을 프로젝트 루트에 생성하고 제공된 내용을 복사

**기존 `netlify.toml`이 있는 경우:**
- 기존 파일에 다음 내용만 추가:

```toml
# Functions 설정
[functions]
  directory = "netlify/functions"

# URL Rewrite 설정
[[redirects]]
  from = "/api/time"
  to = "/.netlify/functions/time"
  status = 200
  force = false
```

### 3단계: 배포

1. GitHub에 커밋 & 푸시
2. Netlify가 자동으로 재배포
3. 완료! ✅

---

## 🔗 API 엔드포인트

배포 후 다음 URL로 접근 가능:

### 방법 1: 직접 Functions URL
```
https://your-site.com/.netlify/functions/time
```

### 방법 2: Rewrite를 통한 URL (netlify.toml 설정 시)
```
https://your-site.com/api/time
```

---

## 💻 프론트엔드 연동

`raid-timer.js`는 이미 자동으로 `/api/time`을 시도하므로, 
`netlify.toml`에 rewrite 설정만 추가하면 자동으로 작동합니다!

또는 직접 설정:
```javascript
const CUSTOM_TIME_API = 'https://your-site.com/.netlify/functions/time';
// 또는
const CUSTOM_TIME_API = 'https://your-site.com/api/time';
```

---

## ✅ 장점

1. **기존 프로젝트 유지**: Netlify 그대로 사용
2. **커스텀 도메인 유지**: 기존 도메인 그대로 사용
3. **설정 간단**: 파일 2개만 추가
4. **자동 배포**: GitHub 푸시만 하면 됨
5. **무료**: Netlify 무료 플랜으로 충분

---

## 📊 Netlify 무료 플랜 제한

- **Functions 실행 시간**: 10초 (시간 API는 ~1ms)
- **Functions 호출**: 일일 125,000회
- **대역폭**: 월 100GB
- **결론**: 시간 API 사용에는 충분! ✅

---

## 🧪 테스트

배포 후 브라우저에서 테스트:

```bash
# 직접 Functions URL
curl https://your-site.com/.netlify/functions/time

# 또는 Rewrite URL
curl https://your-site.com/api/time
```

예상 응답:
```json
{
  "time": "2025-01-15T14:30:00+09:00",
  "kst_time": "2025-01-15T14:30:00+09:00",
  "datetime": "2025-01-15T14:30:00+09:00",
  "timestamp": 1705291800000,
  "epochSecond": 1705291800,
  "utcTime": "2025-01-15T05:30:00.000Z",
  "timezone": "Asia/Seoul",
  "offset": "+09:00"
}
```

---

## 🔧 문제 해결

### Functions가 작동하지 않는 경우

1. **netlify.toml 확인**
   - `[functions]` 섹션이 올바른지 확인
   - `directory = "netlify/functions"` 경로 확인

2. **파일 경로 확인**
   - `netlify/functions/time.js` 파일이 올바른 위치에 있는지 확인

3. **Netlify 로그 확인**
   - Netlify 대시보드 → Functions → 로그 확인

4. **재배포**
   - Netlify 대시보드 → Deploys → Retry deploy

---

## 📝 요약

1. ✅ `netlify/functions/time.js` 파일 추가
2. ✅ `netlify.toml`에 Functions 설정 추가
3. ✅ GitHub에 푸시
4. ✅ 자동 배포 완료!

**기존 Netlify 프로젝트와 커스텀 도메인을 그대로 사용하면서 시간 API만 추가할 수 있습니다!** 🎉

