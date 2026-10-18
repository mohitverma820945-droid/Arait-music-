import React from 'react';
import { Home, Search, Heart, Users, PlusCircle, ArrowDownToLine } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreatePlaylist: () => void;
  onSelectPlaylist: (playlistId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreatePlaylist,
  onSelectPlaylist
}) => {
  const { playlists, likedSongs } = useLibrary();
  const { downloadedTracks } = usePlayer();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search }
  ];

  const libraryItems = [
    {
      id: 'liked',
      label: 'Liked Songs',
      icon: Heart,
      count: likedSongs.length,
      color: 'text-emerald-400'
    },
    {
      id: 'downloads',
      label: 'Downloaded (Offline)',
      icon: ArrowDownToLine,
      count: downloadedTracks.length,
      color: 'text-emerald-400'
    },
    { id: 'artists', label: 'Followed Artists', icon: Users }
  ];

  return (
    <aside className="w-64 bg-[#0d0e12] flex flex-col border-r border-white/5 h-[calc(100vh-4rem-5.5rem)] select-none">
      {/* Primary Navigation */}
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Library Section */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between px-3 py-1 mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Your Library
            </span>
            <button
              onClick={onOpenCreatePlaylist}
              className="text-zinc-400 hover:text-emerald-400 transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              title="Create Playlist"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.color || 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-xs text-zinc-500 font-mono">{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* User's Playlists */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Playlists
          </div>

          {playlists.length === 0 ? (
            <div className="px-3 py-3 text-xs text-zinc-500 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/5">
              No playlists yet.
              <button
                onClick={onOpenCreatePlaylist}
                className="block mx-auto mt-1.5 text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                + Create one
              </button>
            </div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => {
                  onSelectPlaylist(pl.id);
                  setActiveTab('playlist');
                }}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium truncate transition-all cursor-pointer flex items-center gap-2.5 ${
                  activeTab === 'playlist'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <img
                  src={pl.cover_url}
                  alt={pl.title}
                  className="w-5 h-5 rounded object-cover flex-shrink-0"
                />
                <span className="truncate">{pl.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
