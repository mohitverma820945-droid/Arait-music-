import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, LogIn, Settings } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenInstall: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenProfile,
  onOpenInstall,
  activeTab,
  setActiveTab
}) => {
  const { user } = useAuth();
  const [isStandalone, setIsStandalone] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone
    ) {
      setIsStandalone(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
      {/* Brand Logo */}
      <div
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-2.5 cursor-pointer select-none group"
      >
        <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0">
          <img src="/logo.png" alt="Arait Music Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            Arait <span className="text-emerald-400">Music</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Auth / Profile Area */}
        {user ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-zinc-900 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/50"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold text-xs">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-zinc-200 group-hover:text-white max-w-[100px] truncate hidden sm:inline">
              {user.display_name}
            </span>
            <Settings className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all hover:scale-105 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
