const admin = require("firebase-admin");

// Initialize Firebase Admin
// Assuming serviceAccount.json is in the parent directory relative to scripts/
const serviceAccount = require("../serviceAccount.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const TARGET_EMAIL = "fine3410@gmail.com";

async function grantAdmin() {
    try {
        // 1. Find the user by email
        const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
        const uid = userRecord.uid;
        console.log(`Found user: ${TARGET_EMAIL} (UID: ${uid})`);

        // 2. Update user_profiles
        const profileRef = db.collection("user_profiles").doc(uid);
        await profileRef.set(
            {
                verification_status: "admin",
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
        console.log(`Updated user_profiles/${uid} verification_status to 'admin'.`);

        // 3. (Optional) Set custom claim for redundancy, though app uses profile
        await auth.setCustomUserClaims(uid, { admin: true });
        console.log(`Set custom admin claim for ${uid}.`);

        console.log("Success! The user should now see admin features (might need to restart app).");
        process.exit(0);
    } catch (error) {
        console.error("Error granting admin privileges:", error);
        process.exit(1);
    }
}

grantAdmin();
