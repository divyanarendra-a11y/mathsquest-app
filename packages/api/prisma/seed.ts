import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const worlds = [
  {
    slug: 'number-kingdom',
    name: 'Number Kingdom',
    description: 'Master rounding, BIDMAS, primes, HCF/LCM and more!',
    curriculumUnit: 'Unit 1',
    orderIndex: 1,
    color: '#FF6B6B',
    iconEmoji: '👑',
  },
  {
    slug: 'shape-realm',
    name: 'Shape Realm',
    description: 'Explore area, perimeter, volume, angles and symmetry!',
    curriculumUnit: 'Unit 2',
    orderIndex: 2,
    color: '#4ECDC4',
    iconEmoji: '📐',
  },
  {
    slug: 'fractions-fortress',
    name: 'Fractions Fortress',
    description: 'Conquer fractions, decimals and directed numbers!',
    curriculumUnit: 'Unit 3',
    orderIndex: 3,
    color: '#45B7D1',
    iconEmoji: '🏰',
  },
  {
    slug: 'algebra-jungle',
    name: 'Algebra Jungle',
    description: 'Tame expressions, equations and function machines!',
    curriculumUnit: 'Units 4 & 8',
    orderIndex: 4,
    color: '#96CEB4',
    iconEmoji: '🌿',
  },
  {
    slug: 'ratio-ruins',
    name: 'Ratio Ruins',
    description: 'Uncover ratio, proportion and percentages!',
    curriculumUnit: 'Unit 5',
    orderIndex: 5,
    color: '#FFEAA7',
    iconEmoji: '🏛️',
  },
  {
    slug: 'graph-galaxy',
    name: 'Graph Galaxy',
    description: 'Navigate coordinates, sequences and transformations!',
    curriculumUnit: 'Unit 6',
    orderIndex: 6,
    color: '#DDA0DD',
    iconEmoji: '🌌',
  },
  {
    slug: 'data-city',
    name: 'Data City',
    description: 'Analyse charts, probability and Venn diagrams!',
    curriculumUnit: 'Unit 7',
    orderIndex: 7,
    color: '#F0E68C',
    iconEmoji: '🏙️',
  },
];

const puzzlesByWorld: Record<string, Array<{ slug: string; name: string; description: string; type: string; orderIndex: number }>> = {
  'number-kingdom': [
    { slug: 'prime-smash', name: 'Prime Smash', description: 'Tap only the prime numbers before they hit the ground!', type: 'phaser', orderIndex: 1 },
    { slug: 'bidmas-blitz', name: 'BIDMAS Blitz', description: 'Solve order-of-operations problems at speed!', type: 'quiz', orderIndex: 2 },
    { slug: 'hcf-lcm-lab', name: 'HCF/LCM Lab', description: 'Find highest common factors and lowest common multiples!', type: 'quiz', orderIndex: 3 },
  ],
  'algebra-jungle': [
    { slug: 'robot-factory', name: 'Robot Factory', description: 'Balance equations to power the assembly line!', type: 'phaser', orderIndex: 1 },
    { slug: 'expression-explorer', name: 'Expression Explorer', description: 'Expand and factorise brackets in the jungle!', type: 'quiz', orderIndex: 2 },
  ],
  'ratio-ruins': [
    { slug: 'recipe-rescaler', name: 'Recipe Rescaler', description: 'Scale the recipe to feed the right number of people!', type: 'phaser', orderIndex: 1 },
    { slug: 'percentage-path', name: 'Percentage Path', description: 'Navigate percentage increase and decrease challenges!', type: 'quiz', orderIndex: 2 },
  ],
  'shape-realm': [
    { slug: 'area-architect', name: 'Area Architect', description: 'Calculate areas and perimeters to build structures!', type: 'quiz', orderIndex: 1 },
    { slug: 'angle-avenger', name: 'Angle Avenger', description: 'Find missing angles to defeat enemies!', type: 'quiz', orderIndex: 2 },
  ],
  'fractions-fortress': [
    { slug: 'fraction-siege', name: 'Fraction Siege', description: 'Add, subtract, multiply and divide fractions to breach the fortress!', type: 'quiz', orderIndex: 1 },
    { slug: 'decimal-dungeon', name: 'Decimal Dungeon', description: 'Round decimals to escape the dungeon!', type: 'quiz', orderIndex: 2 },
  ],
  'graph-galaxy': [
    { slug: 'coordinate-captain', name: 'Coordinate Captain', description: 'Plot coordinates to navigate the galaxy!', type: 'quiz', orderIndex: 1 },
    { slug: 'sequence-satellite', name: 'Sequence Satellite', description: 'Find nth terms to power the satellite!', type: 'quiz', orderIndex: 2 },
  ],
  'data-city': [
    { slug: 'probability-plaza', name: 'Probability Plaza', description: 'Calculate probabilities to win city contracts!', type: 'quiz', orderIndex: 1 },
    { slug: 'venn-venture', name: 'Venn Venture', description: 'Fill Venn diagrams to expand the city!', type: 'quiz', orderIndex: 2 },
  ],
};

async function main() {
  console.log('Seeding worlds and puzzles...');

  for (const worldData of worlds) {
    const world = await prisma.world.upsert({
      where: { slug: worldData.slug },
      update: worldData,
      create: worldData,
    });

    const puzzles = puzzlesByWorld[worldData.slug] ?? [];
    for (const puzzleData of puzzles) {
      await prisma.puzzle.upsert({
        where: { slug: puzzleData.slug },
        update: { ...puzzleData, worldId: world.id },
        create: { ...puzzleData, worldId: world.id },
      });
    }

    console.log(`  Seeded world: ${world.name} with ${puzzles.length} puzzles`);
  }

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
