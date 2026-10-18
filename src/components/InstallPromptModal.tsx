import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, CheckCircle, ExternalLink, HelpCircle, Terminal } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [showManualInstructions, setShowManualInstructions] = useState<boolean>(false);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowManualInstructions(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#12131a] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Arait Music Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Direct App &amp; APK Download</h2>
            <p className="text-xs text-zinc-400">Install Arait Music natively on your phone or tablet</p>
          </div>
        </div>

        {/* Direct One-Click Install Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-300">
                Direct Installable PWA (No APK Sideloading Warning)
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                Arait Music is configured as a standalone Progressive Web App. You can install it directly onto your Android phone in 1 click without downloading risky unverified APK files. It launches fullscreen with its own app icon and background playback!
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalled ? 'App Is Already Installed' : 'Install Direct App to Device'}</span>
          </button>

          {showManualInstructions && (
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 text-xs text-zinc-300 space-y-1.5 animate-in fade-in">
              <p className="font-bold text-emerald-400">Browser Direct Installation:</p>
              <p>• <strong>Android Chrome:</strong> Tap browser menu (⋮) → select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</p>
              <p>• <strong>iPhone Safari:</strong> Tap Share icon (⎋) → select <strong>"Add to Home Screen"</strong>.</p>
            </div>
          )}
        </div>

        {/* Hindi explanation for the user query */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
          <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>(Aapke Sawal Ka Jawab) Direct APK vs PWA:</span>
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Haan! Arait Music direct app ki tarah kaam karta hai. Aapko browser me <strong>"Install App"</strong> ya <strong>"Add to Home Screen"</strong> dabana hai — ye turant phone ki home screen par ek native app ki tarah install ho jayega, bina kisi download error ya warning ke.
          </p>
        </div>

        {/* Sideload APK Generation Guide */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span>How to generate a standalone .APK file for Google Play / Sideload:</span>
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            If you want a standalone signed <code>.apk</code> or <code>.aab</code> package for distribution, Google's official <strong>Bubblewrap CLI</strong> turns this PWA manifest into a release APK in 1 command:
          </p>
          <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-400 overflow-x-auto border border-white/5">
            npx @bubblewrap/cli build
          </div>
          <p className="text-[11px] text-zinc-500">
            Bubblewrap automatically compiles the Android Manifest and outputs <code>app-release-signed.apk</code> ready for direct install on any Android phone!
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
