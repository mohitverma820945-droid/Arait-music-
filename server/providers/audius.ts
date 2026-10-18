import type { Track, Artist } from '../../src/types/music';
import { getBestArtworkUrl } from '../artworkResolver';

// List of fallback Audius discovery nodes
const AUDIUS_DISCOVERY_NODES = [
  'https://discoveryprovider.audius.co',
  'https://audius-discovery-1.cultur3stake.com',
  'https://audius-discovery-2.cultur3stake.com',
  'https://discoveryprovider.mikitunes.com',
  'https://discoveryprovider.urgate.net'
];

let activeNode = AUDIUS_DISCOVERY_NODES[0];

async function fetchFromAudius(endpoint: string): Promise<any> {
  for (const node of [activeNode, ...AUDIUS_DISCOVERY_NODES.filter((n) => n !== activeNode)]) {
    try {
      const url = `${node}/v1${endpoint}${endpoint.includes('?') ? '&' : '?'}app_name=ARAIT_MUSIC`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        activeNode = node;
        const data = await res.json();
        return data.data;
      }
    } catch {
      // Try next node on timeout or network error
      continue;
    }
  }
  return null;
}

export async function searchAudiusTracks(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const raw = await fetchFromAudius(`/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!Array.isArray(raw)) return [];

    return raw
      .filter((item: any) => item && item.id && !item.is_delete)
      .map((item: any): Track => {
        const artwork = getBestArtworkUrl(
          item.artwork ? (item.artwork['1000x1000'] || item.artwork['480x480'] || item.artwork['150x150']) : null,
          item.title,
          item.user?.name
        );

        return {
          id: `audius_${item.id}`,
          provider: 'audius',
          provider_track_id: String(item.id),
          title: item.title || 'Untitled Track',
          artist: item.user?.name || item.user?.handle || 'Unknown Artist',
          artist_id: item.user?.id ? `audius_user_${item.user.id}` : undefined,
          album: item.genre || 'Single',
          artwork_url: artwork,
          duration_ms: (item.duration || 180) * 1000,
          playback_type: 'authorized_full_track',
          playback_url_or_provider_reference: `${activeNode}/v1/tracks/${item.id}/stream?app_name=ARAIT_MUSIC`,
          full_track_verified: true,
          genre: item.genre,
          attribution: 'Audius Open Protocol'
        };
      });
  } catch (err) {
    console.error('Audius search error:', err);
    return [];
  }
}

export async function getAudiusTrending(limit: number = 25): Promise<Track[]> {
  try {
    const raw = await fetchFromAudius(`/tracks/trending?limit=${limit}`);
    if (!Array.isArray(raw)) return [];

    return raw
      .filter((item: any) => item && item.id)
      .map((item: any): Track => {
        const artwork = item.artwork
          ? item.artwork['1000x1000'] || item.artwork['480x480']
          : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80';

        return {
          id: `audius_${item.id}`,
          provider: 'audius',
          provider_track_id: String(item.id),
          title: item.title,
          artist: item.user?.name || item.user?.handle || 'Artist',
          artist_id: item.user?.id ? `audius_user_${item.user.id}` : undefined,
          album: item.genre || 'Trending',
          artwork_url: artwork,
          duration_ms: (item.duration || 200) * 1000,
          playback_type: 'authorized_full_track',
          playback_url_or_provider_reference: `${activeNode}/v1/tracks/${item.id}/stream?app_name=ARAIT_MUSIC`,
          full_track_verified: true,
          genre: item.genre,
          attribution: 'Audius Open Protocol'
        };
      });
  } catch {
    return [];
  }
}

export async function searchAudiusArtists(query: string, limit: number = 10): Promise<Artist[]> {
  try {
    const raw = await fetchFromAudius(`/users/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!Array.isArray(raw)) return [];

    return raw.map((u: any): Artist => {
      const img = u.profile_picture
        ? u.profile_picture['1000x1000'] || u.profile_picture['480x480'] || u.profile_picture['150x150']
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

      return {
        id: `audius_artist_${u.id}`,
        name: u.name || u.handle,
        image_url: img,
        bio: u.bio || 'Audius Independent Musician & Creator',
        genres: [u.location || 'Independent Music'],
        followers_count: u.follower_count || 1200,
        popular_tracks: []
      };
    });
  } catch {
    return [];
  }
}
