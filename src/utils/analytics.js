// Analytics utilities for calculating statistics

import { startOfYear, endOfYear, parseISO, parse, isValid } from 'date-fns';

/**
 * Parse a date string in various formats
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Date object or null
 */
const parseFlexibleDate = (dateString) => {
  if (!dateString) return null;
  
  // Try ISO format first (YYYY-MM-DD or full ISO)
  try {
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) return isoDate;
  } catch {}
  
  // Try MM/DD/YYYY format (US format)
  try {
    const usDate = parse(dateString, 'M/d/yyyy', new Date());
    if (isValid(usDate)) return usDate;
  } catch {}
  
  // Try MM-DD-YYYY format
  try {
    const dashDate = parse(dateString, 'M-d-yyyy', new Date());
    if (isValid(dashDate)) return dashDate;
  } catch {}
  
  // Try DD/MM/YYYY format (European)
  try {
    const euDate = parse(dateString, 'd/M/yyyy', new Date());
    if (isValid(euDate)) return euDate;
  } catch {}
  
  return null;
};

/**
 * Get the reading date from a book (supports both old dateRead and new endDate fields)
 * @param {Object} book - Book object
 * @returns {Date|null} Date object or null
 */
const getBookDate = (book) => {
  // Try endDate first, then dateRead, then startDate, then dateAdded as fallback
  const dateString = book.endDate || book.dateRead || book.startDate || book.dateAdded;
  return parseFlexibleDate(dateString);
};

/**
 * Filter books by year
 * @param {Array} books - Array of all books
 * @param {number} year - Year to filter by
 * @returns {Array} Filtered books
 */
export const filterBooksByYear = (books, year) => {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 11, 31));

  return books.filter(book => {
    const dateRead = getBookDate(book);
    if (!dateRead) return false;
    return dateRead >= yearStart && dateRead <= yearEnd;
  });
};

/**
 * Calculate total books read
 * @param {Array} books - Array of books
 * @returns {number} Total count
 */
export const getTotalBooks = (books) => books.length;

/**
 * Calculate total pages read
 * @param {Array} books - Array of books
 * @returns {number} Total pages
 */
export const getTotalPages = (books) => {
  return books.reduce((total, book) => total + (book.pages || 0), 0);
};

/**
 * Calculate average pages per book
 * @param {Array} books - Array of books
 * @returns {number} Average pages
 */
export const getAveragePages = (books) => {
  if (books.length === 0) return 0;
  const total = getTotalPages(books);
  return Math.round(total / books.length);
};

/**
 * Calculate total value of books
 * @param {Array} books - Array of books
 * @returns {number} Total value
 */
export const getTotalValue = (books) => {
  return books.reduce((total, book) => total + (book.price || 0), 0);
};

/**
 * Get books grouped by author
 * @param {Array} books - Array of books
 * @returns {Object} Object with authors as keys and book counts as values
 */
export const getBooksByAuthor = (books) => {
  const authorCounts = {};

  books.forEach(book => {
    const author = book.author || 'Unknown';
    authorCounts[author] = (authorCounts[author] || 0) + 1;
  });

  return authorCounts;
};

/**
 * Get top authors (most books read)
 * @param {Array} books - Array of books
 * @param {number} limit - Number of top authors to return
 * @returns {Array} Array of {author, count} objects
 */
export const getTopAuthors = (books, limit = 5) => {
  const authorCounts = getBooksByAuthor(books);

  return Object.entries(authorCounts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Get books grouped by genre
 * @param {Array} books - Array of books
 * @returns {Object} Object with genres as keys and book counts as values
 */
export const getBooksByGenre = (books) => {
  const genreCounts = {};

  books.forEach(book => {
    const genre = book.genre || 'Uncategorized';
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  });

  return genreCounts;
};

/**
 * Get top genres (most books read)
 * @param {Array} books - Array of books
 * @param {number} limit - Number of top genres to return
 * @returns {Array} Array of {genre, count, percentage} objects
 */
export const getTopGenres = (books, limit = 5) => {
  const genreCounts = getBooksByGenre(books);
  const total = books.length;

  return Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Get books grouped by format
 * @param {Array} books - Array of books
 * @returns {Object} Object with formats as keys and book counts as values
 */
export const getBooksByFormat = (books) => {
  const formatCounts = {};

  books.forEach(book => {
    const format = book.format || 'physical';
    formatCounts[format] = (formatCounts[format] || 0) + 1;
  });

  return formatCounts;
};

/**
 * Get books grouped by source
 * @param {Array} books - Array of books
 * @returns {Object} Object with sources as keys and book counts as values
 */
export const getBooksBySource = (books) => {
  const sourceCounts = {};

  books.forEach(book => {
    const source = book.source || 'Unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  return sourceCounts;
};

/**
 * Get DNF (Did Not Finish) statistics
 * @param {Array} books - Array of books
 * @returns {Object} DNF stats
 */
export const getDNFStats = (books) => {
  const dnfBooks = books.filter(book => book.didNotFinish);
  return {
    total: dnfBooks.length,
    percentage: books.length > 0 ? Math.round((dnfBooks.length / books.length) * 100) : 0,
    books: dnfBooks
  };
};

/**
 * Get publishing/review statistics
 * @param {Array} books - Array of books
 * @returns {Object} Publishing stats
 */
export const getPublishingStats = (books) => {
  return {
    reviewDrafted: books.filter(b => b.reviewDrafted).length,
    postedGoodreads: books.filter(b => b.postedGoodreads).length,
    postedInstagram: books.filter(b => b.postedInstagram).length,
    postedIgBbr: books.filter(b => b.postedIgBbr).length,
    postedBlog: books.filter(b => b.postedBlog).length,
    postedAmazon: books.filter(b => b.postedAmazon).length,
    amazonApproved: books.filter(b => b.amazonApproved).length,
  };
};

/**
 * Get books grouped by month
 * @param {Array} books - Array of books
 * @returns {Array} Array of {month, count} objects for all 12 months
 */
export const getBooksByMonth = (books) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthCounts = Array(12).fill(0);

  books.forEach(book => {
    const date = getBookDate(book);
    if (date) {
      const month = date.getMonth();
      monthCounts[month]++;
    }
  });

  return monthNames.map((month, index) => ({
    month,
    count: monthCounts[index]
  }));
};

/**
 * Get highest rated books
 * @param {Array} books - Array of books
 * @param {number} limit - Number of books to return
 * @returns {Array} Array of books sorted by rating
 */
export const getHighestRatedBooks = (books, limit = 5) => {
  return [...books]
    .filter(book => book.rating > 0 && !book.didNotFinish)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

/**
 * Get reading pace (books per month)
 * @param {Array} books - Array of books
 * @returns {number} Average books per month
 */
export const getReadingPace = (books) => {
  if (books.length === 0) return 0;

  const monthlyData = getBooksByMonth(books);
  const monthsWithBooks = monthlyData.filter(m => m.count > 0).length;

  if (monthsWithBooks === 0) return 0;

  return (books.length / monthsWithBooks).toFixed(1);
};

/**
 * Get trending authors (authors with increasing reads over time)
 * @param {Array} books - Array of books sorted by date
 * @returns {Array} Array of trending authors
 */
export const getTrendingAuthors = (books) => {
  if (books.length < 6) return [];

  // Split books into first half and second half of the year
  const midpoint = Math.floor(books.length / 2);
  const firstHalf = books.slice(0, midpoint);
  const secondHalf = books.slice(midpoint);

  const firstHalfAuthors = getBooksByAuthor(firstHalf);
  const secondHalfAuthors = getBooksByAuthor(secondHalf);

  const trending = [];

  Object.keys(secondHalfAuthors).forEach(author => {
    const firstCount = firstHalfAuthors[author] || 0;
    const secondCount = secondHalfAuthors[author];

    if (secondCount > firstCount) {
      trending.push({
        author,
        trend: secondCount - firstCount,
        total: secondCount
      });
    }
  });

  return trending
    .sort((a, b) => b.trend - a.trend)
    .slice(0, 3);
};

/**
 * Get trending genres
 * @param {Array} books - Array of books sorted by date
 * @returns {Array} Array of trending genres
 */
export const getTrendingGenres = (books) => {
  if (books.length < 6) return [];

  const midpoint = Math.floor(books.length / 2);
  const firstHalf = books.slice(0, midpoint);
  const secondHalf = books.slice(midpoint);

  const firstHalfGenres = getBooksByGenre(firstHalf);
  const secondHalfGenres = getBooksByGenre(secondHalf);

  const trending = [];

  Object.keys(secondHalfGenres).forEach(genre => {
    const firstCount = firstHalfGenres[genre] || 0;
    const secondCount = secondHalfGenres[genre];

    if (secondCount > firstCount) {
      trending.push({
        genre,
        trend: secondCount - firstCount,
        total: secondCount
      });
    }
  });

  return trending
    .sort((a, b) => b.trend - a.trend)
    .slice(0, 3);
};

/**
 * Get all available years from books
 * @param {Array} books - Array of all books
 * @returns {Array} Sorted array of years
 */
export const getAvailableYears = (books) => {
  const years = new Set();

  books.forEach(book => {
    const date = getBookDate(book);
    if (date) {
      years.add(date.getFullYear());
    }
  });

  // If no years found, return current year
  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }

  return Array.from(years).sort((a, b) => b - a);
};
