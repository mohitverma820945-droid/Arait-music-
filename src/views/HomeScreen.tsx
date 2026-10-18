import React, { useState, useEffect } from 'react';
import {
  Play,
  Heart,
  Users,
  Sparkles,
  Loader2,
  ArrowDownToLine,
  CheckCircle
} from 'lucide-react';
import type { Track, Artist } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  onSelectArtist: (artist: Artist) => void;
  onExploreMore: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectArtist, onExploreMore }) => {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    downloadTrack,
    isDownloaded,
    downloadingTrackIds
  } = usePlayer();
  const { isLiked, toggleLike, isFollowed, toggleFollowArtist } = useLibrary();
  const { user, token } = useAuth();

  const [feed, setFeed] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    async function loadFeed() {
      setIsLoading(true);
      try {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/recommendations/feed', { headers });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) setFeed(data);
        }
      } catch (err) {
        console.warn('Feed fetch note:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadFeed();

    // Auto-refresh feed every 30 minutes
    const interval = setInterval(loadFeed, 30 * 60 * 1000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [token, user?.id]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Silently handle load errors without forcing a single placeholder for everyone
    console.warn('Image failed to load');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-semibold text-zinc-400">Loading your music...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-10 max-w-7xl mx-auto pb-32">
      {/* Personalized Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {feed?.greeting || 'Welcome'}, {user ? user.display_name.split(' ')[0] : 'Listener'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ready to stream songs from your favorite artists
          </p>
        </div>
      </div>

      {/* 1. Made For You Section */}
      {feed?.madeForYou && feed.madeForYou.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Made For You
            </h2>
            <span className="text-xs text-zinc-500 font-medium">Daily Mix</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {feed.madeForYou.map((track: Track) => {
              const active = currentTrack?.id === track.id;
              const liked = isLiked(track.id);
              const downloaded = isDownloaded(track.id);
              const isDownloading = downloadingTrackIds.has(track.id);

              return (
                <div
                  key={track.id}
                  className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                  onClick={() => playTrack(track, feed.madeForYou)}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800 shadow-md">
                    <img
                      src={track.artwork_url}
                      alt={track.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, feed.madeForYou);
                      }}
                      className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all cursor-pointer ${
                        active && isPlaying
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-zinc-500">
                    <span className="text-zinc-500 truncate max-w-[80px]">
                      {track.album || 'Single'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTrack(track);
                        }}
                        disabled={isDownloading}
                        className={`transition-colors cursor-pointer p-1 rounded hover:bg-white/5 ${
                          downloaded ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
                        }`}
                        title={downloaded ? 'Downloaded Offline' : 'Download Song'}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        ) : downloaded ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track);
                        }}
                        className="text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer p-1"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            liked ? 'fill-emerald-400 text-emerald-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Because You Searched For Section */}
      {feed?.becauseYouSearched && feed.becauseYouSearched.tracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Because You Searched &ldquo;{feed.becauseYouSearched.query}&rdquo;
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {feed.becauseYouSearched.tracks.map((track: Track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, feed.becauseYouSearched.tracks)}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800">
                  <img
                    src={track.artwork_url}
                    alt={track.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-8 h-8 text-white fill-current" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white truncate">{track.title}</h3>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Language & Genre Hit Mixes */}
      {feed?.languageMixes &&
        feed.languageMixes.map((mix: any, index: number) => (
          <section key={index} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {mix.language}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {mix.tracks.map((track: Track) => (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, mix.tracks)}
                  className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800">
                    <img
                      src={track.artwork_url}
                      alt={track.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-white truncate">{track.title}</h3>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

      {/* 4. Popular Artists Section removed as requested */}
    </div>
  );
};
