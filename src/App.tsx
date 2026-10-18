/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { PlayerProvider } from './context/PlayerContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { BottomPlayer } from './components/BottomPlayer';
import { ExpandedPlayer } from './components/ExpandedPlayer';
import { LyricsPanel } from './components/LyricsPanel';
import { QueuePanel } from './components/QueuePanel';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { InstallPromptModal } from './components/InstallPromptModal';
import { LandingScreen } from './components/LandingScreen';

import { HomeScreen } from './views/HomeScreen';
import { SearchScreen } from './views/SearchScreen';
import { RadiosScreen } from './views/RadiosScreen';
import { LibraryScreen } from './views/LibraryScreen';
import { PlaylistScreen } from './views/PlaylistScreen';
import { ArtistScreen } from './views/ArtistScreen';

import type { Artist } from './types/music';

function MainLayout() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);

  if (!isLoading && !user) {
    return (
      <>
        <LandingScreen onOpenAuth={() => setIsAuthOpen(true)} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </>
    );
  }

  const handleSelectArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setActiveTab('artist');
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActiveTab('playlist');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenInstall={() => setIsInstallOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
            onSelectPlaylist={handleSelectPlaylist}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-[#09090b]">
          {activeTab === 'home' && (
            <HomeScreen
              onSelectArtist={handleSelectArtist}
              onExploreMore={() => setActiveTab('search')}
            />
          )}

          {activeTab === 'search' && (
            <SearchScreen onSelectArtist={handleSelectArtist} />
          )}

          {activeTab === 'radios' && <RadiosScreen />}

          {(activeTab === 'liked' ||
            activeTab === 'artists' ||
            activeTab === 'library' ||
            activeTab === 'downloads') && (
            <LibraryScreen
              onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
              onSelectPlaylist={handleSelectPlaylist}
              onSelectArtist={handleSelectArtist}
              initialTab={
                activeTab === 'downloads'
                  ? 'downloads'
                  : activeTab === 'artists'
                  ? 'artists'
                  : 'liked'
              }
            />
          )}

          {activeTab === 'playlist' && selectedPlaylistId && (
            <PlaylistScreen
              playlistId={selectedPlaylistId}
              onBack={() => setActiveTab('library')}
            />
          )}

          {activeTab === 'artist' && selectedArtist && (
            <ArtistScreen
              artist={selectedArtist}
              onBack={() => setActiveTab('home')}
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Music Player */}
      <BottomPlayer />

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Expanded Fullscreen Player */}
      <ExpandedPlayer />

      {/* Right Drawer Lyrics Panel (Live Sync + YouTube Fallback) */}
      <LyricsPanel />

      {/* Right Drawer Queue Panel */}
      <QueuePanel />

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreated={(id) => handleSelectPlaylist(id)}
      />
      <InstallPromptModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <PlayerProvider>
          <MainLayout />
        </PlayerProvider>
      </LibraryProvider>
    </AuthProvider>
  );
}
