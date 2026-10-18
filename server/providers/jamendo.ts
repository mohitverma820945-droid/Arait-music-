import type { Track, Artist } from '../../src/types/music';
import { getBestArtworkUrl } from '../artworkResolver';

const JAMENDO_CLIENT_ID = 'c73c2fb1';
const JAMENDO_BASE = 'https://api.jamendo.com/v3.0';

export async function searchJamendoTracks(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const url = `${JAMENDO_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=${limit}&namesearch=${encodeURIComponent(
      query
    )}&include=musicinfo&audioformat=mp32`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((t: any) => t.audio && t.duration > 30)
      .map((t: any): Track => ({
        id: `jamendo_${t.id}`,
        provider: 'jamendo',
        provider_track_id: String(t.id),
        title: t.name || 'Untitled',
        artist: t.artist_name || 'Independent Artist',
        album: t.album_name || 'Jamendo Release',
        artwork_url: getBestArtworkUrl(t.album_image || t.image, t.name, t.artist_name, t.album_name),
        duration_ms: (t.duration || 180) * 1000,
        playback_type: 'authorized_full_track',
        playback_url_or_provider_reference: t.audio,
        full_track_verified: true,
        genre: t.musicinfo?.tags?.genres?.[0] || 'Acoustic / World',
        release_date: t.releasedate,
        attribution: 'Jamendo Creative Commons Licensed'
      }));
  } catch (err) {
    console.error('Jamendo search error:', err);
    return [];
  }
}

export async function getJamendoPopular(limit: number = 25): Promise<Track[]> {
  try {
    const url = `${JAMENDO_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=${limit}&order=popularity_month_desc&include=musicinfo&audioformat=mp32`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((t: any) => t.audio)
      .map((t: any): Track => ({
        id: `jamendo_${t.id}`,
        provider: 'jamendo',
        provider_track_id: String(t.id),
        title: t.name,
        artist: t.artist_name,
        album: t.album_name || 'Popular Collection',
        artwork_url: getBestArtworkUrl(t.album_image || t.image, t.name, t.artist_name, t.album_name),
        duration_ms: (t.duration || 200) * 1000,
        playback_type: 'authorized_full_track',
        playback_url_or_provider_reference: t.audio,
        full_track_verified: true,
        genre: t.musicinfo?.tags?.genres?.[0] || 'Pop / Rock',
        attribution: 'Jamendo'
      }));
  } catch {
    return [];
  }
}
