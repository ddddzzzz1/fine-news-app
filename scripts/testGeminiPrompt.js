const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.emulator' });

async function runTest() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env.emulator");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Use the requested model

    const now = new Date();
    const kstOptions = { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    const currentDate = new Intl.DateTimeFormat('ko-KR', kstOptions).format(now);

    const prompt = `
    상황 (Context):
    - **현재 시각 (KST):** ${currentDate}
    - **역할:** 경제부 수석 에디터의 리서치 어시스턴트 (타겟 독자: 대학생 및 사회초년생)

    임무 (Task):
    지난 24시간 동안 발생한 **대한민국 경제 뉴스** 중 가장 중요하고 파급력이 큰 기사 하나를 선정하세요.
    에디터가 이 내용을 바탕으로 기사를 재작성할 것이므로, **정확한 수치, 팩트, 그리고 구체적인 내용**에 집중해야 합니다.
    **중요:** 이 뉴스가 **투자(Investment)**와 **취업/채용(Employment)** 시장에 미치는 영향을 심도 있게 분석하여 제공해야 합니다.

    톤앤매너 (Tone & Manner):
    1. **분석은 날카롭게:** 겉핥기식이 아닌, 실제 시장의 움직임과 기업의 의도를 꿰뚫어 보는 통찰력을 보여주세요.
    2. **어조는 친절하게:** 독자가 사회초년생임을 감안하여, 딱딱한 문어체보다는 **부드러운 구어체('~에요', '~할 수 있어요', '~인 것 같아요' 등)**를 사용하세요.
    3. **연결성:** "그래서 이게 나랑 무슨 상관인데?"라는 질문에 답할 수 있도록, 독자의 삶(취업, 소액 투자)과 연결 지어 설명해주세요.

    검색 규칙 (Strict):
    1. **검색 대상:** 대한민국 주요 경제 언론사의 최신 뉴스.
    2. **시간 필터:** 기사의 발행 시간을 반드시 확인하세요. [${currentDate}] 또는 지난 24시간 이내의 기사가 아니라면 **절대 무시하세요**.
    3. **주제 선정:** 일반적인 칼럼이나 사설보다는 정부 정책 변화, 주요 기업의 M&A/실적 발표, 거시경제 지표 발표를 우선순위에 두세요.

    출력 요구사항 (Output Requirement):
    아래 스키마에 맞춰 JSON 객체로 반환하세요. 출처(URL)나 언론사 이름은 포함하지 마세요. 모든 수치는 원문의 표기 그대로 정확하게 유지하세요.

    {
        "title": "string · 팩트 중심의 중립적인 한국어 헤드라인",
        "summary": "string · 핵심 내용을 요약한 3개의 문장 (줄바꿈 \\n 으로 구분)",
        "content_html": "string · <p>, <ul>, <b> 태그를 활용한 풍부한 HTML 본문 (5W1H 원칙 준수)",
        "content_text": "string · 본문의 일반 텍스트 버전",
        "tags": ["경제", "통화정책", "반도체", "..."],
        "published_date": "YYYY-MM-DD HH:mm (24시간제, KST 기준)",
        "impact_analysis": {
            "summary": "string · 이 뉴스가 중요한 이유 한 줄 요약 (한국어, '~에요'체)",
            "investment": "string · 투자자 관점에서의 상세 분석 (날카롭지만 친절하게, '~에요'체)",
            "employment": "string · 구직자/직장인 관점에서의 상세 분석 (실질적인 조언, '~에요'체)"
        },
        "key_data_points": {
            "hero": {
                "label": "예: 전산업생산",
                "value": "-0.8%",
                "unit": "전월비",
                "insight": "3개월 만에 감소 전환"
            },
            "details": [
                { "label": "반도체", "value": "-4.2%", "note": "수출 부진 영향" },
                { "label": "소비", "value": "-1.5%", "note": "재화 소비 위축" },
                { "label": "설비투자", "value": "-2.2%", "note": "기계류 투자 감소" }
            ],
            "highlights": [
                { "tag": "생산", "text": "전산업생산 3개월 만에 하락세" }
            ],
            "timeline": [
                { "emoji": "🏭", "step": "반도체 생산 급감 (-4.2%)" },
                { "emoji": "📉", "step": "전산업 생산 지수 하락 (-0.8%)" }
            ]
        }
    }
    `;

    console.log("🚀 Sending prompt to Gemini...");
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("\n✅ Gemini Response Received:\n");
        console.log(text);

        // Try parsing to verify JSON
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonStr);
        console.log("\n✅ JSON Parsed Successfully!");
        console.log("Title:", data.title);
        console.log("Impact Summary:", data.impact_analysis?.summary);

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

runTest();
