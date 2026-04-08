import React, { useState } from 'react'

const GRID_SIZE = 10
const CELL_SIZE = 42

const FURNITURE = [
  { id: 'bed', name: 'Bed', emoji: '🛏️', w: 3, h: 2, color: '#4A90E2', xpValue: 15 },
  { id: 'desk', name: 'Desk', emoji: '🪑', w: 2, h: 1, color: '#7B68EE', xpValue: 10 },
  { id: 'wardrobe', name: 'Wardrobe', emoji: '🚪', w: 2, h: 3, color: '#8B7355', xpValue: 12 },
  { id: 'sofa', name: 'Sofa', emoji: '🛋️', w: 3, h: 1, color: '#D2691E', xpValue: 10 },
]

const CHALLENGES = [
  {
    name: 'Bedroom Challenge',
    roomW: 8, roomH: 6,
    items: ['bed', 'desk'],
    question: 'What is the total area of the room?',
    answer: 48,
    unit: 'm²',
  },
  {
    name: 'Perimeter Check',
    roomW: 6, roomH: 7,
    items: ['desk', 'wardrobe'],
    question: 'What is the perimeter of this room?',
    answer: 26,
    unit: 'm',
  },
  {
    name: 'Furniture Area',
    roomW: 8, roomH: 8,
    items: ['bed', 'sofa'],
    question: 'What area does the bed take up? (3m × 2m)',
    answer: 6,
    unit: 'm²',
  },
]

function canPlace(grid, item, row, col, roomW, roomH) {
  if (col + item.w > roomW || row + item.h > roomH) return false
  for (let r = row; r < row + item.h; r++) {
    for (let c = col; c < col + item.w; c++) {
      if (grid[r][c]) return false
    }
  }
  return true
}

export default function RoomDesigner({ onComplete, onBack }) {
  const [challengeIdx, setChallengeIdx] = useState(0)
  const [grid, setGrid] = useState(() =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
  )
  const [placed, setPlaced] = useState([])
  const [selected, setSelected] = useState(null)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState('place') // 'place' | 'answer' | 'result'
  const [correct, setCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)

  const challenge = CHALLENGES[challengeIdx]
  const availableFurniture = FURNITURE.filter(f => challenge.items.includes(f.id))
  const placedIds = placed.map(p => p.id)
  const allPlaced = challenge.items.every(id => placedIds.includes(id))

  const resetGrid = () => {
    setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null)))
    setPlaced([])
    setSelected(null)
    setAnswer('')
    setPhase('place')
    setAttempts(0)
  }

  const handleCellClick = (row, col) => {
    if (!selected || phase !== 'place') return
    const item = FURNITURE.find(f => f.id === selected)
    if (!item) return

    // Remove existing if already placed
    let newGrid = grid.map(r => [...r])
    const existingIdx = placed.findIndex(p => p.id === selected)
    if (existingIdx >= 0) {
      const existing = placed[existingIdx]
      for (let r = existing.row; r < existing.row + item.h; r++) {
        for (let c = existing.col; c < existing.col + item.w; c++) {
          if (newGrid[r]) newGrid[r][c] = null
        }
      }
    }

    if (canPlace(newGrid, item, row, col, challenge.roomW, challenge.roomH)) {
      for (let r = row; r < row + item.h; r++) {
        for (let c = col; c < col + item.w; c++) {
          newGrid[r][c] = selected
        }
      }
      setGrid(newGrid)
      const newPlaced = placed.filter(p => p.id !== selected)
      newPlaced.push({ id: selected, row, col })
      setPlaced(newPlaced)
    }
  }

  const checkAnswer = () => {
    const val = parseInt(answer)
    const isCorrect = val === challenge.answer
    setCorrect(isCorrect)
    setPhase('result')
    if (isCorrect) {
      const xp = Math.max(5, 20 - attempts * 5)
      setScore(s => s + xp)
    } else {
      setAttempts(a => a + 1)
    }
  }

  const nextChallenge = () => {
    if (challengeIdx < CHALLENGES.length - 1) {
      setChallengeIdx(i => i + 1)
      resetGrid()
    } else {
      onComplete(Math.min(60, score))
    }
  }

  const retryAnswer = () => {
    setPhase('answer')
    setAnswer('')
  }

  const xpEarned = Math.min(60, score)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a3d62 0%, #1e3799 100%)',
      padding: '20px 16px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
          <span style={{ fontSize: 28 }}>🏠</span>
          <span style={{ color: '#00CED1', fontWeight: 800, fontSize: 20, flex: 1 }}>Room Designer</span>
          <span style={{ color: '#FFD700', fontWeight: 700 }}>⭐ {score} XP</span>
        </div>

        {/* Challenge info */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,206,209,0.3)',
          borderRadius: 16, padding: '18px 22px',
          marginBottom: 20,
        }}>
          <div style={{ color: '#00CED1', fontWeight: 700, fontSize: 13, marginBottom: 6, letterSpacing: 1 }}>
            CHALLENGE {challengeIdx + 1}/{CHALLENGES.length} — {challenge.name}
          </div>
          <div style={{ color: '#fff', fontSize: 15 }}>
            Room size: <strong style={{ color: '#00CED1' }}>{challenge.roomW}m × {challenge.roomH}m</strong>
            &nbsp;(1 grid square = 1m²)
          </div>
          {phase === 'place' && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6 }}>
              Place all furniture, then answer the question!
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Room grid */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
              ROOM ({challenge.roomW}×{challenge.roomH})
            </div>
            <div style={{
              display: 'inline-grid',
              gridTemplateColumns: `repeat(${challenge.roomW}, ${CELL_SIZE}px)`,
              gap: 1,
              background: 'rgba(0,206,209,0.15)',
              border: '2px solid rgba(0,206,209,0.4)',
              borderRadius: 8,
              padding: 4,
            }}>
              {Array.from({ length: challenge.roomH }).map((_, row) =>
                Array.from({ length: challenge.roomW }).map((_, col) => {
                  const occupant = grid[row][col]
                  const item = occupant ? FURNITURE.find(f => f.id === occupant) : null
                  const isTopLeft = item && placed.find(p => p.id === occupant && p.row === row && p.col === col)

                  return (
                    <div
                      key={`${row}-${col}`}
                      onClick={() => handleCellClick(row, col)}
                      style={{
                        width: CELL_SIZE, height: CELL_SIZE,
                        background: item
                          ? item.color + 'AA'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${item ? item.color + '60' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 4,
                        cursor: selected && phase === 'place' ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                        transition: 'background 0.15s',
                      }}
                    >
                      {isTopLeft ? item.emoji : ''}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ flex: 1, minWidth: 220 }}>
            {/* Furniture palette */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
                FURNITURE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableFurniture.map(item => {
                  const isPlaced = placedIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isPlaced && setSelected(item.id === selected ? null : item.id)}
                      style={{
                        background: selected === item.id
                          ? item.color + '30'
                          : isPlaced ? 'rgba(0,255,127,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${selected === item.id
                          ? item.color
                          : isPlaced ? 'rgba(0,255,127,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: isPlaced ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{item.emoji}</span>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                          {item.w}m × {item.h}m = {item.w * item.h}m²
                        </div>
                      </div>
                      {isPlaced && (
                        <span style={{ marginLeft: 'auto', color: '#00FF7F', fontSize: 18 }}>✓</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Question phase */}
            {allPlaced && phase === 'place' && (
              <div style={{
                background: 'rgba(0,206,209,0.1)',
                border: '1px solid rgba(0,206,209,0.3)',
                borderRadius: 14, padding: 16,
              }}>
                <div style={{ color: '#00CED1', fontWeight: 700, marginBottom: 8 }}>
                  Great! Now answer:
                </div>
                <div style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>
                  {challenge.question}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && answer && checkAnswer()}
                    placeholder="?"
                    style={{
                      flex: 1, padding: '10px',
                      borderRadius: 8,
                      border: '1px solid rgba(0,206,209,0.4)',
                      background: 'rgba(255,255,255,0.07)',
                      color: '#fff', fontSize: 18, fontWeight: 700,
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.5)', alignSelf: 'center', fontSize: 14 }}>
                    {challenge.unit}
                  </span>
                  <button
                    onClick={checkAnswer}
                    disabled={!answer}
                    style={{
                      padding: '10px 16px',
                      background: answer ? 'linear-gradient(135deg, #00CED1, #0099AA)' : 'rgba(255,255,255,0.1)',
                      border: 'none', borderRadius: 8,
                      color: answer ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontWeight: 700, cursor: answer ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Check
                  </button>
                </div>
              </div>
            )}

            {phase === 'result' && (
              <div style={{
                background: correct ? 'rgba(0,255,127,0.1)' : 'rgba(255,100,100,0.1)',
                border: `1px solid ${correct ? 'rgba(0,255,127,0.3)' : 'rgba(255,100,100,0.3)'}`,
                borderRadius: 14, padding: 18, textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>
                  {correct ? '🎉' : '❌'}
                </div>
                <div style={{
                  color: correct ? '#00FF7F' : '#FF6B6B',
                  fontWeight: 800, fontSize: 18, marginBottom: 8,
                }}>
                  {correct ? 'Correct!' : 'Not quite...'}
                </div>
                {!correct && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 12 }}>
                    The answer was <strong style={{ color: '#fff' }}>{challenge.answer} {challenge.unit}</strong>
                  </div>
                )}
                <button
                  onClick={correct ? nextChallenge : retryAnswer}
                  style={{
                    width: '100%', padding: '12px',
                    background: correct
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: 10,
                    color: correct ? '#000' : '#fff',
                    fontWeight: 800, cursor: 'pointer', fontSize: 15,
                  }}
                >
                  {correct
                    ? (challengeIdx < CHALLENGES.length - 1 ? 'Next Challenge →' : 'Finish! 🏆')
                    : 'Try Again'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
