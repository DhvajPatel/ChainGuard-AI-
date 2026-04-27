import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RoutePerformanceData {
  route: string;
  on_time_rate: number;
  avg_delay: number;
}

interface Props {
  data: RoutePerformanceData[];
}

export default function RoutePerformanceChart({ data }: Props) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Route Performance Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="route" 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            stroke="#94a3b8"
            style={{ fontSize: '14px' }}
            label={{ value: 'On-Time Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
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
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
          />
          <Bar 
            yAxisId="left"
            dataKey="on_time_rate" 
            fill="#22c55e" 
            name="On-Time Rate (%)"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="avg_delay" 
            fill="#ef4444" 
            name="Avg Delay (min)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
