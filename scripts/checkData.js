const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

async function listNews() {
    console.log('Checking news_drafts collection...');
    try {
        const snapshot = await getDocs(collection(db, 'news_drafts'));
        if (snapshot.empty) {
            console.log('No documents found in news_drafts.');
        } else {
            console.log(`Found ${snapshot.size} documents:`);
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`- ID: ${doc.id}, Title: ${data.title}, State: ${data.state}, CreatedAt: ${data.created_at ? data.created_at.toDate() : 'N/A'}`);
            });
        }
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

listNews();
