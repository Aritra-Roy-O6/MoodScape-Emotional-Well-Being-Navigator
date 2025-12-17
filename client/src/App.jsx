import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Play, CheckCircle } from 'lucide-react';

// --- DATA: MOOD THEMES ---
// Maps API emotions to Tailwind colors
const THEMES = {
  "Anxious": "bg-indigo-900 text-indigo-50",
  "Overwhelmed": "bg-slate-800 text-slate-50",
  "Low": "bg-stone-800 text-stone-100",
  "Sad": "bg-gray-900 text-gray-200",
  "Energized": "bg-orange-500 text-white",
  "Calm": "bg-teal-700 text-teal-50",
  "Focused": "bg-violet-900 text-violet-50",
  "Default": "bg-slate-100 text-slate-900"
};

// --- DATA: RITUALS ---
// The solution for each emotion
const RITUALS = {
  "Anxious": { 
    title: "4-7-8 Breathing", 
    steps: ["Sit comfortably.", "Inhale through nose (4s).", "Hold breath (7s).", "Exhale through mouth (8s).", "Repeat 4 times."] 
  },
  "Overwhelmed": { 
    title: "5-4-3-2-1 Grounding", 
    steps: ["Look around you.", "Name 5 things you see.", "Name 4 things you can feel.", "Name 3 sounds you hear.", "Name 2 smells.", "Name 1 thing you taste."] 
  },
  "Low": { 
    title: "The Sunlight Viz", 
    steps: ["Close your eyes.", "Imagine a warm golden light.", "Feel it hitting your forehead.", "Let it fill your chest.", "Sit in the warmth for 30s."] 
  },
  "Sad": { 
    title: "Hand on Heart", 
    steps: ["Place your hand on your heart.", "Feel its beat.", "Take a deep breath.", "Say: 'I am doing my best.'", "Say: 'I am safe.'"] 
  },
  "Energized": { 
    title: "Channel the Fire", 
    steps: ["Stand up.", "Shake your arms out.", "Pick ONE big task.", "Set a timer for 20 mins.", "GO."] 
  },
  "Calm": { 
    title: "Gratitude Anchor", 
    steps: ["You are in a good place.", "Think of one person you love.", "Send them a mental 'Thank You'.", "Smile."] 
  },
  "Focused": { 
    title: "Deep Work Entry", 
    steps: ["Put phone in another room.", "Close all tabs except one.", "Write down your single goal.", "Start."] 
  }
};

function App() {
  // State
  const [input, setInput] = useState("");
  const [mood, setMood] = useState("Default");
  const [ritual, setRitual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // For the ritual player

  // Handle Analysis
  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      // Call Python Brain
      const res = await axios.post('http://localhost:8000/predict', { text: input });
      
      const detected = res.data.emotion;
      setMood(detected);
      
      // Load Ritual (Fallback to Calm if emotion not found)
      setRitual(RITUALS[detected] || RITUALS["Calm"]);
      setStepIndex(0); // Reset ritual player

    } catch (error) {
      console.error("API Error:", error);
      alert("Brain connection failed. Is the python terminal running?");
    }
    setLoading(false);
  };

  // Reset to start over
  const reset = () => {
    setMood("Default");
    setRitual(null);
    setInput("");
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 flex items-center justify-center p-4 ${THEMES[mood] || THEMES.Default}`}>
      <div className="max-w-md w-full">
        
        {/* HEADER */}
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
            <Sparkles className="w-6 h-6" /> MoodScape
          </h1>
          {mood !== "Default" && (
            <button onClick={reset} className="opacity-70 hover:opacity-100 transition">
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          
          {/* VIEW 1: INPUT SCREEN */}
          {mood === "Default" && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <label className="text-xl font-medium opacity-80 block">
                How are you feeling right now?
              </label>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I'm feeling overwhelmed by deadlines..."
                className="w-full h-40 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border-none text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-black/20 outline-none text-lg resize-none shadow-xl"
              />
              <button 
                onClick={handleAnalyze}
                disabled={loading || !input}
                className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
              >
                {loading ? "Analyzing..." : "Check In"}
              </button>
            </motion.div>
          )}

          {/* VIEW 2: RITUAL PLAYER */}
          {mood !== "Default" && ritual && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20"
            >
              {/* Emotion Tag */}
              <div className="mb-6">
                <span className="text-sm uppercase tracking-widest opacity-70">Detected Mood</span>
                <h2 className="text-4xl font-black mt-1">{mood}</h2>
              </div>

              {/* Ritual Card */}
              <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                  <Play className="w-5 h-5 text-blue-600 fill-blue-600" />
                  <h3 className="font-bold text-lg">{ritual.title}</h3>
                </div>

                {/* Step Player */}
                <div className="min-h-[120px] flex items-center justify-center text-center">
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={stepIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-2xl font-medium"
                    >
                      {ritual.steps[stepIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="flex gap-1">
                    {ritual.steps.map((_, i) => (
                      <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === stepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (stepIndex < ritual.steps.length - 1) {
                        setStepIndex(stepIndex + 1);
                      } else {
                        reset(); // Complete
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    {stepIndex < ritual.steps.length - 1 ? "Next Step" : "Complete"}
                    {stepIndex === ritual.steps.length - 1 && <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;