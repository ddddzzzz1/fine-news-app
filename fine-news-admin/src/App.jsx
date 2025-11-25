import { useMemo, useRef, useState } from "react";
import "./App.css";
import { sanitizeContestFields, buildContestHtmlBlock } from "../../shared/contestRichText";

const DEFAULT_CONTEST = {
    title: "",
    organizer: "",
    category: "대외활동",
    start_date: "",
    end_date: "",
    image_url: "",
    apply_url: "",
    description:
        "<p><strong>공모전 소개</strong> 본문을 작성하세요. 줄바꿈은 단락으로 나눠주세요.</p><ul><li>핵심 과제 요약</li><li><span style=\"color:#2563eb\">포인트</span> 강조 가능</li></ul>",
    requirements: "<p>참가 자격 또는 필수 조건을 HTML로 입력하세요.</p>",
    benefits: "<p><strong>상금/혜택</strong>과 후속 프로그램을 안내하세요.</p>",
};

const CATEGORIES = ["대외활동", "취업", "자격증"];

export default function App() {
    const [contest, setContest] = useState(DEFAULT_CONTEST);
    const [copied, setCopied] = useState(false);

    const sanitizedContest = useMemo(() => sanitizeContestFields(contest), [contest]);
    const jsonExport = useMemo(() => JSON.stringify(sanitizedContest, null, 2), [sanitizedContest]);

    const handleChange = (field, value) => {
        setContest((prev) => ({ ...prev, [field]: value }));
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonExport);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Copy failed", error);
        }
    };

    const handleReset = () => {
        setContest(DEFAULT_CONTEST);
    };

    return (
        <div className="app-shell">
            <header className="app-header">
                <div>
                    <p className="eyebrow">Fine Admin Tool</p>
                    <h1>Contest Rich Text Builder</h1>
                    <p className="description">
                        HTML formatting helpers for 공모전 필드. Compose 강조/컬러/리스트 콘텐츠,
                        확인 후 JSON을 복사해 Firestore 혹은 seed 파일에 붙여넣으세요.
                    </p>
                </div>
                <div className="header-actions">
                    <button className="ghost" type="button" onClick={handleReset}>
                        초기화
                    </button>
                    <button className="primary" type="button" onClick={handleCopy}>
                        {copied ? "복사 완료!" : "JSON 복사"}
                    </button>
                </div>
            </header>

            <section className="section">
                <h2>기본 정보</h2>
                <p className="section-subtitle">
                    Firestore `contests` 문서의 텍스트 필드입니다. 날짜는 ISO 문자열 혹은 Timestamp로 입력하세요.
                </p>
                <div className="form-grid">
                    <Field
                        label="제목"
                        value={contest.title}
                        onChange={(value) => handleChange("title", value)}
                    />
                    <Field
                        label="주최"
                        value={contest.organizer}
                        onChange={(value) => handleChange("organizer", value)}
                    />
                    <Field
                        label="카테고리"
                        value={contest.category}
                        onChange={(value) => handleChange("category", value)}
                        type="select"
                    />
                    <Field
                        label="시작일 (ISO)"
                        value={contest.start_date}
                        onChange={(value) => handleChange("start_date", value)}
                        placeholder="2025-06-01T00:00:00.000Z"
                    />
                    <Field
                        label="마감일 (ISO)"
                        value={contest.end_date}
                        onChange={(value) => handleChange("end_date", value)}
                        placeholder="2025-06-30T00:00:00.000Z"
                    />
                    <Field
                        label="포스터 URL"
                        value={contest.image_url}
                        onChange={(value) => handleChange("image_url", value)}
                        placeholder="https://..."
                    />
                    <Field
                        label="지원 링크"
                        value={contest.apply_url}
                        onChange={(value) => handleChange("apply_url", value)}
                        placeholder="https://..."
                    />
                </div>
            </section>

            <section className="section">
                <h2>리치 텍스트 필드</h2>
                <p className="section-subtitle">
                    버튼을 눌러 강조, 기울임, 밑줄, 색상, 리스트 등을 삽입합니다. 모든 출력은 저장 전에 자동으로
                    sanitize 됩니다.
                </p>
                <RichTextEditor
                    label="소개 (description)"
                    value={contest.description}
                    onChange={(value) => handleChange("description", value)}
                />
                <RichTextEditor
                    label="지원 자격 (requirements)"
                    value={contest.requirements}
                    onChange={(value) => handleChange("requirements", value)}
                />
                <RichTextEditor
                    label="혜택 (benefits)"
                    value={contest.benefits}
                    onChange={(value) => handleChange("benefits", value)}
                />
            </section>

            <section className="section">
                <h2>Sanitized JSON 미리보기</h2>
                <p className="section-subtitle">
                    아래 JSON을 복사해 `scripts/seedContestsData.json` 혹은 Firestore Admin SDK에 전달하세요.
                </p>
                <pre className="json-output">{jsonExport}</pre>
            </section>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
    if (type === "select") {
        return (
            <label className="field">
                <span>{label}</span>
                <select value={value} onChange={(event) => onChange(event.target.value)}>
                    {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </label>
        );
    }

    return (
        <label className="field">
            <span>{label}</span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    );
}

function RichTextEditor({ label, value, onChange }) {
    const textareaRef = useRef(null);
    const [color, setColor] = useState("#2563eb");
    const safeValue = value || "";
    const previewHtml = buildContestHtmlBlock(safeValue);

    const wrapSelection = (prefix, suffix, placeholder = "텍스트") => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart = 0, selectionEnd = 0 } = textarea;
        const selectedText = safeValue.slice(selectionStart, selectionEnd) || placeholder;
        const newValue =
            safeValue.slice(0, selectionStart) +
            prefix +
            selectedText +
            suffix +
            safeValue.slice(selectionEnd);
        onChange(newValue);
        requestAnimationFrame(() => {
            textarea.focus();
            const start = selectionStart + prefix.length;
            const end = start + selectedText.length;
            textarea.setSelectionRange(start, end);
        });
    };

    const insertList = (type) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart = 0, selectionEnd = 0 } = textarea;
        const selectedText = safeValue.slice(selectionStart, selectionEnd);
        const lines = selectedText ? selectedText.split(/\r?\n/).filter(Boolean) : ["항목 1", "항목 2"];
        const list = `<${type}>${lines.map((line) => `<li>${line}</li>`).join("")}</${type}>`;
        const newValue = safeValue.slice(0, selectionStart) + list + safeValue.slice(selectionEnd);
        onChange(newValue);
        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = selectionStart + list.length;
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    return (
        <div className="rich-editor">
            <div className="rich-editor__label">
                <span>{label}</span>
                <p>지원 태그: &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;span style="color"&gt;, &lt;ul&gt;, &lt;ol&gt;</p>
            </div>
            <div className="toolbar">
                <button type="button" onClick={() => wrapSelection("<strong>", "</strong>")}>
                    굵게
                </button>
                <button type="button" onClick={() => wrapSelection("<em>", "</em>")}>
                    기울임
                </button>
                <button type="button" onClick={() => wrapSelection("<u>", "</u>")}>
                    밑줄
                </button>
                <button type="button" onClick={() => insertList("ul")}>
                    불릿 리스트
                </button>
                <button type="button" onClick={() => insertList("ol")}>
                    숫자 리스트
                </button>
                <label className="color-picker">
                    <span>색상</span>
                    <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
                    <button
                        type="button"
                        onClick={() => wrapSelection(`<span style="color:${color}">`, "</span>", "강조 텍스트")}
                    >
                        적용
                    </button>
                </label>
            </div>
            <textarea
                ref={textareaRef}
                value={safeValue}
                onChange={(event) => onChange(event.target.value)}
                placeholder="<p>HTML을 입력하세요</p>"
            />
            <div className="rich-editor__preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
    );
}
