// Storage utilities for managing book data
// Works with both Electron (file system) and browser (localStorage)

const STORAGE_KEY = 'bookTrackerData';
const API_KEY_STORAGE = 'googleBooksApiKey';
const READING_GOALS_KEY = 'readingGoals';

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron;
};

export const saveBooks = async (books) => {
  try {
    if (isElectron()) {
      return await window.electronAPI.saveData(STORAGE_KEY, books);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
      return true;
    }
  } catch (error) {
    console.error('Error saving books:', error);
    return false;
  }
};

export const loadBooks = async () => {
  try {
    if (isElectron()) {
      const data = await window.electronAPI.loadData(STORAGE_KEY);
      return data || [];
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error('Error loading books:', error);
    return [];
  }
};

export const addBook = async (book) => {
  const books = await loadBooks();
  books.push(book);
  return await saveBooks(books);
};

export const updateBook = async (id, updatedBook) => {
  const books = await loadBooks();
  const index = books.findIndex(book => book.id === id);
  if (index !== -1) {
    books[index] = { ...books[index], ...updatedBook };
    return await saveBooks(books);
  }
  return false;
};

export const deleteBook = async (id) => {
  const books = await loadBooks();
  const filteredBooks = books.filter(book => book.id !== id);
  return await saveBooks(filteredBooks);
};

export const getBookById = async (id) => {
  const books = await loadBooks();
  return books.find(book => book.id === id);
};

// API Key management
export const saveApiKey = async (apiKey) => {
  try {
    if (isElectron()) {
      return await window.electronAPI.saveData(API_KEY_STORAGE, apiKey);
    } else {
      localStorage.setItem(API_KEY_STORAGE, apiKey);
      return true;
    }
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

export const loadApiKey = async () => {
  try {
    if (isElectron()) {
      const data = await window.electronAPI.loadData(API_KEY_STORAGE);
      return data || '';
    } else {
      return localStorage.getItem(API_KEY_STORAGE) || '';
    }
  } catch (error) {
    console.error('Error loading API key:', error);
    return '';
  }
};

export const clearApiKey = async () => {
  try {
    if (isElectron()) {
      return await window.electronAPI.saveData(API_KEY_STORAGE, '');
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
      return true;
    }
  } catch (error) {
    console.error('Error clearing API key:', error);
    return false;
  }
};

// Export all books as JSON
export const exportBooks = async () => {
  const books = await loadBooks();
  const dataStr = JSON.stringify(books, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `book-tracker-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export all books as CSV
export const exportBooksAsCSV = async () => {
  const books = await loadBooks();
  
  // CSV headers
  const headers = [
    'Title', 'Author', 'ISBN', 'Genre', 'Pages', 'Format', 'Narrator', 'Source',
    'Price', 'Currency', 'Start Date', 'End Date', 'Rating', 'Did Not Finish',
    'DNF Reason', 'Review', 'Author Instagram', 'Cover URL',
    'Review Drafted', 'Posted Goodreads', 'Posted Instagram', 'Posted IG BBR',
    'Posted Blog', 'Posted Amazon', 'Amazon Approved', 'Date Added'
  ];
  
  // Escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Build CSV rows
  const rows = books.map(book => [
    escapeCSV(book.title),
    escapeCSV(book.author),
    escapeCSV(book.isbn),
    escapeCSV(book.genre),
    escapeCSV(book.pages || ''),
    escapeCSV(book.format || 'physical'),
    escapeCSV(book.narrator),
    escapeCSV(book.source),
    escapeCSV(book.price || ''),
    escapeCSV(book.currency || 'USD'),
    escapeCSV(book.startDate),
    escapeCSV(book.endDate || book.dateRead),
    escapeCSV(book.rating || ''),
    escapeCSV(book.didNotFinish ? 'Yes' : 'No'),
    escapeCSV(book.dnfReason),
    escapeCSV(book.review),
    escapeCSV(book.authorInstagram),
    escapeCSV(book.coverUrl),
    escapeCSV(book.reviewDrafted ? 'Yes' : 'No'),
    escapeCSV(book.postedGoodreads ? 'Yes' : 'No'),
    escapeCSV(book.postedInstagram ? 'Yes' : 'No'),
    escapeCSV(book.postedIgBbr ? 'Yes' : 'No'),
    escapeCSV(book.postedBlog ? 'Yes' : 'No'),
    escapeCSV(book.postedAmazon ? 'Yes' : 'No'),
    escapeCSV(book.amazonApproved ? 'Yes' : 'No'),
    escapeCSV(book.dateAdded),
  ].join(','));
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `book-tracker-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Helper to convert various date formats to ISO (YYYY-MM-DD)
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0]; // Just the date part
  }
  
  // MM/DD/YYYY or M/D/YYYY format
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // MM-DD-YYYY or M-D-YYYY format
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, month, day, year] = dashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
};

// Helper to parse boolean values (handles yes/no, true/false, 1/0)
const parseBoolean = (value) => {
  if (!value) return false;
  const v = value.toString().toLowerCase().trim();
  return v === 'yes' || v === 'true' || v === '1';
};

// Parse CSV content
export const parseCSV = (csvContent) => {
  const lines = csvContent.split(/\r?\n/);
  if (lines.length < 2) return [];
  
  // Parse CSV line handling quoted values
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  // Normalize header names (remove special chars, trim, lowercase)
  const normalizeHeader = (h) => {
    return h.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  };
  
  const headers = parseLine(lines[0]).map(normalizeHeader);
  const books = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseLine(lines[i]);
    const book = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // Map CSV headers to book properties (more flexible matching)
      switch (header) {
        case 'title': book.title = value; break;
        case 'author': book.author = value; break;
        case 'isbn': book.isbn = value; break;
        case 'genre': book.genre = value; break;
        case 'pages': book.pages = parseInt(value) || 0; break;
        case 'format': book.format = value.toLowerCase() || 'physical'; break;
        case 'narrator': book.narrator = value; break;
        case 'source': book.source = value; break;
        case 'price': book.price = parseFloat(value) || 0; break;
        case 'currency': book.currency = value || 'USD'; break;
        case 'start date': 
        case 'startdate':
          book.startDate = normalizeDate(value); 
          break;
        case 'end date': 
        case 'enddate':
        case 'date read':
        case 'dateread':
          book.endDate = normalizeDate(value); 
          break;
        case 'rating': book.rating = parseInt(value) || 0; break;
        case 'did not finish': 
        case 'didnotfinish':
        case 'dnf':
          book.didNotFinish = parseBoolean(value); 
          break;
        case 'dnf reason': 
        case 'dnfreason':
          book.dnfReason = value; 
          break;
        case 'review': book.review = value; break;
        case 'author instagram': 
        case 'authorinstagram':
          book.authorInstagram = value; 
          break;
        case 'cover url': 
        case 'coverurl':
          book.coverUrl = value; 
          break;
        case 'review drafted': 
        case 'reviewdrafted':
          book.reviewDrafted = parseBoolean(value); 
          break;
        case 'posted goodreads': 
        case 'postedgoodreads':
        case 'goodreads':
          book.postedGoodreads = parseBoolean(value); 
          break;
        case 'posted instagram': 
        case 'postedinstagram':
        case 'instagram':
          book.postedInstagram = parseBoolean(value); 
          break;
        case 'posted ig bbr': 
        case 'postedtwitterx':
        case 'posted igbbr':
        case 'igbbr':
          book.postedIgBbr = parseBoolean(value); 
          break;
        case 'posted blog': 
        case 'postedblog':
        case 'blog':
          book.postedBlog = parseBoolean(value); 
          break;
        case 'posted amazon': 
        case 'postedamazon':
        case 'amazon':
          book.postedAmazon = parseBoolean(value); 
          break;
        case 'amazon approved': 
        case 'amazonapproved':
          book.amazonApproved = parseBoolean(value); 
          break;
        case 'date added': 
        case 'dateadded':
          book.dateAdded = normalizeDate(value); 
          break;
      }
    });
    
    // Only add if has title and author
    if (book.title && book.author) {
      books.push(book);
    }
  }
  
  return books;
};

// Helper to extract year from a date string
const getYearFromDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = dateStr.match(/^(\d{4})-/);
  if (isoMatch) return parseInt(isoMatch[1]);
  
  // Try US format (MM/DD/YYYY or M/D/YYYY)
  const usMatch = dateStr.match(/\/(\d{4})$/);
  if (usMatch) return parseInt(usMatch[1]);
  
  // Try dash format (MM-DD-YYYY)
  const dashMatch = dateStr.match(/-(\d{4})$/);
  if (dashMatch) return parseInt(dashMatch[1]);
  
  return null;
};

// Get the year a book was read (from endDate, startDate, or dateAdded)
const getBookYear = (book) => {
  return getYearFromDate(book.endDate) || 
         getYearFromDate(book.dateRead) || 
         getYearFromDate(book.startDate) || 
         getYearFromDate(book.dateAdded);
};

// Check for duplicate books (same title, author, AND year)
export const findDuplicates = async (newBooks) => {
  const existingBooks = await loadBooks();
  const duplicates = [];
  const unique = [];
  
  newBooks.forEach(newBook => {
    const newBookYear = getBookYear(newBook);
    
    const isDuplicate = existingBooks.some(existing => {
      const existingYear = getBookYear(existing);
      
      // Same title and author
      const sameBook = existing.title?.toLowerCase().trim() === newBook.title?.toLowerCase().trim() &&
                       existing.author?.toLowerCase().trim() === newBook.author?.toLowerCase().trim();
      
      // Only a duplicate if same year (or if either has no year)
      const sameYear = !newBookYear || !existingYear || newBookYear === existingYear;
      
      return sameBook && sameYear;
    });
    
    if (isDuplicate) {
      duplicates.push(newBook);
    } else {
      unique.push(newBook);
    }
  });
  
  return { duplicates, unique };
};

// Check if a single book is a duplicate (same title, author, AND year)
export const checkDuplicate = async (title, author, year) => {
  const existingBooks = await loadBooks();
  return existingBooks.find(existing => {
    const existingYear = getBookYear(existing);
    
    // Same title and author
    const sameBook = existing.title?.toLowerCase().trim() === title?.toLowerCase().trim() &&
                     existing.author?.toLowerCase().trim() === author?.toLowerCase().trim();
    
    // Only a duplicate if same year (or if either has no year)
    const sameYear = !year || !existingYear || year === existingYear;
    
    return sameBook && sameYear;
  });
};

// Import books from JSON
export const importBooks = async (jsonData) => {
  try {
    const books = JSON.parse(jsonData);
    if (Array.isArray(books)) {
      return await saveBooks(books);
    }
    return false;
  } catch (error) {
    console.error('Error importing books:', error);
    return false;
  }
};

// Reading Goals management
export const saveReadingGoals = async (goals) => {
  try {
    if (isElectron()) {
      return await window.electronAPI.saveData(READING_GOALS_KEY, goals);
    } else {
      localStorage.setItem(READING_GOALS_KEY, JSON.stringify(goals));
      return true;
    }
  } catch (error) {
    console.error('Error saving reading goals:', error);
    return false;
  }
};

export const loadReadingGoals = async () => {
  try {
    if (isElectron()) {
      const data = await window.electronAPI.loadData(READING_GOALS_KEY);
      return data || {};
    } else {
      const data = localStorage.getItem(READING_GOALS_KEY);
      return data ? JSON.parse(data) : {};
    }
  } catch (error) {
    console.error('Error loading reading goals:', error);
    return {};
  }
};

export const setYearlyGoal = async (year, goalCount) => {
  const goals = await loadReadingGoals();
  goals[year] = { 
    target: goalCount, 
    createdAt: new Date().toISOString() 
  };
  return await saveReadingGoals(goals);
};

export const getYearlyGoal = async (year) => {
  const goals = await loadReadingGoals();
  return goals[year] || null;
};
