// src/components/charts/LineChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: Array<{
    time: number;
    speed: number;
    rhythm: number;
  }>;
}

export default function TypingLineChart({ data }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time" 
          label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: 'Speed (WPM)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [
            value.toFixed(1), 
            name === 'speed' ? 'Typing Speed' : 'Rhythm Variance'
          ]}
        />
        <Line 
          type="monotone" 
          dataKey="speed" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#1d4ed8' }}
          name="Typing Speed"
        />
        <Line 
          type="monotone" 
          dataKey="rhythm" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#7c3aed' }}
          name="Rhythm Variance"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}