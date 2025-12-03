const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccount.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function check() {
    try {
        // 1. Check demo user claims
        const email = "demo@fine.com";
        try {
            const user = await auth.getUserByEmail(email);
            console.log(`User ${email} found. UID: ${user.uid}`);
            console.log("Custom Claims:", user.customClaims);
        } catch (e) {
            console.log(`User ${email} not found.`);
        }

        // 2. Check latest news draft
        const snapshot = await db.collection("news_drafts")
            .orderBy("created_at", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log("No news drafts found.");
        } else {
            const doc = snapshot.docs[0];
            const data = doc.data();
            console.log("\nLatest News Draft:");
            console.log("ID:", doc.id);
            console.log("Title:", data.title);
            console.log("State:", data.state);
            console.log("Impact Analysis:", JSON.stringify(data.impact_analysis, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

check();
