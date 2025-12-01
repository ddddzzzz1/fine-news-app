const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, writeBatch, Timestamp } = require("firebase/firestore");

// Config from firebaseConfig.js (manually extracted for Node environment)
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyACKQ18Pzvyfd9qGB8V8dRHREjrALfrmiI",
    authDomain: "test-fine-45ecf.firebaseapp.com",
    projectId: "test-fine-45ecf",
    storageBucket: "test-fine-45ecf.firebasestorage.app",
    messagingSenderId: "469883809874",
    appId: "1:469883809874:web:256888341be6f882d52f8b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to create dates relative to now
const daysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return Timestamp.fromDate(date);
};

const newsDrafts = [
    {
        title: "Fine 대학생을 위한 AI 트렌드 리포트 2025",
        summary: "대학생이 꼭 알아야 할 2025년 AI 기술 트렌드와 활용법을 정리했습니다.",
        content_html: "<p>2025년은 <strong>AI 에이전트</strong>의 해가 될 것입니다. 대학생들은 이를 어떻게 활용해야 할까요?</p><h3>1. 코딩 보조</h3><p>Github Copilot과 같은 도구는 이제 필수입니다.</p>",
        content_text: "2025년은 AI 에이전트의 해가 될 것입니다. 대학생들은 이를 어떻게 활용해야 할까요?\n\n1. 코딩 보조\nGithub Copilot과 같은 도구는 이제 필수입니다.",
        image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
        tags: ["AI", "트렌드", "대학생"],
        source: "Fine News",
        state: "published",
        created_at: daysFromNow(-2),
        published_date: daysFromNow(-1),
        key_data_points: {
            hero: { label: "AI 도입률", value: "68%", unit: "증가", insight: "전년 대비 급상승" },
            highlights: [{ tag: "핵심", text: "AI 에이전트 활용 능력 중요" }]
        }
    },
    {
        title: "취업 시장 2025: 신입 채용 트렌드 분석",
        summary: "대기업 공채 축소와 수시 채용 확대, 어떻게 대비해야 할까요?",
        content_html: "<p>2025년 취업 시장은 <strong>실무 역량</strong> 중심의 수시 채용이 더욱 확대될 전망입니다.</p>",
        content_text: "2025년 취업 시장은 실무 역량 중심의 수시 채용이 더욱 확대될 전망입니다.",
        image_url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1000",
        tags: ["취업", "채용", "분석"],
        source: "Fine Career",
        state: "published",
        created_at: daysFromNow(-5),
        published_date: daysFromNow(-4),
        key_data_points: {
            hero: { label: "수시채용", value: "85%", unit: "비중", insight: "공채 대비 압도적" }
        }
    },
    {
        title: "Fine 금융: 대학생을 위한 재테크 첫걸음",
        summary: "용돈 관리부터 청약 통장까지, 사회초년생이 되기 전 준비해야 할 금융 습관.",
        content_html: "<p>대학생 때부터 시작하는 <strong>재테크</strong>, 빠를수록 좋습니다.</p>",
        content_text: "대학생 때부터 시작하는 재테크, 빠를수록 좋습니다.",
        image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000",
        tags: ["금융", "재테크", "대학생"],
        source: "Fine Finance",
        state: "published",
        created_at: daysFromNow(-3),
        published_date: daysFromNow(-3),
    },
    {
        title: "삼성전자, 반도체 신기술 발표",
        summary: "차세대 메모리 반도체 기술 공개, 업계의 이목 집중.",
        content_html: "<p>삼성전자가 어제 컨퍼런스에서 <strong>차세대 HBM</strong> 기술을 선보였습니다.</p>",
        content_text: "삼성전자가 어제 컨퍼런스에서 차세대 HBM 기술을 선보였습니다.",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000",
        tags: ["반도체", "삼성전자", "기술"],
        source: "Tech Daily",
        state: "published",
        created_at: daysFromNow(-1),
        published_date: daysFromNow(0), // Just published
    },
    {
        title: "카카오, 새로운 AI 서비스 출시 예정",
        summary: "일상 생활을 돕는 AI 비서 서비스, 연내 출시 목표.",
        content_html: "<p>카카오가 <strong>전국민 AI</strong> 시대를 엽니다.</p>",
        content_text: "카카오가 전국민 AI 시대를 엽니다.",
        image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000",
        tags: ["AI", "카카오", "서비스"],
        source: "Tech Daily",
        state: "published",
        created_at: daysFromNow(-10),
        published_date: daysFromNow(-2),
    }
];

const communityPosts = [
    {
        title: "이번 학기 시간표 망한 것 같아요 ㅠㅠ",
        content: "전공 필수랑 교양이 다 겹쳐서... 우주 공강 생겼습니다. 조언 좀 해주세요.",
        board_type: "자유",
        university: "Fine University",
        user_id: "demo-user-1",
        created_by: "student1@fine.com",
        created_date: daysFromNow(0),
        like_count: 12,
        comment_count: 5,
        images: []
    },
    {
        title: "개발자 취업 준비 스터디 모집합니다 (서울)",
        content: "매주 토요일 강남역에서 알고리즘 스터디 하실 분 구합니다. 백준 골드 이상.",
        board_type: "스터디",
        university: "Fine University",
        user_id: "demo-user-2",
        created_by: "coder@fine.com",
        created_date: daysFromNow(-1),
        like_count: 5,
        comment_count: 2,
        images: []
    },
    {
        title: "대외활동 합격 꿀팁 공유합니다!",
        content: "지난 방학 때 했던 마케팅 서포터즈 활동 후기랑 자소서 팁 남겨요.",
        board_type: "취업",
        university: "Fine University",
        user_id: "demo-user-3",
        created_by: "marketer@fine.com",
        created_date: daysFromNow(-3),
        like_count: 45,
        comment_count: 10,
        images: [{
            url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000",
            meta: { width: 1000, height: 600 }
        }]
    }
];

const contests = [
    {
        title: "제 5회 Fine 대학생 프로그래밍 경진대회",
        organizer: "Fine Corp",
        category: "대외활동",
        start_date: daysFromNow(5),
        end_date: daysFromNow(30),
        image_url: "https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&q=80&w=1000",
        description: "총 상금 1,000만원! 대학생 최고의 코더를 찾습니다.",
        apply_url: "https://example.com/contest/1"
    },
    {
        title: "2025 마케팅 아이디어 공모전",
        organizer: "Brand X",
        category: "공모전",
        start_date: daysFromNow(1),
        end_date: daysFromNow(20),
        image_url: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=1000",
        description: "세상을 바꿀 창의적인 아이디어를 기다립니다.",
        apply_url: "https://example.com/contest/2"
    }
];

async function seedDemoData() {
    console.log("Starting demo data seeding (Client SDK)...");

    // Seed News Drafts
    console.log("Seeding News Drafts...");
    const newsBatch = writeBatch(db);
    newsDrafts.forEach(draft => {
        const ref = doc(collection(db, "news_drafts"));
        newsBatch.set(ref, draft);
    });
    await newsBatch.commit();
    console.log(`- Added ${newsDrafts.length} news drafts.`);

    // Seed Community Posts
    console.log("Seeding Community Posts...");
    const commBatch = writeBatch(db);
    communityPosts.forEach(post => {
        const ref = doc(collection(db, "community_posts"));
        commBatch.set(ref, post);
    });
    await commBatch.commit();
    console.log(`- Added ${communityPosts.length} community posts.`);

    // Seed Contests
    console.log("Seeding Contests...");
    const contestBatch = writeBatch(db);
    contests.forEach(contest => {
        const ref = doc(collection(db, "contests"));
        contestBatch.set(ref, contest);
        // Also add detail
        const detailRef = doc(collection(db, "contest_details"), ref.id);
        contestBatch.set(detailRef, contest);
    });
    await contestBatch.commit();
    console.log(`- Added ${contests.length} contests.`);

    console.log("✅ Demo data seeding complete!");
}

seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Error seeding data:", err);
        process.exit(1);
    });
