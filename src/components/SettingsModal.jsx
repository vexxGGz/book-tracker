import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Trash2, AlertTriangle, RefreshCw, Download, CheckCircle2,
  Sun, Moon, Key, Save, HardDrive, UploadCloud, FolderOpen, RotateCcw,
} from 'lucide-react';
import { saveBooks, saveReadingGoals, saveIsbndbApiKey, loadIsbndbApiKey } from '../utils/storage';

const cardStyle = {
  background: '#12121a',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#1a1a26',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  color: '#f1f5f9',
  fontSize: '14px',
  fontFamily: 'Outfit, sans-serif',
  outline: 'none',
};

// ── helpers ────────────────────────────────────────────────────────────────────

const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatBackupDate = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

// ── component ─────────────────────────────────────────────────────────────────

const SettingsModal = ({ onClose, onDataCleared }) => {
  // ── update state
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateMessage, setUpdateMessage] = useState('');

  // ── ISBNdb state
  const [isbndbKey, setIsbndbKey] = useState('');
  const [isbndbKeySaved, setIsbndbKeySaved] = useState(false);
  const [isbndbKeyLoading, setIsbndbKeyLoading] = useState(false);

  // ── theme state
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );

  // ── backup state
  const [backups, setBackups] = useState([]);
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(setAppVersion);
    }
    if (window.electronAPI?.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((data) => {
        if (data.status === 'not-available') { setUpdateStatus('up-to-date'); setUpdateMessage('App is up to date'); }
        else if (data.status === 'available') { setUpdateStatus('available'); setUpdateMessage(`Version ${data.data?.version} available`); }
        else if (data.status === 'downloading') { setUpdateStatus('downloading'); setUpdateMessage(data.message); }
        else if (data.status === 'ready') { setUpdateStatus('ready'); setUpdateMessage(`Version ${data.data?.version} ready to install`); }
        else if (data.status === 'error') { setUpdateStatus('error'); setUpdateMessage('Update check failed'); }
        else { setUpdateStatus(data.status); setUpdateMessage(data.message); }
      });
    }
    loadIsbndbApiKey().then((k) => { setIsbndbKey(k || ''); });
    if (isElectron() && window.electronAPI?.getBackups) {
      window.electronAPI.getBackups().then(setBackups);
    }
  }, []);

  // ── Theme toggle ─────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('appTheme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('appTheme', 'dark');
    }
  }, [theme]);

  // ── ISBNdb key save ──────────────────────────────────────────────────────────
  const handleSaveIsbndbKey = async () => {
    setIsbndbKeyLoading(true);
    try {
      await saveIsbndbApiKey(isbndbKey.trim());
      setIsbndbKeySaved(true);
      setTimeout(() => setIsbndbKeySaved(false), 2500);
    } finally {
      setIsbndbKeyLoading(false);
    }
  };

  // ── Updates ──────────────────────────────────────────────────────────────────
  const handleCheckForUpdates = async () => {
    if (!window.electronAPI?.checkForUpdates) {
      setUpdateStatus('error'); setUpdateMessage('Updates not available in browser mode'); return;
    }
    setUpdateStatus('checking'); setUpdateMessage('Checking for updates...');
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.status === 'dev') { setUpdateStatus('error'); setUpdateMessage('Updates disabled in development'); }
    } catch {
      setUpdateStatus('error'); setUpdateMessage('Failed to check for updates');
    }
  };

  const handleInstallUpdate = () => { window.electronAPI?.installUpdate?.(); };

  // ── Backup / Restore ─────────────────────────────────────────────────────────
  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupStatus('');
    try {
      const result = await window.electronAPI.triggerBackup();
      if (result?.success) {
        setBackupStatus('Backup created successfully.');
        const fresh = await window.electronAPI.getBackups();
        setBackups(fresh);
      } else {
        setBackupStatus('No data to back up yet.');
      }
    } catch {
      setBackupStatus('Backup failed.');
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupStatus(''), 4000);
    }
  };

  const handleExportLibrary = async () => {
    if (!isElectron()) return;
    const { loadBooks } = await import('../utils/storage');
    const books = await loadBooks();
    const content = JSON.stringify(books, null, 2);
    const result = await window.electronAPI.showSaveDialog({
      title: 'Export Library',
      defaultPath: `book-tracker-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!result.canceled && result.filePath) {
      await window.electronAPI.writeFile(result.filePath, content);
      setRestoreStatus('Library exported.');
      setTimeout(() => setRestoreStatus(''), 4000);
    }
  };

  const handleRestoreFromFile = async () => {
    if (!isElectron()) return;
    const result = await window.electronAPI.showOpenDialog({
      title: 'Restore from File',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (!result.canceled && result.filePaths?.[0]) {
      if (!window.confirm('This will overwrite your current library data. Continue?')) return;
      const ok = await window.electronAPI.restoreBackup(result.filePaths[0]);
      if (ok) {
        setRestoreStatus('Restored successfully. Restart the app to see changes.');
        if (onDataCleared) onDataCleared();
      } else {
        setRestoreStatus('Restore failed — file may be corrupted.');
      }
      setTimeout(() => setRestoreStatus(''), 6000);
    }
  };

  const handleRestoreAutoBackup = async (filePath) => {
    if (!window.confirm('This will overwrite your current library data. Continue?')) return;
    const ok = await window.electronAPI.restoreBackup(filePath);
    if (ok) {
      setRestoreStatus('Restored successfully. Restart the app to see changes.');
      if (onDataCleared) onDataCleared();
    } else {
      setRestoreStatus('Restore failed.');
    }
    setTimeout(() => setRestoreStatus(''), 6000);
  };

  // ── Clear data ───────────────────────────────────────────────────────────────
  const handleClearData = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsClearing(true);
    try {
      await saveBooks([]);
      await saveReadingGoals({});
      setShowSecondConfirm(false);
      setShowFirstConfirm(false);
      setDeleteConfirmText('');
      if (onDataCleared) onDataCleared();
      onClose();
    } catch {
      alert('Failed to clear data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px',
      }}
    >
      <div style={{ ...cardStyle, maxWidth: '680px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
            Settings
          </h2>
          <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a26'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>

          {/* ── ISBNdb API Key ─────────────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Key style={{ width: '20px', height: '20px', color: '#6366f1' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>ISBNdb API Key</h3>
            </div>
            <div style={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                ISBNdb provides richer book metadata including ISBN-13 and cover price.
                Book lookups will try ISBNdb first and fall back to Google Books.
                Get a key at <span style={{ color: '#818cf8' }}>isbndb.com</span>.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  value={isbndbKey}
                  onChange={(e) => setIsbndbKey(e.target.value)}
                  placeholder="Paste your ISBNdb API key…"
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.3)'; }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                />
                <button
                  onClick={handleSaveIsbndbKey}
                  disabled={isbndbKeyLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 16px', borderRadius: '10px', border: 'none',
                    background: isbndbKeySaved ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                    color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isbndbKeySaved
                    ? <><CheckCircle2 style={{ width: '16px', height: '16px' }} /> Saved</>
                    : <><Save style={{ width: '16px', height: '16px' }} /> Save Key</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* ── Theme ─────────────────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              {theme === 'dark'
                ? <Moon style={{ width: '20px', height: '20px', color: '#6366f1' }} />
                : <Sun style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              }
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Appearance</h3>
            </div>
            <div style={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#f1f5f9', margin: 0, fontWeight: '500' }}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                </p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={toggleTheme}
                style={{
                  width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                  background: theme === 'dark' ? '#6366f1' : '#f59e0b',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.3s ease', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: '4px',
                  left: theme === 'light' ? '28px' : '4px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {theme === 'dark'
                    ? <Moon style={{ width: '12px', height: '12px', color: '#6366f1' }} />
                    : <Sun style={{ width: '12px', height: '12px', color: '#f59e0b' }} />
                  }
                </span>
              </button>
            </div>
          </div>

          {/* ── Backup & Restore ──────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <HardDrive style={{ width: '20px', height: '20px', color: '#6366f1' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Backup &amp; Restore</h3>
            </div>

            <div style={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {isElectron() && (
                  <button
                    onClick={handleBackupNow}
                    disabled={isBackingUp}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                      opacity: isBackingUp ? 0.6 : 1,
                    }}
                  >
                    <HardDrive style={{ width: '14px', height: '14px' }} />
                    {isBackingUp ? 'Backing up…' : 'Back Up Now'}
                  </button>
                )}
                {isElectron() && (
                  <button
                    onClick={handleExportLibrary}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid rgba(16,185,129,0.3)',
                      background: 'rgba(16,185,129,0.1)', color: '#34d399',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    <UploadCloud style={{ width: '14px', height: '14px' }} />
                    Export Library
                  </button>
                )}
                {isElectron() && (
                  <button
                    onClick={handleRestoreFromFile}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid rgba(245,158,11,0.3)',
                      background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    <FolderOpen style={{ width: '14px', height: '14px' }} />
                    Restore from File
                  </button>
                )}
              </div>

              {(backupStatus || restoreStatus) && (
                <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>
                  {backupStatus || restoreStatus}
                </p>
              )}

              {/* Auto-backup list */}
              {isElectron() && backups.length > 0 && (
                <div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0', fontWeight: '500' }}>
                    Recent auto-backups
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {backups.map((b) => (
                      <div
                        key={b.path}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: '8px',
                          background: '#12121a', border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '13px', color: '#f1f5f9', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                            {formatBackupDate(b.createdAt)}
                          </p>
                          {b.size > 0 && (
                            <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 0 0' }}>
                              {formatBytes(b.size)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRestoreAutoBackup(b.path)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '6px 10px', borderRadius: '8px',
                            border: '1px solid rgba(245,158,11,0.3)',
                            background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                          }}
                        >
                          <RotateCcw style={{ width: '12px', height: '12px' }} />
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Updates ───────────────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Download style={{ width: '20px', height: '20px', color: '#6366f1' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Updates</h3>
            </div>
            <div style={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#f1f5f9', margin: 0, fontWeight: '500' }}>
                    Current Version: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>v{appVersion}</span>
                  </p>
                  {updateMessage && (
                    <p style={{
                      fontSize: '13px', margin: '4px 0 0 0',
                      color: updateStatus === 'ready' || updateStatus === 'available' || updateStatus === 'up-to-date'
                        ? '#10b981' : updateStatus === 'error' ? '#ef4444' : '#94a3b8',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {updateStatus === 'up-to-date' && <CheckCircle2 style={{ width: '14px', height: '14px' }} />}
                      {updateMessage}
                    </p>
                  )}
                </div>
                {updateStatus === 'ready' ? (
                  <button onClick={handleInstallUpdate} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white',
                    fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                  }}>
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                    Restart &amp; Update
                  </button>
                ) : (
                  <button
                    onClick={handleCheckForUpdates}
                    disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '10px',
                      border: '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                      fontWeight: '600', fontSize: '14px',
                      cursor: updateStatus === 'checking' || updateStatus === 'downloading' ? 'not-allowed' : 'pointer',
                      opacity: updateStatus === 'checking' || updateStatus === 'downloading' ? 0.6 : 1,
                    }}
                  >
                    <RefreshCw style={{ width: '16px', height: '16px',
                      animation: updateStatus === 'checking' || updateStatus === 'downloading' ? 'spin 1s linear infinite' : 'none' }} />
                    {updateStatus === 'checking' ? 'Checking...' : updateStatus === 'downloading' ? 'Downloading...' : 'Check for Updates'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Danger Zone ───────────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Trash2 style={{ width: '20px', height: '20px', color: '#ef4444' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Danger Zone</h3>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                Clear all your library data, reading goals, and settings. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowFirstConfirm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '10px',
                  border: '1px solid rgba(239,68,68,0.5)', background: 'transparent',
                  color: '#ef4444', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Clear All Data
              </button>
            </div>
          </div>

          {/* ── About ─────────────────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '12px' }}>About</h3>
            <div style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#f1f5f9' }}>Book Tracker</strong> helps you track your reading journey with detailed statistics and insights.
              </p>
              <p style={{ margin: 0 }}>
                Your data is stored locally on your computer. Book metadata is fetched from ISBNdb (if configured) or Google Books.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.06)', borderRadius: '0 0 16px 16px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)', background: '#1a1a26',
              color: '#94a3b8', fontWeight: '600', fontSize: '14px',
              fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#252532'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a26'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            Close
          </button>
        </div>
      </div>

      {/* First Confirmation Dialog */}
      {showFirstConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239,68,68,0.2)' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Clear All Data?</h3>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: 1.6 }}>
              Are you sure you want to delete all your books, reading goals, and settings?
              This action <strong style={{ color: '#ef4444' }}>cannot be undone</strong>.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowFirstConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', background: '#1a1a26', color: '#94a3b8', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowFirstConfirm(false); setShowSecondConfirm(true); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #f87171)', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Yes, Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Dialog */}
      {showSecondConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239,68,68,0.2)' }}>
                <Trash2 style={{ width: '24px', height: '24px', color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Final Confirmation</h3>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '16px', lineHeight: 1.6 }}>This will permanently delete:</p>
            <ul style={{ color: '#94a3b8', marginBottom: '16px', paddingLeft: '20px' }}>
              <li>All books in your library</li>
              <li>Reading goals for all years</li>
              <li>Your ISBNdb API key</li>
            </ul>
            <p style={{ color: '#f1f5f9', marginBottom: '12px', fontWeight: '500' }}>
              Type <span style={{ color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              style={{ ...inputStyle, marginBottom: '16px', borderColor: deleteConfirmText === 'DELETE' ? '#ef4444' : 'rgba(255,255,255,0.06)' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.3)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowSecondConfirm(false); setDeleteConfirmText(''); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', background: '#1a1a26', color: '#94a3b8', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleClearData}
                disabled={deleteConfirmText !== 'DELETE' || isClearing}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: deleteConfirmText === 'DELETE' ? 'linear-gradient(135deg, #ef4444, #f87171)' : '#475569', color: 'white', fontWeight: '600', fontSize: '14px', cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed', opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5 }}
              >
                {isClearing ? 'Clearing...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;
