import React, { useState, useEffect, useCallback, useRef } from 'react'

function isPrime(n) {
  if (n < 2) return false
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false
  }
  return true
}

function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const GAME_DURATION = 45
const FALL_DURATION = 6000

export default function PrimeSmash({ onComplete, onBack, hintTokens, onUseHint }) {
  const [numbers, setNumbers] = useState([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [gameOver, setGameOver] = useState(false)
  const [feedback, setFeedback] = useState(null) // { id, correct }
  const [hint, setHint] = useState(false)
  const nextId = useRef(0)
  const containerRef = useRef(null)

  const spawnNumber = useCallback(() => {
    const num = randomNum(2, 50)
    const id = nextId.current++
    const xPercent = randomNum(5, 85)
    setNumbers(prev => [...prev, { id, value: num, x: xPercent, spawnTime: Date.now() }])

    // Remove after fall
    setTimeout(() => {
      setNumbers(prev => {
        const falling = prev.find(n => n.id === id)
        if (falling) {
          // Hit the ground — if it was prime, lose a life
          if (isPrime(falling.value)) {
            setLives(l => {
              const newLives = l - 1
              if (newLives <= 0) setGameOver(true)
              return newLives
            })
          }
        }
        return prev.filter(n => n.id !== id)
      })
    }, FALL_DURATION)
  }, [])

  // Spawn numbers
  useEffect(() => {
    if (gameOver) return
    const interval = setInterval(spawnNumber, 1400)
    spawnNumber()
    return () => clearInterval(interval)
  }, [gameOver, spawnNumber])

  // Timer
  useEffect(() => {
    if (gameOver) return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setGameOver(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [gameOver])

  const handleSmash = (id, value) => {
    if (gameOver) return
    const correct = isPrime(value)
    setFeedback({ id, correct })
    setTimeout(() => setFeedback(null), 600)

    if (correct) {
      setScore(s => s + 10)
    } else {
      setLives(l => {
        const nl = l - 1
        if (nl <= 0) setGameOver(true)
        return nl
      })
    }
    setNumbers(prev => prev.filter(n => n.id !== id))
  }

  const xpEarned = Math.min(50, Math.floor(score * 0.8))

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #0f1628 100%)',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Stars background */}
      {[...Array(30)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 2, height: 2,
          background: '#fff',
          borderRadius: '50%',
          opacity: Math.random() * 0.7 + 0.3,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 60}%`,
        }} />
      ))}

      {/* HUD */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        zIndex: 50,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '6px 12px',
            color: '#fff', cursor: 'pointer', fontSize: 13,
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 22 }}>💥</span>
        <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 18 }}>Prime Smash</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 700 }}>⭐ {score}</div>
          <div style={{ color: '#FF6B6B', fontWeight: 700 }}>
            {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, 3 - lives))}
          </div>
          <div style={{
            background: timeLeft <= 10 ? 'rgba(255,0,0,0.3)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${timeLeft <= 10 ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: 8, padding: '4px 12px',
            color: timeLeft <= 10 ? '#FF4444' : '#fff',
            fontWeight: 800, fontSize: 18,
            transition: 'all 0.3s',
          }}>
            ⏱ {timeLeft}s
          </div>
          {hintTokens > 0 && !hint && (
            <button
              onClick={() => { setHint(true); onUseHint() }}
              style={{
                background: 'rgba(100,200,255,0.15)',
                border: '1px solid rgba(100,200,255,0.3)',
                borderRadius: 8, padding: '6px 12px',
                color: '#64C8FF', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              }}
            >
              💡 Hint
            </button>
          )}
        </div>
      </div>

      {/* Hint banner */}
      {hint && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(100,200,255,0.15)',
          border: '1px solid rgba(100,200,255,0.3)',
          borderRadius: 12, padding: '10px 20px',
          color: '#64C8FF', fontSize: 14, fontWeight: 600,
          zIndex: 50, textAlign: 'center',
        }}>
          💡 Primes: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47 — only divisible by 1 and themselves!
        </div>
      )}

      {/* Instruction */}
      <div style={{
        position: 'fixed', top: 65, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.35)', fontSize: 14,
        zIndex: 40,
        display: hint ? 'none' : 'block',
      }}>
        Tap only PRIME numbers — let composites fall!
      </div>

      {/* Ground */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 40,
        background: 'linear-gradient(0deg, #8B0000 0%, transparent 100%)',
        zIndex: 10,
      }} />

      {/* Falling numbers */}
      <div ref={containerRef} style={{ paddingTop: 80, height: '100vh', position: 'relative' }}>
        {numbers.map(num => {
          const fb = feedback?.id === num.id
          return (
            <div
              key={num.id}
              onClick={() => handleSmash(num.id, num.value)}
              style={{
                position: 'absolute',
                left: `${num.x}%`,
                top: 80,
                animation: `fall ${FALL_DURATION}ms linear forwards`,
                cursor: 'pointer',
                zIndex: 20,
              }}
            >
              <style>{`
                @keyframes fall {
                  from { transform: translateY(0); }
                  to { transform: translateY(calc(100vh - 80px)); }
                }
              `}</style>
              <div style={{
                width: 64, height: 64,
                background: fb
                  ? (fb && feedback.correct ? 'rgba(0,255,127,0.4)' : 'rgba(255,0,0,0.4)')
                  : isPrime(num.value)
                    ? 'rgba(255,215,0,0.15)'
                    : 'rgba(100,150,255,0.15)',
                border: `3px solid ${fb
                  ? (feedback.correct ? '#00FF7F' : '#FF4444')
                  : isPrime(num.value) ? 'rgba(255,215,0,0.6)' : 'rgba(100,150,255,0.5)'}`,
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900, color: '#fff',
                boxShadow: isPrime(num.value)
                  ? '0 0 20px rgba(255,215,0,0.3)'
                  : 'none',
                transition: 'background 0.1s, border-color 0.1s',
                backdropFilter: 'blur(4px)',
              }}>
                {num.value}
              </div>
            </div>
          )
        })}
      </div>

      {/* Game over modal */}
      {gameOver && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 24, padding: '40px',
            textAlign: 'center', maxWidth: 380,
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {lives > 0 ? '⏱️' : '💔'}
            </div>
            <h2 style={{ color: '#FFD700', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
              {lives > 0 ? 'Time\'s Up!' : 'Game Over!'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
              You smashed {score / 10} primes correctly!
            </p>
            <div style={{
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 16, padding: '16px',
              marginBottom: 24,
            }}>
              <div style={{ color: '#FFD700', fontSize: 32, fontWeight: 900 }}>+{xpEarned} XP</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>earned this round</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={onBack}
                style={{
                  flex: 1, padding: '12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, color: '#fff',
                  cursor: 'pointer', fontSize: 15, fontWeight: 700,
                }}
              >
                World Map
              </button>
              <button
                onClick={() => onComplete(xpEarned)}
                style={{
                  flex: 1, padding: '12px',
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  border: 'none', borderRadius: 12, color: '#000',
                  cursor: 'pointer', fontSize: 15, fontWeight: 800,
                }}
              >
                Claim XP ⭐
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
