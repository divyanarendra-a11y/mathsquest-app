import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { useStore } from '../store/useStore';
import { puzzlesApi } from '../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

// The Phaser game is served as an HTML string injected into WebView
// This approach works without any native bundling of Phaser
const buildGameHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0c29; overflow: hidden; touch-action: manipulation; }
    canvas { display: block; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
</head>
<body>
<script>
const MAX_LIVES = 3;
const SPAWN_INTERVAL_BASE = 1800;
const SPAWN_INTERVAL_MIN = 600;
const FALL_SPEED_BASE = 80;
const FALL_SPEED_INC = 15;

function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) if (n % i === 0) return false;
  return true;
}

class PrimeSmasher extends Phaser.Scene {
  constructor() { super('PrimeSmasher'); }

  create() {
    this.score = 0; this.lives = MAX_LIVES; this.level = 1;
    this.correct = 0; this.numbers = []; this.startTime = Date.now();

    const { width: W, height: H } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x302b63, 0x24243e, 1);
    bg.fillRect(0, 0, W, H);

    const ground = this.add.graphics();
    ground.lineStyle(2, 0xff4444, 0.5);
    ground.lineBetween(0, H - 60, W, H - 60);
    this.add.text(W/2, H - 48, '⚠️  DANGER ZONE', { fontSize: '12px', color: '#ff4444', fontFamily: 'sans-serif' }).setOrigin(0.5, 0);

    this.livesText = this.add.text(12, 12, this.heartsStr(), { fontSize: '22px', fontFamily: 'sans-serif' });
    this.scoreText = this.add.text(W/2, 12, '0', { fontSize: '24px', color: '#FFD700', fontStyle: 'bold', fontFamily: 'sans-serif' }).setOrigin(0.5, 0);
    this.levelText = this.add.text(W - 12, 12, 'Lv.1', { fontSize: '16px', color: '#aaa', fontFamily: 'sans-serif' }).setOrigin(1, 0);

    this.scheduleSpawn();
  }

  heartsStr() { return '❤️'.repeat(this.lives) + '🖤'.repeat(MAX_LIVES - this.lives); }

  spawnInterval() { return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - (this.level - 1) * 120); }
  fallSpeed() { return FALL_SPEED_BASE + (this.level - 1) * FALL_SPEED_INC; }

  scheduleSpawn() {
    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.time.addEvent({ delay: this.spawnInterval(), callback: this.spawnNum, callbackScope: this, loop: true });
    this.spawnNum();
  }

  spawnNum() {
    const { width: W } = this.scale;
    const max = Math.min(10 + this.level * 8, 100);
    const value = Math.floor(Math.random() * (max - 2)) + 2;
    const prime = isPrime(value);
    const x = Phaser.Math.Between(40, W - 40);

    const g = this.add.graphics();
    const r = 28;
    g.fillStyle(prime ? 0x4a90e2 : 0xe74c3c, 1);
    g.fillCircle(0, 0, r);
    g.lineStyle(3, 0xffffff, 0.4);
    g.strokeCircle(0, 0, r);

    const t = this.add.text(0, 0, String(value), { fontSize: value >= 100 ? '17px' : '21px', color: '#fff', fontStyle: 'bold', fontFamily: 'sans-serif' }).setOrigin(0.5);

    const c = this.add.container(x, -40, [g, t]);
    c.setSize(r * 2, r * 2);
    c.setInteractive({ useHandCursor: true });

    c.on('pointerdown', () => {
      c.removeInteractive();
      if (prime) {
        const pts = 10 + (this.level - 1) * 2;
        this.score += pts;
        this.scoreText.setText(String(this.score));
        this.correct++;
        this.feedback(c.x, c.y, '+' + pts, '#00ff88');
        if (this.correct % 8 === 0) {
          this.level++;
          this.levelText.setText('Lv.' + this.level);
          this.scheduleSpawn();
          this.showBanner('LEVEL ' + this.level + '!');
        }
      } else {
        this.lives--;
        this.livesText.setText(this.heartsStr());
        this.feedback(c.x, c.y, '✗ NOT PRIME', '#ff4444');
        this.cameras.main.shake(200, 0.01);
        if (this.lives <= 0) { this.killNum(c, false); this.endGame(); return; }
      }
      this.killNum(c, true);
    });

    this.numbers.push({ container: c, graphics: g, text: t, value, prime });
  }

  killNum(c, animate) {
    this.numbers = this.numbers.filter(n => n.container !== c);
    if (animate) {
      this.tweens.add({ targets: c, scaleX: 0, scaleY: 0, alpha: 0, duration: 180, onComplete: () => c.destroy() });
    } else {
      c.destroy();
    }
  }

  feedback(x, y, msg, color) {
    const lbl = this.add.text(x, y, msg, { fontSize: '17px', color, fontStyle: 'bold', fontFamily: 'sans-serif' }).setOrigin(0.5);
    this.tweens.add({ targets: lbl, y: y - 55, alpha: 0, duration: 750, ease: 'Power2', onComplete: () => lbl.destroy() });
  }

  showBanner(msg) {
    const { width: W, height: H } = this.scale;
    const b = this.add.text(W/2, H/2, msg, { fontSize: '40px', color: '#FFD700', fontStyle: 'bold', fontFamily: 'sans-serif', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: b, alpha: 1, scaleX: 1.2, scaleY: 1.2, duration: 280, yoyo: true, hold: 450, onComplete: () => b.destroy() });
  }

  endGame() {
    if (this.spawnTimer) this.spawnTimer.remove();
    this.numbers.forEach(n => n.container.destroy());
    this.numbers = [];
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    // Notify React Native
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GAME_OVER', score: this.score, elapsed }));
    }
  }

  update() {
    const speed = this.fallSpeed();
    const { height: H } = this.scale;
    const delta = this.game.loop.delta / 1000;

    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.container.y += speed * delta;
      if (n.container.y > H - 60) {
        if (n.prime) {
          this.lives--;
          this.livesText.setText(this.heartsStr());
          this.cameras.main.shake(150, 0.008);
          if (this.lives <= 0) {
            this.killNum(n.container, false);
            this.endGame();
            return;
          }
        }
        this.killNum(n.container, false);
      }
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0f0c29',
  scene: PrimeSmasher,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
</script>
</body>
</html>
`;

export function PrimeSmasherScreen() {
  const { userId, addXp } = useStore();
  const startTimeRef = useRef(Date.now());
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [finalScore, setFinalScore] = useState(0);
  const [result, setResult] = useState<{ xpGained: number; starsEarned: number } | null>(null);

  const submitAttempt = async (score: number, elapsed: number) => {
    if (!userId) return;
    try {
      const res = await puzzlesApi.attempt('prime-smash', { score, maxScore: 300, timeTaken: elapsed });
      setResult({ xpGained: res.data.xpGained, starsEarned: res.data.starsEarned });
      addXp(res.data.xpGained);
    } catch (err) {
      console.error('Failed to submit', err);
    }
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'GAME_OVER') {
        setFinalScore(msg.score);
        setPhase('over');
        submitAttempt(msg.score, msg.elapsed);
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Prime Smash ☄️</Text>
        <View style={{ width: 60 }} />
      </View>

      {phase === 'ready' && (
        <View style={styles.card}>
          <Text style={styles.bigEmoji}>☄️</Text>
          <Text style={styles.cardTitle}>Prime Smash</Text>
          <Text style={styles.cardDesc}>
            Numbers fall from the sky. Tap the{' '}
            <Text style={{ color: '#4a90e2', fontWeight: '700' }}>primes</Text> before they hit the
            ground. Avoid{' '}
            <Text style={{ color: '#e74c3c', fontWeight: '700' }}>composites</Text> — each wrong tap
            costs a life!
          </Text>
          <View style={styles.tipRow}>
            <View style={[styles.tipBox, { backgroundColor: 'rgba(74,144,226,0.15)' }]}>
              <Text style={styles.tipText}>✓  Tap: 2, 3, 5, 7, 11…</Text>
            </View>
            <View style={[styles.tipBox, { backgroundColor: 'rgba(231,76,60,0.15)' }]}>
              <Text style={styles.tipText}>✗  Avoid: 4, 6, 8, 9…</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => { startTimeRef.current = Date.now(); setPhase('playing'); setResult(null); }}
          >
            <Text style={styles.startBtnText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'playing' && (
        <WebView
          style={styles.webview}
          originWhitelist={['*']}
          source={{ html: buildGameHtml() }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
        />
      )}

      {phase === 'over' && (
        <View style={styles.card}>
          <Text style={styles.bigEmoji}>💥</Text>
          <Text style={styles.cardTitle}>Game Over!</Text>
          <Text style={[styles.scoreDisplay]}>{finalScore}</Text>
          <Text style={styles.scoreLabel}>points</Text>

          {result && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultXp}>+{result.xpGained} XP earned!</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 24, color: i < result.starsEarned ? '#FFD700' : '#4B5563' }}>★</Text>
                ))}
              </View>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6C3FEB' }]}
              onPress={() => { setPhase('playing'); setResult(null); startTimeRef.current = Date.now(); }}
            >
              <Text style={styles.actionBtnText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#374151' }]}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.actionBtnText}>World Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111827' },
  back: { color: '#9CA3AF', fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  webview: { flex: 1 },
  card: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  bigEmoji: { fontSize: 72, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 10 },
  cardDesc: { color: '#D1D5DB', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  tipRow: { flexDirection: 'row', gap: 10, marginBottom: 28, width: '100%' },
  tipBox: { flex: 1, borderRadius: 10, padding: 12 },
  tipText: { color: '#D1D5DB', fontSize: 13, textAlign: 'center' },
  startBtn: { backgroundColor: '#6C3FEB', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scoreDisplay: { color: '#FFD700', fontSize: 56, fontWeight: '900', marginTop: 8 },
  scoreLabel: { color: '#9CA3AF', fontSize: 14, marginBottom: 20 },
  resultBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 24, width: '100%' },
  resultXp: { color: '#4ADE80', fontWeight: '700', fontSize: 16 },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
