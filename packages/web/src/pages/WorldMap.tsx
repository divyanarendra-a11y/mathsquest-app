import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { usersApi } from '../lib/api';
import { StarRating } from '../components/StarRating';
import { XpBar } from '../components/XpBar';
import type { WorldData } from '../lib/api';

// World node positions on the map (percent-based so they scale with container)
const WORLD_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 12, y: 72 },
  2: { x: 28, y: 42 },
  3: { x: 20, y: 18 },
  4: { x: 45, y: 28 },
  5: { x: 65, y: 48 },
  6: { x: 78, y: 22 },
  7: { x: 88, y: 62 },
};

// SVG path connecting world nodes (approximate)
const MAP_PATH =
  'M 12,72 Q 20,57 28,42 Q 24,30 20,18 Q 32,22 45,28 Q 55,38 65,48 Q 71,35 78,22 Q 83,42 88,62';

interface WorldNodeProps {
  world: WorldData;
  onClick: () => void;
  isSelected: boolean;
}

function WorldNode({ world, onClick, isSelected }: WorldNodeProps) {
  const pos = WORLD_POSITIONS[world.orderIndex];
  const maxStars = 3 * 2; // 2 puzzles × 3 stars each (rough estimate)

  return (
    <motion.button
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 focus:outline-none"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onClick={onClick}
      whileHover={world.unlocked ? { scale: 1.12 } : {}}
      whileTap={world.unlocked ? { scale: 0.95 } : {}}
      aria-label={`${world.name}${world.unlocked ? '' : ' (locked)'}`}
      aria-pressed={isSelected}
    >
      {/* Node circle */}
      <div
        className={`relative w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl border-4 transition-all duration-300
          ${world.unlocked
            ? isSelected
              ? 'border-white scale-110 animate-pulse-glow'
              : 'border-white/60 hover:border-white'
            : 'border-gray-700 grayscale opacity-60 cursor-not-allowed'
          }`}
        style={{ background: world.unlocked ? world.color : '#374151' }}
      >
        <span role="img" aria-hidden="true">{world.iconEmoji}</span>

        {/* Lock icon overlay */}
        {!world.unlocked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <span className="text-2xl">🔒</span>
          </div>
        )}

        {/* Progress ring */}
        {world.unlocked && world.percentComplete > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 64 64"
            width="64"
            height="64"
          >
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${(world.percentComplete / 100) * 176} 176`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* World name */}
      <span
        className={`text-xs font-bold font-body px-2 py-0.5 rounded-full shadow ${
          world.unlocked ? 'bg-gray-900/80 text-white' : 'bg-gray-800/60 text-gray-500'
        }`}
      >
        {world.name}
      </span>

      {/* Stars */}
      {world.unlocked && world.starsEarned > 0 && (
        <StarRating stars={Math.min(3, Math.round((world.starsEarned / maxStars) * 3))} size="sm" />
      )}
    </motion.button>
  );
}

interface WorldDetailPanelProps {
  world: WorldData;
  onEnter: () => void;
  onClose: () => void;
}

function WorldDetailPanel({ world, onEnter, onClose }: WorldDetailPanelProps) {
  return (
    <motion.div
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[min(90%,420px)] bg-gray-900/95 border border-white/20 rounded-2xl p-5 shadow-2xl backdrop-blur-sm z-20"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{world.iconEmoji}</span>
        <div>
          <h2 className="font-display text-white text-xl">{world.name}</h2>
          <span className="text-xs text-gray-400 font-body">{world.curriculumUnit}</span>
        </div>
      </div>

      <p className="text-gray-300 text-sm font-body mb-4">{world.description}</p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(world.percentComplete)}%</span>
        </div>
        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: world.color }}
            initial={{ width: 0 }}
            animate={{ width: `${world.percentComplete}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {world.percentComplete < 80 && world.percentComplete > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Reach 80% to unlock the next world ({80 - Math.round(world.percentComplete)}% to go)
          </p>
        )}
        {world.percentComplete >= 80 && (
          <p className="text-xs text-green-400 mt-1">Next world unlocked!</p>
        )}
      </div>

      <motion.button
        className="w-full py-3 rounded-xl font-display text-lg text-white shadow-lg"
        style={{ background: world.color }}
        onClick={onEnter}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {world.percentComplete > 0 ? 'Continue Adventure' : 'Start Adventure'}
      </motion.button>
    </motion.div>
  );
}

export function WorldMap() {
  const navigate = useNavigate();
  const { userId, xp, level, streakDays, worlds, hints, setProgress } = useStore();
  const [selectedWorld, setSelectedWorld] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    usersApi.getProgress(userId)
      .then((res) => setProgress(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, navigate, setProgress]);

  const handleWorldClick = (world: WorldData) => {
    if (!world.unlocked) return;
    setSelectedWorld((prev) => (prev?.id === world.id ? null : world));
  };

  const handleEnterWorld = (world: WorldData) => {
    navigate(`/worlds/${world.slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          className="text-5xl"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          ✨
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-body flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 bg-gray-900/80 backdrop-blur-sm border-b border-white/10 flex items-center gap-4">
        <h1 className="font-display text-2xl text-mq-gold">MathsQuest</h1>
        <div className="flex-1">
          <XpBar xp={xp} level={level} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {streakDays > 0 && (
            <span className="flex items-center gap-1 bg-orange-900/60 text-orange-300 px-2 py-1 rounded-lg">
              🔥 {streakDays}
            </span>
          )}
          <span className="flex items-center gap-1 bg-blue-900/60 text-blue-300 px-2 py-1 rounded-lg">
            💡 {hints}
          </span>
        </div>
      </header>

      {/* Map area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-blue-950 to-gray-950" />

        {/* Decorative stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%` }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, delay: Math.random() * 4 }}
            />
          ))}
        </div>

        {/* SVG path connecting worlds */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={MAP_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
        </svg>

        {/* World nodes */}
        <div className="relative w-full h-full" style={{ minHeight: '520px' }}>
          {worlds.map((world) => (
            <WorldNode
              key={world.id}
              world={world}
              onClick={() => handleWorldClick(world)}
              isSelected={selectedWorld?.id === world.id}
            />
          ))}
        </div>

        {/* World detail panel */}
        <AnimatePresence>
          {selectedWorld && (
            <WorldDetailPanel
              world={selectedWorld}
              onEnter={() => handleEnterWorld(selectedWorld)}
              onClose={() => setSelectedWorld(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
