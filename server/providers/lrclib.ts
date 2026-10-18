import type { LyricLine, LyricsData } from '../../src/types/music';

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  // Match [mm:ss.xx] or [mm:ss]
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
    let match: RegExpExecArray | null;
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const totalSeconds = minutes * 60 + seconds + centiseconds / 1000;

      if (text) {
        result.push({ time: totalSeconds, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export async function fetchLrclibLyrics(
  title: string,
  artist: string,
  durationSeconds?: number
): Promise<{ plainLyrics?: string; syncedLyrics?: LyricLine[] } | null> {
  try {
    // 1. Try exact match get
    const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').trim();

    let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(
      cleanArtist
    )}`;
    if (durationSeconds && durationSeconds > 0) {
      url += `&duration=${Math.round(durationSeconds)}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AraitMusic/1.0 (https://araitmusic.app)' }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics || data.plainLyrics) {
        return {
          plainLyrics: data.plainLyrics || undefined,
          syncedLyrics: data.syncedLyrics ? parseLrc(data.syncedLyrics) : undefined
        };
      }
    }

    // 2. Try search if exact get failed
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 5000);
    res = await fetch(searchUrl, {
      signal: searchController.signal,
      headers: { 'User-Agent': 'AraitMusic/1.0' }
    });
    clearTimeout(searchTimeout);

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const best = results[0];
        return {
          plainLyrics: best.plainLyrics || undefined,
          syncedLyrics: best.syncedLyrics ? parseLrc(best.syncedLyrics) : undefined
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('LRCLIB fetch error:', err);
    return null;
  }
}
