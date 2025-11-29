import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, connectAuthEmulator } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage, connectStorageEmulator, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyACKQ18Pzvyfd9qGB8V8dRHREjrALfrmiI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "test-fine-45ecf.firebaseapp.com",
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
    "https://test-fine-45ecf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "test-fine-45ecf",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "test-fine-45ecf.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "469883809874",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "1:469883809874:web:256888341be6f882d52f8b",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-N7Q90XGKYQ",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const storage = getStorage(app);
export const functions = getFunctions(app, "asia-northeast3");
export { ref, uploadBytesResumable, getDownloadURL };

const shouldUseEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === "1";

if (shouldUseEmulator) {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
  const firestorePort = Number(process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT ?? 8080);
  const authPort = Number(process.env.EXPO_PUBLIC_AUTH_EMULATOR_PORT ?? 9099);
  const functionsPort = Number(process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_PORT ?? 5001);
  const storagePort = Number(process.env.EXPO_PUBLIC_STORAGE_EMULATOR_PORT ?? 9199);

  connectFirestoreEmulator(db, host, firestorePort);
  connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
  connectFunctionsEmulator(functions, host, functionsPort);
  connectStorageEmulator(storage, host, storagePort);
}
