import type { Track, Artist, Album } from '../src/types/music';
import { isEligibleForFullPlayback } from '../src/types/music';
import { searchSaavnTracks } from './providers/saavn';
import { searchAudiusTracks, searchAudiusArtists } from './providers/audius';
import { searchJamendoTracks } from './providers/jamendo';

export interface UnifiedSearchResults {
  query: string;
  topResult: Track | Artist | null;
  songs: Track[];
  artists: Artist[];
  albums: Album[];
  radios: Track[];
  totalPlayableCount: number;
}

// Famous canonical artists directory with verified high-res imagery and genres
const FAMOUS_ARTISTS = [
  {
    name: 'Arijit Singh',
    keywords: ['arijit', 'arijit singh', 'arijith', 'arijeet'],
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=500&q=80',
    genres: ['Bollywood', 'Romantic', 'Acoustic'],
    bio: 'India’s most streamed playback singer, known for soul-stirring melodies and chart-topping romantic anthems.',
    monthly_listeners: 42500000
  },
  {
    name: 'Diljit Dosanjh',
    keywords: ['diljit', 'diljit dosanjh', 'dosanjh'],
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80',
    genres: ['Punjabi', 'Pop', 'Bhangra'],
    bio: 'Global Punjabi superstar, Coachella headliner, and iconic actor with record-breaking international hits.',
    monthly_listeners: 28900000
  },
  {
    name: 'Sidhu Moose Wala',
    keywords: ['sidhu', 'sidhu moose wala', 'moosewala', 'moose wala', 'sidhumoosewala'],
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=500&q=80',
    genres: ['Punjabi', 'Desi Hip Hop', 'Rap'],
    bio: 'Legendary Punjabi lyricist and hip hop icon whose revolutionary sound transformed modern music.',
    monthly_listeners: 31200000
  },
  {
    name: 'Karan Aujla',
    keywords: ['karan', 'karan aujla', 'aujla', 'geetan di machine'],
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
    genres: ['Punjabi', 'Hip Hop', 'Urban'],
    bio: 'Acclaimed singer-songwriter dubbed "Geetan Di Machine", celebrated for hard-hitting beats and lyricism.',
    monthly_listeners: 26400000
  },
  {
    name: 'Shreya Ghoshal',
    keywords: ['shreya', 'shreya ghoshal', 'ghoshal'],
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    genres: ['Bollywood', 'Melodic', 'Classical'],
    bio: 'Four-time National Award-winning playback legend with one of the most expressive voices in world cinema.',
    monthly_listeners: 34100000
  },
  {
    name: 'Atif Aslam',
    keywords: ['atif', 'atif aslam', 'aslam'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    genres: ['Sufi Rock', 'Bollywood', 'Pop'],
    bio: 'Beloved South Asian rock and playback singer recognized for soaring vocals and timeless ballads.',
    monthly_listeners: 22000000
  },
  {
    name: 'Yo Yo Honey Singh',
    keywords: ['honey', 'honey singh', 'yo yo', 'yoyo honey singh'],
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
    genres: ['Desi Hip Hop', 'Party', 'Pop'],
    bio: 'Pioneering music producer and rapper who revolutionized the Indian hip-hop and commercial pop wave.',
    monthly_listeners: 19500000
  },
  {
    name: 'Badshah',
    keywords: ['badshah', 'aditya prateek singh'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    genres: ['Desi Hip Hop', 'Club', 'Pop'],
    bio: 'Multi-platinum Indian rapper and producer delivering record-setting chart-busters worldwide.',
    monthly_listeners: 24700000
  },
  {
    name: 'AP Dhillon',
    keywords: ['ap', 'ap dhillon', 'dhillon', 'brown munde'],
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
    genres: ['Punjabi Pop', 'Synthwave', 'Indo-Western'],
    bio: 'Indo-Canadian sensation blending classic Punjabi poetry with sleek 80s synth and contemporary trap.',
    monthly_listeners: 18200000
  },
  {
    name: 'Shubh',
    keywords: ['shubh', 'shubhneet', 'baller', 'cheques'],
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80',
    genres: ['Punjabi Drill', 'Hip Hop', 'Trap'],
    bio: 'Breakout international drill and trap star celebrated for infectious melodic flows and viral hits.',
    monthly_listeners: 16800000
  },
  {
    name: 'Taylor Swift',
    keywords: ['taylor', 'taylor swift', 'swift', 'swiftie'],
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
    genres: ['Pop', 'Synth-Pop', 'Country'],
    bio: 'Global pop powerhouse and historic 14-time Grammy winner with unparalleled cultural influence.',
    monthly_listeners: 105000000
  },
  {
    name: 'Ed Sheeran',
    keywords: ['ed', 'ed sheeran', 'sheeran'],
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80',
    genres: ['Pop', 'Acoustic', 'Folk Pop'],
    bio: 'Grammy-winning British songwriter whose acoustic storytelling and stadium anthems dominate global charts.',
    monthly_listeners: 78000000
  },
  {
    name: 'The Weeknd',
    keywords: ['weeknd', 'the weeknd', 'abel', 'starboy'],
    image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=500&q=80',
    genres: ['R&B', 'Synth-Pop', 'Alternative'],
    bio: 'Multi-Grammy winning visionist renowned for cinematic storytelling and genre-defining pop.',
    monthly_listeners: 110000000
  }
];

export async function unifiedSearch(
  query: string,
  includePreviews: boolean = false
): Promise<UnifiedSearchResults> {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return {
      query: '',
      topResult: null,
      songs: [],
      artists: [],
      albums: [],
      radios: [],
      totalPlayableCount: 0
    };
  }

  // Check if query matches a famous artist
  const matchedFamousArtist = FAMOUS_ARTISTS.find(
    (fa) =>
      fa.keywords.some((k) => clean.includes(k) || k.includes(clean)) ||
      fa.name.toLowerCase().includes(clean)
  );

  // If matched famous artist, query their name specifically to guarantee original songs
  const searchQuery = matchedFamousArtist ? matchedFamousArtist.name : clean;

  // Concurrently query catalog sources
  const [saavnResults, audiusResults, jamendoResults] = await Promise.allSettled([
    searchSaavnTracks(searchQuery, 30),
    searchAudiusTracks(clean, 10),
    searchJamendoTracks(clean, 8)
  ]);

  const rawTracks: Track[] = [
    ...(saavnResults.status === 'fulfilled' ? saavnResults.value : []),
    ...(audiusResults.status === 'fulfilled' ? audiusResults.value : []),
    ...(jamendoResults.status === 'fulfilled' ? jamendoResults.value : [])
  ];

  // Filter according to full playback eligibility and deduplicate similar titles
  const eligibleTracks: Track[] = [];
  const seenTitles = new Set<string>();

  for (const track of rawTracks) {
    if (!isEligibleForFullPlayback(track, includePreviews)) {
      continue;
    }

    const cleanTitle = track.title
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (!cleanTitle || seenTitles.has(cleanTitle)) {
      continue;
    }
    seenTitles.add(cleanTitle);
    eligibleTracks.push(track);
  }

  // Derive artists list
  const artists: Artist[] = [];

  if (matchedFamousArtist) {
    artists.push({
      id: `art_${encodeURIComponent(matchedFamousArtist.name.toLowerCase())}`,
      name: matchedFamousArtist.name,
      image_url: matchedFamousArtist.image,
      genres: matchedFamousArtist.genres,
      bio: matchedFamousArtist.bio,
      monthly_listeners: matchedFamousArtist.monthly_listeners,
      popular_tracks: eligibleTracks.slice(0, 5)
    });
  }

  // Extract artists from tracks
  const seenArtistNames = new Set<string>(artists.map((a) => a.name.toLowerCase()));
  for (const track of eligibleTracks) {
    const primaryName = track.artist.split(',')[0].split('·')[0].trim();
    if (primaryName && !seenArtistNames.has(primaryName.toLowerCase())) {
      seenArtistNames.add(primaryName.toLowerCase());
      artists.push({
        id: `art_${encodeURIComponent(primaryName.toLowerCase())}`,
        name: primaryName,
        image_url: track.artwork_url,
        genres: [track.genre || 'Music'],
        popular_tracks: [track]
      });
    }
    if (artists.length >= 8) break;
  }

  // Virtual Albums
  const albumsMap = new Map<string, Album>();
  for (const track of eligibleTracks) {
    if (track.album && track.album !== 'Single') {
      const albumKey = `${track.album.toLowerCase()}_${track.artist.toLowerCase()}`;
      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          id: `alb_${albumKey}`,
          title: track.album,
          artist: track.artist,
          artwork_url: track.artwork_url,
          tracks: [track]
        });
      } else {
        albumsMap.get(albumKey)!.tracks.push(track);
      }
    }
  }

  // Determine top result
  let topResult: Track | Artist | null = null;
  if (matchedFamousArtist && artists.length > 0) {
    topResult = artists[0];
  } else if (eligibleTracks.length > 0) {
    topResult = eligibleTracks[0];
  }

  return {
    query: clean,
    topResult,
    songs: eligibleTracks,
    artists,
    albums: Array.from(albumsMap.values()).slice(0, 8),
    radios: [],
    totalPlayableCount: eligibleTracks.length
  };
}
