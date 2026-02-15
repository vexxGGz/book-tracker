import React, { useMemo, useState } from 'react';
import BookCard from './BookCard';
import BookTable from './BookTable';
import EditBookModal from './EditBookModal';
import CSVImportModal from './CSVImportModal';
import { filterBooksByYear, getAvailableYears } from '../utils/analytics';
import { exportBooksAsCSV } from '../utils/storage';
import { BookOpen, Filter, X, Search, LayoutGrid, List, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

const FORMATS = [
  { value: '', label: 'All Formats' },
  { value: 'physical', label: 'Physical' },
  { value: 'ebook', label: 'E-Book' },
  { value: 'audiobook', label: 'Audiobook' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All Books' },
  { value: 'finished', label: 'Finished' },
  { value: 'dnf', label: 'Did Not Finish' },
];

const RATING_FILTERS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '★★★★★ (5)' },
  { value: '4', label: '★★★★☆ (4+)' },
  { value: '3', label: '★★★☆☆ (3+)' },
  { value: '2', label: '★★☆☆☆ (2+)' },
  { value: '1', label: '★☆☆☆☆ (1+)' },
  { value: '0', label: 'Unrated' },
];

const selectStyles = {
  padding: '8px 16px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  fontSize: '14px',
};

const BookGrid = ({ books, selectedYear, onYearChange, onDeleteBook, onRefresh }) => {
  const [editingBook, setEditingBook] = useState(null);
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showImportModal, setShowImportModal] = useState(false);

  // Helper function to normalize search text (makes "and" / "&" interchangeable)
  const normalizeSearchText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/\s+&\s+/g, ' and ')
      .replace(/\s+and\s+/g, ' and ');
  };

  const filteredBooks = useMemo(() => {
    let result = filterBooksByYear(books, selectedYear);
    
    if (formatFilter) {
      result = result.filter(book => book.format === formatFilter);
    }
    
    if (statusFilter === 'dnf') {
      result = result.filter(book => book.didNotFinish);
    } else if (statusFilter === 'finished') {
      result = result.filter(book => !book.didNotFinish);
    }
    
    // Rating filter
    if (ratingFilter !== '') {
      const ratingValue = parseInt(ratingFilter);
      if (ratingValue === 0) {
        result = result.filter(book => !book.rating || book.rating === 0);
      } else {
        result = result.filter(book => book.rating >= ratingValue);
      }
    }
    
    // Author filter
    if (authorFilter) {
      result = result.filter(book => 
        book.author?.toLowerCase().includes(authorFilter.toLowerCase())
      );
    }
    
    // Start Date range filter
    if (startDateFrom) {
      result = result.filter(book => {
        if (!book.startDate) return false;
        return book.startDate >= startDateFrom;
      });
    }
    if (startDateTo) {
      result = result.filter(book => {
        if (!book.startDate) return false;
        return book.startDate <= startDateTo;
      });
    }
    
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeSearchText(searchQuery);
      result = result.filter(book => 
        normalizeSearchText(book.title).includes(normalizedQuery) ||
        normalizeSearchText(book.author).includes(normalizedQuery) ||
        normalizeSearchText(book.genre).includes(normalizedQuery) ||
        normalizeSearchText(book.narrator).includes(normalizedQuery)
      );
    }
    
    return result;
  }, [books, selectedYear, formatFilter, statusFilter, ratingFilter, authorFilter, startDateFrom, startDateTo, searchQuery]);

  // Get unique authors for the author filter dropdown
  const uniqueAuthors = useMemo(() => {
    const authors = new Set();
    filterBooksByYear(books, selectedYear).forEach(book => {
      if (book.author) authors.add(book.author);
    });
    return Array.from(authors).sort();
  }, [books, selectedYear]);

  // Count of finished books (excludes DNFs)
  const finishedBooksCount = useMemo(() => {
    return filteredBooks.filter(book => !book.didNotFinish).length;
  }, [filteredBooks]);

  const availableYears = useMemo(() => {
    return getAvailableYears(books);
  }, [books]);

  const handleEdit = (book) => {
    setEditingBook(book);
  };

  const handleEditClose = () => {
    setEditingBook(null);
  };

  const handleEditComplete = () => {
    setEditingBook(null);
    onRefresh();
  };

  const clearFilters = () => {
    setFormatFilter('');
    setStatusFilter('');
    setRatingFilter('');
    setAuthorFilter('');
    setStartDateFrom('');
    setStartDateTo('');
    setSearchQuery('');
  };

  const hasActiveFilters = formatFilter || statusFilter || ratingFilter || authorFilter || startDateFrom || startDateTo || searchQuery;

  if (books.length === 0) {
    return (
      <>
        <div 
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            background: 'rgba(20, 20, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
          }}
        >
          <BookOpen style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#475569' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#f1f5f9' }}>No books yet</h3>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Start tracking your reading journey by adding your first book!</p>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Upload style={{ width: '18px', height: '18px' }} />
            Import from CSV
          </button>
        </div>

        {/* CSV Import Modal */}
        {showImportModal && (
          <CSVImportModal
            onClose={() => setShowImportModal(false)}
            onImportComplete={onRefresh}
          />
        )}
      </>
    );
  }

  return (
    <div>
      {/* Header with Year Filter */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
              My Library
            </h2>
            <p style={{ fontSize: '14px', marginTop: '4px', color: '#94a3b8' }}>
              {finishedBooksCount} {finishedBooksCount === 1 ? 'book' : 'books'} 
              {hasActiveFilters ? ' (filtered)' : ` in ${selectedYear}`}
              {filteredBooks.length !== finishedBooksCount && (
                <span style={{ color: '#475569' }}> • {filteredBooks.length - finishedBooksCount} DNF</span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Import/Export */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: '#1a1a26',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
                title="Import CSV"
              >
                <Upload style={{ width: '16px', height: '16px' }} />
                <span>Import</span>
              </button>
              <button
                onClick={exportBooksAsCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: '#1a1a26',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
                title="Export CSV"
              >
                <Download style={{ width: '16px', height: '16px' }} />
                <span>Export</span>
              </button>
            </div>

            {/* View Toggle */}
            <div 
              style={{
                display: 'flex',
                background: '#1a1a26',
                borderRadius: '10px',
                padding: '4px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'cards' 
                    ? 'linear-gradient(135deg, #6366f1, #818cf8)' 
                    : 'transparent',
                  color: viewMode === 'cards' ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Card View"
              >
                <LayoutGrid style={{ width: '18px', height: '18px' }} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'table' 
                    ? 'linear-gradient(135deg, #6366f1, #818cf8)' 
                    : 'transparent',
                  color: viewMode === 'table' ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Table View"
              >
                <List style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search 
                style={{ 
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#475569',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books..."
                style={{
                  width: '200px',
                  padding: '10px 32px 10px 40px',
                  borderRadius: '10px',
                  background: '#1a1a26',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ 
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                background: showFilters || hasActiveFilters 
                  ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                  : '#1a1a26',
                color: showFilters || hasActiveFilters ? 'white' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              <Filter style={{ width: '16px', height: '16px' }} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span 
                  style={{ 
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                  }}
                ></span>
              )}
            </button>

            {/* Year Navigation */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: '#1a1a26',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '4px',
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
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
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
                <ChevronLeft style={{ width: '18px', height: '18px' }} />
              </button>

              <span 
                style={{ 
                  minWidth: '60px',
                  textAlign: 'center',
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#f1f5f9',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {selectedYear || new Date().getFullYear()}
              </span>

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
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
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
                <ChevronRight style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div 
            style={{
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(20, 20, 32, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* First row of filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#1a1a26',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f1f5f9',
                  fontSize: '14px',
                }}
              >
                {FORMATS.map(f => (
                  <option key={f.value} value={f.value} style={{ background: '#1a1a26' }}>{f.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#1a1a26',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f1f5f9',
                  fontSize: '14px',
                }}
              >
                {STATUS_FILTERS.map(s => (
                  <option key={s.value} value={s.value} style={{ background: '#1a1a26' }}>{s.label}</option>
                ))}
              </select>

              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#1a1a26',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f1f5f9',
                  fontSize: '14px',
                }}
              >
                {RATING_FILTERS.map(r => (
                  <option key={r.value} value={r.value} style={{ background: '#1a1a26' }}>{r.label}</option>
                ))}
              </select>

              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#1a1a26',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  maxWidth: '200px',
                }}
              >
                <option value="" style={{ background: '#1a1a26' }}>All Authors</option>
                {uniqueAuthors.map(author => (
                  <option key={author} value={author} style={{ background: '#1a1a26' }}>{author}</option>
                ))}
              </select>
            </div>

            {/* Second row - Date Started range */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Date Started:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  value={startDateFrom}
                  onChange={(e) => setStartDateFrom(e.target.value)}
                  placeholder="From"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: '#1a1a26',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    colorScheme: 'dark',
                  }}
                />
                <span style={{ color: '#475569' }}>→</span>
                <input
                  type="date"
                  value={startDateTo}
                  onChange={(e) => setStartDateTo(e.target.value)}
                  placeholder="To"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: '#1a1a26',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Books Display */}
      {filteredBooks.length === 0 ? (
        <div 
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            background: 'rgba(20, 20, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
          }}
        >
          <BookOpen style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#475569' }} />
          <p style={{ color: '#94a3b8' }}>
            {hasActiveFilters 
              ? 'No books match your filters' 
              : `No books read in ${selectedYear}`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: '16px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                background: '#1a1a26',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <BookTable
          books={filteredBooks}
          onDelete={onDeleteBook}
          onEdit={handleEdit}
        />
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredBooks.map((book, index) => (
            <div 
              key={book.id}
              style={{ 
                animationDelay: `${index * 0.05}s`,
                height: '100%',
              }}
            >
              <BookCard
                book={book}
                onDelete={onDeleteBook}
                onEdit={handleEdit}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={handleEditClose}
          onBookUpdated={handleEditComplete}
        />
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={onRefresh}
        />
      )}
    </div>
  );
};

export default BookGrid;
