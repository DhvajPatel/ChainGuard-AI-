import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface DelayCauseData {
  cause: string;
  count: number;
  percentage: number;
}

interface Props {
  data: DelayCauseData[];
}

// Color palette for bars
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

// Custom label to show percentage on bars
const renderCustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  return (
    <text 
      x={x + width + 5} 
      y={y + height / 2} 
      fill="#f1f5f9" 
      textAnchor="start" 
      dominantBaseline="middle"
      fontSize={14}
      fontWeight={600}
    >
      {value}%
    </text>
  );
};

export default function DelayCausesChart({ data }: Props) {
  // Sort data by percentage descending
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Delay Causes Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={sortedData} 
          layout="vertical"
          margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            type="number"
            stroke="#94a3b8"
            style={{ fontSize: '14px' }}
            label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fill: '#94a3b8' } }}
          />
          <YAxis 
            type="category"
            dataKey="cause" 
            stroke="#94a3b8"
            style={{ fontSize: '14px' }}
            width={120}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
            formatter={(value: any) => [`${value} delays`, 'Count']}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {sortedData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            <LabelList dataKey="percentage" content={renderCustomLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
