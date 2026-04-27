interface Props {
  status: string;
  color: string;
}

const styles: Record<string, string> = {
  green: "bg-green-500/20 text-green-400 border-green-500/50 shadow-lg shadow-green-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-lg shadow-yellow-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/30",
};

const dots: Record<string, string> = {
  green: "bg-green-400 shadow-lg shadow-green-400/50",
  yellow: "bg-yellow-400 shadow-lg shadow-yellow-400/50",
  red: "bg-red-400 shadow-lg shadow-red-400/50",
};

export default function StatusBadge({ status, color }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm uppercase tracking-wider ${styles[color] ?? styles.green}`}>
      <span className="relative">
        <span className={`w-2 h-2 rounded-full ${dots[color] ?? dots.green} animate-pulse`} />
        <span className={`absolute inset-0 w-2 h-2 rounded-full ${dots[color] ?? dots.green} animate-ping`} />
      </span>
      {status}
    </span>
  );
}
