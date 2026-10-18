import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Mic2,
  Maximize2,
  Heart,
  Headphones,
  Bluetooth,
  Plus
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';

export const BottomPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isLyricsOpen,
    isQueueOpen,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
    setIsExpanded,
    setIsLyricsOpen,
    setIsQueueOpen,
    downloadTrack,
    isDownloaded,
    downloadingTrackIds
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  // All hooks called unconditionally at the top level
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = isLiked(currentTrack.id);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.src.includes('500x500')) {
      img.src = img.src.replace('500x500', '150x150');
    } else if (!img.src.includes('unsplash')) {
      img.src =
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
    }
  };

  const downloaded = isDownloaded(currentTrack.id);

  return (
    <div className="fixed bottom-16 md:bottom-3 left-2 right-2 md:left-4 md:right-4 z-30 transition-all select-none">
      <div
        onClick={() => setIsExpanded(true)}
        className="max-w-7xl mx-auto bg-[#0d3b2e] hover:bg-[#114536] text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/60 border border-emerald-500/30 flex items-center justify-between gap-3 cursor-pointer group transition-all"
      >
        {/* Left: Artwork & Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md">
            <img
              src={currentTrack.artwork_url}
              alt={currentTrack.title}
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {currentTrack.title}
              </span>
              <span className="text-emerald-400 text-xs">·</span>
              <span className="text-xs text-zinc-300 truncate">{currentTrack.artist}</span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-emerald-300 font-medium">
              <Bluetooth className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Active Audio Device (High Fidelity)</span>
            </div>
          </div>
        </div>

        {/* Right: Controls (Device icon, Like/Add button, Play/Pause) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Audio Output / Headphones Icon */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-full hover:bg-white/10 text-emerald-400 transition-colors cursor-pointer"
            title="Connected Audio Device"
          >
            <Headphones className="w-5 h-5" />
          </button>

          {/* Add to Playlist (+) Button */}
          <button
            onClick={() => setShowAddToPlaylist(true)}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Add to Playlist"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Like / Add Button */}
          <button
            onClick={() => toggleLike(currentTrack)}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={liked ? 'Liked' : 'Add to Liked'}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-emerald-400 text-emerald-400' : ''}`} />
          </button>

          {/* Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
      <AddToPlaylistModal
        track={currentTrack}
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
      />
    </div>
  );
};
