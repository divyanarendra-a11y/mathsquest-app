import React from 'react'

function GameCard({ game, world, isCompleted, bestScore, onPlay }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${world.color}30`,
      borderRadius: 18,
      padding: 22,
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.borderColor = world.color + '80'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.borderColor = world.color + '30'
        e.currentTarget.style.transform = 'none'
      }}
      onClick={() => onPlay(game)}
    >
      {isCompleted && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,255,127,0.15)',
          border: '1px solid rgba(0,255,127,0.3)',
          borderRadius: 12, padding: '3px 10px',
          color: '#00FF7F', fontSize: 11, fontWeight: 700,
        }}>
          ✓ {bestScore} XP
        </div>
      )}
      <div style={{ fontSize: 40, marginBottom: 10 }}>{game.emoji}</div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{game.name}</div>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.4, marginBottom: 14 }}>
        {game.description}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          background: world.color + '20',
          color: world.color,
          border: `1px solid ${world.color}40`,
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 700,
        }}>
          ⭐ +{game.xpReward} XP
        </span>
        <span style={{
          color: world.color, fontSize: 13, fontWeight: 700,
        }}>
          Play →
        </span>
      </div>
    </div>
  )
}

export default function WorldView({ world, state, onPlayGame, onBack }) {
  const completedCount = world.games.filter(g => state.completedGames[g.id]).length
  const progress = Math.round((completedCount / world.games.length) * 100)

  return (
    <div style={{
      minHeight: '100vh',
      background: world.bgGradient,
      padding: '32px 24px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, padding: '8px 16px',
            color: '#fff', fontSize: 14, cursor: 'pointer',
            marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          ← World Map
        </button>

        {/* World header */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${world.color}40`,
          borderRadius: 24,
          padding: '32px 36px',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 72 }}>{world.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: world.color, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
                WORLD
              </div>
              <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
                {world.name}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>{world.description}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90,
                borderRadius: '50%',
                background: `conic-gradient(${world.color} ${progress * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{
                  width: 70, height: 70, borderRadius: '50%',
                  background: '#0f0c29',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <span style={{ color: world.color, fontWeight: 900, fontSize: 20 }}>{progress}%</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>done</span>
                </div>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {world.topics.map(t => (
              <span key={t} style={{
                background: world.color + '15',
                border: `1px solid ${world.color}35`,
                borderRadius: 20,
                padding: '5px 14px',
                color: world.color,
                fontSize: 13,
                fontWeight: 600,
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Games */}
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
          🎮 Mini-Games & Puzzles
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {world.games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              world={world}
              isCompleted={!!state.completedGames[game.id]}
              bestScore={state.completedGames[game.id]}
              onPlay={onPlayGame}
            />
          ))}
        </div>

        {/* Completion notice */}
        {completedCount === world.games.length && (
          <div style={{
            marginTop: 24,
            background: 'rgba(0,255,127,0.1)',
            border: '1px solid rgba(0,255,127,0.3)',
            borderRadius: 16, padding: '20px 24px',
            textAlign: 'center',
            color: '#00FF7F', fontWeight: 700, fontSize: 18,
          }}>
            🏆 All games completed! Next world unlocked!
          </div>
        )}
      </div>
    </div>
  )
}
