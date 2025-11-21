const admin = require("firebase-admin");
const path = require("path");

// Adjust path to your service account if needed
const serviceAccountPath = path.resolve(__dirname, "../serviceAccount.json");

admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

async function main() {
    try {
        await db.doc("notification_requests/manual_newsletter_drop").set({
            title: "새 뉴스레터 도착!",
            body: "오늘의 핵심 이슈 3가지를 확인해보세요.",
            data: {
                screen: "/newsletters/demo123",
                type: "newsletter",
            },
            target: {
                type: "topic",
                key: "newsletters",
            },
            send_after: "2025-02-22T11:00:00+09:00",
            created_by: "admin@fine.news",
        });
        console.log("notification_requests/manual_newsletter_drop created.");
        process.exit(0);
    } catch (error) {
        console.error("Failed to create document:", error);
        process.exit(1);
    }
}

main();
