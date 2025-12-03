import { collection, doc, writeBatch, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const seedContestsClient = async () => {
    const batch = writeBatch(db);

    const dummyContests = [
        {
            title: "제1회 파인 뉴스 AI 해커톤",
            organizer: "파인 뉴스",
            category: "activity",
            start_date: Timestamp.fromDate(new Date()),
            end_date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days later
            apply_url: "https://fine.com/hackathon",
            description: "AI를 활용한 뉴스 서비스 혁신 아이디어 공모전입니다.",
            image_url: "https://picsum.photos/200/300",
            requirements: "대학생 및 대학원생 (개인 또는 4인 이하 팀)",
            benefits: "총 상금 1,000만원 및 인턴십 기회 제공",
        },
        {
            title: "2025 상반기 금융 데이터 분석 경진대회",
            organizer: "한국금융협회",
            category: "activity",
            start_date: Timestamp.fromDate(new Date()),
            end_date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days later
            apply_url: "https://k-finance.org/contest",
            description: "금융 데이터를 활용한 신용 평가 모델 개발 경진대회",
            image_url: "https://picsum.photos/200/301",
            requirements: "데이터 분석에 관심 있는 누구나",
            benefits: "대상 500만원, 입사 지원 시 서류 면제",
        },
        {
            title: "파인 마케팅 신입 채용 연계형 인턴",
            organizer: "파인 마케팅",
            category: "job",
            start_date: Timestamp.fromDate(new Date()),
            end_date: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days later
            apply_url: "https://fine-marketing.com/recruit",
            description: "디지털 마케팅 분야 신입 채용 연계형 인턴 모집",
            image_url: "https://picsum.photos/200/302",
            requirements: "기졸업자 또는 졸업 예정자",
            benefits: "월 250만원, 우수 수료자 정규직 전환",
        },
    ];

    dummyContests.forEach((contest) => {
        const newDocRef = doc(collection(db, "contests"));
        const newId = newDocRef.id;

        const commonData = {
            title: contest.title,
            organizer: contest.organizer,
            category: contest.category,
            start_date: contest.start_date,
            end_date: contest.end_date,
            apply_url: contest.apply_url,
            description: contest.description,
            image_url: contest.image_url,
            created_by: "system",
            created_at: serverTimestamp(),
        };

        // 1. Summary collection
        batch.set(doc(db, "contests", newId), commonData);

        // 2. Detail collection
        batch.set(doc(db, "contest_details", newId), {
            ...commonData,
            requirements: contest.requirements,
            benefits: contest.benefits,
        });
    });

    await batch.commit();
    console.log("Seeded dummy contests successfully!");
};
