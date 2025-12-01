# 산출물#D: Test 결과물 (Test Results)

## 1. 테스트 개요 및 환경 설정

본 테스트는 외부 심사 및 검토를 위해 구축된 **"Demo Mode (Local Emulator)"** 환경에서 진행됩니다. 실제 상용 데이터베이스에 영향을 주지 않으면서 앱의 모든 핵심 기능을 검증할 수 있습니다.

### 1.1 테스트 환경 (Frontend & Backend)
*   **Frontend:** React Native (Expo) 기반 iOS 앱
*   **Backend:** Firebase Local Emulator Suite (Auth, Firestore, Functions, Storage)
*   **DB:** Local Firestore (NoSQL)
*   **특이사항:** `npm run demo:start` 명령어를 통해 로컬 서버 구동, 데이터 시딩(Seeding), 앱 실행이 원클릭으로 수행됨.

### 1.2 접속 정보 (Test Credentials)
테스트를 위한 전용 데모 계정이 미리 생성되어 있으며, 앱 실행 시 로그인 화면에 자동 입력됩니다.

*   **ID (Email):** `demo@fine.com`
*   **PW:** `test1234`

---

## 2. 화면별 테스트 시나리오 및 결과

### 2.1 초기 화면 및 로그인 (Login)

**테스트 방법:**
1.  앱 실행 후 초기 화면 진입
2.  하단 인디케이터 바: **<마이>** 탭 터치 → **<로그인>** 버튼 터치
3.  로그인 화면에서 미리 입력된 정보 확인 후 **"이메일로 로그인"** 버튼 터치

**입력 값:**
*   이메일: `demo@fine.com`
*   비밀번호: `test1234`

**예상 결과:**
*   로그인 성공 토스트 메시지 출력
*   메인 **<홈>** 화면으로 자동 이동
*   **Backend 상호작용:**
    *   `firebase.auth().signInWithEmailAndPassword()` 호출
    *   Firebase Auth Emulator에서 자격 증명 검증 및 ID Token 발급

> **[여기에 로그인 화면 및 홈 화면 진입 캡쳐 첨부]**

---

### 2.2 뉴스 탭 (News Feed)

**테스트 방법:**
1.  하단 **<홈>** 탭 선택
2.  상단 카테고리(경제, 사회 등)를 변경하며 뉴스 리스트 확인
3.  임의의 뉴스 카드 터치하여 상세 내용 확인

**입력 값:**
*   사용자 터치 인터랙션 (카테고리 변경, 스크롤)

**예상 결과:**
*   AI가 요약한 뉴스 카드들이 리스트 형태로 표시됨
*   뉴스 상세 모달이 정상적으로 열림
*   **Backend 상호작용:**
    *   **Frontend:** `firestore().collection('news').where('category', '==', selected).get()`
    *   **DB:** Firestore `news` 컬렉션에서 `state: "published"`인 문서들을 쿼리하여 반환

> **[여기에 뉴스 리스트 및 상세 화면 캡쳐 첨부]**

---

### 2.3 커뮤니티 (Community)

**테스트 방법:**
1.  하단 **<커뮤니티>** 탭 선택
2.  우측 하단 **(+)** 버튼 터치하여 글쓰기 화면 진입
3.  제목과 내용을 입력하고 **"등록"** 버튼 터치

**입력 값:**
*   제목: "테스트 게시글입니다"
*   내용: "에뮬레이터 환경에서 작성된 글입니다."

**예상 결과:**
*   게시글 등록 완료 메시지 표시
*   커뮤니티 리스트 최상단에 방금 작성한 글이 즉시 반영됨 (Real-time)
*   **Backend 상호작용:**
    *   **Frontend:** `firestore().collection('community_posts').add({ ... })`
    *   **DB:** Firestore `community_posts` 컬렉션에 새 문서 생성
    *   **Real-time:** `onSnapshot` 리스너가 DB 변경을 감지하여 UI를 즉시 업데이트

> **[여기에 글쓰기 화면 및 등록된 게시글 캡쳐 첨부]**

---

### 2.4 캘린더 (Calendar)

**테스트 방법:**
1.  하단 **<캘린더>** 탭 선택
2.  달력에서 일정이 있는 날짜(점 표시) 터치
3.  하단 리스트에서 경제 일정 및 공모전 마감일 확인

**입력 값:**
*   날짜 선택 (터치)

**예상 결과:**
*   해당 날짜의 주요 경제 지표 발표 일정과 공모전 마감 일정이 리스트로 표시됨
*   **Backend 상호작용:**
    *   **Frontend:** `firestore().collection('calendar_events').where('date', '==', selectedDate).get()`
    *   **DB:** Firestore `calendar_events` 및 `contests` 컬렉션에서 해당 날짜 데이터를 조인(Join)하여 반환

> **[여기에 캘린더 화면 캡쳐 첨부]**

---

## 3. 기술적 특징 및 아키텍처 (Backend Interaction)

본 앱은 **Serverless Architecture**를 기반으로 하며, Frontend와 Backend가 긴밀하게 상호작용합니다.

1.  **Authentication (인증):**
    *   Firebase Auth를 사용하여 이메일/비밀번호 인증을 처리합니다.
    *   로그인 세션은 앱 재실행 시에도 유지됩니다 (AsyncStorage Persistence).

2.  **Database (데이터베이스):**
    *   Cloud Firestore (NoSQL)를 사용합니다.
    *   **Real-time Updates:** 커뮤니티 댓글, 좋아요 수 등은 `onSnapshot`을 통해 실시간으로 동기화됩니다.

3.  **Security (보안):**
    *   Firestore Security Rules를 통해 읽기/쓰기 권한을 제어합니다.
    *   예: `allow write: if request.auth != null` (로그인한 사용자만 글 작성 가능)

4.  **Demo Environment (데모 환경):**
    *   `scripts/seedEmulator.js` 스크립트가 에뮬레이터 구동 시 자동으로 실행되어, 테스트에 필요한 풍부한 더미 데이터(뉴스 20건, 게시글 30건 등)를 생성합니다.
