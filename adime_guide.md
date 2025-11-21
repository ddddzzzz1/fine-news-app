# Fine News 알림 운영 가이드

_작성일: 2025-02-21_

## 1. 개요
이 문서는 운영자가 사용자 푸시 알림 경험을 관리할 때 따라야 하는 절차를 정리한 문서입니다. `user_push_settings`, `notification_requests`, `push_ticket_receipts` 컬렉션과 Firebase Functions(`processNotificationQueue`, `sendContestDeadlineDigest`, `cleanupPushTokens`)을 기준으로 알림을 기획·발송·모니터링하는 방법을 설명합니다.

## 2. 필수 체크리스트
1. **앱 권한 상태 확인**  
   - 마이 탭 → “알림 설정” 카드에서 사용자 권한, 토픽 토글, 조용한 시간을 확인합니다.  
   - 운영 중 알림 이슈가 발생하면 먼저 여기서 사용자가 `시스템 알림 허용` 상태인지 검증합니다.
2. **Firestore 데이터**  
   - `user_push_settings/{uid}`: `enabled`, `preferences.*`, `quiet_hours`, `expo_push_tokens[]` 값을 확인합니다.  
   - `notification_requests`: 예약 알림이 정상적으로 생성되었는지 확인하고 필요 시 직접 생성합니다.  
   - `push_ticket_receipts`: 미처리(`processed=false`) 티켓이 쌓여 있다면 `cleanupPushTokens` 로그를 확인합니다.
3. **Cloud Functions 상태**  
   - Firebase Console → Functions → `processNotificationQueue`, `sendContestDeadlineDigest`, `cleanupPushTokens`가 “Active”인지 확인합니다.  
   - 에러 발생 시 “Logs” 탭에서 stack trace를 확인하고 Slack 알림 채널에 공유합니다.

## 3. 시나리오별 절차
### 3.1 뉴스레터/공지 알림 발송
1. Firestore Console 또는 CLI에서 `notification_requests/{custom_id}` 문서를 생성합니다.  
2. 필드 예시:
   ```json
   {
     "title": "새 뉴스레터 도착!",
     "body": "오늘의 핵심 이슈 3가지를 만나보세요.",
     "data": { "screen": "/newsletters/demo123" },
     "target": { "type": "topic", "key": "newsletters" },
     "send_after": "2025-02-22T11:00:00+09:00",
     "created_by": "admin@fine.news"
   }
   ```
3. `processNotificationQueue`가 5분 간격으로 문서를 소비하고, 처리 후 해당 문서를 삭제합니다. 즉시 발송이 필요하면 `firebase functions:shell`에서 `processNotificationQueue()`를 호출합니다.

### 3.2 마감 임박 공모전 리마인더
1. 사용자가 공모전을 저장하면 `saved_contests`에 레코드가 생성됩니다.  
2. `sendContestDeadlineDigest`가 매일 09:00 KST에 실행되어 24시간 이내 마감하는 항목을 묶어 사용자별 다이제스트를 보냅니다.  
3. 테스트 시에는 `saved_contests`에 직접 샘플 문서를 생성하고, 함수 콘솔에서 “Run”을 눌러 수동 실행합니다.

### 3.3 토큰 정리 및 실패 처리
1. `dispatchExpoNotifications`가 발송 시마다 `push_ticket_receipts`에 티켓 메타데이터를 기록합니다.  
2. `cleanupPushTokens`가 매일 03:00 KST에 미처리 티켓을 조회해 Expo Receipts를 확인하고, `DeviceNotRegistered` 및 `ExpoPushTokenNotFound` 에러가 발생한 토큰을 `user_push_settings`에서 제거합니다.  
3. 로그 예시:
   ```
   cleanupPushTokens result {
     processedTickets: 120,
     invalidTokens: 4,
     platformCounts: { ios: 3, android: 1 }
   }
   ```
4. invalid 토큰이 급증하면 앱 버전/플랫폼별 이슈로 의심하고 QA 팀에 공유합니다.

## 4. 모니터링 & 리포트
- **Analytics**: `expo-firebase-analytics` 로깅(`push_permission_prompt`, `push_opt_in`, `push_opt_in_denied`, `push_preference_update` 등)을 BigQuery/GA4로 수집해 월간 보고서를 작성합니다.  
- **로그 지표**: Cloud Logging에서 함수별 필터를 설정해 `success`, `errors`, `topics` 수치를 대시보드화합니다.  
- **Quiet Hours**: 사용자가 설정한 조용한 시간 때문에 알림이 지연될 수 있으므로 특정 사용자 문의 시 `user_push_settings.quiet_hours` 값을 확인한 뒤 설명합니다.

## 5. 장애 대응 매뉴얼
| 증상 | 점검 방법 | 조치 |
| --- | --- | --- |
| 특정 사용자가 알림을 못 받음 | `user_push_settings/{uid}`의 `expo_push_tokens`와 권한 상태 확인 | 권한 비활성 시 앱에서 다시 허용 요청 안내 |
| 알림이 대량 실패 | `processNotificationQueue` 또는 `sendContestDeadlineDigest` 로그에서 에러 메시지 확인 | API 제한/네트워크 오류이면 재시도 후 팀에 공유 |
| `cleanupPushTokens`가 토큰을 삭제하지 않음 | `push_ticket_receipts`에 `processed=false` 문서가 계속 쌓이는지 확인 | 함수 로그에서 Expo Receipts 응답 확인, 필요 시 쿼터 조정 |

## 6. 운영 TIP
1. 신규 기능 배포 후 첫날에는 `notification_requests`에 테스트 문서를 넣고 전체 플로우(큐→Functions→Expo→디바이스)를 검증합니다.  
2. 긴급 공지 알림이 필요할 경우, `target.type = "all"` 문서를 생성하면 `enabled == true` 사용자 전체에게 발송됩니다. 단, 도달률/피로도를 고려해 빈도를 제한합니다.  
3. 사용자 문의에 대응할 때는 **마이 탭 → 알림 설정 화면 스크린샷**을 요청하면 권한 상태를 빠르게 파악할 수 있습니다.

> 본 문서는 변경 사항이 생길 때마다 업데이트해야 하며, 새 운영자가 합류하면 반드시 1회 이상 실습을 진행하세요.

