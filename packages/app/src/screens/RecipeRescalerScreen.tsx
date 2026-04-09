import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/useStore';
import { puzzlesApi } from '../lib/api';

// ─── Recipe data ──────────────────────────────────────────────────────────────

interface IngredientDef {
  name: string;
  originalAmount: number;
  unit: string;
  emoji: string;
}

interface RecipeDef {
  name: string;
  emoji: string;
  fromServings: number;
  toServings: number;
  ingredients: IngredientDef[];
  cookingSteps: Array<{ emoji: string; text: string }>;
}

const RECIPES: RecipeDef[] = [
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
      { emoji: '🥣', text: 'Mix the dry ingredients' },
      { emoji: '🧈', text: 'Cream butter and sugar' },
      { emoji: '🥛', text: 'Add milk and stir' },
      { emoji: '🍫', text: 'Fold in chocolate chips' },
      { emoji: '♨️', text: 'Bake at 180°C for 12 min' },
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
      { emoji: '🫐', text: 'Wash the blueberries' },
      { emoji: '🍌', text: 'Slice the banana' },
      { emoji: '🥛', text: 'Add yoghurt to blender' },
      { emoji: '🍯', text: 'Drizzle in honey' },
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
      { emoji: '🌾', text: 'Spread oats in baking tray' },
      { emoji: '🍯', text: 'Drizzle honey and oil' },
      { emoji: '🥜', text: 'Scatter almonds on top' },
      { emoji: '♨️', text: 'Bake at 160°C for 25 min' },
      { emoji: '🥭', text: 'Stir in dried mango' },
    ],
  },
];

type CheckState = 'correct' | 'wrong' | null;

export function RecipeRescalerScreen() {
  const { userId, addXp } = useStore();
  const [recipeIdx, setRecipeIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'complete'>('ready');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, CheckState>>({});
  const [unlockedSteps, setUnlockedSteps] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ xpGained: number; starsEarned: number } | null>(null);
  const startTimeRef = useRef(Date.now());

  const recipe = recipeIdx !== null ? RECIPES[recipeIdx] : null;

  const scaledAmount = (ing: IngredientDef): number => {
    if (!recipe) return 0;
    return Math.round(ing.originalAmount * (recipe.toServings / recipe.fromServings) * 100) / 100;
  };

  const submitAttempt = useCallback(async (finalScore: number) => {
    if (!userId) return;
    try {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await puzzlesApi.attempt('recipe-rescaler', { score: finalScore, maxScore: 50, timeTaken });
      setResult({ xpGained: res.data.xpGained, starsEarned: res.data.starsEarned });
      addXp(res.data.xpGained);
    } catch {}
  }, [userId, addXp]);

  const startRecipe = (idx: number) => {
    setRecipeIdx(idx);
    setPhase('playing');
    setAnswers({});
    setChecked({});
    setUnlockedSteps(0);
    setScore(0);
    setResult(null);
    startTimeRef.current = Date.now();
  };

  const handleCheck = (i: number) => {
    if (!recipe) return;
    const ing = recipe.ingredients[i];
    const userVal = parseFloat(answers[i] ?? '');
    if (isNaN(userVal)) return;

    const target = scaledAmount(ing);
    const correct = Math.abs(userVal - target) < 0.01;

    if (correct) {
      const newChecked = { ...checked, [i]: 'correct' as const };
      setChecked(newChecked);
      const newScore = score + 10;
      setScore(newScore);
      const correctCount = Object.values(newChecked).filter(v => v === 'correct').length;
      setUnlockedSteps(correctCount);
      if (correctCount === recipe.ingredients.length) {
        setPhase('complete');
        submitAttempt(newScore);
      }
    } else {
      setChecked(prev => ({ ...prev, [i]: 'wrong' }));
      setUnlockedSteps(s => Math.max(0, s - 1));
      setTimeout(() => {
        setChecked(prev => ({ ...prev, [i]: null }));
        setAnswers(a => ({ ...a, [i]: '' }));
      }, 1500);
    }
  };

  // ── Ready ──
  if (phase === 'ready') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Rescaler 🍳</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.centreContent}>
          <Text style={styles.bigEmoji}>🍳</Text>
          <Text style={styles.cardTitle}>Recipe Rescaler</Text>
          <Text style={styles.cardDesc}>Scale recipe ingredients for a different number of servings. Get it right to unlock each cooking step!</Text>
          <View style={{ width: '100%', gap: 10 }}>
            {RECIPES.map((r, i) => (
              <TouchableOpacity key={i} style={styles.recipeCard} onPress={() => startRecipe(i)} activeOpacity={0.85}>
                <Text style={{ fontSize: 36 }}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recipeName}>{r.name}</Text>
                  <Text style={styles.recipeScale}>
                    {r.fromServings} → {r.toServings} servings (×{(r.toServings / r.fromServings).toFixed(2)})
                  </Text>
                </View>
                <Text style={styles.arrowText}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Complete ──
  if (phase === 'complete' && recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Rescaler 🍳</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.centreContent}>
          <Text style={styles.bigEmoji}>{recipe.emoji}</Text>
          <Text style={styles.cardTitle}>Recipe Complete!</Text>
          <Text style={styles.cardDesc}>{recipe.name} scaled for {recipe.toServings} servings!</Text>
          <Text style={styles.scoreDisplay}>{score}</Text>
          <Text style={styles.scoreLabel}>points</Text>
          {result && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultXp}>+{result.xpGained} XP earned!</Text>
              <View style={styles.starsRow}>
                {[1,2,3].map(i => <Text key={i} style={{ fontSize: 24, color: i <= result.starsEarned ? '#FFD700' : '#4B5563' }}>★</Text>)}
              </View>
            </View>
          )}
          <View style={{ width: '100%', gap: 6, marginBottom: 20 }}>
            {recipe.cookingSteps.map((step, i) => (
              <View key={i} style={styles.stepComplete}>
                <Text style={{ fontSize: 20 }}>{step.emoji}</Text>
                <Text style={styles.stepCompleteText}>{step.text}</Text>
                <Text style={{ color: '#4ADE80' }}>✓</Text>
              </View>
            ))}
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6C3FEB' }]} onPress={() => setPhase('ready')}>
              <Text style={styles.actionBtnText}>Try Another</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#374151' }]} onPress={() => router.replace('/')}>
              <Text style={styles.actionBtnText}>World Map</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Playing ──
  if (!recipe) return null;
  const correctCount = Object.values(checked).filter(v => v === 'correct').length;
  const ratio = recipe.toServings / recipe.fromServings;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{recipe.emoji} {recipe.name}</Text>
        <Text style={styles.scoreText}>{score} pts</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {/* Ratio banner */}
        <View style={styles.ratioBanner}>
          <Text style={styles.ratioBannerText}>
            Scale from <Text style={{ color: '#fff', fontWeight: '800' }}>{recipe.fromServings}</Text> to{' '}
            <Text style={{ color: '#fff', fontWeight: '800' }}>{recipe.toServings}</Text> servings
          </Text>
          <Text style={styles.ratioHint}>Multiply each amount by {ratio.toFixed(2)}</Text>
        </View>

        {/* Ingredients */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>INGREDIENTS</Text>
          {recipe.ingredients.map((ing, i) => {
            const state = checked[i];
            const target = scaledAmount(ing);
            return (
              <View key={i} style={styles.ingredientRow}>
                <Text style={{ fontSize: 24, width: 32 }}>{ing.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingOriginal}>{ing.originalAmount}{ing.unit} for {recipe.fromServings}</Text>
                </View>
                {state === 'correct' ? (
                  <View style={styles.correctAnswer}>
                    <Text style={styles.correctAnswerText}>{target}{ing.unit} ✓</Text>
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.ingInput, state === 'wrong' && styles.ingInputWrong]}
                      value={answers[i] ?? ''}
                      onChangeText={v => setAnswers(a => ({ ...a, [i]: v }))}
                      keyboardType="numeric"
                      placeholder={`? ${ing.unit}`}
                      placeholderTextColor="#6B7280"
                      onSubmitEditing={() => handleCheck(i)}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.checkBtn} onPress={() => handleCheck(i)}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Cooking steps */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>COOKING STEPS</Text>
          {recipe.cookingSteps.map((step, i) => {
            const unlocked = i < unlockedSteps;
            const isNext = i === unlockedSteps;
            return (
              <View
                key={i}
                style={[
                  styles.stepRow,
                  unlocked ? styles.stepUnlocked : isNext ? styles.stepNext : styles.stepLocked,
                ]}
              >
                <Text style={[{ fontSize: 20 }, !unlocked && !isNext && { opacity: 0.3 }]}>{step.emoji}</Text>
                <Text style={[styles.stepText, unlocked ? styles.stepTextUnlocked : styles.stepTextLocked]}>
                  {step.text}
                </Text>
                {unlocked && <Text style={{ color: '#4ADE80', fontSize: 12 }}>✓</Text>}
                {!unlocked && !isNext && <Text style={{ color: '#374151', fontSize: 12 }}>🔒</Text>}
              </View>
            );
          })}
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(correctCount / recipe.ingredients.length) * 100}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{correctCount}/{recipe.ingredients.length} correct</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111827' },
  backText: { color: '#9CA3AF', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  scoreText: { color: '#FFD700', fontSize: 16, fontWeight: '700' },
  centreContent: { padding: 24, alignItems: 'center' },
  bigEmoji: { fontSize: 72, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 8 },
  cardDesc: { color: '#D1D5DB', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  recipeCard: { backgroundColor: '#111827', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  recipeName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  recipeScale: { color: '#FFD700', fontSize: 13, marginTop: 2 },
  arrowText: { color: '#6B7280', fontSize: 18 },
  scoreDisplay: { color: '#FFD700', fontSize: 52, fontWeight: '900', marginTop: 4 },
  scoreLabel: { color: '#9CA3AF', fontSize: 13, marginBottom: 12 },
  resultBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16, width: '100%' },
  resultXp: { color: '#4ADE80', fontWeight: '700', fontSize: 16 },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  stepComplete: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 10, padding: 10 },
  stepCompleteText: { flex: 1, color: '#A7F3D0', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ratioBanner: { backgroundColor: 'rgba(234,179,8,0.15)', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
  ratioBannerText: { color: '#FDE68A', fontSize: 14 },
  ratioHint: { color: '#FBBF24', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 14, marginBottom: 12 },
  sectionLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  ingName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  ingOriginal: { color: '#9CA3AF', fontSize: 12 },
  correctAnswer: { backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  correctAnswerText: { color: '#4ADE80', fontWeight: '700', fontSize: 13 },
  inputGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ingInput: { width: 76, backgroundColor: '#1F2937', color: '#fff', fontSize: 14, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, textAlign: 'center' },
  ingInputWrong: { borderWidth: 2, borderColor: '#F87171' },
  checkBtn: { backgroundColor: '#6C3FEB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 10, marginBottom: 6 },
  stepUnlocked: { backgroundColor: 'rgba(74,222,128,0.12)' },
  stepNext: { backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#6C3FEB', borderStyle: 'dashed' },
  stepLocked: { backgroundColor: '#111827', opacity: 0.5 },
  stepText: { flex: 1, fontSize: 13 },
  stepTextUnlocked: { color: '#A7F3D0' },
  stepTextLocked: { color: '#6B7280' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#1F2937', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6C3FEB', borderRadius: 4 },
  progressLabel: { color: '#9CA3AF', fontSize: 12 },
});
