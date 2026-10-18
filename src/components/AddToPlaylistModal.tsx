import React, { useState } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { Track } from '../types/music';
import { useLibrary } from '../context/LibraryContext';

interface AddToPlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  isOpen,
  onClose
}) => {
  const { playlists, addTrackToPlaylist, createPlaylist } = useLibrary();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      setError(null);
      await addTrackToPlaylist(playlistId, track);
      setSuccessMessage(`Added to "${playlistName}" successfully!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to add song to playlist');
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Playlist name is required');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const pl = await createPlaylist(newTitle.trim(), newDesc.trim(), track.artwork_url);
      await addTrackToPlaylist(pl.id, track);
      setNewTitle('');
      setNewDesc('');
      setIsCreatingNew(false);
      setSuccessMessage(`Created "${pl.title}" and added song!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-[#12131a] border border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add to Playlist</h2>
            <p className="text-xs text-zinc-400 truncate max-w-[260px]">{track.title} · {track.artist}</p>
          </div>
        </div>

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {error}
          </div>
        )}

        {!isCreatingNew ? (
          <div className="space-y-4">
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Playlist</span>
            </button>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {playlists.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No playlists yet. Create your first playlist above!
                </div>
              ) : (
                playlists.map((pl) => {
                  const alreadyExists = pl.tracks?.some((t) => t.id === track.id);
                  return (
                    <div
                      key={pl.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={pl.cover_url || track.artwork_url}
                          alt={pl.title}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{pl.title}</h4>
                          <p className="text-[10px] text-zinc-400">{pl.tracks?.length || 0} songs</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToPlaylist(pl.id, pl.title)}
                        disabled={alreadyExists}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          alreadyExists
                            ? 'bg-zinc-800 text-zinc-500 cursor-default'
                            : 'bg-white/10 hover:bg-emerald-500 hover:text-black text-white'
                        }`}
                      >
                        {alreadyExists ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAndAdd} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Playlist Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Punjabi Party Anthems"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="My favorite collection of tracks"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create & Add Song'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
