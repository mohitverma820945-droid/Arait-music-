import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Trash2,
  Check,
  Globe,
  Sliders,
  LogOut,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_LANGUAGES = [
  'Hindi',
  'Punjabi',
  'English',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'Malayalam',
  'Kannada',
  'Bhojpuri'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, uploadAvatar, removeAvatar, logout, deleteAccount } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Profile fields state
  const [displayName, setDisplayName] = useState<string>(user?.display_name || '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    user?.preferred_languages || ['Hindi', 'Punjabi', 'English']
  );
  const [includePreviews, setIncludePreviews] = useState<boolean>(user?.include_previews ?? false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const valid = ['image/jpeg', 'image/png', 'image/webp'];
    if (!valid.includes(file.type)) {
      setUploadError('Invalid file type. Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Perform actual upload (BUG 2 FIX)
  const handleUploadAvatar = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadAvatar(selectedFile);
      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      await removeAvatar();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to remove photo.');
    }
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length === 1) return; // Keep at least one
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        preferredLanguages: selectedLanguages,
        includePreviews
      });
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#12131a] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Account &amp; Settings</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Manage your profile, languages, and playback rules</p>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profile photo updated successfully!</span>
          </div>
        )}

        {/* Photo Upload Section (BUG 2 IMPLEMENTATION) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group flex-shrink-0">
            <img
              src={previewUrl || user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
              alt={user.display_name}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-lg"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              title="Select New Photo"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div>
              <h4 className="text-xs font-bold text-white">Profile Photo</h4>
              <p className="text-[11px] text-zinc-400">JPEG, PNG, or WebP up to 5MB.</p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {selectedFile ? (
                <>
                  <button
                    onClick={handleUploadAvatar}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Confirm &amp; Upload</span>
                  </button>
                  <button
                    onClick={handleCancelSelection}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/5"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Choose Photo</span>
                  </button>
                  {user.avatar_url && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors cursor-pointer"
                      title="Remove Avatar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Preferred Languages (Personalization Engine) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preferred Music Languages</span>
          </label>
          <p className="text-[11px] text-zinc-400">
            Select your preferred languages to personalize your home feed and daily mixes:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {AVAILABLE_LANGUAGES.map((lang) => {
              const active = selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-sm'
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Songs Only Mode Switch */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Songs Only Filter</span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Exclude 30-second preview clips from main playable feeds and search.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIncludePreviews(!includePreviews)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              !includePreviews ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
            title="Toggle Full Songs Only"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                !includePreviews ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Save & Close Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Danger Zone: Logout & Delete Account */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-red-400">Permanently delete?</span>
              <button
                onClick={async () => {
                  await deleteAccount();
                  onClose();
                }}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-zinc-400 hover:text-zinc-200 text-[11px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-zinc-500 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
