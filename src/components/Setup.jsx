import React, { useState } from 'react'

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: '48px 40px',
    maxWidth: 480,
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
    display: 'block',
  },
  title: {
    fontSize: 36,
    fontWeight: 900,
    color: '#FFD700',
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 1.5,
  },
  label: {
    display: 'block',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 12,
    border: '2px solid rgba(255,215,0,0.3)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 18,
    outline: 'none',
    marginBottom: 24,
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '16px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
  },
  features: {
    marginTop: 28,
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  feature: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '6px 14px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  }
}

export default function Setup({ onComplete }) {
  const [name, setName] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim().length >= 2) onComplete(name.trim())
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <span style={styles.logo}>🗺️</span>
        <div style={styles.title}>MathsQuest</div>
        <div style={styles.subtitle}>
          6 magical worlds. Epic puzzles. Legendary maths skills.<br />
          Your adventure starts here.
        </div>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>What's your name, adventurer?</label>
          <input
            style={{
              ...styles.input,
              borderColor: focused ? 'rgba(255,215,0,0.8)' : 'rgba(255,215,0,0.3)'
            }}
            type="text"
            placeholder="Enter your name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
            maxLength={20}
          />
          <button
            style={{
              ...styles.btn,
              opacity: name.trim().length >= 2 ? 1 : 0.5,
              transform: name.trim().length >= 2 ? 'none' : 'none',
            }}
            type="submit"
            disabled={name.trim().length < 2}
            onMouseEnter={e => { if (name.trim().length >= 2) e.target.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => e.target.style.transform = 'none'}
          >
            Begin Quest ⚔️
          </button>
        </form>
        <div style={styles.features}>
          <span style={styles.feature}>🏆 XP & Levels</span>
          <span style={styles.feature}>🔥 Daily Streaks</span>
          <span style={styles.feature}>💡 Hint Tokens</span>
          <span style={styles.feature}>📊 Leaderboard</span>
        </div>
      </div>
    </div>
  )
}
