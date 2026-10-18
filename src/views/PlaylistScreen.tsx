import React from 'react';
import { Play, Shuffle, Trash2, ArrowLeft, Clock, Music } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';

interface PlaylistScreenProps {
  playlistId: string;
  onBack: () => void;
}

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ playlistId, onBack }) => {
  const { playlists, deletePlaylist, removeTrackFromPlaylist } = useLibrary();
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-zinc-400">Playlist not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/5 text-xs text-white"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const formatDuration = (totalMs: number) => {
    const mins = Math.floor(totalMs / 60000);
    return `${mins} min`;
  };

  const totalMs = playlist.tracks.reduce((acc, t) => acc + (t.duration_ms || 180000), 0);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 pb-32">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library</span>
      </button>

      {/* Playlist Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-white/5">
        <img
          src={playlist.cover_url}
          alt={playlist.title}
          className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl object-cover shadow-2xl ring-1 ring-white/10"
        />

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            PLAYLIST
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="text-xs text-zinc-400 line-clamp-2">{playlist.description}</p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400 pt-2 font-medium">
            <span>By {playlist.user_name}</span>
            <span>•</span>
            <span>{playlist.tracks.length} songs</span>
            <span>•</span>
            <span>{formatDuration(totalMs)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {playlist.tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-emerald-500/25 transition-transform hover:scale-105 cursor-pointer"
              title="Play Playlist"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Delete this playlist permanently?')) {
                deletePlaylist(playlist.id);
                onBack();
              }
            }}
            className="p-3 rounded-full hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Delete Playlist"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-2">
        {playlist.tracks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/5 space-y-2">
            <Music className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">
              This playlist is currently empty. Search for songs and click &ldquo;Add to Playlist&rdquo;!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
            {playlist.tracks.map((track, idx) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, playlist.tracks)}
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
                      <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrackFromPlaylist(playlist.id, track.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-4 h-4" />
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
