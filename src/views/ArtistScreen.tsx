import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Shuffle, Heart, Users } from 'lucide-react';
import type { Artist, Track } from '../types/music';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';

interface ArtistScreenProps {
  artist: Artist;
  onBack: () => void;
}

export const ArtistScreen: React.FC<ArtistScreenProps> = ({ artist, onBack }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { isLiked, toggleLike, isFollowed, toggleFollowArtist } = useLibrary();
  const { user } = useAuth();

  const [tracks, setTracks] = useState<Track[]>(artist.popular_tracks || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const followed = isFollowed(artist.id);

  // Load tracks for this artist if not already pre-populated
  useEffect(() => {
    let isCancelled = false;
    async function loadArtistTracks() {
      setIsLoading(true);
      try {
        const includePreviews = user?.include_previews ?? false;
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(artist.name)}&includePreviews=${includePreviews}`
        );
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setTracks(data.songs || []);
        }
      } catch (err) {
        console.warn('Artist tracks load note:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    if (!artist.popular_tracks || artist.popular_tracks.length === 0) {
      loadArtistTracks();
    }
    return () => {
      isCancelled = true;
    };
  }, [artist.name, user?.include_previews]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '';
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="pb-32 space-y-8 max-w-6xl mx-auto p-4 sm:p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Artist Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-800 to-[#12131a] p-6 sm:p-10 border border-white/5 flex flex-col sm:flex-row items-center sm:items-end gap-6 shadow-2xl">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden ring-4 ring-emerald-500/30 flex-shrink-0 shadow-2xl">
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <img
              src={artist.image_url}
              alt={artist.name}
              onError={(e) => {
                e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-600"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
              }}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <h1 className="text-2xl sm:text-5xl font-black text-white tracking-tight">
            {artist.name}
          </h1>

          {artist.bio && (
            <p className="text-xs text-zinc-400 max-w-xl line-clamp-2">{artist.bio}</p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {artist.genres.map((g) => (
              <span key={g} className="text-[11px] text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full">
                {g}
              </span>
            ))}
            {artist.followers_count && (
              <span className="text-[11px] text-zinc-500 font-mono">
                {artist.followers_count.toLocaleString()} Monthly Listeners
              </span>
            )}
          </div>
        </div>

        {/* Hero Actions */}
        <div className="flex items-center gap-3">
          {tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform hover:scale-105 cursor-pointer"
              title="Play Artist"
            >
              <Play className="w-7 h-7 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={() => toggleFollowArtist(artist)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              followed
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
            }`}
          >
            {followed ? 'Following' : '+ Follow'}
          </button>
        </div>
      </div>

      {/* Popular Tracks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Popular Releases
          </h2>
          {tracks.length > 1 && (
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle Play</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Loading artist tracks...</div>
        ) : tracks.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
            No tracks found for this artist right now.
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
            {tracks.map((track, idx) => {
              const active = currentTrack?.id === track.id;
              const liked = isLiked(track.id);
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, tracks)}
                  className={`group flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors cursor-pointer ${
                    active ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="text-xs font-mono text-zinc-500 w-5 text-center">
                      {active && isPlaying ? '▶' : idx + 1}
                    </span>
                    <img
                      src={track.artwork_url}
                      alt={track.title}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          active ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">{track.album || 'Single'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                      {formatDuration(track.duration_ms)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track);
                      }}
                      className="text-zinc-500 hover:text-emerald-400 p-2 cursor-pointer"
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
