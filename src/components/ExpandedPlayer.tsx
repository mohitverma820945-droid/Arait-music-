import React, { useState } from 'react';
import {
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Sliders,
  Moon,
  Mic2,
  ListMusic,
  ArrowDownToLine,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isExpanded,
    setIsExpanded,
    isLyricsOpen,
    setIsLyricsOpen,
    isQueueOpen,
    setIsQueueOpen,
    equalizerPreset,
    setEqualizerPreset,
    sleepTimerMinutes,
    sleepTimeRemainingSec,
    setSleepTimer,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
    downloadTrack,
    isDownloaded,
    downloadingTrackIds
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();
  const [showEqModal, setShowEqModal] = useState<boolean>(false);
  const [showSleepModal, setShowSleepModal] = useState<boolean>(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<boolean>(false);

  if (!isExpanded || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = isLiked(currentTrack.id);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTimerRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
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

  const isTrackOffline = isDownloaded(currentTrack.id);
  const isDownloading = downloadingTrackIds.has(currentTrack.id);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col justify-between p-6 md:p-10 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Dynamic blurred background element */}
      <div
        className="absolute inset-0 opacity-20 filter blur-3xl pointer-events-none scale-125"
        style={{
          backgroundImage: `url(${currentTrack.artwork_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full">
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Minimize Player"
        >
          <Minimize2 className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs text-zinc-400 font-medium truncate max-w-[200px]">
            {currentTrack.album || currentTrack.artist}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sleep Timer button */}
          <button
            onClick={() => setShowSleepModal(!showSleepModal)}
            className={`p-2.5 rounded-full transition-all cursor-pointer ${
              sleepTimerMinutes ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Equalizer button */}
          <button
            onClick={() => setShowEqModal(!showEqModal)}
            className={`p-2.5 rounded-full transition-all cursor-pointer ${
              equalizerPreset !== 'flat' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
            title="Audio Equalizer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Area: Artwork & Metadata */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto max-w-md mx-auto w-full">
        {/* Large Artwork */}
        <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10 ring-1 ring-white/10 relative group mb-8">
          <img
            src={currentTrack.artwork_url}
            alt={currentTrack.title}
            onError={handleImageError}
            className="w-full h-full object-cover select-none"
          />
        </div>

        {/* Title, Artist, & Actions */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="min-w-0 pr-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate tracking-tight">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base font-medium text-zinc-400 truncate mt-1">
              {currentTrack.artist}
            </p>
            {sleepTimeRemainingSec && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Moon className="w-3 h-3 text-emerald-400" />
                  {formatTimerRemaining(sleepTimeRemainingSec)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={() => downloadTrack(currentTrack)}
              disabled={isDownloading}
              className={`p-3 rounded-full hover:bg-white/5 transition-colors cursor-pointer ${
                isTrackOffline ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
              title={isTrackOffline ? 'Downloaded Offline' : 'Download Song'}
            >
              {isDownloading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              ) : isTrackOffline ? (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              ) : (
                <ArrowDownToLine className="w-6 h-6" />
              )}
            </button>

            {/* Add to Playlist (+) Button */}
            <button
              onClick={() => setShowAddToPlaylist(true)}
              className="p-3 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Add to Playlist"
            >
              <Plus className="w-6 h-6" />
            </button>

            {/* Like Button */}
            <button
              onClick={() => toggleLike(currentTrack)}
              className="p-3 rounded-full hover:bg-white/5 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-emerald-400 text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Seek Bar */}
        <div className="w-full mb-6">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #10b981 ${progressPercent}%, rgba(63, 63, 70, 0.6) ${progressPercent}%)`
            }}
          />
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Central Controls */}
        <div className="w-full flex items-center justify-between max-w-sm mb-6">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors cursor-pointer ${
              isShuffle ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={playPrevious}
            className="text-zinc-300 hover:text-white p-2 transition-transform active:scale-90 cursor-pointer"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={playNext}
            className="text-zinc-300 hover:text-white p-2 transition-transform active:scale-90 cursor-pointer"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 transition-colors cursor-pointer ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume Slider in Fullscreen */}
        <div className="w-full flex items-center gap-3 px-4 py-2 bg-white/[0.03] rounded-2xl border border-white/5">
          <button onClick={toggleMute} className="text-zinc-400 hover:text-white cursor-pointer">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Bottom Auxiliary Actions (Lyrics, Queue) */}
      <div className="relative z-10 flex items-center justify-center gap-4 max-w-sm mx-auto w-full pt-4">
        <button
          onClick={() => {
            setIsLyricsOpen(true);
            setIsExpanded(false);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
        >
          <Mic2 className="w-4 h-4 text-emerald-400" />
          <span>Synchronized Lyrics</span>
        </button>

        <button
          onClick={() => {
            setIsQueueOpen(true);
            setIsExpanded(false);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
        >
          <ListMusic className="w-4 h-4" />
          <span>Playback Queue</span>
        </button>
      </div>

      {/* Equalizer Modal */}
      {showEqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121218] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Audio Equalizer
              </h3>
              <button
                onClick={() => setShowEqModal(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Select an equalizer preset optimized for your headphones or speakers:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {(['flat', 'bass', 'vocal', 'electronic'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setEqualizerPreset(preset)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border ${
                    equalizerPreset === preset
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {preset === 'bass' ? 'Bass Boost' : preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sleep Timer Modal */}
      {showSleepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121218] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Moon className="w-4 h-4 text-emerald-400" />
                Sleep Timer
              </h3>
              <button
                onClick={() => setShowSleepModal(false)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Music will automatically pause after the chosen duration:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { min: null, label: 'Turn Off' },
                { min: 15, label: '15 Minutes' },
                { min: 30, label: '30 Minutes' },
                { min: 45, label: '45 Minutes' },
                { min: 60, label: '60 Minutes' }
              ].map((opt) => (
                <button
                  key={String(opt.min)}
                  onClick={() => {
                    setSleepTimer(opt.min);
                    setShowSleepModal(false);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    sleepTimerMinutes === opt.min
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <AddToPlaylistModal
        track={currentTrack}
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
      />
    </div>
  );
};
