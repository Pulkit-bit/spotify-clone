import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { logout } from "../src/firebase";
import { searchYouTube } from "../utils/Youtube";
import { db } from "../src/firebase"; // Import Firestore
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"; // Firestore functions

export default function Dashboard() {
  const router = useRouter();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedSongs, setLikedSongs] = useState([]);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchLikedSongs(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const results = await searchYouTube(searchQuery);
      setSongs(results);
    } catch (error) {
      console.error("Search Error:", error);
      setSongs([]);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.YT) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onload = () => {
          if (window.YT) {
            initPlayer();
          }
        };
        document.body.appendChild(script);
      } else {
        initPlayer();
      }
    }
  }, []);

  const initPlayer = () => {
    window.onYouTubeIframeAPIReady = () => {
      const newPlayer = new window.YT.Player("youtube-iframe", {
        height: "0",
        width: "0",
        playerVars: { autoplay: 1 },
        events: {
          onReady: (event) => setPlayer(event.target),
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              console.log("Song ended. Clicking Next button...");
              document.querySelector(".next-button")?.click(); // Simulate next button click
            }
          },
        },
      });
      setPlayer(newPlayer);
    };
  };

  const playVideo = (videoId) => {
    if (player && typeof player.loadVideoById === "function") {
      player.loadVideoById(videoId);
      player.playVideo();
    } else {
      console.error("Player not initialized yet.");
    }
  };

  useEffect(() => {
    if (player && currentVideoId) {
      playVideo(currentVideoId);
    }
  }, [currentVideoId, player]);

  useEffect(() => {
    if (player) {
      const interval = setInterval(() => {
        if (player && typeof player.getCurrentTime === "function") {
          setProgress(player.getCurrentTime() || 0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [player]);

  // Function to like/unlike a song
  const toggleLikeSong = async () => {
    if (!user || !currentVideoId) return;

    const currentSong = songs.find((song) => song.id.videoId === currentVideoId);
    if (!currentSong) return;

    try {
      const q = query(
        collection(db, "likedSongs"),
        where("userId", "==", user.uid),
        where("videoId", "==", currentVideoId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If the song is already liked, remove it (unlike)
        querySnapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(db, "likedSongs", docSnap.id));
        });
      } else {
        // If the song is not liked, add it
        await addDoc(collection(db, "likedSongs"), {
          userId: user.uid,
          videoId: currentSong.id.videoId,
          title: currentSong.title,
          thumbnail: currentSong.thumbnail.replace("default.jpg", "hqdefault.jpg"),
          channelTitle: currentSong.channelTitle,
        });
      }

      fetchLikedSongs(user.uid);
    } catch (error) {
      console.error("Error toggling liked song:", error);
    }
  };

  // Function to fetch liked songs
  const fetchLikedSongs = async (userId) => {
    try {
      const q = query(collection(db, "likedSongs"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const likedSongsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLikedSongs(likedSongsList);
    } catch (error) {
      console.error("Error fetching liked songs:", error);
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h2 className="logo">vibraX</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search Songs..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(); // Triggers search when Enter is pressed
              }
            }}
          />
          <button className="search-button" onClick={handleSearch}>🔍</button>
        </div>

        <button className="logout-btn" onClick={logout}>Logout</button>
      </nav>

      <h1 className="welcome">WELCOME, {user?.displayName?.toUpperCase()}</h1>
      <h2 className="search-results-title">Search Results</h2>

      <div className="liked-songs" onClick={() => router.push("/liked-songs")}>
        <h3>Liked Songs</h3>
      </div>

      <div className="search-results">
        {songs.length > 0 ? (
          <ul className="song-list">
            {songs.map((song) => (
              <li key={song.id.videoId} className="song-item">
                <img
                  src={song.thumbnail.replace("default.jpg", "hqdefault.jpg")}
                  alt="Thumbnail"
                  className="thumbnail"
                  onClick={() => setCurrentVideoId(song.id.videoId)}
                />
                <div className="song-info">
                  <h3>{song.title}</h3>
                 
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{
            fontSize: "30px",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "35vh",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: "bold", 
          }}>
            Use the above search box to display <br /> your favourite songs
          </p>
        )}
      </div>

      <div id="youtube-iframe" style={{ display: "none" }}></div>

      {/* Music Player Controller */}
      <div className="music-player">
        <button className="prev-button" onClick={() => {
          const currentIndex = songs.findIndex(song => song.id.videoId === currentVideoId);
          if (currentIndex > 0) setCurrentVideoId(songs[currentIndex - 1].id.videoId);
        }}>⏮️</button>

        <button className="play-pause-button" onClick={() => {
          if (player) {
            if (isPlaying) {
              player.pauseVideo();
            } else {
              player.playVideo();
            }
            setIsPlaying(!isPlaying);
          }
        }}>
          {isPlaying ? "⏸️" : "▶️"}
        </button>

        <button className="next-button" onClick={() => {
          const currentIndex = songs.findIndex(song => song.id.videoId === currentVideoId);
          if (currentIndex < songs.length - 1) setCurrentVideoId(songs[currentIndex + 1].id.videoId);
        }}>⏭️</button>

        <input
          type="range"
          className="seek-bar"
          min="0"
          max={player?.getDuration?.() || 100}
          value={progress}
          onChange={(e) => player?.seekTo(parseFloat(e.target.value))}
        />

        <button className="like-button" onClick={toggleLikeSong}>
          {likedSongs.some(song => song.videoId === currentVideoId) ? "❤️" : "🤍"}
        </button>
      </div>



      {/* CSS */}
      <style jsx>{`

        .dashboard {
          background-color: #121212;
          color: white;
          min-height: 100vh;
          padding: 20px;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #181818;
          padding: 15px 20px;
        }

        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1DB954;
        }

        .search-bar {
          display: flex;
          gap: 10px;
        }

        .search-input {
          padding: 8px;
          border-radius: 20px;
          border: none;
          width: 300px;
        }

        .search-button {
          padding: 8px 12px;
          background-color: #1DB954;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .search-button:hover{
         transform: scale(1.15); /* Slightly enlarges on hover */
        }

        .logout-btn {
          background-color: green;
          padding: 8px 12px;
          border-radius: 15px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .logout-btn:hover{
         background-color: red; /* Lighter Spotify Green on hover */
         transform: scale(1.09); /* Slightly enlarges on hover */
        }

        .welcome {
          position: absolute;
          top: 90px;
          left: 20px;
          font-size: 22px;
          font-weight: bold;
          text-shadow: 2px 2px 10px green;
        }

        .search-results-title {
          text-align: center;
          margin-top: 20px;
          font-size: 20px;
          font-weight: bold;
          color: white;
        }

        .liked-songs {
          position: absolute;
          top: 99px;
          right: 20px;
          width: 150px;
          height: 55px;
          background-color: #1DB954;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          text-align: center;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }
        
        .liked-songs:hover{
        background-color: #1ed760; /* Lighter Spotify Green on hover */
        transform: scale(1.05); /* Slightly enlarges on hover */
        }
        
        .like-button{
        font-size: 1.5rem;
        background-color: skyblue;
        border-radius: 8px;

        transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .like-button:hover{
         transform: scale(1.2);
        }

        .search-results {
         color: green;
         display: flex;
         flex-wrap: wrap;
         justify-content: center;
         gap: 15px;
         padding: 20px;
        }

        .song-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .song-item {
          background-color: #282828;
          padding: 10px;
          border-radius: 10px;
          width: 250px;
          text-align: center;
          cursor: pointer;
        }

        .song-item img {
          width: 100%;
          border-radius: 10px;
          transition: transform 0.3s ease-in-out; /* Smooth transition */
        }

        .song-item img:hover {
          transform: scale(1.1); /* Pop-out effect */
        }


        .youtube-player {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .youtube-player iframe {
          border-radius: 10px;
          max-width: 100%;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
        }

        .music-player {
          opacity: 0.7;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 50px;
          background-color: #181818;
          padding: 25px;
          position: fixed;
          bottom: 25px;
          width: 100%;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .music-player:hover{
         background-color: green;
         }

        .prev-button{
        background-color: lightgreen;
        transition: background-color 0.3s ease, transform 0.2s ease;
        font-size: 1.5rem; /* Increase the icon size */
        border-radius: 12px; /* Optional: Rounded corners */
        }

        .prev-button:hover{
        transform: scale(1.20); /* Slightly enlarges on hover */
        }

        .play-pause-button{
        background-color: lightgreen;
        transition: background-color 0.3s ease, transform 0.2s ease;
        font-size: 1.5rem; /* Increase the icon size */
        border-radius: 12px; /* Optional: Rounded corners */
        }

        .play-pause-button:hover{
         transform: scale(1.20); /* Slightly enlarges on hover */
        }

        .next-button{
        background-color: lightgreen;
        transition: background-color 0.3s ease, transform 0.2s ease;
        font-size: 1.5rem; /* Increase the icon size */
        border-radius: 12px; /* Optional: Rounded corners */
        }

        .next-button:hover{
         transform: scale(1.20); /* Slightly enlarges on hover */
        }

        .seek-bar {
        font-size: 1.5rem; /* Increase the icon size */
        border-radius: 12px; /* Optional: Rounded corners */
        width: 50%;
        }

        /* Responsive Design - Mobile Fixes */
@media (max-width: 768px) {

  .navbar {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .search-bar {
    flex-direction: column;
    width: 100%;
    align-items: center;
  }
          
  .search-input {
    width: 90%;
  }
     .logout-btn {
      position: relative;
     background-color: green;
          padding: 8px 12px;
          border-radius: 15px;
          right: 143px;
          font-size: small;
      }


  .welcome {
    position: relative;
    top: 0;
    left: 0;
    text-align: center;
    margin-top: 20px;
    font-size: 18px;
  }

  .liked-songs {
    position: relative;
    width: 100px;
    top: -114px;
    right: -122px;
    margin: -30px auto;
    font-size: small;
    height: 39px;
  }

  .search-results {
    flex-direction: column;
    align-items: center;
  }
.search-results-title {
    text-align: center;
    margin-top: 11px;
    font-size: 20px;
    font-weight: bold;
    color: white;
}
  .song-list {
    flex-direction: column;
    align-items: center;
  }

  .song-item {
    width: 90%;
  }

  .youtube-player {
    width: 100%;
    display: flex;
    justify-content: center;
  }
     .music-player {
          opacity: 0.7;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          background-color: #181818;
          padding: 2px;
          position: fixed;
          bottom: 25px;
          width: 92%;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }
          .prev-button{
        font-size: 1.2rem; /* Increase the icon size */
        border-radius: 12px; /* Optional: Rounded corners */
        }
        
         .play-pause-button{
        font-size: 1.2rem; /* Increase the icon size */
        border-radius: 12px; /* Optional: Rounded corners */
        }

         .next-button{
        font-size: 1.2rem; /* Increase the icon size */
        border-radius: 12px; /* Optional: Rounded corners */
        }



  .seek-bar {
    width: 80%;
  }
}
          
      `}</style>
    </div>
  );
}