import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Track, Playlist, Artist, SearchHistoryItem } from '../types/music';
import { useAuth } from './AuthContext';

interface LibraryContextType {
  likedSongs: Track[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => Promise<boolean>;
  playlists: Playlist[];
  createPlaylist: (title: string, description?: string, coverUrl?: string) => Promise<Playlist>;
  updatePlaylist: (id: string, updates: Partial<{ title: string; description: string; coverUrl: string; tracks: Track[] }>) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  followedArtists: Artist[];
  isFollowed: (artistId: string) => boolean;
  toggleFollowArtist: (artist: Artist) => Promise<boolean>;
  searchHistory: SearchHistoryItem[];
  addSearchQuery: (query: string, searchType?: 'song' | 'artist' | 'album' | 'general') => Promise<void>;
  removeSearchQuery: (id: string) => Promise<void>;
  clearAllSearchHistory: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const refreshLibrary = useCallback(async () => {
    if (!token) {
      setLikedSongs([]);
      setPlaylists([]);
      setFollowedArtists([]);
      setSearchHistory([]);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [likesRes, plRes, artistsRes, searchRes] = await Promise.all([
        fetch('/api/library/likes', { headers }),
        fetch('/api/library/playlists', { headers }),
        fetch('/api/library/artists', { headers }),
        fetch('/api/search/history', { headers })
      ]);

      if (likesRes.ok) {
        const d = await likesRes.json();
        setLikedSongs(d.likedSongs || []);
      }
      if (plRes.ok) {
        const d = await plRes.json();
        setPlaylists(d.playlists || []);
      }
      if (artistsRes.ok) {
        const d = await artistsRes.json();
        setFollowedArtists(d.artists || []);
      }
      if (searchRes.ok) {
        const d = await searchRes.json();
        setSearchHistory(d.history || []);
      }
    } catch (err) {
      console.warn('Failed to refresh library data:', err);
    }
  }, [token]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary, user?.id]);

  const isLiked = useCallback(
    (trackId: string) => {
      return likedSongs.some((t) => t.id === trackId);
    },
    [likedSongs]
  );

  const toggleLike = async (track: Track): Promise<boolean> => {
    if (!token) {
      throw new Error('Please sign in to save songs to your library.');
    }
    const currentlyLiked = isLiked(track.id);

    // Optimistic UI update
    if (currentlyLiked) {
      setLikedSongs((prev) => prev.filter((t) => t.id !== track.id));
    } else {
      setLikedSongs((prev) => [track, ...prev]);
    }

    try {
      const res = await fetch('/api/library/likes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ track })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLikedSongs(data.likedSongs);
      return data.isLiked;
    } catch (err) {
      // Revert optimistic update
      refreshLibrary();
      throw err;
    }
  };

  const createPlaylist = async (title: string, description: string = '', coverUrl?: string) => {
    if (!token) throw new Error('Please sign in to create playlists.');
    const res = await fetch('/api/library/playlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, coverUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPlaylists((prev) => [data.playlist, ...prev]);
    return data.playlist;
  };

  const updatePlaylist = async (id: string, updates: Partial<{ title: string; description: string; coverUrl: string; tracks: Track[] }>) => {
    if (!token) throw new Error('Not logged in');
    const res = await fetch(`/api/library/playlists/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPlaylists((prev) => prev.map((p) => (p.id === id ? data.playlist : p)));
    return data.playlist;
  };

  const deletePlaylist = async (id: string) => {
    if (!token) throw new Error('Not logged in');
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/library/playlists/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    if (!token) throw new Error('Please sign in to add songs.');
    const res = await fetch(`/api/library/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ track })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? data.playlist : p)));
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    if (!token) throw new Error('Not logged in');
    const res = await fetch(`/api/library/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? data.playlist : p)));
  };

  const isFollowed = useCallback(
    (artistId: string) => {
      return followedArtists.some((a) => a.id === artistId);
    },
    [followedArtists]
  );

  const toggleFollowArtist = async (artist: Artist): Promise<boolean> => {
    if (!token) throw new Error('Please sign in to follow artists.');
    const currentlyFollowed = isFollowed(artist.id);

    // Optimistic UI
    if (currentlyFollowed) {
      setFollowedArtists((prev) => prev.filter((a) => a.id !== artist.id));
    } else {
      setFollowedArtists((prev) => [{ ...artist, is_followed: true }, ...prev]);
    }

    try {
      const res = await fetch('/api/library/artists/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ artist })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFollowedArtists(data.followedArtists);
      return data.isFollowed;
    } catch (err) {
      refreshLibrary();
      throw err;
    }
  };

  // Persistent search history (last 15 unique searches)
  const addSearchQuery = async (query: string, searchType: 'song' | 'artist' | 'album' | 'general' = 'general') => {
    if (!query.trim() || !token) return;

    // Optimistic update
    const clean = query.trim();
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== clean.toLowerCase());
      const updated = [{ id: 'temp_' + Date.now(), query: clean, timestamp: Date.now(), search_type: searchType }, ...filtered];
      return updated.slice(0, 15);
    });

    try {
      const res = await fetch('/api/search/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: clean, searchType })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchHistory(data.history);
      }
    } catch (err) {
      console.warn('Failed to persist search history:', err);
    }
  };

  const removeSearchQuery = async (id: string) => {
    if (!token) return;
    setSearchHistory((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/search/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchHistory(data.history);
      }
    } catch (err) {
      console.warn('Failed to delete search item:', err);
    }
  };

  const clearAllSearchHistory = async () => {
    if (!token) return;
    setSearchHistory([]);
    try {
      await fetch('/api/search/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Failed to clear search history:', err);
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        likedSongs,
        isLiked,
        toggleLike,
        playlists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        followedArtists,
        isFollowed,
        toggleFollowArtist,
        searchHistory,
        addSearchQuery,
        removeSearchQuery,
        clearAllSearchHistory,
        refreshLibrary
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within a LibraryProvider');
  return context;
};
