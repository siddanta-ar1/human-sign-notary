// src/components/charts/RadarChart.tsx
'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RadarChartProps {
  data: Array<{
    subject: string;
    human: number;
    ai: number;
    fullMark: number;
  }>;
}

export default function HumanAIRadarChart({ data }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar
          name="Human Pattern"
          dataKey="human"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.6}
        />
        <Radar
          name="AI Pattern"
          dataKey="ai"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}