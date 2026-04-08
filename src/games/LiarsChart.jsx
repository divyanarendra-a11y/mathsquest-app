import React, { useState } from 'react'

const CASES = [
  {
    title: "Ice Cream Sales Chart",
    lie: 'truncated-axis',
    description: "A shop claims their sales 'nearly doubled' this summer.",
    chartData: [
      { label: 'Jun', value: 142 },
      { label: 'Jul', value: 156 },
      { label: 'Aug', value: 167 },
      { label: 'Sep', value: 148 },
    ],
    yMin: 130,
    options: [
      { id: 'a', text: "The chart's y-axis starts at 130, not 0 — making the increase look much bigger than it really is.", correct: true },
      { id: 'b', text: "The chart uses the wrong months.", correct: false },
      { id: 'c', text: "The colours are misleading.", correct: false },
    ],
    explanation: "By starting the y-axis at 130 instead of 0, the 25-unit increase (about 17%) visually appears to be a massive jump — the classic truncated axis trick!",
  },
  {
    title: "School Test Scores",
    lie: 'unequal-intervals',
    description: "A school says scores have improved 'steadily every year'.",
    chartData: [
      { label: '2020', value: 60 },
      { label: '2021', value: 62 },
      { label: '2023', value: 63 },
      { label: '2026', value: 65 },
    ],
    yMin: 0,
    options: [
      { id: 'a', text: "The bars are the wrong height.", correct: false },
      { id: 'b', text: "The years on the x-axis are not evenly spaced — gaps of 1, 2, and 3 years are shown as equal bars, hiding that progress slowed down.", correct: true },
      { id: 'c', text: "The percentages add up to more than 100%.", correct: false },
    ],
    explanation: "The x-axis jumps from 2021 to 2023 (2 years) then 2023 to 2026 (3 years), but the bars look equally spaced — hiding that improvement has almost stalled!",
  },
  {
    title: "Social Media Users",
    lie: 'cherry-picking',
    description: "An app claims it has 'the fastest growing user base'.",
    chartData: [
      { label: 'Jan', value: 50 },
      { label: 'Feb', value: 75 },
      { label: 'Mar', value: 120 },
      { label: 'Apr', value: 95 },
    ],
    yMin: 0,
    options: [
      { id: 'a', text: "The numbers are made up.", correct: false },
      { id: 'b', text: "The chart only shows 4 months — it hides that users dropped in April after the initial spike. The 'growth' was short-lived.", correct: true },
      { id: 'c', text: "The chart title is in the wrong font.", correct: false },
    ],
    explanation: "Showing only a cherry-picked period (Jan–Apr) hides the April drop. A full-year chart would tell a very different story!",
  },
]

function Bar({ value, maxValue, yMin, color, label, height = 160 }) {
  const range = maxValue - yMin
  const barHeight = range > 0 ? ((value - yMin) / range) * height : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{value}</div>
      <div style={{
        width: 44, height,
        display: 'flex', alignItems: 'flex-end',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px 4px 0 0',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100%',
          height: barHeight,
          background: color,
          borderRadius: '4px 4px 0 0',
          transition: 'height 0.5s ease',
        }} />
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

export default function LiarsChart({ onComplete, onBack }) {
  const [caseIdx, setCaseIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('inspect') // 'inspect' | 'choose' | 'result' | 'done'

  const currentCase = CASES[caseIdx]
  const maxVal = Math.max(...currentCase.chartData.map(d => d.value))
  const colors = ['#FF6B6B', '#FFD700', '#00CED1', '#00FF7F']

  const handleOption = (opt) => {
    if (confirmed) return
    setSelected(opt.id)
  }

  const handleConfirm = () => {
    const opt = currentCase.options.find(o => o.id === selected)
    if (!opt) return
    setConfirmed(true)
    setPhase('result')
    if (opt.correct) setScore(s => s + 25)
  }

  const next = () => {
    if (caseIdx < CASES.length - 1) {
      setCaseIdx(i => i + 1)
      setSelected(null)
      setConfirmed(false)
      setPhase('inspect')
    } else {
      setPhase('done')
    }
  }

  const xpEarned = Math.min(75, score)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2c0e37 0%, #4a0e8f 100%)',
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
          <span style={{ fontSize: 28 }}>🕵️</span>
          <span style={{ color: '#FF6B6B', fontWeight: 800, fontSize: 20, flex: 1 }}>Liar's Chart</span>
          <span style={{ color: '#FFD700', fontWeight: 700 }}>⭐ {score} XP</span>
        </div>

        {phase !== 'done' && (
          <>
            {/* Case intro */}
            <div style={{
              background: 'rgba(255,107,107,0.08)',
              border: '1px solid rgba(255,107,107,0.25)',
              borderRadius: 16, padding: '18px 22px',
              marginBottom: 20,
            }}>
              <div style={{ color: '#FF6B6B', fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 8 }}>
                CASE {caseIdx + 1} / {CASES.length}
              </div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                {currentCase.title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                {currentCase.description}
              </div>
            </div>

            {/* Chart */}
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              padding: '24px',
              marginBottom: 20,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(255,107,107,0.15)',
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: 8, padding: '4px 10px',
                color: '#FF6B6B', fontSize: 11, fontWeight: 700,
              }}>
                ⚠️ SUSPICIOUS
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
                {currentCase.yMin > 0 ? `Y-AXIS STARTS AT ${currentCase.yMin} (!)` : 'CHART DATA'}
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', justifyContent: 'center' }}>
                {/* Y axis label */}
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 160, color: 'rgba(255,255,255,0.4)',
                  fontSize: 11, textAlign: 'right',
                  paddingBottom: 24,
                }}>
                  <span>{maxVal}</span>
                  <span>{Math.round((maxVal + currentCase.yMin) / 2)}</span>
                  <span style={{ color: currentCase.yMin > 0 ? '#FF6B6B' : 'inherit' }}>
                    {currentCase.yMin > 0 ? `↑${currentCase.yMin}` : '0'}
                  </span>
                </div>
                {currentCase.chartData.map((d, i) => (
                  <Bar
                    key={d.label}
                    value={d.value}
                    maxValue={maxVal}
                    yMin={currentCase.yMin}
                    color={colors[i]}
                    label={d.label}
                  />
                ))}
              </div>
            </div>

            {/* Answer options */}
            {phase !== 'result' && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 12 }}>
                  🔍 <strong style={{ color: '#fff' }}>Spot the lie.</strong> What's misleading about this chart?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {currentCase.options.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => handleOption(opt)}
                      style={{
                        background: selected === opt.id ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${selected === opt.id ? 'rgba(255,107,107,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12, padding: '14px 16px',
                        cursor: 'pointer', color: '#fff', fontSize: 14,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (selected !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      }}
                      onMouseLeave={e => {
                        if (selected !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      }}
                    >
                      <span style={{ color: '#FF6B6B', fontWeight: 700, marginRight: 8 }}>
                        {opt.id.toUpperCase()}.
                      </span>
                      {opt.text}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={!selected}
                  style={{
                    width: '100%', padding: 14,
                    background: selected ? 'linear-gradient(135deg, #FF6B6B, #CC3333)' : 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: 12,
                    color: selected ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontWeight: 800, cursor: selected ? 'pointer' : 'not-allowed',
                    fontSize: 16,
                  }}
                >
                  🔍 Present Evidence
                </button>
              </div>
            )}

            {/* Result */}
            {phase === 'result' && (
              <div style={{
                background: currentCase.options.find(o => o.id === selected)?.correct
                  ? 'rgba(0,255,127,0.08)' : 'rgba(255,100,100,0.08)',
                border: `1px solid ${currentCase.options.find(o => o.id === selected)?.correct
                  ? 'rgba(0,255,127,0.3)' : 'rgba(255,100,100,0.3)'}`,
                borderRadius: 16, padding: 22,
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>
                  {currentCase.options.find(o => o.id === selected)?.correct ? '🏅' : '❌'}
                </div>
                <div style={{
                  color: currentCase.options.find(o => o.id === selected)?.correct ? '#00FF7F' : '#FF6B6B',
                  fontWeight: 800, fontSize: 18, marginBottom: 10,
                }}>
                  {currentCase.options.find(o => o.id === selected)?.correct
                    ? 'Detective Badge Earned!' : 'Not quite...'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
                  {currentCase.explanation}
                </div>
                <button
                  onClick={next}
                  style={{
                    width: '100%', padding: 14,
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    border: 'none', borderRadius: 12,
                    color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: 16,
                  }}
                >
                  {caseIdx < CASES.length - 1 ? 'Next Case →' : 'Finish! 🏆'}
                </button>
              </div>
            )}

            {/* Progress */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              {CASES.map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i < caseIdx ? '#00FF7F' : i === caseIdx ? '#FF6B6B' : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
          </>
        )}

        {phase === 'done' && (
          <div style={{
            maxWidth: 400, margin: '40px auto',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 24, padding: 40,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🕵️</div>
            <h2 style={{ color: '#FF6B6B', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
              Super Sleuth!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              You spotted all {CASES.length} misleading charts. Real data detective!
            </p>
            <div style={{
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 16, padding: 20, marginBottom: 24,
            }}>
              <div style={{ color: '#FFD700', fontSize: 40, fontWeight: 900 }}>+{xpEarned} XP</div>
            </div>
            <button
              onClick={() => onComplete(xpEarned)}
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
    </div>
  )
}
