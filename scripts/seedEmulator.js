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

// --- Data Generators ---

const generateNews = (count) => {
    const news = [];
    const categories = ["AI", "경제", "취업", "캠퍼스", "금융", "기술"];
    for (let i = 1; i <= count; i++) {
        const cat = categories[i % categories.length];
        news.push({
            id: `news-gen-${i}`,
            title: `[${cat}] 2025년 최신 트렌드 뉴스 ${i}`,
            content: `이것은 ${i}번째 뉴스 기사입니다.\n\nAI와 데이터 사이언스가 대학 캠퍼스에서 어떻게 쓰이는지 정리했습니다.\n\n각 학과별 최신 프로젝트도 함께 확인하세요.`,
            image_url: "",
            published_date: timestamp(new Date(Date.now() - i * 86400000)), // Past days
            created_date: timestamp(new Date(Date.now() - i * 86400000 - 3600000)),
            source: "Fine News",
            tags: [cat, "트렌드"],
        });
    }
    return news;
};

const generateNewsDrafts = (count) => {
    const drafts = [];
    for (let i = 1; i <= count; i++) {
        drafts.push({
            id: `draft-gen-${i}`,
            title: `[공개] 경제 정책 브리핑 ${i}`,
            summary: `금융위원회의 최신 정책을 한눈에 정리한 ${i}번째 리포트입니다.`,
            content_html: `<p>금융위원회가 2025년 상반기 정책 로드맵을 발표했습니다. (${i})</p>`,
            content_text: `금융위원회가 2025년 상반기 정책 로드맵을 발표했습니다. (${i})`,
            tags: ["경제", "정책"],
            state: "published", // Changed from 'pending' to 'published' for visibility
            created_at: FieldValue.serverTimestamp(),
            published_date: timestamp(new Date(Date.now() - i * 43200000)),
            created_by: "gemini@functions",
        });
    }
    return drafts;
};

const generateCommunityPosts = (count) => {
    const posts = [];
    const boards = ["자유", "취업", "모집", "스터디"];
    const universities = ["Fine University", "KAIST", "Seoul Nat'l Univ", "Yonsei Univ"];

    for (let i = 1; i <= count; i++) {
        const board = boards[i % boards.length];
        const uni = universities[i % universities.length];
        posts.push({
            id: `post-gen-${i}`,
            title: `[${board}] 게시글 제목입니다 ${i}`,
            content: `커뮤니티 활성화를 위한 ${i}번째 테스트 게시글입니다. 자유롭게 의견을 남겨주세요.`,
            board_type: board,
            university: uni,
            user_id: i % 2 === 0 ? "demo-user" : "demo-admin",
            created_by: i % 2 === 0 ? "demo@fine.com" : "admin@fine.com",
            created_date: timestamp(new Date(Date.now() - i * 3600000)), // Past hours
            like_count: i * 2,
            liked_users: [],
            comments: [],
            comment_count: 0,
        });
    }
    return posts;
};

const generateCalendarEvents = (count) => {
    const events = [];
    for (let i = 1; i <= count; i++) {
        const isPersonal = i % 3 === 0;
        events.push({
            id: `event-gen-${i}`,
            title: isPersonal ? `개인 일정 ${i}` : `경제 일정 ${i}`,
            description: isPersonal ? "개인적인 할 일입니다." : "주요 경제 지표 발표.",
            date: timestamp(new Date(Date.now() + i * 86400000)), // Future days
            category: isPersonal ? "마이" : "경제",
            is_personal: isPersonal,
            user_id: isPersonal ? "demo-user" : null,
            created_at: FieldValue.serverTimestamp(),
        });
    }
    return events;
};

const generateContests = (count) => {
    const contests = [];
    const categories = ["대외활동", "취업", "자격증"];
    for (let i = 1; i <= count; i++) {
        const cat = categories[i % categories.length];
        contests.push({
            id: `contest-gen-${i}`,
            title: `제${i}회 ${cat} 챌린지`,
            organizer: `Fine ${cat} Center`,
            category: cat,
            start_date: timestamp(new Date(Date.now() + i * 86400000)),
            end_date: timestamp(new Date(Date.now() + (i + 10) * 86400000)),
            apply_url: "https://example.com",
        });
    }
    return contests;
};

const generateContestDetails = (baseContests) => {
    return baseContests.map(c => ({
        id: `${c.id}-detail`,
        title: c.title,
        organizer: c.organizer,
        category: c.category,
        start_date: c.start_date,
        end_date: c.end_date,
        requirements: "대학생 누구나",
        benefits: "상금 및 수료증",
        description: "이 공모전은 여러분의 역량을 키워줄 좋은 기회입니다.",
        apply_url: c.apply_url,
    }));
};

// --- Execution ---

const generatedNews = generateNews(20);
const generatedDrafts = generateNewsDrafts(20);
const generatedPosts = generateCommunityPosts(30);
const generatedEvents = generateCalendarEvents(15);
const generatedContests = generateContests(15);
const generatedContestDetails = generateContestDetails(generatedContests);

const seedPlan = [
    {
        name: "news",
        docs: generatedNews,
    },
    {
        name: "news_drafts",
        docs: generatedDrafts,
    },
    {
        name: "community_posts",
        docs: generatedPosts,
    },
    {
        name: "calendar_events",
        docs: generatedEvents,
    },
    {
        name: "contests",
        docs: generatedContests,
    },
    {
        name: "contest_details",
        docs: generatedContestDetails,
    },
    {
        name: "saved_contests",
        docs: [
            {
                id: "saved-demo-1",
                contest_id: generatedContests[0].id,
                user_id: "demo-user",
                title: generatedContests[0].title,
                organizer: generatedContests[0].organizer,
                end_date: generatedContests[0].end_date,
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
    // Batch limit is 500, so we chunk it if necessary (simple implementation assumes < 500 for demo)
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

async function seedAuth() {
    const user = {
        uid: "demo-user",
        email: "demo@fine.com",
        password: "test1234",
        displayName: "파인러버",
        emailVerified: true,
    };

    console.log("Attempting to seed Auth user:", user.email);

    try {
        await admin.auth().updateUser(user.uid, user);
        console.log(`✅ Updated auth user: ${user.email}`);
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            try {
                await admin.auth().createUser(user);
                console.log(`✅ Created auth user: ${user.email}`);
            } catch (createError) {
                console.error("❌ Failed to create auth user:", createError);
            }
        } else {
            console.warn("❌ Failed to update auth user:", error);
        }
    }
}

async function main() {
    console.log(`Seeding Firebase Emulator (project: ${projectId})...`);

    // Seed Auth
    await seedAuth();

    // Seed Firestore
    for (const collection of seedPlan) {
        process.stdout.write(` - ${collection.name} (${collection.docs.length} docs) ... `);
        await clearCollection(collection.name);
        await seedCollection(collection);
        console.log("done");
    }
    console.log("✅ Emulator data prepared with enhanced dataset.");
    process.exit(0);
}

main().catch((error) => {
    console.error("Failed to seed emulator", error);
    process.exit(1);
});
