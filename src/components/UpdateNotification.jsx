import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, CheckCircle2 } from 'lucide-react';

const UpdateNotification = () => {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only set up listeners if running in Electron
    if (!window.electronAPI?.onUpdateStatus) return;

    // Listen for update status changes
    window.electronAPI.onUpdateStatus((data) => {
      setUpdateStatus(data.status);
      if (data.data) {
        setUpdateInfo(data.data);
      }
    });

    // Listen for update ready
    window.electronAPI.onUpdateReady((info) => {
      setUpdateInfo(info);
      setUpdateStatus('ready');
      setDismissed(false); // Show notification when update is ready
    });

    return () => {
      window.electronAPI.removeUpdateListeners?.();
    };
  }, []);

  const handleInstall = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show anything if no update ready or dismissed
  if (updateStatus !== 'ready' || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CheckCircle2 style={{ width: '24px', height: '24px', color: 'white' }} />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: '600', color: 'white', margin: 0 }}>
          Update Available!
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', margin: '4px 0 0 0' }}>
          Version {updateInfo?.version || 'new'} is ready to install
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstall}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: 'white',
            color: '#059669',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          Restart
        </button>
        
        <button
          onClick={handleDismiss}
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;

