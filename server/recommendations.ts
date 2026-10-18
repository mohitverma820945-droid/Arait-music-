import type { Track, Artist } from '../src/types/music';
import { db } from './db';
import { searchSaavnTracks } from './providers/saavn';
import { getAudiusTrending } from './providers/audius';
import { getJamendoPopular } from './providers/jamendo';
import { isEligibleForFullPlayback } from '../src/types/music';

export interface PersonalizedHomeFeed {
  greeting: string;
  madeForYou: Track[];
  becauseYouSearched: {
    query: string;
    tracks: Track[];
  } | null;
  favoriteArtistsTracks: {
    artistName: string;
    tracks: Track[];
  } | null;
  languageMixes: Array<{
    language: string;
    tracks: Track[];
  }>;
  recentlyPlayed: Track[];
  discoverNew: Track[];
  artistsForYou: Artist[];
  liveRadios: Track[];
}

export async function generatePersonalizedFeed(
  userId?: string,
  includePreviews: boolean = false
): Promise<PersonalizedHomeFeed> {
  // Use IST timezone (UTC+5:30) for greeting
  const hour = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})).getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  // Add dynamic salt to search queries for fresher, randomized results on refresh
  const salt = Math.floor(Math.random() * 1000);
  
  // Fetch diverse popular Hindi, Punjabi, and Bollywood pools concurrently
  const [hindiHits, punjabiHits, bollywoodHits, partyHits, acousticHits, audiusTrending] = await Promise.all([
    searchSaavnTracks(`Arijit Singh Shreya Ghoshal Atif Aslam ${salt}`, 20).catch(() => []),
    searchSaavnTracks(`Sidhu Moose Wala Karan Aujla Diljit Dosanjh AP Dhillon ${salt}`, 20).catch(() => []),
    searchSaavnTracks(`Bollywood new releases ${salt}`, 20).catch(() => []),
    searchSaavnTracks(`Yo Yo Honey Singh Badshah ${salt}`, 20).catch(() => []),
    searchSaavnTracks(`Romantic love songs acoustic hindi ${salt}`, 20).catch(() => []),
    getAudiusTrending(20).catch(() => [])
  ]);

  const hidden = userId ? new Set(db.getHiddenTrackIds(userId)) : new Set<string>();
  const globalUsedIds = new Set<string>();

  // Helper to filter and deduplicate
  const getUniqueTracks = (sourceList: Track[], count: number): Track[] => {
    const result: Track[] = [];
    for (const t of sourceList) {
      if (!isEligibleForFullPlayback(t, includePreviews)) continue;
      if (hidden.has(t.id)) continue;
      if (!globalUsedIds.has(t.id)) {
        globalUsedIds.add(t.id);
        result.push(t);
        if (result.length >= count) break;
      }
    }
    return result;
  };

  // User signals
  const liked = userId ? db.getLikedSongs(userId) : [];
  const recent = userId ? db.getRecentTracks(userId, 15) : [];
  const searches = userId ? db.getSearchHistory(userId) : [];
  const followed = userId ? db.getFollowedArtists(userId) : [];

  // Top curated artists
  const defaultArtists: Artist[] = [
    {
      id: 'art_sidhu',
      name: 'Sidhu Moose Wala',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Sidhu_Moose_Wala.jpg',
      genres: ['Punjabi', 'Hip-Hop', 'Desi Rap'],
      followers_count: 28500000,
      popular_tracks: []
    },
    {
      id: 'art_arijit',
      name: 'Arijit Singh',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Arijit_Singh_%28cropped%29.jpg',
      genres: ['Bollywood', 'Romantic', 'Soul'],
      followers_count: 36000000,
      popular_tracks: []
    },
    {
      id: 'art_karan',
      name: 'Karan Aujla',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Karan_Aujla_in_studio.jpg',
      genres: ['Punjabi Pop', 'Urban Punjabi'],
      followers_count: 17200000,
      popular_tracks: []
    },
    {
      id: 'art_diljit',
      name: 'Diljit Dosanjh',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Diljit_Dosanjh_at_the_IIFA_2017_Green_Carpet.jpg',
      genres: ['Bhangra', 'Punjabi Pop', 'Global Desi'],
      followers_count: 21000000,
      popular_tracks: []
    },
    {
      id: 'art_shreya',
      name: 'Shreya Ghoshal',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Shreya_Ghoshal.jpg',
      genres: ['Playback', 'Melody', 'Classical'],
      followers_count: 24500000,
      popular_tracks: []
    },
    {
      id: 'art_atif',
      name: 'Atif Aslam',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Atif_Aslam_2021_%281%29.png',
      genres: ['Pop Rock', 'Sufi', 'Romantic'],
      followers_count: 22000000,
      popular_tracks: []
    }
  ];

  // 1. "Because You Searched For" section
  let becauseYouSearched: { query: string; tracks: Track[] } | null = null;
  if (searches.length > 0) {
    const latestQuery = searches[0].query;
    try {
      const related = await searchSaavnTracks(latestQuery, 12);
      const uniqueRelated = getUniqueTracks(related, 8);
      if (uniqueRelated.length > 0) {
        becauseYouSearched = {
          query: latestQuery,
          tracks: uniqueRelated
        };
      }
    } catch {
      // ignore
    }
  }

  // 2. Favorite Artist Tracks
  let favoriteArtistsTracks: { artistName: string; tracks: Track[] } | null = null;
  if (userId) {
    const artistCounts: Record<string, number> = {};
    for (const t of [...liked, ...recent]) {
      artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    }
    const topArtistName = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    if (topArtistName) {
      try {
        const artistTracks = await searchSaavnTracks(topArtistName, 12);
        const uniqueArtistTracks = getUniqueTracks(artistTracks, 8);
        if (uniqueArtistTracks.length > 0) {
          favoriteArtistsTracks = {
            artistName: topArtistName,
            tracks: uniqueArtistTracks
          };
        }
      } catch {
        // ignore
      }
    }
  }

  // Populate distinct sections with strict deduplication
  const madeForYou = getUniqueTracks([...liked, ...recent, ...hindiHits, ...punjabiHits], 10);
  const hindiMixTracks = getUniqueTracks(hindiHits, 6);
  const punjabiMixTracks = getUniqueTracks(punjabiHits, 6);
  const discoverTracks = getUniqueTracks([...bollywoodHits, ...partyHits, ...audiusTrending], 8);

  return {
    greeting,
    madeForYou,
    becauseYouSearched,
    favoriteArtistsTracks,
    languageMixes: [
      { language: 'Hindi & Bollywood Hits', tracks: hindiMixTracks },
      { language: 'Punjabi & Desi Bangers', tracks: punjabiMixTracks }
    ],
    recentlyPlayed: recent.slice(0, 8),
    discoverNew: discoverTracks,
    artistsForYou: [...followed, ...defaultArtists].slice(0, 8),
    liveRadios: []
  };
}
