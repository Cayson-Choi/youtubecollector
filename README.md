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
- `1`: [Just Start] 서버 시작 + 브라우저 열기
- `2`: [Update] 영상 수집 → 배포 → 서버 시작
- `3`: [Channel] 채널 관리 (추가/삭제)
- `4`: [Auto Update] 30일 자동수집 → 배포 → 서버 시작
- `5`: [Exit] 종료

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
│   ├── App.jsx                  # 메인 앱 (필터링, 무한 스크롤)
│   ├── main.jsx                 # React 엔트리포인트
│   ├── index.css                # 전역 스타일 (TailwindCSS)
│   ├── components/
│   │   ├── VideoPlayer.jsx      # 비디오 재생 모달
│   │   ├── ChannelManager.jsx   # 채널 관리 UI (API 서버 필요)
│   │   ├── PromptPanel.jsx      # 프롬프트 패널
│   │   ├── SlideExample.jsx     # 슬라이드 예시
│   │   ├── StyleThumbnail.jsx   # 스타일 썸네일
│   │   └── ThumbnailSlide.jsx   # 썸네일 슬라이드
│   ├── data/
│   │   ├── categories.js        # 카테고리 키워드 정의
│   │   ├── channels.json        # 구독 채널 목록
│   │   └── videos.json          # 수집된 비디오 데이터
│   └── utils/
│       ├── colors.js            # 색상 유틸리티
│       └── prompts.js           # 프롬프트 유틸리티
├── scripts/
│   ├── fetch_videos.js          # 비디오 수집 스크립트
│   └── manage_channels.js       # 채널 관리 CLI
├── server.js                    # Express API 서버 (포트 3002)
├── start.bat                    # Windows 대화형 런처
├── auto_update_scheduled.bat    # 자동 업데이트 (스케줄러용)
├── setup_scheduler.bat          # Windows 작업 스케줄러 등록
├── uninstall_scheduler.bat      # 스케줄러 해제
├── .env.example                 # 환경변수 템플릿
├── vite.config.js               # Vite 설정
├── tailwind.config.js           # TailwindCSS 설정
├── postcss.config.js            # PostCSS 설정
├── vercel.json                  # Vercel 배포 설정
└── package.json
```

## 🎮 사용법

### 채널 추가

**방법 1: CLI 사용**

```bash
node scripts/manage_channels.js
```

**방법 2: start.bat 메뉴**

`start.bat` 실행 후 옵션 `3` (Channel) 선택

**방법 3: API 직접 호출** (서버 실행 중일 때)

```bash
curl -X POST http://localhost:3002/api/channels -H "Content-Type: application/json" -d "{\"url\": \"https://youtube.com/@채널이름\"}"
```

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

또는 서버 실행 중일 때 API 호출: `POST http://localhost:3002/api/deploy`

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
`server.js`의 `PORT` 변수 변경

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
