import React, { useMemo } from 'react';
import {
  filterBooksByYear,
  getTotalBooks,
  getTotalPages,
  getAveragePages,
  getTotalValue,
  getTopAuthors,
  getTopGenres,
  getBooksByMonth,
  getHighestRatedBooks,
  getReadingPace,
  getAvailableYears,
} from '../utils/analytics';
import { BookOpen, FileText, TrendingUp, DollarSign, Award, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import MonthlyChart from './stats/MonthlyChart';
import TopAuthorsChart from './stats/TopAuthorsChart';
import TopGenresChart from './stats/TopGenresChart';
import ReadingGoal from './ReadingGoal';

const cardStyle = {
  background: 'rgba(20, 20, 32, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '16px',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

const Dashboard = ({ books, selectedYear, onYearChange }) => {
  const filteredBooks = useMemo(() => {
    return filterBooksByYear(books, selectedYear);
  }, [books, selectedYear]);

  const stats = useMemo(() => {
    return {
      totalBooks: getTotalBooks(filteredBooks),
      totalPages: getTotalPages(filteredBooks),
      averagePages: getAveragePages(filteredBooks),
      totalValue: getTotalValue(filteredBooks),
      topAuthors: getTopAuthors(filteredBooks, 5),
      topGenres: getTopGenres(filteredBooks, 5),
      monthlyData: getBooksByMonth(filteredBooks),
      highestRated: getHighestRatedBooks(filteredBooks, 5),
      readingPace: getReadingPace(filteredBooks),
    };
  }, [filteredBooks]);

  const availableYears = useMemo(() => {
    return getAvailableYears(books);
  }, [books]);

  if (books.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '64px 32px' }}>
        <BarChart3 style={{ width: '64px', height: '64px', color: '#475569', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px' }}>No data to display</h3>
        <p style={{ color: '#94a3b8' }}>Add some books to see your reading statistics!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Year Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '30px', fontWeight: '700', color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
            Year in Review
          </h2>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>Your reading journey for {selectedYear}</p>
        </div>

        {/* Year Navigation */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(20, 20, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            padding: '8px',
          }}
        >
          <button
            onClick={() => {
              const currentIndex = availableYears.indexOf(selectedYear);
              if (currentIndex >= 0 && currentIndex < availableYears.length - 1) {
                onYearChange(availableYears[currentIndex + 1]);
              }
            }}
            disabled={availableYears.length <= 1 || availableYears.indexOf(selectedYear) === availableYears.length - 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background: availableYears.length <= 1 || availableYears.indexOf(selectedYear) === availableYears.length - 1 
                ? 'transparent' 
                : '#1a1a26',
              color: availableYears.length <= 1 || availableYears.indexOf(selectedYear) === availableYears.length - 1 
                ? '#475569' 
                : '#f1f5f9',
              cursor: availableYears.length <= 1 || availableYears.indexOf(selectedYear) === availableYears.length - 1 
                ? 'not-allowed' 
                : 'pointer',
              transition: 'all 0.2s',
            }}
            title="Previous Year"
          >
            <ChevronLeft style={{ width: '24px', height: '24px' }} />
          </button>

          <div 
            style={{ 
              minWidth: '100px', 
              textAlign: 'center',
              padding: '8px 16px',
            }}
          >
            <span 
              style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#f1f5f9',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {selectedYear || new Date().getFullYear()}
            </span>
          </div>

          <button
            onClick={() => {
              const currentIndex = availableYears.indexOf(selectedYear);
              if (currentIndex > 0) {
                onYearChange(availableYears[currentIndex - 1]);
              }
            }}
            disabled={availableYears.length <= 1 || availableYears.indexOf(selectedYear) <= 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background: availableYears.length <= 1 || availableYears.indexOf(selectedYear) <= 0 
                ? 'transparent' 
                : '#1a1a26',
              color: availableYears.length <= 1 || availableYears.indexOf(selectedYear) <= 0 
                ? '#475569' 
                : '#f1f5f9',
              cursor: availableYears.length <= 1 || availableYears.indexOf(selectedYear) <= 0 
                ? 'not-allowed' 
                : 'pointer',
              transition: 'all 0.2s',
            }}
            title="Next Year"
          >
            <ChevronRight style={{ width: '24px', height: '24px' }} />
          </button>
        </div>
      </div>

      {/* Reading Goal */}
      <ReadingGoal year={selectedYear} booksReadThisYear={stats.totalBooks} />

      {/* Main Stats Cards - 5 cards in one row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard
          icon={<BookOpen style={{ width: '24px', height: '24px' }} />}
          label="Books Read"
          value={stats.totalBooks}
          gradient="linear-gradient(135deg, #6366f1, #818cf8)"
          glow="rgba(99, 102, 241, 0.4)"
        />
        <StatCard
          icon={<FileText style={{ width: '24px', height: '24px' }} />}
          label="Total Pages"
          value={stats.totalPages.toLocaleString()}
          gradient="linear-gradient(135deg, #10b981, #34d399)"
          glow="rgba(16, 185, 129, 0.4)"
        />
        <StatCard
          icon={<BarChart3 style={{ width: '24px', height: '24px' }} />}
          label="Avg Pages"
          value={stats.averagePages}
          gradient="linear-gradient(135deg, #06b6d4, #22d3ee)"
          glow="rgba(6, 182, 212, 0.4)"
        />
        <StatCard
          icon={<TrendingUp style={{ width: '24px', height: '24px' }} />}
          label="Reading Pace"
          value={stats.readingPace}
          subtitle="/month"
          gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)"
          glow="rgba(139, 92, 246, 0.4)"
        />
        <StatCard
          icon={<DollarSign style={{ width: '24px', height: '24px' }} />}
          label="Total Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          gradient="linear-gradient(135deg, #f59e0b, #fbbf24)"
          glow="rgba(245, 158, 11, 0.4)"
        />
      </div>

      {/* Monthly Chart */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '16px' }}>Books Per Month</h3>
        <MonthlyChart data={stats.monthlyData} />
      </div>

      {/* Top Authors and Genres */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '16px' }}>Top Authors</h3>
          <TopAuthorsChart data={stats.topAuthors} />
        </div>

        <div style={{ ...cardStyle, padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '16px' }}>Top Genres</h3>
          <TopGenresChart data={stats.topGenres} />
        </div>
      </div>

      {/* Highest Rated Books */}
      {stats.highestRated.length > 0 && (
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Highest Rated Books</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.highestRated.map((book, index) => (
              <div 
                key={book.id} 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#1a1a26',
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: '600', color: '#f1f5f9', margin: 0 }}>{book.title}</h4>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>{book.author}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < book.rating ? '#f59e0b' : '#475569' }}>★</span>
                      ))}
                    </div>
                    <span style={{ fontSize: '14px', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                      ({book.rating}/5)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, subtitle, gradient, glow }) => {
  return (
    <div style={{ ...cardStyle, padding: '20px' }}>
      <div 
        style={{
          display: 'inline-flex',
          padding: '10px',
          borderRadius: '12px',
          marginBottom: '12px',
          background: gradient,
          boxShadow: `0 4px 16px ${glow}`,
          color: 'white',
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
          {value}
        </p>
        {subtitle && (
          <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
