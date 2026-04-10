import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { useStore } from '../store/useStore';
import { puzzlesApi } from '../lib/api';

// ─── Phaser Scene ───────────────────────────────────────────────────────────

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const MAX_LIVES = 3;
const FALL_SPEED_BASE = 80; // px/s at level 1
const FALL_SPEED_INCREMENT = 15;
const SPAWN_INTERVAL_BASE = 1800; // ms
const SPAWN_INTERVAL_MIN = 600;

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function generateNumber(level: number): number {
  // Higher levels include bigger numbers
  const max = Math.min(10 + level * 8, 100);
  return Math.floor(Math.random() * (max - 2)) + 2;
}

interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

class PrimeSmasherScene extends Phaser.Scene {
  private fallingNumbers: Phaser.GameObjects.Container[] = [];
  private score = 0;
  private lives = MAX_LIVES;
  private level = 1;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private callbacks!: GameCallbacks;
  private numbersCorrect = 0;
  private totalPrimesTapped = 0;
  private spawnCount = 0;

  constructor() {
    super({ key: 'PrimeSmasher' });
  }

  init(data: GameCallbacks) {
    this.callbacks = data;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.level = 1;
    this.spawnCount = 0;
    this.numbersCorrect = 0;
    this.fallingNumbers = [];
  }

  preload() {
    // Generate textures programmatically — no asset files needed
  }

  create() {
    // Background gradient via rectangle
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x302b63, 0x24243e, 1);
    bg.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground line
    const ground = this.add.graphics();
    ground.lineStyle(2, 0xff4444, 0.5);
    ground.lineBetween(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, CANVAS_HEIGHT - 60);
    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 48, '⚠️  DANGER ZONE', {
      fontSize: '13px',
      color: '#ff4444',
      fontFamily: 'Nunito',
    }).setOrigin(0.5, 0).setAlpha(0.6);

    this.scheduleSpawn();

    // Level-up every 8 correct taps
    this.events.on('correct', () => {
      this.numbersCorrect++;
      if (this.numbersCorrect % 8 === 0) {
        this.level++;
        this.callbacks.onLevelChange(this.level);
        this.rescheduleSpawn();
        this.showLevelUpBanner();
      }
    });
  }

  private spawnInterval(): number {
    return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - (this.level - 1) * 120);
  }

  private fallSpeed(): number {
    return FALL_SPEED_BASE + (this.level - 1) * FALL_SPEED_INCREMENT;
  }

  private scheduleSpawn() {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval(),
      callback: this.spawnNumber,
      callbackScope: this,
      loop: true,
    });
    // Spawn one immediately
    this.spawnNumber();
  }

  private rescheduleSpawn() {
    this.spawnTimer.remove();
    this.scheduleSpawn();
  }

  private spawnNumber() {
    this.spawnCount++;
    const value = generateNumber(this.level);
    const prime = isPrime(value);
    const x = Phaser.Math.Between(40, CANVAS_WIDTH - 40);

    // Container
    const container = this.add.container(x, -40);

    // Circle background
    const circle = this.add.graphics();
    const radius = 28;
    circle.fillStyle(prime ? 0x4a90e2 : 0xe74c3c, 1);
    circle.fillCircle(0, 0, radius);
    circle.lineStyle(3, 0xffffff, 0.4);
    circle.strokeCircle(0, 0, radius);

    // Number text
    const text = this.add.text(0, 0, String(value), {
      fontSize: value >= 100 ? '18px' : '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Nunito',
    }).setOrigin(0.5, 0.5);

    container.add([circle, text]);
    container.setSize(radius * 2, radius * 2);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => this.handleTap(container, value, prime));
    container.on('pointerover', () => { circle.clear(); circle.fillStyle(prime ? 0x67b2f8 : 0xf1948a, 1); circle.fillCircle(0, 0, radius); circle.lineStyle(3, 0xffffff, 0.6); circle.strokeCircle(0, 0, radius); });
    container.on('pointerout', () => { circle.clear(); circle.fillStyle(prime ? 0x4a90e2 : 0xe74c3c, 1); circle.fillCircle(0, 0, radius); circle.lineStyle(3, 0xffffff, 0.4); circle.strokeCircle(0, 0, radius); });

    this.fallingNumbers.push(container);
  }

  private handleTap(container: Phaser.GameObjects.Container, _value: number, prime: boolean) {
    container.removeInteractive();

    if (prime) {
      this.totalPrimesTapped++;
      this.score += 10 + (this.level - 1) * 2;
      this.callbacks.onScoreChange(this.score);
      this.events.emit('correct');
      this.showFeedback(container.x, container.y, `+${10 + (this.level - 1) * 2}`, '#00ff88');
    } else {
      this.lives--;
      this.callbacks.onLivesChange(this.lives);
      this.showFeedback(container.x, container.y, '✗ NOT PRIME', '#ff4444');
      this.cameras.main.shake(200, 0.01);
      if (this.lives <= 0) {
        this.time.delayedCall(600, () => this.endGame());
        return;
      }
    }

    this.tweens.add({
      targets: container,
      scaleX: 0, scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.fallingNumbers = this.fallingNumbers.filter((n) => n !== container);
        container.destroy();
      },
    });
  }

  private showFeedback(x: number, y: number, msg: string, color: string) {
    const label = this.add.text(x, y, msg, {
      fontSize: '18px',
      color,
      fontStyle: 'bold',
      fontFamily: 'Nunito',
    }).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: label,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  private showLevelUpBanner() {
    const banner = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `LEVEL ${this.level}!`, {
      fontSize: '42px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'Fredoka One',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scaleX: 1.2, scaleY: 1.2,
      duration: 300,
      yoyo: true,
      hold: 500,
      onComplete: () => banner.destroy(),
    });
  }

  private endGame() {
    this.spawnTimer.remove();
    this.fallingNumbers.forEach((n) => n.destroy());
    this.fallingNumbers = [];
    this.callbacks.onGameOver(this.score);
  }

  update() {
    const speed = this.fallSpeed();
    const delta = this.game.loop.delta / 1000;

    for (let i = this.fallingNumbers.length - 1; i >= 0; i--) {
      const container = this.fallingNumbers[i];
      container.y += speed * delta;

      if (container.y > CANVAS_HEIGHT - 60) {
        // Missed a prime? Only penalise if it was prime
        const textObj = container.list[1] as Phaser.GameObjects.Text;
        const value = Number(textObj.text);
        if (isPrime(value)) {
          this.lives--;
          this.callbacks.onLivesChange(this.lives);
          this.cameras.main.shake(150, 0.008);
          if (this.lives <= 0) {
            container.destroy();
            this.fallingNumbers.splice(i, 1);
            this.endGame();
            return;
          }
        }
        container.destroy();
        this.fallingNumbers.splice(i, 1);
      }
    }
  }
}

// ─── React wrapper ───────────────────────────────────────────────────────────

interface GameState {
  phase: 'ready' | 'playing' | 'over';
  score: number;
  lives: number;
  level: number;
}

export function PrimeSmash() {
  const navigate = useNavigate();
  const { userId, updateWorldProgress: _updateWorldProgress, addXp } = useStore();
  const gameRef = useRef<Phaser.Game | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'ready',
    score: 0,
    lives: MAX_LIVES,
    level: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ xpGained: number; starsEarned: number } | null>(null);

  const submitAttempt = useCallback(
    async (finalScore: number) => {
      if (!userId) return;
      setSubmitting(true);
      try {
        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
        const res = await puzzlesApi.attempt('prime-smash', {
          score: finalScore,
          maxScore: 300, // approximate max for a good run
          timeTaken,
        });
        setResult({ xpGained: res.data.xpGained, starsEarned: res.data.starsEarned });
        addXp(res.data.xpGained);
      } catch (err) {
        console.error('Failed to submit attempt', err);
      } finally {
        setSubmitting(false);
      }
    },
    [userId, addXp],
  );

  const startGame = useCallback(() => {
    if (!mountRef.current) return;

    // Destroy any existing game
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    startTimeRef.current = Date.now();
    setGameState({ phase: 'playing', score: 0, lives: MAX_LIVES, level: 1 });
    setResult(null);

    const callbacks: GameCallbacks = {
      onScoreChange: (score) => setGameState((s) => ({ ...s, score })),
      onLivesChange: (lives) => setGameState((s) => ({ ...s, lives })),
      onLevelChange: (level) => setGameState((s) => ({ ...s, level })),
      onGameOver: (finalScore) => {
        setGameState((s) => ({ ...s, phase: 'over', score: finalScore }));
        submitAttempt(finalScore);
      },
    };

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#0f0c29',
      parent: mountRef.current,
      scene: PrimeSmasherScene,
      callbacks: {
        postBoot: (game) => {
          game.scene.start('PrimeSmasher', callbacks);
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
  }, [submitAttempt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gameRef.current?.destroy(true);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-4 px-4">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          onClick={() => navigate('/worlds/number-kingdom')}
        >
          ← Back
        </button>
        <h1 className="font-display text-2xl text-white">Prime Smash ☄️</h1>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Instructions banner */}
      <div className="w-full max-w-lg bg-blue-900/40 border border-blue-500/30 rounded-xl px-4 py-2 mb-4 text-sm text-blue-200 text-center">
        Tap only the <strong>prime numbers</strong> — let composites fall!
      </div>

      {/* HUD */}
      {gameState.phase === 'playing' && (
        <div className="w-full max-w-lg flex justify-between items-center mb-2 px-2">
          <div className="flex gap-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span key={i} className={`text-xl ${i < gameState.lives ? 'opacity-100' : 'opacity-20'}`}>
                ❤️
              </span>
            ))}
          </div>
          <span className="font-display text-mq-gold text-xl">{gameState.score}</span>
          <span className="text-sm text-gray-400">Level {gameState.level}</span>
        </div>
      )}

      {/* Game canvas */}
      <div
        ref={mountRef}
        className="w-full max-w-lg aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
        style={{ display: gameState.phase === 'playing' ? 'block' : 'none' }}
      />

      {/* Ready screen */}
      {gameState.phase === 'ready' && (
        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-7xl mb-4">☄️</div>
          <h2 className="font-display text-3xl text-white mb-2">Prime Smash</h2>
          <p className="text-gray-300 mb-6">
            Numbers fall from the sky. Tap the <span className="text-blue-400 font-bold">primes</span> before
            they reach the ground. Avoid <span className="text-red-400 font-bold">composites</span> — each wrong
            tap costs a life!
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-blue-900/40 rounded-lg p-3 text-blue-200">
              <div className="text-2xl mb-1">✓</div>
              Tap these: 2, 3, 5, 7, 11...
            </div>
            <div className="bg-red-900/40 rounded-lg p-3 text-red-200">
              <div className="text-2xl mb-1">✗</div>
              Avoid these: 4, 6, 8, 9, 10...
            </div>
          </div>
          <button
            className="w-full py-4 bg-mq-purple hover:bg-purple-600 text-white font-display text-xl rounded-xl transition-colors shadow-lg"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Game Over screen */}
      {gameState.phase === 'over' && (
        <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-6xl mb-3">💥</div>
          <h2 className="font-display text-3xl text-white mb-1">Game Over!</h2>
          <p className="text-gray-400 mb-4">Level {gameState.level} reached</p>

          <div className="text-5xl font-display text-mq-gold mb-2">{gameState.score}</div>
          <p className="text-gray-400 text-sm mb-6">points</p>

          {submitting && (
            <p className="text-blue-300 text-sm mb-4 animate-pulse">Saving score...</p>
          )}

          {result && (
            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3 mb-4">
              <p className="text-green-300 font-bold">+{result.xpGained} XP earned!</p>
              <div className="flex justify-center gap-1 mt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`text-2xl ${i < result.starsEarned ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 bg-mq-purple hover:bg-purple-600 text-white font-display text-lg rounded-xl transition-colors"
              onClick={startGame}
            >
              Play Again
            </button>
            <button
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-display text-lg rounded-xl transition-colors"
              onClick={() => navigate('/')}
            >
              World Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
