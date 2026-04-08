import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/useStore';
import { puzzlesApi } from '../lib/api';

// ─── Equation bank ────────────────────────────────────────────────────────────

interface Equation {
  display: string;
  answer: number;
  hint: string;
}

const LEVELS: Equation[][] = [
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
  [
    { display: '2(x + 3) = 14',  answer: 4, hint: 'Divide by 2 first, then subtract 3' },
    { display: '3(x − 1) = 12',  answer: 5, hint: 'Divide by 3 first, then add 1' },
    { display: '2(2x + 1) = 10', answer: 2, hint: 'Divide by 2, subtract 1, divide by 2' },
    { display: '4(x − 2) = 12',  answer: 5, hint: 'Divide by 4 first, then add 2' },
    { display: '3(x + 4) = 21',  answer: 3, hint: 'Divide by 3 first, then subtract 4' },
    { display: '5(x − 2) = 15',  answer: 5, hint: 'Divide by 5 first, then add 2' },
    { display: '2(3x − 1) = 16', answer: 3, hint: 'Divide by 2, add 1, divide by 3' },
    { display: '4(2x + 3) = 44', answer: 4, hint: 'Divide by 4, subtract 3, divide by 2' },
  ],
];

const MACHINE_EMOJIS = ['⚙️', '🔩', '🪛', '⚡', '🔧', '💡', '🤖', '🏭'];
type MachineState = 'idle' | 'active' | 'powered' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export function RobotFactoryScreen() {
  const { userId, addXp } = useStore();
  const [phase, setPhase] = useState<'ready' | 'playing' | 'complete'>('ready');
  const [levelIdx, setLevelIdx] = useState(0);
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
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const equations = LEVELS[levelIdx];
  const current = equations[currentMachine];

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
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
    } catch {}
  }, [userId, addXp]);

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

  const handleSubmit = () => {
    const parsed = Number(inputVal.trim());
    if (isNaN(parsed) || inputVal.trim() === '') return;

    if (parsed === current.answer) {
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
      }, 900);
    } else {
      setWrongAttempts((w) => w + 1);
      setFeedback({ type: 'wrong', msg: 'Line halted! Try again.' });
      shakeInput();
      setMachines((prev) => { const n = [...prev]; n[currentMachine] = 'error'; return n; });
      setTimeout(() => {
        setMachines((prev) => { const n = [...prev]; n[currentMachine] = 'active'; return n; });
        setFeedback(null);
        setInputVal('');
      }, 1200);
    }
  };

  // ── Ready ──
  if (phase === 'ready') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Robot Factory 🤖</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.centreContent}>
          <Text style={styles.bigEmoji}>🏭</Text>
          <Text style={styles.cardTitle}>Robot Factory</Text>
          <Text style={styles.cardDesc}>Balance equations to power machines on the assembly line. Wrong answers halt the line!</Text>
          <View style={styles.levelList}>
            {LEVELS.map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.levelBtn, { backgroundColor: ['#4CAF50', '#FF9800', '#F44336'][i] }]}
                onPress={() => startGame(i)}
                activeOpacity={0.85}
              >
                <Text style={styles.levelBtnText}>{['⭐ Easy', '⭐⭐ Medium', '⭐⭐⭐ Hard'][i]}</Text>
                <Text style={styles.levelBtnSub}>{['One-step', 'Two-step', 'Brackets'][i]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Complete ──
  if (phase === 'complete') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Robot Factory 🤖</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.centreContent}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.cardTitle}>Assembly Complete!</Text>
          <Text style={[styles.scoreDisplay]}>{score}</Text>
          <Text style={styles.scoreLabel}>points</Text>
          {result && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultXp}>+{result.xpGained} XP earned!</Text>
              <View style={styles.starsRow}>
                {[1,2,3].map((i) => <Text key={i} style={{ fontSize: 24, color: i <= result.starsEarned ? '#FFD700' : '#4B5563' }}>★</Text>)}
              </View>
            </View>
          )}
          {/* Machine grid */}
          <View style={styles.machineGrid}>
            {MACHINE_EMOJIS.map((emoji, i) => (
              <View key={i} style={[styles.machineCell, styles.machinePowered]}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
                <Text style={{ fontSize: 10, color: '#4ADE80' }}>✓</Text>
              </View>
            ))}
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6C3FEB' }]} onPress={() => setPhase('ready')}>
              <Text style={styles.actionBtnText}>Play Again</Text>
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
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Robot Factory 🤖</Text>
        <Text style={styles.scoreText}>{score} pts</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Assembly line */}
        <View style={styles.assemblyCard}>
          <Text style={styles.sectionLabel}>ASSEMBLY LINE</Text>
          <View style={styles.machineGrid}>
            {MACHINE_EMOJIS.map((emoji, i) => {
              const state = machines[i];
              return (
                <View
                  key={i}
                  style={[
                    styles.machineCell,
                    state === 'powered' && styles.machinePowered,
                    state === 'active' && styles.machineActive,
                    state === 'error' && styles.machineError,
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  {state === 'powered' && <Text style={{ fontSize: 9, color: '#4ADE80' }}>✓</Text>}
                  {state === 'active'  && <Text style={{ fontSize: 9, color: '#60A5FA' }}>▶</Text>}
                  {state === 'error'   && <Text style={{ fontSize: 9, color: '#F87171' }}>✗</Text>}
                </View>
              );
            })}
          </View>
          <Text style={styles.machineProgress}>
            Machine {currentMachine + 1}/8 — {machines.filter(m => m === 'powered').length} powered
          </Text>
        </View>

        {/* Equation card */}
        <View style={styles.equationCard}>
          <View style={styles.equationHeader}>
            <View>
              <Text style={styles.equationLabel}>Machine {currentMachine + 1} needs:</Text>
              <Text style={styles.equationDisplay}>{current.display}</Text>
            </View>
            <Text style={{ fontSize: 36 }}>{MACHINE_EMOJIS[currentMachine]}</Text>
          </View>

          {showHint && (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>💡 {current.hint}</Text>
            </View>
          )}

          {feedback && (
            <View style={[styles.feedbackBox, feedback.type === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={feedback.type === 'correct' ? styles.feedbackCorrectText : styles.feedbackWrongText}>
                {feedback.msg}
              </Text>
            </View>
          )}

          <Animated.View style={[styles.inputRow, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.xLabel}>x =</Text>
            <TextInput
              style={styles.input}
              value={inputVal}
              onChangeText={setInputVal}
              keyboardType="numeric"
              placeholder="?"
              placeholderTextColor="#6B7280"
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.powerBtn} onPress={handleSubmit}>
              <Text style={styles.powerBtnText}>⚡ Power</Text>
            </TouchableOpacity>
          </Animated.View>

          {!showHint && (
            <TouchableOpacity onPress={() => { setHintsUsed(h => h + 1); setShowHint(true); }}>
              <Text style={styles.hintLink}>💡 Use a hint</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.levelBadge}>
          {['⭐ Easy — One-step', '⭐⭐ Medium — Two-step', '⭐⭐⭐ Hard — Brackets'][levelIdx]}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111827' },
  backText: { color: '#9CA3AF', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  scoreText: { color: '#FFD700', fontSize: 16, fontWeight: '700' },
  centreContent: { padding: 24, alignItems: 'center' },
  bigEmoji: { fontSize: 72, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 8 },
  cardDesc: { color: '#D1D5DB', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  levelList: { width: '100%', gap: 12 },
  levelBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  levelBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  scoreDisplay: { color: '#FFD700', fontSize: 52, fontWeight: '900', marginTop: 8 },
  scoreLabel: { color: '#9CA3AF', fontSize: 14, marginBottom: 16 },
  resultBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16, width: '100%' },
  resultXp: { color: '#4ADE80', fontWeight: '700', fontSize: 16 },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  assemblyCard: { backgroundColor: '#111827', borderRadius: 16, padding: 14, marginBottom: 12 },
  sectionLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  machineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  machineCell: { width: 48, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F2937', borderWidth: 2, borderColor: '#374151' },
  machinePowered: { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: '#4ADE80' },
  machineActive: { backgroundColor: 'rgba(96,165,250,0.15)', borderColor: '#60A5FA' },
  machineError: { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: '#F87171' },
  machineProgress: { color: '#6B7280', fontSize: 12 },
  equationCard: { backgroundColor: '#111827', borderRadius: 16, padding: 16 },
  equationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  equationLabel: { color: '#9CA3AF', fontSize: 13, marginBottom: 4 },
  equationDisplay: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: 0.5 },
  hintBox: { backgroundColor: 'rgba(96,165,250,0.15)', borderRadius: 10, padding: 10, marginBottom: 12 },
  hintText: { color: '#93C5FD', fontSize: 13 },
  feedbackBox: { borderRadius: 10, padding: 10, marginBottom: 12 },
  feedbackCorrect: { backgroundColor: 'rgba(74,222,128,0.15)' },
  feedbackWrong: { backgroundColor: 'rgba(248,113,113,0.15)' },
  feedbackCorrectText: { color: '#4ADE80', fontWeight: '600', fontSize: 14 },
  feedbackWrongText: { color: '#F87171', fontWeight: '600', fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  xLabel: { color: '#9CA3AF', fontSize: 18, fontWeight: '700' },
  input: { flex: 1, backgroundColor: '#1F2937', color: '#fff', fontSize: 20, fontWeight: '700', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, textAlign: 'center' },
  powerBtn: { backgroundColor: '#6C3FEB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  powerBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hintLink: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 4 },
  levelBadge: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 12 },
});
