import React, { useState, useCallback } from 'react'
import Setup from './components/Setup.jsx'
import Header from './components/Header.jsx'
import WorldMap from './components/WorldMap.jsx'
import WorldView from './components/WorldView.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import XPNotification from './components/XPNotification.jsx'
import PrimeSmash from './games/PrimeSmash.jsx'
import CipherCracker from './games/CipherCracker.jsx'
import RoomDesigner from './games/RoomDesigner.jsx'
import PatternDetective from './games/PatternDetective.jsx'
import LiarsChart from './games/LiarsChart.jsx'
import RecipeRescaler from './games/RecipeRescaler.jsx'
import GenericGame from './games/GenericGame.jsx'
import { useGameState } from './hooks/useGameState.js'
import { WORLDS } from './data/worlds.js'

const GAME_COMPONENTS = {
  'prime-smash': PrimeSmash,
  'cipher-cracker': CipherCracker,
  'room-designer': RoomDesigner,
  'pattern-detective': PatternDetective,
  'liars-chart': LiarsChart,
  'recipe-rescaler': RecipeRescaler,
}

export default function App() {
  const { state, addXP, setupPlayer, useHint, updateWorldProgress } = useGameState()
  const [screen, setScreen] = useState('map') // 'map' | 'world' | 'game'
  const [activeWorld, setActiveWorld] = useState(null)
  const [activeGame, setActiveGame] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [xpNotif, setXpNotif] = useState(null)

  const handleSelectWorld = useCallback((world) => {
    setActiveWorld(world)
    setScreen('world')
  }, [])

  const handlePlayGame = useCallback((game) => {
    setActiveGame(game)
    setScreen('game')
  }, [])

  const handleGameComplete = useCallback((xpAmount) => {
    if (xpAmount > 0 && activeGame) {
      addXP(xpAmount, activeGame.id)
      setXpNotif(xpAmount)

      // Update world progress
      if (activeWorld) {
        const world = WORLDS.find(w => w.id === activeWorld.id)
        if (world) {
          const completedCount = world.games.filter(g =>
            state.completedGames[g.id] || g.id === activeGame.id
          ).length
          const progress = Math.round((completedCount / world.games.length) * 100)
          updateWorldProgress(activeWorld.id, progress)
        }
      }
    }
    setScreen('world')
    setActiveGame(null)
  }, [activeGame, activeWorld, addXP, updateWorldProgress, state.completedGames])

  const handleBackToMap = useCallback(() => {
    setScreen('map')
    setActiveWorld(null)
  }, [])

  const handleBackToWorld = useCallback(() => {
    setScreen('world')
    setActiveGame(null)
  }, [])

  if (!state.setupComplete) {
    return <Setup onComplete={setupPlayer} />
  }

  const GameComponent = activeGame
    ? (GAME_COMPONENTS[activeGame.id] || GenericGame)
    : null

  return (
    <div style={{
      minHeight: '100vh',
      background: screen === 'map'
        ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
        : 'transparent',
      color: '#fff',
    }}>
      {/* Header — show on map and world screens */}
      {screen !== 'game' && (
        <Header
          state={state}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* Main screens */}
      {screen === 'map' && (
        <WorldMap state={state} onSelectWorld={handleSelectWorld} />
      )}

      {screen === 'world' && activeWorld && (
        <WorldView
          world={activeWorld}
          state={state}
          onPlayGame={handlePlayGame}
          onBack={handleBackToMap}
        />
      )}

      {screen === 'game' && activeGame && GameComponent && (
        <GameComponent
          gameId={activeGame.id}
          onComplete={handleGameComplete}
          onBack={handleBackToWorld}
          hintTokens={state.hintTokens}
          onUseHint={useHint}
        />
      )}

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <Leaderboard
          state={state}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* XP Notification */}
      {xpNotif !== null && (
        <XPNotification
          amount={xpNotif}
          onDone={() => setXpNotif(null)}
        />
      )}
    </div>
  )
}
