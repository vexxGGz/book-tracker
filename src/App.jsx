import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BookGrid from './components/BookGrid';
import AddBookModal from './components/AddBookModal';
import SettingsModal from './components/SettingsModal';
import UpdateNotification from './components/UpdateNotification';
import SyncStatus from './components/SyncStatus';
import SplashScreen, { SPLASH_STEPS } from './components/SplashScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { loadBooks, saveBooks, deleteBook } from './utils/storage';
import { performFullSync, uploadBookToCloud, deleteBookFromCloud, subscribeToBookUpdates } from './services/sync';
import { isSupabaseConfigured } from './services/supabase';

function AppContent() {
  const { isAuthenticated, isConfigured } = useAuth();
  const [books, setBooks] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Splash screen state
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashProgress, setSplashProgress] = useState(SPLASH_STEPS.init.progress);
  const [splashLabel, setSplashLabel] = useState(SPLASH_STEPS.init.label);

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // ── Startup sequence ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const runStartup = async () => {
      // Step 1 — init (already shown at mount via initial state)
      await delay(300);
      if (cancelled) return;

      // Step 2 — load local storage
      setSplashLabel(SPLASH_STEPS.localStorage.label);
      setSplashProgress(SPLASH_STEPS.localStorage.progress);
      const loadedBooks = await loadBooks();
      if (cancelled) return;
      setBooks(loadedBooks);

      // Step 3 — Supabase (skip gracefully if not configured)
      setSplashLabel(SPLASH_STEPS.supabase.label);
      setSplashProgress(SPLASH_STEPS.supabase.progress);
      await delay(200);
      if (cancelled) return;

      // Step 4 — check for updates
      setSplashLabel(SPLASH_STEPS.updates.label);
      setSplashProgress(SPLASH_STEPS.updates.progress);

      if (isElectron) {
        // Listen for download progress and update the bar between 70–95%
        const unsubscribe = window.electronAPI.onUpdateStatus((data) => {
          if (data.status === 'downloading' && data.data?.percent != null) {
            const downloadFill = 70 + (data.data.percent / 100) * 25; // 70→95
            setSplashProgress(Math.round(downloadFill));
            setSplashLabel(`Downloading update… ${Math.round(data.data.percent)}%`);
          }
        });

        // Kick off the update check (main process already does this at 3s, but
        // we want the progress reflected here so just wait briefly)
        await delay(800);
        if (unsubscribe?.remove) unsubscribe.remove();
        else if (typeof unsubscribe === 'function') unsubscribe();
      } else {
        await delay(400);
      }
      if (cancelled) return;

      // Step 5 — ready
      setSplashLabel(SPLASH_STEPS.ready.label);
      setSplashProgress(SPLASH_STEPS.ready.progress);
      await delay(500);
      if (cancelled) return;

      // Fade out splash, reveal app
      setSplashVisible(false);
    };

    runStartup();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cloud sync ──────────────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (!isAuthenticated || !isConfigured) return;

    setIsSyncing(true);
    try {
      const localBooks = await loadBooks();
      const syncedBooks = await performFullSync(localBooks);
      await saveBooks(syncedBooks);
      setBooks(syncedBooks);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isConfigured]);

  useEffect(() => {
    if (isAuthenticated && isConfigured) {
      syncNow();
    }
  }, [isAuthenticated, isConfigured, syncNow]);

  useEffect(() => {
    if (!isAuthenticated || !isConfigured) return;

    const channel = subscribeToBookUpdates(
      (newBook) => {
        setBooks(prev => {
          if (prev.some(b => b.id === newBook.id)) return prev;
          return [...prev, newBook];
        });
      },
      (updatedBook) => {
        setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
      },
      (bookId) => {
        setBooks(prev => prev.filter(b => b.id !== bookId));
      }
    );

    return () => { channel?.unsubscribe(); };
  }, [isAuthenticated, isConfigured]);

  // ── Book actions ────────────────────────────────────────────────────────────
  const reloadBooks = async () => {
    const loadedBooks = await loadBooks();
    setBooks(loadedBooks);
    if (isAuthenticated && isConfigured) {
      syncNow();
    }
  };

  const handleDeleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      await deleteBook(id);
      if (isAuthenticated && isConfigured) {
        try {
          await deleteBookFromCloud(id);
        } catch (error) {
          console.error('Failed to delete from cloud:', error);
        }
      }
      reloadBooks();
    }
  };

  const handleYearChange = (year) => {
    const numYear = Number(year);
    if (!isNaN(numYear) && numYear > 1900 && numYear < 3000) {
      setSelectedYear(numYear);
    } else {
      setSelectedYear(new Date().getFullYear());
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <SplashScreen
        progress={splashProgress}
        statusLabel={splashLabel}
        visible={splashVisible}
      />

      <div
        className="app-bg min-h-screen animate-fade-in"
        style={{
          minHeight: '100vh',
          background: 'var(--gradient-bg)',
          opacity: splashVisible ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        <TitleBar />
        <div style={{ paddingTop: isElectron ? '40px' : '0' }}>
          <Header
            currentView={currentView}
            onViewChange={setCurrentView}
            onAddBook={() => setShowAddModal(true)}
            onOpenSettings={() => setShowSettings(true)}
            syncStatus={
              <SyncStatus
                isSyncing={isSyncing}
                lastSyncTime={lastSyncTime}
                onSync={syncNow}
              />
            }
          />

          <main
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              padding: '32px 24px',
            }}
          >
            {currentView === 'dashboard' ? (
              <Dashboard
                books={books}
                selectedYear={selectedYear}
                onYearChange={handleYearChange}
              />
            ) : (
              <BookGrid
                books={books}
                selectedYear={selectedYear}
                onYearChange={handleYearChange}
                onDeleteBook={handleDeleteBook}
                onRefresh={reloadBooks}
              />
            )}
          </main>
        </div>

        {showAddModal && (
          <AddBookModal
            onClose={() => setShowAddModal(false)}
            onBookAdded={reloadBooks}
          />
        )}

        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onDataCleared={reloadBooks}
          />
        )}

        <UpdateNotification />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

// ── Utility ───────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
