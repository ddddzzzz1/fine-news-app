const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testAdminQuery() {
    try {
        console.log('🔍 Testing Admin Query...');

        // This matches the query in app/(tabs)/index.js for admins
        const snapshot = await db.collection('news_drafts')
            .where('state', 'in', ['published', 'pending'])
            .orderBy('created_at', 'desc')
            .limit(50)
            .get();

        console.log(`✅ Query successful! Found ${snapshot.size} docs.`);
        snapshot.docs.forEach(doc => {
            console.log(`- [${doc.data().state}] ${doc.data().title} (${doc.data().created_at?.toDate()})`);
        });

    } catch (error) {
        console.error('❌ Query failed:', error.message);
        if (error.details && error.details.includes('index')) {
            console.log('\n💡 DIAGNOSIS: Missing Index!');
            console.log('The app is failing because Firestore needs an index for this specific query.');
            console.log('Create it here:', error.details);
        }
    }
}

testAdminQuery();
