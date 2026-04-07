import React from 'react';
import { BookOpen } from 'lucide-react';

// Step weights — must sum to 100
// Steps: init(10), local storage(20), supabase(20), updates(20), ready(30)
// During an active update download the "updates" band is subdivided by download %.
export const SPLASH_STEPS = {
  init:        { progress: 10, label: 'Initializing app…' },
  localStorage:{ progress: 30, label: 'Loading local storage…' },
  supabase:    { progress: 50, label: 'Checking for Supabase…' },
  updates:     { progress: 70, label: 'Checking for updates…' },
  ready:       { progress: 100, label: 'Ready.' },
};

const SplashScreen = ({ progress, statusLabel, visible }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
          marginBottom: '32px',
        }}
      >
        <BookOpen style={{ width: '48px', height: '48px', color: 'white' }} />
      </div>

      {/* App name */}
      <h1
        style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#f1f5f9',
          fontFamily: 'Outfit, sans-serif',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px',
        }}
      >
        Book Tracker
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#475569',
          fontFamily: 'Outfit, sans-serif',
          margin: '0 0 48px 0',
        }}
      >
        Track your reading journey
      </p>

      {/* Progress bar */}
      <div
        style={{
          width: '280px',
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366f1, #818cf8)',
            borderRadius: '2px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Status label */}
      <p
        style={{
          fontSize: '13px',
          color: '#475569',
          fontFamily: 'Outfit, sans-serif',
          margin: 0,
          minHeight: '20px',
          transition: 'opacity 0.2s',
        }}
      >
        {statusLabel}
      </p>
    </div>
  );
};

export default SplashScreen;
