const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require("../serviceAccount.json")),
    });
}

const db = admin.firestore();

const now = Date.now();

const generateComments = (baseAuthor, count) => {
    return Array.from({ length: count }).map((_, idx) => ({
        id: `${baseAuthor}-c${idx + 1}`,
        author: `${baseAuthor}${idx + 1}`,
        content: `${baseAuthor}의 피드백 ${idx + 1}`,
        created_at: admin.firestore.Timestamp.fromMillis(now - 1000 * 60 * (idx + 5)),
    }));
};

const posts = [
    {
        title: "취업 스터디 핵심 요약",
        content: "면접 준비와 자소서 꿀팁을 공유합니다. 실전 감각을 높이는 방법도 적어두었어요.",
        board_type: "취업",
        university: "Fine University",
        created_by: "demo@example.com",
        created_date: admin.firestore.Timestamp.fromMillis(now - 1000 * 60 * 60 * 24),
        views: 350,
        liked_users: Array.from({ length: 12 }).map((_, i) => `user${i + 1}`),
        like_count: 12,
        comments: generateComments("스터디", 12),
    },
    {
        title: "교환학생 준비 체크리스트",
        content: "서류 준비부터 면접까지 경험 기반으로 정리했습니다. 필요한 서류 목록과 일정관리 팁도 있어요.",
        board_type: "정보",
        university: "Fine University",
        created_by: "exchange@fine.com",
        created_date: admin.firestore.Timestamp.fromMillis(now - 1000 * 60 * 60 * 12),
        views: 280,
        liked_users: Array.from({ length: 15 }).map((_, i) => `exchange${i + 1}`),
        like_count: 15,
        comments: generateComments("교환", 11),
    },
    {
        title: "포트폴리오 피드백 모음",
        content: "디자인 전공생들을 위해 다양한 포트폴리오 예시와 피드백을 정리했습니다.",
        board_type: "디자인",
        university: "Fine Art School",
        created_by: "design@fine.com",
        created_date: admin.firestore.Timestamp.fromMillis(now - 1000 * 60 * 60 * 5),
        views: 420,
        liked_users: Array.from({ length: 18 }).map((_, i) => `design${i + 1}`),
        like_count: 18,
        comments: generateComments("디자인", 14),
    },
];

async function seed() {
    const batch = db.batch();

    posts.forEach((post) => {
        const commentCount = post.comments ? post.comments.length : 0;
        const docRef = db.collection("community_posts").doc();
        batch.set(docRef, {
            ...post,
            comment_count: commentCount,
        });
    });

    await batch.commit();
    console.log("Seeded community posts with likes & comments.");
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
