import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface RiskData {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: RiskData[];
}

// Custom label to show percentage on pie segments
const renderLabel = (entry: any) => {
  const percent = entry.percent || 0;
  return `${(percent * 100).toFixed(0)}%`;
};

// Custom legend formatter to show counts and percentages
const renderLegend = (props: any) => {
  const { payload } = props;
  
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <li key={`legend-${index}`} className="flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300 text-sm">
            {entry.value}: <span className="font-semibold">{entry.payload.value}</span> ({entry.payload.percent}%)
          </span>
        </li>
      ))}
    </ul>
  );
};

export default function RiskDistributionChart({ data }: Props) {
  // Calculate total for percentage computation
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Enrich data with percentage for legend
  const enrichedData = data.map(item => ({
    ...item,
    percent: ((item.value / total) * 100).toFixed(1)
  }));

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={enrichedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {enrichedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            formatter={(value: any) => [`${value} shipments`, 'Count']}
          />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
