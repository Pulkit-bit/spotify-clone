import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { logout } from "../src/firebase";

export default function Home() {
  const router = useRouter();
  const auth = getAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <h2>Spotify Clone</h2>
        <div className="nav-links">
          {user && <button className="btn" onClick={logout}>Logout</button>}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        <h1>Welcome to Spotify Clone</h1>
        {user ? (
          <>
            <p>Logged in as {user.displayName}</p>
            <button className="btn" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => router.push("/login")}>
            Login
          </button>
        )}
      </div>
    </>
  );
}
