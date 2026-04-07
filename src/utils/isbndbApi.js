// ISBNdb API integration — primary book lookup source
// Docs: https://isbndb.com/apidocs/v2

const ISBNDB_BASE = 'https://api2.isbndb.com';

const parseISBNdbBook = (book) => {
  return {
    title: book.title_long || book.title || 'Unknown Title',
    author: book.authors ? book.authors.join(', ') : 'Unknown Author',
    isbn: book.isbn13 || book.isbn || '',
    isbn13: book.isbn13 || '',
    genre: book.subjects ? book.subjects[0] : '',
    pages: book.pages || 0,
    publisher: book.publisher || '',
    publishedDate: book.date_published || '',
    description: book.synopsis || book.overview || book.excerpt || '',
    coverUrl: book.image || '',
    price: book.msrp ? parseFloat(String(book.msrp)) || null : null,
    currency: 'USD',
  };
};

/**
 * Look up a book by ISBN using ISBNdb
 * @param {string} isbn
 * @param {string} apiKey
 * @returns {Promise<Object|null>}
 */
export const searchByISBN = async (isbn, apiKey) => {
  if (!isbn || !apiKey) return null;
  try {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    const response = await fetch(`${ISBNDB_BASE}/book/${cleanIsbn}`, {
      headers: { Authorization: apiKey },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.book) return null;
    return parseISBNdbBook(data.book);
  } catch (error) {
    console.error('ISBNdb ISBN lookup failed:', error);
    return null;
  }
};

/**
 * Search books by title/query using ISBNdb
 * @param {string} query
 * @param {string} apiKey
 * @returns {Promise<Array>}
 */
export const searchByTitle = async (query, apiKey) => {
  if (!query || !apiKey) return [];
  try {
    const response = await fetch(
      `${ISBNDB_BASE}/books/${encodeURIComponent(query)}?page=1&pageSize=10`,
      { headers: { Authorization: apiKey } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.books || !data.books.length) return [];
    return data.books.map(parseISBNdbBook);
  } catch (error) {
    console.error('ISBNdb title search failed:', error);
    return [];
  }
};
