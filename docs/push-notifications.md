# Push Notification Plan

_Last updated: 2025-02-21_

## Objectives
- Give logged-in students timely “알림” about things they already care about (saved contests, calendar events, newsletter drops, community replies) without feeling spammy.
- Keep push logic privacy-safe: store only Expo push tokens + user-level preferences in Firestore, nothing device-specific beyond platform/model metadata for debugging.
- Reuse Firebase Functions so that mobile engineers never have to juggle cronjobs or external queues.

## Experience Pillars
1. **Low-friction opt-in** – first app launch gently triggers the OS permission prompt once, then logged-in users see the 홈 탭 종 bell CTA for any follow-up consent or troubleshooting.
2. **Topic-based preferences** – the app stores toggles for `newsletters`, `contests`, `community`, and `reminders` (saved contests + personal calendar) so backend jobs can respect what the user asked for.
3. **Digest-first** – default is 1 message per topic per day; Cloud Functions aggregate multiple items into a single payload (ex: “3개의 마감 임박 공모전”).
4. **Quiet Hours** – optional (defaults to 23:00–08:00 Asia/Seoul). Scheduled jobs skip users inside their quiet window.

## Data Model
### `user_push_settings/{uid}`
| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | string | Same as doc ID for quick lookups. |
| `enabled` | boolean | Global opt-in; client flips to `false` when permission revoked. |
| `expo_push_tokens` | array\<object> | `{ token, platform, device_name, app_version, last_seen }`. Only most recent per device is kept. |
| `preferences` | object | `{ newsletters: true, contests: true, community: true, reminders: true }`. |
| `quiet_hours` | object | `{ start_hour: 23, end_hour: 8 }` (24h clock). |
| `timezone` | string | IANA name; defaults to `Asia/Seoul`. |
| `updated_at` | timestamp | Server timestamp for audits. |

### `notification_requests`
Documents created by admin scripts or other cloud functions. Shape:

```json
{
  "title": "새 뉴스레터가 도착했어요!",
  "body": "Vol.42 발행 · 주요 이슈 3가지를 확인해보세요.",
  "data": { "screen": "/newsletters/abc123" },
  "target": { "type": "topic", "key": "newsletters" },
  "send_after": "2025-02-21T11:00:00+09:00"
}
```

The new `processNotificationQueue` function (see below) consumes these docs, resolves recipients via `user_push_settings`, and deletes the request after a successful send.

## Firebase Functions to Add
1. **`dispatchExpoNotifications(messages)` helper** – accepts an array of Expo message payloads and handles chunking + retries using the Expo push API.
2. **`processNotificationQueue` (pub/sub, every 5 min)** – scans `notification_requests` where `send_after <= now`, groups recipients by topic, enforces quiet hours, and dispatches push payloads. Ideal for newsletter drops and admin-triggered blasts.
3. **`sendContestDeadlineDigest` (pub/sub, daily 09:00 Asia/Seoul)** – queries `saved_contests` where `end_date` happens within the next 24h, builds per-user digests (only if `preferences.reminders === true`), and reuses `dispatchExpoNotifications`.
4. **`cleanupPushTokens` (pub/sub, daily)** – optional, removes expired Expo tokens reported by the push API from `user_push_settings`.

## Client Work Breakdown
1. **`usePushNotifications` hook**
   - Requests permission using `expo-notifications`.
   - Calls `Notifications.getExpoPushTokenAsync({ projectId })`.
   - Creates/updates `user_push_settings/{uid}` with preferences and the token metadata.
   - Exposes `permissionStatus`, `register()`, and `updatePreferences()` helpers.
2. **Entry point integration**
   - In `app/_layout.js`, once a user is authenticated, run the hook so tokens are refreshed silently.
   - Surface an inline CTA in the 홈 header bell if permissions are denied or disabled.
3. **Settings UI**
   - 마이 탭에서 “알림 설정”을 누르면 전용 화면(`/notification-settings`)으로 이동해 권한 상태, 전체 토글, 채널별 토글, 조용한 시간을 관리한다 (23:00–08:00 기본값).

## Analytics & Token Hygiene
- Client logs `push_permission_prompt`, `push_opt_in`, `push_opt_in_denied`, etc., via `expo-firebase-analytics` so marketing can track opt-in funnels and CTA performance.
- `dispatchExpoNotifications` writes ticket metadata (token, user, topic, platform) to `push_ticket_receipts` and logs delivery summaries (success/error counts + per-topic volume).
- Nightly `cleanupPushTokens` job reads Expo receipts, strips tokens flagged `DeviceNotRegistered`/`ExpoPushTokenNotFound`, and logs per-platform cleanup counts for ops dashboards.

## Rollout Checklist
- [ ] Install `expo-notifications` in the Expo app.
- [ ] Configure `android.permissions` + notification icons in `app.json` (already uses default for now; add channel setup in code).
- [ ] Deploy new Firebase Functions alongside the existing index updater.
- [ ] QA on a physical device: login → allow notifications → ensure `user_push_settings/{uid}` is written → trigger the scheduled function manually (`firebase functions:shell`) to verify push receipt.
- [ ] Update README + TODO with rollout instructions for the rest of the team.

## Next Enhancements
- **마이 탭 알림 설정 UI** – build a dedicated section in `app/(tabs)/profile.js` that surfaces permission state, topic toggles, and quiet-hour sliders using `usePushNotificationsContext`.
- **Expired token cleanup job** – promote the optional `cleanupPushTokens` function into an actual scheduled task that removes Expo tokens flagged as `DeviceNotRegistered` and logs per-platform counts.
- **Opt-in & delivery analytics** – instrument both the client hook (`push_opt_in`, `push_permission_denied`) and backend dispatcher (tickets sent, errors, skips due to quiet hours) so we can track adoption and reliability end to end.
