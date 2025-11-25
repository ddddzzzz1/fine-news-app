import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";

export default function NewsDraftEditor({ draft, onBack }) {
    const [formData, setFormData] = useState({ ...draft });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        setFormData({ ...draft });
    }, [draft]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (newState) => {
        if (!window.confirm(`${newState} 상태로 저장하시겠습니까?`)) return;

        try {
            const updates = {
                ...formData,
                state: newState,
                reviewed_at: serverTimestamp(),
                reviewed_by: auth.currentUser?.email || "admin",
            };

            if (newState === "published") {
                updates.published_date = serverTimestamp();
            }

            await updateDoc(doc(db, "news_drafts", draft.id), updates);
            alert("저장되었습니다.");
            onBack();
        } catch (error) {
            console.error("Save failed", error);
            alert("저장 실패: " + error.message);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "news_drafts", draft.id));
            alert("삭제되었습니다.");
            onBack();
        } catch (error) {
            console.error("Delete failed", error);
            alert("삭제 실패: " + error.message);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `news/${draft.id}/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            handleChange("image_url", url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("업로드 실패");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="section editor-container">
            <div className="header-actions">
                <button onClick={onBack}>&larr; 목록으로</button>
                <div className="actions">
                    <button className="danger" onClick={handleDelete}>삭제</button>
                    <button className="secondary" onClick={() => handleSave("rejected")}>거절 (Reject)</button>
                    <button className="primary" onClick={() => handleSave("published")}>발행 (Publish)</button>
                </div>
            </div>

            <div className="form-grid">
                <label>
                    제목
                    <input
                        type="text"
                        value={formData.title || ""}
                        onChange={(e) => handleChange("title", e.target.value)}
                    />
                </label>
                <label>
                    요약
                    <input
                        type="text"
                        value={formData.summary || ""}
                        onChange={(e) => handleChange("summary", e.target.value)}
                    />
                </label>
                <label>
                    출처
                    <input
                        type="text"
                        value={formData.source || ""}
                        onChange={(e) => handleChange("source", e.target.value)}
                    />
                </label>
                <label>
                    원본 URL
                    <input
                        type="text"
                        value={formData.source_url || ""}
                        onChange={(e) => handleChange("source_url", e.target.value)}
                    />
                </label>
                <label>
                    이미지 URL
                    <div className="image-upload">
                        <input
                            type="text"
                            value={formData.image_url || ""}
                            onChange={(e) => handleChange("image_url", e.target.value)}
                        />
                        <input type="file" onChange={handleImageUpload} disabled={uploading} />
                        {uploading && <span>Uploading...</span>}
                    </div>
                    {formData.image_url && (
                        <img src={formData.image_url} alt="Preview" className="image-preview" style={{ maxHeight: 200 }} />
                    )}
                </label>
            </div>

            <div className="rich-text-section">
                <label>본문 (HTML)</label>
                <ReactQuill
                    theme="snow"
                    value={formData.content_html || ""}
                    onChange={(value) => handleChange("content_html", value)}
                    modules={{
                        toolbar: [
                            [{ header: [1, 2, false] }],
                            ["bold", "italic", "underline", "strike", "blockquote"],
                            [{ list: "ordered" }, { list: "bullet" }],
                            ["link", "image"],
                            ["clean"],
                        ],
                    }}
                />
            </div>
        </div>
    );
}
