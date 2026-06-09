# WorkHere Korea MVP

한국에서 일하는 외국인 근로자를 위한 다국어 생활 플랫폼 1차 MVP입니다.

현재 버전은 외부 공유 데모와 베타 테스트를 위한 프론트엔드 프로토타입입니다. 실제 운영 인프라, 외부 신고 접수, 실시간 지도 API, 개인정보 저장 기능은 연결되어 있지 않고 mock/static 데이터로 동작합니다.

## 핵심 메뉴

- 홈
- 일상
- 일자리
- 지도
- 커뮤니티

마이페이지는 하단 탭에서 제외하고 공통 헤더의 프로필 아이콘과 홈 화면 버튼으로 이동합니다.

## 포함 기능

- 한국어, 영어, 베트남어 i18n 구조
- Splash, 언어 선택, 로그인, 온보딩
- 홈 검색, 빠른 메뉴, 추천 생활정보, 인기 피드/커뮤니티
- 일상 피드 목록, 작성 mock, 사진 업로드 mock, 좋아요, 댓글, 저장, 신고
- 일자리 목록/상세, 필터, 급여계산기, 정보 제공 고지
- 생활지도 정적 지도 이미지 + 생활도움 장소 오버레이
- 커뮤니티 공개 피드, 추천 그룹, 안전방, 신고/차단 mock, 번역 mock
- 도움요청/안전 허브, 상황별 안내, 기관 정보, 접수 mock
- 마이페이지 프로필, 저장목록, 내 글/커뮤니티 활동 mock
- 관리자 대시보드, 회원/게시글/댓글/피드/일자리/장소/신고/도움요청 관리 mock
- 관리자 처리 이력 구조: `admin_logs` 역할의 mock 데이터

## 로컬 실행

```bash
npm install
npm run dev
```

기본 Vite 로컬 주소는 보통 다음 중 하나입니다.

- `http://localhost:5173`
- `http://127.0.0.1:5173`

모바일 기기에서 같은 와이파이로 확인하려면 다음처럼 host를 열어 실행할 수 있습니다.

```bash
npm run dev -- --host 0.0.0.0
```

터미널에 표시되는 Network URL을 모바일 브라우저에서 접속합니다.

## ngrok 외부 공유

ngrok 공유용으로 3000 포트를 고정해 띄우는 스크립트를 제공합니다.

```bash
npm run dev:share
```

다른 터미널에서 ngrok을 실행합니다.

```bash
ngrok http 3000
```

ngrok이 발급한 `https://...ngrok-free.app` 주소를 외부 테스트 사용자에게 공유하면 됩니다.

주의:

- 이 MVP는 demo/mock 데이터 기반입니다.
- 실제 개인정보, 실제 신고 내용, 실제 기관 상담 내용은 입력하지 마세요.
- ngrok 무료 URL은 실행할 때마다 바뀔 수 있습니다.
- 사내망 전용 API는 현재 연결되어 있지 않습니다.
- 지도는 정적 샘플 지도와 mock 장소 데이터로 표시됩니다.

## Vercel 배포

Vercel CLI를 사용할 경우:

```bash
npm install
npm run build
vercel --prod
```

Vercel 프로젝트 설정:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

현재 앱은 프론트엔드 정적 빌드로 동작하므로 필수 환경변수 없이 배포 가능합니다.

## 환경변수

예시 파일을 복사해 사용할 수 있습니다.

```bash
copy .env.local.example .env.local
```

현재 필수 환경변수는 없습니다.

선택 환경변수:

- `VITE_DEMO_MODE`: 데모/mock 모드 표시용
- `VITE_PUBLIC_BASE_URL`: ngrok 또는 Vercel 공개 URL 기록용
- `VITE_MAP_PROVIDER`: 현재 기본값은 `static`
- `VITE_MAP_API_KEY`: 실제 지도 API 연동 시 사용
- `VITE_ANALYTICS_ENDPOINT`: 실제 분석 이벤트 전송 시 사용

실제 API 키를 설정하는 경우 `.env.local`에만 저장하고 저장소에는 커밋하지 마세요.

## 외부 공유 전 점검

```bash
npm run build
```

확인할 항목:

- `localhost`, `127.0.0.1`, 사내 IP로 고정된 API/이미지 링크가 없는지
- 지도 API 키가 없어도 Life Map fallback이 깨지지 않는지
- 프로필, 신고, 도움요청 데이터가 mock인지
- 실제 개인정보나 민감정보가 포함되어 있지 않은지
- 모바일 브라우저에서 헤더, 하단 탭, 지도, 피드 작성 FAB가 깨지지 않는지

## 검증 명령

```bash
npm run build
npm run lint
```

`npm run lint`는 ESLint 설정과 코드 상태에 따라 추가 정리가 필요할 수 있습니다. 데모 공유 전 최소 기준은 `npm run build` 통과입니다.
