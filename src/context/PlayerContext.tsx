import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { Track, LyricsData } from '../types/music';
import { useAuth } from './AuthContext';
import {
  saveTrackOffline,
  getAllDownloadedTracks,
  isTrackDownloaded,
  removeDownloadedTrack,
  createBlobUrlForTrack,
  type DownloadedTrackRecord
} from '../utils/offlineStorage';

type EqualizerPreset = 'flat' | 'bass' | 'vocal' | 'electronic';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  queueIndex: number;
  isExpanded: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  lyricsData: LyricsData | null;
  isLoadingLyrics: boolean;
  equalizerPreset: EqualizerPreset;
  sleepTimerMinutes: number | null;
  sleepTimeRemainingSec: number | null;
  playbackError: string | null;

  // Offline Downloads
  downloadedTracks: DownloadedTrackRecord[];
  downloadingTrackIds: Set<string>;
  downloadTrack: (track: Track) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsLyricsOpen: (open: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  setEqualizerPreset: (preset: EqualizerPreset) => void;
  setSleepTimer: (minutes: number | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Web Audio Equalizer nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  // Panels
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Lyrics state
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);

  // Advanced features
  const [equalizerPreset, setEqualizerPresetState] = useState<EqualizerPreset>('flat');
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimeRemainingSec, setSleepTimeRemainingSec] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Downloads state
  const [downloadedTracks, setDownloadedTracks] = useState<DownloadedTrackRecord[]>([]);
  const [downloadingTrackIds, setDownloadingTrackIds] = useState<Set<string>>(new Set());

  // Refresh downloads on startup
  const refreshDownloads = useCallback(async () => {
    try {
      const records = await getAllDownloadedTracks();
      setDownloadedTracks(records);
    } catch (err) {
      console.warn('Failed to load offline tracks:', err);
    }
  }, []);

  useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  const isDownloaded = useCallback(
    (trackId: string) => {
      return downloadedTracks.some((d) => d.id === trackId);
    },
    [downloadedTracks]
  );

  const downloadTrack = async (track: Track) => {
    if (downloadingTrackIds.has(track.id)) return;
    setDownloadingTrackIds((prev) => new Set(prev).add(track.id));

    try {
      await saveTrackOffline(track);
      await refreshDownloads();
    } catch (err: any) {
      console.warn('Download error:', err);
      // Fallback: direct browser trigger if IndexedDB is blocked
      window.open(`/api/audio/download?url=${encodeURIComponent(track.playback_url_or_provider_reference)}&title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`, '_blank');
    } finally {
      setDownloadingTrackIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  };

  const deleteDownload = async (trackId: string) => {
    try {
      await removeDownloadedTrack(trackId);
      await refreshDownloads();
    } catch (err) {
      console.warn('Failed to delete download:', err);
    }
  };

  // Sleep timer interval
  useEffect(() => {
    if (!sleepTimeRemainingSec) return;
    const interval = setInterval(() => {
      setSleepTimeRemainingSec((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimeRemainingSec]);

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (!minutes) {
      setSleepTimeRemainingSec(null);
    } else {
      setSleepTimeRemainingSec(minutes * 60);
    }
  };

  // Equalizer
  const initEqualizer = () => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 250;
      bassFilterRef.current = bass;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      midFilterRef.current = mid;

      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 4000;
      trebleFilterRef.current = treble;

      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(ctx.destination);
    } catch {
      // ignore
    }
  };

  const applyEqualizerPreset = (preset: EqualizerPreset) => {
    setEqualizerPresetState(preset);
    
    // Lazy initialize only when needed to keep native audio stable by default
    if (preset !== 'flat') {
      initEqualizer();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }

    if (!bassFilterRef.current || !midFilterRef.current || !trebleFilterRef.current) return;

    if (preset === 'flat') {
      bassFilterRef.current.gain.value = 0;
      midFilterRef.current.gain.value = 0;
      trebleFilterRef.current.gain.value = 0;
    } else if (preset === 'bass') {
      bassFilterRef.current.gain.value = 12; // Powerful heavy bass boost
      midFilterRef.current.gain.value = -2;
      trebleFilterRef.current.gain.value = 4;
    } else if (preset === 'vocal') {
      bassFilterRef.current.gain.value = -2;
      midFilterRef.current.gain.value = 6;
      trebleFilterRef.current.gain.value = 4;
    } else if (preset === 'electronic') {
      bassFilterRef.current.gain.value = 10;
      midFilterRef.current.gain.value = 2;
      trebleFilterRef.current.gain.value = 8;
    }
  };

  const setEqualizerPreset = (preset: EqualizerPreset) => {
    applyEqualizerPreset(preset);
  };

  // Initialize Singleton Audio Element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;

      audio.addEventListener('play', () => {
        setIsPlaying(true);
        if (audioCtxRef.current) {
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
        }
      });
      audio.addEventListener('pause', () => setIsPlaying(false));

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      });

      audio.addEventListener('progress', () => {
        if (audio.buffered.length > 0) {
          setBuffered(audio.buffered.end(audio.buffered.length - 1));
        }
      });

      audio.addEventListener('ended', () => {
        handleTrackEnded();
      });

      audio.addEventListener('error', () => {
        // Suppress unhandled stream events
      });

      // Handle background resume when app is minimized and restored / backgrounded
      const handleVisibilityChange = () => {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        if (audioRef.current && audioRef.current.paused === false) {
          audioRef.current.play().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Periodic check to keep AudioContext active and prevent background suspension / audio cutting
      setInterval(() => {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      }, 2000);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Fetch lyrics
  useEffect(() => {
    if (!currentTrack) {
      setLyricsData(null);
      return;
    }

    let isCancelled = false;
    async function loadLyrics() {
      setIsLoadingLyrics(true);
      try {
        const durSec = currentTrack?.duration_ms ? currentTrack.duration_ms / 1000 : 0;
        const res = await fetch(
          `/api/lyrics?title=${encodeURIComponent(currentTrack!.title)}&artist=${encodeURIComponent(
            currentTrack!.artist
          )}&duration=${durSec}`
        );
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setLyricsData(data);
        }
      } catch (err) {
        console.warn('Lyrics fetch note:', err);
      } finally {
        if (!isCancelled) setIsLoadingLyrics(false);
      }
    }

    loadLyrics();
    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id]);

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!currentTrack) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch (e) {
        // ignore
      }
      return;
    }

    const artworkUrl = currentTrack.artwork_url || '/logo.png';

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Unknown Title',
        artist: currentTrack.artist || 'Unknown Artist',
        album: currentTrack.album || 'Arait Music',
        artwork: [
          { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      if ('setPositionState' in navigator.mediaSession && !isNaN(duration) && duration > 0 && !isNaN(currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(0, duration),
            playbackRate: 1,
            position: Math.min(Math.max(0, currentTime), duration)
          });
        } catch (err) {
          // Some browsers throw if position > duration
        }
      }

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          playPromiseRef.current = audioRef.current.play();
          playPromiseRef.current.catch(() => {});
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - skipTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + skipTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      });
    } catch (e) {
      console.warn('MediaSession error:', e);
    }
  }, [currentTrack, currentTime, duration, isPlaying]);

  const handleTrackEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      playPromiseRef.current = audioRef.current.play();
      playPromiseRef.current.catch(() => {});
      return;
    }
    playNext();
  };

  // Fixed PlayTrack: Prevents play() interrupted by load() error
  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      if (!audioRef.current) return;
      setPlaybackError(null);

      // Check if track is saved offline
      let playableTrack = track;
      const offlineRecord = downloadedTracks.find((d) => d.id === track.id);
      if (offlineRecord) {
        playableTrack = createBlobUrlForTrack(offlineRecord);
      }

      setCurrentTrack(playableTrack);

      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      } else {
        setQueue((prev) => {
          if (prev.some((t) => t.id === track.id)) return prev;
          return [...prev, track];
        });
      }

      const streamUrl = playableTrack.playback_url_or_provider_reference;
      if (streamUrl) {
        const audio = audioRef.current;
        audio.pause();

        // If track duration was provided in metadata, set it upfront
        if (track.duration_ms && track.duration_ms > 0) {
          setDuration(track.duration_ms / 1000);
        }

        audio.src = streamUrl;
        audio.volume = isMuted ? 0 : volume;

        // Execute play with promise tracking
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromiseRef.current = playPromise;
          playPromise
            .then(() => {
              setIsPlaying(true);
              playPromiseRef.current = null;
            })
            .catch((err) => {
              playPromiseRef.current = null;
              // Suppress expected user rapid click interruptions
              if (err.name !== 'AbortError' && !err.message?.includes('interrupted')) {
                console.warn('Playback note:', err.message);
              }
            });
        }
      }
    },
    [volume, isMuted, downloadedTracks]
  );

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    setQueueIndex(nextIndex);
    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      playTrack(nextTrack, queue);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, playTrack]);

  const playPrevious = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0) return;
    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    setQueueIndex(prevIndex);
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      playTrack(prevTrack, queue);
    }
  }, [queue, queueIndex, playTrack]);

  const toggleShuffle = () => setIsShuffle((prev) => !prev);

  const cycleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        buffered,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        queueIndex,
        isExpanded,
        isLyricsOpen,
        isQueueOpen,
        lyricsData,
        isLoadingLyrics,
        equalizerPreset,
        sleepTimerMinutes,
        sleepTimeRemainingSec,
        playbackError,
        downloadedTracks,
        downloadingTrackIds,
        downloadTrack,
        deleteDownload,
        isDownloaded,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setIsExpanded,
        setIsLyricsOpen,
        setIsQueueOpen,
        setEqualizerPreset,
        setSleepTimer
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
};
