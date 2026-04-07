// Cloud sync service for desktop app
import { supabase, isSupabaseConfigured } from './supabase';

const LAST_SYNC_KEY = 'lastSyncTimestamp';
const PENDING_CHANGES_KEY = 'pendingChanges';

// Convert local Book to database format
const bookToDb = (book, userId) => ({
  user_id: userId,
  title: book.title,
  author: book.author,
  isbn: book.isbn || null,
  genre: book.genre || null,
  pages: book.pages || null,
  format: book.format || 'physical',
  book_format: book.bookFormat || null,
  narrator: book.narrator || null,
  source: book.source || null,
  price: book.price || null,
  currency: book.currency || 'USD',
  start_date: book.startDate || null,
  end_date: book.endDate || book.dateRead || null,
  date_added: book.dateAdded || new Date().toISOString(),
  rating: book.rating || null,
  review: book.review || null,
  did_not_finish: book.didNotFinish || false,
  dnf_reason: book.dnfReason || null,
  is_reread: book.isReread || false,
  cover_url: book.coverUrl || null,
  author_instagram: book.authorInstagram || null,
  minutes_listened: book.minutesListened || null,
  review_drafted: book.reviewDrafted || false,
  posted_goodreads: book.postedGoodreads || false,
  posted_instagram: book.postedInstagram || false,
  posted_ig_bbr: book.postedIgBbr || false,
  posted_blog: book.postedBlog || false,
  posted_amazon: book.postedAmazon || false,
  amazon_approved: book.amazonApproved || false,
  amazon_denied: book.amazonDenied || false,
  local_id: book.id,
});

// Convert database Book to local format
const dbToBook = (dbBook) => ({
  id: dbBook.local_id || dbBook.id,
  title: dbBook.title,
  author: dbBook.author,
  isbn: dbBook.isbn,
  genre: dbBook.genre,
  pages: dbBook.pages,
  format: dbBook.format,
  bookFormat: dbBook.book_format,
  narrator: dbBook.narrator,
  source: dbBook.source,
  price: dbBook.price,
  currency: dbBook.currency,
  startDate: dbBook.start_date,
  endDate: dbBook.end_date,
  dateAdded: dbBook.date_added,
  rating: dbBook.rating,
  review: dbBook.review,
  didNotFinish: dbBook.did_not_finish,
  dnfReason: dbBook.dnf_reason,
  isReread: dbBook.is_reread,
  coverUrl: dbBook.cover_url,
  authorInstagram: dbBook.author_instagram,
  minutesListened: dbBook.minutes_listened,
  reviewDrafted: dbBook.review_drafted,
  postedGoodreads: dbBook.posted_goodreads,
  postedInstagram: dbBook.posted_instagram,
  postedIgBbr: dbBook.posted_ig_bbr,
  postedBlog: dbBook.posted_blog,
  postedAmazon: dbBook.posted_amazon,
  amazonApproved: dbBook.amazon_approved,
  amazonDenied: dbBook.amazon_denied,
});

// Get last sync timestamp
export const getLastSyncTimestamp = () => {
  return localStorage.getItem(LAST_SYNC_KEY);
};

// Set last sync timestamp
const setLastSyncTimestamp = (timestamp) => {
  localStorage.setItem(LAST_SYNC_KEY, timestamp);
};

// Get pending changes
export const getPendingChanges = () => {
  const data = localStorage.getItem(PENDING_CHANGES_KEY);
  return data ? JSON.parse(data) : [];
};

// Add pending change
export const addPendingChange = (change) => {
  const changes = getPendingChanges();
  changes.push(change);
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
};

// Clear pending changes
const clearPendingChanges = () => {
  localStorage.removeItem(PENDING_CHANGES_KEY);
};

// Fetch all books from cloud
export const fetchBooksFromCloud = async () => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, using local storage only');
    return [];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(dbToBook);
};

// Upload a single book to cloud
export const uploadBookToCloud = async (book) => {
  if (!isSupabaseConfigured()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbBook = bookToDb(book, user.id);

  // Check if book exists (by local_id)
  const { data: existing } = await supabase
    .from('books')
    .select('id')
    .eq('user_id', user.id)
    .eq('local_id', book.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('books')
      .update(dbBook)
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('books')
      .insert(dbBook);
    
    if (error) throw error;
  }
};

// Delete a book from cloud (soft delete)
export const deleteBookFromCloud = async (bookId) => {
  if (!isSupabaseConfigured()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('books')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('local_id', bookId);

  if (error) throw error;
};

// Upload all local books to cloud
export const uploadAllBooksToCloud = async (books) => {
  if (!isSupabaseConfigured()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const batchSize = 50;
  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize);
    const dbBooks = batch.map(book => bookToDb(book, user.id));
    
    const { error } = await supabase
      .from('books')
      .upsert(dbBooks, { 
        onConflict: 'user_id,local_id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
  }
};

// Full sync: merge local and cloud data
export const performFullSync = async (localBooks) => {
  if (!isSupabaseConfigured()) {
    return localBooks;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return localBooks;
  }

  try {
    // Process pending changes first
    const pendingChanges = getPendingChanges();
    for (const change of pendingChanges) {
      if (change.type === 'create' || change.type === 'update') {
        if (change.data) {
          await uploadBookToCloud(change.data);
        }
      } else if (change.type === 'delete') {
        await deleteBookFromCloud(change.bookId);
      }
    }
    clearPendingChanges();

    // Fetch all books from cloud
    const cloudBooks = await fetchBooksFromCloud();
    
    // Create maps for merging
    const cloudBookMap = new Map(cloudBooks.map(b => [b.id, b]));
    
    // Merge: cloud books take precedence
    const mergedBooks = [];
    
    // Add all cloud books
    for (const cloudBook of cloudBooks) {
      mergedBooks.push(cloudBook);
    }
    
    // Add local-only books and upload them
    for (const localBook of localBooks) {
      if (!cloudBookMap.has(localBook.id)) {
        mergedBooks.push(localBook);
        await uploadBookToCloud(localBook);
      }
    }
    
    setLastSyncTimestamp(new Date().toISOString());
    
    return mergedBooks;
  } catch (error) {
    console.error('Sync error:', error);
    return localBooks;
  }
};

// Reading Goals sync
export const fetchReadingGoalsFromCloud = async () => {
  if (!isSupabaseConfigured()) return {};

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reading_goals')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;

  const goals = {};
  for (const goal of data || []) {
    goals[goal.year] = {
      target: goal.target,
      createdAt: goal.created_at,
    };
  }
  return goals;
};

export const uploadReadingGoalToCloud = async (year, target) => {
  if (!isSupabaseConfigured()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reading_goals')
    .upsert({
      user_id: user.id,
      year,
      target,
    }, {
      onConflict: 'user_id,year',
    });

  if (error) throw error;
};

// Subscribe to real-time updates
export const subscribeToBookUpdates = (onInsert, onUpdate, onDelete) => {
  if (!isSupabaseConfigured()) return null;

  const channel = supabase
    .channel('books-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'books' },
      (payload) => onInsert(dbToBook(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'books' },
      (payload) => {
        const book = payload.new;
        if (book.deleted_at) {
          onDelete(book.local_id || book.id);
        } else {
          onUpdate(dbToBook(book));
        }
      }
    )
    .subscribe();

  return channel;
};
