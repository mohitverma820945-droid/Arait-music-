import React, { useState, useEffect } from 'react';
import { Radio, Search, Play, Volume2, Globe, Sparkles, Loader2 } from 'lucide-react';
import type { Track } from '../types/music';
import { usePlayer } from '../context/PlayerContext';

export const RadiosScreen: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [selectedTag, setSelectedTag] = useState<string>('hindi');
  const [stations, setStations] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const tags = [
    { id: 'hindi', label: 'Hindi & Bollywood' },
    { id: 'punjabi', label: 'Punjabi & Bhangra' },
    { id: 'classical', label: 'Indian Classical' },
    { id: 'retro', label: 'Vintage & Retro' },
    { id: 'pop', label: 'Global Pop' },
    { id: 'chill', label: 'Lofi & Chill' }
  ];

  useEffect(() => {
    let isCancelled = false;
    async function loadStations() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(selectedTag)}&includePreviews=false`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setStations(data.radios || []);
        }
      } catch (err) {
        console.warn('Radio load note:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadStations();
    return () => {
      isCancelled = true;
    };
  }, [selectedTag]);

  const filteredStations = stations.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <Radio className="w-4 h-4 animate-pulse" />
            24/7 Live Broadcasts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Live Radios &amp; Continuous Streams
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Over 40,000 verified live streams from India, the UK, the US, and around the globe.
          </p>
        </div>

        {/* Filter search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter stations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Genre / Tag Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(tag.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              selectedTag === tag.id
                ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Stations Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-xs font-medium text-zinc-400">Tuning into live radio frequencies...</p>
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 rounded-3xl bg-white/[0.02] border border-dashed border-white/5 space-y-2">
          <Radio className="w-10 h-10 mx-auto text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">No stations found for this tag</p>
          <p className="text-xs text-zinc-500">Try selecting another genre tab above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStations.map((station) => {
            const active = currentTrack?.id === station.id;
            return (
              <div
                key={station.id}
                onClick={() => playTrack(station, filteredStations)}
                className={`group p-4 rounded-3xl bg-[#12131a] border transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1 ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                    : 'border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow">
                    <img
                      src={station.artwork_url}
                      alt={station.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {station.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate">{station.artist}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                  <span className="text-emerald-400 font-mono flex items-center gap-1.5 uppercase font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Broadcast
                  </span>
                  <span className="text-zinc-500">Free Stream</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
