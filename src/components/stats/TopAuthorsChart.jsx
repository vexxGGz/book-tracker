import React from 'react';

const TopAuthorsChart = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No data available</p>;
  }

  const maxCount = Math.max(...data.map(item => item.count));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span 
              className="font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.author}
            </span>
            <span 
              className="ml-2 flex-shrink-0 font-mono text-xs px-2 py-1 rounded"
              style={{ 
                color: 'var(--accent-secondary)',
                background: 'rgba(99, 102, 241, 0.15)',
              }}
            >
              {item.count} {item.count === 1 ? 'book' : 'books'}
            </span>
          </div>
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <div
              className="h-2 rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${(item.count / maxCount) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                boxShadow: '0 0 8px var(--accent-glow)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopAuthorsChart;
