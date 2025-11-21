# Fine News App – Action Plan

Last updated: 2025-02-20

## 1. Market Indices Card _(DONE—hourly backend refresh deployed)_
- Build a dedicated “지수 안내” screen/modal describing each index (Nasdaq, Bitcoin, KOSPI, USD/KRW, 뉴욕 시장, 코스닥). ✅
- Wire tap handler from the home/newsletter index bar to open the screen. ✅
- Make the index bar sticky at the bottom of home/newsletter tabs (respect SafeArea insets, hide when keyboard open). ✅
- Implement Firebase Cloud Function that fetches Yahoo Finance + CoinGecko quotes every 60 minutes and stores normalized values in `system/market_indices`. ✅
- App reads cached values via React Query (fallback to static copy if missing). Add disclaimer “*실시간 지수 연동은 API 확정 후 적용 예정입니다.*” ✅

## 2. Authentication Improvements
- (2025-02-20) DONE: `sendEmailVerification` now fires immediately after sign-up and surfaces UI feedback when the email is already verified.
- (2025-02-20) DONE: “비밀번호 초기화” button added to the login screen and wired to `sendPasswordResetEmail`.
- (2025-02-20) DONE: Added structured auth logging plus tester email reminders to confirm verification/reset messages are delivered.

## 3. Student Verification Enhancements (DONE)
- Collect 학번/학과/한글·영문 이름, store them in `user_profiles`.
- Use folder naming `student-ids/{korean}_{english}_{uid}` for Storage uploads.
- Update Storage rules to allow folder access for matching UID.

## 4. Rich Content for Contests (DONE)
- (2025-02-20) Contest detail screen now renders `description`/`requirements`/`benefits` with `react-native-render-html` + a shared sanitizer, so bold/italic/colored/list markup is preserved.
- (2025-02-20) Added a lightweight “Contest Rich Text Builder” inside `fine-news-admin` to compose HTML snippets (bold/italic/underline/color/list) and copy sanitized JSON for Firestore/seed files.
- (2025-02-20) Any contest writes now flow through `shared/contestRichText.js` to normalize & sanitize markup before saving via scripts/admin tooling.

## 5. Image Handling
- Allow posts/news/contests to attach optional images; update Firestore schema (`images[]` with metadata).
- Add multi-image upload for contests & community posts (max 5). Show preview carousel, allow deletion before submit.
- Update Storage rules to cover `community_posts/{uid}/filename` and `contest_images/{docId}/filename`.

## 6. Calendar Personal Events
- Add “내 일정 추가” button on the calendar tab.
- Form fields: title, date, category (“마이”), optional description.
- Save to `calendar_events` with `is_personal = true` and `user_id` for filtering; allow edit/delete.

## 7. Search Functionality
- Use Firebase Extension (Algolia or Elastic) to index `news`, `community_posts`, `contests`, `newsletters`.
- Define searchable fields (title, tags, content) and deploy extension.
- Implement search UI with debounced queries and result tabs.

## 8. Newsletter Popup Visibility Test
- Instrument popup display with Firebase Analytics events (`newsletter_popup_show`, `newsletter_popup_click`).
- Use Remote Config to control popup frequency / audience segment.
- Run A/B test for visibility (e.g., 50% see popup vs. control).

## 9. Admin Tools
- Expose student verification queue (name, dept, Storage link) via `fine-news-admin`.
- Provide contest/ newsletter editor supporting HTML + media uploads.

## 10. QA & Deployment
- Regression test: auth flows, uploads, new HTML rendering, calendar events.
- Re-run ESLint/tests if added, confirm Firebase rules deployed (`firestore.rules`, `storage.rules`).
- Prepare release notes covering new features once completed.

> Keep this file updated after each major change: include date, status, and next steps so the whole team stays aligned.
