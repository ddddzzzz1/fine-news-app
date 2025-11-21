Cursor Rules for This Project
Tech Stack Alignment

Use Expo/React Native with the Expo Router layout already in place (app/ directory).
Styling goes through NativeWind/Tailwind-style className strings—no StyleSheet objects unless absolutely necessary.
Data fetching/mutations must go through Firebase Firestore plus @tanstack/react-query for caching; keep queries invalidated like existing code.
Authentication uses Firebase Auth; leverage auth.currentUser instead of homegrown state.
Component & Hook Style

Default-export components with function declarations (export default function Screen()), not arrow expressions.
Favor early returns for loading/empty/error states, as seen in the screens.
When hitting Firestore, wrap calls in try/catch, console.log the error, and show user feedback (Alert.alert).
Local state uses React hooks; for derived data use useMemo. Route navigation uses useRouter from Expo Router.
Naming & Organization

Screens follow Expo Router naming (app/(tabs)/calendar.js, app/community/[id].js). Keep new screens under app/ with lowercase filenames; components live in components/ and use PascalCase names (CommunityPostCard).
Query keys are array literals describing scope (e.g., ["home-community-posts"]). Follow this pattern for new keys.
Firestore fields match the schema documented in fire_data.md; keep consistent casing (snake_case for fields like created_date, PascalCase for components).
Strictness & Conventions

Stick to the existing Tailwind utility classes for layout; avoid custom inline styles unless necessary for dynamic sizing.
After Firestore mutations, invalidate the relevant React Query keys to keep UI consistent.
When extending Firestore schema, update fire_data.md.
Keep user-facing strings in Korean like current UI copy unless instructed otherwise.
After completing any item from `TODO_PLAN.md`, update that file to mark the item’s status (e.g., “Pending” → “Done”) so the team can track progress.
Follow these rules verbatim so your contributions stay consistent with the current project style and infrastructure.
