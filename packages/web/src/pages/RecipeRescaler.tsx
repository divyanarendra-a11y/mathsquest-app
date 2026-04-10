import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { puzzlesApi } from '../lib/api';

// ─── Recipe data ─────────────────────────────────────────────────────────────

interface Ingredient {
  name: string;
  originalAmount: number;
  unit: string;
  emoji: string;
  scaledAmount: number; // computed from ratio
}

interface Recipe {
  name: string;
  emoji: string;
  fromServings: number;
  toServings: number;
  ingredients: Omit<Ingredient, 'scaledAmount'>[];
  cookingSteps: Array<{ emoji: string; text: string }>;
}

const RECIPES: Recipe[] = [
  {
    name: 'Cosmic Cookies',
    emoji: '🍪',
    fromServings: 4,
    toServings: 17,
    ingredients: [
      { name: 'Flour',           originalAmount: 200, unit: 'g',  emoji: '🌾' },
      { name: 'Butter',          originalAmount: 100, unit: 'g',  emoji: '🧈' },
      { name: 'Sugar',           originalAmount: 80,  unit: 'g',  emoji: '🍚' },
      { name: 'Milk',            originalAmount: 120, unit: 'ml', emoji: '🥛' },
      { name: 'Chocolate chips', originalAmount: 40,  unit: 'g',  emoji: '🍫' },
    ],
    cookingSteps: [
      { emoji: '🥣', text: 'Mix the dry ingredients together' },
      { emoji: '🧈', text: 'Cream the butter and sugar until fluffy' },
      { emoji: '🥛', text: 'Add milk and stir well' },
      { emoji: '🍫', text: 'Fold in the chocolate chips' },
      { emoji: '♨️', text: 'Bake at 180°C for 12 minutes' },
    ],
  },
  {
    name: 'Space Smoothie',
    emoji: '🥤',
    fromServings: 2,
    toServings: 9,
    ingredients: [
      { name: 'Blueberries', originalAmount: 100, unit: 'g',  emoji: '🫐' },
      { name: 'Banana',      originalAmount: 60,  unit: 'g',  emoji: '🍌' },
      { name: 'Yoghurt',     originalAmount: 80,  unit: 'g',  emoji: '🥛' },
      { name: 'Honey',       originalAmount: 20,  unit: 'ml', emoji: '🍯' },
      { name: 'Ice',         originalAmount: 40,  unit: 'g',  emoji: '🧊' },
    ],
    cookingSteps: [
      { emoji: '🫐', text: 'Wash and prepare the blueberries' },
      { emoji: '🍌', text: 'Slice the banana' },
      { emoji: '🥛', text: 'Add yoghurt to the blender' },
      { emoji: '🍯', text: 'Drizzle in the honey' },
      { emoji: '🧊', text: 'Blend with ice until smooth' },
    ],
  },
  {
    name: 'Galaxy Granola',
    emoji: '🌟',
    fromServings: 6,
    toServings: 15,
    ingredients: [
      { name: 'Oats',        originalAmount: 300, unit: 'g',  emoji: '🌾' },
      { name: 'Honey',       originalAmount: 60,  unit: 'ml', emoji: '🍯' },
      { name: 'Coconut oil', originalAmount: 30,  unit: 'ml', emoji: '🥥' },
      { name: 'Almonds',     originalAmount: 90,  unit: 'g',  emoji: '🥜' },
      { name: 'Dried mango', originalAmount: 60,  unit: 'g',  emoji: '🥭' },
    ],
    cookingSteps: [
      { emoji: '🌾', text: 'Spread the oats in a baking tray' },
      { emoji: '🍯', text: 'Drizzle honey and oil over the oats' },
      { emoji: '🥜', text: 'Scatter the almonds on top' },
      { emoji: '♨️', text: 'Bake at 160°C for 25 minutes, stirring halfway' },
      { emoji: '🥭', text: 'Stir in the dried mango once cooled' },
    ],
  },
];

function buildIngredients(recipe: Recipe): Ingredient[] {
  const ratio = recipe.toServings / recipe.fromServings;
  return recipe.ingredients.map((ing) => ({
    ...ing,
    scaledAmount: Math.round(ing.originalAmount * ratio * 100) / 100,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecipeRescaler() {
  const navigate = useNavigate();
  const { userId, addXp } = useStore();

  const [recipeIdx, setRecipeIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'complete'>('ready');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, 'correct' | 'wrong' | null>>({});
  const [unlockedSteps, setUnlockedSteps] = useState(0);
  const [reverting, setReverting] = useState(false);
  const [score, setScore] = useState(0);
  const [_wrongCount, setWrongCount] = useState(0);
  const [result, setResult] = useState<{ xpGained: number; starsEarned: number } | null>(null);
  const startTimeRef = useRef(Date.now());

  const recipe = recipeIdx !== null ? RECIPES[recipeIdx] : null;
  const ingredients = recipe ? buildIngredients(recipe) : [];

  const submitAttempt = useCallback(async (finalScore: number) => {
    if (!userId) return;
    try {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await puzzlesApi.attempt('recipe-rescaler', {
        score: finalScore,
        maxScore: 50,
        timeTaken,
      });
      setResult({ xpGained: res.data.xpGained, starsEarned: res.data.starsEarned });
      addXp(res.data.xpGained);
    } catch (err) {
      console.error(err);
    }
  }, [userId, addXp]);

  const startRecipe = (idx: number) => {
    setRecipeIdx(idx);
    setPhase('playing');
    setAnswers({});
    setChecked({});
    setUnlockedSteps(0);
    setScore(0);
    setWrongCount(0);
    setResult(null);
    setReverting(false);
    startTimeRef.current = Date.now();
  };

  const handleCheck = (i: number) => {
    const ing = ingredients[i];
    const userVal = parseFloat(answers[i] ?? '');
    if (isNaN(userVal)) return;

    const correct = Math.abs(userVal - ing.scaledAmount) < 0.01;

    if (correct) {
      setChecked((prev) => ({ ...prev, [i]: 'correct' }));
      setScore((s) => s + 10);

      // Check how many are now correct
      const newCorrectCount = Object.values({ ...checked, [i]: 'correct' as const }).filter((v) => v === 'correct').length;

      // Unlock a cooking step if we hit a milestone (every ingredient unlocks one step)
      const newUnlocked = newCorrectCount;
      if (newUnlocked > unlockedSteps) {
        setUnlockedSteps(newUnlocked);
      }

      // Check if all correct
      if (newCorrectCount === ingredients.length) {
        setPhase('complete');
        submitAttempt(score + 10);
      }
    } else {
      setWrongCount((w) => w + 1);
      setChecked((prev) => ({ ...prev, [i]: 'wrong' }));
      // Reverse last unlocked step
      if (unlockedSteps > 0) {
        setReverting(true);
        setTimeout(() => {
          setUnlockedSteps((s) => Math.max(0, s - 1));
          setReverting(false);
        }, 800);
      }
      // Clear wrong state after delay to allow retry
      setTimeout(() => {
        setChecked((prev) => ({ ...prev, [i]: null }));
        setAnswers((a) => ({ ...a, [i]: '' }));
      }, 1500);
    }
  };

  const ratio = recipe ? recipe.toServings / recipe.fromServings : 1;

  // ── Ready screen ──
  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-lg flex items-center justify-between mb-6">
          <button className="text-gray-400 hover:text-white" onClick={() => navigate('/worlds/ratio-ruins')}>← Back</button>
          <h1 className="font-display text-2xl text-white">Recipe Rescaler 🍳</h1>
          <div className="w-16" />
        </div>

        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-7xl mb-4">🍳</div>
          <h2 className="font-display text-3xl text-white mb-3">Recipe Rescaler</h2>
          <p className="text-gray-300 mb-6">
            Scale each recipe's ingredients for a different number of servings.
            Every correct ingredient unlocks an animated cooking step.
            A wrong answer reverses the last step!
          </p>

          <div className="space-y-3">
            {RECIPES.map((r, i) => (
              <motion.button
                key={i}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-left flex items-center gap-4 transition-colors"
                whileHover={{ x: 4 }}
                onClick={() => startRecipe(i)}
              >
                <span className="text-4xl">{r.emoji}</span>
                <div>
                  <p className="text-white font-bold">{r.name}</p>
                  <p className="text-gray-400 text-sm">
                    Scale from <strong className="text-white">{r.fromServings}</strong> to{' '}
                    <strong className="text-white">{r.toServings}</strong> servings
                    <span className="ml-2 text-yellow-400">(÷{r.fromServings} × {r.toServings})</span>
                  </p>
                </div>
                <span className="ml-auto text-gray-500">→</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Complete screen ──
  if (phase === 'complete' && recipe) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-lg flex items-center justify-between mb-6">
          <button className="text-gray-400 hover:text-white" onClick={() => navigate('/worlds/ratio-ruins')}>← Back</button>
          <h1 className="font-display text-2xl text-white">Recipe Rescaler 🍳</h1>
          <div className="w-16" />
        </div>

        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 text-center shadow-2xl">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="text-7xl mb-3">{recipe.emoji}</div>
          </motion.div>
          <h2 className="font-display text-3xl text-white mb-1">Recipe Complete!</h2>
          <p className="text-gray-400 mb-4">
            {recipe.name} scaled perfectly for {recipe.toServings} servings!
          </p>

          <div className="text-5xl font-display text-mq-gold mb-2">{score}</div>
          <p className="text-gray-400 text-sm mb-4">points</p>

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

          {/* All cooking steps */}
          <div className="space-y-2 mb-6 text-left">
            {recipe.cookingSteps.map((step, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-xl">{step.emoji}</span>
                <span className="text-green-200 text-sm">{step.text}</span>
                <span className="ml-auto text-green-400">✓</span>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-mq-purple hover:bg-purple-600 text-white font-display text-lg rounded-xl" onClick={() => setPhase('ready')}>
              Try Another
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
  if (!recipe) return null;

  const correctCount = Object.values(checked).filter((v) => v === 'correct').length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-4 px-4 pb-8">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <button className="text-gray-400 hover:text-white" onClick={() => navigate('/worlds/ratio-ruins')}>← Back</button>
        <h1 className="font-display text-xl text-white">{recipe.emoji} {recipe.name}</h1>
        <span className="font-display text-mq-gold">{score} pts</span>
      </div>

      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-4">
        {/* Left: recipe card */}
        <div className="bg-gray-900 rounded-2xl p-5">
          {/* Ratio banner */}
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl px-4 py-2 mb-4 text-center">
            <p className="text-yellow-200 text-sm">
              Scale from <strong>{recipe.fromServings}</strong> servings to{' '}
              <strong>{recipe.toServings}</strong> servings
            </p>
            <p className="text-yellow-400 text-xs mt-0.5">
              Multiply each amount by {recipe.toServings}/{recipe.fromServings} = {ratio.toFixed(2)}
            </p>
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Ingredients</p>
          <div className="space-y-3">
            {ingredients.map((ing, i) => {
              const state = checked[i];
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xl w-8">{ing.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{ing.name}</p>
                    <p className="text-xs text-gray-500">
                      Original: {ing.originalAmount}{ing.unit}
                    </p>
                  </div>
                  {state === 'correct' ? (
                    <div className="flex items-center gap-1 bg-green-900/40 border border-green-500/30 rounded-lg px-3 py-2">
                      <span className="text-green-300 font-bold">{ing.scaledAmount}{ing.unit}</span>
                      <span className="text-green-400">✓</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={answers[i] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheck(i)}
                        className={`w-24 bg-gray-800 text-white text-sm px-2 py-2 rounded-lg outline-none focus:ring-2 ${
                          state === 'wrong'
                            ? 'ring-2 ring-red-500 focus:ring-red-500'
                            : 'focus:ring-mq-purple'
                        }`}
                        placeholder={`? ${ing.unit}`}
                        disabled={state !== null}
                      />
                      <button
                        className="p-2 bg-mq-purple hover:bg-purple-600 rounded-lg transition-colors text-white text-sm"
                        onClick={() => handleCheck(i)}
                        disabled={state !== null}
                      >
                        ✓
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3">Tip: Press Enter or ✓ to check each ingredient</p>
        </div>

        {/* Right: cooking steps */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Cooking Steps</p>
            {reverting && (
              <motion.span
                className="text-xs text-red-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                ↩ Step reversed!
              </motion.span>
            )}
          </div>

          <div className="space-y-2">
            {recipe.cookingSteps.map((step, i) => {
              const unlocked = i < unlockedSteps;
              const isNext = i === unlockedSteps;
              return (
                <motion.div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 border transition-all duration-500 ${
                    unlocked
                      ? 'bg-green-900/20 border-green-500/30'
                      : isNext
                        ? 'bg-gray-800 border-mq-purple/40 border-dashed'
                        : 'bg-gray-800/50 border-gray-800 opacity-40'
                  }`}
                  animate={unlocked && !reverting ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span className={`text-2xl ${!unlocked && !isNext && 'grayscale opacity-40'}`}>{step.emoji}</span>
                  <span className={`text-sm flex-1 ${unlocked ? 'text-green-200' : 'text-gray-500'}`}>
                    {step.text}
                  </span>
                  {unlocked && <span className="text-green-400 text-sm">✓</span>}
                  {isNext && <span className="text-mq-purple text-xs animate-pulse">next</span>}
                  {!unlocked && !isNext && <span className="text-gray-700 text-sm">🔒</span>}
                </motion.div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Ingredients correct</span>
              <span>{correctCount}/{ingredients.length}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-green-400 rounded-full"
                animate={{ width: `${(correctCount / ingredients.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
