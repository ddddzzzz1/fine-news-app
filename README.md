https://drive.google.com/drive/folders/1QpsWldzyRZDshvdr8mKvMOmcpFCsLEug?usp=drive_link

<div align="center">

<!-- 로고가 있다면 아래 src에 이미지 경로를 넣어주세요 -->

<img src="https://www.google.com/search?q=https://via.placeholder.com/150%3Ftext%3DFINE%2BApp" alt="Logo" width="120" height="120" />

<h1>🎓 대학생 금융 커뮤니티</h1>

<p>
<strong>대한민국 대학생들의 금융 정보와 캠퍼스 라이프를 연결하는 허브</strong>
</p>

<p>
<a href="#-소개-about">소개</a> •
<a href="#-주요-기능-features">기능</a> •
<a href="#-시작하기-getting-started">시작하기</a> •
<a href="#-문의하기-contact">문의하기</a>
</p>

<!-- Badges -->

<p>
<img src="https://www.google.com/search?q=https://img.shields.io/badge/React%2520Native-0.81-61DAFB%3Fstyle%3Dflat-square%26logo%3Dreact%26logoColor%3Dblack" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Expo-54.0-000020%3Fstyle%3Dflat-square%26logo%3Dexpo%26logoColor%3Dwhite" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Firebase-Auth%2520%257C%2520Firestore-FFCA28%3Fstyle%3Dflat-square%26logo%3Dfirebase%26logoColor%3Dblack" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/License-MIT-green%3Fstyle%3Dflat-square" />
</p>
</div>

<br />

📖 소개 (About)

대학생 금융 커뮤니티는 대한민국 대학생들이 금융 정보, 공모전 소식, 커뮤니티, 그리고 대학 인증을 하나의 앱에서 편리하게 관리할 수 있도록 돕는 모바일 플랫폼입니다.

현재 **충남대학교(CNU)**와 **카이스트(KAIST)**를 비롯한 주요 캠퍼스 학생들을 위해 최적화되어 있으며, 신뢰할 수 있는 정보 공유의 장을 목표로 합니다.

<br />

🛠️ 기술 스택 (Tech Stack)

구분

기술 (Stack)

설명

Frontend

React Native + Expo

크로스 플랫폼 모바일 앱 개발

Routing

Expo Router

파일 기반 라우팅 시스템

Styling

NativeWind / Tailwind

유틸리티 퍼스트 스타일링

Backend

Firebase

Auth, Firestore DB, Storage

State

React Query

서버 데이터 상태 관리

Icons

Lucide Icons

깔끔하고 현대적인 SVG 아이콘

<br />

✨ 주요 기능 (Features)

<table>
<tr>
<td width="50%">
<h3>🔐 안전한 인증 시스템</h3>
<ul>
<li>이메일 기반 Firebase 인증</li>
<li>이메일 검증(Verification) 프로세스</li>
</ul>
</td>
<td width="50%">
<h3>🏫 철저한 대학생 인증</h3>
<ul>
<li>학생증 업로드 및 관리자 승인 절차</li>
<li>승인된 학생만 커뮤니티 접근 가능</li>
</ul>
</td>
</tr>
<tr>
<td>
<h3>🗂 올인원 정보 관리</h3>
<ul>
<li>커뮤니티, 공모전, 금융 뉴스</li>
<li>캘린더 연동 및 스크랩(북마크) 기능</li>
</ul>
</td>
<td>
<h3>🛠 관리자 웹 콘솔</h3>
<ul>
<li>학생 승인 요청 검토 및 처리</li>
<li>Vite + React 기반의 별도 웹 대시보드</li>
</ul>
</td>
</tr>
</table>

<br />

🚀 시작하기 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하기 위한 단계입니다.

📋 사전 준비 (Prerequisites)

Node.js (v18 이상) & npm

Expo CLI: npm install -g expo-cli (권장)

Firebase 프로젝트:

Web Configuration (API Key 등)

Service Account JSON (데이터 시딩용)

Storage 보안 규칙 설정 (student-ids/{uid}/**)

⚙️ 설치 및 실행 (Installation)

1. 레포지토리 복제 (Clone)

git clone [https://github.com/your-org/your-repo.git](https://github.com/your-org/your-repo.git)
cd fine-news-app


2. 패키지 설치 (Install Dependencies)

npm install


3. 환경 변수 설정 (Environment Setup)

# 템플릿 파일을 복사하여 .env 생성
cp .env.example .env

# .env 파일을 열어 Firebase 키 값을 입력하세요.


4. 관리자 키 설정 (Admin Key)

# 데이터 시딩을 위한 관리자 키 배치
cp serviceAccount.sample.json serviceAccount.json


[!WARNING]
보안 주의: EXPO_PUBLIC_* 키가 포함된 .env 파일과 serviceAccount.json 파일은 절대 GitHub에 업로드(Commit)하지 마세요.

<br />

💻 사용 방법 (Usage)

앱 실행 (Run App)

npx expo start


터미널에서 i (iOS), a (Android)를 누르거나 QR 코드를 스캔하세요.

회원가입 Flow: 가입 → 이메일 인증 확인 → 로그인 → 학생증 인증 제출.

관리자 콘솔 실행 (Admin Console)

cd ../fine-news-admin
npm install && npm run dev


admin: true 권한이 있는 계정으로 접속하여 인증 요청을 승인할 수 있습니다.

<br />

📦 데이터 시딩 (Seeding Data)

개발용 더미 데이터를 Firestore와 Storage에 한 번에 채워넣습니다.

# fine-news-app 디렉토리에서 실행
node scripts/seedAll.js


생성되는 데이터:

news, calendar_events, community_posts

contests, saved_contests

user_profiles (인증 완료/대기 상태의 테스트 유저)

<br />

🔍 검색 (Algolia 설정)

1. Algolia 콘솔에서 App ID와 **Search-Only API Key**를 준비합니다. Write 권한 키는 Firebase 확장에서만 사용하세요.
2. Firebase CLI에서 `firebase ext:install algolia/firestore-algolia-search` 를 실행하고, `news`, `newsletters`, `community_posts`, `contests` 컬렉션에 대해 각각 한 번씩 설치합니다. Indexable Fields 입력값은 항상 `title,tags,content` 로 맞춰주세요.
3. `app.json > extra.algolia`에 실제 `appId`, `searchApiKey`, `indexPrefix` 값을 입력합니다. (searchApiKey는 Search-Only 키를 사용)
4. 앱에서 검색창을 열면 Algolia 인덱스 4종을 동시에 조회하고, 탭으로 결과를 확인할 수 있습니다.

<br />

🔐 환경 변수 및 보안 (Security)

파일별 용도와 공유 정책을 준수해 주세요.

파일명

용도

GitHub 공유

.env

Expo/Firebase API 키 (Public Config)

❌ 절대 금지

serviceAccount.json

Firebase 관리자(Admin) 인증 키

❌ 절대 금지

.env.example

환경 변수 템플릿 (빈 값)

✅ 가능

firebaseConfig.js

앱 초기화 설정 코드

✅ 가능

<br />

📜 라이선스 (License)

이 프로젝트는 MIT License를 따릅니다. 자세한 내용은 LICENSE 파일을 참고하세요.

Copyright © 2025 Team FINE.

<br />

📧 문의하기 (Contact)

Team FINE (SIRT & D-RAM)
<br />
🏫 Chungnam National University & KAIST

프로젝트에 대한 문의사항이나 제안은 Issues를 통해 남겨주세요.

<p align="center">
<i>Happy Hacking! 🎉</i>
</p>
