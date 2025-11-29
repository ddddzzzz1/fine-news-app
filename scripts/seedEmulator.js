"use strict";

/**
 * Firebase Emulator seeding script.
 * Run after starting the emulator:
 *
 * FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 * GCLOUD_PROJECT=fine-news-mock \
 * node scripts/seedEmulator.js
 *
 * The script wipes the target collections and inserts deterministic demo docs.
 */

const admin = require("firebase-admin");

const projectId = process.env.GCLOUD_PROJECT || "fine-news-mock";

if (!admin.apps.length) {
    admin.initializeApp({ projectId });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const timestamp = (date) => admin.firestore.Timestamp.fromDate(new Date(date));

const seedPlan = [
    {
        name: "news",
        docs: [
            {
                id: "news-ai-trend",
                title: "AI 트렌드 리포트: 캠퍼스 혁신",
                content: "AI와 데이터 사이언스가 대학 캠퍼스에서 어떻게 쓰이는지 정리했습니다.\n\n각 학과별 최신 프로젝트도 함께 확인하세요.",
                image_url: "",
                published_date: timestamp("2025-01-12T08:00:00+09:00"),
                created_date: timestamp("2025-01-12T07:30:00+09:00"),
                source: "Fine News",
                tags: ["AI", "Campus"],
            },
            {
                id: "news-job-market",
                title: "2025 채용 시장 전망",
                content: "신입 공채 트렌드와 하반기 채용 일정을 한눈에 살펴봅니다.",
                published_date: timestamp("2025-01-10T09:00:00+09:00"),
                created_date: timestamp("2025-01-10T08:50:00+09:00"),
                source: "Fine News",
                tags: ["취업", "리포트"],
            },
        ],
    },
    {
        name: "news_drafts",
        docs: [
            {
                id: "draft-economy-policy",
                title: "한국 경제 정책 브리핑",
                summary: "금융위원회의 최신 정책을 한눈에 정리한 초안입니다.",
                content_html: "<p>금융위원회가 2025년 상반기 정책 로드맵을 발표했습니다.</p>",
                content_text: "금융위원회가 2025년 상반기 정책 로드맵을 발표했습니다.",
                tags: ["경제", "정책"],
                state: "pending",
                created_at: FieldValue.serverTimestamp(),
                created_by: "gemini@functions",
            },
        ],
    },
    {
        name: "community_posts",
        docs: [
            {
                id: "post-welcome",
                title: "Fine News 커뮤니티에 오신 것을 환영합니다",
                content: "서비스 소개와 커뮤니티 이용 수칙을 꼭 확인해주세요!",
                board_type: "공지",
                university: "Fine University",
                user_id: "demo-admin",
                created_by: "admin@fine.com",
                created_date: FieldValue.serverTimestamp(),
                like_count: 2,
                liked_users: ["demo-user", "demo-admin"],
                comments: [],
                comment_count: 0,
            },
            {
                id: "post-study",
                title: "AI 스터디 인원 모집합니다",
                content: "3월부터 매주 토요일에 스터디 예정입니다. 관심 있는 분 댓글 주세요.",
                board_type: "스터디",
                university: "KAIST",
                user_id: "demo-user",
                created_by: "demo@fine.com",
                created_date: FieldValue.serverTimestamp(),
                like_count: 0,
                liked_users: [],
                comments: [],
                comment_count: 0,
            },
        ],
    },
    {
        name: "calendar_events",
        docs: [
            {
                id: "event-market-briefing",
                title: "경제 브리핑 라이브",
                description: "주요 금융 지표를 함께 살펴봅니다.",
                date: timestamp("2025-02-15T10:00:00+09:00"),
                category: "경제",
                is_personal: false,
            },
            {
                id: "event-personal-1",
                title: "학생증 재발급 일정",
                description: "행정실 방문",
                date: timestamp("2025-02-05T13:00:00+09:00"),
                category: "마이",
                is_personal: true,
                user_id: "demo-user",
                created_by: "demo@fine.com",
                created_at: FieldValue.serverTimestamp(),
            },
        ],
    },
    {
        name: "contests",
        docs: [
            {
                id: "contest-esg",
                title: "ESG 혁신 아이디어 공모전",
                organizer: "Fine ESG Lab",
                category: "대외활동",
                start_date: timestamp("2025-03-01T00:00:00+09:00"),
                end_date: timestamp("2025-04-15T23:59:59+09:00"),
                apply_url: "https://example.com/contest/esg",
            },
            {
                id: "contest-ai-career",
                title: "AI 커리어 점프 챌린지",
                organizer: "Fine AI Center",
                category: "취업",
                start_date: timestamp("2025-02-20T00:00:00+09:00"),
                end_date: timestamp("2025-03-20T23:59:59+09:00"),
            },
        ],
    },
    {
        name: "contest_details",
        docs: [
            {
                id: "contest-esg-detail",
                title: "ESG 혁신 아이디어 공모전",
                organizer: "Fine ESG Lab",
                category: "대외활동",
                start_date: timestamp("2025-03-01T00:00:00+09:00"),
                end_date: timestamp("2025-04-15T23:59:59+09:00"),
                requirements: "대학생 누구나",
                benefits: "상금 및 인턴십 기회",
                description: "ESG 문제 해결을 위한 창의적인 아이디어를 제안하세요.",
                apply_url: "https://example.com/contest/esg",
            },
        ],
    },
    {
        name: "saved_contests",
        docs: [
            {
                id: "saved-demo-esg",
                contest_id: "contest-esg",
                user_id: "demo-user",
                title: "ESG 혁신 아이디어 공모전",
                organizer: "Fine ESG Lab",
                end_date: timestamp("2025-04-15T23:59:59+09:00"),
                saved_at: FieldValue.serverTimestamp(),
            },
        ],
    },
    {
        name: "user_profiles",
        docs: [
            {
                id: "demo-user",
                university_name: "충남대학교",
                verification_status: "verified",
                department: "경제학과",
                nickname: "파인러버",
                submitted_at: FieldValue.serverTimestamp(),
                updated_at: FieldValue.serverTimestamp(),
            },
            {
                id: "demo-unverified",
                university_name: "KAIST",
                verification_status: "pending",
                department: "산업디자인학과",
                nickname: "도토리",
                submitted_at: FieldValue.serverTimestamp(),
            },
        ],
    },
    {
        name: "daily_briefings",
        docs: [
            {
                id: "briefing-morning",
                title: "Morning Economic Briefing",
                content: "미국 증시 상승세, 국내 기업 실적 발표 집중.\n환율 안정세 유지.",
                key_points: ["나스닥 +1.2%", "USD/KRW 1320원대", "반도체 수주 증가"],
                created_at: FieldValue.serverTimestamp(),
            },
        ],
    },
    {
        name: "system",
        docs: [
            {
                id: "market_indices",
                items: {
                    kospi: { value: 2550.12, changePercent: 0.42 },
                    kosdaq: { value: 845.33, changePercent: -0.18 },
                    nasdaq: { value: 14450.56, changePercent: 1.02 },
                },
                updated_at: FieldValue.serverTimestamp(),
            },
        ],
    },
];

async function clearCollection(name) {
    const snapshot = await db.collection(name).get();
    if (snapshot.empty) {
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
}

async function seedCollection({ name, docs }) {
    if (!Array.isArray(docs) || !docs.length) {
        return;
    }
    const batch = db.batch();
    docs.forEach((doc) => {
        const data = { ...doc };
        const docId = data.id;
        delete data.id;
        const ref = docId ? db.collection(name).doc(docId) : db.collection(name).doc();
        batch.set(ref, data, { merge: true });
    });
    await batch.commit();
}

async function main() {
    console.log(`Seeding Firebase Emulator (project: ${projectId})...`);
    for (const collection of seedPlan) {
        process.stdout.write(` - ${collection.name} ... `);
        await clearCollection(collection.name);
        await seedCollection(collection);
        console.log("done");
    }
    console.log("✅ Emulator data prepared.");
    process.exit(0);
}

main().catch((error) => {
    console.error("Failed to seed emulator", error);
    process.exit(1);
});
