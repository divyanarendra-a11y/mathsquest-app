import { useState, useCallback } from 'react'

const INITIAL_STATE = {
  playerName: '',
  xp: 0,
  streak: 0,
  hintTokens: 3,
  lastLoginDate: null,
  completedGames: {},   // { gameId: bestScore }
  worldProgress: {},    // { worldId: percentage 0-100 }
  setupComplete: false,
  leaderboard: [
    { name: 'Alex M.', xp: 1240, streak: 7 },
    { name: 'Priya K.', xp: 1180, streak: 5 },
    { name: 'Jamie L.', xp: 980, streak: 3 },
    { name: 'Sam T.', xp: 850, streak: 12 },
    { name: 'Zara O.', xp: 720, streak: 2 },
  ]
}

function loadState() {
  try {
    const saved = localStorage.getItem('mathsquest-state')
    if (saved) return { ...INITIAL_STATE, ...JSON.parse(saved) }
  } catch (e) { /* ignore */ }
  return INITIAL_STATE
}

function saveState(state) {
  try {
    localStorage.setItem('mathsquest-state', JSON.stringify(state))
  } catch (e) { /* ignore */ }
}

export function useGameState() {
  const [state, setState] = useState(loadState)

  const update = useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveState(next)
      return next
    })
  }, [])

  const addXP = useCallback((amount, gameId) => {
    update(prev => {
      const today = new Date().toDateString()
      const isNewDay = prev.lastLoginDate !== today
      const streakBonus = prev.streak >= 3 ? Math.floor(amount * 0.25) : 0
      const totalXP = amount + streakBonus

      const newCompleted = { ...prev.completedGames }
      if (!newCompleted[gameId] || newCompleted[gameId] < amount) {
        newCompleted[gameId] = amount
      }

      return {
        ...prev,
        xp: prev.xp + totalXP,
        completedGames: newCompleted,
        streak: isNewDay ? prev.streak + 1 : prev.streak,
        lastLoginDate: today,
        hintTokens: isNewDay ? prev.hintTokens + 1 : prev.hintTokens,
      }
    })
  }, [update])

  const setupPlayer = useCallback((name) => {
    update({
      playerName: name,
      setupComplete: true,
      lastLoginDate: new Date().toDateString(),
    })
  }, [update])

  const useHint = useCallback(() => {
    update(prev => ({
      ...prev,
      hintTokens: Math.max(0, prev.hintTokens - 1)
    }))
  }, [update])

  const updateWorldProgress = useCallback((worldId, progress) => {
    update(prev => ({
      ...prev,
      worldProgress: {
        ...prev.worldProgress,
        [worldId]: Math.max(prev.worldProgress[worldId] || 0, progress)
      }
    }))
  }, [update])

  return { state, addXP, setupPlayer, useHint, updateWorldProgress }
}
