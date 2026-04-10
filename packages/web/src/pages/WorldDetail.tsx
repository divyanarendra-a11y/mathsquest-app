import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { StarRating } from '../components/StarRating';

interface Puzzle {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  orderIndex: number;
}

interface WorldDetailData {
  world: { id: string; name: string; description: string; color: string; iconEmoji: string; curriculumUnit: string };
  puzzles: Puzzle[];
}

// Map puzzle slugs to their routes
const PUZZLE_ROUTES: Record<string, string> = {
  'prime-smash': '/puzzles/prime-smash',
  'robot-factory': '/puzzles/robot-factory',
  'recipe-rescaler': '/puzzles/recipe-rescaler',
};

export function WorldDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const worlds = useStore((s) => s.worlds);
  const [data, setData] = useState<WorldDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get<WorldDetailData>(`/worlds/${slug}/puzzles`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const worldProgress = worlds.find((w) => w.slug === slug);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">World not found</div>;
  }

  const { world, puzzles } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-body">
      {/* Hero */}
      <div
        className="relative py-12 px-6 text-center"
        style={{ background: `linear-gradient(135deg, ${world.color}33, ${world.color}11)` }}
      >
        <button
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate('/')}
        >
          ← World Map
        </button>
        <div className="text-6xl mb-3">{world.iconEmoji}</div>
        <h1 className="font-display text-3xl text-white mb-1">{world.name}</h1>
        <p className="text-gray-300 text-sm">{world.curriculumUnit}</p>
        {worldProgress && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-sm text-gray-400">{Math.round(worldProgress.percentComplete)}% complete</span>
            <StarRating stars={Math.min(3, Math.round((worldProgress.starsEarned / (puzzles.length * 3)) * 3))} />
          </div>
        )}
      </div>

      {/* Puzzles list */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
        <h2 className="font-display text-xl mb-4">Challenges</h2>
        {puzzles.map((puzzle, i) => {
          const route = PUZZLE_ROUTES[puzzle.slug];
          const available = !!route;
          return (
            <motion.div
              key={puzzle.id}
              className={`bg-gray-900 rounded-xl p-4 border ${available ? 'border-white/10 hover:border-white/30 cursor-pointer' : 'border-gray-800 opacity-60'} transition-all`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => available && navigate(route)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{available ? '🎮' : '🔜'}</span>
                  <div>
                    <p className="font-bold text-white">{puzzle.name}</p>
                    <p className="text-gray-400 text-sm">{puzzle.description}</p>
                  </div>
                </div>
                {available && <span className="text-gray-500">→</span>}
                {!available && <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded">Coming soon</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
