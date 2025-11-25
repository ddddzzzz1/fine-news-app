const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function publishLatestDraft() {
    try {
        console.log('🔍 Searching for pending drafts (Admin SDK)...');

        const snapshot = await db.collection('news_drafts')
            .where('state', '==', 'pending')
            .get();

        if (snapshot.empty) {
            console.log('⚠️ No pending drafts found.');
            process.exit(0);
        }

        // Sort in memory to find the latest
        const drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        drafts.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

        const draft = drafts[0];
        console.log(`📄 Found draft: "${draft.title}" (ID: ${draft.id})`);

        console.log('🚀 Publishing...');

        await db.collection('news_drafts').doc(draft.id).update({
            state: 'published',
            published_date: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_by: 'script (admin)'
        });

        console.log('✅ Draft published successfully!');
        console.log('📱 Refresh your app to see it in the Home tab.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to publish draft:', error);
        process.exit(1);
    }
}

publishLatestDraft();
