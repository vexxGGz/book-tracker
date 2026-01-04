import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, BookOpen, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { updateBook } from '../utils/storage';
import { searchBookByISBN } from '../utils/bookApi';

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

const EditBookModal = ({ book, onClose, onBookUpdated }) => {
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
    startDate: '',
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

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showPublishingSection, setShowPublishingSection] = useState(false);

  // Load book data into form
  useEffect(() => {
    if (book) {
      const hasPaidValue = book.hasPaid !== undefined ? book.hasPaid : (book.price > 0);
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        genre: book.genre || '',
        pages: book.pages || '',
        coverUrl: book.coverUrl || '',
        format: book.format || 'physical',
        narrator: book.narrator || '',
        source: book.source || '',
        hasPaid: hasPaidValue,
        price: book.price || '',
        startDate: book.startDate || '',
        endDate: book.endDate || book.dateRead || '',
        rating: book.rating || 5,
        didNotFinish: book.didNotFinish || false,
        dnfReason: book.dnfReason || '',
        review: book.review || '',
        authorInstagram: book.authorInstagram || '',
        reviewDrafted: book.reviewDrafted || false,
        postedGoodreads: book.postedGoodreads || false,
        postedInstagram: book.postedInstagram || false,
        postedIgBbr: book.postedIgBbr || false,
        postedBlog: book.postedBlog || false,
        postedAmazon: book.postedAmazon || false,
        amazonApproved: book.amazonApproved || false,
      });

      // Show publishing section if any publishing field is true
      if (book.reviewDrafted || book.postedGoodreads || book.postedInstagram ||
          book.postedIgBbr || book.postedBlog || book.postedAmazon || book.amazonApproved) {
        setShowPublishingSection(true);
      }
    }
  }, [book]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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

    const updatedBook = {
      ...formData,
      pages: parseInt(formData.pages) || 0,
      price: formData.hasPaid ? (parseFloat(formData.price) || 0) : 0,
      rating: parseInt(formData.rating) || 0,
    };

    await updateBook(book.id, updatedBook);
    onBookUpdated();
    onClose();
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
                background: 'linear-gradient(135deg, #10b981, #34d399)',
              }}
            >
              <BookOpen style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Edit Book
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
          
          {/* ISBN Search */}
          <div>
            <label style={labelStyle}>ISBN (Lookup by ISBN)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder="978-0-123456-78-9"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
            {searchError && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#ef4444' }}>{searchError}</p>
            )}
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
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
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
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                e.target.style.borderColor = '#10b981';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                e.target.style.borderColor = '#10b981';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.3)';
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
                    style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
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
                          style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <Save style={{ width: '18px', height: '18px' }} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookModal;
