import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlyChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(255, 255, 255, 0.06)" 
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Outfit' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono' }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#141420',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            fontFamily: 'Outfit',
          }}
          labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
          itemStyle={{ color: '#818cf8' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <Bar
          dataKey="count"
          fill="url(#barGradient)"
          radius={[8, 8, 0, 0]}
          name="Books"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;
