require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyACKQ18Pzvyfd9qGB8V8dRHREjrALfrmiI",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "test-fine-45ecf.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "test-fine-45ecf",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "test-fine-45ecf.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "469883809874",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:469883809874:web:256888341be6f882d52f8b",
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'asia-northeast3');
const auth = getAuth(app);

async function triggerGeminiNews() {
    try {
        console.log('🔐 Signing in as admin...');

        const email = process.env.EXPO_PUBLIC_TEST_EMAIL || "demo@fine.com";
        const password = process.env.EXPO_PUBLIC_TEST_PASSWORD || "test1234";

        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Signed in successfully\n');

        console.log('🤖 Triggering Gemini news generation...');

        const generateNews = httpsCallable(functions, 'generateNewsDraft');
        const result = await generateNews();

        console.log('\n✅ Function executed!');
        console.log('Result:', JSON.stringify(result.data, null, 2));

        if (result.data.success) {
            console.log(`\n📰 News draft created with ID: ${result.data.id}`);
            console.log('✨ Check your Firebase Console or admin dashboard to review it!');
        } else if (result.data.skipped) {
            console.log(`\n⚠️  ${result.data.reason}`);
        } else if (result.data.error) {
            console.log(`\n❌ Error: ${result.data.error}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Failed:', error.message);
        if (error.code) console.error('Code:', error.code);
        process.exit(1);
    }
}

triggerGeminiNews();
