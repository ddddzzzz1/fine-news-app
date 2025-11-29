# Fine App 백엔드 연동 & 영상 촬영 가이드

산출물 **#D – 화면 녹화 테스트 가이드**를 기반으로, 평가자가 `final_kaist_app.zip`만으로 핵심 플로우·백엔드 연동 상황을 입증할 수 있도록 촬영 단계별 절차를 정리했습니다.

---

## 1. 공통 준비
1. **프로젝트 & 환경 변수**
   - `final_kaist_app.zip`을 압축 해제하고 루트에서 `cp .env.emulator .env`로 환경을 맞춥니다.
   - Firebase Emulator Suite 실행 전 `scripts/seedEmulator.js`의 시드 컬렉션을 검토하여, `contests.category` 값이 `대외활동/취업/자격증` 중 하나인지 확인합니다.
2. **에뮬레이터 & 데이터 시드**
   - `EMULATOR_GUIDE.md` 순서대로 Firebase 에뮬레이터를 켭니다.
   - 한 터미널에서 아래 명령으로 시드 후 로그 창을 그대로 둡니다. (백엔드 로그 화면에 사용)
     ```bash
     cd fine-news-app
     firebase emulators:start --project=fine-news-mock --import=emulator-data --export-on-exit &
     FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
     GCLOUD_PROJECT=fine-news-mock \
     node scripts/seedEmulator.js
     ```
   - Emulator UI(`http://127.0.0.1:4000`)에서 `news`, `contests`, `community_posts`, `user_push_settings` 컬렉션을 미리 열어둡니다.
3. **Expo 실행**
   - `.env`가 로드된 상태에서 `npx expo start --tunnel`을 실행하고, iOS Simulator 또는 Android Studio 에뮬레이터를 띄웁니다.
   - 최초 홈 화면 로딩이 끝나면 React Query DevTools(Expo DevMenu → React Query)를 켜 두면 캐시 무효화 상황을 설명하기 좋습니다.
4. **테스트 계정**
   - 로그인 정보: `fine3410@gmail.com / fine3410`.
   - 최초 로그인 직후 `user_profiles` 문서와 `saved_contests`, `user_push_settings` 컬렉션을 캡처 준비합니다.

---

## 2. macOS 촬영 세팅
1. **레이아웃**  
   - Stage Manager 또는 미션 컨트롤 분할을 활용해 **좌측 전체는 iOS/Android 시뮬레이터**, **우측 상단은 Firebase Emulator UI 또는 `console.firebase.google.com`**, **우측 하단은 터미널 로그**가 동시에 보이게 구성합니다.
   - QuickTime/OBS에서 마이크 음성을 함께 녹음해 “언제 어떤 API/DB가 호출되는지”를 설명합니다.
2. **Firebase Site 뷰**
   - Firestore 콘솔에서 `news`, `contests`, `community_posts`, `saved_contests`, `user_push_settings`, `functions` 로그 탭을 탭별로 준비해 탭 전환만으로 데이터 변화를 보여줄 수 있도록 합니다.
   - Storage 브라우저도 별도 Safari/Chrome 탭으로 준비해 계정 삭제 후 `community_posts/{uid}` 혹은 `student_id_storage_folder`가 비워지는 모습을 보여줍니다.
3. **터미널/콘솔 뷰**
   - 터미널 1: `firebase emulators:start` 로그 → Functions 호출/Firestore 쓰기 로그를 확인.
   - 터미널 2: `npx expo start` 로그 → React Native Hot Reload, API 콜 상황을 확인.
   - 필요 시 `tail -f firebase-debug.log`를 한 줄로 열어, 계정 삭제 시 `closeAccount` 함수 로그를 증빙합니다.

---

## 3. 시나리오별 타임라인 & 캡처 포인트

| # | 플로우 | Expo 화면 액션 | Firebase 콘솔 포인트 | 터미널/설명 키워드 | 캡처 파일 |
| --- | --- | --- | --- | --- | --- |
| 0 | 홈 초기 | 앱 실행 → 홈 탭 뉴스/공고 카드 확인 | `news`, `contests` 컬렉션이 읽히는 모습 확인 | `expo start` 로그에 React Query fetch 메시지 강조 | `screen_00_home.png` |
| 1 | 로그인 | `마이 → 로그인` → 테스트 계정 입력 → 마이 탭 프로필 노출 | Auth Emulator에서 로그인 성공, `user_profiles/{uid}` 미리보기 | 터미널에 `Auth emulator: signIn` 로그 | `screen_01_login.png` |
| 2 | 커뮤니티 글 작성 | `커뮤니티 → + 글쓰기` → 제목 “테스트 글”, 내용 “영상용 케이스” 입력 → 등록 | Firestore UI에서 `community_posts` 새 문서가 최상단에 생성되는 장면 확대 | `community_posts` invalidate 로그(`["community-posts"] refetch`) 언급 | `screen_02_post.png` |
| 3 | 공고 스크랩 | `공모전 → 공고 상세 → 스크랩` | `saved_contests`에 `contest_id`가 생기는 모습 + `user_id` 하이라이트 | React Query `["my-saved-contests"]` 무효화 → 마이 탭 저장 목록 갱신 | `screen_03_scrap.png` |
| 4 | 알림 설정 | `마이 → 알림 설정`에서 토글 온/오프 → 조용한 시간 변경 | `user_push_settings/{uid}` 필드(`enabled`, `preferences.*`, `quiet_hours`)가 실시간 업데이트되는 모습 | `["user-push-settings"]` refetch 로그, Expo Notifications 토큰 출력 | `screen_04_notifications.png` |
| 5 | 계정 완전 삭제 | `마이 → 설정 → 계정 완전 삭제` → Alert 확인 | Functions Emulator `closeAccount` 로그 + Firestore/Storage 문서가 순차적으로 삭제되는 화면 | `functions: closeAccount` stdout, 삭제된 `saved_contests`, `community_posts`, `calendar_events` 언급 | `screen_05_delete.png` |

**촬영 팁**
- 각 단계 전 “지금은 XX 플로우이고, Firestore YY 컬렉션을 확인한다”라고 구두 설명합니다.
- Firebase Emulator UI에서 변경 전/후를 같은 화면에 보이게 하려면 “Split Diff” 기능 또는 브라우저 탭을 두 개 띄워 `last change` 타임스탬프를 확인합니다.
- React Query DevTools에서 해당 키가 refetch 되는 순간을 보여주면 백엔드와 캐시 연결성을 강조할 수 있습니다.

---

## 4. Firebase 사이트 & 콘솔 증빙 포인트
1. **Firestore**
   - 좌측 컬렉션 리스트를 펼쳐 시청자가 문서 경로를 쉽게 확인하도록 합니다.
   - `contests` 문서를 열 때 `category` 값이 `대외활동/취업/자격증` 중 하나임을 언급해 스키마 제약 준수도 증빙합니다.
2. **Functions**
   - Emulator UI → Functions 탭에서 `closeAccount` 호출 이력을 활성화하고, 요청 페이로드/응답을 녹화합니다.
   - 필요 시 `firebase functions:shell`을 사용해 수동 호출 후 결과를 `console.log`로 보여줍니다.
3. **Storage**
   - `community_posts/{uid}` 폴더와 `student_id_storage_folder`를 동시에 띄워, 계정 삭제 직후 파일이 사라지는 타이밍을 캡처합니다.
4. **콘솔 로그**
   - `firebase-debug.log`를 열어 “DELETE /google.firestore.v1.Firestore/Document”와 같은 행을 하이라이트하면 백엔드 삭제 트랜잭션을 명확히 보여줄 수 있습니다.

---

## 5. 영상/캡처 파일 관리 & 리포트
1. **파일 네이밍**
   - 영상: `fine_app_backend_walkthrough.mov` (또는 mp4)로 저장.
   - 캡처: 시나리오 표와 동일하게 `screen_00_home.png` ~ `screen_05_delete.png`.
2. **테스트 보고서**
   - 촬영 직후 `tests/TEST_REPORT.md`를 생성하고 아래 템플릿으로 작성합니다.
     ```markdown
     ## 테스트 요약
     - 기기/OS: macOS Sequoia + iOS Simulator (iPhone 15)
     - Expo 버전: 54.0.x
     - Emulator seed 버전: scripts/seedEmulator.js (커밋 SHA)

     ## 시나리오별 결과
     1. 홈 화면 – 성공 (첨부: screen_00_home.png)
        - 입력: 앱 실행 직후 홈 탭 유지
        - 결과: 뉴스/공모전 더미 데이터 노출
        - 백엔드: Firestore `news`, `contests` 읽기
     ```
   - 각 단계마다 “입력 → 결과 → 의미”를 2~3줄로 정리하고, 해당 캡처 파일명을 괄호로 남깁니다.
3. **백엔드 로그 백업**
   - `firebase-debug.log`와 `expo.log`를 `/docs/artifacts/` 등에 복사해 두면 평가자가 호출 흔적을 재확인할 수 있습니다.

---

## 6. 부가 촬영 팁
1. **타임라인**: 홈 → 로그인 → 커뮤니티 글 → 공고 스크랩 → 알림 토글 → 계정 삭제 → Emulator 로그 확인 순으로 5분 내외로 구성합니다.
2. **설명 스크립트**: 각 단계에서 “현재 API 호출/DB 변화”와 “왜 필요한지”를 한 문장으로 언급합니다. 예) “지금 `community_posts`에 새 문서가 생성되면서 React Query 캐시가 즉시 무효화됩니다.”
3. **POSTMAN 활용(선택)**: `POSTMAN/` 컬렉션을 불러와 Functions callable(`closeAccount`)을 수동 호출하는 장면을 덧붙이면 신뢰도가 높아집니다.
4. **재촬영 포인트**: 토글 값이 바로 반영되지 않는다면 `Alert.alert`로 사용자에게 오류를 안내하는 로직이 있으므로, 해당 Alert가 뜬다면 로그를 보여주고 재시도합니다.
5. **백엔드 동기화 검증**: 영상 말미에 Firestore, Storage가 모두 비워졌음을 다시 한 번 스캔하면서 “백엔드 정리 완료”라고 명시합니다.

이 가이드를 따르면 Expo 앱, Firebase 사이트, 콘솔 로그 세 축을 동시에 보여주며 백엔드 연동이 정상 동작함을 명확히 증명할 수 있습니다.
