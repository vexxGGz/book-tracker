import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, Check, Loader2, Download, Image } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { parseCSV, findDuplicates, addBook, loadBooks, saveBooks } from '../utils/storage';
import { fetchBookCovers } from '../utils/bookApi';

const CSVImportModal = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [parsedBooks, setParsedBooks] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [uniqueBooks, setUniqueBooks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload', 'review', 'fetching_covers', 'importing', 'complete'
  const [importResults, setImportResults] = useState({ added: 0, skipped: 0, errors: 0, coversFound: 0 });
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());
  const [importErrors, setImportErrors] = useState([]); // Array of { book, error }
  const [originalCsvLines, setOriginalCsvLines] = useState([]);
  const [csvHeader, setCsvHeader] = useState('');
  const [coverProgress, setCoverProgress] = useState({ current: 0, total: 0 });
  const [fetchCovers, setFetchCovers] = useState(true); // Option to fetch covers
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const content = await selectedFile.text();
      
      // Store original CSV lines for error reporting
      const lines = content.split(/\r?\n/);
      if (lines.length > 0) {
        setCsvHeader(lines[0]);
        setOriginalCsvLines(lines.slice(1).filter(line => line.trim()));
      }
      
      const books = parseCSV(content);
      
      if (books.length === 0) {
        alert('No valid books found in CSV. Make sure the file has Title and Author columns.');
        setIsProcessing(false);
        return;
      }

      // Store original line index with each book for error tracking
      const booksWithIndex = books.map((book, index) => ({ ...book, _originalIndex: index }));
      setParsedBooks(booksWithIndex);
      
      // Check for duplicates
      const { duplicates: dups, unique } = await findDuplicates(booksWithIndex);
      setDuplicates(dups);
      setUniqueBooks(unique);
      setStep('review');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDuplicate = (index) => {
    const newSelected = new Set(selectedDuplicates);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedDuplicates(newSelected);
  };

  const selectAllDuplicates = () => {
    if (selectedDuplicates.size === duplicates.length) {
      setSelectedDuplicates(new Set());
    } else {
      setSelectedDuplicates(new Set(duplicates.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);

    const errors = [];
    const successfulBooks = [];
    let coversFound = 0;

    try {
      const existingBooks = await loadBooks();
      const booksToAdd = [];

      const now = new Date().toISOString();
      const today = now.split('T')[0]; // YYYY-MM-DD format

      // Process unique books
      uniqueBooks.forEach(book => {
        try {
          // Validate required fields
          if (!book.title || book.title.trim() === '') {
            errors.push({ book, error: 'Missing title', originalIndex: book._originalIndex });
            return;
          }
          if (!book.author || book.author.trim() === '') {
            errors.push({ book, error: 'Missing author', originalIndex: book._originalIndex });
            return;
          }

          const newBook = {
            ...book,
            id: uuidv4(),
            dateAdded: book.dateAdded || now,
            endDate: book.endDate || book.startDate || today,
            startDate: book.startDate || book.endDate || today,
          };
          delete newBook._originalIndex;
          booksToAdd.push(newBook);
          successfulBooks.push({ book, originalIndex: book._originalIndex });
        } catch (err) {
          errors.push({ book, error: err.message || 'Unknown error', originalIndex: book._originalIndex });
        }
      });

      // Process selected duplicates
      duplicates.forEach((book, index) => {
        if (selectedDuplicates.has(index)) {
          try {
            const newBook = {
              ...book,
              id: uuidv4(),
              dateAdded: book.dateAdded || now,
              endDate: book.endDate || book.startDate || today,
              startDate: book.startDate || book.endDate || today,
            };
            delete newBook._originalIndex;
            booksToAdd.push(newBook);
            successfulBooks.push({ book, originalIndex: book._originalIndex });
          } catch (err) {
            errors.push({ book, error: err.message || 'Unknown error', originalIndex: book._originalIndex });
          }
        }
      });

      // Fetch covers for books that don't have them
      if (fetchCovers) {
        setStep('fetching_covers');
        const booksNeedingCovers = booksToAdd.filter(b => !b.coverUrl);
        setCoverProgress({ current: 0, total: booksNeedingCovers.length });

        if (booksNeedingCovers.length > 0) {
          const coverMap = await fetchBookCovers(booksToAdd, (current, total) => {
            setCoverProgress({ current, total });
          });

          // Apply fetched covers to books
          coverMap.forEach((coverUrl, index) => {
            if (booksToAdd[index]) {
              booksToAdd[index].coverUrl = coverUrl;
              coversFound++;
            }
          });
        }
      }

      setStep('importing');

      // Save all books
      await saveBooks([...existingBooks, ...booksToAdd]);

      setImportErrors(errors);
      setImportResults({
        added: booksToAdd.length,
        skipped: duplicates.length - selectedDuplicates.size,
        errors: errors.length,
        coversFound: coversFound,
      });
      setStep('complete');
    } catch (error) {
      console.error('Error importing books:', error);
      alert('Error importing books. Please try again.');
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    onImportComplete();
    onClose();
  };

  const downloadResultsCSV = () => {
    // Escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build results CSV with a "Result" column prepended
    const newHeader = `Result,${csvHeader}`;
    
    const resultLines = originalCsvLines.map((line, index) => {
      // Find if this line had an error
      const errorEntry = importErrors.find(e => e.originalIndex === index);
      const resultStatus = errorEntry ? `Error: ${errorEntry.error}` : 'Success';
      return `${escapeCSV(resultStatus)},${line}`;
    });

    const csvContent = [newHeader, ...resultLines].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
              <Upload style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
              Import Books from CSV
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
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {step === 'upload' && (
            <div style={{ textAlign: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(99, 102, 241, 0.3)',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {isProcessing ? (
                  <Loader2 style={{ width: '48px', height: '48px', color: '#6366f1', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <FileText style={{ width: '48px', height: '48px', color: '#6366f1', margin: '0 auto 16px' }} />
                )}
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px' }}>
                  {isProcessing ? 'Processing...' : 'Click to select a CSV file'}
                </p>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  or drag and drop here
                </p>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#1a1a26',
                  textAlign: 'left',
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px' }}>
                  CSV Format
                </p>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  Your CSV should include at minimum <strong>Title</strong> and <strong>Author</strong> columns. 
                  Optional columns: ISBN, Genre, Pages, Format, Rating, Start Date, End Date, Price, Review, etc.
                </p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div>
              {/* Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <p style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', margin: 0 }}>
                    {uniqueBooks.length}
                  </p>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>New books to add</p>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <p style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', margin: 0 }}>
                    {duplicates.length}
                  </p>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Duplicates found</p>
                </div>
              </div>

              {/* Duplicates List */}
              {duplicates.length > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
                        Duplicate Books
                      </span>
                    </div>
                    <button
                      onClick={selectAllDuplicates}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        background: '#1a1a26',
                        color: '#94a3b8',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {selectedDuplicates.size === duplicates.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                    These books already exist in your library. Select which ones to add anyway:
                  </p>

                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {duplicates.map((book, index) => (
                      <div
                        key={index}
                        onClick={() => toggleDuplicate(index)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderBottom: index < duplicates.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                          cursor: 'pointer',
                          background: selectedDuplicates.has(index) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: selectedDuplicates.has(index)
                              ? '2px solid #6366f1'
                              : '2px solid #475569',
                            background: selectedDuplicates.has(index) ? '#6366f1' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {selectedDuplicates.has(index) && (
                            <Check style={{ width: '14px', height: '14px', color: 'white' }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '500', color: '#f1f5f9', margin: 0 }}>{book.title}</p>
                          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                            by {book.author}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fetch Covers Option */}
              <div
                style={{
                  marginTop: duplicates.length > 0 ? '24px' : 0,
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    onClick={() => setFetchCovers(!fetchCovers)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: fetchCovers ? '2px solid #6366f1' : '2px solid #475569',
                      background: fetchCovers ? '#6366f1' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {fetchCovers && <Check style={{ width: '14px', height: '14px', color: 'white' }} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Image style={{ width: '16px', height: '16px', color: '#818cf8' }} />
                      <span style={{ fontWeight: '600', color: '#f1f5f9' }}>
                        Auto-fetch book covers
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                      Automatically download cover images from Google Books (may take a moment for large imports)
                    </p>
                  </div>
                </label>
              </div>

              {/* New Books Preview */}
              {uniqueBooks.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginBottom: '12px' }}>
                    New Books to Add ({uniqueBooks.length})
                  </p>
                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      background: '#1a1a26',
                    }}
                  >
                    {uniqueBooks.slice(0, 10).map((book, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '10px 12px',
                          borderBottom: index < Math.min(uniqueBooks.length, 10) - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                        }}
                      >
                        <span style={{ color: '#f1f5f9' }}>{book.title}</span>
                        <span style={{ color: '#475569' }}> by </span>
                        <span style={{ color: '#94a3b8' }}>{book.author}</span>
                      </div>
                    ))}
                    {uniqueBooks.length > 10 && (
                      <div style={{ padding: '10px 12px', color: '#475569', fontSize: '13px' }}>
                        ... and {uniqueBooks.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'fetching_covers' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Image
                style={{
                  width: '48px',
                  height: '48px',
                  color: '#6366f1',
                  margin: '0 auto 16px',
                }}
              />
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px' }}>
                Fetching book covers...
              </p>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
                {coverProgress.current} of {coverProgress.total} books
              </p>
              <div
                style={{
                  width: '200px',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#1a1a26',
                  margin: '0 auto',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: coverProgress.total > 0 
                      ? `${(coverProgress.current / coverProgress.total) * 100}%` 
                      : '0%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Loader2
                style={{
                  width: '48px',
                  height: '48px',
                  color: '#6366f1',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9' }}>
                Saving books...
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: importResults.errors > 0 
                    ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(135deg, #10b981, #34d399)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                {importResults.errors > 0 ? (
                  <AlertTriangle style={{ width: '32px', height: '32px', color: 'white' }} />
                ) : (
                  <Check style={{ width: '32px', height: '32px', color: 'white' }} />
                )}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
                {importResults.errors > 0 ? 'Import Completed with Errors' : 'Import Complete!'}
              </h3>
              <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
                Successfully added {importResults.added} book{importResults.added !== 1 ? 's' : ''} to your library.
                {importResults.skipped > 0 && (
                  <span> ({importResults.skipped} duplicate{importResults.skipped !== 1 ? 's' : ''} skipped)</span>
                )}
              </p>
              
              {importResults.coversFound > 0 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    marginBottom: '16px',
                  }}
                >
                  <Image style={{ width: '16px', height: '16px', color: '#818cf8' }} />
                  <span style={{ fontSize: '14px', color: '#818cf8' }}>
                    {importResults.coversFound} cover{importResults.coversFound !== 1 ? 's' : ''} found automatically
                  </span>
                </div>
              )}

              {/* Error Summary */}
              {importResults.errors > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                    <span style={{ fontWeight: '600', color: '#ef4444' }}>
                      {importResults.errors} row{importResults.errors !== 1 ? 's' : ''} had errors
                    </span>
                  </div>
                  
                  <div
                    style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      marginBottom: '12px',
                    }}
                  >
                    {importErrors.slice(0, 5).map((err, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: '13px',
                          color: '#94a3b8',
                          padding: '4px 0',
                          borderBottom: index < Math.min(importErrors.length, 5) - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                        }}
                      >
                        <span style={{ color: '#f1f5f9' }}>{err.book.title || 'Unknown'}</span>
                        <span style={{ color: '#475569' }}> - </span>
                        <span style={{ color: '#ef4444' }}>{err.error}</span>
                      </div>
                    ))}
                    {importErrors.length > 5 && (
                      <div style={{ fontSize: '13px', color: '#475569', paddingTop: '8px' }}>
                        ... and {importErrors.length - 5} more
                      </div>
                    )}
                  </div>

                  <button
                    onClick={downloadResultsCSV}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#818cf8',
                      fontWeight: '500',
                      fontSize: '14px',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <Download style={{ width: '16px', height: '16px' }} />
                    Download Results CSV
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '12px',
          }}
        >
          {step === 'upload' && (
            <button
              onClick={onClose}
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
              Cancel
            </button>
          )}

          {step === 'review' && (
            <>
              <button
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setParsedBooks([]);
                }}
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
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={uniqueBooks.length === 0 && selectedDuplicates.size === 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: uniqueBooks.length === 0 && selectedDuplicates.size === 0 ? 'not-allowed' : 'pointer',
                  opacity: uniqueBooks.length === 0 && selectedDuplicates.size === 0 ? 0.5 : 1,
                }}
              >
                Import {uniqueBooks.length + selectedDuplicates.size} Book{uniqueBooks.length + selectedDuplicates.size !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              onClick={handleComplete}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;

