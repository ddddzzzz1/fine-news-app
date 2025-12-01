# FINE : Finance IN Everyday (파인 뉴스)

**FINE**은 대학생과 사회 초년생이 금융 뉴스를 쉽게 접하고, 대외활동/공모전에 참여하며, 커뮤니티에서 소통할 수 있도록 돕는 종합 모바일 애플리케이션입니다. React Native (Expo)와 Firebase를 기반으로 제작되었습니다.

## 📱 주요 기능

- **뉴스 피드:** AI 요약이 포함된 경제 및 금융 뉴스 큐레이션.
- **커뮤니티:** 익명/학교 인증 기반의 학생 커뮤니티 (정보 공유, 꿀팁 등).
- **공고 (Contests):** 대외활동, 해커톤, 채용 공고를 캘린더 및 리스트 형태로 제공.
- **캘린더:** 공고 마감일과 연동된 개인 일정 관리 기능.
- **푸시 알림:** 공고 마감 임박, 뉴스레터, 커뮤니티 댓글 알림 제공.
- **학생 인증:** 대학 이메일을 통한 재학생 인증 시스템.

## 🛠 기술 스택 (Tech Stack)

- **프레임워크:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **라우팅:** [Expo Router](https://docs.expo.dev/router/introduction/)
- **스타일링:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **백엔드:** [Firebase](https://firebase.google.com/)
  - **Auth:** 이메일/비밀번호 로그인, Identity Platform
  - **Firestore:** NoSQL 데이터베이스
  - **Storage:** 이미지 호스팅
  - **Functions:** 서버리스 백엔드 로직 (Node.js)
- **알림:** Expo Notifications

## 🚀 시작하기 (Getting Started)

### 필수 조건

- Node.js (LTS 버전 권장)
- npm 또는 yarn
- iOS Simulator (Mac) 또는 Android Emulator
- Firebase 프로젝트 자격 증명 (Credentials)

### 설치 및 실행

1.  **저장소 클론 (Clone):**
    ```bash
    git clone <repository-url>
    cd fine-news-app
    ```

2.  **의존성 설치:**
    ```bash
    npm install
    ```

3.  **환경 설정:**
    `.env` 파일을 생성하여 Firebase 키를 설정하거나, 개발 환경에서는 `firebaseConfig.js`의 기본 테스트 자격 증명을 사용합니다.

4.  **앱 실행:**
    ```bash
    # iOS 시뮬레이터 실행
    npm run ios

    # Android 에뮬레이터 실행
    npm run android

    # 웹 브라우저 실행
    npm run web
    ```

## 📜 스크립트 및 유틸리티

`scripts/` 디렉토리에는 데이터 시딩(Seeding) 및 관리자 작업을 위한 Node.js 스크립트가 포함되어 있습니다.

| 스크립트 | 설명 |
| :--- | :--- |
| `node scripts/seedAll.js` | 뉴스, 공고, 커뮤니티, 사용자 등 모든 더미 데이터를 Firestore에 추가합니다. |
| `node scripts/manageAdminClaims.js` | 관리자 권한을 부여하거나 취소합니다. <br>사용법: `node scripts/manageAdminClaims.js <email> <grant|revoke>` |
| `node scripts/createNotification.js` | 테스트용 푸시 알림을 수동으로 발송합니다. |
| `node scripts/triggerBriefing.js` | AI 데일리 브리핑 생성을 수동으로 트리거합니다. |

## 📂 프로젝트 구조

```
fine-news-app/
├── app/                    # Expo Router 페이지 (화면)
├── components/             # 재사용 가능한 UI 컴포넌트
├── context/                # React Context (인증 상태 등)
├── functions/              # Firebase Cloud Functions (백엔드)
├── hooks/                  # 커스텀 React Hooks
├── lib/                    # 유틸리티 라이브러리 (Analytics 등)
├── scripts/                # 관리자 및 데이터 시딩 스크립트
├── assets/                 # 이미지 및 폰트 리소스
├── firebaseConfig.js       # Firebase 클라이언트 설정
├── app.json                # Expo 설정 파일
└── package.json            # 프로젝트 의존성
```

## 🚀 배포 (Deployment)

이 프로젝트는 **Expo Application Services (EAS)** 배포를 지원합니다.

**iOS 빌드:**
```bash
eas build --platform ios
```

**Android 빌드:**
```bash
eas build --platform android
```

## 📄 라이선스

[MIT](LICENSE)
