# Push Notification Sample Firestore Docs

Use these snippets to quickly seed Firestore so you can test the new Cloud Functions without waiting for real content.

> Replace the document IDs with anything you like. ISO timestamps below assume Asia/Seoul time—adjust as needed.

---

## 1. Manual `notification_requests` Test

- **Collection:** `notification_requests`
- **Doc ID (example):** `manual_newsletter_drop`

```json
{
  "title": "새 뉴스레터 도착!",
  "body": "Vol. 42 하이라이트 3가지를 확인해보세요.",
  "data": {
    "screen": "/newsletters/demo123",
    "type": "newsletter"
  },
  "target": {
    "type": "topic",
    "key": "newsletters"
  },
  "send_after": "2025-02-22T11:00:00+09:00",
  "created_by": "dev-internal-test"
}
```

### CLI Helper
```bash
firebase firestore:documents:create notification_requests/manual_newsletter_drop \
  '{ "title": "새 뉴스레터 도착!", "body": "Vol. 42 하이라이트 3가지를 확인해보세요.", "data": { "screen": "/newsletters/demo123", "type": "newsletter" }, "target": { "type": "topic", "key": "newsletters" }, "send_after": "2025-02-22T11:00:00+09:00", "created_by": "dev-internal-test" }'
```

Once the doc exists, the `processNotificationQueue` job (every 5 min) will pick it up after `send_after`. To force an immediate send, set `send_after` to `new Date().toISOString()` and either wait for the scheduler or run `firebase functions:shell` → `processNotificationQueue()`.

---

## 2. `saved_contests` Entries for Digest (대외활동/취업/자격증)

Create two docs (different IDs) so `sendContestDeadlineDigest` can build a multi-item message:

```json
{
  "contest_id": "contest_demo_01",
  "user_id": "TEST_USER_UID",
  "title": "KB 청춘 아이디어 대외활동",
  "organizer": "KB금융그룹",
  "end_date": "2025-02-22T20:00:00+09:00",
  "apply_url": "https://fine.news/contests/contest_demo_01",
  "saved_at": "2025-02-21T10:05:00+09:00"
}
```

```json
{
  "contest_id": "contest_demo_02",
  "user_id": "TEST_USER_UID",
  "title": "신한 Next Finance 취업 부트캠프",
  "organizer": "신한은행",
  "end_date": "2025-02-22T22:00:00+09:00",
  "apply_url": "https://fine.news/contests/contest_demo_02",
  "saved_at": "2025-02-21T10:10:00+09:00"
}
```

### CLI Helper
```bash
firebase firestore:documents:create saved_contests/sample_digest_01 '{ ...first payload... }'
firebase firestore:documents:create saved_contests/sample_digest_02 '{ ...second payload... }'
```

> Ensure `end_date` falls within the next 24 hours relative to when `sendContestDeadlineDigest` runs (09:00 Asia/Seoul). Use Firestore timestamp objects if creating via Admin SDK; ISO strings also work when entered through the console.

Once the docs exist and the matching `user_push_settings/TEST_USER_UID` document has `preferences.reminders = true` plus a valid Expo push token, the digest job will send a notification the next morning (or immediately if you trigger the function manually).
