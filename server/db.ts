import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Track, Playlist, UserProfile, SearchHistoryItem, Artist } from '../src/types/music';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'arait_music_db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  displayName: string;
  avatarUrl?: string;
  preferredLanguages: string[];
  personalizationEnabled: boolean;
  includePreviews: boolean;
  createdAt: string;
}

interface StoredListeningRecord {
  userId: string;
  track: Track;
  playedAt: number;
  durationMs: number;
  completed: boolean;
}

interface StoredDatabase {
  users: Record<string, StoredUser>;
  sessions: Record<string, string>; // token -> userId
  likedSongs: Record<string, Track[]>; // userId -> Track[]
  playlists: Record<string, Playlist[]>; // userId -> Playlist[]
  followedArtists: Record<string, Artist[]>; // userId -> Artist[]
  listeningHistory: Record<string, StoredListeningRecord[]>; // userId -> records
  searchHistory: Record<string, SearchHistoryItem[]>; // userId -> SearchHistoryItem[] (max 15 unique)
  hiddenTrackIds: Record<string, string[]>; // userId -> trackId[]
}

const defaultDB: StoredDatabase = {
  users: {},
  sessions: {},
  likedSongs: {},
  playlists: {},
  followedArtists: {},
  listeningHistory: {},
  searchHistory: {},
  hiddenTrackIds: {}
};

function readDB(): StoredDatabase {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(defaultDB);
      return defaultDB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read database, resetting default:', err);
    return defaultDB;
  }
}

function writeDB(data: StoredDatabase): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database:', err);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export const db = {
  // --- AUTHENTICATION & USERS ---
  register(email: string, password: string, displayName: string): { user: UserProfile; token: string } {
    const database = readDB();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = Object.values(database.users).find((u) => u.email === normalizedEmail);
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = 'usr_' + crypto.randomUUID();

    const newUser: StoredUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      salt,
      displayName: displayName.trim() || normalizedEmail.split('@')[0],
      preferredLanguages: ['Hindi', 'Punjabi', 'English'],
      personalizationEnabled: true,
      includePreviews: false,
      createdAt: new Date().toISOString()
    };

    database.users[userId] = newUser;
    database.likedSongs[userId] = [];
    database.playlists[userId] = [];
    database.followedArtists[userId] = [];
    database.listeningHistory[userId] = [];
    database.searchHistory[userId] = [];
    database.hiddenTrackIds[userId] = [];

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    database.sessions[token] = userId;

    writeDB(database);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        display_name: newUser.displayName,
        avatar_url: newUser.avatarUrl,
        preferred_languages: newUser.preferredLanguages,
        personalization_enabled: newUser.personalizationEnabled,
        include_previews: newUser.includePreviews,
        created_at: newUser.createdAt
      },
      token
    };
  },

  login(email: string, password: string): { user: UserProfile; token: string } {
    const database = readDB();
    const normalizedEmail = email.trim().toLowerCase();
    const user = Object.values(database.users).find((u) => u.email === normalizedEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const checkHash = hashPassword(password, user.salt);
    if (checkHash !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    database.sessions[token] = user.id;
    writeDB(database);

    return {
      user: {
        id: user.id,
        email: user.email,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        preferred_languages: user.preferredLanguages || ['Hindi', 'Punjabi', 'English'],
        personalization_enabled: user.personalizationEnabled ?? true,
        include_previews: user.includePreviews ?? false,
        created_at: user.createdAt
      },
      token
    };
  },

  getUserByToken(token: string): UserProfile | null {
    if (!token) return null;
    const database = readDB();
    const userId = database.sessions[token];
    if (!userId) return null;
    const user = database.users[userId];
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      preferred_languages: user.preferredLanguages || ['Hindi', 'Punjabi', 'English'],
      personalization_enabled: user.personalizationEnabled ?? true,
      include_previews: user.includePreviews ?? false,
      created_at: user.createdAt
    };
  },

  logout(token: string): void {
    const database = readDB();
    if (database.sessions[token]) {
      delete database.sessions[token];
      writeDB(database);
    }
  },

  updateProfile(userId: string, updates: Partial<{ displayName: string; preferredLanguages: string[]; personalizationEnabled: boolean; includePreviews: boolean }>): UserProfile {
    const database = readDB();
    const user = database.users[userId];
    if (!user) throw new Error('User not found.');

    if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
    if (updates.preferredLanguages !== undefined) user.preferredLanguages = updates.preferredLanguages;
    if (updates.personalizationEnabled !== undefined) user.personalizationEnabled = updates.personalizationEnabled;
    if (updates.includePreviews !== undefined) user.includePreviews = updates.includePreviews;

    writeDB(database);

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      preferred_languages: user.preferredLanguages,
      personalization_enabled: user.personalizationEnabled,
      include_previews: user.includePreviews,
      created_at: user.createdAt
    };
  },

  updateAvatar(userId: string, avatarDataUrl: string): UserProfile {
    const database = readDB();
    const user = database.users[userId];
    if (!user) throw new Error('User not found.');

    user.avatarUrl = avatarDataUrl;
    writeDB(database);

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      preferred_languages: user.preferredLanguages,
      personalization_enabled: user.personalizationEnabled,
      include_previews: user.includePreviews,
      created_at: user.createdAt
    };
  },

  removeAvatar(userId: string): UserProfile {
    const database = readDB();
    const user = database.users[userId];
    if (!user) throw new Error('User not found.');

    delete user.avatarUrl;
    writeDB(database);

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      preferred_languages: user.preferredLanguages,
      personalization_enabled: user.personalizationEnabled,
      include_previews: user.includePreviews,
      created_at: user.createdAt
    };
  },

  deleteAccount(userId: string): void {
    const database = readDB();
    delete database.users[userId];
    delete database.likedSongs[userId];
    delete database.playlists[userId];
    delete database.followedArtists[userId];
    delete database.listeningHistory[userId];
    delete database.searchHistory[userId];
    delete database.hiddenTrackIds[userId];

    // Remove any active sessions for this user
    for (const [token, uid] of Object.entries(database.sessions)) {
      if (uid === userId) delete database.sessions[token];
    }
    writeDB(database);
  },

  // --- LIKED SONGS ---
  getLikedSongs(userId: string): Track[] {
    const database = readDB();
    return database.likedSongs[userId] || [];
  },

  toggleLikeSong(userId: string, track: Track): { isLiked: boolean; likedSongs: Track[] } {
    const database = readDB();
    if (!database.likedSongs[userId]) database.likedSongs[userId] = [];
    const list = database.likedSongs[userId];
    const index = list.findIndex((t) => t.id === track.id || (t.title.toLowerCase() === track.title.toLowerCase() && t.artist.toLowerCase() === track.artist.toLowerCase()));

    let isLiked = false;
    if (index >= 0) {
      list.splice(index, 1);
      isLiked = false;
    } else {
      list.unshift(track);
      isLiked = true;
    }

    writeDB(database);
    return { isLiked, likedSongs: list };
  },

  // --- PLAYLISTS ---
  getPlaylists(userId: string): Playlist[] {
    const database = readDB();
    return database.playlists[userId] || [];
  },

  createPlaylist(userId: string, title: string, description: string = '', coverUrl?: string): Playlist {
    const database = readDB();
    if (!database.playlists[userId]) database.playlists[userId] = [];
    const user = database.users[userId];

    const newPlaylist: Playlist = {
      id: 'pl_' + crypto.randomUUID(),
      title: title.trim() || 'My Playlist',
      description: description.trim(),
      cover_url: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      user_id: userId,
      user_name: user?.displayName || 'Arait Listener',
      is_public: true,
      created_at: new Date().toISOString(),
      tracks: []
    };

    database.playlists[userId].unshift(newPlaylist);
    writeDB(database);
    return newPlaylist;
  },

  updatePlaylist(userId: string, playlistId: string, updates: Partial<{ title: string; description: string; coverUrl: string; tracks: Track[] }>): Playlist {
    const database = readDB();
    const list = database.playlists[userId] || [];
    const pl = list.find((p) => p.id === playlistId);
    if (!pl) throw new Error('Playlist not found or access denied.');

    if (updates.title !== undefined) pl.title = updates.title.trim();
    if (updates.description !== undefined) pl.description = updates.description.trim();
    if (updates.coverUrl !== undefined) pl.cover_url = updates.coverUrl;
    if (updates.tracks !== undefined) pl.tracks = updates.tracks;
    pl.updated_at = new Date().toISOString();

    writeDB(database);
    return pl;
  },

  addTrackToPlaylist(userId: string, playlistId: string, track: Track): Playlist {
    const database = readDB();
    const list = database.playlists[userId] || [];
    const pl = list.find((p) => p.id === playlistId);
    if (!pl) throw new Error('Playlist not found.');

    const alreadyAdded = pl.tracks.some((t) => t.id === track.id);
    if (!alreadyAdded) {
      pl.tracks.push(track);
      pl.updated_at = new Date().toISOString();
      writeDB(database);
    }
    return pl;
  },

  removeTrackFromPlaylist(userId: string, playlistId: string, trackId: string): Playlist {
    const database = readDB();
    const list = database.playlists[userId] || [];
    const pl = list.find((p) => p.id === playlistId);
    if (!pl) throw new Error('Playlist not found.');

    pl.tracks = pl.tracks.filter((t) => t.id !== trackId);
    pl.updated_at = new Date().toISOString();
    writeDB(database);
    return pl;
  },

  deletePlaylist(userId: string, playlistId: string): void {
    const database = readDB();
    if (!database.playlists[userId]) return;
    database.playlists[userId] = database.playlists[userId].filter((p) => p.id !== playlistId);
    writeDB(database);
  },

  // --- FOLLOWED ARTISTS ---
  getFollowedArtists(userId: string): Artist[] {
    const database = readDB();
    return database.followedArtists[userId] || [];
  },

  toggleFollowArtist(userId: string, artist: Artist): { isFollowed: boolean; followedArtists: Artist[] } {
    const database = readDB();
    if (!database.followedArtists[userId]) database.followedArtists[userId] = [];
    const list = database.followedArtists[userId];
    const index = list.findIndex((a) => a.id === artist.id || a.name.toLowerCase() === artist.name.toLowerCase());

    let isFollowed = false;
    if (index >= 0) {
      list.splice(index, 1);
      isFollowed = false;
    } else {
      list.unshift({ ...artist, is_followed: true });
      isFollowed = true;
    }

    writeDB(database);
    return { isFollowed, followedArtists: list };
  },

  // --- LAST 15 SEARCHES HISTORY ---
  getSearchHistory(userId: string): SearchHistoryItem[] {
    const database = readDB();
    return database.searchHistory[userId] || [];
  },

  addSearchHistory(userId: string, query: string, searchType: 'song' | 'artist' | 'album' | 'general' = 'general'): SearchHistoryItem[] {
    const cleanQuery = query.trim();
    if (!cleanQuery) return this.getSearchHistory(userId);

    const database = readDB();
    if (!database.searchHistory[userId]) database.searchHistory[userId] = [];
    const list = database.searchHistory[userId];

    // Find if duplicate exists (case-insensitive & whitespace trimmed)
    const existingIndex = list.findIndex(
      (item) => item.query.trim().toLowerCase() === cleanQuery.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Remove existing from current index
      list.splice(existingIndex, 1);
    }

    // Insert newest at top
    list.unshift({
      id: 'sh_' + crypto.randomUUID(),
      query: cleanQuery,
      timestamp: Date.now(),
      search_type: searchType
    });

    // Enforce max 15 unique searches rule: evict oldest
    if (list.length > 15) {
      list.splice(15);
    }

    writeDB(database);
    return list;
  },

  removeSearchHistoryItem(userId: string, itemId: string): SearchHistoryItem[] {
    const database = readDB();
    if (!database.searchHistory[userId]) return [];
    database.searchHistory[userId] = database.searchHistory[userId].filter((item) => item.id !== itemId);
    writeDB(database);
    return database.searchHistory[userId];
  },

  clearSearchHistory(userId: string): void {
    const database = readDB();
    database.searchHistory[userId] = [];
    writeDB(database);
  },

  // --- LISTENING HISTORY & RECOMMENDATION SIGNALS ---
  recordListening(userId: string, track: Track, durationMs: number = 0, completed: boolean = false): void {
    const database = readDB();
    if (!database.listeningHistory[userId]) database.listeningHistory[userId] = [];
    const history = database.listeningHistory[userId];

    history.unshift({
      userId,
      track,
      playedAt: Date.now(),
      durationMs,
      completed
    });

    // Keep recent 200 records
    if (history.length > 200) {
      history.splice(200);
    }

    writeDB(database);
  },

  getRecentTracks(userId: string, limit: number = 20): Track[] {
    const database = readDB();
    const records = database.listeningHistory[userId] || [];
    const seen = new Set<string>();
    const tracks: Track[] = [];

    for (const rec of records) {
      if (!seen.has(rec.track.id)) {
        seen.add(rec.track.id);
        tracks.push(rec.track);
        if (tracks.length >= limit) break;
      }
    }
    return tracks;
  },

  hideTrack(userId: string, trackId: string): void {
    const database = readDB();
    if (!database.hiddenTrackIds[userId]) database.hiddenTrackIds[userId] = [];
    if (!database.hiddenTrackIds[userId].includes(trackId)) {
      database.hiddenTrackIds[userId].push(trackId);
      writeDB(database);
    }
  },

  getHiddenTrackIds(userId: string): string[] {
    const database = readDB();
    return database.hiddenTrackIds[userId] || [];
  },

  resetPersonalization(userId: string): void {
    const database = readDB();
    database.listeningHistory[userId] = [];
    database.hiddenTrackIds[userId] = [];
    writeDB(database);
  }
};
