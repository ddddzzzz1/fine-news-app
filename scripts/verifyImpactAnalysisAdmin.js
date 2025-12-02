const admin = require("firebase-admin");

const projectId = process.env.GCLOUD_PROJECT || "fine-news-mock";

if (!admin.apps.length) {
    admin.initializeApp({ projectId });
}

const db = admin.firestore();

async function seedImpactNews() {
    const newsData = {
        title: "[테스트] 반도체 업황 회복과 채용 시장의 변화",
        summary: "반도체 업황 회복으로 삼성전자 채용 확대 기대",
        content: "메모리 반도체 가격이 반등하면서 삼성전자와 SK하이닉스의 실적 개선이 예상됩니다. 이에 따라 하반기 공채 규모가 늘어날 것으로 보입니다. 특히 설비 투자와 관련된 직무에서 많은 채용이 이루어질 전망입니다.",
        state: "published",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        published_date: admin.firestore.FieldValue.serverTimestamp(),
        source: "Fine News Test",
        impact_analysis: {
            summary: "반도체 업황 회복으로 삼성전자 채용 확대 기대",
            investment: "메모리 가격 반등으로 하반기 실적 개선 예상, 주가 긍정적. 특히 HBM 관련 장비주에 주목할 필요가 있음.",
            employment: "DS부문 공채 규모 증가 가능성, 설비투자 관련 직무(공정설계, 설비기술) 주목. 반도체 관련 교육 이수자 우대 예상."
        },
        tags: ["경제", "취업", "반도체"]
    };

    try {
        const docRef = await db.collection('news_drafts').add(newsData);
        console.log(`✅ Test news created with ID: ${docRef.id}`);
    } catch (error) {
        console.error("Error creating test news:", error);
    }
}

seedImpactNews().then(() => {
    // Wait a bit for the write to propagate/log
    setTimeout(() => process.exit(0), 2000);
});
