import React, { useState } from 'react'

// Generic mini-game: a set of multiple-choice questions tailored to each game
const GAME_CONTENT = {
  'fraction-frenzy': {
    title: 'Fraction Frenzy',
    emoji: '🍕',
    color: '#FFD700',
    questions: [
      { q: 'Which fraction is equivalent to 1/2?', options: ['2/3', '3/6', '4/5', '5/8'], correct: 1 },
      { q: 'What is 2/3 + 1/3?', options: ['1', '3/6', '2/9', '3/9'], correct: 0 },
      { q: 'What is 3/4 of 20?', options: ['12', '15', '18', '10'], correct: 1 },
      { q: 'Which is larger: 5/8 or 3/5?', options: ['5/8', '3/5', 'They are equal', 'Cannot tell'], correct: 0 },
      { q: 'Simplify 12/16:', options: ['2/3', '3/4', '4/5', '6/8'], correct: 1 },
    ],
    xpReward: 40,
  },
  'decimal-dash': {
    title: 'Decimal Dash',
    emoji: '🏃',
    color: '#FFD700',
    questions: [
      { q: 'What is 0.7 + 0.35?', options: ['1.05', '1.5', '0.105', '1.12'], correct: 0 },
      { q: 'Order from smallest: 0.3, 0.03, 0.33', options: ['0.3, 0.03, 0.33', '0.03, 0.3, 0.33', '0.33, 0.3, 0.03', '0.03, 0.33, 0.3'], correct: 1 },
      { q: 'What is 2.5 × 4?', options: ['8', '10', '8.5', '6'], correct: 1 },
      { q: 'Round 3.847 to 1 decimal place:', options: ['3.8', '3.9', '4.0', '3.84'], correct: 1 },
      { q: 'What is 1.2 ÷ 0.4?', options: ['0.3', '3', '4.8', '0.48'], correct: 1 },
    ],
    xpReward: 35,
  },
  'angle-hunter': {
    title: 'Angle Hunter',
    emoji: '📐',
    color: '#00CED1',
    questions: [
      { q: 'Angles in a triangle add up to:', options: ['90°', '180°', '270°', '360°'], correct: 1 },
      { q: 'What is a right angle?', options: ['45°', '60°', '90°', '180°'], correct: 2 },
      { q: 'Angles on a straight line add up to:', options: ['90°', '180°', '270°', '360°'], correct: 1 },
      { q: 'An obtuse angle is between:', options: ['0° and 90°', '90° and 180°', '180° and 360°', 'Exactly 90°'], correct: 1 },
      { q: 'What is a reflex angle?', options: ['Less than 90°', 'Exactly 90°', 'Between 90°–180°', 'More than 180°'], correct: 3 },
    ],
    xpReward: 40,
  },
  'equation-balancer': {
    title: 'Equation Balancer',
    emoji: '⚖️',
    color: '#00FF7F',
    questions: [
      { q: 'Solve: x + 7 = 15', options: ['x = 6', 'x = 7', 'x = 8', 'x = 22'], correct: 2 },
      { q: 'Solve: 3x = 21', options: ['x = 6', 'x = 7', 'x = 8', 'x = 18'], correct: 1 },
      { q: 'Solve: 2x - 4 = 10', options: ['x = 3', 'x = 5', 'x = 7', 'x = 6'], correct: 2 },
      { q: 'Solve: x/3 = 9', options: ['x = 3', 'x = 12', 'x = 27', 'x = 6'], correct: 2 },
      { q: 'Solve: 5x + 2 = 17', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correct: 1 },
    ],
    xpReward: 50,
  },
  'average-attack': {
    title: 'Average Attack',
    emoji: '📈',
    color: '#FF6B6B',
    questions: [
      { q: 'Find the mean of: 4, 7, 9, 2, 3', options: ['4', '5', '7', '3'], correct: 1 },
      { q: 'Find the median of: 3, 7, 2, 9, 1', options: ['2', '3', '7', '9'], correct: 1 },
      { q: 'Find the mode of: 5, 3, 5, 7, 5, 3', options: ['3', '5', '7', '4'], correct: 1 },
      { q: 'Mean of 6, 8, 10 = ?', options: ['7', '8', '9', '10'], correct: 1 },
      { q: 'Median of 12, 5, 8, 3, 9 = ?', options: ['5', '8', '9', '12'], correct: 1 },
    ],
    xpReward: 55,
  },
  'probability-lab': {
    title: 'Probability Lab',
    emoji: '🎲',
    color: '#FF6B6B',
    questions: [
      { q: 'A fair coin is flipped. P(Heads) = ?', options: ['1', '0', '1/2', '1/4'], correct: 2 },
      { q: 'A dice is rolled. P(6) = ?', options: ['1/4', '1/6', '1/3', '1/2'], correct: 1 },
      { q: 'Impossible event probability:', options: ['1', '0', '0.5', '-1'], correct: 1 },
      { q: 'P(red) = 0.3 from a bag. P(not red) = ?', options: ['0.7', '0.3', '1', '0'], correct: 0 },
      { q: 'A bag has 2 red, 3 blue balls. P(blue) = ?', options: ['2/5', '3/5', '1/2', '3/2'], correct: 1 },
    ],
    xpReward: 60,
  },
  'ratio-road': {
    title: 'Ratio Road',
    emoji: '🗺️',
    color: '#FF8C00',
    questions: [
      { q: 'Simplify the ratio 6:9:', options: ['3:6', '2:3', '1:2', '3:4'], correct: 1 },
      { q: 'Divide 40 in ratio 3:5:', options: ['15 and 25', '20 and 20', '10 and 30', '24 and 16'], correct: 0 },
      { q: 'If 2:3 = 8:?, find ?', options: ['9', '10', '12', '6'], correct: 2 },
      { q: 'A map scale is 1:50000. 3cm on map = ?km?', options: ['1.5km', '15km', '150km', '0.15km'], correct: 0 },
      { q: 'Ratio of boys to girls is 3:2. 30 students total, how many girls?', options: ['12', '15', '18', '20'], correct: 0 },
    ],
    xpReward: 50,
  },
  'pixel-mixer': {
    title: 'Pixel Mixer',
    emoji: '🎨',
    color: '#FF8C00',
    questions: [
      { q: 'Mix red:blue in ratio 1:3. You use 5ml red, how much blue?', options: ['10ml', '15ml', '3ml', '20ml'], correct: 1 },
      { q: 'To make green: yellow:blue = 2:1. For 12ml total, how much yellow?', options: ['4ml', '6ml', '8ml', '10ml'], correct: 2 },
      { q: 'Orange paint needs red:yellow = 3:2. You have 15ml red, need how much yellow?', options: ['8ml', '9ml', '10ml', '12ml'], correct: 2 },
      { q: 'Purple = red:blue = 1:2. To make 30ml of purple, need how much blue?', options: ['10ml', '15ml', '20ml', '25ml'], correct: 2 },
      { q: 'Mix ratio 2:5. Total 35ml. Smaller part =?', options: ['7ml', '10ml', '14ml', '5ml'], correct: 1 },
    ],
    xpReward: 65,
  },
  'unit-converter': {
    title: 'Unit Converter',
    emoji: '🔄',
    color: '#DA70D6',
    questions: [
      { q: '1km = ? metres', options: ['10m', '100m', '1000m', '10000m'], correct: 2 },
      { q: '250cm = ? metres', options: ['0.25m', '2.5m', '25m', '2500m'], correct: 1 },
      { q: '1kg = ? grams', options: ['10g', '100g', '500g', '1000g'], correct: 3 },
      { q: '3.5 litres = ? millilitres', options: ['35ml', '350ml', '3500ml', '35000ml'], correct: 2 },
      { q: '120 minutes = ? hours', options: ['1h', '1.5h', '2h', '2.5h'], correct: 2 },
    ],
    xpReward: 55,
  },
  'time-traveller': {
    title: 'Time Traveller',
    emoji: '⏰',
    color: '#DA70D6',
    questions: [
      { q: 'How many minutes in 2.5 hours?', options: ['120', '140', '150', '160'], correct: 2 },
      { q: 'Train leaves at 09:45, arrives 11:20. Journey time?', options: ['1h 25min', '1h 35min', '1h 45min', '2h 5min'], correct: 1 },
      { q: '3:30pm in 24hr format:', options: ['13:30', '15:30', '14:30', '03:30'], correct: 1 },
      { q: 'How many seconds in 5 minutes?', options: ['250', '300', '350', '500'], correct: 1 },
      { q: 'An event starts at 18:45 and lasts 2h 20min. When does it end?', options: ['20:45', '21:05', '21:15', '20:55'], correct: 1 },
    ],
    xpReward: 60,
  },
  'money-market': {
    title: 'Money Market',
    emoji: '💰',
    color: '#DA70D6',
    questions: [
      { q: 'Best value: 400g for £2.00 or 600g for £2.70?', options: ['400g', '600g', 'Equal', 'Cannot tell'], correct: 1 },
      { q: 'Item costs £18, reduced by 20%. New price?', options: ['£14', '£14.40', '£15', '£16'], correct: 1 },
      { q: 'Exchange rate: £1 = €1.15. Convert £40 to euros:', options: ['€40', '€44', '€46', '€48'], correct: 2 },
      { q: 'Buy 3 for £7.50. Cost of 5?', options: ['£10', '£12', '£12.50', '£15'], correct: 2 },
      { q: 'VAT is 20%. Item costs £60 before VAT. Total?', options: ['£68', '£72', '£78', '£80'], correct: 1 },
    ],
    xpReward: 50,
  },
}

const DEFAULT = {
  title: 'Mini Game',
  emoji: '🎮',
  color: '#FFD700',
  questions: [
    { q: 'What is 7 × 8?', options: ['48', '54', '56', '64'], correct: 2 },
    { q: 'What is the square root of 49?', options: ['6', '7', '8', '9'], correct: 1 },
    { q: 'What is 15% of 200?', options: ['20', '25', '30', '35'], correct: 2 },
    { q: 'What is 3² + 4²?', options: ['14', '25', '49', '7'], correct: 1 },
    { q: '3/4 as a decimal:', options: ['0.34', '0.7', '0.75', '0.8'], correct: 2 },
  ],
  xpReward: 40,
}

export default function GenericGame({ gameId, onComplete, onBack }) {
  const content = GAME_CONTENT[gameId] || DEFAULT
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('play') // 'play' | 'done'

  const q = content.questions[qIdx]

  const confirm = () => {
    if (selected === null) return
    setConfirmed(true)
    if (selected === q.correct) setScore(s => s + 1)
  }

  const next = () => {
    if (qIdx < content.questions.length - 1) {
      setQIdx(i => i + 1)
      setSelected(null)
      setConfirmed(false)
    } else {
      setPhase('done')
    }
  }

  const xpEarned = Math.round((score / content.questions.length) * content.xpReward)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
      padding: '20px 16px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '7px 14px',
            color: '#fff', cursor: 'pointer', fontSize: 13,
          }}>← Back</button>
          <span style={{ fontSize: 26 }}>{content.emoji}</span>
          <span style={{ color: content.color, fontWeight: 800, fontSize: 20, flex: 1 }}>{content.title}</span>
          <span style={{ color: '#FFD700', fontWeight: 700 }}>⭐ {score}/{content.questions.length}</span>
        </div>

        {phase === 'play' && (
          <>
            {/* Progress bar */}
            <div style={{
              height: 6, background: 'rgba(255,255,255,0.1)',
              borderRadius: 3, overflow: 'hidden', marginBottom: 28,
            }}>
              <div style={{
                height: '100%',
                width: `${((qIdx) / content.questions.length) * 100}%`,
                background: content.color,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* Question */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${content.color}30`,
              borderRadius: 20, padding: 28,
              marginBottom: 20,
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
                QUESTION {qIdx + 1} OF {content.questions.length}
              </div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1.4 }}>
                {q.q}
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {q.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.05)'
                let border = 'rgba(255,255,255,0.1)'
                let color = '#fff'
                if (confirmed) {
                  if (i === q.correct) { bg = 'rgba(0,255,127,0.15)'; border = 'rgba(0,255,127,0.5)'; color = '#00FF7F' }
                  else if (i === selected) { bg = 'rgba(255,80,80,0.15)'; border = 'rgba(255,80,80,0.5)'; color = '#FF6B6B' }
                } else if (i === selected) {
                  bg = `${content.color}20`; border = content.color
                }

                return (
                  <div
                    key={i}
                    onClick={() => !confirmed && setSelected(i)}
                    style={{
                      background: bg,
                      border: `2px solid ${border}`,
                      borderRadius: 14, padding: '14px 18px',
                      cursor: confirmed ? 'default' : 'pointer',
                      color, fontWeight: 600, fontSize: 16,
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <span style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, flexShrink: 0,
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {confirmed && i === q.correct && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    {confirmed && i === selected && i !== q.correct && <span style={{ marginLeft: 'auto' }}>✗</span>}
                  </div>
                )
              })}
            </div>

            <button
              onClick={confirmed ? next : confirm}
              disabled={selected === null && !confirmed}
              style={{
                width: '100%', padding: 16,
                background: (selected !== null || confirmed)
                  ? `linear-gradient(135deg, ${content.color}, ${content.color}bb)`
                  : 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: 14,
                color: (selected !== null || confirmed) ? '#000' : 'rgba(255,255,255,0.3)',
                fontWeight: 800, cursor: (selected !== null || confirmed) ? 'pointer' : 'not-allowed',
                fontSize: 16,
              }}
            >
              {confirmed
                ? (qIdx < content.questions.length - 1 ? 'Next Question →' : 'See Results 🏆')
                : 'Confirm Answer'}
            </button>
          </>
        )}

        {phase === 'done' && (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${content.color}40`,
            borderRadius: 24, padding: 40, textAlign: 'center',
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>{content.emoji}</div>
            <h2 style={{ color: content.color, fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
              {score === content.questions.length ? 'Perfect Score! 🌟' : 'Well Done!'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              {score}/{content.questions.length} correct
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
