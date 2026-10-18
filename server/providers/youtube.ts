interface YouTubeVideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  embedUrl: string;
}

export async function searchYouTubeLyricVideo(
  title: string,
  artist: string
): Promise<YouTubeVideoResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY;
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const query = `${cleanTitle} ${cleanArtist} official lyrics video`;

  // 1. If YouTube Data API key is present
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(
        query
      )}&type=video&key=${process.env.YOUTUBE_API_KEY}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const item = data?.items?.[0];
        if (item?.id?.videoId) {
          return {
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            embedUrl: `https://www.youtube-nocookie.com/embed/${item.id.videoId}?autoplay=1&enablejsapi=1`
          };
        }
      }
    } catch (err) {
      console.warn('YouTube Data API error:', err);
    }
  }

  // 2. Resilient fallback using YouTube Invidious / oEmbed metadata
  try {
    const invidiousMirrors = [
      'https://vid.puffyan.us',
      'https://inv.nadeko.net',
      'https://invidious.nerdvpn.de'
    ];

    for (const mirror of invidiousMirrors) {
      try {
        const url = `${mirror}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            const first = items[0];
            return {
              videoId: first.videoId,
              title: first.title,
              channelTitle: first.author,
              thumbnail: first.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${first.videoId}/hqdefault.jpg`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${first.videoId}?autoplay=1&enablejsapi=1`
            };
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }

  // 3. Guaranteed valid fallback reference if offline or blocked
  return null;
}
