# Trending AI Insights

YouTube 비디오 수집기 - 한국 AI 커뮤니티의 최신 콘텐츠를 자동으로 수집하고 카테고리별로 분류합니다.

## 📋 주요 기능

- YouTube 채널 구독 및 관리
- 자동 비디오 수집 (YouTube Data API)
- 다중 카테고리 자동 분류
- 무한 스크롤 지원
- GitHub 자동 배포
- 모던한 UI/UX (React + TailwindCSS)

## 🚀 빠른 시작

### 1. 리포지토리 클론

```bash
git clone https://github.com/Cayson-Choi/youtubecollector.git
cd youtubecollector
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 YouTube API 키를 입력하세요.

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

`.env` 파일을 열고 YouTube API 키를 입력:

```env
VITE_YOUTUBE_API_KEY=your_actual_api_key_here
```

**YouTube API 키 발급 방법:**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 (또는 기존 프로젝트 선택)
3. "API 및 서비스" → "사용 설정된 API 및 서비스" → "API 및 서비스 사용 설정"
4. "YouTube Data API v3" 검색 후 사용 설정
5. "사용자 인증 정보" → "사용자 인증 정보 만들기" → "API 키" 선택
6. 생성된 API 키를 `.env` 파일에 붙여넣기

### 4. 애플리케이션 실행

**방법 1: 대화형 런처 사용 (Windows)**

```bash
start.bat
```

메뉴에서 옵션 선택:
- `1`: 프론트엔드 + 백엔드 동시 실행
- `2`: 프론트엔드만 실행
- `3`: 백엔드만 실행

**방법 2: 수동 실행**

두 개의 터미널 창에서 각각 실행:

```bash
# 터미널 1: 백엔드 서버 (포트 3002)
node server.js

# 터미널 2: 프론트엔드 (포트 5176)
npm run dev
```

### 5. 브라우저에서 접속

```
http://localhost:5176
```

## 📁 프로젝트 구조

```
youtubecollector/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── VideoPlayer.jsx  # 비디오 재생 모달
│   │   └── ChannelManager.jsx  # 채널 관리 UI
│   ├── data/
│   │   ├── categories.js    # 카테고리 키워드 정의
│   │   ├── channels.json    # 구독 채널 목록
│   │   └── videos.json      # 수집된 비디오 데이터
│   └── App.jsx              # 메인 앱
├── scripts/
│   ├── fetch_videos.js      # 비디오 수집 스크립트
│   └── manage_channels.js   # 채널 관리 CLI
├── server.js                # Express API 서버
├── start.bat                # Windows 런처
└── package.json
```

## 🎮 사용법

### 채널 추가

1. 브라우저에서 채널 관리 버튼 클릭
2. YouTube 채널 URL 입력 (예: `https://youtube.com/@채널이름`)
3. "추가" 버튼 클릭

### 비디오 수집

**수동 수집:**

```bash
# 최근 7일 비디오 수집
node scripts/fetch_videos.js

# 최근 30일 비디오 수집
node scripts/fetch_videos.js 30
```

**자동 수집 (Windows 스케줄러):**

```bash
# 스케줄러 설치 (매일 자동 실행)
setup_scheduler.bat

# 스케줄러 제거
uninstall_scheduler.bat
```

### 배포 (GitHub)

```bash
# 수집 + 커밋 + 푸시를 자동으로 실행
auto_update_scheduled.bat
```

또는 UI에서 "배포하기" 버튼 클릭

## 🔧 개발 명령어

```bash
# 개발 서버 실행 (Vite)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 검사
npm run lint
```

## 📦 기술 스택

- **Frontend**: React 18, Vite, TailwindCSS, Lucide React
- **Backend**: Express.js, Axios, Dotenv
- **API**: YouTube Data API v3
- **Deployment**: Vercel

## ⚙️ 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API 키 | ✅ |

## 🎯 카테고리 추가

`src/data/categories.js` 파일에서 카테고리를 추가할 수 있습니다:

```javascript
export const CATEGORY_KEYWORDS = {
  새카테고리: ["키워드1", "키워드2", "한글키워드"],
  // ...
};
```

다음 비디오 수집 시 자동으로 새 카테고리가 적용됩니다.

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우

**프론트엔드 (5176):**
`vite.config.js`에서 포트 변경

**백엔드 (3002):**
`server.js`의 `PORT` 변수 변경 + `ChannelManager.jsx`의 fetch URL 업데이트

### YouTube API 할당량 초과

- 일일 할당량: 10,000 units
- PlaylistItems API: 채널당 2 units 사용
- 할당량 확인: [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)

### Git 푸시 실패

- Git 설정 확인: `git config --list`
- GitHub 인증 확인: `gh auth status`

## 📄 라이선스

MIT License

## 👤 제작자

Cayson Tech

---

**문의사항이나 버그 리포트는 [Issues](https://github.com/Cayson-Choi/youtubecollector/issues)에 등록해주세요.**
