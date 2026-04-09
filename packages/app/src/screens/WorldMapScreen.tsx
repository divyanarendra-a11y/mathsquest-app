import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/useStore';
import { usersApi, type WorldData } from '../lib/api';
import { StarRating } from '../components/StarRating';

const { width: SCREEN_W } = Dimensions.get('window');

// Positions as fractions (x, y) of the map container
const WORLD_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0.12, y: 0.72 },
  2: { x: 0.28, y: 0.45 },
  3: { x: 0.20, y: 0.18 },
  4: { x: 0.48, y: 0.28 },
  5: { x: 0.65, y: 0.50 },
  6: { x: 0.78, y: 0.22 },
  7: { x: 0.88, y: 0.65 },
};

const MAP_HEIGHT = SCREEN_W * 1.2;
const NODE_RADIUS = 32;

interface WorldNodeProps {
  world: WorldData;
  onPress: () => void;
  isSelected: boolean;
}

function WorldNode({ world, onPress, isSelected }: WorldNodeProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pos = WORLD_POSITIONS[world.orderIndex];
  const x = pos.x * SCREEN_W - NODE_RADIUS;
  const y = pos.y * MAP_HEIGHT - NODE_RADIUS;

  const handlePress = () => {
    if (!world.unlocked) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.nodeWrapper, { left: x, top: y, transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={!world.unlocked}
        accessibilityLabel={`${world.name}${world.unlocked ? '' : ' - locked'}`}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.nodeCircle,
            { backgroundColor: world.unlocked ? world.color : '#374151' },
            isSelected && styles.nodeSelected,
            !world.unlocked && styles.nodeLocked,
          ]}
        >
          <Text style={styles.nodeEmoji}>{world.unlocked ? world.iconEmoji : '🔒'}</Text>

          {/* Progress ring indicator */}
          {world.unlocked && world.percentComplete > 0 && (
            <View style={[styles.progressRing, { borderColor: 'rgba(255,255,255,0.7)' }]} />
          )}
        </View>

        <Text style={[styles.nodeLabel, !world.unlocked && styles.nodeLabelLocked]}>
          {world.name}
        </Text>

        {world.unlocked && world.starsEarned > 0 && (
          <View style={styles.starsRow}>
            <StarRating stars={Math.min(3, world.starsEarned)} size={11} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

interface DetailModalProps {
  world: WorldData;
  onEnter: () => void;
  onClose: () => void;
}

function WorldDetailModal({ world, onEnter, onClose }: DetailModalProps) {
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <Text style={styles.modalEmoji}>{world.iconEmoji}</Text>
            <View>
              <Text style={styles.modalTitle}>{world.name}</Text>
              <Text style={styles.modalSubtitle}>{world.curriculumUnit}</Text>
            </View>
          </View>

          <Text style={styles.modalDesc}>{world.description}</Text>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressLabel}>{Math.round(world.percentComplete)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${world.percentComplete}%`, backgroundColor: world.color }]}
            />
          </View>

          {world.percentComplete < 80 && world.percentComplete > 0 && (
            <Text style={styles.progressHint}>
              Reach 80% to unlock the next world ({80 - Math.round(world.percentComplete)}% to go)
            </Text>
          )}

          <TouchableOpacity
            style={[styles.enterBtn, { backgroundColor: world.color }]}
            onPress={onEnter}
            activeOpacity={0.85}
          >
            <Text style={styles.enterBtnText}>
              {world.percentComplete > 0 ? 'Continue Adventure' : 'Start Adventure'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function WorldMapScreen() {
  const { userId, xp, level, streakDays, hints, worlds, setProgress } = useStore();
  const [selectedWorld, setSelectedWorld] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      router.replace('/login');
      return;
    }
    usersApi.getProgress(userId)
      .then((res) => setProgress(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C3FEB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MathsQuest</Text>
        <View style={styles.headerStats}>
          {streakDays > 0 && (
            <View style={styles.statBadge}>
              <Text style={styles.statText}>🔥 {streakDays}</Text>
            </View>
          )}
          <View style={styles.statBadge}>
            <Text style={styles.statText}>💡 {hints}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.levelText}>Lv.{level}</Text>
            <Text style={styles.xpText}>{xp} XP</Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <ScrollView
        horizontal
        contentContainerStyle={{ width: SCREEN_W, height: MAP_HEIGHT }}
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.mapContainer, { width: SCREEN_W, height: MAP_HEIGHT }]}>
          {worlds.map((world) => (
            <WorldNode
              key={world.id}
              world={world}
              onPress={() => setSelectedWorld((prev) => (prev?.id === world.id ? null : world))}
              isSelected={selectedWorld?.id === world.id}
            />
          ))}
        </View>
      </ScrollView>

      {/* Detail modal */}
      {selectedWorld && (
        <WorldDetailModal
          world={selectedWorld}
          onEnter={() => {
            setSelectedWorld(null);
            router.push(`/worlds/${selectedWorld.slug}`);
          }}
          onClose={() => setSelectedWorld(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  loader: { flex: 1, backgroundColor: '#030712', justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontFamily: 'Fredoka One', fontSize: 22, color: '#FFD700' },
  headerStats: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statText: { color: '#fff', fontSize: 13 },
  xpBadge: { backgroundColor: '#6C3FEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  levelText: { color: '#FFD700', fontSize: 11, fontWeight: '800' },
  xpText: { color: '#fff', fontSize: 11 },
  mapContainer: { position: 'relative', backgroundColor: '#0f0c29' },
  nodeWrapper: { position: 'absolute', alignItems: 'center', width: NODE_RADIUS * 2, height: NODE_RADIUS * 2 + 36 },
  nodeCircle: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  nodeSelected: { borderColor: '#fff', borderWidth: 4 },
  nodeLocked: { borderColor: '#374151', opacity: 0.6 },
  nodeEmoji: { fontSize: 22 },
  progressRing: { position: 'absolute', inset: -4, borderRadius: NODE_RADIUS + 4, borderWidth: 2, borderStyle: 'dotted' },
  nodeLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  nodeLabelLocked: { color: '#6B7280' },
  starsRow: { marginTop: 2, alignItems: 'center' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalClose: { position: 'absolute', top: 16, right: 16, padding: 8 },
  modalCloseText: { color: '#9CA3AF', fontSize: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  modalEmoji: { fontSize: 44 },
  modalTitle: { fontFamily: 'Fredoka One', fontSize: 24, color: '#fff' },
  modalSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  modalDesc: { color: '#D1D5DB', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#9CA3AF' },
  progressBar: { height: 8, backgroundColor: '#374151', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressHint: { fontSize: 11, color: '#6B7280', marginBottom: 16 },
  enterBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  enterBtnText: { color: '#fff', fontFamily: 'Fredoka One', fontSize: 18 },
});
