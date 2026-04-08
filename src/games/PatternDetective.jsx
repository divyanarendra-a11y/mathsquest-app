import React, { useState } from 'react'

const SEQUENCES = [
  { first: 3, diff: 4, name: 'Gold Tiles' },
  { first: 2, diff: 3, name: 'Blue Squares' },
  { first: 5, diff: 2, name: 'Red Circles' },
  { first: 1, diff: 6, name: 'Star Tiles' },
  { first: 7, diff: 5, name: 'Moon Shapes' },
]

function getNth(first, diff, n) {
  // nth term = first + (n-1)*diff  =>  a + nd - d  => dn + (a - d)
  // written as: nth term = diff*n + (first - diff)
  return diff * n + (first - diff)
}

const TILE_EMOJIS = ['🟨', '🟦', '🔴', '⭐', '🌙']

export default function PatternDetective({ onComplete, onBack }) {
  const [seqIdx, setSeqIdx] = useState(0)
  const [aInput, setAInput] = useState('') // coefficient of n
  const [bInput, setBInput] = useState('') // constant
  const [phase, setPhase] = useState('observe') // 'observe' | 'guess' | 'verify' | 'done'
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [verified, setVerified] = useState(false)

  const seq = SEQUENCES[seqIdx]
  const emoji = TILE_EMOJIS[seqIdx]
  // Show first 4 terms
  const visibleTerms = [1, 2, 3, 4].map(n => ({ n, val: getNth(seq.first, seq.diff, n) }))
  // Extended terms for verification
  const allTerms = Array.from({ length: 10 }, (_, i) => ({ n: i + 1, val: getNth(seq.first, seq.diff, i + 1) }))

  const correctA = seq.diff
  const correctB = seq.first - seq.diff

  const checkAnswer = () => {
    const a = parseInt(aInput)
    const b = parseInt(bInput)
    const isCorrect = a === correctA && b === correctB
    if (isCorrect) {
      const xp = Math.max(5, 20 - attempts * 5)
      setScore(s => s + xp)
      setPhase('verify')
    } else {
      setAttempts(at => at + 1)
    }
  }

  const next = () => {
    if (seqIdx < SEQUENCES.length - 1) {
      setSeqIdx(i => i + 1)
      setAInput(''); setBInput('')
      setPhase('observe')
      setAttempts(0)
      setVerified(false)
    } else {
      setPhase('done')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)',
      padding: '20px 16px',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '7px 14px',
            color: '#fff', cursor: 'pointer', fontSize: 13,
          }}>
            ← Back
          </button>
          <span style={{ fontSize: 28 }}>🔍</span>
          <span style={{ color: '#00FF7F', fontWeight: 800, fontSize: 20, flex: 1 }}>Pattern Detective</span>
          <span style={{ color: '#FFD700', fontWeight: 700 }}>⭐ {score} XP</span>
        </div>

        {phase !== 'done' && (
          <>
            {/* Sequence display */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,255,127,0.2)',
              borderRadius: 20, padding: 24,
              marginBottom: 20,
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.4)', fontSize: 12,
                fontWeight: 700, letterSpacing: 2, marginBottom: 12,
              }}>
                TILE SEQUENCE — {seq.name}
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
                {visibleTerms.map(({ n, val }) => (
                  <div key={n} style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.4)',
                      marginBottom: 4, fontWeight: 600,
                    }}>
                      n={n}
                    </div>
                    <div style={{
                      background: 'rgba(0,255,127,0.1)',
                      border: '1px solid rgba(0,255,127,0.25)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 20 }}>{emoji}</span>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{val}</span>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 28, fontWeight: 700 }}>...</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 600 }}>n=?</div>
                  <div style={{
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px dashed rgba(255,215,0,0.4)',
                    borderRadius: 12, padding: '10px 14px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: 20 }}>❓</span>
                    <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 18 }}>?</span>
                  </div>
                </div>
              </div>

              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                Difference between terms: <strong style={{ color: '#00FF7F' }}>
                  +{seq.diff} each time
                </strong>
              </div>
            </div>

            {/* Equation input */}
            {phase !== 'verify' && (
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: 22,
                marginBottom: 16,
              }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                  Find the nth term rule: <span style={{ color: '#00FF7F', fontFamily: 'monospace' }}>nth term = an + b</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>nth term =</span>
                  <input
                    type="number"
                    value={aInput}
                    onChange={e => setAInput(e.target.value)}
                    placeholder="a"
                    style={{
                      width: 70, padding: '10px',
                      borderRadius: 8,
                      border: '2px solid rgba(0,255,127,0.3)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: 18, fontWeight: 700,
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>n +</span>
                  <input
                    type="number"
                    value={bInput}
                    onChange={e => setBInput(e.target.value)}
                    placeholder="b"
                    style={{
                      width: 70, padding: '10px',
                      borderRadius: 8,
                      border: '2px solid rgba(0,255,127,0.3)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: 18, fontWeight: 700,
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                  <button
                    onClick={checkAnswer}
                    disabled={!aInput || bInput === ''}
                    style={{
                      padding: '12px 24px',
                      background: (aInput && bInput !== '') ? 'linear-gradient(135deg, #00FF7F, #00CC66)' : 'rgba(255,255,255,0.1)',
                      border: 'none', borderRadius: 10,
                      color: (aInput && bInput !== '') ? '#000' : 'rgba(255,255,255,0.3)',
                      fontWeight: 800, cursor: (aInput && bInput !== '') ? 'pointer' : 'not-allowed',
                      fontSize: 15,
                    }}
                  >
                    Verify!
                  </button>
                </div>
                {attempts > 0 && (
                  <div style={{ marginTop: 12, color: '#FF6B6B', fontSize: 13 }}>
                    ❌ Not quite — check the difference between terms!
                    {attempts >= 2 && (
                      <span style={{ color: '#FFD700' }}> Hint: a = the common difference!</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Verification phase */}
            {phase === 'verify' && (
              <div style={{
                background: 'rgba(0,255,127,0.08)',
                border: '1px solid rgba(0,255,127,0.3)',
                borderRadius: 16, padding: 22,
              }}>
                <div style={{ color: '#00FF7F', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                  ✅ Correct! nth term = {correctA}n + ({correctB})
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 }}>
                  Let's verify by generating the next 10 tiles:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {allTerms.map(({ n, val }) => (
                    <div key={n} style={{
                      background: n <= 4 ? 'rgba(0,255,127,0.15)' : 'rgba(255,215,0,0.15)',
                      border: `1px solid ${n <= 4 ? 'rgba(0,255,127,0.3)' : 'rgba(255,215,0,0.3)'}`,
                      borderRadius: 10, padding: '8px 12px',
                      textAlign: 'center',
                      animation: n > 4 ? `popIn 0.3s ease ${(n - 5) * 80}ms both` : 'none',
                    }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>n={n}</div>
                      <div style={{ color: n <= 4 ? '#00FF7F' : '#FFD700', fontWeight: 800, fontSize: 16 }}>
                        {val}
                      </div>
                      <div style={{ fontSize: 14 }}>{emoji}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={next}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    border: 'none', borderRadius: 12,
                    color: '#000', fontWeight: 800,
                    cursor: 'pointer', fontSize: 16,
                  }}
                >
                  {seqIdx < SEQUENCES.length - 1 ? 'Next Pattern →' : 'Finish! 🏆'}
                </button>
              </div>
            )}

            {/* Progress */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              {SEQUENCES.map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i < seqIdx ? '#00FF7F' : i === seqIdx ? '#FFD700' : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
          </>
        )}

        {phase === 'done' && (
          <div style={{
            maxWidth: 400, margin: '40px auto',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(0,255,127,0.3)',
            borderRadius: 24, padding: 40,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
            <h2 style={{ color: '#00FF7F', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
              Master Detective!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              You cracked all {SEQUENCES.length} sequence patterns!
            </p>
            <div style={{
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 16, padding: 20, marginBottom: 24,
            }}>
              <div style={{ color: '#FFD700', fontSize: 40, fontWeight: 900 }}>+{Math.min(65, score)} XP</div>
            </div>
            <button
              onClick={() => onComplete(Math.min(65, score))}
              style={{
                width: '100%', padding: 16,
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: 'none', borderRadius: 14,
                color: '#000', fontSize: 18, fontWeight: 800, cursor: 'pointer',
              }}
            >
              Claim XP ⭐
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0) rotate(-10deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
