## Firestore Collections & Sample Schemas

This app expects four top-level collections. Seed them in Cloud Firestore (or via the seeding scripts) so each tab renders real data.

### 1. `news`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Article title shown on cards and detail screen. |
| `content` | string | Full text; paragraphs separated by `\n\n`. |
| `image_url` | string | Optional hero image. |
| `published_date` | timestamp | Preferred date for formatting (fallback: `created_date`). |
| `created_date` | timestamp | Backup for sorting. |
| `source` | string | Publisher name. |
| `tags` | array\<string> | Used for related-news queries (optional). |

### 2. `community_posts`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Post title (cards + detail). |
| `content` | string | Body text. |
| `board_type` | string | One of `자유`, `취업`, `모집`, `스터디`. Users pick this when creating a post. |
| `university` | string | Displayed beside board type. |
| `user_id` | string | Firebase Auth UID of the author. Required for security rules. |
| `image_url` | string | Optional download URL for the uploaded image (Storage path: `community_posts/{uid}/...`). |
| `image_meta` | object | Optional metadata `{ width, height, size, storage_path }` stored with the download URL for aspect ratios + cleanup jobs. |
| `created_date` | timestamp | Sort order. |
| `views` | number | Optional metric. |
| `comment_count` | number | Optional metric. |
| `created_by` | string | User email/ID for ownership. |
| `like_count` | number | Total likes, used for 인기글 노출. |
| `liked_users` | array\<string> | UIDs/emails of users who liked the post (used to prevent duplicate likes). |
| `comments` | array\<object> | Comments stored inline. Shape: `{ id, author, display_name, content, created_at, user_id, is_author, anon_index }`. `display_name` is `"익명(작성자)"` for post author replies; others auto-increment `익명1`, `익명2`, … within the post. Keep `comment_count` in sync with the array length. |

### 3. `calendar_events`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Event title in the calendar cells. |
| `description` | string | Short description shown below the calendar. |
| `date` | timestamp | Event day; determines calendar placement. |
| `category` | string | Must match color map (`경제`, `공모전`, `인턴`, `마이`, `금융연수`, `오픈콘텐츠`, etc.). |
| `is_personal` | boolean | Used for the “마이 이벤트” filter. |
| `user_id` | string (required for personal) | Owner UID for user-created events; required when `is_personal = true`. |

### 4. `contests`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Contest title. |
| `organizer` | string | Host organization. |
| `end_date` | timestamp | Used to calculate `D-` countdown. |
| `image_url` | string | Optional poster image. |
| `views` | number | Optional metric. |
| `category` | string | One of `공모전`, `신입/인턴`, `대외활동` (drives the tabs in the contests screen). |
| `start_date` | timestamp (optional) | Used to show 모집 시작일 in the detail screen. |
| `description` | string (optional, HTML supported) | Detail description text. You can include `<strong>`, `<em>`, `<u>`, `<span style="color:#...">`, lists, etc. Stored strings are sanitized via `shared/contestRichText`. |
| `apply_url` | string (optional) | External link for 지원하기 버튼. |

### 5. `contest_details`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Usually same as the parent contest. |
| `organizer` | string | Host organization. |
| `category` | string | Same categories as `contests`. |
| `start_date` | timestamp | 모집 시작일. |
| `end_date` | timestamp | 모집 마감일. |
| `image_url` | string | Poster image. |
| `description` | string | 상세 소개. Supports HTML (same whitelist as above, sanitized before save). |
| `requirements` | string | 지원 자격. Supports HTML (sanitized). |
| `benefits` | string | 참여 혜택. Supports HTML (sanitized). |
| `apply_url` | string | External 링크. |

### 6. `saved_contests`
| Field | Type | Notes |
| --- | --- | --- |
| `contest_id` | string | ID of the original contest document. |
| `user_id` | string | Firebase Auth UID (or placeholder). |
| `title` | string | Contest title snapshot. |
| `organizer` | string | Host organization snapshot. |
| `start_date` | timestamp/string | Optional start date to show. |
| `end_date` | timestamp/string | Used to add entry to calendar. |
| `image_url` | string | Poster image (optional). |
| `apply_url` | string | External link (optional). |
| `saved_at` | timestamp | When the user bookmarked the contest. |

Use `scripts/seedContests.js` to populate both `contests` and `contest_details` with dummy data for testing.

### 7. `user_profiles`
Document ID = Firebase Auth UID. Tracks student verification.

| Field | Type | Notes |
| --- | --- | --- |
| `university_name` | string | University or college displayed in the 마이 탭. |
| `verification_status` | string | One of `verified`, `pending`, `unverified`. Drives feature restrictions. |
| `student_email_domain` | string (optional) | Official school domain for cross-checks. |
| `student_id_image_url` | string (optional) | Download URL for the submitted ID. |
| `student_id_storage_path` | string (optional) | Exact Cloud Storage path for the uploaded ID image. |
| `student_id_storage_folder` | string (optional) | Folder slug that includes the student's names for easy browsing in Storage. |
| `student_id_number` | string (optional) | Student number entered during verification. |
| `department` | string (optional) | Department or major. |
| `korean_name` | string (optional) | Legal Korean name from the ID. |
| `english_name` | string (optional) | English name from the ID. |
| `note` | string (optional) | Additional description provided by the student. |
| `submitted_at` | timestamp (optional) | When the verification was submitted. |
| `updated_at` | timestamp | Last review time. |

> Default new users to `verification_status = "unverified"` and bump them to `pending`/`verified` during manual review.

### 8. `user_push_settings`
Document ID = Firebase Auth UID. Stores Expo push tokens + per-topic preferences.

| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | string | Same as document ID. |
| `enabled` | boolean | Global opt-in toggle. Defaults to `true` when the user accepts permissions. |
| `expo_push_tokens` | array\<object> | Most recent device tokens (max 5). Each entry: `{ token, platform, device_name, app_version, last_seen }`. |
| `preferences` | object | `{ newsletters, contests, community, reminders }` booleans for topic subscriptions. |
| `quiet_hours` | object | `{ start_hour, end_hour }` using 24h format. |
| `timezone` | string | IANA timezone string (default `Asia/Seoul`). |
| `updated_at` | timestamp | Last update timestamp. |

### 9. `newsletters`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Main headline rendered on the 뉴스레터 탭 and 상세 화면. |
| `subtitle` | string (optional) | Short dek/subtitle below the title. |
| `content` | string | Full text body, paragraphs separated by `\n\n`. |
| `tags` | array\<string> | Up to 5 topical tags (rendered as #chips). |
| `image_url` | string (optional) | Hero image URL. |
| `edition` | string (optional) | E.g., `"Vol.12"`. Surfaces in search metadata. |
| `source` | string (optional) | Newsletter brand/author name. |
| `published_date` | timestamp/string | Used for sorting & detail header. |
| `created_date` | timestamp/string | Fallback timestamp. |

### 10. `notification_requests`
Used by Firebase Functions to fan-out push alarms.

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Notification title. |
| `body` | string | Notification body. |
| `data` | object | Extra payload delivered to the client (e.g., `{ screen: "/newsletters/abc123" }`). |
| `target` | object | `{ type: "topic" | "user", key: "newsletters" | uid }` describing the audience. |
| `send_after` | timestamp | When the push should be sent (UTC). |
| `created_by` | string | Optional admin UID/email for auditing. |

### 11. `push_ticket_receipts`
Internal queue for Expo push delivery receipts (processed nightly by `cleanupPushTokens`).

| Field | Type | Notes |
| --- | --- | --- |
| `token` | string | Expo push token that the ticket belongs to. |
| `user_id` | string | Reference to `user_push_settings/{uid}` for cleanup. |
| `platform` | string | `ios`, `android`, or `unknown` (used for analytics). |
| `topic` | string | Topic or trigger that generated the push (optional). |
| `processed` | boolean | Marked `true` once receipts are checked. |
| `created_at` | timestamp | When the ticket was stored. |
| `processed_at` | timestamp | When the cleanup job finished handling it. |

## Search / Algolia Extension Setup

- Install the **Search Firestore with Algolia** extension (`algolia/firestore-algolia-search`) once per collection that needs full-text search.
- For each installation, supply the same Algolia app credentials but use a different **Collection Path** and **Index Name**. Enable “Full index existing documents” during install so legacy docs are synced.
- Set **Indexable Fields** to `title,tags,content` to match the in-app search expectations. Other fields are stored automatically so cards can still show metadata.
- Recommended naming & configuration:

| Collection Path | Suggested Algolia Index Name | Notes |
| --- | --- | --- |
| `news` | `fine_news_news` | Title/summary used on 홈 · 뉴스 상세. |
| `newsletters` | `fine_news_newsletters` | Drives the 별도 뉴스레터 상세 화면. |
| `community_posts` | `fine_news_community_posts` | Allows 검색에서 게시판/학교 기준 필터. |
| `contests` | `fine_news_contests` | Exposes 카테고리/주최/설명 검색. |

- `firebase ext:install algolia/firestore-algolia-search --project=<PROJECT_ID>` (run four times). When prompted:
  - **Database ID:** `(default)`
  - **Collection Path:** one of the entries above.
  - **Indexable Fields:** `title,tags,content`
  - **Force Data Sync:** `false` (optional)
  - **Algolia Index Name:** as listed above.
  - **Algolia Application Id / API Key:** use the write-capable key (not the admin key).
- The Expo app reads the search-only key from `app.json > extra.algolia` (`appId`, `searchApiKey`, `indexPrefix`). Update those values with real credentials before building.

### Seeding Scripts
- `node scripts/seedAll.js` → populates `news`, `calendar_events`, `community_posts`, `contests`, `contest_details`, `saved_contests`, and sample `user_profiles`.
- `node scripts/seedCommunity.js` → seeds community posts only.
- `node scripts/seedContests.js` → seeds contest/contest_details only (used internally by `seedAll.js`).

### Auth & Verification Notes
- Email/password sign-up enforces Firebase password policy (6–12 characters, must include at least one lowercase letter and one number).
- After a new account is created we immediately send a Firebase email-verification message. Login blocks unverified accounts and re-sends the verification email if necessary.
- Student ID verification submissions live under `user_profiles/{uid}` and require admin approval through the separate web console.
