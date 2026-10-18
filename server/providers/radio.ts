import type { Track } from '../../src/types/music';

const RADIO_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];

async function fetchRadio(endpoint: string): Promise<any[]> {
  for (const mirror of RADIO_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${mirror}/json${endpoint}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AraitMusic/1.0' }
      });
      clearTimeout(timeout);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      continue;
    }
  }
  return [];
}

export async function searchRadioStations(query: string, limit: number = 15): Promise<Track[]> {
  try {
    const raw = await fetchRadio(`/stations/search?name=${encodeURIComponent(query)}&limit=${limit}&hidebroken=true&order=votes&reverse=true`);
    return raw
      .filter((s) => s.url_resolved || s.url)
      .map((s): Track => {
        const logo = s.favicon && s.favicon.startsWith('http')
          ? s.favicon
          : 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80';

        return {
          id: `radio_${s.stationuuid}`,
          provider: 'radio',
          provider_track_id: s.stationuuid,
          title: s.name || 'Live Radio',
          artist: s.country ? `${s.country} • Live Broadcast` : 'Online Radio',
          album: s.tags ? s.tags.split(',').slice(0, 2).join(' / ') : 'Live Radio Station',
          artwork_url: logo,
          duration_ms: 0, // Continuous stream
          playback_type: 'radio_stream',
          playback_url_or_provider_reference: s.url_resolved || s.url,
          full_track_verified: true,
          genre: s.tags ? s.tags.split(',')[0] : 'Radio',
          language: s.language,
          attribution: 'Radio Browser Community'
        };
      });
  } catch (err) {
    console.error('Radio search error:', err);
    return [];
  }
}

export async function getTopRadioStationsByTag(tag: string, limit: number = 10): Promise<Track[]> {
  try {
    const raw = await fetchRadio(`/stations/bytag/${encodeURIComponent(tag)}?limit=${limit}&hidebroken=true&order=clickcount&reverse=true`);
    return raw
      .filter((s) => s.url_resolved || s.url)
      .map((s): Track => ({
        id: `radio_${s.stationuuid}`,
        provider: 'radio',
        provider_track_id: s.stationuuid,
        title: s.name,
        artist: 'Live Radio Stream',
        album: tag.toUpperCase() + ' Radio',
        artwork_url: s.favicon && s.favicon.startsWith('http') ? s.favicon : 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
        duration_ms: 0,
        playback_type: 'radio_stream',
        playback_url_or_provider_reference: s.url_resolved || s.url,
        full_track_verified: true,
        genre: tag,
        attribution: 'Radio Browser'
      }));
  } catch {
    return [];
  }
}
