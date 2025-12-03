const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectLatestNews() {
    console.log('Fetching latest news draft...');
    try {
        const q = query(collection(db, 'news_drafts'), orderBy('created_at', 'desc'), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('No news drafts found.');
            return;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        console.log('=== Latest News Draft ===');
        console.log('ID:', doc.id);
        console.log('Title:', data.title);
        console.log('--- content_html ---');
        console.log(data.content_html);
        console.log('--------------------');
        console.log('--- content_text ---');
        console.log(data.content_text);
        console.log('--------------------');
        console.log('--- content (legacy) ---');
        console.log(data.content);
        console.log('--------------------');

    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

inspectLatestNews();
