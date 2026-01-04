import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import { saveBooks, saveReadingGoals } from '../utils/storage';

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

const SettingsModal = ({ onClose, onDataCleared }) => {
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, downloading, ready, error, up-to-date
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    // Get app version
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version);
      });
    }

    // Listen for update status
    if (window.electronAPI?.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((data) => {
        if (data.status === 'not-available') {
          setUpdateStatus('up-to-date');
          setUpdateMessage('App is up to date');
        } else if (data.status === 'available') {
          setUpdateStatus('available');
          setUpdateMessage(`Version ${data.data?.version} available`);
        } else if (data.status === 'downloading') {
          setUpdateStatus('downloading');
          setUpdateMessage(data.message);
        } else if (data.status === 'ready') {
          setUpdateStatus('ready');
          setUpdateMessage(`Version ${data.data?.version} ready to install`);
        } else if (data.status === 'error') {
          setUpdateStatus('error');
          setUpdateMessage('Update check failed');
        } else {
          setUpdateStatus(data.status);
          setUpdateMessage(data.message);
        }
      });
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI?.checkForUpdates) {
      setUpdateStatus('error');
      setUpdateMessage('Updates not available in browser mode');
      return;
    }

    setUpdateStatus('checking');
    setUpdateMessage('Checking for updates...');
    
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.status === 'dev') {
        setUpdateStatus('error');
        setUpdateMessage('Updates disabled in development');
      }
    } catch (err) {
      setUpdateStatus('error');
      setUpdateMessage('Failed to check for updates');
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const handleClearData = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setIsClearing(true);
    try {
      // Clear all data
      await saveBooks([]);
      await saveReadingGoals({});
      
      // Close dialogs
      setShowSecondConfirm(false);
      setShowFirstConfirm(false);
      setDeleteConfirmText('');
      
      // Notify parent to refresh
      if (onDataCleared) {
        onDataCleared();
      }
      onClose();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
    >
      <div style={{ ...cardStyle, maxWidth: '640px', width: '100%' }}>
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a26';
              e.currentTarget.style.color = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Danger Zone */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Trash2 style={{ width: '20px', height: '20px', color: '#ef4444' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Danger Zone</h3>
            </div>
            
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                Clear all your library data, reading goals, and settings. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowFirstConfirm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  background: 'transparent',
                  color: '#ef4444',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Clear All Data
              </button>
            </div>
          </div>

          {/* Updates Section */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Download style={{ width: '20px', height: '20px', color: '#6366f1' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Updates</h3>
            </div>
            
            <div
              style={{
                background: '#1a1a26',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#f1f5f9', margin: 0, fontWeight: '500' }}>
                    Current Version: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>v{appVersion}</span>
                  </p>
                  {updateMessage && (
                    <p style={{ 
                      fontSize: '13px', 
                      color: updateStatus === 'ready' || updateStatus === 'available' ? '#10b981' : 
                             updateStatus === 'error' ? '#ef4444' : 
                             updateStatus === 'up-to-date' ? '#10b981' : '#94a3b8', 
                      margin: '4px 0 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      {updateStatus === 'up-to-date' && <CheckCircle2 style={{ width: '14px', height: '14px' }} />}
                      {updateMessage}
                    </p>
                  )}
                </div>
                
                {updateStatus === 'ready' ? (
                  <button
                    onClick={handleInstallUpdate}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                    Restart & Update
                  </button>
                ) : (
                  <button
                    onClick={handleCheckForUpdates}
                    disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#818cf8',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: updateStatus === 'checking' || updateStatus === 'downloading' ? 'not-allowed' : 'pointer',
                      opacity: updateStatus === 'checking' || updateStatus === 'downloading' ? 0.6 : 1,
                    }}
                  >
                    <RefreshCw 
                      style={{ 
                        width: '16px', 
                        height: '16px',
                        animation: updateStatus === 'checking' || updateStatus === 'downloading' ? 'spin 1s linear infinite' : 'none',
                      }} 
                    />
                    {updateStatus === 'checking' ? 'Checking...' : 
                     updateStatus === 'downloading' ? 'Downloading...' : 
                     'Check for Updates'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '12px' }}>About</h3>
            <div style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#f1f5f9' }}>Book Tracker</strong> helps you track your reading journey with detailed
                statistics and insights.
              </p>
              <p style={{ margin: 0 }}>
                Your data is stored locally on your computer. No data is sent
                to external servers except when fetching book information from Google Books API.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '16px 24px',
            background: '#0a0a0f',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '0 0 16px 16px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              background: '#1a1a26',
              color: '#94a3b8',
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#252532';
              e.currentTarget.style.color = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1a26';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* First Confirmation Dialog */}
      {showFirstConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#12121a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              margin: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                Clear All Data?
              </h3>
            </div>

            <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: 1.6 }}>
              Are you sure you want to delete all your books, reading goals, and settings? 
              This action <strong style={{ color: '#ef4444' }}>cannot be undone</strong>.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowFirstConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: '#1a1a26',
                  color: '#94a3b8',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowFirstConfirm(false);
                  setShowSecondConfirm(true);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Dialog */}
      {showSecondConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#12121a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              margin: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <Trash2 style={{ width: '24px', height: '24px', color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                Final Confirmation
              </h3>
            </div>

            <p style={{ color: '#94a3b8', marginBottom: '16px', lineHeight: 1.6 }}>
              This will permanently delete:
            </p>
            
            <ul style={{ color: '#94a3b8', marginBottom: '16px', paddingLeft: '20px' }}>
              <li>All books in your library</li>
              <li>Reading goals for all years</li>
              <li>Your Google Books API key</li>
            </ul>

            <p style={{ color: '#f1f5f9', marginBottom: '12px', fontWeight: '500' }}>
              Type <span style={{ color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>DELETE</span> to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              style={{
                ...inputStyle,
                marginBottom: '16px',
                borderColor: deleteConfirmText === 'DELETE' ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowSecondConfirm(false);
                  setDeleteConfirmText('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: '#1a1a26',
                  color: '#94a3b8',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={deleteConfirmText !== 'DELETE' || isClearing}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: deleteConfirmText === 'DELETE' 
                    ? 'linear-gradient(135deg, #ef4444, #f87171)' 
                    : '#475569',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                  opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5,
                }}
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
