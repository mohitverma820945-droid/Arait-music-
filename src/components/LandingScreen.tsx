import React from 'react';
import { LogIn, UserPlus, Music, ShieldCheck, Download, Sparkles, Headphones } from 'lucide-react';

interface LandingScreenProps {
  onOpenAuth: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-black overflow-x-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Arait Music Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Arait <span className="text-emerald-400">Music</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuth}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Join</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Ultimate High-Fidelity Music Experience</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none text-white">
          Stream millions of songs <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            in pristine studio quality.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Welcome to Arait Music. Discover endless Hindi, Punjabi, Bollywood, and international hits. Enjoy 1-click playback, instant lyrics, custom equalizer presets, and offline downloads.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Get Started Free</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 w-full max-w-4xl text-left">
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Studio Quality Sound</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Crystal-clear high-definition streaming with advanced custom equalizer and bass boost presets.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Offline Downloads</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Download any song instantly to your device library for offline listening anywhere, anytime.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Endless Vibe Radios</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Seamlessly transition to matching mood and language tracks automatically when your song finishes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-white/5 text-center text-xs text-zinc-500">
        © 2026 Arait Music. All rights reserved. Spotify-inspired premium audio platform.
      </footer>
    </div>
  );
};
