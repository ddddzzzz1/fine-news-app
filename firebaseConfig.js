import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const storage = getStorage(app);
export const functions = getFunctions(app, "asia-northeast3");
export { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
