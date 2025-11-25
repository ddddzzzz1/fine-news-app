import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "./firebase";

export default function NewsDrafts({ onSelectDraft }) {
    const [drafts, setDrafts] = useState([]);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        let q = query(collection(db, "news_drafts"), orderBy("created_at", "desc"));
        if (filter !== "all") {
            q = query(collection(db, "news_drafts"), where("state", "==", filter), orderBy("created_at", "desc"));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setDrafts(items);
        });

        return () => unsubscribe();
    }, [filter]);

    return (
        <div className="section">
            <div className="header-actions">
                <h2>뉴스 초안 목록</h2>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">전체</option>
                    <option value="pending">대기중 (Pending)</option>
                    <option value="published">발행됨 (Published)</option>
                    <option value="rejected">거절됨 (Rejected)</option>
                </select>
            </div>
            <div className="draft-list">
                {drafts.map((draft) => (
                    <div key={draft.id} className={`draft-card ${draft.state}`} onClick={() => onSelectDraft(draft)}>
                        <div className="draft-header">
                            <span className={`badge ${draft.state}`}>{draft.state}</span>
                            <span className="date">
                                {draft.created_at?.toDate().toLocaleString()}
                            </span>
                        </div>
                        <h3>{draft.title}</h3>
                        <p>{draft.summary}</p>
                        <div className="draft-meta">
                            <span>{draft.source}</span>
                            {draft.gemini_prompt && <span className="ai-badge">AI Generated</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
