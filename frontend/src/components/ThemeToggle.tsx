import { Sun, Moon } from "lucide-react";
import { useState } from "react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600"
          : "bg-gradient-to-r from-blue-400 to-cyan-400 border border-blue-300"
      } shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        theme === "dark" ? "focus:ring-slate-500" : "focus:ring-blue-400"
      }`}
      aria-label="Toggle theme"
    >
      {/* Sliding Circle */}
      <div
        className={`absolute top-1 ${
          theme === "dark" ? "left-1" : "left-8"
        } w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center ${
          theme === "dark"
            ? "bg-slate-900 shadow-lg shadow-slate-900/50"
            : "bg-white shadow-lg shadow-blue-500/50"
        } ${isAnimating ? "scale-110" : ""}`}
      >
        {theme === "dark" ? (
          <Moon size={14} className="text-blue-400" />
        ) : (
          <Sun size={14} className="text-yellow-500" />
        )}
      </div>

      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <Sun
          size={12}
          className={`transition-opacity duration-300 ${
            theme === "light" ? "opacity-0" : "opacity-40 text-slate-400"
          }`}
        />
        <Moon
          size={12}
          className={`transition-opacity duration-300 ${
            theme === "dark" ? "opacity-0" : "opacity-40 text-white"
          }`}
        />
      </div>
    </button>
  );
}
