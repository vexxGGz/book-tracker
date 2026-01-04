import React, { useState, useEffect } from 'react';
import { Target, Edit3, Check, X, Trophy, Flame, BookOpen } from 'lucide-react';
import { getYearlyGoal, setYearlyGoal } from '../utils/storage';

const ReadingGoal = ({ year, booksReadThisYear }) => {
  const [goal, setGoal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGoal();
  }, [year]);

  const loadGoal = async () => {
    setIsLoading(true);
    const yearGoal = await getYearlyGoal(year);
    setGoal(yearGoal);
    if (yearGoal) {
      setInputValue(yearGoal.target.toString());
    }
    setIsLoading(false);
  };

  const handleSaveGoal = async () => {
    const target = parseInt(inputValue);
    if (target > 0) {
      await setYearlyGoal(year, target);
      setGoal({ target, createdAt: new Date().toISOString() });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (goal) {
      setInputValue(goal.target.toString());
    }
  };

  const progress = goal ? Math.min((booksReadThisYear / goal.target) * 100, 100) : 0;
  const booksRemaining = goal ? Math.max(goal.target - booksReadThisYear, 0) : 0;
  const isComplete = goal && booksReadThisYear >= goal.target;
  const isOnTrack = goal && (() => {
    const now = new Date();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24);
    const daysPassed = (now - startOfYear) / (1000 * 60 * 60 * 24);
    const expectedBooks = (daysPassed / totalDays) * goal.target;
    return booksReadThisYear >= expectedBooks;
  })();

  // Calculate months remaining
  const monthsRemaining = () => {
    const now = new Date();
    if (now.getFullYear() !== year) return 12;
    return 12 - now.getMonth();
  };

  const booksPerMonth = booksRemaining > 0 ? (booksRemaining / monthsRemaining()).toFixed(1) : 0;

  if (isLoading) {
    return (
      <div
        style={{
          background: 'rgba(20, 20, 32, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
          animation: 'pulse 2s infinite',
        }}
      >
        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#475569' }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: isComplete 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.05))'
          : 'rgba(20, 20, 32, 0.85)',
        border: isComplete 
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: isComplete 
                ? 'linear-gradient(135deg, #10b981, #34d399)'
                : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              boxShadow: isComplete 
                ? '0 4px 16px rgba(16, 185, 129, 0.4)'
                : '0 4px 16px rgba(245, 158, 11, 0.4)',
            }}
          >
            {isComplete ? (
              <Trophy style={{ width: '20px', height: '20px', color: 'white' }} />
            ) : (
              <Target style={{ width: '20px', height: '20px', color: 'white' }} />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
              {year} Reading Challenge
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              {isComplete ? '🎉 Goal completed!' : 'Track your yearly reading goal'}
            </p>
          </div>
        </div>

        {goal && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
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
            <Edit3 style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>

      {/* Goal Setting / Display */}
      {!goal || isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            {goal ? 'Update your reading goal:' : 'How many books do you want to read this year?'}
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '200px' }}>
              <BookOpen 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '18px', 
                  height: '18px', 
                  color: '#475569' 
                }} 
              />
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onWheel={(e) => e.target.blur()}
                placeholder="12"
                min="1"
                max="500"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  borderRadius: '12px',
                  background: '#1a1a26',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f1f5f9',
                  fontSize: '18px',
                  fontWeight: '600',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGoal();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            </div>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>books</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveGoal}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Check style={{ width: '18px', height: '18px' }} />
              </button>
              {goal && (
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: '#1a1a26',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Display */}
          <div style={{ marginBottom: '20px' }}>
            {/* Big Numbers */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
              <span 
                style={{ 
                  fontSize: '48px', 
                  fontWeight: '800', 
                  fontFamily: 'JetBrains Mono, monospace',
                  color: isComplete ? '#10b981' : '#f1f5f9',
                  lineHeight: 1,
                }}
              >
                {booksReadThisYear}
              </span>
              <span style={{ fontSize: '24px', color: '#475569' }}>/</span>
              <span 
                style={{ 
                  fontSize: '24px', 
                  fontWeight: '600', 
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#94a3b8',
                }}
              >
                {goal.target}
              </span>
              <span style={{ fontSize: '14px', color: '#475569', marginLeft: '4px' }}>books</span>
            </div>

            {/* Progress Bar */}
            <div 
              style={{
                height: '12px',
                borderRadius: '9999px',
                background: '#1a1a26',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  background: isComplete
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : isOnTrack
                    ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  width: `${progress}%`,
                  transition: 'width 0.5s ease-out',
                  boxShadow: isComplete
                    ? '0 0 12px rgba(16, 185, 129, 0.5)'
                    : isOnTrack
                    ? '0 0 12px rgba(99, 102, 241, 0.5)'
                    : '0 0 12px rgba(245, 158, 11, 0.5)',
                }}
              />
            </div>

            {/* Progress Percentage */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}>
                {progress.toFixed(0)}% complete
              </span>
              {!isComplete && (
                <span 
                  style={{ 
                    fontSize: '14px', 
                    color: isOnTrack ? '#10b981' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Flame style={{ width: '14px', height: '14px' }} />
                  {isOnTrack ? 'On track!' : 'Behind schedule'}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          {!isComplete && booksRemaining > 0 && (
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div 
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#1a1a26',
                }}
              >
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 4px 0' }}>Books remaining</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                  {booksRemaining}
                </p>
              </div>
              <div 
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#1a1a26',
                }}
              >
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 4px 0' }}>Books/month needed</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                  {booksPerMonth}
                </p>
              </div>
            </div>
          )}

          {/* Completion Celebration */}
          {isComplete && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <span style={{ fontSize: '32px' }}>🏆</span>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#10b981', margin: 0 }}>
                  Congratulations!
                </p>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  You've completed your {year} reading challenge!
                  {booksReadThisYear > goal.target && (
                    <span> (+{booksReadThisYear - goal.target} bonus books!)</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReadingGoal;

