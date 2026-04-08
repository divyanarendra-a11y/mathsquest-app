export const WORLDS = [
  {
    id: 'number-kingdom',
    name: 'Number Kingdom',
    emoji: '👑',
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accentColor: '#FFD700',
    description: 'Master primes, factors, fractions, decimals & percentages',
    topics: ['Prime Numbers', 'Factors & Multiples', 'Fractions', 'Decimals', 'Percentages'],
    unlockXP: 0,
    games: [
      { id: 'prime-smash', name: 'Prime Smash', emoji: '💥', description: 'Tap only the primes before they hit the ground!', xpReward: 50 },
      { id: 'fraction-frenzy', name: 'Fraction Frenzy', emoji: '🍕', description: 'Match equivalent fractions before time runs out!', xpReward: 40 },
      { id: 'decimal-dash', name: 'Decimal Dash', emoji: '🏃', description: 'Place decimals on the number line correctly!', xpReward: 35 },
    ]
  },
  {
    id: 'shape-realm',
    name: 'Shape Realm',
    emoji: '🔷',
    color: '#00CED1',
    bgGradient: 'linear-gradient(135deg, #0a3d62 0%, #1e3799 50%, #0c2461 100%)',
    accentColor: '#00CED1',
    description: 'Explore area, perimeter, angles & 2D/3D shapes',
    topics: ['Area', 'Perimeter', 'Angles', '2D Shapes', '3D Shapes'],
    unlockXP: 200,
    games: [
      { id: 'room-designer', name: 'Room Designer', emoji: '🏠', description: 'Calculate area & perimeter to fit furniture into rooms!', xpReward: 60 },
      { id: 'shadow-angle', name: 'Shadow Angle', emoji: '☀️', description: 'Drag the sun and calculate where the shadow falls!', xpReward: 55 },
      { id: 'angle-hunter', name: 'Angle Hunter', emoji: '📐', description: 'Identify and measure angles in real scenes!', xpReward: 40 },
    ]
  },
  {
    id: 'algebra-jungle',
    name: 'Algebra Jungle',
    emoji: '🌿',
    color: '#00FF7F',
    bgGradient: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #1b4332 100%)',
    accentColor: '#00FF7F',
    description: 'Crack expressions, equations, sequences & functions',
    topics: ['Expressions', 'Equations', 'Sequences', 'Functions', 'nth Term'],
    unlockXP: 450,
    games: [
      { id: 'cipher-cracker', name: 'Cipher Cracker', emoji: '🔐', description: 'Solve equations to decode secret messages!', xpReward: 70 },
      { id: 'pattern-detective', name: 'Pattern Detective', emoji: '🔍', description: 'Find the nth term rule, then verify your answer!', xpReward: 65 },
      { id: 'equation-balancer', name: 'Equation Balancer', emoji: '⚖️', description: 'Keep the scales balanced by solving for x!', xpReward: 50 },
    ]
  },
  {
    id: 'data-city',
    name: 'Data City',
    emoji: '📊',
    color: '#FF6B6B',
    bgGradient: 'linear-gradient(135deg, #2c0e37 0%, #4a0e8f 50%, #1a0533 100%)',
    accentColor: '#FF6B6B',
    description: 'Analyse mean, median, mode, charts & probability',
    topics: ['Mean', 'Median', 'Mode', 'Charts', 'Probability'],
    unlockXP: 750,
    games: [
      { id: 'liars-chart', name: "Liar's Chart", emoji: '🕵️', description: 'Spot the deliberately misleading graph — earn a detective badge!', xpReward: 75 },
      { id: 'average-attack', name: 'Average Attack', emoji: '📈', description: 'Calculate mean, median & mode under time pressure!', xpReward: 55 },
      { id: 'probability-lab', name: 'Probability Lab', emoji: '🎲', description: 'Run experiments and predict outcomes!', xpReward: 60 },
    ]
  },
  {
    id: 'ratio-ruins',
    name: 'Ratio Ruins',
    emoji: '⚗️',
    color: '#FF8C00',
    bgGradient: 'linear-gradient(135deg, #3d1008 0%, #7b2d00 50%, #3d0c02 100%)',
    accentColor: '#FF8C00',
    description: 'Master ratio, proportion, rates & scaling',
    topics: ['Ratio', 'Proportion', 'Rates', 'Scaling', 'Direct Proportion'],
    unlockXP: 1100,
    games: [
      { id: 'recipe-rescaler', name: 'Recipe Rescaler', emoji: '👨‍🍳', description: 'Scale a recipe from 4 to 17 servings to unlock dishes!', xpReward: 70 },
      { id: 'pixel-mixer', name: 'Pixel Mixer', emoji: '🎨', description: 'Mix paint colours in the correct ratio for new palettes!', xpReward: 65 },
      { id: 'ratio-road', name: 'Ratio Road', emoji: '🗺️', description: 'Use map scales to navigate the ruins!', xpReward: 50 },
    ]
  },
  {
    id: 'measure-maze',
    name: 'Measure Maze',
    emoji: '📏',
    color: '#DA70D6',
    bgGradient: 'linear-gradient(135deg, #1a0030 0%, #3d0066 50%, #1a0040 100%)',
    accentColor: '#DA70D6',
    description: 'Convert units, work with time, money & scale',
    topics: ['Units', 'Conversions', 'Time', 'Money', 'Scale'],
    unlockXP: 1500,
    games: [
      { id: 'unit-converter', name: 'Unit Converter', emoji: '🔄', description: 'Race to convert between units before the timer runs out!', xpReward: 55 },
      { id: 'time-traveller', name: 'Time Traveller', emoji: '⏰', description: 'Solve time puzzles across different time zones!', xpReward: 60 },
      { id: 'money-market', name: 'Money Market', emoji: '💰', description: 'Calculate best value deals in the market!', xpReward: 50 },
    ]
  }
]

export const XP_LEVELS = [
  { level: 1, xpRequired: 0, title: 'Apprentice', badge: '🌱' },
  { level: 2, xpRequired: 100, title: 'Explorer', badge: '⭐' },
  { level: 3, xpRequired: 250, title: 'Adventurer', badge: '🌟' },
  { level: 4, xpRequired: 500, title: 'Champion', badge: '💫' },
  { level: 5, xpRequired: 800, title: 'Hero', badge: '🏆' },
  { level: 6, xpRequired: 1200, title: 'Legend', badge: '👑' },
  { level: 7, xpRequired: 1700, title: 'Master', badge: '🔮' },
  { level: 8, xpRequired: 2300, title: 'Grandmaster', badge: '⚡' },
]

export function getLevelFromXP(xp) {
  let currentLevel = XP_LEVELS[0]
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.xpRequired) currentLevel = lvl
    else break
  }
  const nextLevel = XP_LEVELS.find(l => l.xpRequired > xp)
  return { current: currentLevel, next: nextLevel }
}
