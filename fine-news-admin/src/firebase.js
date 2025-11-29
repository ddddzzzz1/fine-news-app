import { initializeApp } from "firebase/app";
<<<<<<< HEAD
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyACKQ18Pzvyfd9qGB8V8dRHREjrALfrmiI",
    authDomain: "test-fine-45ecf.firebaseapp.com",
    databaseURL: "https://test-fine-45ecf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "test-fine-45ecf",
    storageBucket: "test-fine-45ecf.firebasestorage.app",
    messagingSenderId: "469883809874",
    appId: "1:469883809874:web:256888341be6f882d52f8b",
    measurementId: "G-N7Q90XGKYQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "asia-northeast3");
=======
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const PLACEHOLDER_PREFIX = "your-";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const REQUIRED_KEYS = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
];

const missingKeys = REQUIRED_KEYS.filter((key) => {
    const value = import.meta.env[key];
    if (!value) return true;
    if (value.startsWith(PLACEHOLDER_PREFIX)) return true;
    return false;
});

let firebaseApp = null;
let firebaseInitError = "";

if (missingKeys.length) {
    firebaseInitError = `Firebase 환경 변수가 누락되었습니다: ${missingKeys.join(", ")}`;
    console.warn(firebaseInitError);
} else {
    try {
        firebaseApp = initializeApp(firebaseConfig);
    } catch (error) {
        console.error("Failed to initialize Firebase", error);
        firebaseInitError =
            error?.message || "Firebase 초기화에 실패했습니다. 환경 설정을 다시 확인해주세요.";
    }
}

export const firebaseReady = Boolean(firebaseApp);
export const firebaseErrorMessage = firebaseInitError;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;
>>>>>>> 8b71076 (Commit all changes)
