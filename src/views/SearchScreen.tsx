import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  History,
  Trash2,
  Play,
  Heart,
  Users,
  Music,
  AlertCircle,
  Loader2,
  ArrowDownToLine,
  CheckCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import type { Track, Artist, Album } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';

interface SearchScreenProps {
  onSelectArtist: (artist: Artist) => void;
}

// Quick-pick famous artists & hit songs for instant 1-tap search
const FAMOUS_QUICK_PICKS = [
  { label: 'Arijit Singh', type: 'artist' },
  { label: 'Diljit Dosanjh', type: 'artist' },
  { label: 'Sidhu Moose Wala', type: 'artist' },
  { label: 'Karan Aujla', type: 'artist' },
  { label: 'Shreya Ghoshal', type: 'artist' },
  { label: 'Taylor Swift', type: 'artist' },
  { label: 'Yo Yo Honey Singh', type: 'artist' },
  { label: 'Badshah', type: 'artist' },
  { label: 'AP Dhillon', type: 'artist' },
  { label: 'Atif Aslam', type: 'artist' },
  { label: 'Shubh', type: 'artist' },
  { label: 'Kesariya', type: 'song' },
  { label: 'Tum Hi Ho', type: 'song' },
  { label: 'Brown Munde', type: 'song' },
  { label: '295', type: 'song' },
  { label: 'Chaleya', type: 'song' },
  { label: 'Apna Bana Le', type: 'song' },
  { label: 'Softly', type: 'song' }
];

export const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectArtist }) => {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    downloadTrack,
    isDownloaded,
    downloadingTrackIds
  } = usePlayer();

  const { isLiked, toggleLike, searchHistory, addSearchQuery, removeSearchQuery, clearAllSearchHistory } =
    useLibrary();
  const { user } = useAuth();

  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');

  const [results, setResults] = useState<{
    topResult: Track | Artist | null;
    songs: Track[];
    artists: Artist[];
    albums: Album[];
    totalPlayableCount: number;
  }>({
    topResult: null,
    songs: [],
    artists: [],
    albums: [],
    totalPlayableCount: 0
  });

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Fast 120ms debounce for near-instant search response
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 120);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search
  useEffect(() => {
    if (!debouncedQuery) {
      setResults({
        topResult: null,
        songs: [],
        artists: [],
        albums: [],
        totalPlayableCount: 0
      });
      return;
    }

    let isCancelled = false;
    async function executeSearch() {
      setIsLoading(true);
      try {
        const includePreviews = user?.include_previews ?? false;
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&includePreviews=${includePreviews}`
        );
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setResults(data);

          if (user) {
            addSearchQuery(debouncedQuery);
          }
        }
      } catch (err) {
        console.warn('Search query note:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    executeSearch();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, user?.id, user?.include_previews]);

  const handleSelectQuickPick = (text: string) => {
    setQuery(text);
    setIsFocused(false);
  };

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '';
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.src.includes('500x500')) {
      img.src = img.src.replace('500x500', '150x150');
    } else if (!img.src.includes('unsplash')) {
      img.src =
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
    }
  };

  // Live matching suggestions based on typed query
  const matchingSuggestions = query.trim()
    ? FAMOUS_QUICK_PICKS.filter((item) =>
        item.label.toLowerCase().includes(query.trim().toLowerCase())
      ).slice(0, 5)
    : [];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-32">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 border border-white/10 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-xl transition-all">
          <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search any song, singer, Hindi, Punjabi, Bollywood, or English..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
              }}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Instant Suggestions Dropdown */}
        {isFocused && query && matchingSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-40 mt-2 p-2 rounded-2xl bg-[#12131a] border border-white/10 shadow-2xl space-y-1">
            {matchingSuggestions.map((s) => (
              <div
                key={s.label}
                onMouseDown={() => handleSelectQuickPick(s.label)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors cursor-pointer text-xs sm:text-sm text-zinc-200"
              >
                <div className="flex items-center gap-2.5">
                  {s.type === 'artist' ? (
                    <Users className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Music className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-semibold">{s.label}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                  {s.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Persistent Recent Searches Display */}
        {isFocused && !query && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-2 p-4 rounded-2xl bg-[#12131a] border border-white/10 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                Recent Searches
              </span>

              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Clear all?</span>
                  <button
                    onClick={() => {
                      clearAllSearchHistory();
                      setShowClearConfirm(false);
                    }}
                    className="text-[11px] font-bold text-red-400 hover:underline cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {searchHistory.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div
                    onClick={() => handleSelectQuickPick(item.query)}
                    className="flex items-center gap-2.5 min-w-0 flex-1"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs sm:text-sm text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
                      {item.query}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSearchQuery(item.id);
                    }}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick-Pick Popular Artists & Songs */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Popular Searches
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FAMOUS_QUICK_PICKS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSelectQuickPick(item.label)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-emerald-500/15 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/30 text-zinc-300 transition-all whitespace-nowrap cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      {debouncedQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Results Display */}
      {debouncedQuery && !isLoading && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {results.totalPlayableCount === 0 && results.artists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 space-y-3">
              <AlertCircle className="w-10 h-10 text-zinc-500" />
              <h3 className="text-base font-bold text-white">
                No songs found for &ldquo;{debouncedQuery}&rdquo;
              </h3>
              <p className="text-xs text-zinc-500 max-w-md">
                Try searching for any song or artist name (e.g. Arijit Singh, Sidhu Moose Wala, Karan Aujla, Diljit Dosanjh, Taylor Swift).
              </p>
            </div>
          ) : (
            <>
              {/* Top Result Card */}
              {results.topResult && selectedCategory === 'all' && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Top Result
                  </h3>
                  <div
                    onClick={() => {
                      if ('genres' in results.topResult!) {
                        onSelectArtist(results.topResult as Artist);
                      } else {
                        playTrack(results.topResult as Track, results.songs);
                      }
                    }}
                    className="p-5 rounded-3xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          'image_url' in results.topResult
                            ? results.topResult.image_url
                            : results.topResult.artwork_url
                        }
                        alt={'name' in results.topResult ? results.topResult.name : results.topResult.title}
                        onError={handleImageError}
                        className={`w-20 h-20 sm:w-24 sm:h-24 object-cover shadow-xl ${
                          'genres' in results.topResult ? 'rounded-full' : 'rounded-2xl'
                        }`}
                      />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {'genres' in results.topResult ? 'Artist' : 'Song'}
                        </span>
                        <h2 className="text-lg sm:text-2xl font-black text-white mt-1">
                          {'name' in results.topResult ? results.topResult.name : results.topResult.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          {'bio' in results.topResult
                            ? results.topResult.bio
                            : (results.topResult as Track).artist}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if ('genres' in results.topResult!) {
                          const artist = results.topResult as Artist;
                          if (artist.popular_tracks && artist.popular_tracks.length > 0) {
                            playTrack(artist.popular_tracks[0], artist.popular_tracks);
                          } else if (results.songs.length > 0) {
                            playTrack(results.songs[0], results.songs);
                          }
                        } else {
                          playTrack(results.topResult as Track, results.songs);
                        }
                      }}
                      className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Songs List */}
              {(selectedCategory === 'all' || selectedCategory === 'songs') && results.songs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Songs ({results.songs.length})
                  </h3>
                  <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    {results.songs.map((track, idx) => {
                      const active = currentTrack?.id === track.id;
                      const liked = isLiked(track.id);
                      const downloaded = isDownloaded(track.id);
                      const isDownloading = downloadingTrackIds.has(track.id);

                      return (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, results.songs)}
                          className={`group flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                            active ? 'bg-emerald-500/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <span className="text-xs font-mono text-zinc-500 w-4 text-center">
                              {active && isPlaying ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                              ) : (
                                idx + 1
                              )}
                            </span>
                            <img
                              src={track.artwork_url}
                              alt={track.title}
                              onError={handleImageError}
                              className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow"
                            />
                            <div className="min-w-0 flex-1">
                              <h4
                                className={`text-xs sm:text-sm font-bold truncate ${
                                  active ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'
                                }`}
                              >
                                {track.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                              {formatDuration(track.duration_ms)}
                            </span>

                            {/* Download Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadTrack(track);
                              }}
                              disabled={isDownloading}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                downloaded
                                  ? 'text-emerald-400'
                                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
                              }`}
                              title={downloaded ? 'Downloaded Offline' : 'Download Song Offline'}
                            >
                              {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                              ) : downloaded ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ArrowDownToLine className="w-4 h-4" />
                              )}
                            </button>

                            {/* Like Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(track);
                              }}
                              className="text-zinc-500 hover:text-emerald-400 p-2 transition-colors cursor-pointer"
                            >
                              <Heart className={`w-4 h-4 ${liked ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Artists Section */}
              {(selectedCategory === 'all' || selectedCategory === 'artists') && results.artists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Artists ({results.artists.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.artists.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => onSelectArtist(artist)}
                        className="p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex flex-col items-center text-center cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-3 ring-2 ring-emerald-500/20">
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            onError={handleImageError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-white truncate w-full">{artist.name}</h4>
                        <span className="text-[10px] text-zinc-500 mt-0.5">Artist</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Section */}
              {(selectedCategory === 'all' || selectedCategory === 'albums') && results.albums.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Albums ({results.albums.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.albums.map((album) => (
                      <div
                        key={album.id}
                        onClick={() => {
                          if (album.tracks.length > 0) playTrack(album.tracks[0], album.tracks);
                        }}
                        className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <img
                          src={album.artwork_url}
                          alt={album.title}
                          onError={handleImageError}
                          className="w-full aspect-square rounded-xl object-cover mb-2.5"
                        />
                        <h4 className="text-xs font-bold text-white truncate">{album.title}</h4>
                        <p className="text-[10px] text-zinc-400 truncate">{album.artist}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
