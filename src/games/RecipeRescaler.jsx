import React, { useState } from 'react'

const RECIPES = [
  {
    name: 'Chocolate Chip Cookies',
    emoji: '🍪',
    originalServings: 4,
    targetServings: 17,
    ingredients: [
      { name: 'Flour', amount: 200, unit: 'g' },
      { name: 'Butter', amount: 100, unit: 'g' },
      { name: 'Sugar', amount: 80, unit: 'g' },
      { name: 'Eggs', amount: 2, unit: '' },
    ],
  },
  {
    name: 'Banana Smoothie',
    emoji: '🍌',
    originalServings: 2,
    targetServings: 9,
    ingredients: [
      { name: 'Banana', amount: 2, unit: '' },
      { name: 'Milk', amount: 300, unit: 'ml' },
      { name: 'Honey', amount: 20, unit: 'ml' },
      { name: 'Yoghurt', amount: 150, unit: 'g' },
    ],
  },
  {
    name: 'Pasta Sauce',
    emoji: '🍝',
    originalServings: 6,
    targetServings: 15,
    ingredients: [
      { name: 'Tomatoes', amount: 400, unit: 'g' },
      { name: 'Onions', amount: 3, unit: '' },
      { name: 'Olive Oil', amount: 60, unit: 'ml' },
      { name: 'Garlic', amount: 4, unit: 'cloves' },
    ],
  },
]

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

function simplify(n, d) {
  const g = gcd(Math.abs(n), Math.abs(d))
  return { n: n / g, d: d / g }
}

function formatAnswer(original, from, to) {
  const exact = (original * to) / from
  if (Number.isInteger(exact)) return { display: String(exact), value: exact }
  // round to 1dp
  return { display: (Math.round(exact * 10) / 10).toString(), value: Math.round(exact * 10) / 10 }
}

export default function RecipeRescaler({ onComplete, onBack }) {
  const [recipeIdx, setRecipeIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('scale') // 'scale' | 'result' | 'done'
  const [unlockedDish, setUnlockedDish] = useState(false)

  const recipe = RECIPES[recipeIdx]
  const ratio = recipe.targetServings / recipe.originalServings

  const correctAnswers = recipe.ingredients.map(ing => formatAnswer(ing.amount, recipe.originalServings, recipe.targetServings))

  const checkAll = () => {
    let correct = 0
    recipe.ingredients.forEach((ing, i) => {
      const userAns = parseFloat(answers[i])
      const ca = correctAnswers[i]
      if (!isNaN(userAns) && Math.abs(userAns - ca.value) < 0.15) correct++
    })
    const xp = Math.round((correct / recipe.ingredients.length) * 25)
    setScore(s => s + xp)
    setUnlockedDish(correct === recipe.ingredients.length)
    setChecked(true)
    setPhase('result')
  }

  const next = () => {
    if (recipeIdx < RECIPES.length - 1) {
      setRecipeIdx(i => i + 1)
      setAnswers({})
      setChecked(false)
      setPhase('scale')
      setUnlockedDish(false)
    } else {
      setPhase('done')
    }
  }

  const allFilled = recipe.ingredients.every((_, i) => answers[i] !== undefined && answers[i] !== '')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3d1008 0%, #7b2d00 100%)',
      padding: '20px 16px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
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
          <span style={{ fontSize: 28 }}>👨‍🍳</span>
          <span style={{ color: '#FF8C00', fontWeight: 800, fontSize: 20, flex: 1 }}>Recipe Rescaler</span>
          <span style={{ color: '#FFD700', fontWeight: 700 }}>⭐ {score} XP</span>
        </div>

        {phase !== 'done' && (
          <>
            {/* Recipe card */}
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,140,0,0.3)',
              borderRadius: 20, padding: 24,
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 52 }}>{recipe.emoji}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{recipe.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                    Original: <strong style={{ color: '#FF8C00' }}>{recipe.originalServings} servings</strong>
                    {' → '}
                    Target: <strong style={{ color: '#FFD700' }}>{recipe.targetServings} servings</strong>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
                    Multiplier: ×{ratio.toFixed(4).replace(/\.?0+$/, '')}
                    {' '}({recipe.targetServings}/{recipe.originalServings})
                  </div>
                </div>
              </div>

              {/* Ingredients table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.2fr 1fr 0.3fr',
                  gap: 8, color: 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: 700, letterSpacing: 1,
                  paddingBottom: 8,
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <span>INGREDIENT</span>
                  <span>ORIGINAL</span>
                  <span></span>
                  <span>FOR {recipe.targetServings}</span>
                  <span></span>
                </div>
                {recipe.ingredients.map((ing, i) => {
                  const ca = correctAnswers[i]
                  const userVal = parseFloat(answers[i])
                  const isCorrect = !isNaN(userVal) && Math.abs(userVal - ca.value) < 0.15

                  return (
                    <div key={ing.name} style={{
                      display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.2fr 1fr 0.3fr',
                      gap: 8, alignItems: 'center',
                    }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{ing.name}</span>
                      <span style={{ color: '#FF8C00', fontWeight: 700 }}>
                        {ing.amount}{ing.unit}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, textAlign: 'center' }}>→</span>
                      <input
                        type="number"
                        step="0.1"
                        value={answers[i] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                        disabled={checked}
                        placeholder="?"
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `2px solid ${checked
                            ? isCorrect ? 'rgba(0,255,127,0.5)' : 'rgba(255,100,100,0.5)'
                            : 'rgba(255,140,0,0.3)'}`,
                          background: checked
                            ? isCorrect ? 'rgba(0,255,127,0.1)' : 'rgba(255,100,100,0.1)'
                            : 'rgba(255,255,255,0.07)',
                          color: '#fff', fontSize: 16, fontWeight: 700,
                          outline: 'none', textAlign: 'center', width: '100%',
                        }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{ing.unit}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Result summary */}
            {checked && (
              <div style={{
                background: unlockedDish ? 'rgba(0,255,127,0.08)' : 'rgba(255,100,100,0.08)',
                border: `1px solid ${unlockedDish ? 'rgba(0,255,127,0.3)' : 'rgba(255,100,100,0.3)'}`,
                borderRadius: 16, padding: 20, marginBottom: 16,
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>
                  {unlockedDish ? '🍽️' : '⚠️'}
                </div>
                <div style={{
                  color: unlockedDish ? '#00FF7F' : '#FF6B6B',
                  fontWeight: 800, fontSize: 18, marginBottom: 8,
                }}>
                  {unlockedDish ? `Dish Unlocked: ${recipe.name}!` : 'Not quite — check the answers below:'}
                </div>
                {!unlockedDish && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Correct answers:{' '}
                    {recipe.ingredients.map((ing, i) => `${ing.name}: ${correctAnswers[i].display}${ing.unit}`).join(', ')}
                  </div>
                )}
              </div>
            )}

            {!checked && (
              <button
                onClick={checkAll}
                disabled={!allFilled}
                style={{
                  width: '100%', padding: 16,
                  background: allFilled ? 'linear-gradient(135deg, #FF8C00, #CC6600)' : 'rgba(255,255,255,0.1)',
                  border: 'none', borderRadius: 14,
                  color: allFilled ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontWeight: 800, cursor: allFilled ? 'pointer' : 'not-allowed',
                  fontSize: 16, marginBottom: 16,
                }}
              >
                Check Recipe 🍳
              </button>
            )}

            {checked && (
              <button
                onClick={next}
                style={{
                  width: '100%', padding: 16,
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  border: 'none', borderRadius: 14,
                  color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: 16,
                }}
              >
                {recipeIdx < RECIPES.length - 1 ? 'Next Recipe →' : 'Finish! 🏆'}
              </button>
            )}

            {/* Progress */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              {RECIPES.map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i < recipeIdx ? '#00FF7F' : i === recipeIdx ? '#FF8C00' : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
          </>
        )}

        {phase === 'done' && (
          <div style={{
            maxWidth: 400, margin: '40px auto',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,140,0,0.3)',
            borderRadius: 24, padding: 40, textAlign: 'center',
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>👨‍🍳</div>
            <h2 style={{ color: '#FF8C00', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
              Master Chef!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              You scaled {RECIPES.length} recipes perfectly!
            </p>
            <div style={{
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 16, padding: 20, marginBottom: 24,
            }}>
              <div style={{ color: '#FFD700', fontSize: 40, fontWeight: 900 }}>+{Math.min(70, score)} XP</div>
            </div>
            <button
              onClick={() => onComplete(Math.min(70, score))}
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
