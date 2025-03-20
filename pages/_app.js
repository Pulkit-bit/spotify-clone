import '../styles/globals.css'; // Ensure global styles are loaded
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../src/firebase'; // Corrected import path

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user);
      } else {
        console.log("No user logged in");
      }
    });

    return () => unsubscribe();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
