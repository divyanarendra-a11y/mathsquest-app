import React, { useEffect, useState } from 'react'

export default function XPNotification({ amount, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', top: 80, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
      opacity: visible ? 1 : 0,
      transition: 'all 0.4s ease',
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderRadius: 20,
      padding: '16px 32px',
      color: '#000',
      fontWeight: 900,
      fontSize: 24,
      boxShadow: '0 8px 32px rgba(255,215,0,0.5)',
      zIndex: 300,
      textAlign: 'center',
      pointerEvents: 'none',
    }}>
      ⭐ +{amount} XP!
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Keep it up!</div>
    </div>
  )
}
