import { useState, useRef, useEffect } from "react";

export default function MusicPlayer({ track, onNext, onPrevious, onLike }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (track) {
      audioRef.current.src = track.preview_url;
      if (isPlaying) audioRef.current.play();
    }
  }, [track]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (e) => {
    const newTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
  };

  const updateProgress = () => {
    const newProgress =
      (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(newProgress);
  };

  return (
    <div className="music-player">
      <audio ref={audioRef} onTimeUpdate={updateProgress} />
      <div className="controls">
        <button onClick={onPrevious}>⏮️</button>
        <button onClick={togglePlayPause}>{isPlaying ? "⏸️" : "▶️"}</button>
        <button onClick={onNext}>⏭️</button>
        <input type="range" value={progress} onChange={handleProgress} />
        <button onClick={onLike}>❤️</button>
      </div>
    </div>
  );
}
