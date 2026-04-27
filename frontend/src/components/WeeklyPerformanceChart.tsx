import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface WeeklyData {
  day: string;
  on_time: number;
  delayed: number;
  avg_delay: number;
}

interface Props {
  data: WeeklyData[];
}

export default function WeeklyPerformanceChart({ data }: Props) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Weekly Performance Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="day" 
            stroke="#94a3b8"
            style={{ fontSize: '14px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#94a3b8"
            style={{ fontSize: '14px' }}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#94a3b8"
            style={{ fontSize: '14px' }}
            label={{ value: 'Avg Delay (min)', angle: 90, position: 'insideRight', style: { fill: '#94a3b8' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="on_time" 
            stroke="#22c55e" 
            strokeWidth={2}
            name="On-Time %"
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="delayed" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Delayed %"
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="avg_delay" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Avg Delay (min)"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
