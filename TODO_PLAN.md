# 파인 뉴스 앱 – 액션 플랜

마지막 업데이트: 2025-02-20

## 5. 이미지 처리 고도화
- 게시글·뉴스·공고(대외활동/취업/자격증)에 선택적 이미지 첨부를 허용하고 Firestore 스키마를 `images[]`(메타데이터 포함) 구조로 확장.
- 공고/커뮤니티 게시글에 최대 5장의 다중 업로드, 미리보기 캐러셀, 제출 전 삭제 기능을 제공.
- Storage 규칙을 `community_posts/{uid}/filename`, `contest_images/{docId}/filename` 경로까지 허용하도록 재작성.

## 6. 캘린더 개인 일정
- “내 일정 추가” 버튼과 제목/날짜/카테고리(“마이”)/설명 입력 필드를 제공하고 `calendar_events`에 `is_personal = true`, `user_id`와 함께 저장.
- 현재 인라인 드로어 + 모달을 통해 사용자별 “마이 이벤트” 필터를 지원. **다음 작업:** 사용자가 직접 등록한 이벤트에 편집/삭제 기능 추가.

## 8. 뉴스레터 팝업 노출 실험
- Firebase Analytics 이벤트(`newsletter_popup_show`, `newsletter_popup_click`)로 팝업 노출/클릭을 추적.
- Remote Config로 노출 빈도와 대상 세그먼트를 제어.
- 50% 노출/50% 미노출 그룹으로 A/B 테스트를 수행해 전환율을 비교.

## 9. 운영 도구
- `fine-news-admin`에서 학생 인증 대기열(이름/학과/Storage 링크)을 확인할 수 있는 뷰 제공.
- 대외활동/취업/자격증 공고 · 뉴스레터 에디터에서 HTML 및 미디어 업로드를 지원해 콘텐츠 작성 파이프라인을 단순화.

## 10. QA & 배포
- 인증/업로드/HTML 렌더링/캘린더 이벤트 등 핵심 사용자 플로우 회귀 테스트.
- 변경이 있을 경우 ESLint/테스트 재실행 후 `firestore.rules`, `storage.rules`를 재배포.
- 신규 기능 위주의 릴리스 노트를 작성해 배포 시 공유.

## 11. 푸시 알림 _(진행 중 — 2025-02-21)_
- `docs/push-notifications.md`에 목표 경험, 데이터 모델, Functions 설계를 문서화.
- `expo-notifications`로 로그인 사용자의 `user_push_settings/{uid}`에 Expo 토큰·선호도를 저장.
- Firestore에 `user_push_settings` 컬렉션을 추가하고 마이 탭 → “알림 설정” 화면에서 토글·조용한 시간을 설정하도록 구성.
- Functions 확장:
  - `processNotificationQueue`: 뉴스레터/공지 등 토픽성 알림 큐 처리.
  - `sendContestDeadlineDigest`: 24시간 내 마감되는 저장 공고(대외활동/취업/자격증)를 사용자별 다이제스트로 알림.
  - `cleanupPushTokens`: Expo 수신 확인을 바탕으로 만료된 토큰을 정리.
- Expo Firebase Analytics + Cloud Functions 로그로 옵트인/권한 요청/발송 요약 이벤트를 측정.
- **다음 단계:** 알림 지표 대시보드(옵트인율, 토픽별 전송량, 에러 비율)와 인앱 알림 센터(과거 알림 기록)를 설계.

> 주요 변경 후에는 날짜·상태·다음 단계 정보를 최신화해 팀 전체가 진행 상황을 공유하도록 유지하세요.
