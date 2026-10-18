import React, { useEffect, useRef } from 'react';
import { X, Mic2, ExternalLink, Youtube, Loader2, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const LyricsPanel: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    isLyricsOpen,
    setIsLyricsOpen,
    lyricsData,
    isLoadingLyrics,
    seek
  } = usePlayer();

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active lyric line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime]);

  if (!isLyricsOpen) return null;

  // Find active line index in synced lyrics
  let activeIndex = -1;
  if (lyricsData?.synced_lyrics && lyricsData.synced_lyrics.length > 0) {
    for (let i = 0; i < lyricsData.synced_lyrics.length; i++) {
      if (currentTime >= lyricsData.synced_lyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 md:w-[420px] bg-[#0c0e14]/98 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            {lyricsData?.synced_lyrics ? 'Synchronized Lyrics' : 'Song Lyrics'}
          </h3>
        </div>
        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Song Header in Panel */}
      {currentTrack && (
        <div className="px-5 py-3 bg-white/[0.02] flex items-center gap-3 border-b border-white/5">
          <img
            src={currentTrack.artwork_url}
            alt={currentTrack.title}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>
      )}

      {/* Lyrics Content Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoadingLyrics ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs font-medium">Matching lyrics for this track...</p>
          </div>
        ) : lyricsData?.synced_lyrics && lyricsData.synced_lyrics.length > 0 ? (
          /* Synchronized Karaoke-style Lyrics */
          <div className="space-y-4 py-8">
            {lyricsData.synced_lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-200 text-base sm:text-lg font-bold leading-relaxed ${
                    isActive
                      ? 'text-white scale-[1.03] origin-left text-emerald-300 drop-shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        ) : lyricsData?.plain_lyrics ? (
          /* Plain Lyrics in original script (Hindi, Gurmukhi, English, etc.) */
          <div className="whitespace-pre-line text-sm sm:text-base leading-loose text-zinc-300 font-medium">
            {lyricsData.plain_lyrics}
          </div>
        ) : lyricsData?.source === 'youtube_video' && lyricsData.youtube_fallback ? (
          /* Video Fallback */
          <div className="space-y-4 py-2">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black aspect-video relative">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${lyricsData.youtube_fallback.video_id}?autoplay=0&enablejsapi=1`}
                title={lyricsData.youtube_fallback.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white line-clamp-2">
                {lyricsData.youtube_fallback.title}
              </h4>
            </div>
          </div>
        ) : (
          /* Missing Lyrics Clean State */
          <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-500 gap-3">
            <Music2 className="w-10 h-10 stroke-1 text-zinc-600" />
            <div>
              <p className="text-sm font-semibold text-zinc-300">Lyrics unavailable</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[260px]">
                Lyrics are not available for this track yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 text-center text-[11px] text-zinc-500 font-medium">
        Arait Music Lyrics
      </div>
    </div>
  );
};
