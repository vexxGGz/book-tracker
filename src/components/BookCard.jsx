import React from 'react';
import { 
  Star, Trash2, BookOpen, DollarSign, Headphones, Smartphone, Book, 
  Calendar, Edit2, Instagram, XCircle, CheckCircle2, Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const FORMAT_ICONS = {
  physical: Book,
  ebook: Smartphone,
  audiobook: Headphones,
};

const FORMAT_LABELS = {
  physical: 'Physical',
  ebook: 'E-Book',
  audiobook: 'Audiobook',
};

const cardStyle = {
  background: 'rgba(20, 20, 32, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '16px',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const BookCard = ({ book, onDelete, onEdit }) => {
  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            style={{
              width: '14px',
              height: '14px',
              fill: star <= rating ? '#f59e0b' : 'transparent',
              color: star <= rating ? '#f59e0b' : '#475569',
            }}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return null;
    }
  };

  const endDate = formatDate(book.endDate) || formatDate(book.dateRead);
  const startDate = formatDate(book.startDate);
  
  const FormatIcon = FORMAT_ICONS[book.format] || Book;
  const formatLabel = FORMAT_LABELS[book.format] || 'Physical';

  // Count how many platforms the review was posted to
  const publishedCount = [
    book.postedGoodreads,
    book.postedInstagram,
    book.postedIgBbr,
    book.postedBlog,
    book.postedAmazon,
  ].filter(Boolean).length;

  return (
    <div
      style={{
        ...cardStyle,
        borderColor: book.didNotFinish ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.06)',
        cursor: 'pointer',
      }}
      onClick={() => onEdit(book)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Cover Image or Placeholder */}
        <div 
          style={{
            position: 'relative',
            marginBottom: '16px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#0a0a0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            flexShrink: 0,
          }}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              style={{
                maxWidth: '100%',
                maxHeight: '240px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div 
              style={{
                width: '100%',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              }}
            >
              <BookOpen style={{ width: '64px', height: '64px', color: 'rgba(255,255,255,0.8)' }} />
            </div>
          )}
          
          {/* Format Badge */}
          <div 
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '500',
              background: 'rgba(20, 20, 32, 0.9)',
              backdropFilter: 'blur(8px)',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <FormatIcon style={{ width: '12px', height: '12px' }} />
            <span>{formatLabel}</span>
          </div>

          {/* DNF Badge */}
          {book.didNotFinish && (
            <div 
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
              }}
            >
              <XCircle style={{ width: '12px', height: '12px' }} />
              <span>DNF</span>
            </div>
          )}

          {/* Source Badge */}
          {book.source && (
            <div 
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                padding: '4px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'rgba(20, 20, 32, 0.9)',
                backdropFilter: 'blur(8px)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {book.source}
            </div>
          )}
        </div>

        {/* Book Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <h3 
            style={{
              fontWeight: '700',
              fontSize: '16px',
              lineHeight: '1.3',
              color: '#f1f5f9',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {book.title}
          </h3>

          <p 
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#94a3b8',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            by {book.author}
          </p>

          {/* Narrator for audiobooks */}
          {book.format === 'audiobook' && book.narrator && (
            <p 
              style={{
                fontSize: '12px',
                color: '#475569',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Headphones style={{ width: '12px', height: '12px' }} />
              <span>Narrated by {book.narrator}</span>
            </p>
          )}

          {/* Genre & Rating Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {book.genre && (
              <span 
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                }}
              >
                {book.genre}
              </span>
            )}
            <div>{renderStars(book.rating)}</div>
          </div>

          {/* Reading Dates */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#475569',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <Calendar style={{ width: '12px', height: '12px' }} />
            {startDate && endDate ? (
              <span>{startDate} → {endDate}</span>
            ) : endDate ? (
              <span>Finished {endDate}</span>
            ) : (
              <span>Date not set</span>
            )}
          </div>

          {/* Stats Row */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#94a3b8',
            }}
          >
            <span style={{ fontWeight: '600' }}>{book.pages || 0} pages</span>
            {book.price > 0 && (
              <span 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                }}
              >
                <DollarSign style={{ width: '12px', height: '12px' }} />
                <span>{book.price.toFixed(2)}</span>
              </span>
            )}
          </div>

          {/* Author Instagram */}
          {book.authorInstagram && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#E4405F',
              }}
            >
              <Instagram style={{ width: '12px', height: '12px' }} />
              <span>@{book.authorInstagram}</span>
            </div>
          )}

          {/* Publishing Status */}
          {(book.reviewDrafted || publishedCount > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
              {book.reviewDrafted && (
                <span 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#f59e0b',
                  }}
                >
                  <Clock style={{ width: '12px', height: '12px' }} />
                  <span>Drafted</span>
                </span>
              )}
              {publishedCount > 0 && (
                <span 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#10b981',
                  }}
                >
                  <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                  <span>{publishedCount} posted</span>
                </span>
              )}
              {book.amazonApproved && (
                <span 
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#10b981',
                  }}
                >
                  ✓ Amazon
                </span>
              )}
            </div>
          )}

          {/* DNF Reason */}
          {book.didNotFinish && book.dnfReason && (
            <div 
              style={{
                fontSize: '12px',
                borderRadius: '8px',
                padding: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'rgba(239, 68, 68, 0.9)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {book.dnfReason}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', marginTop: 'auto' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(book);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                background: '#1a1a26',
                color: '#94a3b8',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#252532';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.color = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a26';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <Edit2 style={{ width: '16px', height: '16px' }} />
              <span>Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(book.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'rgba(239, 68, 68, 0.9)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
