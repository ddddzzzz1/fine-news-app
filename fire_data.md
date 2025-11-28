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

### 1-b. `news_drafts`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Draft headline that becomes the published card title. |
| `summary` | string | Short deck/subtitle for cards and share payloads. |
| `content_html` | string | Primary body rendered with an HTML viewer in the detail page. |
| `content_text` | string | Plain-text fallback (paragraphs separated by `\\n\\n`). |
| `image_url` | string | Optional hero image stored under `news/{docId}/...` in Storage. |
| `image_meta` | object | `{ width, height, size, storage_path }` metadata for cleanup/aspect ratios. |
| `tags` | array\<string> | Topic filters + related-news lookups. |
| `key_data_points` | map | Structured dashboard summary used by the 앱. `{ hero: { label, value, unit, insight }, details: [{ label, value, note }], highlights: [{ tag, text }], timeline: [{ emoji, step }] }` |
| `source` | string | Publisher name (예: `한국경제TV`). |
| `source_url` | string | Canonical link Gemini searched (dedupe + "원문 보기"). |
| `state` | string | Workflow state: `pending`, `published`, or `rejected`. |
| `created_at` | timestamp | When Gemini (or an admin) created the draft. |
| `created_by` | string | UID/email/service identifier (`gemini@functions`). |
| `reviewed_at` | timestamp | Set when an admin approves or rejects. |
| `reviewed_by` | string | Admin UID/email. |
| `review_notes` | string | Optional rejection reason or editorial note. |
| `published_date` | timestamp | Visible publish date (set on approval). |
| `updated_at` | timestamp | Last edit timestamp (mobile or web admin). |
| `updated_by` | string | Email/UID of the last editor. |
| `gemini_prompt` | string | Snapshot of the structured Gemini prompt for auditing. |
| `gemini_response` | map | Raw Gemini JSON response (stored for traceability). |

> 일반 사용자는 `state == "published"` 문서만 읽습니다. 관리자(또는 Functions)만 초안 작성/수정/삭제가 가능하며, 뉴스 탭은 기본적으로 이 컬렉션을 구독합니다. 관리자는 웹 대시보드(`fine-news-admin`)에서 HTML 편집기를 사용하거나, 모바일 앱(`app/news/edit/[id].js`)에서 간단한 텍스트 편집이 가능합니다.

### 2. `community_posts`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Post title (cards + detail). |
| `content` | string | Body text. |
| `board_type` | string | One of `자유`, `취업`, `모집`, `스터디`. Users pick this when creating a post. |
| `university` | string | Displayed beside board type. |
| `user_id` | string | Firebase Auth UID of the author. Required for security rules. |
| `image_url` | string | **Deprecated** (Backward Compat). URL of the first image. |
| `image_meta` | object | **Deprecated** (Backward Compat). Metadata of the first image. |
| `images` | array\<object> | List of uploaded images. Each item: `{ url, meta: { width, height, size, storage_path } }`. |
| `created_date` | timestamp | Sort order. |
| `comment_count` | number | Optional metric. |
| `created_by` | string | User email/ID for ownership. |
| `like_count` | number | Total likes, used for 인기글 노출. |
| `liked_users` | array\<string> | UIDs/emails of users who liked the post (used to prevent duplicate likes). |
| `comments` | array\<object> | Comments stored inline. Shape: `{ id, author, display_name, content, created_at, user_id, is_author, anon_index }`. `display_name` is `"익명(작성자)"` for post author replies; others auto-increment `익명1`, `익명2`, … within the post. Keep `comment_count` in sync with the array length. |
| `reports_count` | number (optional) | Increment when 운영팀 processes a 신고 so 인기 영역에서 숨길 수 있습니다. |

> 커뮤니티 화면 상단의 탭(전체/인기글/자유/취업/모집/스터디)은 `board_type` 필드를 직접 필터링하며, “전체”는 필터 없이 최신순 전체 글을 보여주고 “인기글”은 `like_count`가 5회를 초과하는 문서만 노출하는 가상 카테고리입니다.

### 3. `calendar_events`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Event title in the calendar cells. |
| `description` | string | Short description shown below the calendar. |
| `date` | timestamp | Event day; determines calendar placement. |
| `category` | string | Either `마이` (개인 일정, `is_personal: true`) or `경제` (전 계정 공개 일정). |
| `is_personal` | boolean | `마이` 이벤트는 `true`, `경제` 이벤트는 `false`. 값에 따라 노출 범위가 달라집니다. |
| `user_id` | string (optional) | `마이` 일정일 때만 설정하며, 해당 UID 외에는 읽기/삭제가 불가합니다. |
| `created_by` | string (optional) | Email snapshot for audits. |
| `created_at` | timestamp (optional) | Stored with personal events for sorting. |

### 4. `contests`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Contest title. |
| `organizer` | string | Host organization. |
| `end_date` | timestamp | Used to calculate `D-` countdown. |
| `image_url` | string | Optional poster image. |
| `category` | string | One of `대외활동`, `취업`, `자격증` (drives the tabs in the contests screen). |
| `start_date` | timestamp (optional) | Used to show 모집 시작일 in the detail screen. |
| `description` | string (optional) | Detail description text. |
| `apply_url` | string (optional) | External link for 지원하기 버튼. |

> `contests.category`는 UI 칩(대외활동 · 취업 · 자격증)과 push 다이제스트 메시지가 공유하므로 다른 값은 허용되지 않습니다. 로컬에서 확인하려면 `node scripts/seedAll.js` 또는 `node scripts/seedContests.js`로 최신 샘플 데이터를 주입하세요.

### 5. `contest_details`
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Usually same as the parent contest. |
| `organizer` | string | Host organization. |
| `category` | string | Same categories as `contests` (`대외활동`, `취업`, `자격증`). |
| `start_date` | timestamp | 모집 시작일. |
| `end_date` | timestamp | 모집 마감일. |
| `image_url` | string | Poster image. |
| `description` | string | 상세 소개. |
| `requirements` | string | 지원 자격. |
| `benefits` | string | 참여 혜택. |
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
| `verification_status` | string | One of `verified`, `pending`, `unverified`, `admin`. Drives feature restrictions. |
| `student_email_domain` | string (optional) | Official school domain for cross-checks. |
| `student_id_image_url` | string (optional) | Download URL for the submitted ID image. |
| `student_id_storage_path` | string (optional) | Storage path of the uploaded 이미지. Used when 사용자가 계정을 삭제할 때 파일을 제거합니다. |
| `student_id_storage_folder` | string (optional) | Folder prefix(`student-ids/{name}_{uid}`) to delete every attempt at once. |
| `student_id_number` | string (optional) | Submitted 학번. |
| `department` | string (optional) | Submitted 학과. |
| `nickname` | string (optional) | 사용자 프로필, 커뮤니티, 공고 화면에 노출되는 닉네임. 마이 → 설정 → 닉네임 변경 화면에서 수정되며 Firebase Auth `displayName`과 동기화됩니다. |
| `korean_name` / `english_name` | string (optional) | 이름 표기. |
| `note` | string (optional) | 추가 설명. |
| `submitted_at` | timestamp | When the verification data was uploaded. |
| `updated_at` | timestamp | Last review time. |

> Default new users to `verification_status = "unverified"` and bump them to `pending`/`verified` during manual review. `admin` is a special flag used to unlock 운영/신고 관리 기능.

> **Account deletion:** Settings → “계정 완전 삭제”는 Firebase Functions(`closeAccount`)를 호출해 `user_profiles`, `saved_contests`, 개인 `calendar_events`, `community_posts`(및 첨부 이미지)를 제거합니다. 위의 Storage path 필드를 채워두어야 업로드된 학생증이 안전하게 삭제됩니다.

### 8. `daily_briefings`
| Field | Type | Notes |
| --- | --- | --- |
| `content` | string | 3-line summary of the day's top news. |
| `created_at` | timestamp | When the briefing was generated. |
| `source_news_id` | string | ID of the news draft used to generate this briefing. |

### 9. `system` (Market Indices)
Document ID: `market_indices`

| Field | Type | Notes |
| --- | --- | --- |
| `items` | map | Map of index IDs (e.g., `kospi`, `nasdaq`) to their current values. |
| `items.{id}.value` | number | Current index value. |
| `items.{id}.change` | number | Change amount. |
| `items.{id}.changePercent` | number | Percentage change. |
| `updated_at` | timestamp | Last update time. |

### Seeding Scripts
- `node scripts/seedAll.js` → populates `news`, `calendar_events`, `community_posts`, `contests`, `contest_details`, `saved_contests`, and sample `user_profiles`.
- `node scripts/seedCommunity.js` → seeds community posts only.
- `node scripts/seedContests.js` → seeds contest/contest_details only (used internally by `seedAll.js`).

### Moderation Collections
- `community_reports` → created automatically when 사용자가 게시글 또는 댓글을 신고할 때 채워지며, Firestore 규칙에서 `admin` 계정만 읽기/수정할 수 있도록 제한합니다. 문서 필드: `type` (post/comment), `post_id`, `comment_id`, `reason`, `reporter_id`, `reported_user_id`, `snapshot`, `status`, `created_at`. 앱 내 `/admin/reports` 화면에서 신고 상태 변경, 신고 문서 삭제, 원본 게시글/댓글 삭제를 모두 수행할 수 있습니다.

### Auth & Verification Notes
- Email/password sign-up enforces Firebase password policy (6–12 characters, must include at least one lowercase letter and one number).
- After a new account is created we immediately send a Firebase email-verification message. Login blocks unverified accounts and re-sends the verification email if necessary.
- Student ID verification submissions live under `user_profiles/{uid}` and require admin approval through the separate web console.
