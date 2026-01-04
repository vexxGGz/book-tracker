// Google Books API integration

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = 'AIzaSyA283qsf7oAD_F2Qo7bqzW7SZ6fzSLK--k';

/**
 * Search for a book by ISBN using Google Books API
 * @param {string} isbn - The ISBN of the book
 * @returns {Promise<Object|null>} Book data or null if not found
 */
export const searchBookByISBN = async (isbn) => {
  if (!isbn) {
    throw new Error('ISBN is required');
  }

  try {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, ''); // Remove hyphens and spaces
    const url = `${GOOGLE_BOOKS_API_BASE}?q=isbn:${cleanIsbn}&key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const book = data.items[0];
    return parseBookData(book);
  } catch (error) {
    console.error('Error fetching book from Google Books API:', error);
    throw error;
  }
};

/**
 * Search for books by title and/or author
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of book results
 */
export const searchBooks = async (query) => {
  if (!query) {
    throw new Error('Query is required');
  }

  try {
    const url = `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(query)}&maxResults=10&key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map(parseBookData);
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

/**
 * Parse book data from Google Books API response
 * @param {Object} bookData - Raw book data from API
 * @returns {Object} Parsed book data
 */
const parseBookData = (bookData) => {
  const volumeInfo = bookData.volumeInfo || {};
  const saleInfo = bookData.saleInfo || {};

  // Extract price information
  let price = null;
  let currency = 'USD';

  if (saleInfo.listPrice) {
    price = saleInfo.listPrice.amount;
    currency = saleInfo.listPrice.currencyCode;
  } else if (saleInfo.retailPrice) {
    price = saleInfo.retailPrice.amount;
    currency = saleInfo.retailPrice.currencyCode;
  }

  // Extract ISBN
  let isbn = '';
  if (volumeInfo.industryIdentifiers) {
    const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13');
    const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10');
    isbn = isbn13?.identifier || isbn10?.identifier || '';
  }

  // Get cover image (prefer high quality)
  let coverUrl = '';
  if (volumeInfo.imageLinks) {
    coverUrl = volumeInfo.imageLinks.extraLarge ||
               volumeInfo.imageLinks.large ||
               volumeInfo.imageLinks.medium ||
               volumeInfo.imageLinks.thumbnail ||
               volumeInfo.imageLinks.smallThumbnail ||
               '';
    // Use HTTPS
    coverUrl = coverUrl.replace('http:', 'https:');
  }

  return {
    title: volumeInfo.title || 'Unknown Title',
    author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
    isbn: isbn,
    genre: volumeInfo.categories ? volumeInfo.categories[0] : '',
    pages: volumeInfo.pageCount || 0,
    publisher: volumeInfo.publisher || '',
    publishedDate: volumeInfo.publishedDate || '',
    description: volumeInfo.description || '',
    coverUrl: coverUrl,
    price: price,
    currency: currency,
    googleBooksId: bookData.id,
  };
};

/**
 * Test API connection
 * @returns {Promise<boolean>} True if working, false otherwise
 */
export const testApiConnection = async () => {
  try {
    const url = `${GOOGLE_BOOKS_API_BASE}?q=test&maxResults=1&key=${API_KEY}`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('Error testing API connection:', error);
    return false;
  }
};

/**
 * Fetch cover image URL for a book by title and author
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @returns {Promise<string|null>} Cover URL or null if not found
 */
export const fetchBookCover = async (title, author) => {
  if (!title) return null;

  try {
    // Search by title and author for better accuracy
    const query = author ? `intitle:${title}+inauthor:${author}` : `intitle:${title}`;
    const url = `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(query)}&maxResults=3&key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // Find the best match with a cover image
    for (const book of data.items) {
      const volumeInfo = book.volumeInfo || {};
      if (volumeInfo.imageLinks) {
        let coverUrl = volumeInfo.imageLinks.extraLarge ||
                       volumeInfo.imageLinks.large ||
                       volumeInfo.imageLinks.medium ||
                       volumeInfo.imageLinks.thumbnail ||
                       volumeInfo.imageLinks.smallThumbnail;
        if (coverUrl) {
          return coverUrl.replace('http:', 'https:');
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching book cover:', error);
    return null;
  }
};

/**
 * Fetch covers for multiple books (with rate limiting)
 * @param {Array} books - Array of books with title and author
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Map>} Map of book index to cover URL
 */
export const fetchBookCovers = async (books, onProgress) => {
  const covers = new Map();
  const booksNeedingCovers = books
    .map((book, index) => ({ book, index }))
    .filter(({ book }) => !book.coverUrl && book.title);

  for (let i = 0; i < booksNeedingCovers.length; i++) {
    const { book, index } = booksNeedingCovers[i];
    
    try {
      const coverUrl = await fetchBookCover(book.title, book.author);
      if (coverUrl) {
        covers.set(index, coverUrl);
      }
    } catch (error) {
      // Continue with other books even if one fails
      console.error(`Error fetching cover for "${book.title}":`, error);
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, booksNeedingCovers.length);
    }

    // Rate limiting: wait 100ms between requests to avoid API limits
    if (i < booksNeedingCovers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return covers;
};
