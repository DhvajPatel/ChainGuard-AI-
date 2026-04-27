import { useEffect, useState } from "react";
import { Trophy, Star, Award, Target } from "lucide-react";

export default function PerformanceScore({ stats }: { stats: any }) {
  const [score, setScore] = useState(0);
  const [grade, setGrade] = useState("A+");
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!stats) return;

    // Calculate performance score (0-100)
    const onTimeWeight = 0.5;
    const delayWeight = 0.3;
    const riskWeight = 0.2;

    const onTimeScore = stats.on_time_rate;
    const delayScore = Math.max(0, 100 - (stats.avg_delay_minutes / 60) * 100);
    const riskScore = Math.max(0, 100 - (stats.at_risk / stats.total) * 100);

    const totalScore = Math.round(
      onTimeScore * onTimeWeight +
      delayScore * delayWeight +
      riskScore * riskWeight
    );

    setScore(totalScore);

    // Determine grade
    if (totalScore >= 95) setGrade("A+");
    else if (totalScore >= 90) setGrade("A");
    else if (totalScore >= 85) setGrade("A-");
    else if (totalScore >= 80) setGrade("B+");
    else if (totalScore >= 75) setGrade("B");
    else setGrade("C");

    // Animate score
    let current = 0;
    const increment = totalScore / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= totalScore) {
        setAnimatedScore(totalScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, 20);

    return () => clearInterval(timer);
  }, [stats]);

  const getScoreColor = () => {
    if (score >= 90) return "from-green-500 to-emerald-600";
    if (score >= 80) return "from-blue-500 to-cyan-600";
    if (score >= 70) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  const getGlowColor = () => {
    if (score >= 90) return "shadow-green-500/50";
    if (score >= 80) return "shadow-blue-500/50";
    if (score >= 70) return "shadow-yellow-500/50";
    return "shadow-red-500/50";
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/10">
      <div className="px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-900/40 to-orange-900/40">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          Performance Score
        </h3>
      </div>
      <div className="p-8">
        <div className="flex items-center justify-center mb-6">
          {/* Circular Score Display */}
          <div className="relative w-48 h-48">
            {/* Background Circle */}
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-slate-800"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - animatedScore / 100)}`}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 10px currentColor)'
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={score >= 90 ? "text-green-500" : score >= 80 ? "text-blue-500" : score >= 70 ? "text-yellow-500" : "text-red-500"} stopColor="currentColor" />
                  <stop offset="100%" className={score >= 90 ? "text-emerald-600" : score >= 80 ? "text-cyan-600" : score >= 70 ? "text-orange-600" : "text-rose-600"} stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl font-black bg-gradient-to-br ${getScoreColor()} bg-clip-text text-transparent mb-1`}>
                {animatedScore}
              </div>
              <div className="text-slate-400 text-sm font-semibold">out of 100</div>
              <div className={`mt-2 px-4 py-1 bg-gradient-to-r ${getScoreColor()} rounded-full shadow-xl ${getGlowColor()}`}>
                <span className="text-white font-black text-xl">{grade}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.on_time_rate}%</div>
            <div className="text-xs text-slate-400">On-Time Rate</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Award className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{Math.round(stats?.avg_delay_minutes || 0)}m</div>
            <div className="text-xs text-slate-400">Avg Delay</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.on_time || 0}</div>
            <div className="text-xs text-slate-400">Success</div>
          </div>
        </div>

        {/* Achievement Badge */}
        {score >= 90 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-bold">Outstanding Performance!</p>
                <p className="text-slate-400 text-sm">You're in the top 5% of logistics operators</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
