import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { puzzlesApi } from '../lib/api';

// ─── Equation bank ───────────────────────────────────────────────────────────

interface Equation {
  display: string;   // e.g. "2x + 3 = 11"
  answer: number;
  hint: string;
}

const LEVELS: Equation[][] = [
  // Level 1 — one-step
  [
    { display: 'x + 3 = 7',   answer: 4,  hint: 'Subtract 3 from both sides' },
    { display: 'x − 5 = 8',   answer: 13, hint: 'Add 5 to both sides' },
    { display: '2x = 14',     answer: 7,  hint: 'Divide both sides by 2' },
    { display: 'x + 9 = 16',  answer: 7,  hint: 'Subtract 9 from both sides' },
    { display: '3x = 18',     answer: 6,  hint: 'Divide both sides by 3' },
    { display: 'x − 7 = 4',   answer: 11, hint: 'Add 7 to both sides' },
    { display: '4x = 20',     answer: 5,  hint: 'Divide both sides by 4' },
    { display: 'x + 12 = 20', answer: 8,  hint: 'Subtract 12 from both sides' },
  ],
  // Level 2 — two-step
  [
    { display: '2x + 3 = 11',  answer: 4, hint: 'First subtract 3, then divide by 2' },
    { display: '3x − 2 = 13',  answer: 5, hint: 'First add 2, then divide by 3' },
    { display: '4x + 1 = 17',  answer: 4, hint: 'First subtract 1, then divide by 4' },
    { display: '5x − 3 = 22',  answer: 5, hint: 'First add 3, then divide by 5' },
    { display: '2x + 7 = 15',  answer: 4, hint: 'First subtract 7, then divide by 2' },
    { display: '3x − 5 = 10',  answer: 5, hint: 'First add 5, then divide by 3' },
    { display: '6x + 2 = 20',  answer: 3, hint: 'First subtract 2, then divide by 6' },
    { display: '4x − 3 = 21',  answer: 6, hint: 'First add 3, then divide by 4' },
  ],
  // Level 3 — brackets
  [
    { display: '2(x + 3) = 14',  answer: 4, hint: 'Divide by 2 first, then subtract 3' },
    { display: '3(x − 1) = 12',  answer: 5, hint: 'Divide by 3 first, then add 1' },
    { display: '2(2x + 1) = 10', answer: 2, hint: 'Divide by 2, then subtract 1, then divide by 2' },
    { display: '4(x − 2) = 12',  answer: 5, hint: 'Divide by 4 first, then add 2' },
    { display: '3(x + 4) = 21',  answer: 3, hint: 'Divide by 3 first, then subtract 4' },
    { display: '5(x − 2) = 15',  answer: 5, hint: 'Divide by 5 first, then add 2' },
    { display: '2(3x − 1) = 16', answer: 3, hint: 'Divide by 2, add 1, then divide by 3' },
    { display: '4(2x + 3) = 44', answer: 4, hint: 'Divide by 4, subtract 3, then divide by 2' },
  ],
];

const MACHINE_LABELS = ['⚙️', '🔩', '🪛', '⚡', '🔧', '💡', '🤖', '🏭'];

type MachineState = 'idle' | 'active' | 'powered' | 'error';

// ─── Component ───────────────────────────────────────────────────────────────

export function RobotFactory() {
  const navigate = useNavigate();
  const { userId, addXp } = useStore();

  const [levelIdx, setLevelIdx] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'complete'>('ready');
  const [machines, setMachines] = useState<MachineState[]>(Array(8).fill('idle'));
  const [currentMachine, setCurrentMachine] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);
  const [score, setScore] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{ xpGained: number; starsEarned: number } | null>(null);
  const startTimeRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const equations = LEVELS[levelIdx];
  const current = equations[currentMachine];

  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus();
  }, [currentMachine, phase]);

  const startGame = (level: number) => {
    setLevelIdx(level);
    setPhase('playing');
    setMachines(Array(8).fill('idle'));
    setCurrentMachine(0);
    setInputVal('');
    setScore(0);
    setWrongAttempts(0);
    setHintsUsed(0);
    setShowHint(false);
    setFeedback(null);
    setResult(null);
    startTimeRef.current = Date.now();
  };

  const submitAttempt = useCallback(async (finalScore: number, hints: number) => {
    if (!userId) return;
    try {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await puzzlesApi.attempt('robot-factory', {
        score: finalScore,
        maxScore: 80,
        timeTaken,
        hintsUsed: hints,
      });
      setResult({ xpGained: res.data.xpGained, starsEarned: res.data.starsEarned });
      addXp(res.data.xpGained);
    } catch (err) {
      console.error('Failed to submit', err);
    }
  }, [userId, addXp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(inputVal.trim());
    if (isNaN(parsed)) return;

    if (parsed === current.answer) {
      // Correct!
      const pts = Math.max(5, 10 - wrongAttempts * 2);
      const newScore = score + pts;
      setScore(newScore);
      setFeedback({ type: 'correct', msg: `x = ${current.answer} ✓  +${pts} pts` });
      setShowHint(false);

      setMachines((prev) => {
        const next = [...prev];
        next[currentMachine] = 'powered';
        if (currentMachine + 1 < 8) next[currentMachine + 1] = 'active';
        return next;
      });

      setTimeout(() => {
        setFeedback(null);
        setInputVal('');
        if (currentMachine + 1 < 8) {
          setCurrentMachine((m) => m + 1);
          setWrongAttempts(0);
        } else {
          setPhase('complete');
          submitAttempt(newScore, hintsUsed);
        }
      }, 1000);
    } else {
      setWrongAttempts((w) => w + 1);
      setFeedback({ type: 'wrong', msg: 'Not quite — the assembly line has halted! Try again.' });
      setMachines((prev) => {
        const next = [...prev];
        next[currentMachine] = 'error';
        return next;
      });
      setTimeout(() => {
        setMachines((prev) => {
          const next = [...prev];
          next[currentMachine] = 'active';
          return next;
        });
        setFeedback(null);
        setInputVal('');
        inputRef.current?.focus();
      }, 1200);
    }
  };

  const useHint = () => {
    setHintsUsed((h) => h + 1);
    setShowHint(true);
  };

  // ── Ready screen ──
  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-lg flex items-center justify-between mb-6">
          <button className="text-gray-400 hover:text-white" onClick={() => navigate('/worlds/algebra-jungle')}>← Back</button>
          <h1 className="font-display text-2xl text-white">Robot Factory 🤖</h1>
          <div className="w-16" />
        </div>

        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-7xl mb-4">🏭</div>
          <h2 className="font-display text-3xl text-white mb-3">Robot Factory</h2>
          <p className="text-gray-300 mb-6">
            Balance equations to power machines on the assembly line. Each correct answer activates the next machine.
            A wrong answer halts the line until you fix it!
          </p>

          <div className="space-y-3 mb-8">
            {LEVELS.map((_, i) => (
              <motion.button
                key={i}
                className="w-full py-4 rounded-xl font-display text-lg text-white shadow-lg flex items-center justify-between px-6"
                style={{ background: ['#4CAF50', '#FF9800', '#F44336'][i] }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startGame(i)}
              >
                <span>{['⭐ Easy', '⭐⭐ Medium', '⭐⭐⭐ Hard'][i]}</span>
                <span className="text-sm opacity-80">{['One-step', 'Two-step', 'Brackets'][i]} equations</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Complete screen ──
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-lg flex items-center justify-between mb-6">
          <button className="text-gray-400 hover:text-white" onClick={() => navigate('/worlds/algebra-jungle')}>← Back</button>
          <h1 className="font-display text-2xl text-white">Robot Factory 🤖</h1>
          <div className="w-16" />
        </div>

        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 text-center shadow-2xl">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="text-7xl mb-3">🎉</div>
          </motion.div>
          <h2 className="font-display text-3xl text-white mb-1">Assembly Line Complete!</h2>
          <p className="text-gray-400 mb-4">All 8 machines powered up</p>

          <div className="text-5xl font-display text-mq-gold mb-2">{score}</div>
          <p className="text-gray-400 text-sm mb-6">points</p>

          {result && (
            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3 mb-4">
              <p className="text-green-300 font-bold">+{result.xpGained} XP earned!</p>
              <div className="flex justify-center gap-1 mt-1">
                {[1,2,3].map((i) => (
                  <span key={i} className={`text-2xl ${i <= result.starsEarned ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                ))}
              </div>
            </div>
          )}

          {/* All machines powered */}
          <div className="grid grid-cols-8 gap-1 mb-6">
            {MACHINE_LABELS.map((emoji, i) => (
              <motion.div
                key={i}
                className="aspect-square rounded-lg bg-green-500/20 border border-green-400/50 flex items-center justify-center text-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring' }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-mq-purple hover:bg-purple-600 text-white font-display text-lg rounded-xl" onClick={() => setPhase('ready')}>
              Play Again
            </button>
            <button className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-display text-lg rounded-xl" onClick={() => navigate('/')}>
              World Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing screen ──
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-4 px-4">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <button className="text-gray-400 hover:text-white" onClick={() => navigate('/worlds/algebra-jungle')}>← Back</button>
        <h1 className="font-display text-2xl text-white">Robot Factory 🤖</h1>
        <span className="font-display text-mq-gold">{score} pts</span>
      </div>

      {/* Assembly line */}
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Assembly Line</p>
        <div className="grid grid-cols-8 gap-2">
          {MACHINE_LABELS.map((emoji, i) => {
            const state = machines[i];
            return (
              <motion.div
                key={i}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xl border-2 relative transition-all duration-300 ${
                  state === 'powered'
                    ? 'bg-green-500/20 border-green-400 shadow-lg shadow-green-500/20'
                    : state === 'active'
                      ? 'bg-blue-500/20 border-blue-400 animate-pulse-glow'
                      : state === 'error'
                        ? 'bg-red-500/20 border-red-400'
                        : 'bg-gray-800 border-gray-700'
                }`}
                animate={state === 'powered' ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <span>{emoji}</span>
                {state === 'powered' && <span className="text-xs text-green-400 mt-0.5">✓</span>}
                {state === 'error' && <span className="text-xs text-red-400 mt-0.5">✗</span>}
                {state === 'active' && <span className="text-xs text-blue-300 mt-0.5">▶</span>}
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Machine {currentMachine + 1} of 8</span>
          <span>{machines.filter((m) => m === 'powered').length} powered</span>
        </div>
      </div>

      {/* Equation card */}
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">
              Machine {currentMachine + 1} needs:
            </p>
            <p className="text-4xl font-display text-white tracking-wide">{current.display}</p>
          </div>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 text-3xl">
            {MACHINE_LABELS[currentMachine]}
          </div>
        </div>

        <AnimatePresence>
          {showHint && (
            <motion.div
              className="mb-4 bg-blue-900/40 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-200"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              💡 Hint: {current.hint}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-display text-lg">x =</span>
            <input
              ref={inputRef}
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-gray-800 text-white text-xl pl-14 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-mq-purple"
              placeholder="?"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-mq-purple hover:bg-purple-600 text-white font-display text-lg rounded-xl transition-colors"
          >
            Power ⚡
          </button>
        </form>

        <AnimatePresence>
          {feedback && (
            <motion.div
              className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${
                feedback.type === 'correct'
                  ? 'bg-green-900/50 text-green-300 border border-green-500/30'
                  : 'bg-red-900/50 text-red-300 border border-red-500/30'
              }`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {!showHint && (
          <button
            className="mt-3 text-sm text-gray-500 hover:text-blue-400 transition-colors"
            onClick={useHint}
          >
            💡 Use a hint token
          </button>
        )}
      </div>

      {/* Level badge */}
      <div className="text-sm text-gray-500">
        {['⭐ Easy — One-step', '⭐⭐ Medium — Two-step', '⭐⭐⭐ Hard — Brackets'][levelIdx]}
      </div>
    </div>
  );
}
