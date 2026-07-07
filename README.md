# Vindt Shop — Premium Vintage Clothing Store

빈티지 의류 쇼핑몰 웹사이트

**🌐 Live Demo: [https://vindt-cloth.web.app](https://vindt-cloth.web.app/)**

## 🛠 기술 스택

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Backend / DB**: Firebase Firestore, Firebase Storage
- **Hosting**: Firebase Hosting
- **인증**: Naver / Kakao / Google 소셜 로그인

## ✨ 주요 기능

- 🛍️ 상품 목록 및 카테고리 필터링
- 🔍 실시간 검색
- 🛒 장바구니 기능
- ❤️ 위시리스트
- 📋 게시판 (공지사항 / 커뮤니티)
- 🔐 관리자 페이지 (`admin.html`) — 상품 등록·관리
- 🌍 다국어 지원 (한국어, English, 日本語, 中文, Tiếng Việt)
- 📱 반응형 디자인
- 🎨 빈티지 감성 UI/UX

## 📁 프로젝트 구조

```
vindt-shop/
├── public/
│   ├── index.html          # 메인 페이지
│   ├── admin.html          # 관리자 페이지
│   ├── images/             # 소셜 로그인 로고 등 이미지
│   └── styles/style.css    # 스타일시트
├── src/
│   ├── app.js              # 메인 앱 로직 (상품·장바구니·검색)
│   ├── admin.js            # 관리자 기능
│   ├── boards.js           # 게시판 기능
│   ├── firebase-config.example.js  # Firebase 설정 템플릿
│   ├── firebase-client.js  # Firestore/Storage 클라이언트
│   └── translations.js     # 다국어 번역 데이터
├── firebase.json           # Firebase Hosting 설정
└── .firebaserc             # Firebase 프로젝트 설정
```

## 🔐 보안 아키텍처

- **관리자 인증**: Firebase Authentication(이메일/비밀번호) 기반. 클라이언트에 자격증명을 두지 않습니다.
- **Firestore 규칙**(`firestore.rules`): `products` 컬렉션은 누구나 읽기 가능, 쓰기는 관리자 계정만 허용. 그 외 경로는 전부 차단.
- **Storage 규칙**(`storage.rules`): `product-images/`는 공개 읽기, 업로드·삭제는 관리자만.

## ⚙️ Firebase 설정

`src/firebase-config.js`는 저장소에 포함되어 있지 않습니다.
`src/firebase-config.example.js`를 `src/firebase-config.js`로 복사한 뒤,
Firebase 콘솔(프로젝트 설정 → 내 앱)에서 발급받은 값으로 채워주세요.

## 🚀 로컬 실행

브라우저 보안 정책(CORS) 때문에 로컬 서버가 필요합니다.

```bash
# 방법 1: npx serve
npx serve

# 방법 2: VS Code Live Server
# index.html 우클릭 → "Open with Live Server"
```

## 🔥 Firebase 배포

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

## 📝 라이선스

© 2026 Vindt shop. All rights reserved.
