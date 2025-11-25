const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require("../serviceAccount.json")),
    });
}

const db = admin.firestore();
const now = admin.firestore.Timestamp.now();

const newsArticles = [
    {
        title: "Fine 대학생을 위한 AI 트렌드 리포트",
        content:
            "생성형 AI가 대학생 진로와 학습에 미치는 영향과 실제 적용 사례를 정리했습니다.\n\n현업 인터뷰와 대학 연구실 사례를 함께 다룹니다.",
        image_url: "",
        published_date: now,
        created_date: now,
        source: "Fine News",
        tags: ["AI", "트렌드"],
    },
    {
        title: "취업 시장 2025 전망",
        content: "기업별 채용 전략과 신입/인턴 트렌드를 한눈에 볼 수 있는 리포트입니다.",
        image_url: "",
        published_date: now,
        created_date: now,
        source: "Fine News",
        tags: ["취업", "리포트"],
    },
];

const newsDrafts = [
    {
        title: "한국 경제의 미래 (Draft)",
        summary: "AI와 반도체 산업을 중심으로 한 2025년 경제 전망 초안입니다.",
        content_html: "<p>한국 경제가 <strong>AI</strong>와 <strong>반도체</strong>를 중심으로 재편되고 있습니다.</p><p>정부의 지원 정책과 기업들의 투자가 맞물려...</p>",
        content_text: "한국 경제가 AI와 반도체를 중심으로 재편되고 있습니다.\n\n정부의 지원 정책과 기업들의 투자가 맞물려...",
        image_url: "",
        tags: ["경제", "AI"],
        source: "Fine News",
        source_url: "https://example.com/news/1",
        state: "pending",
        created_at: now,
        created_by: "gemini@functions",
        gemini_prompt: "한국 경제 뉴스 검색...",
        gemini_response: { some: "data" },
    },
    {
        title: "부동산 시장 동향 (Published Draft)",
        summary: "최근 부동산 시장의 변화와 전망을 분석합니다.",
        content_html: "<p>부동산 시장이 안정세에 접어들고 있습니다.</p>",
        content_text: "부동산 시장이 안정세에 접어들고 있습니다.",
        image_url: "",
        tags: ["부동산"],
        source: "Fine News",
        source_url: "https://example.com/news/2",
        state: "published",
        created_at: now,
        created_by: "admin@fine.com",
        reviewed_at: now,
        reviewed_by: "admin@fine.com",
        published_date: now,
    },
    {
        title: "가상화폐 규제 (Rejected Draft)",
        summary: "가상화폐 규제 관련 뉴스 초안입니다.",
        content_html: "<p>가상화폐 규제가 강화될 예정입니다.</p>",
        content_text: "가상화폐 규제가 강화될 예정입니다.",
        image_url: "",
        tags: ["가상화폐"],
        source: "Fine News",
        source_url: "https://example.com/news/3",
        state: "rejected",
        created_at: now,
        created_by: "gemini@functions",
        reviewed_at: now,
        reviewed_by: "admin@fine.com",
        review_notes: "중복된 내용입니다.",
    },
];

const calendarEvents = [
    {
        title: "AI 해커톤 준비 모임",
        description: "해커톤 참가 예정자를 위한 준비 모임",
        date: admin.firestore.Timestamp.fromDate(new Date("2025-02-10")),
        category: "경제",
        is_personal: false,
    },
    {
        title: "Saved Contest #6",
        description: "저장한 공모전 마감일 알림",
        date: admin.firestore.Timestamp.fromDate(new Date("2025-06-30")),
        category: "마이",
        is_personal: true,
    },
];

const savedContests = [
    {
        id: "saved-demo-user-contest-6",
        contest_id: "contest-6",
        user_id: "demo-user",
        title: "ESG 혁신 아이디어 해커톤",
        organizer: "Fine ESG Lab",
        start_date: "2025-05-01",
        end_date: "2025-06-30",
        image_url: "",
        apply_url: "https://example.com/contest-6",
        saved_at: now,
    },
    {
        id: "saved-demo-user-contest-8",
        contest_id: "contest-8",
        user_id: "demo-user",
        title: "AI 마케팅 아이디어 공모전",
        organizer: "Fine AI Center",
        start_date: "2025-05-10",
        end_date: "2025-07-10",
        image_url: "",
        apply_url: "https://example.com/contest-8",
        saved_at: now,
    },
];

const communityPosts = [
    {
        title: "Fine News 커뮤니티 오픈",
        content: "서비스 소개와 함께 커뮤니티 이용 수칙을 정리했습니다.",
        board_type: "공지",
        university: "Fine University",
        user_id: "demo-user",
        created_by: "admin@fine.com",
        created_date: now,
        liked_users: [],
        like_count: 0,
        comments: [],
        comment_count: 0,
    },
];

const userProfiles = [
    {
        uid: "demo-unverified",
        university_name: "충남대학교",
        verification_status: "pending",
        student_email_domain: "student.cnu.ac.kr",
        student_id_image_url: "https://placehold.co/400x250?text=Student+ID",
        student_id_storage_folder: "student-ids/홍길동_HongGilDong_demo-unverified",
        student_id_storage_path: "student-ids/홍길동_HongGilDong_demo-unverified/sample.jpg",
        student_id_number: "20250001",
        department: "컴퓨터공학과",
        korean_name: "홍길동",
        english_name: "Hong Gil Dong",
        submitted_at: now,
        note: "테스트 제출",
    },
    {
        uid: "demo-verified",
        university_name: "KAIST",
        verification_status: "verified",
        student_email_domain: "kaist.ac.kr",
        student_id_image_url: "https://placehold.co/400x250?text=Verified",
        student_id_storage_folder: "student-ids/김미나_MinaKim_demo-verified",
        student_id_storage_path: "student-ids/김미나_MinaKim_demo-verified/sample.jpg",
        student_id_number: "20240099",
        department: "산업디자인학과",
        korean_name: "김미나",
        english_name: "Mina Kim",
        submitted_at: now,
        reviewed_at: now,
        reviewed_by: "admin-bot",
        note: "",
    },
];

const contestData = require("./seedContestsData.json");
const { sanitizeContestFields } = require("../shared/contestRichText");

async function seedNews() {
    await Promise.all(
        newsArticles.map((article) => db.collection("news").add(article))
    );
    console.log("Seeded news articles.");
}

async function seedNewsDrafts() {
    await Promise.all(
        newsDrafts.map((draft) => db.collection("news_drafts").add(draft))
    );
    console.log("Seeded news drafts.");
}

async function seedCalendar() {
    await Promise.all(
        calendarEvents.map((event) => db.collection("calendar_events").add(event))
    );
    console.log("Seeded calendar events.");
}

async function seedSavedContests() {
    await Promise.all(
        savedContests.map((entry) =>
            db.collection("saved_contests").doc(entry.id).set(entry)
        )
    );
    console.log("Seeded saved contests.");
}

async function seedCommunity() {
    await Promise.all(
        communityPosts.map((post) =>
            db.collection("community_posts").add(post)
        )
    );
    console.log("Seeded community posts.");
}

async function seedContestCollections() {
    const batch = db.batch();
    contestData.forEach((contest) => {
        const sanitizedContest = sanitizeContestFields(contest);
        const contestRef = db.collection("contests").doc(contest.id);
        const detailRef = db.collection("contest_details").doc(contest.id);
        batch.set(contestRef, {
            title: sanitizedContest.title,
            organizer: sanitizedContest.organizer,
            category: sanitizedContest.category,
            start_date: sanitizedContest.start_date,
            end_date: sanitizedContest.end_date,
            image_url: sanitizedContest.image_url,
            description: sanitizedContest.description,
            apply_url: sanitizedContest.apply_url,
        });
        batch.set(detailRef, sanitizedContest);
    });
    await batch.commit();
    console.log("Seeded contests and contest_details.");
}

async function seedUserProfiles() {
    await Promise.all(
        userProfiles.map((profile) =>
            db.collection("user_profiles").doc(profile.uid).set(profile, { merge: true })
        )
    );
    console.log("Seeded user profiles.");
}

async function run() {
    await seedNews();
    await seedNewsDrafts();
    await seedCalendar();
    await seedSavedContests();
    await seedCommunity();
    await seedContestCollections();
    await seedUserProfiles();
    console.log("All seed data inserted.");
}

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
