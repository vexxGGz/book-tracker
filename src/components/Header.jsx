import React from 'react';
import { BookOpen, Plus, BarChart3, Library, Settings } from 'lucide-react';

const Header = ({ currentView, onViewChange, onAddBook, onOpenSettings }) => {
  return (
    <header 
      style={{
        background: 'rgba(20, 20, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
          {/* Logo and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              }}
            >
              <BookOpen style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 
                style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#f1f5f9',
                  fontFamily: 'Outfit, sans-serif',
                  margin: 0,
                }}
              >
                Book Tracker
              </h1>
              <p 
                style={{ 
                  fontSize: '12px', 
                  color: '#94a3b8',
                  fontFamily: 'Outfit, sans-serif',
                  margin: 0,
                }}
              >
                Track your reading journey
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onViewChange('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '600',
                fontSize: '14px',
                background: currentView === 'dashboard' 
                  ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                  : '#1a1a26',
                color: currentView === 'dashboard' ? 'white' : '#94a3b8',
                boxShadow: currentView === 'dashboard' ? '0 4px 16px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              <BarChart3 style={{ width: '20px', height: '20px' }} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onViewChange('library')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '600',
                fontSize: '14px',
                background: currentView === 'library' 
                  ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                  : '#1a1a26',
                color: currentView === 'library' ? 'white' : '#94a3b8',
                boxShadow: currentView === 'library' ? '0 4px 16px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              <Library style={{ width: '20px', height: '20px' }} />
              <span>Library</span>
            </button>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onOpenSettings}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                background: '#1a1a26',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              title="Settings"
            >
              <Settings style={{ width: '20px', height: '20px' }} />
            </button>

            <button
              onClick={onAddBook}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '600',
                fontSize: '14px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
              <span>Add Book</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
