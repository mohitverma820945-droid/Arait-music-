import React from 'react';
import { X, Trash2, Play, Music, ListMusic } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const QueuePanel: React.FC = () => {
  const {
    currentTrack,
    queue,
    queueIndex,
    isQueueOpen,
    setIsQueueOpen,
    playTrack,
    removeFromQueue,
    clearQueue
  } = usePlayer();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#0c0e14]/98 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Playback Queue</h3>
          <span className="text-xs text-zinc-500 font-mono">({queue.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 1 && (
            <button
              onClick={clearQueue}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Clear Queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Now Playing Item */}
        {currentTrack && (
          <div>
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Now Playing
            </span>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <img
                src={currentTrack.artwork_url}
                alt={currentTrack.title}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-emerald-400 truncate">{currentTrack.title}</h4>
                <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
            </div>
          </div>
        )}

        {/* Next In Queue */}
        <div>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
            Next In Queue
          </span>

          {queue.length <= 1 ? (
            <div className="p-6 text-center text-xs text-zinc-500 bg-white/[0.02] rounded-xl border border-dashed border-white/5">
              Queue is empty. Click any song or playlist to queue tracks.
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((track, idx) => {
                if (idx === queueIndex) return null;
                return (
                  <div
                    key={`${track.id}_${idx}`}
                    className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div
                      onClick={() => playTrack(track, queue)}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <span className="text-xs text-zinc-500 font-mono w-4">{idx + 1}</span>
                      <img
                        src={track.artwork_url}
                        alt={track.title}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                          {track.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-400 transition-opacity cursor-pointer"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
