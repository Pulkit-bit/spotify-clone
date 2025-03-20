
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY; // ✅ Correct


export const searchYouTube = async (query) => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch YouTube data");
  }

  const data = await response.json();
  return data.items.map((item) => ({
    id: item.id,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.default.url,
    audioUrl: `https://www.yt-download.org/api/button/mp3/${item.id.videoId}`, // For MP3 conversion
  }));
};
