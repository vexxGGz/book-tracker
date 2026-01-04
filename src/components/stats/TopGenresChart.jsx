import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

const TopGenresChart = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No data available</p>;
  }

  const chartData = data.map(item => ({
    name: item.genre,
    value: item.count,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="px-3 py-2 rounded-lg"
          style={{
            background: 'var(--bg-widget-solid)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {payload[0].name}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {payload[0].value} books
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: COLORS[index % COLORS.length],
                  boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}40`,
                }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{item.genre}</span>
            </div>
            <span 
              className="font-mono text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.count} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopGenresChart;
