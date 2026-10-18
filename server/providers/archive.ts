import type { Track } from '../../src/types/music';

export async function searchArchiveAudio(query: string, limit: number = 15): Promise<Track[]> {
  try {
    const q = `${query} AND mediatype:(audio)`;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}&fl[]=identifier,title,creator,description,year,mediatype&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    const docs = data?.response?.docs;
    if (!Array.isArray(docs)) return [];

    return docs.map((doc: any): Track => {
      const id = doc.identifier;
      const title = doc.title || query;
      const artist = doc.creator || 'Archive Collection';
      const audioUrl = `https://archive.org/download/${id}/${id}_vbr.mp3`;

      return {
        id: `archive_${id}`,
        provider: 'archive',
        provider_track_id: id,
        title: title,
        artist: artist,
        album: doc.year ? `Archive Classics (${doc.year})` : 'Public Audio Archive',
        artwork_url: `https://archive.org/services/img/${id}`,
        duration_ms: 240000,
        playback_type: 'authorized_full_track',
        playback_url_or_provider_reference: audioUrl,
        full_track_verified: true,
        genre: 'Classical / Heritage',
        release_date: doc.year,
        attribution: 'Internet Archive Public Audio'
      };
    });
  } catch (err) {
    console.error('Archive audio search error:', err);
    return [];
  }
}
