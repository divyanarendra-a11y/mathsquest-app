import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  world: {
    id: string;
    name: string;
    description: string;
    color: string;
    iconEmoji: string;
    curriculumUnit: string;
  };
  puzzles: Puzzle[];
}

const PUZZLE_ROUTES: Record<string, string> = {
  'prime-smash': '/puzzles/prime-smash',
  'robot-factory': '/puzzles/robot-factory',
  'recipe-rescaler': '/puzzles/recipe-rescaler',
};

export function WorldDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
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
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C3FEB" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>World not found</Text>
      </View>
    );
  }

  const { world, puzzles } = data;

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: `${world.color}22` }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← World Map</Text>
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>{world.iconEmoji}</Text>
        <Text style={styles.heroTitle}>{world.name}</Text>
        <Text style={styles.heroSubtitle}>{world.curriculumUnit}</Text>
        {worldProgress && (
          <View style={styles.progressRow}>
            <Text style={styles.progressPct}>{Math.round(worldProgress.percentComplete)}% complete</Text>
            <StarRating stars={Math.min(3, Math.round((worldProgress.starsEarned / (puzzles.length * 3)) * 3))} size={16} />
          </View>
        )}
        {/* Progress bar */}
        {worldProgress && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${worldProgress.percentComplete}%` as any, backgroundColor: world.color },
              ]}
            />
          </View>
        )}
      </View>

      {/* Puzzles */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Challenges</Text>
        {puzzles.map((puzzle, i) => {
          const route = PUZZLE_ROUTES[puzzle.slug];
          const available = !!route;
          return (
            <TouchableOpacity
              key={puzzle.id}
              style={[styles.puzzleCard, !available && styles.puzzleCardLocked]}
              onPress={() => available && router.push(route as any)}
              activeOpacity={available ? 0.75 : 1}
              disabled={!available}
            >
              <View style={styles.puzzleRow}>
                <Text style={styles.puzzleEmoji}>{available ? '🎮' : '🔜'}</Text>
                <View style={styles.puzzleInfo}>
                  <Text style={[styles.puzzleName, !available && styles.textLocked]}>{puzzle.name}</Text>
                  <Text style={styles.puzzleDesc}>{puzzle.description}</Text>
                </View>
                {available ? (
                  <Text style={styles.puzzleArrow}>→</Text>
                ) : (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  loader: { flex: 1, backgroundColor: '#030712', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 16 },

  hero: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { position: 'absolute', top: 12, left: 16 },
  backText: { color: '#9CA3AF', fontSize: 14 },
  heroEmoji: { fontSize: 56, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 2 },
  heroSubtitle: { color: '#9CA3AF', fontSize: 13, marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  progressPct: { color: '#9CA3AF', fontSize: 13 },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionHeader: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 12 },

  puzzleCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  puzzleCardLocked: { opacity: 0.55 },
  puzzleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  puzzleEmoji: { fontSize: 28 },
  puzzleInfo: { flex: 1 },
  puzzleName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  textLocked: { color: '#6B7280' },
  puzzleDesc: { color: '#9CA3AF', fontSize: 13, lineHeight: 18 },
  puzzleArrow: { color: '#6B7280', fontSize: 18 },
  comingSoonBadge: { backgroundColor: '#1F2937', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  comingSoonText: { color: '#6B7280', fontSize: 11 },
});
