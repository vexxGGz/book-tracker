# Book Tracker

A modern, beautiful web application for tracking your reading journey throughout the year. Built with React, Vite, and Tailwind CSS.

## Features

- **Add Books**: Easily add books with auto-fill from Google Books API using ISBN
- **Beautiful UI**: Clean, modern interface with book covers and ratings
- **Year Review Dashboard**: Comprehensive statistics including:
  - Total books read and pages
  - Average pages per book
  - Total value of books
  - Reading pace (books per month)
  - Monthly reading chart
  - Top authors and genres
  - Trending authors and genres
  - Highest rated books
- **Book Library**: Grid view of all your books with filtering by year
- **Real-time Prices**: Get up-to-date book prices from Google Books API
- **Local Storage**: All data stored locally in your browser

## Getting Started

### Prerequisites

- Run BookTracker-Setup-x.x.x.exe to start the installer
- Follow prompts

## Usage

1. **Add Your First Book**:
   - Click the "Add Book" button in the header
   - Enter the ISBN and click "Search" to auto-fill book details
   - Or manually enter book information
   - Fill in the date read and rating
   - Click "Add Book"

2. **View Dashboard**:
   - Click "Dashboard" in the navigation
   - See comprehensive statistics about your reading year
   - Use the year selector to view different years

3. **Browse Library**:
   - Click "Library" in the navigation
   - View all your books in a beautiful grid
   - Filter by year
   - Delete books as needed

## Technology Stack

- **React 19**: Modern UI framework
- **Vite 7**: Fast build tool and dev server
- **Tailwind CSS 4**: Utility-first CSS framework
- **Recharts**: Beautiful charts and data visualization
- **date-fns**: Date manipulation
- **Lucide React**: Beautiful icons
- **Google Books API**: Book data and prices

## Data Storage

All your book data is stored locally in your browser's localStorage. No data is sent to any server except when fetching book information from the Google Books API.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.


## License

MIT

