export type PlaybackType =
  | 'authorized_full_track'
  | 'authorized_preview'
  | 'embedded_provider_playback'
  | 'radio_stream'
  | 'metadata_only'
  | 'unavailable';

export type MusicProvider =
  | 'audius'
  | 'jamendo'
  | 'radio'
  | 'archive'
  | 'itunes'
  | 'youtube'
  | 'arait'
  | 'wikimedia'
  | 'spotify'
  | 'applemusic';

export interface Track {
  id: string;
  provider: MusicProvider;
  provider_track_id: string;
  title: string;
  artist: string;
  artist_id?: string;
  album?: string;
  artwork_url: string;
  duration_ms: number;
  playback_type: PlaybackType;
  playback_url_or_provider_reference: string;
  full_track_verified: boolean;
  genre?: string;
  language?: string;
  release_date?: string;
  has_lyrics?: boolean;
  attribution?: string;
  isrc?: string;
}

export interface Artist {
  id: string;
  name: string;
  image_url: string;
  banner_url?: string;
  bio?: string;
  genres: string[];
  languages?: string[];
  followers_count?: number;
  monthly_listeners?: number;
  is_followed?: boolean;
  popular_tracks: Track[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  release_date?: string;
  genre?: string;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  user_id: string;
  user_name: string;
  is_public: boolean;
  is_collaborative?: boolean;
  created_at: string;
  updated_at?: string;
  tracks: Track[];
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  preferred_languages: string[];
  personalization_enabled: boolean;
  include_previews: boolean;
  created_at: string;
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  track_id: string;
  title: string;
  artist: string;
  plain_lyrics?: string;
  synced_lyrics?: LyricLine[];
  language?: string;
  source: 'lrclib' | 'youtube_video' | 'none';
  youtube_fallback?: {
    video_id: string;
    title: string;
    channel_title: string;
    thumbnail: string;
  };
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  search_type?: 'song' | 'artist' | 'album' | 'general';
}

export type ProviderStatusType =
  | 'CONFIGURED'
  | 'CONNECTED_NO_KEY'
  | 'CONNECTED_WITH_KEY'
  | 'NEEDS_USER_AUTHORIZATION'
  | 'NEEDS_MANUAL_REGISTRATION'
  | 'NEEDS_API_KEY'
  | 'METADATA_ONLY'
  | 'PREVIEW_ONLY'
  | 'FULL_PLAYBACK_AVAILABLE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'NOT_SUPPORTED';

export interface ProviderInfo {
  id: string;
  name: string;
  category: 'STREAMING' | 'METADATA' | 'LYRICS_RADIO';
  status: ProviderStatusType;
  endpoint: string;
  auth_requirement: string;
  playback_capability: 'FULL_AUDIO' | 'PREVIEW_ONLY' | 'EMBEDDED' | 'RADIO' | 'METADATA';
  rate_limit: string;
  last_test: {
    tested_at: string;
    success: boolean;
    message: string;
    latency_ms: number;
  };
  notes: string;
}

/**
 * Shared, centralized track-eligibility function.
 * Ensures preview-only tracks are excluded from main playable feeds
 * unless explicitly allowed by user settings.
 */
export function isEligibleForFullPlayback(track: Track, includePreviews: boolean = false): boolean {
  if (!track || !track.playback_url_or_provider_reference) return false;

  // If previews are explicitly allowed by user toggle
  if (includePreviews) {
    return track.playback_type !== 'metadata_only' && track.playback_type !== 'unavailable';
  }

  // Strictly full songs only:
  // Must be authorized full track, radio stream, or authorized embedded provider player
  if (
    track.playback_type === 'authorized_full_track' ||
    track.playback_type === 'radio_stream' ||
    track.playback_type === 'embedded_provider_playback'
  ) {
    // If it's not radio and duration is suspiciously short (<= 35s), reject it as preview
    if (track.playback_type !== 'radio_stream' && track.duration_ms > 0 && track.duration_ms <= 35000) {
      return false;
    }
    return true;
  }

  return false;
}
