import React from 'react'
import { getLevelFromXP } from '../data/worlds.js'

export default function Leaderboard({ state, onClose }) {
  const allPlayers = [
    ...state.leaderboard,
    { name: state.playerName + ' (you)', xp: state.xp, streak: state.streak, isYou: true }
  ].sort((a, b) => b.xp - a.xp)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255,215,0,0.25)',
        borderRadius: 24,
        padding: '32px',
        maxWidth: 480,
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
              WEEKLY RESET
            </div>
            <h2 style={{ color: '#FFD700', fontSize: 24, fontWeight: 900 }}>
              🏆 Class Rankings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, width: 36, height: 36,
              color: '#fff', fontSize: 18, cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Players list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allPlayers.map((player, index) => {
            const { current } = getLevelFromXP(player.xp)
            return (
              <div
                key={player.name}
                style={{
                  background: player.isYou
                    ? 'rgba(255,215,0,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${player.isYou ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: index < 3 ? 24 : 15,
                  fontWeight: 800,
                  color: index < 3 ? 'inherit' : 'rgba(255,255,255,0.3)',
                }}>
                  {index < 3 ? medals[index] : `#${index + 1}`}
                </div>

                {/* Level badge */}
                <span style={{ fontSize: 22 }}>{current.badge}</span>

                {/* Name & level */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: player.isYou ? '#FFD700' : '#fff',
                    fontWeight: 700, fontSize: 15,
                  }}>
                    {player.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    Lv.{current.level} {current.title}
                  </div>
                </div>

                {/* Streak */}
                {player.streak > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: '#FF6B35', fontSize: 13, fontWeight: 700,
                  }}>
                    🔥 {player.streak}
                  </div>
                )}

                {/* XP */}
                <div style={{
                  color: '#FFD700', fontWeight: 800, fontSize: 15,
                  textAlign: 'right',
                }}>
                  {player.xp.toLocaleString()}
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 400 }}>XP</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 20,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          color: 'rgba(255,255,255,0.35)',
          fontSize: 12,
          textAlign: 'center',
        }}>
          Leaderboard resets every Monday at midnight 🔄
        </div>
      </div>
    </div>
  )
}
