// Sync status indicator component
import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import AuthModal from './AuthModal';

const SyncStatus = ({ isSyncing, lastSyncTime, onSync }) => {
  const { isAuthenticated, isConfigured, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const date = new Date(lastSyncTime);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <CloudOff size={16} />
        <span>Offline mode</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
        >
          <Cloud size={16} />
          <span>Sign in for cloud sync</span>
        </button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => onSync?.()}
        />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
      >
        {isSyncing ? (
          <RefreshCw size={16} className="animate-spin text-purple-400" />
        ) : (
          <Cloud size={16} className="text-green-400" />
        )}
        <span className="hidden md:inline">
          {isSyncing ? 'Syncing...' : `Synced ${formatLastSync()}`}
        </span>
        <User size={16} />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-2 min-w-[200px] z-50">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-white text-sm font-medium truncate">
              {user?.email}
            </p>
            <p className="text-gray-500 text-xs">
              Last sync: {formatLastSync()}
            </p>
          </div>
          <button
            onClick={() => {
              onSync?.();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} />
            Sync now
          </button>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2 text-sm"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
