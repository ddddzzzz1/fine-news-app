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
<tr>
<td width="50%">
<h3>🔔 푸시 알림</h3>
<ul>
<li>Expo Push + Firebase Functions 기반 토픽별 알림</li>
<li>마이 탭 → “알림 설정” 화면에서 토글/조용한 시간 제어</li>
<li>저장 공모전 마감 다이제스트 및 큐 기반 뉴스레터 알림</li>
</ul>
</td>
<td width="50%">
<h3>📈 지표 & 모니터링</h3>
<ul>
<li>Expo Firebase Analytics로 옵트인/발송 이벤트 추적</li>
<li>`push_ticket_receipts` + `cleanupPushTokens`로 만료 토큰 정리</li>
<li>`adime_guide.md`에 운영 절차 기록</li>
</ul>
</td>
</tr>
<tr>
<td width="50%">
<h3>🚨 커뮤니티 신고</h3>
<ul>
<li>게시글/댓글에 신고 버튼 노출</li>
<li>신고 내용은 Firestore `community_reports`에 저장</li>
</ul>
</td>
<td width="50%">
<h3>⚙️ 설정/관리자 도구</h3>
<ul>
<li>새 설정 화면에서 계정/보안/데이터 제어 + 계정 완전 삭제</li>
<li>닉네임 편집 및 이메일/비밀번호 로그인 이용자를 위한 재설정 플로우</li>
<li>관리자 계정은 앱에서 “신고 관리” 진입 가능</li>
</ul>
</td>
</tr>
<tr>
<td width="50%">
<h3>🗓 마이 캘린더</h3>
<ul>
<li>캘린더 탭에서 개인 일정 생성</li>
<li>Day 상세/상세 카드에서 내 일정 삭제 가능</li>
</ul>
</td>
<td width="50%">
<h3>📱 전용 UI</h3>
<ul>
<li>캘린더 Day 화면과 탭 상세에서 동일한 이벤트 카드 공유</li>
<li>삭제 시 Firestore 문서를 즉시 제거하고 리스트 자동 새로고침</li>
</ul>
</td>
</tr>
</table>

<h3>📰 뉴스 생성 워크플로우 (News Factory)</h3>
<ul>
<li><strong>뉴스 팩토리 (News Factory)</strong>: 매 6시간마다 실행되어 최신 한국 경제 뉴스를 수집하고, Gemini API를 통해 팩트 중심의 초안을 생성합니다 (`news_drafts`). 생성된 데이터는 <code>key_data_points.hero</code> / <code>.details</code> / <code>.highlights</code> 구조로 내려오며, 홈 화면의 대시보드 카드에 즉시 활용할 수 있습니다.</li>
<li><strong>브리핑 스케줄러 (Briefing Scheduler)</strong>: 6시간마다 실행되어 최근 생성된 뉴스들을 요약하여 "데일리 브리핑"을 생성합니다 (`daily_briefings`).</li>
<li><strong>프롬프트 최적화</strong>: 최신성 유지를 위해 현재 시간(KST)을 주입하고, 에디터의 편의를 위해 `핵심 포인트(Key Data Points)`와 `발행일(Published Date)`을 추출합니다.</li>
<li><strong>관리자 검토</strong>: 웹 관리자 대시보드(<code>fine-news-admin</code>) 또는 모바일 앱에서 초안을 검토하고 발행(`published`)합니다.</li>
</ul>

<h3>💬 커뮤니티 & 다중 이미지 업로드</h3>
<ul>
<li><strong>다중 이미지</strong>: 게시글 작성 시 최대 5장의 이미지를 선택하여 업로드할 수 있습니다. 상세 페이지에서는 가로 스크롤 갤러리로 표시됩니다.</li>
<li><strong>카테고리 필터</strong>: 커뮤니티 탭 상단에 <strong>전체 · 인기글 · 자유 · 취업 · 모집 · 스터디</strong> 칩을 통해 게시글을 필터링합니다.</li>
<li><strong>인기글 시스템</strong>: 좋아요(`like_count`)가 5개 이상인 게시글은 자동으로 "인기글" 탭에 노출됩니다.</li>
</ul>

<h3>🎯 대외활동 · 취업 · 자격증 공고</h3>
<ul>
<li>`공모전` 탭은 이제 <strong>대외활동 · 취업 · 자격증</strong> 세 가지 카테고리로 구분된 칩을 제공합니다.</li>
<li>Firestore `contests`와 `contest_details` 문서는 위 세 값 중 하나만 허용하며, 잘못된 라벨은 UI에 노출되지 않습니다.</li>
<li>샘플 데이터를 새 카테고리로 채우려면 `cd fine-news-app && node scripts/seedAll.js` 또는 `node scripts/seedContests.js`를 실행하세요.</li>
</ul>

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


admin: true 권한이 있는 계정으로 접속하여 인증 요청을 승인하고 뉴스 초안을 관리할 수 있습니다.

뉴스 초안 워크플로우 (News Draft Workflow)

**1. Google Cloud Console에서 Generative Language API 활성화**

1. [Google Cloud Console](https://console.cloud.google.com)에 접속
2. "APIs & Services" → "Library" 이동
3. "Generative Language API" 검색
4. "Enable" 클릭
5. "APIs & Services" → "Credentials"에서 API 키 생성 (또는 기존 키 사용)

**2. Firebase Functions에 API 키 설정**

```bash
# Functions 디렉토리에서 Gemini API 키 설정 (배포용)
cd functions
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# 로컬 테스트용 .env 파일 생성
echo "GEMINI_API_KEY=YOUR_GEMINI_API_KEY" > .env
```

**3. Functions 배포**

```bash
# fine-news-app 디렉토리에서 실행
firebase deploy --only functions
```

Gemini가 생성한 뉴스 초안은 `news_drafts` 컬렉션에 저장되며, 관리자 대시보드에서 편집/발행할 수 있습니다.

모바일 앱에서 관리자는 뉴스 상세 화면에서 "Edit" 버튼을 눌러 간단한 텍스트 편집이 가능합니다.

**자동 실행**: `scheduledNewsDraft` 함수가 매일 오전 8시(KST)에 자동으로 뉴스를 생성합니다.

<br />

🛠️ 유용한 스크립트 (Scripts)
<ul>
<li><code>node scripts/triggerGemini.js</code>: (관리자용) 뉴스 팩토리를 수동으로 트리거하여 즉시 뉴스를 생성합니다.</li>
<li><code>node scripts/triggerBriefing.js</code>: (관리자용) 브리핑 스케줄러를 수동으로 트리거합니다.</li>
<li><code>node scripts/checkData.js</code>: <code>news_drafts</code> 컬렉션의 데이터를 확인합니다.</li>
<li><code>node scripts/seedAll.js</code>: 개발용 더미 데이터를 생성합니다.</li>
</ul>

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

🔔 푸시 알림 설정 (Push Notifications)

1. **Firestore 준비**
   - 루트에 `user_push_settings`, `notification_requests`, `push_ticket_receipts`, `saved_contests` 컬렉션을 생성합니다.
   - 세부 스키마는 `fire_data.md`와 `docs/push-notification-sample-docs.md`를 참고해 시드 데이터를 작성하세요.
2. **보안 규칙/Functions 배포**
   - `firestore.rules`에 새 컬렉션 접근 제어를 추가한 뒤 `firebase deploy --only firestore:rules`.
   - `firebase deploy --only functions:processNotificationQueue,functions:sendContestDeadlineDigest,functions:cleanupPushTokens,functions:closeAccount`로 최신 Functions 반영.
3. **실기기 테스트**
   - 실제 디바이스에서 Expo Go(또는 Dev Client)로 로그인 → 마이 탭 → “알림 설정”에서 권한 허용 및 토글 상태 확인.
4. **샘플 알림 발송**
   - `node scripts/createNotification.js` 실행 또는 Firestore 콘솔에서 `notification_requests/manual_newsletter_drop` 문서를 생성합니다.
   - `processNotificationQueue`가 5분 이내 큐를 처리하며, 필요 시 `firebase functions:shell`에서 수동 실행 가능합니다.
5. **운영 가이드**
   - `adime_guide.md`에 알림 운영/모니터링/퀘치 절차가 정리되어 있으니 관리자 온보딩 시 참고하세요.

<br />

🗑 **계정 삭제 (Close Account)**

사용자는 설정 화면의 “계정 완전 삭제” 버튼을 눌러 스스로 탈퇴할 수 있습니다. 이 기능은 Firebase Functions의 `closeAccount` callable을 호출하며 아래 리소스를 정리합니다.

- `user_profiles/{uid}` 문서 + 업로드된 `student_id_storage_folder`(또는 `student_id_storage_path`) 내 이미지 파일
- `user_push_settings/{uid}`와 저장된 Expo 토큰
- 사용자가 만든 `saved_contests`, 개인 `calendar_events` (`is_personal: true`), `community_posts` 및 해당 첨부 이미지(`image_meta.storage_path`)
- Firebase Auth 사용자 레코드

구성 방법:

1. Functions 배포 시 `firebase deploy --only functions:processNotificationQueue,functions:sendContestDeadlineDigest,functions:cleanupPushTokens,functions:closeAccount` 명령을 사용하거나 `functions:closeAccount`를 별도로 포함합니다.
2. `user_profiles` 제출 로직이 `student_id_storage_path`와 `student_id_storage_folder`를 저장해야 Storage 정리가 가능합니다. (이미 `university-verification.js`에 반영되어 있음)
3. 커뮤니티 글/이미지 업로드 시 `image_meta.storage_path`를 기록해야 합니다. 기존 업로더(`write-post.js`)는 기본적으로 저장 중입니다.
4. 새 기능 배포 후 실제 기기에서 테스트 계정을 생성 → 학생증 업로드 → 테스트 데이터를 만들어둔 뒤 계정 삭제가 모든 문서를 제거하는지 Firestore/Storage Console에서 확인하세요.

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

<br />

🛡️ 신고 & 관리자 계정 세팅

1. 커뮤니티 화면에서 사용자는 게시글/댓글을 신고할 수 있으며, 신고 내용은 Firestore의 `community_reports` 컬렉션에 저장됩니다.
2. Firestore 룰(`firestore.rules`)을 배포한 뒤 `admin` 커스텀 클레임을 가진 계정만 신고 내역을 확인할 수 있습니다.
3. 서비스 계정 JSON을 프로젝트 루트(`serviceAccount.json`)에 두고 아래 스크립트로 클레임을 관리하세요.

```bash
# 현재 클레임 확인
node scripts/manageAdminClaims.js fine3410@gmail.com export

# admin 권한 부여/회수
node scripts/manageAdminClaims.js fine3410@gmail.com grant
node scripts/manageAdminClaims.js fine3410@gmail.com revoke
```

4. admin 계정으로 앱에 로그인하면 마이 탭에 `신고 관리` 버튼이 나타나며, `/admin/reports` 화면에서 신고 상태를 `검토 완료`/`조치 완료`로 업데이트하거나 해당 게시글/댓글을 즉시 삭제할 수 있습니다.

<br />

🗓 마이 이벤트 관리

1. 캘린더 탭 → “내 일정 추가” 버튼을 눌러 제목/설명/시간을 입력하면 `calendar_events`에 `category: "마이"`, `is_personal: true`, `user_id`, `created_at`이 저장됩니다.
2. 날짜를 길게 눌러 열 수 있는 `/calendar-day/[date]` 화면이나 탭 내 상세 카드에서 개인 일정에만 `삭제` 버튼이 노출됩니다.
3. 삭제 시 Firestore 문서가 제거되고 React Query의 `calendar-events` 캐시가 무효화되어 목록이 자동 갱신됩니다.
4. 관리자 계정은 동일한 화면에서 `경제` 카테고리를 선택해 모든 사용자에게 노출되는 이벤트를 등록할 수 있습니다.
