import React, { useState, useMemo } from 'react';
import { 
  Star, Trash2, Edit2, ChevronUp, ChevronDown, Headphones, Smartphone, Book,
  XCircle, CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const FORMAT_LABELS = {
  physical: 'Physical',
  ebook: 'E-Book',
  audiobook: 'Audiobook',
};

const BookTable = ({ books, onDelete, onEdit }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'endDate', direction: 'desc' });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const getDateValue = (book) => {
    return book.endDate || book.dateRead || book.startDate || book.dateAdded || '';
  };

  const sortedBooks = useMemo(() => {
    const sorted = [...books].sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'title':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        case 'author':
          aVal = a.author?.toLowerCase() || '';
          bVal = b.author?.toLowerCase() || '';
          break;
        case 'genre':
          aVal = a.genre?.toLowerCase() || '';
          bVal = b.genre?.toLowerCase() || '';
          break;
        case 'pages':
          aVal = a.pages || 0;
          bVal = b.pages || 0;
          break;
        case 'rating':
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case 'price':
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case 'format':
          aVal = a.format || '';
          bVal = b.format || '';
          break;
        case 'endDate':
        default:
          aVal = getDateValue(a);
          bVal = getDateValue(b);
          break;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [books, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp style={{ width: '14px', height: '14px', opacity: 0.3 }} />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp style={{ width: '14px', height: '14px' }} />
      : <ChevronDown style={{ width: '14px', height: '14px' }} />;
  };

  const headerStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
    background: '#1a1a26',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const cellStyle = {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#f1f5f9',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    verticalAlign: 'middle',
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            style={{
              width: '12px',
              height: '12px',
              fill: star <= rating ? '#f59e0b' : 'transparent',
              color: star <= rating ? '#f59e0b' : '#475569',
            }}
          />
        ))}
      </div>
    );
  };

  const getPublishedCount = (book) => {
    return [
      book.postedGoodreads,
      book.postedInstagram,
      book.postedIgBbr,
      book.postedBlog,
      book.postedAmazon,
    ].filter(Boolean).length;
  };

  return (
    <div 
      style={{
        background: 'rgba(20, 20, 32, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: '56px' }}></th>
              <th 
                style={headerStyle}
                onClick={() => handleSort('title')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Title
                  <SortIcon columnKey="title" />
                </div>
              </th>
              <th 
                style={headerStyle}
                onClick={() => handleSort('author')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Author
                  <SortIcon columnKey="author" />
                </div>
              </th>
              <th 
                style={{ ...headerStyle, minWidth: '150px' }}
                onClick={() => handleSort('genre')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Genre
                  <SortIcon columnKey="genre" />
                </div>
              </th>
              <th 
                style={headerStyle}
                onClick={() => handleSort('format')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Format
                  <SortIcon columnKey="format" />
                </div>
              </th>
              <th 
                style={headerStyle}
                onClick={() => handleSort('pages')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Pages
                  <SortIcon columnKey="pages" />
                </div>
              </th>
              <th 
                style={headerStyle}
                onClick={() => handleSort('rating')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Rating
                  <SortIcon columnKey="rating" />
                </div>
              </th>
              <th 
                style={headerStyle}
                onClick={() => handleSort('endDate')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Date Read
                  <SortIcon columnKey="endDate" />
                </div>
              </th>
              <th 
                style={headerStyle}
                onClick={() => handleSort('price')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Price
                  <SortIcon columnKey="price" />
                </div>
              </th>
              <th style={{ ...headerStyle, width: '80px' }}>Status</th>
              <th style={{ ...headerStyle, width: '100px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedBooks.map((book, index) => {
              const publishedCount = getPublishedCount(book);
              return (
                <tr 
                  key={book.id}
                  style={{
                    background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => onEdit(book)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  {/* Cover Thumbnail */}
                  <td style={cellStyle}>
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title}
                        style={{
                          width: '40px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div 
                        style={{
                          width: '40px',
                          height: '60px',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Book style={{ width: '18px', height: '18px', color: 'white' }} />
                      </div>
                    )}
                  </td>

                  {/* Title */}
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600' }}>{book.title}</span>
                      {book.didNotFinish && (
                        <span 
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            fontWeight: '500',
                          }}
                        >
                          DNF
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Author */}
                  <td style={{ ...cellStyle, color: '#94a3b8' }}>{book.author}</td>

                  {/* Genre */}
                  <td style={cellStyle}>
                    {book.genre && (
                      <span 
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#818cf8',
                        }}
                      >
                        {book.genre}
                      </span>
                    )}
                  </td>

                  {/* Format */}
                  <td style={{ ...cellStyle, color: '#94a3b8', fontSize: '13px' }}>
                    {FORMAT_LABELS[book.format] || 'Physical'}
                  </td>

                  {/* Pages */}
                  <td style={{ ...cellStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                    {book.pages || '-'}
                  </td>

                  {/* Rating */}
                  <td style={cellStyle}>
                    {renderStars(book.rating)}
                  </td>

                  {/* Date Read */}
                  <td style={{ ...cellStyle, color: '#94a3b8', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatDate(book.endDate || book.dateRead)}
                  </td>

                  {/* Price */}
                  <td style={{ ...cellStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                    {book.price > 0 ? (
                      <span style={{ color: '#10b981' }}>${book.price.toFixed(2)}</span>
                    ) : '-'}
                  </td>

                  {/* Status */}
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {publishedCount > 0 ? (
                        <span 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: '#10b981',
                          }}
                        >
                          <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                          {publishedCount}
                        </span>
                      ) : book.reviewDrafted ? (
                        <span style={{ fontSize: '12px', color: '#f59e0b' }}>Drafted</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#475569' }}>-</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(book);
                        }}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          background: 'transparent',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1a1a26';
                          e.currentTarget.style.color = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#94a3b8';
                        }}
                      >
                        <Edit2 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(book.id);
                        }}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'transparent',
                          color: 'rgba(239, 68, 68, 0.7)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)';
                        }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookTable;

