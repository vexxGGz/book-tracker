import React, { useState } from 'react';
import { X, Search, Loader2, BookOpen, ChevronDown, ChevronUp, Book, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { addBook, checkDuplicate } from '../utils/storage';
import { searchBookByISBN, searchBooks } from '../utils/bookApi';

const FORMATS = [
  { value: 'physical', label: 'Physical Book' },
  { value: 'ebook', label: 'E-Reader / Kindle' },
  { value: 'audiobook', label: 'Audiobook' },
];

const SOURCES = [
  { value: '', label: 'Select source...' },
  { value: 'Amazon', label: 'Amazon' },
  { value: 'Audible', label: 'Audible' },
  { value: 'Kindle', label: 'Kindle Store' },
  { value: 'Apple Books', label: 'Apple Books' },
  { value: 'Google Play', label: 'Google Play Books' },
  { value: 'Barnes & Noble', label: 'Barnes & Noble' },
  { value: 'Library', label: 'Library' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Thrift Store', label: 'Thrift Store' },
  { value: 'Other', label: 'Other' },
];

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

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#94a3b8',
  marginBottom: '8px',
};

// Prevent scroll on number inputs
const preventScroll = (e) => {
  e.target.blur();
};

const AddBookModal = ({ onClose, onBookAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    pages: '',
    coverUrl: '',
    format: 'physical',
    narrator: '',
    source: '',
    hasPaid: false,
    price: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    rating: 5,
    didNotFinish: false,
    dnfReason: '',
    review: '',
    authorInstagram: '',
    reviewDrafted: false,
    postedGoodreads: false,
    postedInstagram: false,
    postedIgBbr: false,
    postedBlog: false,
    postedAmazon: false,
    amazonApproved: false,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const [showPublishingSection, setShowPublishingSection] = useState(false);
  const [duplicateBook, setDuplicateBook] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingBook, setPendingBook] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Search for books by title/author
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
      setShowResults(true);
      
      if (results.length === 0) {
        setSearchError('No books found. Try a different search term.');
      }
    } catch (error) {
      setSearchError('Error searching books. Please try again.');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a book from search results
  const handleSelectBook = (book) => {
    setFormData(prev => ({
      ...prev,
      title: book.title || prev.title,
      author: book.author || prev.author,
      isbn: book.isbn || prev.isbn,
      genre: book.genre || prev.genre,
      pages: book.pages || prev.pages,
      price: book.price || prev.price,
      hasPaid: book.price ? true : prev.hasPaid,
      coverUrl: book.coverUrl || prev.coverUrl,
    }));
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle ISBN search
  const handleSearchISBN = async () => {
    if (!formData.isbn) {
      setSearchError('Please enter an ISBN');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const bookData = await searchBookByISBN(formData.isbn);

      if (bookData) {
        setFormData(prev => ({
          ...prev,
          title: bookData.title || prev.title,
          author: bookData.author || prev.author,
          genre: bookData.genre || prev.genre,
          pages: bookData.pages || prev.pages,
          price: bookData.price || prev.price,
          hasPaid: bookData.price ? true : prev.hasPaid,
          coverUrl: bookData.coverUrl || prev.coverUrl,
        }));
        setSearchError('');
      } else {
        setSearchError('Book not found. Please enter details manually.');
      }
    } catch (error) {
      setSearchError('Error fetching book data. Please try again or enter manually.');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.author) {
      alert('Please fill in at least the title and author');
      return;
    }

    const newBook = {
      id: uuidv4(),
      ...formData,
      pages: parseInt(formData.pages) || 0,
      price: formData.hasPaid ? (parseFloat(formData.price) || 0) : 0,
      rating: parseInt(formData.rating) || 0,
      currency: 'USD',
      dateAdded: new Date().toISOString(),
    };

    // Check for duplicate (include year - re-reads in different years are not duplicates)
    const bookYear = newBook.endDate ? parseInt(newBook.endDate.split('-')[0]) : 
                     newBook.startDate ? parseInt(newBook.startDate.split('-')[0]) : 
                     new Date().getFullYear();
    const duplicate = await checkDuplicate(formData.title, formData.author, bookYear);
    if (duplicate) {
      setDuplicateBook(duplicate);
      setPendingBook(newBook);
      setShowDuplicateWarning(true);
      return;
    }

    await addBook(newBook);
    onBookAdded();
    onClose();
  };

  const handleAddDuplicate = async () => {
    if (pendingBook) {
      await addBook(pendingBook);
      onBookAdded();
      onClose();
    }
  };

  const handleSkipDuplicate = () => {
    setShowDuplicateWarning(false);
    setDuplicateBook(null);
    setPendingBook(null);
  };

  const isAudiobook = formData.format === 'audiobook';

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
      <div
        style={{
          background: '#12121a',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          maxWidth: '768px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            position: 'sticky',
            top: 0,
            background: '#12121a',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                padding: '8px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              }}
            >
              <BookOpen style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Add New Book
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#475569',
              cursor: 'pointer',
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
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Book Search Section */}
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Search style={{ width: '18px', height: '18px', color: '#818cf8' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
                Search for a Book
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Search by title or author to auto-fill book details
            </p>
            
            <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="e.g. The Great Gatsby, Stephen King..."
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  opacity: isSearching ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                {isSearching ? (
                  <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Search style={{ width: '18px', height: '18px' }} />
                )}
                <span>Search</span>
              </button>
            </div>

            {/* Search Results */}
            {showResults && searchResults.length > 0 && (
              <div 
                style={{
                  marginTop: '12px',
                  background: '#0a0a0f',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Found {searchResults.length} results
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResults(false);
                      setSearchResults([]);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: '#475569',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Close
                  </button>
                </div>
                {searchResults.map((book, index) => (
                  <div
                    key={book.googleBooksId || index}
                    onClick={() => handleSelectBook(book)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: index < searchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div 
                      style={{
                        width: '48px',
                        height: '72px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: '#1a1a26',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {book.coverUrl ? (
                        <img 
                          src={book.coverUrl} 
                          alt={book.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Book style={{ width: '24px', height: '24px', color: '#475569' }} />
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#f1f5f9', 
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {book.title}
                      </h4>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#94a3b8', 
                        margin: '4px 0 0 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        by {book.author}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        {book.pages > 0 && (
                          <span style={{ fontSize: '12px', color: '#475569' }}>
                            {book.pages} pages
                          </span>
                        )}
                        {book.genre && (
                          <span style={{ fontSize: '12px', color: '#6366f1' }}>
                            {book.genre}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: '#6366f1',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}>
                      Select →
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchError && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#ef4444' }}>{searchError}</p>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
            <span style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              or enter details manually
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
          </div>

          {/* ISBN Search */}
          <div>
            <label style={labelStyle}>ISBN (Optional - Lookup by ISBN)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder="978-0-123456-78-9"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={handleSearchISBN}
                disabled={isSearching}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: '#1a1a26',
                  color: '#94a3b8',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  opacity: isSearching ? 0.6 : 1,
                }}
              >
                {isSearching ? (
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Search style={{ width: '16px', height: '16px' }} />
                )}
                <span>Lookup</span>
              </button>
            </div>
          </div>

          {/* Title & Author */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="The Great Gatsby"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Author *</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                placeholder="F. Scott Fitzgerald"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Format & Source */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Format *</label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                style={inputStyle}
              >
                {FORMATS.map(f => (
                  <option key={f.value} value={f.value} style={{ background: '#1a1a26' }}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                style={inputStyle}
              >
                {SOURCES.map(s => (
                  <option key={s.value} value={s.value} style={{ background: '#1a1a26' }}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Narrator (only for audiobooks) */}
          {isAudiobook && (
            <div>
              <label style={labelStyle}>Narrator</label>
              <input
                type="text"
                name="narrator"
                value={formData.narrator}
                onChange={handleInputChange}
                placeholder="Jim Dale"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          {/* Genre & Pages */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Genre</label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                placeholder="Fiction"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Pages</label>
              <input
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleInputChange}
                onWheel={preventScroll}
                placeholder="200"
                min="0"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Price with checkbox */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                name="hasPaid"
                checked={formData.hasPaid}
                onChange={handleInputChange}
                style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
              />
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>I paid for this book</span>
            </label>
            {formData.hasPaid && (
              <div style={{ marginTop: '8px' }}>
                <label style={labelStyle}>Price (USD)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  onWheel={preventScroll}
                  placeholder="15.99"
                  step="0.01"
                  min="0"
                  style={{ ...inputStyle, maxWidth: '200px' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Cover URL */}
          <div>
            <label style={labelStyle}>Cover Image URL</label>
            <input
              type="url"
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/book-cover.jpg"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {formData.coverUrl && (
              <div style={{ marginTop: '8px' }}>
                <img
                  src={formData.coverUrl}
                  alt="Cover preview"
                  style={{
                    width: '80px',
                    height: '112px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>

          {/* Reading Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label style={labelStyle}>Rating</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: star <= formData.rating 
                      ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                      : '#1a1a26',
                    color: star <= formData.rating ? 'white' : '#475569',
                    boxShadow: star <= formData.rating ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none',
                    transform: star <= formData.rating ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Did Not Finish */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="didNotFinish"
                checked={formData.didNotFinish}
                onChange={handleInputChange}
                style={{ width: '20px', height: '20px', accentColor: '#ef4444' }}
              />
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Did Not Finish (DNF)</span>
            </label>
            
            {formData.didNotFinish && (
              <div>
                <label style={labelStyle}>Reason for not finishing</label>
                <textarea
                  name="dnfReason"
                  value={formData.dnfReason}
                  onChange={handleInputChange}
                  placeholder="Why did you stop reading this book?"
                  rows="2"
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Review */}
          <div>
            <label style={labelStyle}>Review / Notes</label>
            <textarea
              name="review"
              value={formData.review}
              onChange={handleInputChange}
              placeholder="Your thoughts about the book..."
              rows="3"
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Author Instagram */}
          <div>
            <label style={labelStyle}>Author's Instagram</label>
            <div style={{ display: 'flex' }}>
              <span 
                style={{
                  padding: '12px',
                  borderRadius: '10px 0 0 10px',
                  background: '#1a1a26',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRight: 'none',
                  color: '#475569',
                }}
              >
                @
              </span>
              <input
                type="text"
                name="authorInstagram"
                value={formData.authorInstagram}
                onChange={handleInputChange}
                placeholder="authorhandle"
                style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Publishing Tracking Section */}
          <div 
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              type="button"
              onClick={() => setShowPublishingSection(!showPublishingSection)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                border: 'none',
                background: '#1a1a26',
                color: '#94a3b8',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '500',
              }}
            >
              <span>Review Publishing Tracker</span>
              {showPublishingSection ? (
                <ChevronUp style={{ width: '20px', height: '20px' }} />
              ) : (
                <ChevronDown style={{ width: '20px', height: '20px' }} />
              )}
            </button>
            
            {showPublishingSection && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#12121a' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="reviewDrafted"
                    checked={formData.reviewDrafted}
                    onChange={handleInputChange}
                    style={{ width: '20px', height: '20px', accentColor: '#6366f1' }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Review Drafted</span>
                </label>

                <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '8px' }}>Posted To:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { name: 'postedGoodreads', label: 'Goodreads' },
                      { name: 'postedInstagram', label: 'Instagram' },
                      { name: 'postedIgBbr', label: 'IG BBR' },
                      { name: 'postedBlog', label: 'Blog' },
                    ].map(item => (
                      <label key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name={item.name}
                          checked={formData[item.name]}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                        />
                        <span style={{ color: '#94a3b8', fontSize: '14px' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '8px' }}>Amazon Review:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="postedAmazon"
                        checked={formData.postedAmazon}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                      />
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>Posted to Amazon</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="amazonApproved"
                        checked={formData.amazonApproved}
                        onChange={handleInputChange}
                        style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                      />
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>Amazon Approved</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div 
            style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
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
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              Add Book
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Warning Dialog */}
      {showDuplicateWarning && duplicateBook && (
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
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              margin: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                }}
              >
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                Duplicate Book Found
              </h3>
            </div>

            <p style={{ color: '#94a3b8', marginBottom: '16px', lineHeight: 1.6 }}>
              A book with the same title and author already exists in your library:
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: '#1a1a26',
                marginBottom: '20px',
              }}
            >
              {duplicateBook.coverUrl && (
                <img
                  src={duplicateBook.coverUrl}
                  alt={duplicateBook.title}
                  style={{
                    width: '48px',
                    height: '72px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                  }}
                />
              )}
              <div>
                <p style={{ fontWeight: '600', color: '#f1f5f9', margin: 0 }}>
                  {duplicateBook.title}
                </p>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  by {duplicateBook.author}
                </p>
                {duplicateBook.rating > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < duplicateBook.rating ? '#f59e0b' : '#475569' }}>★</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Do you want to add this book anyway?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSkipDuplicate}
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
                Skip
              </button>
              <button
                onClick={handleAddDuplicate}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBookModal;
