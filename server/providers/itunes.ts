import type { Track, Artist } from '../../src/types/music';

export async function searchITunesTracks(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any): Track => {
      // High-resolution artwork
      const art = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';

      return {
        id: `itunes_${item.trackId}`,
        provider: 'itunes',
        provider_track_id: String(item.trackId),
        title: item.trackName || 'Unknown Title',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || 'Single',
        artwork_url: art,
        // Preview clip duration is accurately recorded as 30s preview
        duration_ms: 30000,
        playback_type: 'authorized_preview',
        playback_url_or_provider_reference: item.previewUrl || '',
        full_track_verified: false,
        genre: item.primaryGenreName,
        release_date: item.releaseDate ? item.releaseDate.substring(0, 10) : undefined,
        attribution: 'iTunes Search Catalog Preview'
      };
    });
  } catch (err) {
    console.error('iTunes search error:', err);
    return [];
  }
}
