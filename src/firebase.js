import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Ensure Environment Variable is Read Properly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // ✅ Corrected Key Name
  authDomain: "spotify-clone-50ca5.firebaseapp.com",
  projectId: "spotify-clone-50ca5",
  storageBucket: "spotify-clone-50ca5.appspot.com",
  messagingSenderId: "1025157253012",
  appId: "1:1025157253012:web:68077993a669dac3227181"
};

// ✅ Fix Duplicate Firebase App Issue
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// ✅ Always Ask Google to Select Account
provider.setCustomParameters({ prompt: "select_account" });

// ✅ Google Login Function
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("User:", result.user);
    return result.user;
  } catch (error) {
    console.error("Error during sign-in:", error);
  }
};

// ✅ Logout Function (Redirect to /login)
const logout = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
    window.location.href = "/login"; // Redirect after logout
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

// ✅ EXPORT EVERYTHING (Including `app`)
export { app, auth, db, signInWithGoogle, logout };
