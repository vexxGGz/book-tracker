import React from 'react';
import { Minus, Square, X, BookOpen } from 'lucide-react';

const TitleBar = () => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const handleMinimize = () => {
    if (isElectron) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (isElectron) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (isElectron) {
      window.electronAPI.closeWindow();
    }
  };

  // Don't render titlebar if not in Electron
  if (!isElectron) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 50,
        userSelect: 'none',
        background: '#12121a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* App Icon and Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          style={{
            padding: '4px',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          }}
        >
          <BookOpen style={{ width: '12px', height: '12px', color: 'white' }} />
        </div>
        <span 
          style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#f1f5f9',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          Book Tracker
        </span>
      </div>

      {/* Window Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1a1a26';
            e.currentTarget.style.color = '#f59e0b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#475569';
          }}
          title="Minimize"
        >
          <Minus style={{ width: '16px', height: '16px' }} />
        </button>
        <button
          onClick={handleMaximize}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1a1a26';
            e.currentTarget.style.color = '#6366f1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#475569';
          }}
          title="Maximize"
        >
          <Square style={{ width: '14px', height: '14px' }} />
        </button>
        <button
          onClick={handleClose}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#475569';
          }}
          title="Close"
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
