const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");
const fs = require("fs");

async function main() {
    const email = process.argv[2];
    const action = process.argv[3];
    const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || path.resolve(__dirname, "../serviceAccount.json");

    if (!email || !action) {
        console.error("Usage: node scripts/manageAdminClaims.js <email> <action>");
        console.error("Actions: export, grant, revoke");
        process.exit(1);
    }

    if (!fs.existsSync(serviceAccountPath)) {
        console.error("serviceAccount.json not found at", serviceAccountPath);
        console.error("Set SERVICE_ACCOUNT_PATH or copy the file into the project root.");
        process.exit(1);
    }

    const serviceAccount = require(serviceAccountPath);

    initializeApp({
        credential: cert(serviceAccount),
    });

    const auth = getAuth();

    const user = await auth.getUserByEmail(email);
    console.log("Fetched user:", user.uid, user.email);

    if (action === "export") {
        console.log("Custom claims:", user.customClaims || {});
        return;
    }

    if (action === "grant") {
        await auth.setCustomUserClaims(user.uid, {
            ...(user.customClaims || {}),
            admin: true,
        });
        console.log(`Granted admin claim to ${email}`);
        return;
    }

    if (action === "revoke") {
        const claims = { ...(user.customClaims || {}) };
        delete claims.admin;
        await auth.setCustomUserClaims(user.uid, claims);
        console.log(`Revoked admin claim from ${email}`);
        return;
    }

    console.error("Unknown action:", action);
    process.exit(1);
}

main().catch((error) => {
    console.error("Failed to update admin claims", error);
    process.exit(1);
});
