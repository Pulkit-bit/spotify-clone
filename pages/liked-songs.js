import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../src/firebase";
import { collection, getDocs, query, where, doc, deleteDoc, setDoc } from "firebase/firestore";

export default function LikedSongs() {
  const router = useRouter();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [player, setPlayer] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songIndex, setSongIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
        fetchLikedSongs(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const fetchLikedSongs = async (userId) => {
    try {
      const q = query(collection(db, "likedSongs"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const songs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLikedSongs(songs);
    } catch (error) {
      console.error("Error fetching liked songs:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.YT) {
        console.log("Loading YouTube API...");
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
    if (typeof window !== "undefined" && window.YT && window.YT.Player) {
      console.log("Initializing YouTube Player...");
      const newPlayer = new window.YT.Player("youtube-iframe", {
        height: "0",
        width: "0",
        playerVars: { autoplay: 1 },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
          },
          onStateChange: onPlayerStateChange,
        },
      });
      setPlayer(newPlayer);
    } else {
      setTimeout(initPlayer, 500);
    }
  };

  const onPlayerStateChange = (event) => {
    if (!event.target || typeof event.target.getPlayerState !== "function") return;

    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        setDuration(event.target.getDuration());
        startProgressUpdate();
        break;
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;
      case window.YT.PlayerState.ENDED:
        console.log("Song ended. Simulating next button click...");
        document.getElementById("next-song-btn")?.click();
        break;
    }
  };

  const startProgressUpdate = () => {
    if (!player) return;
    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        setProgress(player.getCurrentTime());
        setDuration(player.getDuration());
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const playVideo = (song, index) => {
    if (player && typeof player.loadVideoById === "function") {
      player.loadVideoById(song.videoId);
      player.playVideo();
      setCurrentSong(song);
      setIsPlaying(true);
      setSongIndex(index);
      setProgress(0);
      setIsLiked(true);
      startProgressUpdate();
    } else {
      console.error("Player not initialized yet.");
    }
  };

  const togglePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
        startProgressUpdate();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (!player) return;

    setLikedSongs((prevLikedSongs) => {
      if (!prevLikedSongs || prevLikedSongs.length === 0) return prevLikedSongs;

      let nextIndex = (songIndex + 1) % prevLikedSongs.length;

      if (prevLikedSongs[nextIndex]) {
        playVideo(prevLikedSongs[nextIndex], nextIndex);
      }
      return prevLikedSongs;
    });
  };

  const playPrevious = () => {
    if (likedSongs.length > 0) {
      let prevIndex = (songIndex - 1 + likedSongs.length) % likedSongs.length;
      playVideo(likedSongs[prevIndex], prevIndex);
    }
  };

  const toggleLike = async () => {
    if (!currentSong) return;

    const songRef = doc(db, "likedSongs", currentSong.id);

    if (isLiked) {
      await deleteDoc(songRef);
      setIsLiked(false);
      setLikedSongs((prev) => prev.filter((song) => song.id !== currentSong.id));
    } else {
      await setDoc(songRef, {
        userId: user.uid,
        videoId: currentSong.videoId,
        title: currentSong.title,
        channelTitle: currentSong.channelTitle,
        thumbnail: currentSong.thumbnail,
      });
      setIsLiked(true);
      setLikedSongs((prev) => [...prev, currentSong]);
    }
  };

  const handleSeek = (event) => {
    if (player && typeof player.seekTo === "function") {
      const newTime = parseFloat(event.target.value);
      player.seekTo(newTime, true);
      setProgress(newTime);
    }
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Liked Songs</h1>
      <div className="grid-container">
        {likedSongs.length > 0 ? (
          likedSongs.map((song, index) => (
            <div key={song.id} className="grid-item" onClick={() => playVideo(song, index)}>
              <img src={song.thumbnail} alt="Thumbnail" className="thumbnail" />
              <h3>{song.title}</h3> 
            </div>
          ))
        ) : (
          <p>No liked songs yet.</p>
        )}
      </div>

      <div id="youtube-iframe"></div>

      {currentSong && (
        <div className="music-player">
          <div className="song-info">
            <img src={currentSong.thumbnail} alt="Thumbnail" className="player-thumbnail" />
            <div className="title-container">
              <h3 className="scrolling-title">{currentSong.title}</h3>
            </div>
          </div>

          <div className="player-controls">
            <button onClick={playPrevious}>⏮</button>
            <button onClick={togglePlayPause}>{isPlaying ? "⏸" : "▶"}</button>
            <button id="next-song-btn" onClick={playNext}>⏭</button>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            value={progress}
            className="seek-bar"
            onChange={handleSeek}
          />
          <button onClick={toggleLike} className="like-button" style={{ color: isLiked ? "red" : "white" }}>
            {isLiked ? "❤️" : "🤍"}
          </button>
        </div>
      )
      }

      {/* Scoped CSS for Liked Songs Page */}
      <style jsx>{`

        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          padding: 20px;
        }

        .grid-item {
          background-color: #222;
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.2s;
          color: lightseagreen;
          font-variant: all-petite-caps;
        }

        .grid-item:hover {
          transform: scale(1.05);
        }

        .thumbnail {
          width: 100%;
          border-radius: 10px;
        }

        .music-player {
          opacity: 0.7;
          position: fixed;
          bottom: 22px;
          left: 40px;
          width: 93%;
          background: #222;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
          transition: opacity 0.3s ease-in-out; /* Smooth transition */
        }
        .music-player:hover{
          opacity: 0.9;
        }
        .song-info {
          color: green;
          display: flex;
          align-items: center;
          overflow: hidden; /* Ensures text doesn't overflow */
          white-space: nowrap;
          width: 500px; /* Adjust as needed */
          
        }

        .title-container {
          width: 220px; /* Set width to control scrolling area */
          overflow: hidden;
          white-space: nowrap;
          position: relative;
        }

        .scrolling-title {
          display: inline-block;
          white-space: nowrap;
          animation: scrollText 7s linear infinite;
        }

        @keyframes scrollText {
          0% {
          transform: translateX(100%);
        }
          100% {
          transform: translateX(-100%);
        }
        }


        .player-thumbnail {
          width: 50px;
          height: 50px;
          border-radius: 5px;
          margin-right: 10px;
        }

        .player-controls {
          display: flex;
          gap: 10px;
        }

        .player-controls button {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .seek-bar {
          width: 100%;
          padding: 2px;
          margin: 5px 20px;
          appearance: none;
          background: #1DB954;
          height: 5px;
          border-radius: 5px;
        }

         .like-button {
          margin-top: 2px;
          font-size: 18px;
          padding: 10px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }


      `}</style>
    </div>
  );
}
