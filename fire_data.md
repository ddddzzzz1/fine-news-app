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
| `category` | string | Must match color map (`경제`, `공모전`, `모둠인턴`, `마이`, `금융연수`, `오픈콘텐츠`, etc.). |
| `is_personal` | boolean | Used for the “마이 이벤트” filter. |

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
| `description` | string (optional) | Detail description text. |
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

### Seeding Scripts
- `node scripts/seedAll.js` → populates `news`, `calendar_events`, `community_posts`, `contests`, `contest_details`, `saved_contests`, and sample `user_profiles`.
- `node scripts/seedCommunity.js` → seeds community posts only.
- `node scripts/seedContests.js` → seeds contest/contest_details only (used internally by `seedAll.js`).

### Auth & Verification Notes
- Email/password sign-up enforces Firebase password policy (6–12 characters, must include at least one lowercase letter and one number).
- After a new account is created we immediately send a Firebase email-verification message. Login blocks unverified accounts and re-sends the verification email if necessary.
- Student ID verification submissions live under `user_profiles/{uid}` and require admin approval through the separate web console.
