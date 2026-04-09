interface XpBarProps {
  xp: number;
  level: number;
}

function xpForLevel(level: number) {
  return level * (level + 1) * 50;
}

function xpForPrevLevel(level: number) {
  return level <= 1 ? 0 : (level - 1) * level * 50;
}

export function XpBar({ xp, level }: XpBarProps) {
  const prev = xpForPrevLevel(level);
  const next = xpForLevel(level);
  const pct = Math.min(100, ((xp - prev) / (next - prev)) * 100);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full bg-mq-purple text-white font-display text-lg shadow-lg"
        title={`Level ${level}`}
      >
        {level}
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{xp.toLocaleString()} XP</span>
          <span>Next: {next.toLocaleString()} XP</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mq-purple to-mq-teal rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
