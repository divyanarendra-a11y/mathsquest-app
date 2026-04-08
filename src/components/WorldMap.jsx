import React from 'react'
import { WORLDS } from '../data/worlds.js'

function WorldCard({ world, index, isUnlocked, progress, onSelect }) {
  const isLocked = !isUnlocked

  return (
    <div
      onClick={() => !isLocked && onSelect(world)}
      style={{
        position: 'relative',
        background: isLocked
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(255,255,255,0.07)',
        border: `2px solid ${isLocked ? 'rgba(255,255,255,0.1)' : world.color + '50'}`,
        borderRadius: 20,
        padding: 24,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!isLocked) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
          e.currentTarget.style.boxShadow = `0 20px 40px ${world.color}30`
          e.currentTarget.style.borderColor = world.color
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = isLocked ? 'rgba(255,255,255,0.1)' : world.color + '50'
      }}
    >
      {/* Glow bg */}
      {!isLocked && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120,
          background: world.color,
          borderRadius: '50%',
          opacity: 0.06,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Lock overlay */}
      {isLocked && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 18,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          zIndex: 5,
        }}>
          <span style={{ fontSize: 36 }}>🔒</span>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            Requires {world.unlockXP.toLocaleString()} XP
          </div>
        </div>
      )}

      {/* World number badge */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        background: isLocked ? 'rgba(255,255,255,0.1)' : world.color + '25',
        border: `1px solid ${isLocked ? 'rgba(255,255,255,0.15)' : world.color + '60'}`,
        borderRadius: 20,
        padding: '3px 10px',
        fontSize: 12, fontWeight: 700,
        color: isLocked ? 'rgba(255,255,255,0.4)' : world.color,
      }}>
        World {index + 1}
      </div>

      {/* Emoji & name */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 48, marginBottom: 8, lineHeight: 1 }}>{world.emoji}</div>
        <div style={{
          fontSize: 20, fontWeight: 800,
          color: isLocked ? 'rgba(255,255,255,0.3)' : '#fff',
          marginBottom: 6,
        }}>
          {world.name}
        </div>
        <div style={{
          fontSize: 13,
          color: isLocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
          lineHeight: 1.4,
        }}>
          {world.description}
        </div>
      </div>

      {/* Topics */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {world.topics.map(t => (
          <span key={t} style={{
            background: isLocked ? 'rgba(255,255,255,0.05)' : world.color + '15',
            border: `1px solid ${isLocked ? 'rgba(255,255,255,0.08)' : world.color + '30'}`,
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            color: isLocked ? 'rgba(255,255,255,0.25)' : world.color,
            fontWeight: 600,
          }}>
            {t}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>PROGRESS</span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: progress >= 80 ? '#00FF7F' : isLocked ? 'rgba(255,255,255,0.2)' : world.color
          }}>
            {progress}%
            {progress >= 80 && ' ✓'}
          </span>
        </div>
        <div style={{
          height: 6, background: 'rgba(255,255,255,0.08)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress >= 80
              ? 'linear-gradient(90deg, #00FF7F, #00CC66)'
              : `linear-gradient(90deg, ${world.color}, ${world.color}aa)`,
            borderRadius: 3,
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* Games count */}
      <div style={{
        marginTop: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>🎮</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          {world.games.length} mini-games
        </span>
        {!isLocked && progress < 80 && (
          <span style={{
            marginLeft: 'auto',
            color: world.color, fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            Enter World →
          </span>
        )}
        {!isLocked && progress >= 80 && (
          <span style={{
            marginLeft: 'auto',
            color: '#00FF7F', fontSize: 12, fontWeight: 700,
          }}>
            Completed! 🏆
          </span>
        )}
      </div>
    </div>
  )
}

export default function WorldMap({ state, onSelectWorld }) {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Map header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>
          WORLD MAP
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 900, color: '#fff',
          textShadow: '0 0 30px rgba(255,215,0,0.3)',
          marginBottom: 12,
        }}>
          Choose Your World
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
          Complete 80% of a world to unlock the next zone. No dead ends.
        </p>
      </div>

      {/* Path connector hint */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, marginBottom: 32,
        color: 'rgba(255,255,255,0.3)', fontSize: 13,
      }}>
        {WORLDS.map((w, i) => (
          <React.Fragment key={w.id}>
            <span style={{
              fontSize: 20,
              opacity: state.xp >= w.unlockXP ? 1 : 0.3,
            }}>{w.emoji}</span>
            {i < WORLDS.length - 1 && (
              <span style={{ fontSize: 16 }}>
                {state.xp >= WORLDS[i + 1].unlockXP ? '✦' : '···'}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* World grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
      }}>
        {WORLDS.map((world, index) => (
          <WorldCard
            key={world.id}
            world={world}
            index={index}
            isUnlocked={state.xp >= world.unlockXP}
            progress={state.worldProgress[world.id] || 0}
            onSelect={onSelectWorld}
          />
        ))}
      </div>
    </div>
  )
}
