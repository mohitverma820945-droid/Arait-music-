import React, { useState } from 'react';
import { Heart, Users, Music, PlusCircle, Play, Trash2, Download, CheckCircle, ArrowDownToLine } from 'lucide-react';
import type { Track, Artist } from '../types/music';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { createBlobUrlForTrack } from '../utils/offlineStorage';

interface LibraryScreenProps {
  onOpenCreatePlaylist: () => void;
  onSelectPlaylist: (playlistId: string) => void;
  onSelectArtist: (artist: Artist) => void;
  initialTab?: 'liked' | 'downloads' | 'playlists' | 'artists';
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onOpenCreatePlaylist,
  onSelectPlaylist,
  onSelectArtist,
  initialTab
}) => {
  const { likedSongs, playlists, followedArtists, toggleLike, deletePlaylist } = useLibrary();
  const {
    playTrack,
    currentTrack,
    isPlaying,
    downloadedTracks,
    deleteDownload
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'liked' | 'downloads' | 'playlists' | 'artists'>(
    initialTab || 'liked'
  );

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '';
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.src.includes('500x500')) {
      img.src = img.src.replace('500x500', '150x150');
    } else if (!img.src.includes('unsplash')) {
      img.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 pb-32">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Your Library</h1>
          <p className="text-xs text-zinc-400">Liked tracks, offline downloads, and playlists</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'liked', label: `Liked (${likedSongs.length})`, icon: Heart },
            { id: 'downloads', label: `Offline (${downloadedTracks.length})`, icon: ArrowDownToLine },
            { id: 'playlists', label: `Playlists (${playlists.length})`, icon: Music },
            { id: 'artists', label: `Artists (${followedArtists.length})`, icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  active
                    ? 'bg-emerald-500 text-black border-emerald-500 shadow-md'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab: Downloaded Offline Songs */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          {downloadedTracks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/5 space-y-3">
              <ArrowDownToLine className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No downloaded songs</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Click the download icon on any song to save it for high-quality offline listening inside the app.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
              {downloadedTracks.map((record, idx) => {
                const track = record.track;
                const active = currentTrack?.id === track.id;
                const offlinePlayable = createBlobUrlForTrack(record);
                return (
                  <div
                    key={record.id}
                    onClick={() => playTrack(offlinePlayable, downloadedTracks.map(createBlobUrlForTrack))}
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
                        onError={handleImageError}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              active ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'
                            }`}
                          >
                            {track.title}
                          </h4>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Offline
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                        {formatBytes(record.sizeBytes)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDownload(record.id);
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete from Offline Downloads"
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
      )}

      {/* Tab: Liked Songs */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {likedSongs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/5 space-y-3">
              <Heart className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No liked songs yet</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Tap the heart icon on any song while listening to save it to your library.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
              {likedSongs.map((track, idx) => {
                const active = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, likedSongs)}
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
                        onError={handleImageError}
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
                      <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                        {formatDuration(track.duration_ms)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track);
                        }}
                        className="text-emerald-400 p-2 cursor-pointer"
                        title="Remove from Liked"
                      >
                        <Heart className="w-4 h-4 fill-emerald-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <button
            onClick={onOpenCreatePlaylist}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs transition-all border border-emerald-500/30 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Playlist</span>
          </button>

          {playlists.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/5 space-y-2">
              <Music className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">You haven&apos;t created any playlists yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className="group p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800">
                    <img
                      src={pl.cover_url}
                      alt={pl.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white truncate">{pl.title}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{pl.tracks.length} tracks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Followed Artists */}
      {activeTab === 'artists' && (
        <div className="space-y-4">
          {followedArtists.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/5 space-y-2">
              <Users className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">Follow artists to see their releases and profiles here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {followedArtists.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => onSelectArtist(artist)}
                  className="p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-center flex flex-col items-center cursor-pointer transition-all"
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
                  <span className="text-[10px] text-zinc-500">Artist</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
