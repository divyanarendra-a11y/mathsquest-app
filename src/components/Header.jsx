import React from 'react'
import { getLevelFromXP } from '../data/worlds.js'

export default function Header({ state, onShowLeaderboard }) {
  const { current, next } = getLevelFromXP(state.xp)
  const progressToNext = next
    ? ((state.xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100
    : 100

  return (
    <header style={{
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <span style={{ fontSize: 28 }}>🗺️</span>
        <span style={{ color: '#FFD700', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px' }}>
          MathsQuest
        </span>
      </div>

      {/* Player info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12, padding: '8px 14px',
      }}>
        <span style={{ fontSize: 22 }}>{current.badge}</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>
            {state.playerName}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            Lv.{current.level} {current.title}
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ flex: 1, maxWidth: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#FFD700', fontSize: 13, fontWeight: 700 }}>
            ⭐ {state.xp.toLocaleString()} XP
          </span>
          {next && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {next.xpRequired - state.xp} to Lv.{next.level}
            </span>
          )}
        </div>
        <div style={{
          height: 6, background: 'rgba(255,255,255,0.1)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressToNext}%`,
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Streak */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: state.streak >= 3 ? 'rgba(255,100,0,0.2)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${state.streak >= 3 ? 'rgba(255,100,0,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 10, padding: '6px 12px',
      }}>
        <span style={{ fontSize: 18 }}>🔥</span>
        <div>
          <div style={{ color: state.streak >= 3 ? '#FF6B35' : '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>
            {state.streak}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>day streak</div>
        </div>
      </div>

      {/* Hint tokens */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(100,200,255,0.1)',
        border: '1px solid rgba(100,200,255,0.2)',
        borderRadius: 10, padding: '6px 12px',
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div>
          <div style={{ color: '#64C8FF', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>
            {state.hintTokens}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>hints</div>
        </div>
      </div>

      {/* Leaderboard button */}
      <button
        onClick={onShowLeaderboard}
        style={{
          background: 'rgba(255,215,0,0.1)',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 10, padding: '8px 14px',
          color: '#FFD700', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,215,0,0.1)'}
      >
        🏆 Rankings
      </button>
    </header>
  )
}
