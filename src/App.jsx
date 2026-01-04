import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BookGrid from './components/BookGrid';
import AddBookModal from './components/AddBookModal';
import SettingsModal from './components/SettingsModal';
import UpdateNotification from './components/UpdateNotification';
import { loadBooks, deleteBook } from './utils/storage';

function App() {
  const [books, setBooks] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Load books on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedBooks = await loadBooks();
      setBooks(loadedBooks);
    };
    loadData();
  }, []);

  // Reload books after adding/editing
  const reloadBooks = async () => {
    const loadedBooks = await loadBooks();
    setBooks(loadedBooks);
  };

  const handleDeleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      await deleteBook(id);
      reloadBooks();
    }
  };

  // Safe year change handler - prevents NaN
  const handleYearChange = (year) => {
    const numYear = Number(year);
    if (!isNaN(numYear) && numYear > 1900 && numYear < 3000) {
      setSelectedYear(numYear);
    } else {
      setSelectedYear(new Date().getFullYear());
    }
  };

  return (
    <div 
      className="app-bg min-h-screen animate-fade-in"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      }}
    >
      <TitleBar />
      <div style={{ paddingTop: isElectron ? '40px' : '0' }}>
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          onAddBook={() => setShowAddModal(true)}
          onOpenSettings={() => setShowSettings(true)}
        />

        <main 
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '32px 24px',
          }}
        >
        {currentView === 'dashboard' ? (
          <Dashboard
            books={books}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
        ) : (
          <BookGrid
            books={books}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            onDeleteBook={handleDeleteBook}
            onRefresh={reloadBooks}
          />
        )}
        </main>
      </div>

      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onBookAdded={reloadBooks}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onDataCleared={reloadBooks}
        />
      )}

      {/* Update notification popup */}
      <UpdateNotification />
    </div>
  );
}

export default App;
