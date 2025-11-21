export const MARKET_INDEX_CONFIG = [
    {
        id: "nasdaq",
        label: "나스닥",
        symbol: "^IXIC",
        market: "Nasdaq Composite",
        fallbackValue: "22,870.35",
        fallbackChange: "-2.2%",
        summary: "미국 기술주 중심 지수로 금리와 성장주 모멘텀에 크게 반응합니다.",
        insights: [
            "빅테크 실적 시즌과 AI 투자 모멘텀이 반영됩니다.",
            "연준 금리 인하 기대가 커질수록 강세를 보입니다.",
        ],
        dataSource: "Nasdaq Composite (delayed up to 15m) · 예정 API: Finnhub / TwelveData",
        session: "미국 동부(ET) 09:30-16:00",
        note: "데이터 출처: 미국 증시 종가 기준. 실시간 값은 향후 API 연동 예정입니다.",
    },
    {
        id: "dow",
        label: "뉴욕 시장",
        symbol: "^DJI",
        market: "Dow Jones Industrial Average",
        fallbackValue: "38,045.23",
        fallbackChange: "+0.6%",
        summary: "전통 제조·금융 업종 비중이 높은 대표 산업지수입니다.",
        insights: [
            "경기 민감주와 배당주 흐름을 파악할 수 있습니다.",
            "미국 경기선행지수와 국채금리에 영향을 크게 받습니다.",
        ],
        dataSource: "Dow Jones Industrial Average · 예정 API: Alpha Vantage premium",
        session: "미국 동부(ET) 09:30-16:00",
    },
    {
        id: "kospi",
        label: "코스피",
        symbol: "^KS11",
        market: "KOSPI",
        fallbackValue: "2,741.18",
        fallbackChange: "-0.3%",
        summary: "국내 대형주 지수로 외국인 수급과 환율 영향이 큽니다.",
        insights: [
            "반도체 업종과 환율 방향성 체크용으로 활용합니다.",
            "기관·연기금 수급 데이터를 함께 보면 의미가 커집니다.",
        ],
        dataSource: "KRX KOSPI 지수 · 예정 API: KRX Data Hub / NICE 평가정보",
        session: "한국 시간(KST) 09:00-15:30",
    },
    {
        id: "kosdaq",
        label: "코스닥",
        symbol: "^KQ11",
        market: "KOSDAQ",
        fallbackValue: "875.42",
        fallbackChange: "+1.1%",
        summary: "국내 벤처·중소형 성장주 지수로 변동성이 높습니다.",
        insights: [
            "바이오, 2차전지, 게임 섹터 이슈에 민감합니다.",
            "개인 투자자 비중이 높아 심리 변화가 빠르게 반영됩니다.",
        ],
        dataSource: "KRX KOSDAQ 지수 · 예정 API: KRX Data Hub / NICE 평가정보",
        session: "한국 시간(KST) 09:00-15:30",
    },
    {
        id: "usdkrw",
        label: "USD/KRW",
        symbol: "USD-KRW",
        market: "원·달러 환율",
        fallbackValue: "1,361.20",
        fallbackChange: "-0.5%",
        summary: "수출주 실적과 외국인 매수에 직접 영향이 있는 환율입니다.",
        insights: [
            "환율 방향과 외국인 자금 유입 추세를 동시에 확인할 수 있습니다.",
            "달러인덱스(DXY)와 미국 국채금리도 함께 모니터링하세요.",
        ],
        dataSource: "서울외환중개 고시환율 · 예정 API: Exchangerate.host / OpenExchangeRates",
        session: "한국 시간(KST) 09:00-15:30 (장중 실시간 변동)",
    },
    {
        id: "bitcoin",
        label: "비트코인",
        symbol: "BTC-USD",
        market: "Bitcoin Spot",
        fallbackValue: "$62,430",
        fallbackChange: "+3.4%",
        summary: "대표 가상자산으로 글로벌 위험자산 선호 지표로 활용됩니다.",
        insights: [
            "24시간 거래되므로 주말/야간 리스크 선호를 빠르게 보여줍니다.",
            "ETF 자금 유입과 온체인 데이터가 가격 변동성을 설명합니다.",
        ],
        dataSource: "CoinGecko / CoinAPI 실시간 평균가",
        session: "24시간",
    },
];

export const MARKET_INDEX_DEFAULT_ITEMS = MARKET_INDEX_CONFIG.map(
    ({ id, label, fallbackValue, fallbackChange, summary, note }) => ({
        id,
        label,
        value: fallbackValue,
        change: fallbackChange,
        description: summary,
        note,
    }),
);

export const MARKET_INDEX_CONFIG_MAP = MARKET_INDEX_CONFIG.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});
