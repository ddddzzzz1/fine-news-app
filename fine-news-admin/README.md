# Fine News Contest Builder

이 Vite 앱은 운영팀이 공고(대외활동/취업/자격증)를 빠르게 작성하고 JSON으로 내보내도록 돕는 경량 도구입니다. `fine-news-admin` 루트 프로젝트와 동일한 Firebase 구성을 공유하지만, 이 폴더에서는 **공고 리치 텍스트 편집기**만 제공합니다.

## 사용법

1. 의존성 설치: `npm install`
2. `.env.example`을 `.env`로 복사하고 `VITE_FIREBASE_*` 값을 메인 앱과 동일하게 채웁니다.
3. 개발 서버 실행: `npm run dev`
4. 화면 우측 상단 버튼으로 JSON을 복사해 `scripts/seedContestsData.json` 또는 Firestore Admin SDK에 붙여넣습니다.

## 카테고리 규칙

- 모든 공고는 `대외활동`, `취업`, `자격증` 중 하나여야 하며, 탭 UI와 푸시 다이제스트가 해당 값에 의존합니다.
- `DEFAULT_CONTEST` 초기값과 드롭다운 옵션을 수정했다면, `fine-news-admin/src/App.jsx`와 Firestore 문서가 같은 값만 허용하는지 재검토하세요.
- 잘못된 값이 들어가면 모바일 앱의 탭 필터에서 누락되므로 배포 전에 QA에서 카테고리별 노출을 반드시 확인합니다.

## 배포 팁

- 이 도구는 정적 리치 텍스트만 다루므로 최신 빌드를 Netlify/Vercel 등 정적 호스팅에 배포해도 됩니다.
- 카테고리나 필드가 바뀌면 `shared/contestRichText.js`와 `scripts/` 폴더의 시드 데이터를 동시에 업데이트하고, 변경 사항을 `fire_data.md`와 본 README에 기록하세요.
