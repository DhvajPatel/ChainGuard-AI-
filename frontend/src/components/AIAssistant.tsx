import { useState, useEffect } from "react";
import { Brain, Sparkles, Send, X } from "lucide-react";

interface Message {
  type: "ai" | "user";
  text: string;
  timestamp: Date;
}

export default function AIAssistant({ shipments }: { shipments: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Generate AI insights when shipments change
    if (shipments.length > 0 && messages.length === 0) {
      const highRisk = shipments.filter(s => s.delay_probability >= 65).length;
      const initialMessage: Message = {
        type: "ai",
        text: `Hello! I'm your AI logistics assistant. I've analyzed ${shipments.length} shipments and detected ${highRisk} high-risk deliveries. How can I help optimize your operations today?`,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [shipments]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      type: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on current traffic patterns, I recommend switching Route A to avoid congestion. This could save 25 minutes.",
        "I've detected weather disruptions on 3 routes. Would you like me to suggest alternative paths?",
        "Your on-time delivery rate is excellent at 85%! The main delay factor is heavy traffic during peak hours.",
        "I can optimize your fleet allocation to reduce delays by 30%. Shall I generate a detailed plan?",
        "Real-time analysis shows Route B has cleared up. You can now safely route 5 pending shipments through it."
      ];

      const aiMessage: Message = {
        type: "ai",
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setInput("");
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-2xl shadow-purple-500/50 flex items-center justify-center hover:scale-110 transition-all duration-300 z-50 group"
      >
        <Brain className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-slate-900" />
        <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" />
      </button>

      {/* AI Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-96 h-[500px] bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    AI Assistant
                    <Sparkles size={16} className="text-purple-400" />
                  </h3>
                  <p className="text-purple-400/80 text-xs">Always learning, always optimizing</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom duration-300`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.type === "user"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                      : "bg-slate-800/80 border border-purple-500/30 text-slate-200"
                  }`}
                >
                  {msg.type === "ai" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-purple-400" />
                      <span className="text-purple-400 text-xs font-bold">AI</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-purple-500/20 bg-slate-800/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-purple-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
