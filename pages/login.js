import { useEffect } from "react";
import { useRouter } from "next/router";
import { auth, signInWithGoogle } from "../src/firebase"; // Import auth & sign-in function

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if user is already logged in
    auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/");
      }
    });
  }, [router]);

  return (
    <div className="container">
      <h1>Login to vibraX</h1>

      {/* Google Login Button */}
      <button className="btn" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
}
