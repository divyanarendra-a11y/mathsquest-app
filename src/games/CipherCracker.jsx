import React, { useState, useEffect, useRef } from 'react'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const PUZZLES = [
  { equation: '2x + 3 = 11', answer: 4, message: 'WELL DONE' },
  { equation: '3x - 5 = 10', answer: 5, message: 'BRILLIANT' },
  { equation: '5x + 2 = 22', answer: 4, message: 'KEEP GOING' },
  { equation: 'x/2 + 4 = 9', answer: 10, message: 'AMAZING JOB' },
  { equation: '4x - 7 = 13', answer: 5, message: 'STAR PUPIL' },
  { equation: '6x + 1 = 25', answer: 4, message: 'MATHS HERO' },
]

function encodeMessage(message, shift) {
  return message.split('').map(c => {
    if (c === ' ') return ' '
    const idx = ALPHABET.indexOf(c)
    return idx >= 0 ? ALPHABET[(idx + shift) % 26] : c
  }).join('')
}

function scramble(message) {
  const chars = message.split('')
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    if (chars[i] !== ' ' && chars[j] !== ' ') {
      [chars[i], chars[j]] = [chars[j], chars[i]]
    }
  }
  return chars.join('')
}

export default function CipherCracker({ onComplete, onBack, hintTokens, onUseHint }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('solve') // 'solve' | 'reveal' | 'done'
  const [displayMessage, setDisplayMessage] = useState('')
  const [hint, setHint] = useState(false)
  const [wrongAnim, setWrongAnim] = useState(false)
  const inputRef = useRef(null)

  const puzzle = PUZZLES[puzzleIndex]
  const encodedMessage = encodeMessage(puzzle.message, puzzle.answer)

  useEffect(() => {
    setDisplayMessage(encodedMessage)
    setInput('')
    setAttempts(0)
    setPhase('solve')
    setHint(false)
    if (inputRef.current) inputRef.current.focus()
  }, [puzzleIndex])

  useEffect(() => {
    if (phase === 'reveal') {
      // Animate decoding
      let step = 0
      const totalSteps = 20
      const timer = setInterval(() => {
        step++
        const progress = step / totalSteps
        setDisplayMessage(prev =>
          prev.split('').map((c, i) => {
            if (c === ' ') return ' '
            const target = puzzle.message[i]
            if (Math.random() < progress) return target || c
            return ALPHABET[Math.floor(Math.random() * 26)]
          }).join('')
        )
        if (step >= totalSteps) {
          clearInterval(timer)
          setDisplayMessage(puzzle.message)
        }
      }, 60)
      return () => clearInterval(timer)
    }
  }, [phase, puzzle.message])

  const handleSubmit = () => {
    const val = parseInt(input)
    if (val === puzzle.answer) {
      const xpForPuzzle = Math.max(5, 20 - attempts * 5)
      setScore(s => s + xpForPuzzle)
      setPhase('reveal')
    } else {
      setAttempts(a => a + 1)
      setWrongAnim(true)
      setTimeout(() => setWrongAnim(false), 500)
      // Scramble cipher on wrong answer
      setDisplayMessage(scramble(encodedMessage))
      setInput('')
    }
  }

  const nextPuzzle = () => {
    if (puzzleIndex < PUZZLES.length - 1) {
      setPuzzleIndex(i => i + 1)
      setPhase('solve')
    } else {
      setPhase('done')
    }
  }

  const xpEarned = Math.min(70, score)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      padding: '20px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: 700,
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 28,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, padding: '7px 14px',
          color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>
          ← Back
        </button>
        <span style={{ fontSize: 28 }}>🔐</span>
        <span style={{ color: '#00FF7F', fontWeight: 800, fontSize: 20, flex: 1 }}>Cipher Cracker</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#FFD700', fontWeight: 700 }}>⭐ {score} XP</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {puzzleIndex + 1} / {PUZZLES.length}
          </span>
        </div>
      </div>

      {phase !== 'done' && (
        <div style={{ width: '100%', maxWidth: 700 }}>
          {/* Encoded message display */}
          <div style={{
            background: 'rgba(0,255,127,0.05)',
            border: '1px solid rgba(0,255,127,0.2)',
            borderRadius: 20,
            padding: '28px',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
              {phase === 'reveal' ? '✅ DECODED MESSAGE' : '🔒 ENCODED MESSAGE'}
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 8,
              color: phase === 'reveal' ? '#00FF7F' : '#64C8FF',
              textShadow: phase === 'reveal' ? '0 0 20px rgba(0,255,127,0.5)' : '0 0 20px rgba(100,200,255,0.3)',
              transition: 'color 0.3s',
              minHeight: 48,
            }}>
              {displayMessage}
            </div>
            {phase === 'solve' && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 12 }}>
                Each letter is shifted by x — find x to decode!
              </div>
            )}
          </div>

          {/* Equation */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18,
            padding: '28px',
            marginBottom: 20,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
              SOLVE FOR X
            </div>
            <div style={{
              fontSize: 36, fontWeight: 900, color: '#fff',
              fontFamily: 'monospace',
              textAlign: 'center',
              marginBottom: 20,
              letterSpacing: 2,
            }}>
              {puzzle.equation}
            </div>

            {phase === 'solve' && (
              <>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 700 }}>x =</span>
                  <input
                    ref={inputRef}
                    type="number"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && input && handleSubmit()}
                    style={{
                      flex: 1,
                      padding: '14px 18px',
                      borderRadius: 12,
                      border: `2px solid ${wrongAnim ? '#FF4444' : 'rgba(0,255,127,0.3)'}`,
                      background: wrongAnim ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: 22, fontWeight: 700,
                      outline: 'none', textAlign: 'center',
                      animation: wrongAnim ? 'shake 0.4s' : 'none',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    placeholder="?"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!input}
                    style={{
                      padding: '14px 24px',
                      background: input ? 'linear-gradient(135deg, #00FF7F, #00CC66)' : 'rgba(255,255,255,0.1)',
                      border: 'none', borderRadius: 12,
                      color: input ? '#000' : 'rgba(255,255,255,0.3)',
                      fontSize: 16, fontWeight: 800, cursor: input ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Crack It!
                  </button>
                </div>
                {attempts > 0 && (
                  <div style={{ marginTop: 12, color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>
                    ⚠️ Wrong! The cipher scrambled. {attempts} attempt{attempts > 1 ? 's' : ''} used.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hint */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            {hintTokens > 0 && !hint && phase === 'solve' && (
              <button
                onClick={() => { setHint(true); onUseHint() }}
                style={{
                  background: 'rgba(100,200,255,0.1)',
                  border: '1px solid rgba(100,200,255,0.2)',
                  borderRadius: 10, padding: '8px 16px',
                  color: '#64C8FF', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                }}
              >
                💡 Use Hint ({hintTokens} left)
              </button>
            )}
            {hint && (
              <div style={{
                background: 'rgba(100,200,255,0.1)',
                border: '1px solid rgba(100,200,255,0.2)',
                borderRadius: 10, padding: '10px 16px',
                color: '#64C8FF', fontSize: 13,
              }}>
                💡 Hint: Isolate x — undo the operations one at a time (reverse order)!
              </div>
            )}
            {phase === 'reveal' && (
              <button
                onClick={nextPuzzle}
                style={{
                  marginLeft: 'auto',
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #00FF7F, #00CC66)',
                  border: 'none', borderRadius: 12,
                  color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                }}
              >
                {puzzleIndex < PUZZLES.length - 1 ? 'Next Cipher →' : 'Finish! 🏆'}
              </button>
            )}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {PUZZLES.map((_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i < puzzleIndex
                  ? '#00FF7F'
                  : i === puzzleIndex
                    ? '#64C8FF'
                    : 'rgba(255,255,255,0.15)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Done screen */}
      {phase === 'done' && (
        <div style={{
          maxWidth: 420,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,255,127,0.3)',
          borderRadius: 24, padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🔓</div>
          <h2 style={{ color: '#00FF7F', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            All Ciphers Cracked!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            You decoded {PUZZLES.length} secret messages. Incredible work!
          </p>
          <div style={{
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 16, padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ color: '#FFD700', fontSize: 40, fontWeight: 900 }}>+{xpEarned} XP</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Cipher Master!</div>
          </div>
          <button
            onClick={() => onComplete(xpEarned)}
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none', borderRadius: 14,
              color: '#000', fontSize: 18, fontWeight: 800, cursor: 'pointer',
            }}
          >
            Claim XP ⭐
          </button>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
